---
title: "Envoy Gateway 도입 및 검증"
description: AKS 환경에서 Envoy Gateway v1.7.0을 도입하고, Gateway API 기반 L7 라우팅 및 NodePort 외부 노출을 검증한 기록
---

## 왜 Gateway API인가

### Ingress의 한계

Kubernetes `Ingress` 리소스는 오랫동안 L7 트래픽 관리의 표준이었지만, 근본적인 한계가 있다:

- **표현력 부족**: 헤더 기반 라우팅, 트래픽 분배(weight), 미러링 등은 표준 스펙에 없어 **annotation 지옥**으로 구현
- **구현체 종속**: `nginx.ingress.kubernetes.io/...` 같은 annotation은 특정 Ingress Controller에서만 동작 → 이식성 없음
- **역할 분리 불가**: 인프라 운영자와 애플리케이션 개발자가 같은 리소스를 수정해야 함
- **cross-namespace 라우팅 미지원**: 다른 네임스페이스의 서비스 참조가 어려움

### Gateway API — Ingress의 후속 표준

[Gateway API](https://gateway-api.sigs.k8s.io/)는 Kubernetes SIG-Network에서 설계한 **Ingress의 공식 후속 표준**이다:

| 구분 | Ingress | Gateway API |
|------|---------|-------------|
| 역할 분리 | 단일 리소스 | GatewayClass(인프라) → Gateway(운영) → HTTPRoute(개발) |
| 헤더 라우팅 | annotation | **네이티브** 지원 |
| 트래픽 분배 | annotation | **네이티브** weight 기반 |
| cross-namespace | 불가 | `parentRefs` + `allowedRoutes`로 **표준 지원** |
| 이식성 | 구현체 종속 | **표준 스펙** — 구현체 교체 가능 |
| 프로토콜 | HTTP/HTTPS만 | HTTP, gRPC, TCP, UDP, TLS |

### NGINX Ingress Controller EOS (End of Sale/Support)

전환을 더 시급하게 만드는 현실적 요인:

- **F5 NGINX Plus 기반 Ingress Controller**: F5 인수 후 상용화 가속, OSS 버전과 기능 격차 확대
- **Community Ingress NGINX** (`kubernetes/ingress-nginx`): 유지보수 속도 저하, 보안 취약점 대응 지연 이슈 반복
- **Kubernetes 공식 방향**: Gateway API를 공식 문서에서 [Ingress 대안으로 명시](https://kubernetes.io/docs/concepts/services-networking/gateway/) — `Ingress`는 기능 동결(frozen) 상태
- **주요 클라우드 프로바이더**: GKE, EKS, AKS 모두 Gateway API 지원 확대 중

> **결론**: Ingress는 더 이상 발전하지 않는다. 신규 구축이라면 Gateway API로 시작하고, 기존 환경이라면 점진적 전환을 검토해야 한다.

---

## 문서 정보

| 항목 | 내용 |
|------|------|
| 목적 | Dev 환경에 Envoy Gateway를 도입하고, Gateway API 기반 L7 라우팅 및 NodePort 외부 노출 검증 |
| 적용 환경 | AKS Dev 클러스터, 네임스페이스 `envoy-gateway` |
| 주요 버전 | Envoy Gateway v1.7.0, Envoy Proxy (distroless) |
| 관련 리포지토리 | `cluster-init` — 컨트롤 플레인 + Gateway CR, `lasp-gitops-deploy` — 앱별 HTTPRoute |

---

## 배경 및 목표

### 기존 인그레스와의 관계

기존에는 **NGINX Ingress Controller**로 `Ingress` 리소스 기반 L7 라우팅을 사용하고 있었다.

Envoy Gateway는 **Kubernetes Gateway API**(GatewayClass / Gateway / HTTPRoute)의 구현체로, 기존 Ingress와는 별도 스택이다. 이번 작업은 **공존 및 검증** 목적에 가깝다.

### Envoy Gateway로 하려는 것

- **Gateway API 표준** 기반으로 호스트·경로 라우팅 선언 (HTTPRoute)
- 데이터 플레인을 **DaemonSet**으로 배치하여 특정 노드에 스케줄링
- 외부 진입은 **NodePort**(30080/30443)로 고정하여 LB/방화벽 연동을 쉽게 구성
- **SecurityPolicy**로 IP 화이트리스트 적용
- **ClientTrafficPolicy**로 클라이언트 IP 감지 및 연결 제어

### 이번 범위

| 포함 | 제외 |
|------|------|
| Dev `envoy-gateway` 네임스페이스 설치·설정 | PRD 동일 구성 전개 |
| GatewayClass + Gateway + EnvoyProxy + 정책 | 기존 Ingress 일괄 이관 |
| 앱 대상 HTTPRoute 테스트 (nginx-proxy, pgadmin, rabbitmq) | 전 서비스 Gateway API 전환 |
| SecurityPolicy (IP 화이트리스트) | cert-manager 연동, rate limiting |

---

## 아키텍처 요약

### 컨트롤 플레인 vs 데이터 플레인

| 역할 | 설명 |
|------|------|
| **컨트롤 플레인** | `envoy-gateway` Deployment — Gateway/HTTPRoute를 읽고 xDS로 데이터 플레인에 설정 전달. 사용자 트래픽을 직접 받지 않음 |
| **데이터 플레인** | Gateway당 생성되는 Envoy DaemonSet — 실제 리스너에서 요청 수신 후 upstream으로 프록시 |

### 트래픽 흐름

```
클라이언트
  → (LB/VIP 또는 Node IP)
  → NodePort 30080/30443
  → Service (80/443)
  → Pod targetPort (Envoy listen 포트, 예: 10080)
  → HTTPRoute 매칭
  → Backend Service (예: nginx-proxy:8080)
```

### 사용 CRD

| CRD | 역할 |
|-----|------|
| `GatewayClass` | 컨트롤러 연결, `parametersRef`로 `EnvoyProxy` 참조 |
| `Gateway` | 리스너 정의 (HTTP 80, HTTPS 443 TLS Terminate) |
| `EnvoyProxy` | DaemonSet·Service(NodePort)·이미지 등 인프라 스펙 |
| `ClientTrafficPolicy` | X-Forwarded-For, HTTP/1.0, bufferLimit |
| `SecurityPolicy` | IP 화이트리스트 (CIDR 기반) |
| `HTTPRoute` | 호스트·규칙·backendRefs (앱 네임스페이스에 배치 가능) |

---

## 구성 요소 및 매니페스트

### GatewayClass

```yaml
kind: GatewayClass
apiVersion: gateway.networking.k8s.io/v1
metadata:
  name: lasp-gateway-class
spec:
  controllerName: gateway.envoyproxy.io/gatewayclass-controller
```

`parametersRef`로 `EnvoyProxy` CR을 연결하면 DaemonSet/NodePort 등 데이터 플레인 설정을 제어할 수 있다.

### Gateway

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: lasp-gateway
spec:
  gatewayClassName: lasp-gateway-class
  listeners:
    - name: http
      protocol: HTTP
      port: 80
      allowedRoutes:
        namespaces:
          from: All
    - name: https
      protocol: HTTPS
      port: 443
      allowedRoutes:
        namespaces:
          from: All
      tls:
        mode: Terminate
        certificateRefs:
          - kind: Secret
            name: lasp-gateway-dummy-tls
```

**핵심 포인트:**
- `allowedRoutes.namespaces.from: All` — **cross-namespace** HTTPRoute 허용. 다른 네임스페이스의 앱이 이 Gateway를 parentRef로 참조 가능
- TLS: Dev 환경이므로 **self-signed dummy 시크릿** 사용. 운영 시 실제 인증서로 교체

### ClientTrafficPolicy

```yaml
apiVersion: gateway.envoyproxy.io/v1alpha1
kind: ClientTrafficPolicy
metadata:
  name: client-ip-detection
spec:
  targetRefs:
    - group: gateway.networking.k8s.io
      kind: Gateway
      name: lasp-gateway
  clientIPDetection:
    xForwardedFor:
      numTrustedHops: 1
  http1:
    http10: {}
  connection:
    bufferLimit: "1024Mi"
```

LB 뒤에서 실제 클라이언트 IP를 감지하려면 `numTrustedHops` 설정이 필수다.

### SecurityPolicy (IP 화이트리스트)

```yaml
apiVersion: gateway.envoyproxy.io/v1alpha1
kind: SecurityPolicy
metadata:
  name: ip-whitelist
spec:
  targetRefs:
    - group: gateway.networking.k8s.io
      kind: Gateway
      name: lasp-gateway
  authorization:
    defaultAction: Deny
    rules:
      - action: Allow
        principal:
          clientCIDRs:
            - 211.192.87.243/32
            - 211.192.87.209/32
```

Gateway 레벨에서 **IP 기반 접근 제어**를 선언적으로 적용할 수 있다. Ingress의 annotation 방식보다 구조적이다.

### Helm 배포 (Kustomize + HelmChart)

```yaml
# kustomization.yaml
namespace: envoy-gateway

resources:
- ./namespaces.yaml
- ./dummy-tls-secret.yaml
- ./lasp-gateway.yaml

helmGlobals:
  chartHome: ../../../base/envoy-gateway/charts

helmCharts:
- name: gateway-helm-v1.7.0
  version: v1.7.0
  releaseName: envoy-gateway
  namespace: envoy-gateway
  valuesFile: values.yaml
  includeCRDs: false
```

**CRD는 별도 관리** (`includeCRDs: false`) — CRD 업그레이드와 컨트롤러 업그레이드를 분리하기 위함.

---

## HTTPRoute 설계 (앱별)

HTTPRoute는 **앱 네임스페이스에 배치**하고, `parentRefs`로 `envoy-gateway` 네임스페이스의 Gateway를 참조한다.

### nginx-proxy (Host 기반 라우팅)

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: nginx-proxy
spec:
  parentRefs:
    - name: lasp-gateway
      namespace: envoy-gateway
  hostnames:
    - "internal-midm.20.214.216.102.nip.io"
    - "midm.20.214.216.102.nip.io"
  rules:
    - matches:
        - headers:
            - name: Host
              value: internal-midm.20.214.216.102.nip.io
      backendRefs:
        - name: nginx-proxy
          port: 9090
    - matches:
        - headers:
            - name: Host
              value: midm.20.214.216.102.nip.io
      backendRefs:
        - name: nginx-proxy
          port: 8080
```

### 전체 HTTPRoute 매핑

| HTTPRoute | 호스트명 | 백엔드 | 포트 |
|-----------|---------|--------|------|
| nginx-proxy | `internal-midm.*.nip.io` | nginx-proxy | 9090 |
| nginx-proxy | `midm.*.nip.io` | nginx-proxy | 8080 |
| pgadmin | `pgadmin.*.nip.io` | pgadmin | 5050 |
| rabbitmq | `rabbitmq.*.nip.io` | rabbitmq | 15672 |

**`nip.io`를 활용**하면 별도 DNS 설정 없이 IP 기반 호스트 라우팅을 테스트할 수 있다.

---

## NodePort·Service 패치 설계

### 왜 targetPort를 명시해야 하는가

Envoy 컨테이너는 **non-root**로 실행되는 경우가 많아, Service `port`(80/443)와 동일한 포트에 직접 바인딩하지 않을 수 있다. 실제 listen 포트는 xDS/버전에 따라 다르며, 반드시 Pod 내에서 `ss -tlnp` 등으로 확인해야 한다.

### NodePort 고정 예시

| 이름 | Service `port` | `nodePort` | `targetPort` |
|------|----------------|------------|--------------|
| http | 80 | 30080 | 10080 |
| https | 443 | 30443 | 10080 |

> HTTPS 리스너가 별도 포트(예: 10443)를 사용하는 환경이면 `https` 항목의 `targetPort`를 분리해야 한다.

### JSON Merge 패치 시 주의

EnvoyProxy CR의 `spec.ports` JSON Merge 패치에서 **`port`를 빠뜨리면** API 서버가 `port: 0`으로 처리할 수 있다. 두 포트가 모두 `0/TCP`로 겹치면서 다음 오류가 발생한다:

```
duplicate entries for key [port=0, protocol="TCP"]
```

**해결**: 각 항목에 `port`, `targetPort`, `nodePort`, `protocol`을 **모두 명시**한다.

---

## 배포 및 적용

### 적용 순서

1. **Envoy Gateway 컨트롤러** — Helm 렌더 + Kustomize 적용
2. **외부 리소스** — `GatewayClass` → `EnvoyProxy` → TLS Secret → `Gateway`
3. **HTTPRoute** — 각 앱 네임스페이스에 적용 (`parentRefs`가 Gateway를 참조)

### 네임스페이스 주의

- Gateway / EnvoyProxy / GatewayClass 참조는 `envoy-gateway` 기준
- `kubectl apply -f ... -n <다른-ns>` 를 주면 오브젝트의 namespace와 **불일치하여 실패**할 수 있다
- → `kubectl apply -k external/` 또는 `-n envoy-gateway`로 통일

### 검증 명령

```bash
# Gateway 상태
kubectl get gatewayclass,gateway -n envoy-gateway

# Envoy Proxy (데이터 플레인)
kubectl get svc -n envoy-gateway -l app.kubernetes.io/name=envoy
kubectl get ds  -n envoy-gateway -l app.kubernetes.io/component=proxy

# HTTPRoute (전체 네임스페이스)
kubectl get httproute -A

# Endpoints
kubectl get endpoints -n envoy-gateway
```

---

## 검증 및 테스트

### 정상 시나리오에서 확인한 것

DNS/LB가 NodePort(또는 그 앞단)로 트래픽을 보낼 때, **Envoy access log**에 요청이 기록된다.

로그에서 확인할 주요 필드:

| 필드 | 의미 |
|------|------|
| `:authority` | 요청 Host |
| `upstream_host` | 실제 프록시된 Pod IP:포트 |
| `response_code` | upstream 응답 코드 |
| `response_code_details` | `via_upstream` = upstream이 생성한 응답 (Envoy가 아님) |

### 부가 관찰 (nginx 프록시 경로)

다른 호스트가 nginx-proxy 등으로 연결된 경우, upstream에서 **301 리다이렉트**를 반환할 수 있다. 이 경우 `response_code_details: via_upstream`이며, LB/Envoy가 HTTPS인데 nginx가 HTTP로만 보면 `X-Forwarded-Proto` 등 설정을 nginx 측에서 맞출 필요가 있다.

### listen 주소 정리

| 구간 | 포트 |
|------|------|
| 클라이언트 → NodePort | 30080 (HTTP), 30443 (HTTPS) |
| Envoy Pod 내부 | targetPort 10080 (환경에 따라 변경 가능) |

> 반드시 `ss -tlnp` 등으로 실제 LISTEN 포트를 확인한 뒤 매니페스트를 조정한다.

---

## 정리

| 항목 | 결과 |
|------|------|
| Gateway API 기반 L7 라우팅 | ✅ HTTPRoute로 호스트·경로 라우팅 정상 동작 |
| cross-namespace 라우팅 | ✅ 앱 네임스페이스에서 Gateway 참조 가능 |
| NodePort 외부 노출 | ✅ 30080/30443 고정, LB/방화벽 연동 용이 |
| SecurityPolicy (IP 제어) | ✅ Gateway 레벨 선언적 접근 제어 |
| ClientTrafficPolicy | ✅ XFF 기반 클라이언트 IP 감지 |
| 기존 Ingress 공존 | ✅ 별도 스택으로 독립 운영 가능 |

Gateway API는 Ingress의 후속 표준으로, **선언적이고 구조화된** 라우팅 관리가 가능하다. Envoy Gateway는 그 구현체 중에서도 EnvoyProxy CR을 통한 **데이터 플레인 커스터마이징**이 강점이다. 기존 Ingress와 공존하면서 점진적으로 전환할 수 있다는 점이 실무에서 큰 장점이다.
