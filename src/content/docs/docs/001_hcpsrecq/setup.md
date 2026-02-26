---
title: Setup
---
---
title: Overview
date: 2021-11-07
---

## Deployment View

<img src="https://www.plantuml.com/plantuml/svg/~1eNp1kD1uwzAMhXcDvgORCxQdugdBD5Cpq8FIjExYElWKhhMUuXthpD-B7XD8HslHvn01VBtTbJu2qQ4jwWvb1IFzQcUER1RjxwWzHdF7zgHeHvWDXB64sUWC3TuVKNdE2eCDadrNu7N4gt4V9wlfbQMAoOQMc4gEjp3_pXNhmEdRg3TOb-JJdDhHmepS7VFPoksa2Ajv8LY0r0odlrL2_xE6wzo805JkNlHO4VlHHVNCvc4RbNpHCS__W9ZXUMRq7FYfKZ4x4xIXlUTW07gKZuDTRj9GUkuYMdAqtCgD_x19mx_YU_Zjit_g9qT-" alt="PlantUML Diagram" style="max-width:100%;background:white;padding:1rem;" />

## Cluster Management
- argo-cd 를 사용하여 클러스터 설치에 필요한 환경을 구성한다.
- 설치에 필요한 manifests 파일을 git repo 에 구성한다.
- 설치는 argo-cd app sync 를 이용한다.
- 클러스터에 설치 작업시 직접 k8s cli 로 설치하지 않도록 한다.

<img src="https://www.plantuml.com/plantuml/svg/~1eNpdjrFqAzEMQPcD_4PIHkOHLhlKaOdC_iCots4RsWVj60j79-VKktq3macn-R2bYtUlRTOZqTmMBC9maleWghUTnLAqOy4oekLvWQK89vP3_N1xZY0Eu4-4NKUKnygYKJHobj3vcipZSBQCq5kkK0HlcFE4QELhmZq2XsMa8tn5jbpS5wFLiexQOct4_G_rlut1jvnWDy5Yv3LddBD2gCI2ZTc4FWeU0VJnrV1_Dayw9_v_UjPdn2C9fRtb4ACeSsw_G-nRNcB72sCedaP5CBzdZ-ORxC8p_gIp1qNX" alt="PlantUML Diagram" style="max-width:100%;background:white;padding:1rem;" />

## git manifests 구성
- 배포에 사용되는 manifests 파일은 helm chart 와 kustomize 를 사용한다.
- helm chart 는 helm repo 를 사용하지 않고 git 에 chart source 형태로 관리한다.
- helm chart 는 버전을 관리할 수 있도록 폴더를 구성한다.
- cluster 내 컴포넌트에 공통으로 설치할 manifests 는 common 으로 관리한다.
- argo-cd 는 kustomize build 명령을 수행하고 kustomize 가 helm template 명령을 수행한다.

<img src="https://www.plantuml.com/plantuml/svg/~1eNptUctq20AU3Qv0D5fsCrGSLLrxooTmB_IBhTAejeTB8xAzV0nTUghUlNIUGkiNQ7HBgTSU4kWaB7i0X2SN_6HIlhLJ7vKec7nnnnN2LRKDqRS-53uWEsFgx_dsj6uEGCJhnxjklCdE4T4JQ65ieF7nX-rXNRw5CgYbMUeQRPGIWbQbxWXDKBIVCwYF99b3AAAiLhhQLaVWS0BpZGB43EVoQ_7zR34-Bvfnfv5lkmef55-mbnAGLrtyvy_c6RBmdw_zDw9u-De_HMK8n7lvX-f9Icxu38MrBS1wFx-fAQoLbjR11yOXDTfBMmoYbgLVKuKxJAnk579q33SZkLVfBIsWr9xmbpzld1mhNLs_ya8nhcRWl5iONgeHO8F2sL0U3UImE0GQ2eW81yUGg2MixXI-JCJldgHUZHupRS35G_afHB656krtBLSBitQiM1B-l59e5d-ni5TGfTc6ATeYzKY3bnDme--KJqiWiVZMIRAT6wMa-l5DrkBpCCRJwB4r2iyvEisLXLl1pE0vEvpolVzGtIrGHBlZBZkgFjld2zUkImp9G2kQBKWxojpoha2nwKC96BOqShbmpVZrWx1ime89IQVfplMvADopF2GhVZFBGLxY9d7gKusNsHTewB6NNzcr383d0rbv7TIVplL8AzV2YVo=" alt="PlantUML Diagram" style="max-width:100%;background:white;padding:1rem;" />

## argocd apps in app 구성
- argocd application 생성은 UI 와 cli 로 생성이 가능하다.
- aroocd application 도 git repo 로 관리하기 위한 목적으로 apps in app 을 사용한다.
- argocd_app_init 이 다른 argocd application 을 생성하는 역할을 한다.
- argocd application 을 빠르게 복구하는데 도움이 될 것이다.

<img src="https://www.plantuml.com/plantuml/svg/~1eNqFkb1OwzAUhfdIeYer7q3EgIQ6oIon6BtEF9tNrTq2Zd-qIMREN2bEhMQAGwwdkHgmGt4Bhfw5kChTIp9zru93vPCEjraZiqM48gyVgJM48hupLTrMYImOJJMWNS2Rc6lTOA31C3MVnJMkJWCCLjWMA1rrQeriC18fb_n-MClucYIR6lQJKHwJ43ATRwAAmApNUIYTtDaRWlIpaUMCnEzXBHM43r8cXz-hvUVJhiSNhvzuKd8fIH98_354Hhha_O6M26yU2Q1Y1ugujRsQU0kCBzSh0JNkQ0mHK9SDWWKz2SyObsOGmNp6Eq5uiJnMGl0Hky5GK4b7t6fB4u1hZ-PAG64auNsd4-jPQ8GUT8-HioY5MCeQRM-rjU-qecZ8FeGYrWEenVe3MDqx6qXj7PA3iSSohAurzDVsznwnWOKWkR70X8pS_Q9csZVyH2jFVOV7AEuWakDDtRCabzP1A8Xwcrg=" alt="PlantUML Diagram" style="max-width:100%;background:white;padding:1rem;" />