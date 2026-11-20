// 로그인 전 첫 화면.
// 스타일은 디자인 시스템(causal-education-platform-design)이 연결되면 그 컴포넌트로 바꾼다.
// 그 전까지 이 레포에서 스타일을 따로 만들지 않는다.
const ROLES = ['원장', '강사', '학생', '학부모'] as const;

export function Landing() {
  return (
    <main>
      <h1>Causal Education Academy</h1>
      <p>학원 운영과 숙제 관리를 한곳에서.</p>
      <ul aria-label="이용 대상">
        {ROLES.map((role) => (
          <li key={role}>{role}</li>
        ))}
      </ul>
      <button type="button" disabled>
        로그인 (준비 중)
      </button>
    </main>
  );
}
