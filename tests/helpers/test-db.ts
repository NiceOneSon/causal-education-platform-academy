// 테스트는 이름이 _test 로 끝나는 로컬/CI DB에만 붙는다. 운영 DB를 실수로 쓰지 않게 막는다.
const DEFAULT_URL = 'postgres://academy:academy@localhost:55432/academy_test';

export function testDatabaseUrl(): string {
  const url = process.env.TEST_DATABASE_URL ?? DEFAULT_URL;
  const { hostname, pathname } = new URL(url);
  if (!pathname.endsWith('_test')) {
    throw new Error(`테스트 DB 이름은 _test 로 끝나야 한다: ${pathname}`);
  }
  if (!['localhost', '127.0.0.1', '::1', 'postgres', 'db'].includes(hostname)) {
    throw new Error(`테스트는 로컬 DB에만 붙는다: ${hostname}`);
  }
  return url;
}
