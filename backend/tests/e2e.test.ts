import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import http from 'node:http';
import { after, before, describe, it } from 'node:test';
import type { Express } from 'express';

process.env.NODE_ENV = 'test';

import 'dotenv/config';
import { prisma } from '../src/config/db';

let app: Express;
let server: http.Server;
let baseUrl = '';

const TEST_EMAIL_PREFIX = 'e2e_';
const createdUserIds: string[] = [];

interface JsonResponse<T = Record<string, unknown>> {
  status: number;
  body: T;
}

async function apiRequest<T = Record<string, unknown>>(
  path: string,
  options: {
    method?: string;
    token?: string;
    body?: unknown;
  } = {}
): Promise<JsonResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  const parsed = text ? (JSON.parse(text) as T) : ({} as T);
  return { status: res.status, body: parsed };
}

const testMailbox = new Map<string, { resetToken: string; expiresAt: string }>();

async function requestResetFromMailbox(
  path: '/api/auth/forgot-password',
  options: { method: 'POST'; body: { email: string } }
) {
  const email = options.body.email.trim().toLowerCase();
  testMailbox.delete(email);
  const response = await apiRequest<{ success: boolean; message: string; data: null }>(path, options);
  assert.equal(response.status, 200);
  assert.equal(response.body.data, null, 'The public API must never return recovery credentials');
  const delivery = testMailbox.get(email);
  assert.ok(delivery, 'The reset link must be delivered to the account mailbox');
  return { ...response, delivery };
}

function uniqueEmail(label: string): string {
  return `${TEST_EMAIL_PREFIX}${label}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}@example.com`;
}

async function registerTestUser(label: string, password = 'Password123!') {
  const email = uniqueEmail(label);
  const res = await apiRequest<{
    success: boolean;
    message: string;
    data: { token: string; id: string; email: string };
  }>('/api/auth/register', {
    method: 'POST',
    body: { email, password },
  });
  assert.equal(res.status, 201, `Expected 201 registering ${label}, got ${res.status}`);
  createdUserIds.push(res.body.data.id);
  return { password, ...res.body.data };
}

async function cleanupTestUsers() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { id: { in: createdUserIds } },
        { email: { startsWith: TEST_EMAIL_PREFIX } },
      ],
    },
    select: { id: true },
  });
  const ids = users.map((u) => u.id);
  if (ids.length === 0) return;

  await prisma.passwordResetToken.deleteMany({ where: { userId: { in: ids } } });
  await prisma.plannedAction.deleteMany({ where: { userId: { in: ids } } });
  await prisma.dailyLog.deleteMany({ where: { userId: { in: ids } } });
  await prisma.cycle.deleteMany({ where: { userId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
}

describe('Proactive 31-Day Habit Tracker — 4-Tier E2E & Multi-Tenant Test Suite', () => {
  let categories: Array<{ id: string; name: string; description: string }> = [];

  before(async () => {
    const mod = await import('../src/index');
    app = mod.app;
    app.locals.passwordResetDelivery = async (email: string, resetToken: string, expiresAt: Date) => {
      testMailbox.set(email, { resetToken, expiresAt: expiresAt.toISOString() });
    };

    await cleanupTestUsers();

    // Ensure 8 core categories exist
    const existingCats = await prisma.habitCategory.findMany({ orderBy: { createdAt: 'asc' } });
    assert.equal(existingCats.length, 8, 'Database must be seeded with 8 core habit categories');
    categories = existingCats.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description ?? '',
    }));

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        if (addr && typeof addr === 'object') {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });
  });

  after(async () => {
    await cleanupTestUsers();
    await prisma.$disconnect();
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    }
  });

  // =========================================================================
  // TIER 1 — HAPPY-PATH UNIT & API TESTS (>=5 per feature area)
  // =========================================================================
  describe('Tier 1: Happy-Path Tests', () => {
    describe('Auth & Habit Categories (FIX-03a, FIX-04)', () => {
      it('T1-AUTH-01: registers user and returns 201 with { token, id, email }', async () => {
        const email = uniqueEmail('t1_reg');
        const res = await apiRequest<{
          success: boolean;
          message: string;
          data: { token: string; id: string; email: string };
        }>('/api/auth/register', {
          method: 'POST',
          body: { email, password: 'Password123!' },
        });
        assert.equal(res.status, 201);
        assert.equal(res.body.success, true);
        assert.ok(res.body.data.token.length > 20);
        assert.ok(res.body.data.id);
        assert.equal(res.body.data.email, email);
        createdUserIds.push(res.body.data.id);
      });

      it('T1-AUTH-02: logs in registered user and returns 200 with { token, id, email }', async () => {
        const user = await registerTestUser('t1_login');
        const res = await apiRequest<{
          success: boolean;
          data: { token: string; id: string; email: string };
        }>('/api/auth/login', {
          method: 'POST',
          body: { email: user.email, password: user.password },
        });
        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.equal(res.body.data.id, user.id);
        assert.equal(res.body.data.email, user.email);
        assert.ok(res.body.data.token);
      });

      it('T1-AUTH-03: trims whitespace around email during registration and login', async () => {
        const rawEmail = `  ${uniqueEmail('t1_trim')}  `;
        const reg = await apiRequest<{
          success: boolean;
          data: { token: string; id: string; email: string };
        }>('/api/auth/register', {
          method: 'POST',
          body: { email: rawEmail, password: 'Password123!' },
        });
        assert.equal(reg.status, 201);
        createdUserIds.push(reg.body.data.id);
        assert.equal(reg.body.data.email, rawEmail.trim());
      });

      it('T1-HABIT-04: GET /api/habits returns success envelope (not "sucess") with 8 Core Pillars', async () => {
        const user = await registerTestUser('t1_habit');
        const res = await apiRequest<{
          success: boolean;
          sucess?: boolean;
          data: Array<{ id: string; name: string }>;
        }>('/api/habits', { token: user.token });
        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.equal(res.body.sucess, undefined);
        assert.equal(res.body.data.length, 8);
      });

      it('T1-HEALTH-05: GET /api/health returns 200 status success', async () => {
        const res = await apiRequest<{ status: string; message: string }>('/api/health');
        assert.equal(res.status, 200);
        assert.equal(res.body.status, 'success');
      });
    });

    describe('Forgot & Reset Password (FEAT-04)', () => {
      it('T1-AUTH-PW-01: POST /api/auth/forgot-password delivers a token privately and stores only its SHA-256 digest', async () => {
        const user = await registerTestUser('t1_pw_req');
        const res = await requestResetFromMailbox('/api/auth/forgot-password', {
          method: 'POST',
          body: { email: user.email },
        });

        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.equal(
          res.body.message,
          'If an account with that email exists, password reset instructions have been generated.'
        );
        assert.ok(res.delivery.resetToken.length === 64);
        assert.ok(new Date(res.delivery.expiresAt).getTime() > Date.now());

        const expectedHash = crypto
          .createHash('sha256')
          .update(res.delivery.resetToken)
          .digest('hex');
        const dbToken = await prisma.passwordResetToken.findUnique({
          where: { tokenHash: expectedHash },
        });
        assert.ok(dbToken, 'SHA-256 hashed token must be persisted in PasswordResetToken');
        assert.notEqual(dbToken.tokenHash, res.delivery.resetToken);
        assert.equal(dbToken.userId, user.id);
        assert.equal(dbToken.usedAt, null);
      });

      it('T1-AUTH-PW-02: POST /api/auth/forgot-password trims whitespace and matches email case-insensitively', async () => {
        const user = await registerTestUser('t1_pw_case');
        const res = await requestResetFromMailbox('/api/auth/forgot-password', {
          method: 'POST',
          body: { email: `  ${user.email.toUpperCase()}  ` },
        });

        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.ok(res.delivery.resetToken, 'Case-insensitive email should resolve user and issue token');
      });

      it('T1-AUTH-PW-03: POST /api/auth/reset-password resets password with valid token and marks token used', async () => {
        const user = await registerTestUser('t1_pw_reset');
        const forgot = await requestResetFromMailbox('/api/auth/forgot-password', {
          method: 'POST',
          body: { email: user.email },
        });

        const reset = await apiRequest<{
          success: boolean;
          message: string;
          data: null;
        }>('/api/auth/reset-password', {
          method: 'POST',
          body: { token: `  ${forgot.delivery.resetToken}  `, password: 'NewPassword123!' },
        });

        assert.equal(reset.status, 200);
        assert.equal(reset.body.success, true);
        assert.equal(reset.body.message, 'Password has been reset successfully. You can now sign in.');
        assert.equal(reset.body.data, null);

        const expectedHash = crypto
          .createHash('sha256')
          .update(forgot.delivery.resetToken)
          .digest('hex');
        const dbToken = await prisma.passwordResetToken.findUnique({
          where: { tokenHash: expectedHash },
        });
        assert.ok(dbToken?.usedAt, 'Token must be marked usedAt after reset');
      });

      it('T1-AUTH-PW-04: POST /api/auth/login succeeds with new password and rejects old password after reset', async () => {
        const user = await registerTestUser('t1_pw_login', 'OldPassword123!');
        const forgot = await requestResetFromMailbox('/api/auth/forgot-password',
          { method: 'POST', body: { email: user.email } }
        );

        const reset = await apiRequest('/api/auth/reset-password', {
          method: 'POST',
          body: { token: forgot.delivery.resetToken, password: 'RotatedPassword999!' },
        });
        assert.equal(reset.status, 200);

        const oldLogin = await apiRequest('/api/auth/login', {
          method: 'POST',
          body: { email: user.email, password: 'OldPassword123!' },
        });
        assert.equal(oldLogin.status, 401);

        const newLogin = await apiRequest<{
          success: boolean;
          data: { token: string; id: string; email: string };
        }>('/api/auth/login', {
          method: 'POST',
          body: { email: user.email, password: 'RotatedPassword999!' },
        });
        assert.equal(newLogin.status, 200);
        assert.equal(newLogin.body.success, true);
        assert.equal(newLogin.body.data.id, user.id);
        assert.equal(newLogin.body.data.email, user.email);
        assert.ok(newLogin.body.data.token.length > 20);
      });

      it('T1-AUTH-PW-05: re-requesting forgot-password invalidates prior unused token and issues fresh valid token', async () => {
        const user = await registerTestUser('t1_pw_supersede');
        const first = await requestResetFromMailbox('/api/auth/forgot-password',
          { method: 'POST', body: { email: user.email } }
        );
        const duringCooldown = await apiRequest('/api/auth/forgot-password', {
          method: 'POST',
          body: { email: user.email },
        });
        assert.equal(duringCooldown.status, 429);
        const firstToken = await prisma.passwordResetToken.findUniqueOrThrow({
          where: { tokenHash: crypto.createHash('sha256').update(first.delivery.resetToken).digest('hex') },
        });
        assert.equal(firstToken.usedAt, null);
        const limiterKey = crypto.createHmac('sha256', process.env.JWT_SECRET as string)
          .update(JSON.stringify(['recover', 'email', user.email])).digest('hex');
        await prisma.authRateBucket.update({ where: { key: limiterKey }, data: { expiresAt: new Date(0) } });

        const second = await requestResetFromMailbox('/api/auth/forgot-password',
          { method: 'POST', body: { email: user.email } }
        );

        assert.notEqual(first.delivery.resetToken, second.delivery.resetToken);

        const useFirst = await apiRequest<{ success: boolean }>('/api/auth/reset-password', {
          method: 'POST',
          body: { token: first.delivery.resetToken, password: 'Attempt1Password!' },
        });
        assert.equal(useFirst.status, 400);
        assert.equal(useFirst.body.success, false);

        const useSecond = await apiRequest<{ success: boolean }>('/api/auth/reset-password', {
          method: 'POST',
          body: { token: second.delivery.resetToken, password: 'Attempt2Password!' },
        });
        assert.equal(useSecond.status, 200);
        assert.equal(useSecond.body.success, true);
      });
    });

    describe('Cycles & Cycle Progress (FIX-02a, FIX-02b)', () => {
      it('initializes exactly one active cycle with complete Day 1 after concurrent starts', async () => {
        const user = await registerTestUser('concurrent_cycle');
        const options = {
          method: 'POST',
          token: user.token,
          body: { initialGoals: [{ categoryId: categories[0].id, description: 'Day 1 goal' }] },
        };
        const responses = await Promise.all([
          apiRequest('/api/cycles', options),
          apiRequest('/api/cycles', options),
        ]);
        assert.ok(responses.some(response => response.status === 201));
        assert.ok(responses.every(response => response.status === 201 || response.status === 409));
        const cycles = await prisma.cycle.findMany({
          where: { userId: user.id, isActive: true },
          include: { logs: { include: { plans: true } } },
        });
        assert.equal(cycles.length, 1);
        assert.equal(cycles[0].logs.length, 1);
        assert.equal(cycles[0].logs[0].plans[0].description, 'Day 1 goal');
      });

      it('paginates history summaries with a stable cursor', async () => {
        const user = await registerTestUser('paginated_cycles');
        const date = new Date('2026-01-01T00:00:00.000Z');
        await prisma.cycle.createMany({
          data: Array.from({ length: 22 }, () => ({
            userId: user.id, startDate: date, endDate: date, isActive: false,
          })),
        });
        type HistoryPage = { data: Array<{ id: string; logs?: unknown }>; nextCursor: string | null };
        const first = await apiRequest<HistoryPage>('/api/cycles/history', { token: user.token });
        assert.equal(first.status, 200);
        assert.equal(first.body.data.length, 20);
        assert.ok(first.body.nextCursor);
        assert.ok(first.body.data.every(cycle => cycle.logs === undefined));
        const second = await apiRequest<HistoryPage>(
          `/api/cycles/history?cursor=${first.body.nextCursor}`, { token: user.token }
        );
        assert.equal(second.status, 200);
        assert.equal(second.body.data.length, 2);
        assert.equal(second.body.nextCursor, null);
        assert.equal(new Set([...first.body.data, ...second.body.data].map(cycle => cycle.id)).size, 22);
      });

      it('T1-CYC-01: GET /api/cycles returns null when user has no active cycle', async () => {
        const user = await registerTestUser('t1_cyc_none');
        const res = await apiRequest<{ success: boolean; data: null }>('/api/cycles', {
          token: user.token,
        });
        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.equal(res.body.data, null);
      });

      it('T1-CYC-02: POST /api/cycles starts a 31-day active cycle and auto-creates Day 1 log', async () => {
        const user = await registerTestUser('t1_cyc_start');
        const res = await apiRequest<{
          success: boolean;
          data: { id: string; isActive: boolean; userId: string };
        }>('/api/cycles', {
          method: 'POST',
          token: user.token,
          body: {},
        });
        assert.equal(res.status, 201);
        assert.equal(res.body.success, true);
        assert.equal(res.body.data.isActive, true);
        assert.equal(res.body.data.userId, user.id);

        const daysRes = await apiRequest<{ success: boolean; data: Array<{ id: string }> }>(
          '/api/days',
          { token: user.token }
        );
        assert.equal(daysRes.status, 200);
        assert.equal(daysRes.body.data.length, 1);
      });

      it('T1-CYC-03: POST /api/cycles/start with initialGoals populates Day 1 actions immediately', async () => {
        const user = await registerTestUser('t1_cyc_initgoals');
        const res = await apiRequest<{ success: boolean; data: { id: string } }>(
          '/api/cycles/start',
          {
            method: 'POST',
            token: user.token,
            body: {
              initialGoals: [
                { categoryId: categories[0].id, description: 'Read 20 pages of systems book' },
                { categoryId: categories[1].id, description: '30m strength training' },
              ],
            },
          }
        );
        assert.equal(res.status, 201);

        const prog = await apiRequest<{
          success: boolean;
          stats: { todayPlannedCount: number; totalActions: number };
          todayLog: { plans: Array<{ description: string }> };
        }>('/api/cycle-progress/current', { token: user.token });
        assert.equal(prog.status, 200);
        assert.equal(prog.body.stats.todayPlannedCount, 2);
        assert.equal(prog.body.todayLog.plans.length, 2);
      });

      it('T1-CYC-04: GET /api/cycles/current returns active cycle and /api/cycles/history lists user cycles', async () => {
        const user = await registerTestUser('t1_cyc_hist');
        await apiRequest('/api/cycles', { method: 'POST', token: user.token });
        const cur = await apiRequest<{ success: boolean; data: { id: string } }>(
          '/api/cycles/current',
          { token: user.token }
        );
        assert.equal(cur.status, 200);
        assert.ok(cur.body.data.id);

        const hist = await apiRequest<{
          success: boolean;
          data: Array<{ id: string; summary: { daysLogged: number } }>;
        }>('/api/cycles/history', { token: user.token });
        assert.equal(hist.status, 200);
        assert.equal(hist.body.data.length, 1);
        assert.equal(hist.body.data[0].summary.daysLogged, 1);
      });

      it('T1-PROG-05: GET /api/cycle-progress/:cycleId returns pillarStats for all 8 pillars and dailySeries', async () => {
        const user = await registerTestUser('t1_prog_uuid');
        const cyc = await apiRequest<{ data: { id: string } }>('/api/cycles', {
          method: 'POST',
          token: user.token,
        });
        const prog = await apiRequest<{
          success: boolean;
          stats: { currentDayNumber: number; totalDays: number };
          pillarStats: Array<{ categoryId: string }>;
          dailySeries: Array<{ dayNumber: number }>;
          data: { stats: { cycleId: string } };
        }>(`/api/cycle-progress/${cyc.body.data.id}`, { token: user.token });

        assert.equal(prog.status, 200);
        assert.equal(prog.body.success, true);
        assert.equal(prog.body.stats.currentDayNumber, 1);
        assert.equal(prog.body.stats.totalDays, 31);
        assert.equal(prog.body.pillarStats.length, 8);
        assert.equal(prog.body.dailySeries.length, 1);
        assert.equal(prog.body.data.stats.cycleId, cyc.body.data.id);
      });
    });

    describe('Daily Logs & Planned Actions (FIX-02c, FIX-02d, FEAT-01, FEAT-02)', () => {
      it('T1-DAY-01: POST /api/days is idempotent for same calendar day (200 on repeat)', async () => {
        const user = await registerTestUser('t1_day_idemp');
        await apiRequest('/api/cycles', { method: 'POST', token: user.token });

        const first = await apiRequest<{ success: boolean; data: { id: string } }>('/api/days', {
          method: 'POST',
          token: user.token,
          body: { targetDate: 'today' },
        });
        assert.equal(first.status, 200);

        const tomCreate = await apiRequest<{ success: boolean; data: { id: string } }>('/api/days', {
          method: 'POST',
          token: user.token,
          body: { targetDate: 'tomorrow' },
        });
        assert.equal(tomCreate.status, 201);

        const tomRepeat = await apiRequest<{ success: boolean; data: { id: string } }>('/api/days', {
          method: 'POST',
          token: user.token,
          body: { targetDate: 'tomorrow' },
        });
        assert.equal(tomRepeat.status, 200);
        assert.equal(tomRepeat.body.data.id, tomCreate.body.data.id);
      });

      it('T1-ACT-02: POST /api/actions creates separate today and tomorrow goals', async () => {
        const user = await registerTestUser('t1_act_split');
        await apiRequest('/api/cycles', { method: 'POST', token: user.token });

        const todayAct = await apiRequest<{
          success: boolean;
          data: { id: string; logId: string; description: string };
        }>('/api/actions', {
          method: 'POST',
          token: user.token,
          body: {
            categoryId: categories[0].id,
            description: 'Today learning goal',
            targetDate: 'today',
          },
        });
        assert.equal(todayAct.status, 201);

        const tomorrowAct = await apiRequest<{
          success: boolean;
          data: { id: string; logId: string; description: string };
        }>('/api/actions', {
          method: 'POST',
          token: user.token,
          body: {
            categoryId: categories[0].id,
            description: 'Tomorrow learning goal',
            targetDate: 'tomorrow',
          },
        });
        assert.equal(tomorrowAct.status, 201);
        assert.notEqual(todayAct.body.data.logId, tomorrowAct.body.data.logId);
      });

      it('T1-ACT-03: PATCH /api/actions/:id updates description and toggles isCompleted', async () => {
        const user = await registerTestUser('t1_act_patch');
        await apiRequest('/api/cycles', { method: 'POST', token: user.token });
        const act = await apiRequest<{ data: { id: string } }>('/api/actions', {
          method: 'POST',
          token: user.token,
          body: { categoryId: categories[0].id, description: 'Initial', targetDate: 'today' },
        });

        const patched = await apiRequest<{
          success: boolean;
          data: { description: string; isCompleted: boolean };
        }>(`/api/actions/${act.body.data.id}`, {
          method: 'PATCH',
          token: user.token,
          body: { description: 'Updated goal', isCompleted: true },
        });
        assert.equal(patched.status, 200);
        assert.equal(patched.body.data.description, 'Updated goal');
        assert.equal(patched.body.data.isCompleted, true);
      });

      it('T1-ACT-04: DELETE /api/actions/:id removes planned action and updates progress', async () => {
        const user = await registerTestUser('t1_act_del');
        await apiRequest('/api/cycles', { method: 'POST', token: user.token });
        const act = await apiRequest<{ data: { id: string } }>('/api/actions', {
          method: 'POST',
          token: user.token,
          body: { categoryId: categories[2].id, description: 'Drink 2L water', targetDate: 'today' },
        });

        const delRes = await apiRequest<{ success: boolean; data: { id: string } }>(
          `/api/actions/${act.body.data.id}`,
          { method: 'DELETE', token: user.token }
        );
        assert.equal(delRes.status, 200);
        assert.equal(delRes.body.data.id, act.body.data.id);

        const prog = await apiRequest<{ stats: { totalActions: number } }>(
          '/api/cycle-progress/current',
          { token: user.token }
        );
        assert.equal(prog.body.stats.totalActions, 0);
      });

      it('T1-DAY-05: PATCH /api/days/:id closes today once all 8 pillars are planned for tomorrow', async () => {
        const user = await registerTestUser('t1_day_close');
        await apiRequest('/api/cycles', { method: 'POST', token: user.token });
        for (const cat of categories) {
          await apiRequest('/api/actions', {
            method: 'POST',
            token: user.token,
            body: { categoryId: cat.id, description: `Tomorrow ${cat.name}`, targetDate: 'tomorrow' },
          });
        }

        const prog = await apiRequest<{ todayLog: { id: string }; stats: { canCloseToday: boolean } }>(
          '/api/cycle-progress/current',
          { token: user.token }
        );
        assert.equal(prog.body.stats.canCloseToday, true);

        const closed = await apiRequest<{ success: boolean; data: { isClosed: boolean } }>(
          `/api/days/${prog.body.todayLog.id}`,
          { method: 'PATCH', token: user.token, body: { isClosed: true } }
        );
        assert.equal(closed.status, 200);
        assert.equal(closed.body.data.isClosed, true);
      });
    });
  });

  // =========================================================================
  // TIER 2 — BOUNDARY, VALIDATION & NEGATIVE TESTS (>=5 per feature area)
  // =========================================================================
  describe('Tier 2: Validation, Boundary & Negative Tests', () => {
    describe('Auth & JWT Security Boundaries', () => {
      it('T2-AUTH-01: rejects invalid email format with 400', async () => {
        const res = await apiRequest<{ success: boolean }>('/api/auth/register', {
          method: 'POST',
          body: { email: 'not-an-email', password: 'Password123!' },
        });
        assert.equal(res.status, 400);
        assert.equal(res.body.success, false);
      });

      it('T2-AUTH-02: rejects short password (<6 chars) with 400', async () => {
        const res = await apiRequest<{ success: boolean }>('/api/auth/register', {
          method: 'POST',
          body: { email: uniqueEmail('t2_shortpw'), password: '123' },
        });
        assert.equal(res.status, 400);
        assert.equal(res.body.success, false);
      });

      it('T2-AUTH-03: rejects duplicate registration with 400', async () => {
        const user = await registerTestUser('t2_dup');
        const dup = await apiRequest<{ success: boolean }>('/api/auth/register', {
          method: 'POST',
          body: { email: user.email, password: 'Password123!' },
        });
        assert.equal(dup.status, 400);
        assert.equal(dup.body.success, false);
      });

      it('T2-AUTH-04: rejects wrong login password with 401', async () => {
        const user = await registerTestUser('t2_badpw');
        const res = await apiRequest<{ success: boolean }>('/api/auth/login', {
          method: 'POST',
          body: { email: user.email, password: 'WrongPassword!' },
        });
        assert.equal(res.status, 401);
        assert.equal(res.body.success, false);
      });

      it('T2-AUTH-05: rejects missing or malformed JWT Bearer token with 401', async () => {
        const noAuth = await apiRequest('/api/cycles');
        assert.equal(noAuth.status, 401);

        const badAuth = await apiRequest('/api/cycles', { token: 'invalid.jwt.token' });
        assert.equal(badAuth.status, 401);
      });
    });

    describe('Forgot & Reset Password Validation & Security Boundaries', () => {
      it('T2-AUTH-PW-01: POST /api/auth/forgot-password rejects malformed or empty email with 400', async () => {
        const malformed = await apiRequest<{ success: boolean }>('/api/auth/forgot-password', {
          method: 'POST',
          body: { email: 'not-an-email' },
        });
        assert.equal(malformed.status, 400);
        assert.equal(malformed.body.success, false);

        const empty = await apiRequest<{ success: boolean }>('/api/auth/forgot-password', {
          method: 'POST',
          body: { email: '   ' },
        });
        assert.equal(empty.status, 400);
        assert.equal(empty.body.success, false);
      });

      it('T2-AUTH-PW-02: anti-enumeration returns identical 200 data: null for unregistered email and in NODE_ENV=production', async () => {
        const expectedMessage =
          'If an account with that email exists, password reset instructions have been generated.';

        const unregistered = await apiRequest<{
          success: boolean;
          message: string;
          data: null;
        }>('/api/auth/forgot-password', {
          method: 'POST',
          body: { email: uniqueEmail('t2_pw_unreg') },
        });
        assert.equal(unregistered.status, 200);
        assert.equal(unregistered.body.success, true);
        assert.equal(unregistered.body.message, expectedMessage);
        assert.equal(unregistered.body.data, null);

        const user = await registerTestUser('t2_pw_prod');
        const prevNodeEnv = process.env.NODE_ENV;
        const prevExpose = process.env.EXPOSE_RESET_TOKEN;
        try {
          process.env.NODE_ENV = 'production';
          process.env.EXPOSE_RESET_TOKEN = 'true';

          const prodRes = await apiRequest<{
            success: boolean;
            message: string;
            data: null;
          }>('/api/auth/forgot-password', {
            method: 'POST',
            body: { email: user.email },
          });

          assert.equal(prodRes.status, 200);
          assert.equal(prodRes.body.success, true);
          assert.equal(prodRes.body.message, expectedMessage);
          assert.equal(prodRes.body.data, null);
        } finally {
          process.env.NODE_ENV = prevNodeEnv;
          if (prevExpose !== undefined) {
            process.env.EXPOSE_RESET_TOKEN = prevExpose;
          } else {
            delete process.env.EXPOSE_RESET_TOKEN;
          }
        }
      });

      it('T2-AUTH-PW-03: POST /api/auth/reset-password rejects missing token, short password, and unknown token with 400 (never 401)', async () => {
        const missingToken = await apiRequest<{ success: boolean }>('/api/auth/reset-password', {
          method: 'POST',
          body: { token: '   ', password: 'ValidPassword123!' },
        });
        assert.equal(missingToken.status, 400);
        assert.equal(missingToken.body.success, false);

        const shortPw = await apiRequest<{ success: boolean }>('/api/auth/reset-password', {
          method: 'POST',
          body: { token: 'some-token', password: '12345' },
        });
        assert.equal(shortPw.status, 400);
        assert.equal(shortPw.body.success, false);

        const unknownToken = await apiRequest<{ success: boolean; message: string }>(
          '/api/auth/reset-password',
          {
            method: 'POST',
            body: { token: 'f'.repeat(64), password: 'ValidPassword123!' },
          }
        );
        assert.equal(unknownToken.status, 400);
        assert.equal(unknownToken.body.success, false);
        assert.equal(unknownToken.body.message, 'Invalid or expired password reset token.');
      });

      it('T2-AUTH-PW-04: POST /api/auth/reset-password rejects expired token with 400 (never 401)', async () => {
        const user = await registerTestUser('t2_pw_expired');
        const forgot = await requestResetFromMailbox('/api/auth/forgot-password',
          { method: 'POST', body: { email: user.email } }
        );
        const tokenHash = crypto
          .createHash('sha256')
          .update(forgot.delivery.resetToken)
          .digest('hex');

        await prisma.passwordResetToken.update({
          where: { tokenHash },
          data: { expiresAt: new Date(Date.now() - 60 * 1000) },
        });

        const res = await apiRequest<{ success: boolean; message: string }>(
          '/api/auth/reset-password',
          {
            method: 'POST',
            body: { token: forgot.delivery.resetToken, password: 'NewPassword123!' },
          }
        );
        assert.equal(res.status, 400);
        assert.equal(res.body.success, false);
        assert.equal(res.body.message, 'Invalid or expired password reset token.');
      });

      it('T2-AUTH-PW-05: POST /api/auth/reset-password enforces atomic single-use (rejects reuse & concurrent replay with 400)', async () => {
        const user = await registerTestUser('t2_pw_reuse', 'InitialPass123!');
        const forgot = await requestResetFromMailbox('/api/auth/forgot-password',
          { method: 'POST', body: { email: user.email } }
        );

        // Concurrent replay: only one request can claim the token
        const [r1, r2] = await Promise.all([
          apiRequest<{ success: boolean }>('/api/auth/reset-password', {
            method: 'POST',
            body: { token: forgot.delivery.resetToken, password: 'FirstWinPassword!' },
          }),
          apiRequest<{ success: boolean }>('/api/auth/reset-password', {
            method: 'POST',
            body: { token: forgot.delivery.resetToken, password: 'SecondRacePassword!' },
          }),
        ]);
        const statuses = [r1.status, r2.status].sort((a, b) => a - b);
        assert.deepEqual(statuses, [200, 400]);

        // Sequential reuse must also fail with 400
        const reuse = await apiRequest<{ success: boolean; message: string }>(
          '/api/auth/reset-password',
          {
            method: 'POST',
            body: { token: forgot.delivery.resetToken, password: 'ThirdAttemptPassword!' },
          }
        );
        assert.equal(reuse.status, 400);
        assert.equal(reuse.body.success, false);

        // Old password must fail with 401
        const oldLogin = await apiRequest('/api/auth/login', {
          method: 'POST',
          body: { email: user.email, password: 'InitialPass123!' },
        });
        assert.equal(oldLogin.status, 401);
      });
    });

    describe('Cycles & Progress Boundaries', () => {
      it('T2-CYC-01: GET /api/cycle-progress/current returns 400 when user has no active cycle', async () => {
        const user = await registerTestUser('t2_nocyc');
        const res = await apiRequest<{ success: boolean }>('/api/cycle-progress/current', {
          token: user.token,
        });
        assert.equal(res.status, 400);
        assert.equal(res.body.success, false);
      });

      it('T2-CYC-02: GET /api/cycle-progress/:cycleId returns 404 for unknown cycleId', async () => {
        const user = await registerTestUser('t2_unk_cyc');
        const res = await apiRequest<{ success: boolean }>(
          '/api/cycle-progress/00000000-0000-0000-0000-000000000000',
          { token: user.token }
        );
        assert.equal(res.status, 404);
        assert.equal(res.body.success, false);
      });

      it('T2-CYC-03: POST /api/cycles rejects invalid categoryId in initialGoals with 400', async () => {
        const user = await registerTestUser('t2_bad_initgoal');
        const res = await apiRequest<{ success: boolean }>('/api/cycles', {
          method: 'POST',
          token: user.token,
          body: { initialGoals: [{ categoryId: 'nonexistent-cat', description: 'Test goal' }] },
        });
        assert.equal(res.status, 400);
        assert.equal(res.body.success, false);
      });

      it('T2-CYC-04: POST /api/cycles rejects empty initialGoals description with 400', async () => {
        const user = await registerTestUser('t2_empty_initgoal');
        const res = await apiRequest<{ success: boolean }>('/api/cycles', {
          method: 'POST',
          token: user.token,
          body: { initialGoals: [{ categoryId: categories[0].id, description: '   ' }] },
        });
        assert.equal(res.status, 400);
        assert.equal(res.body.success, false);
      });

      it('T2-CYC-05: GET /api/cycles returns null when active cycle endDate is expired', async () => {
        const user = await registerTestUser('t2_exp_cyc');
        const pastStart = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);
        const pastEnd = new Date(Date.now() - 9 * 24 * 60 * 60 * 1000);
        await prisma.cycle.create({
          data: { userId: user.id, startDate: pastStart, endDate: pastEnd, isActive: true },
        });

        const res = await apiRequest<{ success: boolean; data: null }>('/api/cycles', {
          token: user.token,
        });
        assert.equal(res.status, 200);
        assert.equal(res.body.data, null);
      });
    });

    describe('Days & Actions Validation & Gatekeeper Boundaries', () => {
      it('T2-ACT-01: POST /api/actions rejects whitespace-only description with 400', async () => {
        const user = await registerTestUser('t2_ws_act');
        await apiRequest('/api/cycles', { method: 'POST', token: user.token });

        const res = await apiRequest<{ success: boolean }>('/api/actions', {
          method: 'POST',
          token: user.token,
          body: { categoryId: categories[0].id, description: '    ', targetDate: 'today' },
        });
        assert.equal(res.status, 400);
        assert.equal(res.body.success, false);
      });

      it('T2-ACT-02: POST /api/actions rejects invalid categoryId with 400', async () => {
        const user = await registerTestUser('t2_bad_cat');
        await apiRequest('/api/cycles', { method: 'POST', token: user.token });

        const res = await apiRequest<{ success: boolean }>('/api/actions', {
          method: 'POST',
          token: user.token,
          body: { categoryId: 'nonexistent-category', description: 'Valid text' },
        });
        assert.equal(res.status, 400);
        assert.equal(res.body.success, false);
      });

      it('T2-ACT-03: PATCH /api/actions/:id rejects empty body or empty description with 400', async () => {
        const user = await registerTestUser('t2_bad_patch');
        await apiRequest('/api/cycles', { method: 'POST', token: user.token });
        const act = await apiRequest<{ data: { id: string } }>('/api/actions', {
          method: 'POST',
          token: user.token,
          body: { categoryId: categories[0].id, description: 'Original', targetDate: 'today' },
        });

        const emptyBody = await apiRequest('/api/actions/' + act.body.data.id, {
          method: 'PATCH',
          token: user.token,
          body: {},
        });
        assert.equal(emptyBody.status, 400);

        const emptyDesc = await apiRequest('/api/actions/' + act.body.data.id, {
          method: 'PATCH',
          token: user.token,
          body: { description: '   ' },
        });
        assert.equal(emptyDesc.status, 400);
      });

      it('T2-DAY-04: PATCH /api/days/:id rejects closing today with <8 tomorrow pillars (0/8 and 7/8)', async () => {
        const user = await registerTestUser('t2_gatekeeper');
        await apiRequest('/api/cycles', { method: 'POST', token: user.token });
        const prog0 = await apiRequest<{ todayLog: { id: string } }>(
          '/api/cycle-progress/current',
          { token: user.token }
        );

        const close0 = await apiRequest<{
          success: boolean;
          data: { plannedPillarsCount: number; requiredPillars: number };
        }>(`/api/days/${prog0.body.todayLog.id}`, {
          method: 'PATCH',
          token: user.token,
          body: { isClosed: true },
        });
        assert.equal(close0.status, 400);
        assert.equal(close0.body.data.plannedPillarsCount, 0);
        assert.equal(close0.body.data.requiredPillars, 8);

        for (let i = 0; i < 7; i++) {
          await apiRequest('/api/actions', {
            method: 'POST',
            token: user.token,
            body: { categoryId: categories[i].id, description: `Plan ${i}`, targetDate: 'tomorrow' },
          });
        }
        const close7 = await apiRequest<{
          success: boolean;
          data: { plannedPillarsCount: number; requiredPillars: number };
        }>(`/api/days/${prog0.body.todayLog.id}`, {
          method: 'PATCH',
          token: user.token,
          body: { isClosed: true },
        });
        assert.equal(close7.status, 400);
        assert.equal(close7.body.data.plannedPillarsCount, 7);
      });

      it('T2-DAY-05: POST /api/days rejects invalid targetDate and invalid cycleId format with 400', async () => {
        const user = await registerTestUser('t2_badday');
        const badTarget = await apiRequest('/api/days', {
          method: 'POST',
          token: user.token,
          body: { targetDate: 'yesterday' },
        });
        assert.equal(badTarget.status, 400);

        const badUuid = await apiRequest('/api/days', {
          method: 'POST',
          token: user.token,
          body: { cycleId: 'not-a-uuid' },
        });
        assert.equal(badUuid.status, 400);
      });
    });
  });

  // =========================================================================
  // TIER 3 — PAIRWISE CROSS-FEATURE INTERACTIONS
  // =========================================================================
  describe('Tier 3: Pairwise Cross-Feature Interactions', () => {
    it('T3-PAIR-01 (Auth x Multi-Tenancy): User B cannot view or mutate User A resources', async () => {
      const userA = await registerTestUser('t3_userA');
      const userB = await registerTestUser('t3_userB');

      const cycA = await apiRequest<{ data: { id: string } }>('/api/cycles', {
        method: 'POST',
        token: userA.token,
      });
      const actA = await apiRequest<{ data: { id: string; logId: string } }>('/api/actions', {
        method: 'POST',
        token: userA.token,
        body: { categoryId: categories[0].id, description: 'User A secret goal', targetDate: 'today' },
      });

      const bCycles = await apiRequest<{ data: unknown }>('/api/cycles', { token: userB.token });
      assert.equal(bCycles.body.data, null);

      const bDays = await apiRequest<{ data: unknown[] }>('/api/days', { token: userB.token });
      assert.equal(bDays.body.data.length, 0);

      const bProgA = await apiRequest(`/api/cycle-progress/${cycA.body.data.id}`, {
        token: userB.token,
      });
      assert.equal(bProgA.status, 404);

      const bPatchAct = await apiRequest(`/api/actions/${actA.body.data.id}`, {
        method: 'PATCH',
        token: userB.token,
        body: { isCompleted: true },
      });
      assert.equal(bPatchAct.status, 404);

      const bDelAct = await apiRequest(`/api/actions/${actA.body.data.id}`, {
        method: 'DELETE',
        token: userB.token,
      });
      assert.equal(bDelAct.status, 404);

      const bPatchDay = await apiRequest(`/api/days/${actA.body.data.logId}`, {
        method: 'PATCH',
        token: userB.token,
        body: { isClosed: true, forceClose: true },
      });
      assert.equal(bPatchDay.status, 404);

      const bCreateOnADay = await apiRequest('/api/actions', {
        method: 'POST',
        token: userB.token,
        body: {
          categoryId: categories[0].id,
          description: 'Injected into A',
          logId: actA.body.data.logId,
        },
      });
      assert.equal(bCreateOnADay.status, 404);
    });

    it('T3-PAIR-02 (Today vs Tomorrow x Upsert): re-planning same pillar updates in place without duplicating', async () => {
      const user = await registerTestUser('t3_upsert');
      await apiRequest('/api/cycles', { method: 'POST', token: user.token });

      const first = await apiRequest<{ data: { id: string; description: string } }>('/api/actions', {
        method: 'POST',
        token: user.token,
        body: { categoryId: categories[0].id, description: 'Read 10 pages', targetDate: 'tomorrow' },
      });
      const second = await apiRequest<{ data: { id: string; description: string } }>('/api/actions', {
        method: 'POST',
        token: user.token,
        body: { categoryId: categories[0].id, description: 'Read 25 pages', targetDate: 'tomorrow' },
      });

      assert.equal(first.body.data.id, second.body.data.id);
      assert.equal(second.body.data.description, 'Read 25 pages');

      const prog = await apiRequest<{ tomorrowLog: { plans: Array<{ id: string }> } }>(
        '/api/cycle-progress/current',
        { token: user.token }
      );
      assert.equal(prog.body.tomorrowLog.plans.length, 1);
    });

    it('T3-PAIR-03 (Close Day x Immutability): closed Today blocks POST/PATCH/DELETE while Tomorrow remains editable', async () => {
      const user = await registerTestUser('t3_immutable');
      await apiRequest('/api/cycles', { method: 'POST', token: user.token });

      const todayAct = await apiRequest<{ data: { id: string; logId: string } }>('/api/actions', {
        method: 'POST',
        token: user.token,
        body: { categoryId: categories[0].id, description: 'Day 1 task', targetDate: 'today' },
      });

      const tomorrowActs: string[] = [];
      for (const cat of categories) {
        const res = await apiRequest<{ data: { id: string } }>('/api/actions', {
          method: 'POST',
          token: user.token,
          body: { categoryId: cat.id, description: `Tom ${cat.name}`, targetDate: 'tomorrow' },
        });
        tomorrowActs.push(res.body.data.id);
      }

      const closeRes = await apiRequest(`/api/days/${todayAct.body.data.logId}`, {
        method: 'PATCH',
        token: user.token,
        body: { isClosed: true },
      });
      assert.equal(closeRes.status, 200);

      // Today mutations must all fail with 400
      const addClosed = await apiRequest('/api/actions', {
        method: 'POST',
        token: user.token,
        body: { categoryId: categories[1].id, description: 'Late add', targetDate: 'today' },
      });
      assert.equal(addClosed.status, 400);

      const patchClosed = await apiRequest(`/api/actions/${todayAct.body.data.id}`, {
        method: 'PATCH',
        token: user.token,
        body: { isCompleted: true },
      });
      assert.equal(patchClosed.status, 400);

      const delClosed = await apiRequest(`/api/actions/${todayAct.body.data.id}`, {
        method: 'DELETE',
        token: user.token,
      });
      assert.equal(delClosed.status, 400);

      // Tomorrow plan remains editable
      const patchTom = await apiRequest<{ success: boolean; data: { description: string } }>(
        `/api/actions/${tomorrowActs[0]}`,
        {
          method: 'PATCH',
          token: user.token,
          body: { description: 'Refined tomorrow plan' },
        }
      );
      assert.equal(patchTom.status, 200);
      assert.equal(patchTom.body.data.description, 'Refined tomorrow plan');
    });

    it('T3-PAIR-04 (Cycle Rollover x Analytics): starting new cycle deactivates prior cycle while retaining historical progress', async () => {
      const user = await registerTestUser('t3_rollover');
      const cyc1 = await apiRequest<{ data: { id: string } }>('/api/cycles', {
        method: 'POST',
        token: user.token,
        body: {
          initialGoals: [{ categoryId: categories[0].id, description: 'Sprint 1 goal' }],
        },
      });
      const prog1 = await apiRequest<{ todayLog: { plans: Array<{ id: string }> } }>(
        '/api/cycle-progress/current',
        { token: user.token }
      );
      await apiRequest(`/api/actions/${prog1.body.todayLog.plans[0].id}`, {
        method: 'PATCH',
        token: user.token,
        body: { isCompleted: true },
      });

      const cyc2 = await apiRequest<{ data: { id: string } }>('/api/cycles', {
        method: 'POST',
        token: user.token,
      });
      assert.notEqual(cyc1.body.data.id, cyc2.body.data.id);

      const hist = await apiRequest<{
        data: Array<{ id: string; isActive: boolean; summary: { completedActions: number } }>;
      }>('/api/cycles/history', { token: user.token });
      assert.equal(hist.body.data.length, 2);

      const oldCycle = hist.body.data.find((c) => c.id === cyc1.body.data.id);
      const newCycle = hist.body.data.find((c) => c.id === cyc2.body.data.id);
      assert.equal(oldCycle?.isActive, false);
      assert.equal(oldCycle?.summary.completedActions, 1);
      assert.equal(newCycle?.isActive, true);
    });

    it('T3-PAIR-05 (Password Reset x Multi-Tenancy & Data Retention): resetting User A password retains User A sprint data and never impacts User B', async () => {
      const userA = await registerTestUser('t3_pw_userA', 'UserAPass123!');
      const userB = await registerTestUser('t3_pw_userB', 'UserBPass123!');

      await apiRequest('/api/cycles', {
        method: 'POST',
        token: userA.token,
        body: { initialGoals: [{ categoryId: categories[0].id, description: 'User A retained goal' }] },
      });
      await apiRequest('/api/cycles', {
        method: 'POST',
        token: userB.token,
        body: { initialGoals: [{ categoryId: categories[1].id, description: 'User B untouched goal' }] },
      });

      const forgotA = await requestResetFromMailbox('/api/auth/forgot-password',
        { method: 'POST', body: { email: userA.email } }
      );
      const resetA = await apiRequest('/api/auth/reset-password', {
        method: 'POST',
        body: { token: forgotA.delivery.resetToken, password: 'UserANewPass123!' },
      });
      assert.equal(resetA.status, 200);

      const loginA = await apiRequest<{ data: { token: string } }>('/api/auth/login', {
        method: 'POST',
        body: { email: userA.email, password: 'UserANewPass123!' },
      });
      assert.equal(loginA.status, 200);

      const progA = await apiRequest<{
        todayLog: { plans: Array<{ description: string }> };
      }>('/api/cycle-progress/current', { token: loginA.body.data.token });
      assert.equal(progA.status, 200);
      assert.equal(progA.body.todayLog.plans[0].description, 'User A retained goal');

      // User B's credentials and data remain completely unaffected
      const loginB = await apiRequest<{ data: { token: string } }>('/api/auth/login', {
        method: 'POST',
        body: { email: userB.email, password: 'UserBPass123!' },
      });
      assert.equal(loginB.status, 200);
      const progB = await apiRequest<{
        todayLog: { plans: Array<{ description: string }> };
      }>('/api/cycle-progress/current', { token: loginB.body.data.token });
      assert.equal(progB.status, 200);
      assert.equal(progB.body.todayLog.plans[0].description, 'User B untouched goal');
    });
  });

  // =========================================================================
  // TIER 4 — REAL-WORLD END-TO-END APPLICATION SCENARIOS (>=6 scenarios)
  // =========================================================================
  describe('Tier 4: Real-World E2E Scenarios', () => {
    it('T4-SCEN-01: New User Onboarding & Day 1 Kickoff (6/8 done -> 75% completion)', async () => {
      const user = await registerTestUser('t4_onboard');

      const initialGoals = categories.map((cat, idx) => ({
        categoryId: cat.id,
        description: `Day 1 ${cat.name} action #${idx + 1}`,
      }));

      const cycRes = await apiRequest<{ success: boolean; data: { id: string } }>('/api/cycles', {
        method: 'POST',
        token: user.token,
        body: { initialGoals },
      });
      assert.equal(cycRes.status, 201);

      const progInitial = await apiRequest<{
        todayLog: { plans: Array<{ id: string; description: string }> };
      }>('/api/cycle-progress/current', { token: user.token });
      assert.equal(progInitial.body.todayLog.plans.length, 8);

      // Complete 6 of 8 goals
      for (let i = 0; i < 6; i++) {
        const res = await apiRequest(`/api/actions/${progInitial.body.todayLog.plans[i].id}`, {
          method: 'PATCH',
          token: user.token,
          body: { isCompleted: true },
        });
        assert.equal(res.status, 200);
      }

      // Edit 1 goal description
      const edited = await apiRequest<{ data: { description: string } }>(
        `/api/actions/${progInitial.body.todayLog.plans[0].id}`,
        {
          method: 'PATCH',
          token: user.token,
          body: { description: 'Read 30 pages of Distributed Systems' },
        }
      );
      assert.equal(edited.status, 200);
      assert.equal(edited.body.data.description, 'Read 30 pages of Distributed Systems');

      const progFinal = await apiRequest<{
        stats: {
          overallCompletionRate: number;
          completedActions: number;
          totalActions: number;
          todayPlannedCount: number;
          todayCompletedCount: number;
        };
      }>('/api/cycle-progress/current', { token: user.token });

      assert.equal(progFinal.status, 200);
      assert.equal(progFinal.body.stats.totalActions, 8);
      assert.equal(progFinal.body.stats.completedActions, 6);
      assert.equal(progFinal.body.stats.overallCompletionRate, 75);
      assert.equal(progFinal.body.stats.todayPlannedCount, 8);
      assert.equal(progFinal.body.stats.todayCompletedCount, 6);
    });

    it('T4-SCEN-02: Proactive Evening Loop & Close Day Gatekeeper (3/8 blocked -> 8/8 unlocked -> locked)', async () => {
      const user = await registerTestUser('t4_evening');
      await apiRequest('/api/cycles', { method: 'POST', token: user.token });

      const progStart = await apiRequest<{ todayLog: { id: string } }>(
        '/api/cycle-progress/current',
        { token: user.token }
      );
      const todayLogId = progStart.body.todayLog.id;

      // Plan 3 of 8 tomorrow pillars
      for (let i = 0; i < 3; i++) {
        await apiRequest('/api/actions', {
          method: 'POST',
          token: user.token,
          body: {
            categoryId: categories[i].id,
            description: `Tomorrow ${categories[i].name}`,
            targetDate: 'tomorrow',
          },
        });
      }

      const blocked = await apiRequest<{
        success: boolean;
        data: { plannedPillarsCount: number; requiredPillars: number };
      }>(`/api/days/${todayLogId}`, {
        method: 'PATCH',
        token: user.token,
        body: { isClosed: true },
      });
      assert.equal(blocked.status, 400);
      assert.equal(blocked.body.data.plannedPillarsCount, 3);

      // Plan remaining 5 pillars
      const tomorrowIds: string[] = [];
      for (let i = 3; i < 8; i++) {
        const res = await apiRequest<{ data: { id: string } }>('/api/actions', {
          method: 'POST',
          token: user.token,
          body: {
            categoryId: categories[i].id,
            description: `Tomorrow ${categories[i].name}`,
            targetDate: 'tomorrow',
          },
        });
        tomorrowIds.push(res.body.data.id);
      }

      const readyProg = await apiRequest<{
        stats: { tomorrowPlannedCount: number; canCloseToday: boolean };
      }>('/api/cycle-progress/current', { token: user.token });
      assert.equal(readyProg.body.stats.tomorrowPlannedCount, 8);
      assert.equal(readyProg.body.stats.canCloseToday, true);

      // Close Day 1
      const closeOk = await apiRequest<{ success: boolean; data: { isClosed: boolean } }>(
        `/api/days/${todayLogId}`,
        { method: 'PATCH', token: user.token, body: { isClosed: true } }
      );
      assert.equal(closeOk.status, 200);
      assert.equal(closeOk.body.data.isClosed, true);

      // Today locked, Tomorrow still editable
      const todayMut = await apiRequest('/api/actions', {
        method: 'POST',
        token: user.token,
        body: { categoryId: categories[0].id, description: 'Blocked edit', targetDate: 'today' },
      });
      assert.equal(todayMut.status, 400);

      const tomMut = await apiRequest(`/api/actions/${tomorrowIds[0]}`, {
        method: 'PATCH',
        token: user.token,
        body: { description: 'Adjusted tomorrow action' },
      });
      assert.equal(tomMut.status, 200);
    });

    it('T4-SCEN-03: Multi-Tenant Isolation Under Concurrent Users', async () => {
      const [userA, userB] = await Promise.all([
        registerTestUser('t4_conA'),
        registerTestUser('t4_conB'),
      ]);

      await Promise.all([
        apiRequest('/api/cycles', {
          method: 'POST',
          token: userA.token,
          body: { initialGoals: [{ categoryId: categories[0].id, description: 'A private' }] },
        }),
        apiRequest('/api/cycles', {
          method: 'POST',
          token: userB.token,
          body: { initialGoals: [{ categoryId: categories[1].id, description: 'B private' }] },
        }),
      ]);

      const [progA, progB] = await Promise.all([
        apiRequest<{ todayLog: { id: string; plans: Array<{ id: string; description: string }> } }>(
          '/api/cycle-progress/current',
          { token: userA.token }
        ),
        apiRequest<{ todayLog: { id: string; plans: Array<{ id: string; description: string }> } }>(
          '/api/cycle-progress/current',
          { token: userB.token }
        ),
      ]);

      assert.equal(progA.body.todayLog.plans[0].description, 'A private');
      assert.equal(progB.body.todayLog.plans[0].description, 'B private');

      const [crossPatchAct, crossDelAct, crossCloseDay] = await Promise.all([
        apiRequest(`/api/actions/${progA.body.todayLog.plans[0].id}`, {
          method: 'PATCH',
          token: userB.token,
          body: { isCompleted: true },
        }),
        apiRequest(`/api/actions/${progA.body.todayLog.plans[0].id}`, {
          method: 'DELETE',
          token: userB.token,
        }),
        apiRequest(`/api/days/${progA.body.todayLog.id}`, {
          method: 'PATCH',
          token: userB.token,
          body: { isClosed: true, forceClose: true },
        }),
      ]);

      assert.equal(crossPatchAct.status, 404);
      assert.equal(crossDelAct.status, 404);
      assert.equal(crossCloseDay.status, 404);
    });

    it('T4-SCEN-04: Multi-Day Sprint Progression, Pillar Analytics & History Inspection', async () => {
      const user = await registerTestUser('t4_analytics');

      // Seed a 3-day progression starting 2 days ago
      const day1Date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const day2Date = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
      const day3Date = new Date();
      const endDate = new Date(day1Date.getTime() + 31 * 24 * 60 * 60 * 1000);

      const cycle = await prisma.cycle.create({
        data: { userId: user.id, startDate: day1Date, endDate, isActive: true },
      });

      const [log1, log2, log3] = await Promise.all([
        prisma.dailyLog.create({ data: { userId: user.id, cycleId: cycle.id, date: day1Date, isClosed: true } }),
        prisma.dailyLog.create({ data: { userId: user.id, cycleId: cycle.id, date: day2Date, isClosed: true } }),
        prisma.dailyLog.create({ data: { userId: user.id, cycleId: cycle.id, date: day3Date, isClosed: false } }),
      ]);

      await prisma.plannedAction.createMany({
        data: [
          { userId: user.id, logId: log1.id, categoryId: categories[0].id, description: 'D1 Learn', isCompleted: true },
          { userId: user.id, logId: log1.id, categoryId: categories[1].id, description: 'D1 Health', isCompleted: false },
          { userId: user.id, logId: log2.id, categoryId: categories[0].id, description: 'D2 Learn', isCompleted: true },
          { userId: user.id, logId: log2.id, categoryId: categories[1].id, description: 'D2 Health', isCompleted: true },
          { userId: user.id, logId: log3.id, categoryId: categories[0].id, description: 'D3 Learn', isCompleted: true },
        ],
      });

      const prog = await apiRequest<{
        stats: {
          currentDayNumber: number;
          daysLogged: number;
          closedDays: number;
          totalActions: number;
          completedActions: number;
          overallCompletionRate: number;
          currentStreak: number;
        };
        pillarStats: Array<{
          categoryId: string;
          plannedCount: number;
          completedCount: number;
          completionRate: number;
          currentStreak: number;
        }>;
        dailySeries: Array<{ dayNumber: number; planned: number; completed: number; isClosed: boolean }>;
        recentActivity: Array<{ description: string }>;
      }>('/api/cycle-progress/current', { token: user.token });

      assert.equal(prog.status, 200);
      assert.equal(prog.body.stats.currentDayNumber, 3);
      assert.equal(prog.body.stats.daysLogged, 3);
      assert.equal(prog.body.stats.closedDays, 2);
      assert.equal(prog.body.stats.totalActions, 5);
      assert.equal(prog.body.stats.completedActions, 4);
      assert.equal(prog.body.stats.overallCompletionRate, 80);
      assert.equal(prog.body.stats.currentStreak, 3);

      assert.equal(prog.body.pillarStats.length, 8);
      const learnStat = prog.body.pillarStats.find((p) => p.categoryId === categories[0].id);
      assert.equal(learnStat?.plannedCount, 3);
      assert.equal(learnStat?.completedCount, 3);
      assert.equal(learnStat?.completionRate, 100);
      assert.equal(learnStat?.currentStreak, 3);

      assert.equal(prog.body.dailySeries.length, 3);
      assert.deepEqual(
        prog.body.dailySeries.map((d) => d.dayNumber),
        [1, 2, 3]
      );
      assert.ok(prog.body.recentActivity.length >= 5);
    });

    it('T4-SCEN-05: Day 31 Completion & Next Sprint Rollover without Day 32 planning', async () => {
      const user = await registerTestUser('t4_day31');

      const start30DaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endTomorrow = new Date(start30DaysAgo.getTime() + 31 * 24 * 60 * 60 * 1000);

      const cycle1 = await prisma.cycle.create({
        data: { userId: user.id, startDate: start30DaysAgo, endDate: endTomorrow, isActive: true },
      });
      const day31Log = await prisma.dailyLog.create({
        data: { userId: user.id, cycleId: cycle1.id, date: new Date(), isClosed: false },
      });
      await prisma.plannedAction.create({
        data: {
          userId: user.id,
          logId: day31Log.id,
          categoryId: categories[0].id,
          description: 'Day 31 final sprint milestone',
          isCompleted: true,
        },
      });

      const preCloseProg = await apiRequest<{
        stats: { currentDayNumber: number; canCloseToday: boolean };
      }>('/api/cycle-progress/current', { token: user.token });
      assert.equal(preCloseProg.body.stats.currentDayNumber, 31);
      assert.equal(preCloseProg.body.stats.canCloseToday, true);

      // Day 31 closes cleanly with 0 tomorrow plans
      const closeDay31 = await apiRequest<{ success: boolean; data: { isClosed: boolean } }>(
        `/api/days/${day31Log.id}`,
        { method: 'PATCH', token: user.token, body: { isClosed: true } }
      );
      assert.equal(closeDay31.status, 200);
      assert.equal(closeDay31.body.data.isClosed, true);

      // Start Next 31-Day Sprint rollover
      const cycle2 = await apiRequest<{ success: boolean; data: { id: string; isActive: boolean } }>(
        '/api/cycles',
        { method: 'POST', token: user.token }
      );
      assert.equal(cycle2.status, 201);
      assert.notEqual(cycle2.body.data.id, cycle1.id);

      const hist = await apiRequest<{
        data: Array<{ id: string; isActive: boolean }>;
      }>('/api/cycles/history', { token: user.token });
      assert.equal(hist.body.data.length, 2);
      assert.equal(hist.body.data.find((c) => c.id === cycle1.id)?.isActive, false);
      assert.equal(hist.body.data.find((c) => c.id === cycle2.body.data.id)?.isActive, true);
    });

    it('T4-SCEN-06: API Contract Consistency & Envelope Verification across all endpoints', async () => {
      const user = await registerTestUser('t4_contracts');
      const rootRes = await apiRequest<{ message: string }>('/');
      assert.equal(rootRes.status, 200);
      assert.ok(rootRes.body.message);

      const habitsRes = await apiRequest<{ success: boolean; data: Array<{ id: string }> }>(
        '/api/habits',
        { token: user.token }
      );
      assert.equal(habitsRes.status, 200);
      assert.equal(habitsRes.body.success, true);
      assert.equal(habitsRes.body.data.length, 8);

      const cycRes = await apiRequest<{ success: boolean; data: { id: string } }>('/api/cycles', {
        method: 'POST',
        token: user.token,
      });
      assert.equal(cycRes.status, 201);
      assert.equal(cycRes.body.success, true);

      const daysRes = await apiRequest<{ success: boolean; data: Array<{ id: string }> }>(
        `/api/days?cycleId=${cycRes.body.data.id}`,
        { token: user.token }
      );
      assert.equal(daysRes.status, 200);
      assert.equal(daysRes.body.success, true);
      assert.equal(daysRes.body.data.length, 1);

      const progRes = await apiRequest<{
        success: boolean;
        stats: Record<string, unknown>;
        data: { stats: Record<string, unknown> };
      }>(`/api/cycle-progress/${cycRes.body.data.id}`, { token: user.token });
      assert.equal(progRes.status, 200);
      assert.equal(progRes.body.success, true);
      assert.deepEqual(progRes.body.stats, progRes.body.data.stats);
    });

    it('T4-SCEN-07: Locked-Out User Password Recovery & Sprint Continuation', async () => {
      const user = await registerTestUser('t4_recovery', 'OriginalSecret123!');

      const cyc = await apiRequest<{ data: { id: string } }>('/api/cycles', {
        method: 'POST',
        token: user.token,
        body: {
          initialGoals: [{ categoryId: categories[0].id, description: 'Complete recovery Day 1 goal' }],
        },
      });
      assert.equal(cyc.status, 201);

      // User forgets password and fails login
      const failedLogin = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: { email: user.email, password: 'ForgottenWrongPassword!' },
      });
      assert.equal(failedLogin.status, 401);

      // Request password reset
      const forgotRes = await requestResetFromMailbox('/api/auth/forgot-password', {
        method: 'POST',
        body: { email: user.email },
      });
      assert.equal(forgotRes.status, 200);
      assert.ok(forgotRes.delivery.resetToken);

      // Reset password
      const resetRes = await apiRequest<{ success: boolean }>('/api/auth/reset-password', {
        method: 'POST',
        body: { token: forgotRes.delivery.resetToken, password: 'RecoveredSecret456!' },
      });
      assert.equal(resetRes.status, 200);
      const oldSession = await apiRequest('/api/cycles', { token: user.token });
      assert.equal(oldSession.status, 401);

      // Old password fails, token reuse fails
      const oldLogin = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: { email: user.email, password: 'OriginalSecret123!' },
      });
      assert.equal(oldLogin.status, 401);

      const replayRes = await apiRequest('/api/auth/reset-password', {
        method: 'POST',
        body: { token: forgotRes.delivery.resetToken, password: 'AnotherPassword789!' },
      });
      assert.equal(replayRes.status, 400);

      // Log in with new password and continue sprint
      const newLogin = await apiRequest<{
        success: boolean;
        data: { token: string; id: string; email: string };
      }>('/api/auth/login', {
        method: 'POST',
        body: { email: user.email, password: 'RecoveredSecret456!' },
      });
      assert.equal(newLogin.status, 200);
      assert.equal(newLogin.body.data.id, user.id);

      const progBefore = await apiRequest<{
        todayLog: { plans: Array<{ id: string; isCompleted: boolean }> };
      }>('/api/cycle-progress/current', { token: newLogin.body.data.token });
      assert.equal(progBefore.status, 200);
      assert.equal(progBefore.body.todayLog.plans.length, 1);

      const completeAct = await apiRequest<{ success: boolean; data: { isCompleted: boolean } }>(
        `/api/actions/${progBefore.body.todayLog.plans[0].id}`,
        {
          method: 'PATCH',
          token: newLogin.body.data.token,
          body: { isCompleted: true },
        }
      );
      assert.equal(completeAct.status, 200);
      assert.equal(completeAct.body.data.isCompleted, true);

      const progAfter = await apiRequest<{ stats: { overallCompletionRate: number } }>(
        '/api/cycle-progress/current',
        { token: newLogin.body.data.token }
      );
      assert.equal(progAfter.status, 200);
      assert.equal(progAfter.body.stats.overallCompletionRate, 100);
    });
  });
});
