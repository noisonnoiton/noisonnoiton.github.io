---
title: Redis HA with standalone
date: 2021-04-14
tags:
- kubernetes
- database
categories: 
 - Ref. Arch.
---

- 제안배경
  - Redis 를 HA 로 구성하기 위해서는 cluster 나 sentinel 구성을 필요로 함
  - cluster 나 sentinel 구성은 복잡한 구조와 기본 3개 이상의 인스턴스가 필요
- Redis standalone HA 구성
  - Redis standalone 구성만으로 HA 구성을 검토
  - 개별 Redis 간 Data Sync 를 위해 side-car, envoy proxy, redis proxy 등을 검토


## Standalone + Sidecar

- Redis Master-Master HA 구성 방안
- 각 Redis Standalone service 에 Sidecar 를 구성하여 Replication 이 가능한지 검토
  - Dynomite, Envoy etc.

### Netflix Dynomite

#### Introduction

Dynomite 는 다양한 key-value pair 스토리지 엔진을 Amazon DynamoDB와 유사하게 구현할 수 있다. 현재 Redis 및 Memcached 등에 사용 가능하다. Dynomite는 multi-datacenter replication 을 지원하며, 고 가용성을 위한 설계가 적용되어 있다.  

Dynomite 의 궁극적인 목표는 본질적으로 해당 기능을 제공하지 않는 스토리지 엔진에서 고 가용성 및 cross-datacenter replication 을 구현할 수 있도록 하는 것이다.

> Dynomite Github Wiki 참조
<https://github.com/Netflix/dynomite/wiki>
> Amazon DynamoDB Docs
<https://docs.aws.amazon.com/ko_kr/amazondynamodb/latest/developerguide/Introduction.html>

#### Architecture Overview

- Replication Flow

  - On-premise 환경이라 가정할 때, Dynomite와 Target 스토리지 엔진은 동일한 노드에서 실행되며, Client 는 Dynomite 에 Request.
  - 해당 Request 는 동일한 노드의 스토리지 엔진 또는 다른 노드에서 실행되는 Dynomite 프로세스로 proxy.
  - Request 가 Dynomite Node 를 통과하면, data 가 복제되어 대상 스토리지에 저장됨.
  - 이후, Client 는 Dynomite 혹은 스토리지의 API Call 을 통하여, 데이터를 다시 조회.

<img src="https://github.com/Netflix/dynomite/wiki/images/dynomite-architecture.png" width="800px" height="450px" title="dynomite-arch" alt="dynomite-arch"></img>

> Dynomite Architecture 참조
<https://github.com/Netflix/dynomite/wiki/Architecture>


#### 구성 Architecture

Kubernetes 환경에서 제공되는 Redis Standalone 서비스의 고 가용성 확보를 위한 구성 방안
: Dynomite Sidecar 를 통한 datacenter replication

- Redis Standalone + Dynomite Sidecar Deployment
  - 각 Redis Deployment 를 component로 묶어서 공통으로 request 를 처리할 수 있는 service 생성
  - Client 는 common service 에 request.
  - common service 에서 각 dynomite pod 에 Load Balancing.
  - dynomite pod 에 write 작업 요청 시, target redis 에 write 를 수행하고, dynomite seed 에 설정된 pod 으로 proxy.
  - proxy 요청을 받은 dynomite 또한, 자신의 target redis 에 write 를 수행
  | <u>*dynomite 에서 target redis 에 request 할 때, 각 redis 별로 생성된 k8s service 를 통하여 호출 (아래 그림에서는 각 service 생략)*</u>

<img src="https://www.plantuml.com/plantuml/svg/~1eNqNkE9LAzEQxe_5FENO9bCQRPBPEakUiyB4cI_iId1My-ImKUmqiOx3l51s1iIs9DaT93t5yVvFpEM62o7xddeiSxx0hIZG5rxB4I_PNR3iR4QfBvDWeGu9qyKGz7bBdzJ4a4edAWTTK5o2wtMDOc2WjAABm6TdvkPgYQAqIdRICKFGCMDopLc6FooImoRQI7Iw387bNuEFxetQpH4uSE5B8pwgOR8kp6Ce9aWkzVjSLpcUkw96j8BfNjXUeSHA7SLrWS4Yqvu_5soAlfFfblAoa3m4kULNqKqohE5a-cLycHV5fZtV9V9Vp6qEu-lOVuyjg55cTKdnK3TmaLtfoWmsYw==" alt="PlantUML Diagram" style="max-width:100%;background:white;padding:1rem;" />

#### 구성 내역

- Redis Standalone + Dynomite Sidecar Deployment

```yaml
...

    spec:
      # Redis Standalone
      containers:
      - name: redis-dyno-001
        image: redis:latest
        imagePullPolicy: IfNotPresent
        ports:
          - containerPort: 6379
        command: 
          - redis-server
          - "/redis-master/redis.conf"
        resources:
          limits:
            cpu: 500m
            memory: 512Mi
          requests:
            cpu: 300m
            memory: 256Mi
        volumeMounts:
        - name: shared-storage
          mountPath: /data
        - name: redis-config
          mountPath: /redis-master
      # Dynomite Sidecar
      - name: dynomite
        image: dynomitedb/dynomite
        imagePullPolicy: IfNotPresent
        securityContext:
          runAsUser: 999
          runAsGroup: 999
        ports:
          # Dynomite Listener
          - containerPort: 8101
            name: dyno
          # Dynomite Client
          - containerPort: 8102
            name: dyno-client
          # Dynomite Stats/admin
          - containerPort: 22222
            name: dyno-admin
        args: ["dynomite", "-c", "/etc/dynomitedb/conf/dynomite.yaml"]
        resources:
          limits:
            cpu: 500m
            memory: 512Mi
          requests:
            cpu: 300m
            memory: 256Mi
        volumeMounts:
        - name: dyno-config
          mountPath: /etc/dynomitedb/conf

...
```

- Dynomite target server 및 seed 구성 내역 (dynomite.yaml)

```yaml
dyn_o_mite:
  datacenter: dc1
  rack: rack1
  dyn_listen: 0.0.0.0:8101
  listen: 0.0.0.0:8102
  dyn_seeds:
  - redis-dyno-002:8101:rack2:dc2:0 # proxy 대상이되는 dynomite seed
  servers:
  - redis-dyno-001:6379:1 # read/write target 이 되는 redis server
  tokens: '0'
  data_store: 0
  pem_key_file: /etc/dynomitedb/dynomite.pem
  secure_server_option: none
  read_consistency: DC_QUORUM # DC_ONE / DC_QUORUM
  write_consistency: DC_QUORUM
```

### Envoy Redis Proxy

#### Introduction

Envoy는 대규모의 현대적인 서비스 지향 아키텍처를 위해 설계된 L7 Proxy 및 Communication bus 이며, Service Mesh 를 구성하는 데에 활용. 많은 기능 중에서 Redis Proxy 의 request mirroring 을 통한 replication 및 고 가용성 확보 방안을 검토.

Envoy는 Redis Proxy 로 동작하여 cluster의 인스턴스간에 명령을 분할 할 수 있다. 이 모드에서 Envoy의 목표는 일관성보다는 가용성과 파티션 허용성을 유지하는 것이다. 또한, 액세스 패턴, 제거 또는 격리 요구 사항에 따라 서로 다른 워크로드에서 서로 다른 upstream cluster 로 routing 명령을 지원함.

> Envoy Redis Proxy Overview 참조
<https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/other_protocols/redis.html>

#### Architecture Overview

- Request Flow

  - Envoy Redis Proxy 에서 내부 구조는 크게 Listener / Cluster 로 구분할 수 있음.
  - Listener 에서 Request 를 요청 받기 위한 socket address 를 정의하며, 이를 통해 request 를 수신
  - Listner 내부에 filter 를 정의하여, request 의 routing policy 를 설정
  - 위의 routing target 은, Envoy 에서 정의한 clusters 중의 하나로 혹은 그 이상으로 설정 가능
  - Redis Proxy 의 경우, cluster 에 target 이 되는 redis server / cluster 를 정의할 수 있음

-  HTTP router filter 예시
<img src="https://www.envoyproxy.io/docs/envoy/latest/_images/lor-architecture.svg" width="800px" height="450px" title="envoy-arch" alt="envoy-arch"></img>

> Envoy Life of Request 참조
<https://www.envoyproxy.io/docs/envoy/latest/intro/life_of_a_request#>


#### 구성 Architecture

Kubernetes 환경에서 제공되는 Redis Standalone 서비스의 고 가용성 확보를 위한 구성 방안
: Envoy Redis Proxy Sidecar 를 통한 request mirroring

- Redis Standalone + Envoy Sidecar Deployment
  - 각 Redis Deployment 를 component로 묶어서 공통으로 request 를 처리할 수 있는 service 생성
  - Client 는 common service 에 request.
  - common service 에서 각 envoy pod 에 Load Balancing.
  - envoy pod 에 write 작업 요청 시, route 설정된 redis 에 write.
  - envoy 의 cluster 에 정의된 다른 redis 에 request mirroring 하여 wirte.
  | <u>*envoy 에서 redis 에 write 및 request mirroring 시, 각 redis 별로 생성된 k8s service 를 통하여 호출 (아래 그림에서는 각 service 생략)*</u>

<img src="https://www.plantuml.com/plantuml/svg/~1eNqNkE9LxDAQxe_5FENP6yGQRPDfYVlZXATBgz2Kh2wzuxSbRJLsiki_u3Sa1CIUvE3m915e8jYx6ZBOtmPVtmvRpQp0hIZG5rxBqB6ealrie4RvBvDaeGu94xHDuW3wjQze2uHMAEbTC5o2wuM9Oc2ejAABm6TdsUOowiDgQqisEEJlEYDRSe91LCpS0CSEypIVurP_uqBsHcq-X0qRU4r8T4pcSJFTSs_6Us8u13MY64nJB31EqJ53NdTjgQTuEFnPxmqBr387KwNw4z_dQCjr7uPq8kYsUFUoSSdW3j_Q69uRqr9UzakEPiOTY3YXK0O-hz5SDPPdBp052e4HfdiwIw==" alt="PlantUML Diagram" style="max-width:100%;background:white;padding:1rem;" />


#### 구성 내역

- Redis Standalone + Envoy Sidecar Deployment

```yaml
...

    spec:
      # Redis Standalone
      containers:
      - name: redis-envoy-001
        image: redis:latest
        imagePullPolicy: IfNotPresent
        ports:
          - containerPort: 6379
        command: 
          - redis-server
          - "/redis-master/redis.conf"
        resources:
          limits:
            cpu: 500m
            memory: 512Mi
          requests:
            cpu: 300m
            memory: 256Mi
        volumeMounts:
        - name: shared-storage
          mountPath: /data
        - name: redis-config
          mountPath: /redis-master
      # Envoy Sidecar
      - name: envoy
        image: envoyproxy/envoy-dev:latest
        imagePullPolicy: IfNotPresent
        ports:
          # Envoy Proxy
          - containerPort: 6380
            name: envoy
          # Envoy Admin
          - containerPort: 8001
            name: admin
        resources:
          limits:
            cpu: 500m
            memory: 512Mi
          requests:
            cpu: 300m
            memory: 256Mi
        volumeMounts:
        - name: envoy-config
          mountPath: /etc/envoy

...
```

- Envoy Listener/Filter 및 Cluster 구성 내역 (envoy.yaml)

```yaml

# Admin 설정
admin:
  access_log_path: "/dev/null"
  address:
    socket_address:
      address: 0.0.0.0
      port_value: 8001
static_resources:
  # Listener Port address 설정
  listeners:
  - name: redis_listener
    address:
      socket_address:
        address: 0.0.0.0
        port_value: 6380
    filter_chains:
    - filters:
      # Proxy Filter type 정의
      - name: envoy.filters.network.redis_proxy
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.filters.network.redis_proxy.v3.RedisProxy
          prefix_routes:
            # route target cluster 정의
            routes:
            - cluster: redis-envoy-001
              prefix: ""
              # request mirroring target cluster 정의
              request_mirror_policy:
                - cluster: redis-envoy-002
                  exclude_read_commands: true
          stat_prefix: egress_redis
          settings:
            op_timeout: 5s
            enable_redirection: true
  # target cluster 에 redis standalone service list 정의
  clusters:
  - name: redis-envoy-001
    connect_timeout: 0.25s
    type: STRICT_DNS
    lb_policy: MAGLEV
    load_assignment:
      cluster_name: redis-envoy-001
      endpoints:
      - lb_endpoints:
        - endpoint:
            address:
              socket_address:
                address: redis-envoy-001
                port_value: 6379
  - name: redis-envoy-002
    connect_timeout: 0.25s
    type: STRICT_DNS
    lb_policy: MAGLEV
    load_assignment:
      cluster_name: redis-envoy-002
      endpoints:
      - lb_endpoints:
        - endpoint:
            address:
              socket_address:
                address: redis-envoy-002
                port_value: 6379

```

### Unsupported Command

Proxy 를 통한 Redis 접속 시, 서버에 안정적으로 해시 할 수 있는 command 만 지원하며, AUTH 및 PING은 예외. 지원되는 다른 모든 command 에는 key 가 parameter 로 전달되어야 하며, 지원되는 command 실패 시나리오를 제외하고는 원래 Redis 명령과 기능적으로 동일.  

예를 들면, hello / info / keys 와 같은 command 는 지원되지 않으며, flushall 과 같은 parameter 없이 동작하는 delete All command 를 지원하지 않음.
| <u>*Dynomite 의 경우에는 keys command 는 지원됨*</u>

```
~ redis-cli -p 6380
127.0.0.1:6380> keys *
(error) unsupported command 'keys'
127.0.0.1:6380> hello 3
(error) unsupported command 'hello'
127.0.0.1:6380> info dir
unsupported command 'info'
127.0.0.1:6380> flushall
(error) invalid request

...
```

> Envoy Redis Proxy Supported Command 참조
<https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/other_protocols/redis.html#supported-commands>

## Proxy Request Mirroring

Envoy Redis Proxy 의 경우, datacenter replication 을 통한 consistency 유지 보다는, partioning / sharding 등의 data 분산 처리에 더 적합할 것으로 보임

### Redis Read Replicas

- prefix 를 통한 data 분산 및 read replicas 제공 방안

<img src="https://www.plantuml.com/plantuml/svg/~1eNp9ULtuwzAM3PkVB-0G4o4egvSRKeiSjEUHJmILoZZsSErToPC_F5b8SIK2G3k8Hnm3CpF9PNqa1L22xilwAPcVqcfaiIsJOaSSXKMFar3ZJVA-Ar4JeFm7z-b8mqC-IkBz5D0HgdqKNgHPHKL4tOV7wKaegKyYSVtpa3PgMNByky5cCj5Jyz5acTHMeovF3Q1tbdu6OYtckUoCOupGHw-Dj32-EmLj-V2gdrlIwx6U6d2_KfmD_-YldZRzRLGc_FXwwppS5Ch0c3LFMsdY4eRNFEpNXpmTG8CBP2ZQofXyZr4qPYf0O7WcqDIGRRf6KK6Mj_qDyux4VLsZlLQSp4-2_gH2xMn6" alt="PlantUML Diagram" style="max-width:100%;background:white;padding:1rem;" />

- 구성 내역
```yaml
...

static_resources:
  listeners:
  - name: redis_listener
    address:
      socket_address:
        address: 0.0.0.0
        port_value: 6380
    filter_chains:
    - filters:
      - name: envoy.filters.network.redis_proxy
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.filters.network.redis_proxy.v3.RedisProxy
          prefix_routes:
            routes:
            # prefix 별 request mirroring
            - cluster: redis-master
              prefix: "departments"
              request_mirror_policy:
                - cluster: redis-departments
                  exclude_read_commands: true
            - cluster: redis-master
              prefix: "employees"
              request_mirror_policy:
                - cluster: redis-employees
                  exclude_read_commands: true
          stat_prefix: egress_redis
          settings:
            op_timeout: 5s
            enable_redirection: true
  clusters:
  - name: redis-master
    connect_timeout: 0.25s
    type: STRICT_DNS
    lb_policy: MAGLEV
    load_assignment:
      cluster_name: redis-master
      endpoints:
      - lb_endpoints:
        - endpoint:
            address:
              socket_address:
                address: redis-master
                port_value: 6379
  - name: redis-departments
    connect_timeout: 0.25s
    type: STRICT_DNS
    lb_policy: MAGLEV
    load_assignment:
      cluster_name: redis-departments
      endpoints:
      - lb_endpoints:
        - endpoint:
            address:
              socket_address:
                address: redis-departments
                port_value: 6379
  - name: redis-employees
    connect_timeout: 0.25s
    type: STRICT_DNS
    lb_policy: MAGLEV
    load_assignment:
      cluster_name: redis-employees
      endpoints:
      - lb_endpoints:
        - endpoint:
            address:
              socket_address:
                address: redis-employees
                port_value: 6379

...
```

### 기타

MongoDB / Postgres 등의 Proxy 또한 지원한다.


## 성능 측정

Redis 의 기본 성능과 Proxy 를 통한 성능 비교.

### Redis Benchmark
Redis 자체적으로 제공하는 RedisCluster 및 Sentinel 장비에 대한 성능 측정 도구

#### Environment
- AOF persistence 에서 측정
- Storage 의 경우, ReadWriteMany 가 가능  NFS 기반 Storage Service 를 활용

Category    | Value       
------------|-------------- 
Redis CPU         | 0.3 / 0.5   
Reids Memory      | 0.5Gi
Storage     | Amazon EBS (General Purpose)
Redis Persistence | AOF (everysec)

#### Result
Proxy 를 통하여 benchmark test 수행한 결과, 기존 성능에 비해 50% 정도 감소된 성능으로 측정됨.  
대체적으로 10000 tps 이상 처리가 가능한 것으로 보여, Application 에서 활용할 때에는 2000~3000 tps 정도를 처리하는 데에는 문제가 없을 것으로 보임.

- Redis Benchmark
```
redis $ redis-benchmark -q -t get,set,lpop,lpush
SET: 20815.99 requests per second, p50=0.311 msec
GET: 20370.75 requests per second, p50=0.327 msec
LPUSH: 21781.75 requests per second, p50=0.303 msec
LPOP: 21810.25 requests per second, p50=0.295 msec
```

- Dynomite Benchmark
```
dynomite $ redis-benchmark -p 8102 -q -t get,set,lpop,lpush
SET: 14830.19 requests per second, p50=0.887 msec
GET: 19623.23 requests per second, p50=0.583 msec
LPUSH: 14898.69 requests per second, p50=0.879 msec
LPOP: 14909.80 requests per second, p50=0.879 msec
```

- Envoy Redis Proxy Benchmark
```
envoy $ redis-benchmark -p 6380 -q -t get,set,lpop,lpush
SET: 9100.01 requests per second, p50=0.767 msec
GET: 11132.14 requests per second, p50=0.727 msec
LPUSH: 9426.85 requests per second, p50=0.823 msec
LPOP: 9912.77 requests per second, p50=0.839 msec
```


### Application 부하 Test

#### Environment

- TPS 1000 이상의 성능이 나오는 적정 환경에서 수행
- nGrinder Agent 2ea

Category    | Value       
------------|----------- 
Spring CPU  | 0.5 / 2
Spring Memory | 2048Mi
Redis CPU         | 0.3 / 0.5   
Reids Memory      | 0.5Gi
Storage     | Amazon EBS (General Purpose)
Redis Persistence | AOF (everysec)
Ramp-Up     | Enable

#### Result
동일한 부하 상황에서, 1000tps 정도의 처리는 Sidecar Proxy 를 통하여 정상적으로 처리 가능할 것으로 보임.  

Dynomite vs Envoy 를 비교했을 때, data sync 결과는 모두 특이사항이 없으며, 테스트 결과에서는 dynomite 의 replication 방식이 조금 우수한 것으로 보이나, 크게 차이는 없을 것으로 예상됨.

- Redis Write Only

 vUser   | Threshold | TPS  | Count | Sync  | Comment
---------|-----------|------|-------|-------|----------
 1000    | 2min      | 1063 | 115000 | -     |
 2000    | 2min      | 1089 | 117000 | -     |
 3000    | 2min      | 784  | 81000  | -     | Application 성능 저하 구간 (cpu 최대)

- Dynomite Sidecar Replication

 vUser   | Threshold | TPS  | Count | Sync  | Comment
---------|-----------|------|-------|-------|----------
 1000    | 2min      | 1038 | 114000 | 100%  |
 2000    | 2min      | 865  | 92000 | 100%  |
 3000    | 2min      | 1138 | 120000 | 100%  | Application 성능 저하 구간 (cpu 최대)

 - Envoy Proxy Request Mirroring

 vUser   | Threshold | TPS  | Count | Sync  | Comment
---------|-----------|------|-------|-------|----------
 1000    | 2min      | 1054 | 114000 | 100%  |
 2000    | 2min      | 650  | 69000 | 100%  |
 3000    | 2min      | 677  | 71000 | 100%  | Application 성능 저하 구간 (cpu 최대)

