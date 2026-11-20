# integrations/learning

learning 레포와 주고받는 코드는 여기에만 둔다 (규칙 4).

learning 엔진을 서비스로 부를지 패키지로 쓸지는 **아직 정하지 않았다**.
그래서 지금은 인터페이스(`src/types.ts`)와 가짜 구현(`src/stub.ts`)만 있다.
어느 쪽으로 정해지든 `LearningClient` 를 구현하는 파일 하나를 더하면 된다.

가정한 흐름:

1. academy가 제출을 자기 DB에 먼저 저장한다.
2. `submit()` 으로 learning에 넘기고 접수 번호(`ticket`)를 받는다.
3. 결과는 나중에 채워진다. `getResult(ticket)` 가 `pending` 이면 아직이다.
4. 문항은 `listPublishedItems()` 로 배포된 것만 받는다.

stub은 채점하지 않는다. 테스트가 정해 준 결과를 그대로 돌려줄 뿐이다.
