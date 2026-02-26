---
title: Standard
---
---
title: Standard
date: 2021-11-08
---

## cluster name
- hcpcq

## domain name
- *.hcpcq.kubepia.net

## project(prefix) name
- hcp-sre

## namespace 구성
Type | Namespace | Detail
-- | -- | --
CICD | hcp-sre-argocd | argocd 배포 위치
CICD | hcp-sre-argo | argoworkflows 배포 및 workflow 생성 및 실행 위치
CICD | hcp-sre-harbor | harbor 배포 위치
CICD | hcp-sre-gitea | gitea 배포 위치
Mon/Alert | hcp-sre-prometheus | prometheus
Mon/Alert | hcp-sre-alertmanager | alertmanager
Mon/Alert | hcp-sre-grafana | grafana
Mon/Alert | hcp-sre-loki | loki
Apps. | hcp-sre-apps | Task, Monitoring, Summary Service 배포 위치

## harbor project 구성
Type | project name | Detail
-- | -- | --
Cluster Initialize | hcp-sre-cluster | cluster 설치에 필요한 모든 이미지 repository
Apps. | hcp-sre-apps | Task, Monitoring, Summary Service 이미지 repository

## git repository 구성
- organization name : hcp-sre-cq (원래는 hcp-sre 로 하려고 했으나 github 에서 사용불가라서)

Type | repository name | Detail
-- | -- | --
Cluster Initialize | hcp-sre-cluster-init | cluster 초기 setup deployments repository, 폴더는 클러스터별로 생성됨
Cluster Deployments | hcp-sre-cluster-deploy | service delpoyments repository, 폴더는 서비스별로 생성됨
Apps. | hcp-sre-apps-task | Task repository
Apps. | hcp-sre-apps-monitoring | monitoring repository
Apps. | hcp-sre-apps-summary | summary repository

## domain 구성
- sre application 은 1개 도메인을 사용한다.

Type | name | url
-- | -- | --
CICD | hcp-sre-argocd | argocd.hcpcq.kubepia.net
CICD | hcp-sre-argo | argo.hcpcq.kubepia.net
CICD | hcp-sre-harbor | harbor.hcpcq.kubepia.net
CICD | hcp-sre-gitea | gitea.hcpcq.kubepia.net
CICD | hcp-sre-grafana | grafana.hcpcq.kubepia.net
CICD | hcp-sre-prometheus | prometheus.hcpcq.kubepia.net
Apps. | hcp-sre-apps | hcp-sre-apps.hcpcq.kubepia.net

## Service Endpoint 구성
- 별도의 gateway 역할을 하는 서비스를 생성하지 않고 k8s ingress 를 이용해서 endpoint 를 관리한다.
- cluster 간 gateway 역할도 k8s ingress 를 사용하여 endpoint 를 관리한다.

<img src="https://www.plantuml.com/plantuml/svg/~1eNp9kLFOwzAQhvdIfodT9wwMrFWFYI_EwBid7FNq1T679qUCqm48DgsDL4V4CBSiEjelzZb7v7vP-ldZMEnvnapUlTU6ghtV5Y3liAk9NJjEahuRpUFjLHdwW-Z34bmYixVHsHiktLOa4IFNDJYFvj7fv98-FoODgyFY6wh7VQEAYEcscP_UtK9978qZ5S5Rzu1aR1Udpk29Pd0tOL0dFEOUSAty5wgwxjYngj2MybSYx2e2gnlzKfOBrYRkubtE5N57TC9H8fDp4BxpsYEzxGBmgnn6n2LO_EmG8PBbh6qOpUGd6uVpXcXPWTqWdDKA2tTLWR9XgPLFV7CimfL0CE29nF-diNI0OztBhWdFbHrvfgBHSO92" alt="PlantUML Diagram" style="max-width:100%;background:white;padding:1rem;" />

Type | name | url
-- | -- | --
Apps. | hcp-sre-apps-task | deployment 만 실행
Apps. | hcp-sre-apps-monitoring | deployment 만 실행
Apps. | hcp-sre-apps-summary | deployment 만 실행


## application 배포 구성

<img src="https://www.plantuml.com/plantuml/svg/~1eNqdkM1qwzAQhO8CvcOSuws9FIopJi2hZ996NIskO8KypOgH1336okQ0VlPn0MvC7gyzzLf3AV2Ik6KEEs9QCXikxI9SW3Q4QYsuSCYt6tAi51IP8LTW38zn6h5kUAJ2r9YqyTBIo-EgrDILvCsz79KPw0fbfcWooGpA6sEJ77sjs1ADcwKDALT2gZK1VDrZqVDZKekB_UhJmmlDN5i573JgDS5qmI0be2VmSkr1pYJBBqjPkymjxW9H1WSHjf4ICyZWN450YHzV4rLjlcT98vyC6d_l4aZ9Ttxon9U77bPjj8DJcNkvJYmre4tVmXdm5RfNNkjla9XA-Ox_-CRlLzSPk_oGMnfsrg==" alt="PlantUML Diagram" style="max-width:100%;background:white;padding:1rem;" />

## Deploy Repository 구성
- base 폴더는 chart 파일을 관리하고 차트 버전별로 폴더를 구성한다.
- template 폴더는 base 폴더의 특정(최종) 버전을 사용하도록 설정이 되며, 실제 배포용 파일로 사용한다.
- cluster 별 폴더는 배포되는 클러스터를 구분한다.
- cluster - project - apps/pvcs/jobs 형태로 폴더를 구성한다.
- cluster 폴더와 template 폴더 하위 구조를 일치시켜서 상대경로에 대한 오류를 방지한다.
- github : https://github.com/hcp-sre-cq/hcp-sre-cluster-deploy

1depth | 2depth | 3depth | 설명
-- | -- | -- | --
base | | | base 저장소 root
base | apps | | application root
base | apps | python-backend-v1.0.0 | python backend deployment yaml
base | apps | springboot-backend-v1.0.0 | springboot backend deployment yaml
base | apps | springboot-module-v1.0.0 | springboot module deployment yaml
base | jobs | | job root
base | jobs | job-v1.0.0 | job deployment yaml
base | pvcs | | pvc root
base | pvcs | pvc-v1.0.0 | pvc deployment yaml
template | | | template root
template | project | | project root
template | project | apps | app root
template | project | jobs | jobs root
template | project | pvcs | pvcs root
hcpcq-aws | | | cluster root
hcpcq-aws | hcp-test | | project root
hcpcq-aws | hcp-test | apps | apps root
hcpcq-aws | hcp-test | jobs | jobs root
hcpcq-aws | hcp-test | pvcs | pvcs root

## Cluster Initialize Repository 구성
- base 폴더는 chart 파일을 관리하고 차트 버전별로 폴더를 구성한다.
- cluster 별 폴더는 배포되는 클러스터를 구분한다.
- github : https://github.com/hcp-sre-cq/hcp-sre-cluster-int

1depth | 2depth | 3depth | 설명
-- | -- | -- | --
base | | | base 저장소 root
base | argo | argo-workflows-v0.8.1 | argo-workflows chart
base | argocd | argo-cd-v3.26.5 | argo-cd chart
base | argowf | argowf-v1.0.0 | argowf chart
base | common | | 공통 설치 deployment
base | gitea | gitea-v4.1.1 | gitea chart
base | harbor | harbor-v1.7.3 | harbor chart
hcpcq-aws | | | cluster root
hcpcq-aws | argo | argo-workflows-v0.8.1 | argo-workflows chart
hcpcq-aws | argocd | argo-cd-v3.26.5 | argo-cd chart
hcpcq-aws | argowf | argowf-v1.0.0 | argowf chart
hcpcq-aws | common | | 공통 설치 deployment
hcpcq-aws | gitea | gitea-v4.1.1 | gitea chart
hcpcq-aws | harbor | harbor-v1.7.3 | harbor chart