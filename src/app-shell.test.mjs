import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test, { after, before } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';

const values = new Map();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  },
});
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    matchMedia: () => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
    }),
  },
});
Object.defineProperty(globalThis, 'document', {
  configurable: true,
  value: {
    documentElement: {
      classList: { toggle() {} },
    },
  },
});

let server;
let App;
let ThemeProvider;
let useStore;
let legalDocuments;
let translate;

before(async () => {
  server = await createServer({
    appType: 'custom',
    cacheDir: 'node_modules/.vite-ui-test',
    logLevel: 'error',
    server: { middlewareMode: true },
  });
  ({ default: App } = await server.ssrLoadModule('/src/App.tsx'));
  ({ ThemeProvider } = await server.ssrLoadModule('/src/hooks/useTheme.tsx'));
  ({ useStore } = await server.ssrLoadModule('/src/lib/store/index.ts'));
  useStore.persist.setOptions({
    storage: {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    },
  });
  ({ LEGAL_DOCUMENTS: legalDocuments } = await server.ssrLoadModule('/src/lib/i18n/legal.ts'));
  ({ translate } = await server.ssrLoadModule('/src/lib/i18n/strings.ts'));
});

after(async () => {
  await server?.close();
});

function renderAt(path, locale, basename = '') {
  useStore.getState().setLocale(locale);
  const routerProps = {
    initialEntries: [basename + path],
    ...(basename ? { basename } : {}),
  };
  return renderToStaticMarkup(
    React.createElement(
      ThemeProvider,
      null,
      React.createElement(MemoryRouter, routerProps, React.createElement(App)),
    ),
  );
}

test('footer links resolve to complete localized legal routes', () => {
  const koHome = renderAt('/', 'ko');
  assert.match(koHome, /href="\/privacy"/);
  assert.match(koHome, /href="\/terms"/);
  assert.match(koHome, />개인정보처리방침</);
  assert.match(koHome, />이용약관</);

  const deployedHome = renderAt('/', 'ko', '/StudyForge');
  assert.match(deployedHome, /href="\/StudyForge\/privacy"/);
  assert.match(deployedHome, /href="\/StudyForge\/terms"/);
  assert.match(renderAt('/privacy', 'ko', '/StudyForge'), />개인정보처리방침</);

  const koPrivacy = renderAt('/privacy', 'ko');
  assert.match(koPrivacy, />개인정보처리방침</);
  assert.match(koPrivacy, /처리하는 정보와 목적/);
  assert.match(koPrivacy, /localStorage/);

  assert.equal(translate('en', 'legal.privacy'), 'Privacy Policy');
  assert.equal(legalDocuments.en.privacy.title, 'Privacy Policy');
  assert.equal(legalDocuments.en.privacy.sections[1].heading, '2. Data processed and purposes');

  const koTerms = renderAt('/terms', 'ko');
  assert.match(koTerms, />이용약관</);
  assert.match(koTerms, /AI 생성 결과/);

  assert.equal(translate('en', 'legal.terms'), 'Terms of Use');
  assert.equal(legalDocuments.en.terms.title, 'Terms of Use');
  assert.equal(legalDocuments.en.terms.sections[3].heading, '4. AI-generated output');
});

test('Korean and English legal documents have complete matching structures', () => {
  for (const kind of ['privacy', 'terms']) {
    const ko = legalDocuments.ko[kind];
    const en = legalDocuments.en[kind];
    assert.equal(ko.sections.length, en.sections.length);
    assert.ok(ko.sections.length >= 8);
    assert.ok(ko.sections.every((section) => section.heading && (section.paragraphs?.length || section.bullets?.length)));
    assert.ok(en.sections.every((section) => section.heading && (section.paragraphs?.length || section.bullets?.length)));
  }
});

test('mobile, tablet, and desktop shell use synchronized responsive boundaries', async () => {
  const [header, sidebar, drawer, home, app] = await Promise.all([
    readFile('src/components/layout/Header.tsx', 'utf8'),
    readFile('src/components/layout/Sidebar.tsx', 'utf8'),
    readFile('src/components/layout/Drawer.tsx', 'utf8'),
    readFile('src/pages/Home.tsx', 'utf8'),
    readFile('src/App.tsx', 'utf8'),
  ]);

  assert.match(header, /lg:hidden/);
  assert.match(header, /hidden sm:inline/);
  assert.match(sidebar, /lg:block/);
  assert.doesNotMatch(sidebar, /md:block/);
  assert.match(drawer, /lg:hidden/);
  assert.match(home, /lg:grid-cols-3/);
  assert.match(home, /lg:sticky/);
  assert.match(app, /flex-wrap/);
});