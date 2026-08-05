import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const externalBaseURL = String(process.env.PLAYWRIGHT_BASE_URL || '').replace(/\/$/, '');
const baseURL = externalBaseURL || 'http://127.0.0.1:4173';
const deploymentWaitMs = Math.max(30_000, Number(process.env.PORTAL_DEPLOY_WAIT_MS || 60_000));

let browser;
let previewProcess;

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitForUrl(pathname, timeoutMs = deploymentWaitMs) {
  const startedAt = Date.now();
  let lastStatus = 0;
  let lastError = null;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(`${baseURL}${pathname}`, {
        redirect: 'follow',
        headers: { 'user-agent': 'MLS-Portal-Smoke-Test/1.0' },
      });
      lastStatus = response.status;
      if (response.status === 200) return;
    } catch (error) {
      lastError = error;
    }
    await sleep(2_000);
  }

  const detail = lastError ? String(lastError) : `last status ${lastStatus || 'unknown'}`;
  throw new Error(`MLS portal did not become ready at ${pathname}: ${detail}`);
}

function parseStorageState(environmentName) {
  const raw = process.env[environmentName];
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    try {
      return JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
    } catch (error) {
      throw new Error(`${environmentName} must contain JSON or base64-encoded JSON: ${error.message}`);
    }
  }
}

async function inspectPage(context, pathname) {
  const page = await context.newPage();
  const pageErrors = [];
  const serverErrors = [];

  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 500) serverErrors.push(`${response.status()} ${response.url()}`);
  });

  const response = await page.goto(`${baseURL}${pathname}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30_000,
  });
  await page.waitForTimeout(1_000);

  const bodyText = (await page.locator('body').innerText()).trim();
  const title = await page.title();
  const result = {
    initialStatus: response?.status() || 0,
    finalUrl: page.url(),
    bodyText,
    title,
    pageErrors,
    serverErrors,
  };
  await page.close();
  return result;
}

before(async () => {
  if (!externalBaseURL) {
    previewProcess = spawn(
      process.platform === 'win32' ? 'npm.cmd' : 'npm',
      ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4173'],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    );
    previewProcess.stdout.on('data', (chunk) => process.stdout.write(`[preview] ${chunk}`));
    previewProcess.stderr.on('data', (chunk) => process.stderr.write(`[preview] ${chunk}`));
  }

  await waitForUrl(externalBaseURL ? '/portal' : '/');
  browser = await chromium.launch({ headless: true });
});

after(async () => {
  await browser?.close();
  previewProcess?.kill('SIGTERM');
});

test('portal deep links load the React application instead of a hosting 404', async () => {
  const context = await browser.newContext();

  for (const pathname of ['/login', '/portal', '/admin/interpreters', '/login.html']) {
    const result = await inspectPage(context, pathname);
    assert.equal(result.initialStatus, 200, `${pathname} returned ${result.initialStatus}`);
    assert.ok(result.bodyText.length > 20, `${pathname} rendered an empty page`);
    assert.doesNotMatch(result.bodyText, /The page could not be found|NOT_FOUND/i, `${pathname} rendered a hosting 404`);
    assert.equal(result.pageErrors.length, 0, `${pathname} page errors: ${result.pageErrors.join('; ')}`);
    assert.equal(result.serverErrors.length, 0, `${pathname} 5xx responses: ${result.serverErrors.join('; ')}`);
  }

  await context.close();
});

test('protected production APIs reject signed-out requests without leaking data', async (t) => {
  if (!externalBaseURL) {
    t.skip('Serverless APIs are verified against the deployed environment.');
    return;
  }

  for (const endpoint of ['/api/portal?action=loadBootstrap', '/api/portal-app?action=loadPortalApp', '/api/operations-v2?action=loadWorkspace']) {
    const response = await fetch(`${baseURL}${endpoint}`, { redirect: 'manual' });
    const body = await response.text();
    assert.equal(response.status, 401, `${endpoint} returned ${response.status}`);
    assert.match(body, /Sign in is required/i, `${endpoint} returned an unexpected signed-out response`);
    assert.ok(body.length < 500, `${endpoint} returned an unexpectedly large response`);
  }
});

test('mobile login has content and no page-level horizontal overflow', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const page = await context.newPage();
  const response = await page.goto(`${baseURL}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(750);

  assert.equal(response?.status(), 200);
  const bodyText = (await page.locator('body').innerText()).trim();
  assert.ok(bodyText.length > 20, 'Mobile login rendered an empty page');
  const widths = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  assert.ok(widths.document <= widths.viewport + 1, `Horizontal overflow: ${widths.document}px document in ${widths.viewport}px viewport`);

  await context.close();
});

const roleSessions = [
  ['admin', 'MLS_ADMIN_STORAGE_STATE_JSON'],
  ['interpreter', 'MLS_INTERPRETER_STORAGE_STATE_JSON'],
  ['client', 'MLS_CLIENT_STORAGE_STATE_JSON'],
];

for (const [role, environmentName] of roleSessions) {
  test(`${role} session opens a nonblank portal without uncaught or 5xx errors`, async (t) => {
    const storageState = parseStorageState(environmentName);
    if (!storageState) {
      t.skip(`${environmentName} is not configured.`);
      return;
    }

    const context = await browser.newContext({ storageState });
    const result = await inspectPage(context, '/portal');
    assert.equal(result.initialStatus, 200);
    assert.ok(result.bodyText.length > 100, `${role} portal rendered too little content`);
    assert.doesNotMatch(result.bodyText, /The page could not be found|NOT_FOUND/i);
    assert.equal(result.pageErrors.length, 0, `${role} page errors: ${result.pageErrors.join('; ')}`);
    assert.equal(result.serverErrors.length, 0, `${role} 5xx responses: ${result.serverErrors.join('; ')}`);
    await context.close();
  });
}
