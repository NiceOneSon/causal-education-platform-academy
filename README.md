# causal-education-academy

학원용 B2B 제품(원장·강사·학생·학부모). 서버는 DB 데이터를 REST로 전달만 하고, 채점·진단·처방은 learning 레포가 한다.

작업 규칙과 구조는 [CLAUDE.md](CLAUDE.md)를 본다.

```bash
npm install
npm run db:up && npm run db:migrate   # DATABASE_URL 은 .env.example 참고
npm run dev:api
npm run dev:web
npm test
```
