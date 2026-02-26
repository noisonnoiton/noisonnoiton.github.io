---
title: Platform API
---
---
title: Platform API
date: 2021-11-07
---

## Deployment View
- Platform SRE Application 은 python 으로 개발되고 DWP 에 REST API 를 제공합니다.
- 별도의 Gateway 없이 k8s ingress 로 Endpoint 를 관리합니다.
- 클러스터에 대한 변경작업은 모두 argo_workflow 를 실행합니다.
- argo_workflow 의 작업은 대부분 CLI 방식으로 실행됩니다.
- CLI 방식을 제공하지 않는 기능일 경우 REST API 를 사용합니다.
- 실시간 모니터링 기능은 python SDK 를 이용하여 직접 k8s 를 조회하여 데이터를 제공합니다.
- 다량의 데이터를 summary 해야 하는 경우 redis 에 데이터를 적재하여 제공합니다.

<img src="https://www.plantuml.com/plantuml/svg/~1eNp9k19LwzAUxd8L_Q6XvXfggzCKjKnzQfShONEHkXJNsjY0f2qSMqfsu0uX1abd5mPu7-Tc3JNkYR0a10gRR3FkCQoGF3FkK65qNCghQ-M44TUqlyGlXBVwGfIb_RXUHXeCwWTJaqG3kikHL5xtJq230pRBSWr4iSMAACxavHzN8u-mEWGNq8Iwa3MiGuuYCZFhlNs42vV25LMzNIw4VIVgQDihXbXfi6bQOaHjconmQ5uT4o021VrojYe7cRtrWI51fdzpAHKHtjrHpFbcacNVcU5hGynRbMe4S8caNjiXp9XMx-NXBXdt9F3IkJhkPo4XUni6Wz3DdXbfasc0ocGWfc9g4elw3LM4nHggeis5pUy9h-K_4eMotPeOg8sZnH9IkmTeRgAp3D4ew9bJX_4_gsOjGSgIhatpMz1YS1R8zayzPd3vrGYWUqD7nxCO0ccQ6uqtK7WC5UMvPERwQrU6KWuSuf8fkEJXpOiwbb5gijZS_AJNPT8l" alt="PlantUML Diagram" style="max-width:100%;background:white;padding:1rem;" />

## Task Process flow
- App. 생성, App. 빌드, App. 배포 기능을 시퀀스 다이어그램으로 보여주고 있다.
- argo-cd 와 argo-workflow 는 비동기 방식으로 수행된다.
- 그림상에서 비동기 수행의 경우 화살표 뒤에 동그라미(o) 표시가 되어 있다.
- 비동기 수행에 대한 상태와 결과를 조회할 수 있도록 별도 조회기능이 제공되어야 한다.

<img src="https://www.plantuml.com/plantuml/svg/~1eNq1lMGKwjAQhu-FvMPgvYILC0tZRPYJPOy9jMlYQ9MkZBLdvv3SWpfWVVwXvZSQyTd_-P9MVxwxxNQYkYmMJRqChci41tZjwAbWGKKW2qONa1RK2wpex_UP9zXajzoagtkncg3r4CQxw9a4w6zrjik6m5oNBZFpWwViLjkQ5EvgQCV6X8YOLEAGwkiA3s9FNqnlSwcYKlceXKi7zlBASHZEwKkiMpRR7_vtMSEyADhr8p5DpSMU_VcaZwnYpSAJIjXeYKRLVL4cUT7xboD-qNCg1VviyHeK_HCXjw8GSQVFv-pN4dZKkSm6ZskJmaidXXNyqn5jKECRN67tm0k15DUOGhaLm1nru3LWj833iuPn0pukjfoPopysKYBusLoG7jBsXIDiGO4UuB7YxOWX2y6ru1xWj3L5xlv9pd44pbct7NEk4nmL3X_pCTNxtOPZUzGMw4qsSo35Bh0U1-8=" alt="PlantUML Diagram" style="max-width:100%;background:white;padding:1rem;" />

## Monitoring Process flow
- argo-cd 와 argo-workflow 는 비동기 방식으로 수행된다.
- 비동기 수행에 대한 상태와 결과를 조회할 수 있도록 별도 조회기능이 제공되어야 한다.
- argo-workflow, argo-cd 는 현재상태를 조회할 수 API 가 제공된다.
- argo-workflow, argo-cd 는 REST API 와 Server-Sent-Event(SSE) API 가 모두 제공된다.
- 그외 상태를 조회하기 위해서는 k8s 를 직접 조회하는 방식을 사용할 수 있다. 

<img src="https://www.plantuml.com/plantuml/svg/~1eNqNjctKBEEMRfcF9Q9hVuNiBBeCzGIYRRciQkN_QBOrYlN0vUhSjp8vJT56ITLLe5Jz71EUWVuK1lgjDiPBlTWyhFyRMcGArMGFilkH9D7kGa7X97vyvuIaNBJsnksOWrjDgYsjEXiN5bTpG9i05JZeiK0JeWYSmYQJdgcQpglrndKvvodVcEyoBFjrpTV_PO8OgDyX6VR46Xuwh5kUfqIoahPYjuMD3A6PF_-WOP-l9-T85-rZDcuNfNtdi2WGbWfj_dO5Dr1R1rVlzZGybyl-AAXokz8=" alt="PlantUML Diagram" style="max-width:100%;background:white;padding:1rem;" />

## Summary Process flow
- 다수의 데이터를 이용한 화면 구현이 경우 개별 REST API 로는 기능 제공이 어렵다.
- 예를들면 Application 목록을 보면 배포상태와 deploy상태를 여러개 같이 보여주고 있다.
- 이럴 경우 필요한 데이터를 redis 에 미리 수집해서 보여주는 방식을 사용한다.

<img src="https://www.plantuml.com/plantuml/svg/~1eNqN0M1qAkEMB_D7wr5D2JM9tOBBkB7ElvYgvSzsAyxxJl2GnS-STNW3lwEVL0WP_yS_BLIVRdYSfNu0jRj0BMu2kdnFjIwBemR1xmWM2qO1Lk6wuu9_puNdXZ16gm4oISCfoOdkSAR-fTp09QAWTbGEPXHbCNOIOY9yGX7dAPKUxkPiuQJ4h4kUblEUtQgshuEbPvrdy_8bjL3YmowFzPntOT6v5Uqr8WmCRa0NXz9PAfqjqA8Ik3UViSYmsKhYP7OlaEvwZ3dihOA=" alt="PlantUML Diagram" style="max-width:100%;background:white;padding:1rem;" />