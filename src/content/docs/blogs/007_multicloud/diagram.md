---
title: Multi Cluster 구축
date: 2021-09-17
categories: 
- Multi Cloud
---

- 구축 목표
    - Control Plane 과 Data Planes 으로 구성한다.
    - Cluster 에 설치되는 기본 컴포넌트의 설치를 자동화 한다.
    - Cluster EndPoint 관리를 자동화 한다.
    - DWP 에서 Cluster Resource 제어시 Task Runner 를 적용한다.
    - DWP 에서 Cluster Resource 제어시 async, non-block 을 적용한다.
    - DWP 에서 Cluster Resource 제어시 status monitoring 을 적용한다.
    - Access Log 를 Application 외부에서 처리하거나 최소한 Redis 직접 접속은 제거한다

- task list
    - App CI
    - App CD
    - App Pod  실행
    - SRE Component 

## Deployment Diagram
### Site A
- Site B 에서 사용하는 컴포넌트만 표시함
- Docker registry 로 Harbor 를 사용함
- Task 기반 비동기 처리를 위해 TaskAgent, TaskRunner, NotifyAgent 를 사용함 

<img src="https://www.plantuml.com/plantuml/svg/~1eNp9kstqWzEQhvd6CuHssogJdBXcQ9Lj0jpg--BjKKVkoSNNTlTrYiSdppd411UayAt00e67yCLQQN8odd6h6GLHF9LdzDf_zK8ZdGgdMa6RAiEBNSiGMMb44jnOtdAGX8QUdyz_DAf7z7JORejkYGdoiKohm3_7cf_7-_zP7cP1r79frx4u7zptL8g6bd-QPdX-FoTQ59n93c385-3_2kGx9CxkgDqiagG4lWsptcIlmA-cQgsTi6mWEn8Jdu_KcnjimbU6grypIBDaVJBQdxAJU6mpPy5il3RTNFuz67XzbnThlC1cBvCxsaFD-SjCF9xVDZ2AC4VqkcXiMTck8PfckIheE1NpE-BZCPGODqdFM6Q0A9wqBHGnRktcCKLirmd0mh6x8shCG0dEqE9DmCTB5k1c7Xz6iLqJsQRnmwPHxE7WTuw8WBnqBUc1qLirrxKfLTdYCgfa8dNPj1IV8ifEfuqoUQrMcqwJ6bb0yNQ67wYZMbWmbFvS7w168TNIrrjeFhTDcvxq9LI8iYezrjZg12TxMMlgb283TtqEi9bNK_aJIjWwtUPKxFZuOQLG42cyPkrGM4QOQbFGin8BGysz" alt="PlantUML Diagram" style="max-width:100%;background:white;padding:1rem;" />

### Site B
- Control Plane, Data Plane 으로 구분
- Platform Plane 과의 통신을 TaskRunner 를 이용
- Docker registry 로 Harbor 사용
- Gitee 는 사용자 git repository 로 사용됨
- Platform 에서 배포에 사용되는 source 는 Bitbucket 을 사용함
- Cluster 컴포넌트 관리를 위해 ArgoCD 를 사용함
- Monitoring/Alert 컴포넌트는 long-terms 와 short-terms 를 구분함

<img src="https://www.plantuml.com/plantuml/svg/~1eNp9kcFuEzEQhu_7FFZ6AaQ2QuJUhVWrbVUi1KZke0GFg9c7OFa84zC2AUFz4wRIvEAP5c6BQyUq8UYlfQdkOyWbJrCH1Xj-b3b-f71jHSfnG51lGiRgnTHG2NljVhhtiJ2lI-tZ9R62Hz7KexUX4-2NAXGUkM8-X1z_PJ_9urz5-v33xy83n6563QDkvW4YyP81_hy0Nm_z66sfs2-X_xsHrOe2MjQ1sE5h0JHR7FhzhA7jllViwj7EPQTCcZQaWOeE2zErgd4okSgXGgkLz2kAhh4R6OWtTN4jENswMdsC3SVpir2IcZJG1KvIYf-oP4hEo1CZVeB4UJ4cDPfLyEyMdZLALmHT-J4v2Np6kL50t3k7ejdv0e8We0uBhRJ1O_ARvPM2rsdQLYTSIKdnvoIo2nB67auW9yecKpN-0yiWq_EOlIM0L0O1JljL66FB5QwplN1dDeSi3cZg2-2-5tYpsVkCJzF6gfe0QbnpgBp7P-6BBLQsEH_Fka9BZVIW6FNVrSfHUWjdGpkG3Ai8XQNP_orzmNOsHZIjl1AvXUkz76Wcp0OoVboRClU2zbIdwNo3-g8i7in_" alt="PlantUML Diagram" style="max-width:100%;background:white;padding:1rem;" />

<img src="https://www.plantuml.com/plantuml/svg/~1eNp9krFKA0EQhvt7iiFptAhBsArnkURFQYIBK9EUk7vxstzubNjdIMSks1LBF7DQ3sIiYMA3isk7yN1FT-Tidjv_983sLtu0Do0bKel5kmLiyAMAmOzBvpbawCTfgm_FmBo7u4HfxzBpVE8NckzB8v558f60_JitHl8_bx9Wd3O_ngKBX0-FYJN-TlLq62Axf1u-zP7TiaP1sTzWEUHlAB1CVyJTBdBCPxrCTTbEUOiQY0lQaYtxHorxOkzXRRvDhDiqtXpF7Zik-i5M__bpaBZOG8FxvSXJuKyp0vy76aFE60RYOyM04eCSt-xAG1dzZJTd7qUC5UShHBm8QsYyNs6jgj0R_Q1okiUF2TVakRvQyJbRw5-0MLI7dZAxJlPmYJqrPC8sqRNRRqd1qOrsX6yfc-p5TeJopOQXsf3Olw==" alt="PlantUML Diagram" style="max-width:100%;background:white;padding:1rem;" />

## Cluster Management
- Cluster 를 새로 구축하는 경우 절차를 기술함
- Site Cluster 에 설치될 컴포넌트는 ArgoCD 로 관리함
- 배포 상태 관리는 ArgoCD Dashboard 를 사용함

<img src="https://www.plantuml.com/plantuml/svg/~1eNqdks1Ow0AMhO_7FFbuESo_Euqh6t-FAxJvgJxdky7drFdep2rfHrWkNJBCK672N5mdcaZZUbRtgjHZYiAYmbz2MaFgAy8o6q1PGPUFnfOxhofees7b01i9BoJiEdqsJPCMEWtqKGphzMwqH0diKt5Ckb0SzGDxdLNYFgYAIJ3MYO61au2a1FB0UPG2J5qD5ajCAVLASENxMZOaF8tyiXlVMYorADOg1Gydw7waCD75wXj9mF87q7PPcKj42xv22v3-S2iwVY5tU5HAqBwdBF0hUE5OgWEMtVdIbV7Brgl92e1QdgoFY7BCqARJ-J2sXoPaz2Ndgwolzl5ZdtfQmFLwFtVz7Ce4u5Ag76I9pN5DvU056W70k-mmPwq0K7JrbvUM1rvpEQTn397-xBylwLv_Gx5-lAtuHdNZ9Tq7v9BZw3F_Fh_rb18dVKtC2Iwhk2xIykxRS9pQVGOmFF3bhA-pe0-j" alt="PlantUML Diagram" style="max-width:100%;background:white;padding:1rem;" />

## Sequence Diagram
- 사용자 관점에서 필요한 프로세스를 Sequece Diagram 으로 작성

### Login SSO process
- 프로세스 설명
    - Site A 사용자가 A url 과 B url 을 사용하여 로그인 할 경우
        - case1, case2
    - Site B 사용자가 B url 을 사용하여 로그인 할 경우
        - case3

<img src="https://www.plantuml.com/plantuml/svg/~1eNqt0MFqwzAMBuC7n0L43kNadslhtDkPFihjx2E5Wmvm2MGSaR9_pGmWlHRlh12l39Inb1lMktx6pdgaT1Ao_nKhM8m0UJskzrrOBKlN07hwgKdZu4rnqSxOPIF-iQcXoE7RErNWCuMZNDsh2GkFAGCsxDSW4I0paTAM5iMzpUuim7bCfv86dJnjoql3kJOH9_o64dQtI9U8gn2EQgMYzzNZpX_biz975-xqYuPAHmcqkyWG3CIlKFaFGq6C1fNFByX4_ntUiELg6VOgBGuY-uCpG2LMEUowWY4UxFkjLgY1lKcxiRqXyEp_3OztZVkJnG3_-zea9Y0GH2nWCq8T8b4GRw3e0eBfNJtVofCBJrnDceRs_oWDC86WQpNb_w0_-fwM" alt="PlantUML Diagram" style="max-width:100%;background:white;padding:1rem;" />

### Create project process
- 고려사항
- 검토 필요 사항

<img src="https://www.plantuml.com/plantuml/svg/~1eNqFUrFOwzAQ3e8rTplgyFAklg5VW2BhQBGiYulyca6VSWxH9rm0M_wGH8F_9SOQaVFSQsV2evfu7r1nT4OQl2gagKCoYRxBqLVtyZPBgrxopVuyUlBVabvG61577rYdLFoaxqzw7oWV4P7tY__-mQGQEudxEdhD6baYBS2MM8yxbUhWzptUWM4AEbHtDuLtczHAbhbzuwH44ESvdrM1Wxn0nijU5zuP0Vr2g1Y211JGVbMs7UVw0Su-zJACHuoB_157ArYVlm4LQFGcjaZkj6N8BMk55pNkB8eoPJMwtoeUIIH5slOJY_TRolCooQPzSU9tn0JK9Cbt65mBHjWfHCUPL59hGVfp1Q4NJ_2_SMnmf4uOnNM1J5x82X8wHGNIydlvCCr-y1Kfn-bTL_gZNBwCrfkk9qtB7BvNrxiEJAaAKdsqmuYLokcDNQ==" alt="PlantUML Diagram" style="max-width:100%;background:white;padding:1rem;" />

### Create application process
- 고려사항
    - site 정보와 상관없이 application 을 생성을 할 수 있도록 한다.
    - DWP metadata 생성 및 source repository 를 개발자에게 제공하는 범위로 한정한다.
- 검토 필요 사항
    - TaskRunner 에서 발생하는 status 를 NotifyAgent 로 보내는 기술 검증 필요
    - TaskRunner 에서 발생하는 status 를 조회하는 기능 검증 필요

<img src="https://www.plantuml.com/plantuml/svg/~1eNqFkrFuwjAQhvd7ilOmdggSlbowIKDtWqGqqAvLkRxgJbEt-0xhbl-jD9H34iEqByKC0rTb5f8_5_fdeeKFnISqBPAZlYxD8IXSlhxVOCcnKlOWtMwpz5Xe4H3Lnpn9RRYlJWMytXaAx4-v4-d3AkCZGIcLzw5WZo-JV8I4xRRtSbI2roqF5gQQEe0lDR_f5h3tYTF76ojPRtT6MN2wlo73Sr7od16C1uw6VjJTsgpZwbLUN94El_FtguTxVP_NH6gqT3SsgHWOK7MHoCBGh2rFDofpEOJAMB3HLnGEmWMSRrJ2AFFJl5eb4whd0CjkC7iI6bjVQRuhTNQu_qzVILTQdHxuI8ZuOStMkEYRruJWuJc_XdOxNV6JcYc-0Aa_baZ1jcShtJPr757chv0n9YzVmfXMr_x02X4gOEIfV6JrCXL-bVxtPp6Pr645WLH3tOGrfd519rlT_I5eSIIHmLDOQ1X-ALT-Kek=" alt="PlantUML Diagram" style="max-width:100%;background:white;padding:1rem;" />

### Create helm chart process
- 고려사항
    - site 정보와 상관없이 helm chart 를 생성을 할 수 있도록 한다.
- 검토 필요 사항
    - TaskRunner 에서 발생하는 status 를 NotifyAgent 로 보내는 기술 검증 필요
    - TaskRunner 에서 발생하는 status 를 조회하는 기능 검증 필요

<img src="https://www.plantuml.com/plantuml/svg/~1eNp1UbtOA0EM7P0V1lVQHFKQaFJEeYBEhSJERJPGd-ckq7t9aNcbkhp-g4_gv_IRaBOhLLqks2fG6_HsOAh5iboDCDV1jAMIrTKOPGmckxdVK0dG5tQ0yqzxIaOndneGRUnHWDxzp3G2IS94-Pw-fP0UAFSL9bgI7KGyOyyCEsYJlug6kpX1OhWGC0BEdOed-Pg-72GzxfSpB75YUav9ZM1GetwbhfY68xqNYd-jiqmSKtYty9Lc7El3twVSwFQBmwYruwOgKNZEXbHHQTmAdCCWo-Qah1h7JmEk5-4gIeXy7ASH6KNBodDCGSxHmaNcQrWobXosM5wpy9HRV9q54bq1UU69sE4B8xXtyZ9nZ4MS6_eXZS6GzensnC6XeeQ4xJBCMUcIGr5kONen-fSPf4OaQ6A1_0v0vpfoVvEHBiGJAWDMpom6-wVbVu9F" alt="PlantUML Diagram" style="max-width:100%;background:white;padding:1rem;" />

### App. CI process
- 고려사항
    - TaskAgent 는 Target Cluster 를 Discovery 하는 기능 필요함
    - application source 는 사이즈가 크지 않으므로 site A 에서 checkout 받음
    - docker image 사이즈가 커서 네트워크 트래픽 문제가 발생할 수 있음
    - 네트워크 트래픽 문제로 docker repository 는 site B 에 위치해야 함
    - 네트워크 트래픽 문제로 docker build & push 는 site B 에서 수행해야 함
    - site 간 docker image 동기화 필요함
- 검토 필요 사항
    - TaskRunner 에서 발생하는 status 를 NotifyAgent 로 보내는 기술 검증 필요
    - TaskRunner 에서 발생하는 status 를 조회하는 기능 검증 필요
    - site 간 docker image 동기화 시간 및 간격 검증 필요

<img src="https://www.plantuml.com/plantuml/svg/~1eNqFk01v2zAMhu_6FYRP3cED0mEXH4Im2YD1MmQfxS650DKTCpYlQ6TS5N8PStxEjlv0JpOPyJev6AcWDBI7qxRrtAQzxa1xPQbsYI1BjDY9Ollj0xi3g69ZeukP17AYsQTFou8_w-qxUAq1-ABPTEHV_gAFGyFYQAm9Rdn60KWDo0IBAPTXTvDt33oSWz0tv0-CP72Y7XGxIyeT3F_k9u1MsTRSR92SbNwd-xg0fSoAGc7nCf8DQ-1DAs6nhSLXQO0P2VhLKEF7J8Hb96ZKgn5H5yhM56BD5Hf6TsJ_vMPwK9Z0kaEwinexqynArJypZDmU8-QjVBCig9Wjcl4ILG0FqvSZcuXm6tIACnKrrsFyPiIaw9rvKRxPXDgPk9GbbMi8IGoxexTKPVAZWs4H76EC_Uy69VFeX2OMjerX0dgGsO-t0SjGuxv4ZGuS7V-c9diANTV_XLDxuqWwNfa2-bAIFfSRnwcMTIe7W_DyRFCBEF9mGWHlJt9fqIDTe7pTSDX0lmc5n-6nn-L1YkfMSUm-DPflTA2iy81VPmt0Y_n5cgxYH7wm5sn9RSpwdHpcIO_6ZbKCe0MvwIISWakHck3s7H8O3IKb" alt="PlantUML Diagram" style="max-width:100%;background:white;padding:1rem;" />

### App. CD process
- 고려사항
    - Deploy 를 수행하는 시점에 ArgoCD Application 을 생성한다.
    - ArgoCD Application 도 bitbucket yaml 로 관리한다.
    - ArgoCD metadata 는 control plane 에 유지한다.

<img src="https://www.plantuml.com/plantuml/svg/~1eNqNUz2P2zAM3fUrCE_t4AJGWyDIEFw-CnQqgqKHLl4UmXEEy5Ih0mn87wtFvot8TtrbbPKRj--ReiKWnvvWCEFKGoRCUKNtJ71sYS89a6U7aXkvq0rbGr4m6Y273MKs2SBk6677BNtdJoRU7Dw8E3pxcBfISDPCGnLojOSj8234sJgJAIDuxgS73_tZbPu8-TYL_nCsj8O6Rsuz3C9Jzf1MttF86FWDXNoPg2zNxwwkQfj6N3bta7fdRbT0tbtWoK3g4C6JxA3koJxl78wjhWG4n7216GepSDILf5f-4OboZkFhmmZB6sEklWT5aIxmQa9VQvbsbN8e0EORFyLsDfJVWAYswfcWtjsRfvLy5u2YYUmNuAXz1QRRaVLujH644nyUnaDLxI60oVSsz5IxdUsk0Hz1ugVYgj6CdQx40cR0dfF6iXxCC6WFrqdTXHE0ONC-v5oGq2K1dYzgdX0Kyta1D6067xQSJZ3DPv7ftcLOuCH2fSNsHEudUDWu54iZQiamta7Sx-EebOx005-my_HcRtvjQNNZ8jJ9ZrAMigIVseSeRIX31pRWhA7h9cISKBxbi0SyxsnBfcmLxL274t9tfLi41NiE5nNeiIB4C_RIrvcKI4nBY-AIiBeCsSg-wqubxkDlVIMedHtPzfT5nDX-eXFMPKGt-tb8BfS31Bs=" alt="PlantUML Diagram" style="max-width:100%;background:white;padding:1rem;" />

### Helm CD process
- 고려사항
    - ArgoCD Helm application 을 생성하면 ArgoCD 가 helm chart 를 배포해줌
    - ArgoCD helm app. 역시 bitbucket repository 로 관리함
    - helm app. 내 parameter 설정으로 values.yml 수정함
- 검토 필요 사항
    - Async process 에 대한 status 조회 방안 필요

<img src="https://www.plantuml.com/plantuml/svg/~1eNqNU01v2zAMvetXEDltBw8ItgFBDkXzMaCnIRhW7OILIzOOYFkyRDqL__2g2G3kOul6s8lHPr5H8ZEFg7S1VYo1WoK54sq4BgPWsMMgRpsGneywKIwr4XuSXvvzNSxGLMFsS431HTyRrWFzxCAzpVCLD_DMFNTen2HGRghWkEFjUQ4-1PHD0UwBADRXTtj-2U1im-f1j0nwpxdz6FYlOZnkfiNXtzOztZF9qyuS3H3qsLafZ4AM8et97CqUfrPt0RhKf6kgV8DenxOJa8hAeyfB23sK43C_WucoTFI9yST8hGHvp-hqwXGaasH6ziQFCt4bo1rwa5XCVrxr6z0FmGdzFfcG2UNcBiwhtA42WxV_svzq7ZAR5Epdg9nDCFEY1v5EobvgQi87QeeJHWlD1GJOKJS6pRJo9vC6BViCOYDzAnQ2LHxxcdU0X0CO5CB30LR87FfcGxxpP17NndN9tfNCEEx5jMpWZYitmuA1MSed4z7-37Xoj-bS942wYSx9JF35VnrMGDIyrfaFOXS3YEOnq_40nQ_PbbC9H2g8S5anZwbLqChSsaC0rAq6taa0InaI1wtL4PjYamLGkkYP7ls2T9y7Kf7DxscXlxqb0HzN5ioi3gIDsW-Dpp7E0iFyRMQLwVDUH-HFTWuh8LqiAKa-pWZ8PidDf18cU4_kira2_wC34thK" alt="PlantUML Diagram" style="max-width:100%;background:white;padding:1rem;" />

## ETC
- TaskRunner 로 사용 가능한 Open Source 정리

### Argo Workflow

<img src="https://www.plantuml.com/plantuml/svg/~1eNp1U01LAzEQvc-vGDwKjXgQpAdxtSgFP4oWPMfsdAnNJksyoYL43yXd3TS03dvmvTd5kzez94Gl59gagKCkIbyGsNW2k162uJKetdKdtLySda1tgzcF_eB-DjBrNoQXlW8cfjm_3Ri3uwCQDVnGtQzbKn2BJ8XSNoYwKUch_gIiYi8ewTW1nZFMe0o5Y0ixdjZkwQkxWVH5JrZkORQ2n0xdcVxUz8Xp0VmW2pIvC5TXHRfABwUXvertUlQbqRhfl2_L95MOlraLg30Jv0fOeC1ZfstA2LnAjacAf0Vc29swpFTWr1x9eunYV7oAIGePs3p2l8PDOfpocTdmmXEhLnOQOEdtlYk1FbwX7hBoochFIgp3MsXkRxvyZBUBpPDTTWetFtXzJFe4GOH2QzzbQiLTPee4WrjDgCcV_bgn6THks4IUUT_xSXqYfPm0oUII1y8RzjEGglF5jMPhDbPZ3X4V-qHC0PoRmjtOeN4RnKPylH6avTRxo8nOayZ8cc2TNnRVDQseAO7J1rE1_4n1aK8=" alt="PlantUML Diagram" style="max-width:100%;background:white;padding:1rem;" />

### Argo Event

<img src="https://www.plantuml.com/plantuml/svg/~1eNpdjj1vwjAQhvf7FSf2DB26MAGie0SRMl_tq-XG8UV3DlSq-O8VpBSH7f3Sq2djhbRMQwIwR4nxBayPeSSlAVvSEl0cKZeWvI854GtV7-T7EZdYEuNqq0Hw7cS5rADk44tdwX3X3uWBfTQYyfUUGK_j2xZ_ABHxb7QNKgc2mdTxItcg75xN9Dk9agyBFS6L6060_0xyfnqvGrgA7LsWG9_MaLjGgc0oMMz-2tQ8uMYUrWRWWMSNNjXfQ_43d8ZKz-81D2w4-2lIv13iios=" alt="PlantUML Diagram" style="max-width:100%;background:white;padding:1rem;" />

<img src="https://www.plantuml.com/plantuml/svg/~1eNpljjELwkAMhff8iuDu4ODSoajoXlToHNp4HL3elSRVf75Iq_ZwzPdeeN9OjcTGPgBoQ4FxA9r5OJBQjxWJ-cYPFK2itvXR4XYRH9Lzh81bYFztxSU83TnaCmD4_eOxrrL7zK3XjOydpDNrGqXhPBCXLhw1yR--ineO_3mdpLuF9AA41hWuy2kOCzTSDntWJccwwXWZTWOBwatFFsjwu_YVwQJ1MlqwuTE7vcdmuyWdSx9BLFDGCLDj2I59eAFLto1F" alt="PlantUML Diagram" style="max-width:100%;background:white;padding:1rem;" />

### Tekton

<img src="https://www.plantuml.com/plantuml/svg/~1eNptjksKwzAMRPc6hegykEUX3YeeIJRcQHVEUOPYwZahUHr3kh_5NDvpzQwzRVQKmjoLEA1ZxivEVlxPgTosKagY6clpSXUtrsHbRr7794pV1DJeKm7VuwuAf77YKDaiyykdNQw9mZYaRh2N-AFExNlRSs9WHJ-xR3KnmKNPwewiFcX2-A_xL8AxhnnK_TjyXJk2L9rAsv_qVQ55NrVvVu9DMI-Z6OiFgl2dOvsDd0CF5g==" alt="PlantUML Diagram" style="max-width:100%;background:white;padding:1rem;" />