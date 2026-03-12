---
title: "1편: n8n 기반 AI Agent Builder 설계와 구현"
description: n8n을 워크플로우 엔진으로 활용하되, 사용자가 n8n을 몰라도 Agent를 생성하고 실행할 수 있는 추상화 레이어 PoC
---

## 왜 만들었나

조직 내에서 LLM 기반 Agent를 활용하려는 수요가 늘고 있지만, 실제로 Agent를 만들고 운영하려면 다음과 같은 장벽이 있다:

- **워크플로우 엔진의 복잡도**: n8n, LangChain 등은 강력하지만 학습 곡선이 높음
- **반복적 보일러플레이트**: Prompt 구성, Tool 연결, 실행 파이프라인이 프로젝트마다 중복
- **운영 가시성 부족**: 실행 이력, 에러 추적, 비용 관리가 체계적이지 않음

이 PoC의 핵심 질문은 단순했다:

> **"n8n을 엔진으로 쓰되, 사용자는 n8n을 몰라도 Agent를 만들고 실행할 수 있을까?"**

---

## 아키텍처

### 전체 구조

```
┌─────────────────────────────────────────────────────────────────┐
│                     Builder UI (Next.js 16)                     │
│  Agent List │ Agent Form │ Tool Selector │ Execution Panel      │
└──────────────────────────┬──────────────────────────────────────┘
                           │ REST API (/api/v1)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Backend API (NestJS)                         │
│                                                                 │
│  ┌─ Interface ────────────────────────────────────────────┐     │
│  │ AgentController  ToolController  ExecutionController   │     │
│  └────────────────────────────────────────────────────────┘     │
│  ┌─ Domain ───────────────────────────────────────────────┐     │
│  │ AgentService     ToolService     ExecutionService      │     │
│  │ (IAgentRepo)     (IToolRepo)     (IExecutionRepo)      │     │
│  └────────────────────────────────────────────────────────┘     │
│  ┌─ Infrastructure ──────────────────────────────────────┐      │
│  │ TypeORM Adapters    N8nIntegrationService              │      │
│  └────────────────────────────────────────────────────────┘     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────┬──────────────────────────────────────┐
│  PostgreSQL 16           │  n8n 1.94.1                          │
│  (Agent, Tool,           │  (AI Agent Node + Webhook)           │
│   Execution 저장)        │  → Gemini 2.5 Flash                  │
└──────────────────────────┴──────────────────────────────────────┘
```

### 왜 n8n인가?

| 고려사항 | n8n | LangChain/LangGraph | 자체 구현 |
|---------|-----|---------------------|----------|
| Workflow 시각화 | ✅ 내장 | ❌ | ❌ |
| AI Agent 노드 | ✅ 내장 | ✅ | 직접 구현 |
| Tool 연동 (Slack, HTTP 등) | ✅ 400+ | SDK 기반 | 직접 구현 |
| Self-hosted | ✅ | ✅ | ✅ |
| REST API | ✅ | ❌ | 직접 구현 |
| 학습 곡선 (사용자) | 높음 | 매우 높음 | 낮음 |

n8n을 선택한 핵심 이유는 **REST API로 Workflow를 프로그래밍 방식으로 제어**할 수 있다는 점이다. 사용자에게는 n8n을 노출하지 않으면서, 백엔드에서 n8n API를 통해 Workflow를 자동 생성/배포/실행할 수 있다.

### Layered Architecture

Domain-Driven Design의 Layered Architecture 패턴을 적용했다:

```
Interface Layer (Controllers)
    ↓ DTO
Domain Layer (Services + Port Interfaces)
    ↓ Port
Infrastructure Layer (Adapters: TypeORM, n8n Client)
```

- **Domain**: 비즈니스 로직과 Port(인터페이스) 정의
- **Infrastructure**: Port 구현체 (Adapter)
- **Module**: NestJS DI 컨테이너에서 Port와 Adapter를 바인딩

```typescript
// Domain — Port 정의
export interface IAgentRepository {
  findAll(filter?: AgentFilter): Promise<PaginatedResult<Agent>>;
  findById(id: string): Promise<Agent | null>;
  create(data: CreateAgentDto): Promise<Agent>;
}

// Infrastructure — Adapter 구현
@Injectable()
export class AgentRepositoryImpl implements IAgentRepository {
  constructor(
    @InjectRepository(AgentEntity)
    private readonly repo: Repository<AgentEntity>,
  ) {}
  // ...
}

// Module — DI 바인딩
@Module({
  providers: [
    AgentService,
    { provide: 'IAgentRepository', useClass: AgentRepositoryImpl },
  ],
})
export class AgentModule {}
```

---

## 핵심 설계

### Agent 추상화

Agent는 다음 3가지 요소의 조합으로 정의된다:

| 요소 | 설명 | 예시 |
|------|------|------|
| **Prompt** | 시스템 프롬프트 + 변수 템플릿 | `"당신은 {{role}}입니다"` |
| **Tool** | Agent가 사용할 수 있는 도구 | HTTP Request, Slack, Calculator |
| **Config** | 모델 설정 | model, temperature, maxTokens |

이 추상화의 핵심은 **사용자가 n8n Workflow를 전혀 신경 쓰지 않아도 된다**는 것이다.

### Workflow 자동 생성

Agent를 배포하면, 백엔드가 자동으로 n8n Workflow를 생성한다:

```
[Webhook Trigger] → [AI Agent Node] → [Respond to Webhook]
                         ↓
                    [Tool Nodes...]
```

Workflow Template을 코드로 정의하고, Agent의 설정(Prompt, Tool, Model)에 따라 동적으로 노드를 구성한다:

```typescript
function buildAgentWorkflow(agent: Agent): N8nWorkflow {
  return {
    name: `agent-${agent.id}`,
    nodes: [
      webhookTriggerNode(),
      aiAgentNode({
        systemPrompt: agent.systemPrompt,
        model: agent.modelConfig.model,
        temperature: agent.modelConfig.temperature,
      }),
      ...agent.tools.map(tool => toolNode(tool)),
      respondNode(),
    ],
    connections: buildConnections(agent.tools),
  };
}
```

### 실행 파이프라인

Agent 실행은 5단계 파이프라인으로 구성된다:

```
1. Validate  → Agent 상태 확인 (active?)
2. Render    → Prompt 변수 치환
3. Deploy    → n8n Workflow 생성/활성화
4. Execute   → Webhook 호출 → n8n → LLM
5. Save      → 실행 결과 + 로그 DB 저장
```

---

## 기술 스택

| Layer | Technology | 선택 이유 |
|-------|-----------|----------|
| Frontend | Next.js 16 | App Router, Server Components |
| Backend | NestJS | DI, Module 시스템, TypeORM 통합 |
| Database | PostgreSQL 16 | JSON 컬럼 활용 (modelConfig, tools) |
| Workflow | n8n 1.94.1 | REST API, AI Agent 노드, Self-hosted |
| LLM | Gemini 2.5 Flash | Free Tier, 빠른 응답 속도 |
| Monorepo | pnpm workspace | shared 패키지 공유 |

### 프로젝트 구조 (pnpm Monorepo)

```
n8n-poc/
├── apps/
│   ├── api/              # NestJS Backend (Port 3001)
│   └── web/              # Next.js Frontend (Port 3000)
├── packages/
│   ├── shared/           # 공유 타입, DTO, 유틸리티
│   └── n8n-client/       # n8n REST API 클라이언트
└── docker/
    └── docker-compose.yml  # PostgreSQL + n8n
```

---

## 구현 하이라이트

### Phase별 구현

| Phase | 기능 | 핵심 구현 |
|-------|------|----------|
| 0 | Scaffold | pnpm monorepo, NestJS + Next.js 동시 기동 |
| 1 | Agent 관리 | CRUD API, status 상태 머신 (draft → active → inactive) |
| 2 | Prompt 관리 | `{{variable}}` 파싱/렌더링, PromptEditor 컴포넌트 |
| 3 | Tool 관리 | 8개 Built-in Tool seed, Agent-Tool ManyToMany 관계 |
| 4 | 실행 | 5단계 파이프라인, ExecutionPanel (채팅 UI) |
| 5 | 로깅 | Step-level 로그, sensitive data 자동 마스킹 |
| 6 | n8n 연동 | N8nClient, Workflow Template, Webhook 실행 |

### n8n 연동에서 배운 것

n8n을 API로 제어하면서 몇 가지 중요한 발견이 있었다:

**1. Webhook 경로 규칙 (v1.94+)**
```
POST /webhook/{workflowId}/webhook/{userDefinedPath}
```
`workflowId`가 경로에 포함되는 형태로, 문서화되지 않은 부분이라 소스 코드를 추적해서 확인했다.

**2. AI Agent 노드 실행 조건**
```yaml
# docker-compose.yml
N8N_RUNNERS_ENABLED: 'true'   # 필수!
```
이 환경 변수가 없으면 AI Agent 노드가 실행되지 않는다.

**3. n8n 2.x vs 1.94.1**
n8n 2.x는 `published` Workflow 개념을 도입했는데, API로 `activate`만 해서는 부족하고 별도의 publish 과정이 필요하다. PoC 범위에서는 1.94.1이 더 단순했다.

**4. Gemini Credential Type**
n8n 내부적으로 Google AI (Gemini) API 키를 `googlePalmApi` credential type으로 관리한다. 이름과 달리 Gemini도 이 타입을 사용한다.

---

## E2E 검증 결과

실제 동작하는 파이프라인을 E2E로 검증했다:

```
사용자 입력: "안녕하세요, 반품 절차가 궁금합니다"
    ↓
Next.js UI → NestJS API → n8n Webhook
    ↓
n8n AI Agent Node → Gemini 2.5 Flash
    ↓
응답: "안녕하세요! 반품 절차를 안내해 드리겠습니다..."
    ↓
결과 저장: Execution + Step Logs → PostgreSQL
```

- **응답 시간**: 약 3~5초
- **실행 로그**: 각 Step별 input/output 추적 가능
- **에러 핸들링**: n8n 실행 실패 시 status="failed" + 에러 메시지 저장

---

## 회고

### PoC에서 검증한 것

| 가설 | 결론 |
|------|------|
| n8n 위에 Agent 추상화가 성립하는가? | ✅ 성립한다 |
| Prompt + Tool + Workflow 모델이 실용적인가? | ✅ 실용적이다 |
| 최소한의 Builder UI가 가능한가? | ✅ 가능하다 |

### 의도적으로 제외한 것

- **멀티테넌시**: 단일 사용자 PoC
- **RBAC**: 인증/인가 없음
- **비용 최적화**: 토큰 사용량 추적 없음
- **Prompt 버저닝**: 변경 이력 관리 없음
- **멀티 Agent**: Agent 간 협업/체이닝

### 다음 단계

이 PoC를 기반으로 [2편](/blogs/008_ai_agent/backstage/)에서는 Backstage IDP 플러그인으로 통합하여, 조직 내부의 개발자 포털에서 AI Agent를 관리하는 구조를 만들어본다.

---

> **Source Code**: [github.com/noisonnoiton/n8n-poc](https://github.com/noisonnoiton/n8n-poc)
