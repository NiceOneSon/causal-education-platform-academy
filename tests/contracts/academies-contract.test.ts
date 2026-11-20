// 서버가 계약의 모든 operation을 같은 method·경로로 구현하는지 확인한다 (규칙 5).
import Fastify from 'fastify';
import pg from 'pg';
import { describe, expect, it } from 'vitest';
import { buildApp, registerContract } from '../../apps/api/src/app.ts';
import { contract } from '../helpers/contract-schemas.ts';

describe('contracts/openapi/academies.yaml', () => {
  it('모든 operation에 서버 경로가 있다', async () => {
    const db = new pg.Pool(); // 연결하지 않는다
    const app = buildApp({ db });
    await app.ready();
    expect(contract.operations.length).toBeGreaterThan(0);
    for (const op of contract.operations) {
      expect(app.hasRoute({ method: op.method, url: op.url }), `${op.method} ${op.path}`).toBe(true);
    }
    await app.close();
    await db.end();
  });

  it('핸들러가 빠진 operation이 있으면 서버가 뜨지 않는다', () => {
    expect(() => registerContract(Fastify(), contract, {})).toThrow(/핸들러가 없다/);
  });

  it('계약에 없는 핸들러가 있으면 서버가 뜨지 않는다', () => {
    const handlers = Object.fromEntries(contract.operations.map((op) => [op.operationId, async () => ({})]));
    expect(() => registerContract(Fastify(), contract, { ...handlers, notInContract: async () => ({}) })).toThrow(
      /계약에 없는 핸들러/,
    );
  });
});
