---
title: "왜 Gateway API인가"
description: Kubernetes Ingress의 한계, Gateway API 표준 등장, NGINX Ingress Controller EOS까지 — 전환이 필요한 이유
---

## Ingress의 한계

Kubernetes `Ingress` 리소스는 오랫동안 L7 트래픽 관리의 표준이었지만, 근본적인 한계가 있다:

- **표현력 부족**: 헤더 기반 라우팅, 트래픽 분배(weight), 미러링 등은 표준 스펙에 없어 **annotation 지옥**으로 구현
- **구현체 종속**: `nginx.ingress.kubernetes.io/...` 같은 annotation은 특정 Ingress Controller에서만 동작 → 이식성 없음
- **역할 분리 불가**: 인프라 운영자와 애플리케이션 개발자가 같은 리소스를 수정해야 함
- **cross-namespace 라우팅 미지원**: 다른 네임스페이스의 서비스 참조가 어려움

---

## Gateway API — Ingress의 후속 표준

[Gateway API](https://gateway-api.sigs.k8s.io/)는 Kubernetes SIG-Network에서 설계한 **Ingress의 공식 후속 표준**이다.

### 설계 원칙

- **역할 지향(Role-oriented)**: 인프라 제공자 → 클러스터 운영자 → 애플리케이션 개발자, 각 역할에 맞는 리소스 분리
- **이식성(Portable)**: CRD 기반 표준 스펙 — 구현체(Envoy, Istio, Traefik 등)를 교체해도 리소스는 동일
- **표현력(Expressive)**: 헤더 매칭, 트래픽 분배, 미러링 등을 annotation 없이 네이티브로 표현
- **확장성(Extensible)**: 각 구현체가 자체 확장 리소스(EnvoyProxy, SecurityPolicy 등)를 제공

### Ingress vs Gateway API

| 구분 | Ingress | Gateway API |
|------|---------|-------------|
| 역할 분리 | 단일 리소스 | GatewayClass(인프라) → Gateway(운영) → HTTPRoute(개발) |
| 헤더 라우팅 | annotation | **네이티브** 지원 |
| 트래픽 분배 | annotation | **네이티브** weight 기반 |
| cross-namespace | 불가 | `parentRefs` + `allowedRoutes`로 **표준 지원** |
| 이식성 | 구현체 종속 | **표준 스펙** — 구현체 교체 가능 |
| 프로토콜 | HTTP/HTTPS만 | HTTP, gRPC, TCP, UDP, TLS |

### 리소스 모델

Gateway API는 4개의 Stable API로 구성된다:

| 리소스 | 역할 | 담당 |
|--------|------|------|
| **GatewayClass** | 공통 설정을 가진 게이트웨이 그룹 정의, 컨트롤러 지정 | 인프라 제공자 |
| **Gateway** | 트래픽 처리 인프라 인스턴스 (로드밸런서) 정의 | 클러스터 운영자 |
| **HTTPRoute** | HTTP 트래픽 라우팅 규칙 정의 | 애플리케이션 개발자 |
| **GRPCRoute** | gRPC 트래픽 라우팅 규칙 정의 | 애플리케이션 개발자 |

```
GatewayClass (인프라)
  └── Gateway (운영 — 리스너, TLS)
        └── HTTPRoute (개발 — 호스트, 경로, 백엔드)
```

---

## NGINX Ingress Controller EOS

전환을 더 시급하게 만드는 현실적 요인들:

### F5 인수 이후의 변화

- **F5 NGINX Plus 기반 Ingress Controller**: F5 인수 후 상용화 가속, OSS 버전과 기능 격차 확대
- 유료 기능(Active Health Check, JWT Validation, Session Persistence 등)과 무료 기능의 분리가 뚜렷해짐

### Community 버전의 한계

- **Community Ingress NGINX** (`kubernetes/ingress-nginx`): 유지보수 속도 저하, 보안 취약점 대응 지연 이슈 반복
- 대규모 환경에서의 reload 성능 문제 (설정 변경 시 nginx reload 필요)

### Kubernetes 공식 방향

- Gateway API를 공식 문서에서 [Ingress 대안으로 명시](https://kubernetes.io/docs/concepts/services-networking/gateway/)
- `Ingress` 리소스는 **기능 동결(frozen)** 상태 — 새 기능 추가 없음
- 주요 클라우드 프로바이더(GKE, EKS, AKS) 모두 Gateway API 지원 확대 중

---

## 구현체 비교

Gateway API는 표준이고, 구현체는 여러 가지가 있다:

| 구현체 | 데이터 플레인 | 특징 |
|--------|-------------|------|
| **Envoy Gateway** | Envoy | CNCF, 경량, EnvoyProxy CR로 세밀한 제어 |
| **Istio** | Envoy | 서비스 메시 통합, 무거움 |
| **Traefik** | Traefik | 자체 프록시, 미들웨어 체인 |
| **Cilium** | eBPF | 네트워크 계층 통합, 고성능 |
| **NGINX Gateway Fabric** | NGINX | F5, NGINX 기반 Gateway API 구현체 |

이 블로그에서는 **Envoy Gateway**를 선택하여 검증한다.

> **결론**: Ingress는 더 이상 발전하지 않는다. 신규 구축이라면 Gateway API로 시작하고, 기존 환경이라면 점진적 전환을 검토해야 한다.
