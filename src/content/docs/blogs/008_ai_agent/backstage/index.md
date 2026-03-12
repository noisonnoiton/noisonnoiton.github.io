---
title: "2편: Backstage IDP로 AI Agent Builder 통합"
description: n8n-poc AI Agent Builder를 Backstage 내부 개발자 포털에 플러그인으로 통합한 경험
---

## 왜 Backstage인가

[1편](/blogs/008_ai_agent/n8n-poc/)에서 만든 AI Agent Builder는 독립적인 애플리케이션이다. 하지만 실제 조직에서 운영하려면 다음 질문이 생긴다:

- Agent를 **누가** 만들었고, **어떤 팀**이 소유하는가?
- 다른 서비스(API, 인프라)와의 **의존 관계**는?
- Agent를 만드는 **표준 절차**가 있는가?

이 질문들은 결국 **Internal Developer Portal (IDP)** 의 영역이다. Backstage는 Spotify가 만든 오픈소스 IDP 플랫폼으로, 다음을 제공한다:

| 기능 | 설명 |
|------|------|
| Software Catalog | 모든 서비스, API, 리소스를 한 곳에서 관리 |
| Plugin System | 기능을 플러그인 단위로 확장 |
| Software Templates | 표준화된 프로젝트 생성 워크플로우 |
| TechDocs | 서비스별 기술 문서 |

핵심 판단: **AI Agent도 조직의 "소프트웨어 자산"이다**. Catalog에 등록하고, 소유권을 추적하고, 표준 절차로 생성할 수 있어야 한다.

---

## 통합 전략

### 설계 원칙

1. **n8n-poc API는 수정하지 않는다** — Backstage는 프록시 + UI 레이어
2. **Backstage 플러그인 표준을 따른다** — New Backend System, Plugin API
3. **최소 변경, 최대 효과** — 기존 코드 재활용, 프록시 패턴

### 아키텍처

```
┌─ Backstage App (:3000 / :7007) ──────────────────────┐
│                                                       │
│  Sidebar → AI Agents 메뉴                             │
│                                                       │
│  plugin-ai-agent (Frontend)                           │
│  ├─ AgentListPage    — Agent 목록 + 상태              │
│  ├─ AgentDetailPage  — 상세 정보, Prompt, Config      │
│  └─ ExecutionPanel   — 실행 & 결과 표시               │
│                                                       │
│  plugin-ai-agent-backend (Backend)                    │
│  └─ Proxy Router → n8n-poc API 전달                   │
│                                                       │
└───────────────────┬───────────────────────────────────┘
                    │ HTTP Proxy
                    ▼
┌─ n8n-poc API (:3001) ─────────────────────────────────┐
│  NestJS — 기존 API 그대로 사용                         │
└───────────────────┬───────────────────────────────────┘
                    ▼
┌─ n8n (:5678) + PostgreSQL (:5432) ────────────────────┐
│  Workflow Engine + 데이터 저장소                       │
└───────────────────────────────────────────────────────┘
```

### 왜 프록시 패턴인가?

Backstage 백엔드 플러그인이 n8n-poc API에 직접 DB 접근하는 대신 HTTP 프록시를 선택한 이유:

| 항목 | 프록시 (선택) | 직접 DB 접근 |
|------|-------------|-------------|
| n8n-poc 코드 수정 | ❌ 불필요 | ✅ 필요 |
| 독립 배포 | ✅ 각각 배포 가능 | ❌ 결합도 증가 |
| 타입 안전성 | △ (런타임) | ✅ (컴파일타임) |
| 레이턴시 | △ 한 홉 추가 | ✅ 직접 |
| 복잡도 | ✅ 단순 | ❌ ORM 설정 중복 |

PoC 단계에서는 **단순함과 독립성**이 더 중요했다.

---

## 플러그인 구현

### Backend Plugin

Backstage의 New Backend System을 사용한 백엔드 플러그인:

```typescript
// plugin.ts
export const aiAgentPlugin = createBackendPlugin({
  pluginId: 'ai-agent',
  register(env) {
    env.registerInit({
      deps: {
        config: coreServices.rootConfig,
        logger: coreServices.logger,
        auth: coreServices.auth,
        httpAuth: coreServices.httpAuth,
        httpRouter: coreServices.httpRouter,
      },
      async init({ config, logger, auth, httpAuth, httpRouter }) {
        const n8nPocApiUrl = config.getString('aiAgent.n8nPocApiUrl');
        httpRouter.use(
          await createRouter({ logger, auth, httpAuth, n8nPocApiUrl }),
        );
        httpRouter.addAuthPolicy({
          path: '/health',
          allow: 'unauthenticated',
        });
      },
    });
  },
});
```

프록시 라우터의 핵심:

```typescript
// router.ts
async function proxyFetch(n8nPocBaseUrl: string, path: string, init?: RequestInit) {
  const url = `${n8nPocBaseUrl}/api/v1${path}`;
  const response = await fetch(url, init);
  return response.json();
}

router.get('/agents', async (req, res) => {
  const result = await proxyFetch(n8nPocApiUrl, '/agents');
  // n8n-poc은 { data: [...], total: N } 형태
  // Frontend는 배열을 기대 → data만 추출
  res.json(result.data || result);
});
```

### Frontend Plugin

Backstage Plugin API 기반의 프론트엔드:

```typescript
// plugin.ts
export const aiAgentPlugin = createPlugin({
  id: 'ai-agent',
  apis: [
    createApiFactory({
      api: aiAgentApiRef,
      deps: { discoveryApi: discoveryApiRef, fetchApi: fetchApiRef },
      factory: ({ discoveryApi, fetchApi }) =>
        new AiAgentClient({ discoveryApi, fetchApi }),
    }),
  ],
  routes: { root: rootRouteRef },
});
```

**API 클라이언트** — Backstage의 `discoveryApi`를 사용해 백엔드 URL을 동적으로 해석:

```typescript
class AiAgentClient implements AiAgentApi {
  async getAgents(): Promise<Agent[]> {
    const baseUrl = await this.discoveryApi.getBaseUrl('ai-agent');
    const response = await this.fetchApi.fetch(`${baseUrl}/agents`);
    return response.json();
  }

  async executeAgent(agentId: string, message: string): Promise<Execution> {
    const baseUrl = await this.discoveryApi.getBaseUrl('ai-agent');
    const response = await this.fetchApi.fetch(
      `${baseUrl}/agents/${agentId}/execute`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      },
    );
    return response.json();
  }
}
```

### UI 컴포넌트

| 컴포넌트 | 역할 |
|---------|------|
| `AgentListPage` | Agent 목록 테이블 — 이름, 상태, 모델, 생성일 |
| `AgentDetailPage` | Agent 상세 — System Prompt, Model Config |
| `ExecutionPanel` | 채팅형 실행 UI — 메시지 입력, 응답 표시 |

Navigation 사이드바에 메뉴 추가:

```tsx
// Root.tsx
import SmartToyIcon from '@material-ui/icons/Memory';

<SidebarItem icon={SmartToyIcon} to="ai-agent" text="AI Agents" />
```

:::note[MUI v4 호환]
Backstage는 Material UI v4를 사용한다. MUI v5의 `gap` prop 대신 `style={{ gap: 8 }}`을 써야 한다.
:::

---

## E2E 검증

Backstage를 통한 전체 파이프라인 검증:

```
[Backstage UI] → Guest 로그인
    ↓
사이드바 "AI Agents" 클릭 → Agent 목록 확인
    ↓
"고객 응대 Agent" 클릭 → 상세 (Prompt, Model Config)
    ↓
실행 패널에서 메시지 전송: "안녕하세요, 반품 절차가 궁금합니다"
    ↓
Backstage Backend → n8n-poc API → n8n → Gemini 2.5 Flash
    ↓
응답: "안녕하세요! 반품 절차를 안내해 드리겠습니다..."
```

| 검증 항목 | 결과 | 비고 |
|---------|------|------|
| Health Check | ✅ | Backend Plugin + n8n-poc API 연결 확인 |
| Agent 목록 조회 | ✅ | Backstage → Proxy → n8n-poc API |
| Agent 상세 조회 | ✅ | Prompt, Config 정상 표시 |
| Agent 실행 | ✅ | Gemini 응답 수신 (약 4.5초) |

---

## 기술 스택

| Layer | Technology |
|-------|-----------|
| Backstage | v1.48.0 (New Backend System) |
| Frontend Plugin | React, Material UI v4, @backstage/core-plugin-api |
| Backend Plugin | Express, @backstage/backend-plugin-api |
| n8n-poc API | NestJS, TypeORM, PostgreSQL |
| Workflow Engine | n8n 1.94.1 |
| LLM | Gemini 2.5 Flash |

---

## 회고

### 잘 된 점

- **프록시 패턴의 효과**: n8n-poc 코드를 한 줄도 수정하지 않고 Backstage에 통합
- **Backstage Plugin System**: 프론트엔드/백엔드 플러그인 구조가 잘 설계되어 있어 확장이 용이
- **New Backend System**: 기존 Legacy 방식보다 DI 기반으로 깔끔

### 어려웠던 점

- **Backstage 학습 곡선**: Plugin API, Discovery API, Auth 체계 등 이해해야 할 개념이 많음
- **MUI v4 제약**: 최신 MUI 패턴을 쓸 수 없어 CSS-in-JS 스타일 제한
- **메모리 부담**: Backstage + n8n-poc API + n8n + PostgreSQL 동시 실행 시 7.8GB RAM으로 빠듯함

### 의도적으로 제외한 것

| 항목 | 사유 |
|------|------|
| PostgreSQL 전환 (Backstage DB) | SQLite in-memory로 PoC 충분 |
| Software Template | Agent 생성 표준화는 다음 단계 |
| CatalogProcessor | Agent ↔ Catalog Entity 자동 동기화 |
| RBAC | PoC 범위 밖 |

### 실무 적용 시 고려사항

1. **인증 통합**: Guest 모드 대신 OAuth/OIDC 연동
2. **DB 분리**: Backstage는 별도 PostgreSQL 인스턴스 권장
3. **CatalogProcessor**: Agent를 Catalog Entity로 자동 등록하면 소유권, 의존성 추적 가능
4. **Software Template**: "AI Agent 생성" 템플릿으로 표준화된 생성 워크플로우 제공
5. **모니터링**: 실행 비용, 토큰 사용량 대시보드 추가

---

## 전체 시리즈

1. [n8n 기반 AI Agent Builder 설계와 구현](/blogs/008_ai_agent/n8n-poc/) — 이전 편
2. **Backstage IDP로 AI Agent Builder 통합** — 현재 편

---

> **Source Code**: [github.com/noisonnoiton/backstage-n8n-poc](https://github.com/noisonnoiton/backstage-n8n-poc)
