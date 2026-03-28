// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import plantuml from 'astro-plantuml';
import starlightSidebarTopics from 'starlight-sidebar-topics';
import starlightBlog from 'starlight-blog';
import starlightTags from 'starlight-tags';
import starlightImageZoom from 'starlight-image-zoom';

export default defineConfig({
  site: 'https://noisonnoiton.github.io',
  integrations: [
    starlight({
      components: {
        Footer: './src/components/Footer.astro',
        Banner: './src/components/Banner.astro',
        PageTitle: './src/components/PageTitle.astro',
      },
      plugins: [
        starlightSidebarTopics([
          {
            label: 'Tech',
            link: '/blogs/010_kubernetes/',
            icon: 'laptop',
            id: 'tech',
            items: [
              {
                label: '☸️ Kubernetes',
                collapsed: true,
                items: [
                  { label: 'Overview', slug: 'blogs/010_kubernetes' },
                  {
                    label: 'Gateway API',
                    collapsed: true,
                    items: [
                      { label: 'K8s Native Gateway API', slug: 'blogs/010_kubernetes/gateway-api-overview' },
                      { label: 'Envoy Gateway 구성', slug: 'blogs/010_kubernetes/envoy-gateway-setup' },
                      { label: 'HTTPRoute 검증', slug: 'blogs/010_kubernetes/envoy-gateway-routing' },
                    ],
                  },
                  {
                    label: 'GitOps',
                    collapsed: true,
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
                ],
              },
              {
                label: '🤖 AI & ML',
                collapsed: true,
                items: [
                  {
                    label: 'Agent Builder',
                    collapsed: true,
                    items: [
                      { label: 'Overview', slug: 'blogs/008_ai_agent' },
                      { label: 'n8n-poc 설계와 구현', slug: 'blogs/008_ai_agent/n8n-poc' },
                      { label: 'Backstage 통합', slug: 'blogs/008_ai_agent/backstage' },
                    ],
                  },
                  {
                    label: 'Jupyter',
                    collapsed: true,
                    items: [
                      { label: 'Overview', slug: 'blogs/005_ml' },
                      { label: 'Jupyter Intro', slug: 'blogs/005_ml/jupyterintro' },
                      { label: 'Jupyter Server', slug: 'blogs/005_ml/jupyterserver' },
                      { label: 'JupyterHub', slug: 'blogs/005_ml/jupyterhub' },
                      { label: 'Jupyter Proxy', slug: 'blogs/005_ml/jupyterproxy' },
                    ],
                  },
                  {
                    label: 'Inference',
                    collapsed: true,
                    items: [
                      { label: 'Inference Intro', slug: 'blogs/005_ml/inferenceintro' },
                      { label: 'Triton', slug: 'blogs/005_ml/inferencetriton' },
                      { label: 'KFServing', slug: 'blogs/005_ml/inferencekfserving' },
                    ],
                  },
                ],
              },
              {
                label: '🏗️ Ref. Architecture',
                collapsed: true,
                items: [
                  { label: 'Overview', slug: 'blogs/003_refarch' },
                  {
                    label: 'API & Integration',
                    collapsed: true,
                    items: [
                      { label: 'Modern API', slug: 'blogs/003_refarch/modernapi' },
                      { label: 'Apache Camel', slug: 'blogs/003_refarch/camel' },
                      { label: 'Legacy Interface', slug: 'blogs/003_refarch/legacy' },
                    ],
                  },
                  {
                    label: 'Auth & Registry',
                    collapsed: true,
                    items: [
                      { label: 'Keycloak', slug: 'blogs/003_refarch/keycloak' },
                      { label: 'Harbor', slug: 'blogs/003_refarch/harbor' },
                    ],
                  },
                  {
                    label: 'Redis',
                    collapsed: true,
                    items: [
                      { label: '성능 측정', slug: 'blogs/003_refarch/perftest' },
                      { label: '고가용성', slug: 'blogs/003_refarch/hatest' },
                    ],
                  },
                  {
                    label: 'Multi-Cloud',
                    collapsed: true,
                    items: [
                      { label: 'Overview', slug: 'blogs/007_multicloud' },
                      { label: 'Diagram', slug: 'blogs/007_multicloud/diagram' },
                    ],
                  },
                ],
              },
              {
                label: '🍃 App Development',
                collapsed: true,
                items: [
                  {
                    label: 'Cloud Native',
                    collapsed: true,
                    items: [
                      { label: 'Introduction', slug: 'blogs/004_cna' },
                      { label: 'Container', slug: 'blogs/004_cna/container' },
                      { label: 'Kubernetes', slug: 'blogs/004_cna/k8s' },
                      { label: 'REST API', slug: 'blogs/004_cna/restapi' },
                    ],
                  },
                  {
                    label: 'Spring Boot',
                    collapsed: true,
                    autogenerate: { directory: 'blogs/004_cna/springboot' },
                  },
                ],
              },
            ],
          },
          {
            label: 'Blog',
            link: '/blog/',
            icon: 'pen',
            id: 'blog',
            // Blog sidebar is auto-managed by starlight-blog plugin
            items: [],
          },
          {
            label: 'Docs',
            link: '/docs/gitops-task-runner/',
            icon: 'document',
            items: [
              {
                label: 'GitOps Task Runner',
                collapsed: true,
                items: [
                  { label: 'Overview', slug: 'docs/gitops-task-runner' },
                  { label: 'Setup', slug: 'docs/gitops-task-runner/setup' },
                  { label: 'Platform API', slug: 'docs/gitops-task-runner/platformapi' },
                  { label: 'Standard', slug: 'docs/gitops-task-runner/standard' },
                  { label: 'Basics', slug: 'docs/gitops-task-runner/basics' },
                  { label: 'Resources', slug: 'docs/gitops-task-runner/resources' },
                ],
              },
              {
                label: 'Collab Portal',
                collapsed: true,
                items: [
                  { label: 'Overview', slug: 'docs/collab-portal' },
                  { label: 'Framework', slug: 'docs/collab-portal/befwk' },
                  { label: 'RDB + ORM', slug: 'docs/collab-portal/beorm' },
                  { label: 'NoSQL + ODM', slug: 'docs/collab-portal/beodm' },
                  { label: 'Redis 활용', slug: 'docs/collab-portal/beredis' },
                  { label: 'Authentication', slug: 'docs/collab-portal/beauth' },
                  { label: 'Web Push', slug: 'docs/collab-portal/bewebpush' },
                  { label: 'MVP Introduction', slug: 'docs/collab-portal/mvpintro' },
                  { label: 'Upstream Process', slug: 'docs/collab-portal/mvpbeupstream' },
                  { label: 'Downstream Process', slug: 'docs/collab-portal/mvpbedownstream' },
                ],
              },
            ],
          },
        ], {
          // Map auto-generated pages from blog/tags plugins to the blog topic
          topics: {
            blog: ['/blog', '/blog/**/*', '/tags', '/tags/**/*'],
            tech: ['/blogs/**/*'],
          },
          // Exclude overview pages that don't belong to any topic
          exclude: ['/movies', '/movies/**/*', '/books', '/books/**/*', '/food', '/food/**/*', '/knowledge', '/knowledge/**/*'],
        }),
        starlightBlog({
          title: '춘돌이 블로그',
          postCount: 10,
          recentPostCount: 5,
          authors: {
            noisonnoiton: {
              name: 'noisonnoiton',
              picture: 'https://avatars.githubusercontent.com/u/39892319?v=4',
              url: 'https://github.com/noisonnoiton',
            },
          },
        }),
        starlightTags(),
        starlightImageZoom(),
      ],
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
        // Google Search Console 소유권 확인
        {
          tag: 'meta',
          attrs: { name: 'google-site-verification', content: '5Cf8lzznSYAmH9JYOQxyE3AsnKWj_ZeCZ8P8jxnP3L4' },
        },
        // Naver Search Advisor
        {
          tag: 'meta',
          attrs: { name: 'naver-site-verification', content: 'd3c1f1b07eacea0cd9a3c3c03468e5c8bafe6393' },
        },
        // RSS Feed
        {
          tag: 'link',
          attrs: { rel: 'alternate', type: 'application/rss+xml', title: '춘돌이 RSS', href: '/rss.xml' },
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
      // sidebar is managed by sidebar-topics plugin
    }),
    plantuml(),
  ],
});
