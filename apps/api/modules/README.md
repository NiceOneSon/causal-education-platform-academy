# apps/api/modules

| 모듈 | 하는 일 | 상태 |
|---|---|---|
| `academies/` | 학원, 반, 강사, 학생 등록 | 동작함 (계약: `contracts/openapi/academies.yaml`) |
| `homework/` | 숙제 배정, 제출 저장 | 폴더만 |
| `item-bank/` | learning에서 배포된 문항 (읽기 전용) | 폴더만 |
| `results/` | learning 결과 저장·전달 | 폴더만 |
| `billing/` | 결제·구독 | 폴더만 |

모듈 하나는 `handlers.ts`(계약의 operationId 마다 핸들러)와 `repository.ts`(순수 SQL)로 만든다.
새 모듈은 `contracts/openapi/<모듈>.yaml` 을 먼저 쓰고 시작한다.
