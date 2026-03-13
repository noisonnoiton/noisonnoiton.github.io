// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import plantuml from 'astro-plantuml';

export default defineConfig({
  site: 'https://noisonnoiton.github.io',
  integrations: [
    starlight({
      components: {
        Footer: './src/components/Footer.astro',
      },
      title: 'noisonnoiton',
      logo: {
        src: './src/assets/choonsik.png',
        alt: '춘식이',
      },
      favicon: '/favicon.png',
      defaultLocale: 'ko',
      customCss: ['./src/styles/choonsik.css'],
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/noisonnoiton' },
      ],
      head: [
        // Google Analytics (GA4) — TODO: GA_MEASUREMENT_ID 교체
        // {
        //   tag: 'script',
        //   attrs: { src: 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX', async: true },
        // },
        // {
        //   tag: 'script',
        //   content: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-XXXXXXXXXX');`,
        // },
        // Google Search Console 소유권 확인
        {
          tag: 'meta',
          attrs: { name: 'google-site-verification', content: '5Cf8lzznSYAmH9JYOQxyE3AsnKWj_ZeCZ8P8jxnP3L4' },
        },
        // Open Graph 기본 메타
        {
          tag: 'meta',
          attrs: { property: 'og:type', content: 'website' },
        },
        {
          tag: 'meta',
          attrs: { property: 'og:site_name', content: 'noisonnoiton' },
        },
        {
          tag: 'meta',
          attrs: { property: 'og:locale', content: 'ko_KR' },
        },
        // Twitter Card
        {
          tag: 'meta',
          attrs: { name: 'twitter:card', content: 'summary_large_image' },
        },
        // 추가 SEO
        {
          tag: 'meta',
          attrs: { name: 'author', content: 'noisonnoiton' },
        },
        {
          tag: 'link',
          attrs: { rel: 'canonical', href: 'https://noisonnoiton.github.io' },
        },
      ],
      sidebar: [
        {
          label: 'AI Agent Builder',
          items: [
            { label: 'Overview', slug: 'blogs/008_ai_agent' },
            { label: 'n8n-poc 설계와 구현', slug: 'blogs/008_ai_agent/n8n-poc' },
            { label: 'Backstage 통합', slug: 'blogs/008_ai_agent/backstage' },
          ],
        },
        {
          label: 'Cloud Native App',
          items: [
            { label: 'Introduction', slug: 'blogs/004_cna' },
            { label: 'Container', slug: 'blogs/004_cna/container' },
            { label: 'Kubernetes', slug: 'blogs/004_cna/k8s' },
            { label: 'REST API', slug: 'blogs/004_cna/restapi' },
            { label: 'Tips', slug: 'blogs/004_cna/tip' },
          ],
        },
        {
          label: 'Spring Boot',
          autogenerate: { directory: 'blogs/004_cna/springboot' },
        },
        {
          label: 'Ref. Architecture',
          items: [
            { label: 'Overview', slug: 'blogs/003_refarch' },
            { label: 'Modern API', slug: 'blogs/003_refarch/modernapi' },
            { label: 'Redis 성능 측정', slug: 'blogs/003_refarch/perftest' },
            { label: 'Redis 고가용성', slug: 'blogs/003_refarch/hatest' },
            { label: 'Apache Camel', slug: 'blogs/003_refarch/camel' },
            { label: 'Legacy Interface', slug: 'blogs/003_refarch/legacy' },
            { label: 'Keycloak', slug: 'blogs/003_refarch/keycloak' },
            { label: 'Harbor', slug: 'blogs/003_refarch/harbor' },
          ],
        },
        {
          label: 'ML / Inference',
          items: [
            { label: 'Overview', slug: 'blogs/005_ml' },
            { label: 'Jupyter Intro', slug: 'blogs/005_ml/jupyterintro' },
            { label: 'Jupyter Server', slug: 'blogs/005_ml/jupyterserver' },
            { label: 'JupyterHub', slug: 'blogs/005_ml/jupyterhub' },
            { label: 'Jupyter Proxy', slug: 'blogs/005_ml/jupyterproxy' },
            { label: 'Inference Intro', slug: 'blogs/005_ml/inferenceintro' },
            { label: 'Triton', slug: 'blogs/005_ml/inferencetriton' },
            { label: 'KFServing', slug: 'blogs/005_ml/inferencekfserving' },
          ],
        },
        {
          label: 'GitOps',
          items: [
            { label: 'Overview', slug: 'blogs/006_gitops' },
            { label: 'GitOps 소개', slug: 'blogs/006_gitops/gitopsintro' },
            { label: 'FluxCD Intro', slug: 'blogs/006_gitops/fluxintro' },
            { label: 'FluxCD v2', slug: 'blogs/006_gitops/fluxcdv2' },
            { label: 'Flagger Intro', slug: 'blogs/006_gitops/flaggerintro' },
            { label: 'Flagger Deploy', slug: 'blogs/006_gitops/flaggerdeploy' },
            { label: 'ArgoCD Intro', slug: 'blogs/006_gitops/argocdintro' },
            { label: 'ArgoCD Deploy', slug: 'blogs/006_gitops/argocddeploy' },
          ],
        },
        {
          label: 'Multi-Cloud',
          items: [
            { label: 'Overview', slug: 'blogs/007_multicloud' },
            { label: 'Diagram', slug: 'blogs/007_multicloud/diagram' },
          ],
        },
        {
          label: 'Docs - Kloudbank',
          collapsed: true,
          items: [
            { label: 'Guide Overview', slug: 'blogs/001_guide' },
            { label: '개발환경', slug: 'blogs/001_guide/env' },
            { label: '문서 도구', slug: 'blogs/001_guide/doc' },
            { label: 'Resource', slug: 'blogs/001_guide/resource' },
            { label: 'AWS Overview', slug: 'blogs/002_cloud' },
            { label: 'Getting Started', slug: 'blogs/002_cloud/start' },
            { label: 'Certification', slug: 'blogs/002_cloud/certi' },
            { label: 'EKS', slug: 'blogs/002_cloud/eks' },
            { label: 'ALB', slug: 'blogs/002_cloud/alb' },
            { label: 'NLB', slug: 'blogs/002_cloud/nlb' },
            { label: 'EBS', slug: 'blogs/002_cloud/ebs' },
            { label: 'EFS', slug: 'blogs/002_cloud/efs' },
          ],
        },
        {
          label: 'Docs - HCP SRE CQ',
          collapsed: true,
          items: [
            { label: 'Overview', slug: 'docs/001_hcpsrecq' },
            { label: 'Setup', slug: 'docs/001_hcpsrecq/setup' },
            { label: 'Platform API', slug: 'docs/001_hcpsrecq/platformapi' },
            { label: 'Standard', slug: 'docs/001_hcpsrecq/standard' },
            { label: 'Basics', slug: 'docs/001_hcpsrecq/basics' },
            { label: 'Resources', slug: 'docs/001_hcpsrecq/resources' },
          ],
        },
      ],
    }),
    // plantuml은 starlight 뒤에 위치해야 Starlight의 remarkPlugins에 추가됨
    plantuml(),
  ],
});
