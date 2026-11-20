# contracts

API 요청·응답 형식의 원본이다. 서버(`apps/api`)와 웹(`apps/web`)은 이 파일에 맞춘다.

- `openapi/*.yaml`: 사람이 고치는 원본 (모듈마다 파일 하나)
- `generated/*.ts`: `npm run contracts:generate` 로 만든 타입. 손으로 고치지 않는다.
  CI가 원본과 생성물이 맞는지 검사한다.

서버는 시작할 때 이 YAML을 읽어 요청 검사와 응답 형식에 그대로 쓴다.
계약에 있는 operationId에 핸들러가 없으면 서버가 뜨지 않는다.
