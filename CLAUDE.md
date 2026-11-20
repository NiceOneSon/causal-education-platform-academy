# causal-education-academy

학원용 B2B 제품이다. 원장·강사·학생·학부모가 쓴다.
상위 `causal-education/CLAUDE.md`(레포 간 공통 규칙)를 먼저 따른다.

## 이 레포가 하는 일

- 서버는 DB의 데이터를 REST로 전달만 한다. 채점·진단·분석은 하지 않는다.
- 채점(규칙 기반)·진단·처방은 learning 레포가 한다.
  academy는 제출을 저장해 learning에 넘기고, 결과를 받아 저장·전달한다.
- 문항은 learning에서 승인·배포된 것만 받는다. `item-bank/` 는 읽기 전용 사본이다.

## 지킬 규칙

1. 학생 데이터는 운영 DB에만 있다. 코드·테스트·로그에는 가짜 데이터만 쓴다.
2. item-bank/ 는 읽기 전용이다. 문항 수정은 learning에서 한다.
3. 채점·분석 로직을 이 레포에 구현하지 않는다.
4. learning과 주고받는 코드는 integrations/learning/ 에만 둔다.
5. API는 contracts/ 의 OpenAPI를 먼저 고치고, 서버·웹은 그에 맞춘다.
6. DB 변경은 db/migrations/ 의 순수 SQL로만 한다. ORM 마이그레이션을 쓰지 않는다.

## 작업 방식

- main에 직접 push하지 않는다. PR로만 반영한다.
- 보호 경로: `db/migrations/`. 고쳐야 할 것 같으면 고치지 말고 PR 설명에 "founder-a 확인 필요"로 적는다.
  (중앙 레포의 `decisions/`, `harness/` 도 보호 경로다.)
- 운영 DB 자격증명은 쓰지 않는다. 로컬 개발 DB만 쓴다.
- 미뤄진 결정은 정하지 않는다: learning 엔진을 서비스로 부를지 패키지로 쓸지, 배포 통과 기준, B2C.

## 구조

| 경로 | 무엇 |
|---|---|
| `apps/api/` | REST 서버 (TypeScript, Fastify, Node 24가 `.ts`를 직접 실행) |
| `apps/api/modules/` | academies · homework · item-bank · results · billing |
| `apps/web/` | 원장·강사·학생·학부모 화면 (React + Vite SPA) |
| `contracts/` | OpenAPI 원본과 거기서 생성한 타입. 서버·웹 둘 다 여기에 맞춘다 |
| `integrations/learning/` | learning과 주고받는 코드 (지금은 인터페이스와 가짜 구현) |
| `integrations/messaging/` | 보고서 발송 |
| `db/migrations/` | 순수 SQL 마이그레이션 (보호) |
| `scripts/` | 마이그레이션 실행기, 개발용 가짜 데이터 |
| `tests/` | api · web · contracts · integrations 테스트 |

## 명령

```bash
npm install
npm run db:up            # 로컬 개발 Postgres (podman/docker)
npm run db:migrate       # DATABASE_URL 의 DB에 db/migrations 적용
npm run dev:api          # http://localhost:3000
npm run dev:web          # http://localhost:5173
npm test                 # 테스트 DB(이름이 _test 로 끝나야 함)에 대해 실행
npm run typecheck
npm run contracts:generate   # OpenAPI를 고친 뒤 타입 재생성 (CI가 최신인지 검사)
```

## API를 바꿀 때 순서

1. `contracts/openapi/*.yaml` 을 고친다.
2. `npm run contracts:generate` 로 타입을 다시 만든다.
3. 서버 핸들러를 맞춘다. 계약의 operationId에 핸들러가 없으면 서버가 뜨지 않는다.
4. DB가 바뀌면 `db/migrations/` 에 새 SQL 파일을 더한다 (기존 파일은 고치지 않는다).
