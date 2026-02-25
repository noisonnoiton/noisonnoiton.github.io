#!/usr/bin/env node
/**
 * Fix vuepress-theme-reco SSR: getCurrentInstance() returns null during build.
 * Replaces the throwing behavior with a fallback object.
 */
const fs = require('fs');
const path = require('path');

const file = path.join(
  __dirname,
  '../node_modules/vuepress-theme-reco/helpers/composable.js'
);

if (!fs.existsSync(file)) {
  console.warn('fix-reco-ssr: vuepress-theme-reco not found, skipping');
  process.exit(0);
}

const layoutFile = path.join(__dirname, '../node_modules/vuepress-theme-reco/layouts/Layout.vue');

const content = fs.readFileSync(file, 'utf8');
const original = `  if (!vm) throw new Error('must be called in setup')

  const instance = vm || {}
  return instance`;
const fallbackBody = `{
      __ssrFallback: true,
      $themeConfig: { type: 'blog' },
      $site: { base: '/', pages: [], themeConfig: { sidebar: {} } },
      $page: { headers: [], frontmatter: {}, path: '/', regularPath: '/' },
      $localePath: '/',
      $frontmatter: {},
      $themeLocaleConfig: { nav: [] },
      $router: {},
      $route: {}
    }`;
const previousFix = '  if (!vm) {\n    return ' + fallbackBody + '\n  }\n  return vm';
const fixed = '  if (!vm) {\n    if (typeof window !== \'undefined\') {\n      throw new Error(\'must be called in setup\')\n    }\n    return ' + fallbackBody + '\n  }\n  return vm';

const oldFallback = `$site: { base: '/', pages: [], themeConfig: {} }`;
const newFallback = `$site: { base: '/', pages: [], themeConfig: { sidebar: {} } }`;
const oldThemeConfig = `$themeConfig: {}`;
const newThemeConfig = `$themeConfig: { type: 'blog' }`;

if (content.includes("throw new Error('must be called in setup')")) {
  fs.writeFileSync(file, content.replace(original, fixed));
  console.log('fix-reco-ssr: applied SSR fix');
} else if (content.includes('$themeLocaleConfig') && !content.includes("typeof window !== 'undefined'")) {
  fs.writeFileSync(file, content.replace(previousFix, fixed));
  console.log('fix-reco-ssr: updated to SSR-only fallback');
} else if (content.includes("typeof window !== 'undefined'") && content.includes('themeConfig: {}')) {
  let updated = content.replace(oldFallback, newFallback).replace(oldThemeConfig, newThemeConfig);
  if (!updated.includes('__ssrFallback')) {
    updated = updated.replace('return {\n      $themeConfig:', 'return {\n      __ssrFallback: true,\n      $themeConfig:');
  }
  fs.writeFileSync(file, updated);
  console.log('fix-reco-ssr: updated fallback structure for build');
} else if (content.includes("typeof window !== 'undefined'") && !content.includes('__ssrFallback')) {
  fs.writeFileSync(file, content.replace('return {\n      $themeConfig:', 'return {\n      __ssrFallback: true,\n      $themeConfig:'));
  console.log('fix-reco-ssr: added __ssrFallback flag');
} else if (content.includes('themeConfig: { sidebar: {} }')) {
  console.log('fix-reco-ssr: already applied');
} else {
  console.log('fix-reco-ssr: unknown version, skipping');
}

// Patch Layout.vue: always return plain values during SSR (avoids Ref unwrap + _Ctor issues)
if (fs.existsSync(layoutFile)) {
  let layoutContent = fs.readFileSync(layoutFile, 'utf8');
  const layoutOriginal = `    if (instance.__ssrFallback) {
      return { sidebarItems: [], homeCom: 'HomeBlog' }
    }
    return { sidebarItems, homeCom }`;
  const layoutOriginal2 = `    return { sidebarItems, homeCom }`;
  const layoutPatched = `    if (typeof window === 'undefined') {
      const items = sidebarItems && sidebarItems.value;
      return {
        sidebarItems: Array.isArray(items) ? items : [],
        homeCom: (typeof homeCom === 'string' ? homeCom : (homeCom && homeCom.value)) || 'HomeBlog'
      }
    }
    return { sidebarItems, homeCom }`;
  if (layoutContent.includes(layoutOriginal)) {
    layoutContent = layoutContent.replace(layoutOriginal, layoutPatched);
    fs.writeFileSync(layoutFile, layoutContent);
    console.log('fix-reco-ssr: patched Layout.vue for SSR plain values');
  } else if (layoutContent.includes(layoutOriginal2) && !layoutContent.includes('typeof window')) {
    layoutContent = layoutContent.replace(layoutOriginal2, layoutPatched);
    fs.writeFileSync(layoutFile, layoutContent);
    console.log('fix-reco-ssr: patched Layout.vue for SSR plain values');
  }
}
