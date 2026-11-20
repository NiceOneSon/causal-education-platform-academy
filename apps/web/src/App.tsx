import { AppHome } from './screens/AppHome.tsx';
import { Landing } from './screens/Landing.tsx';

/** 로그인 기능이 생기기 전까지는 경로만 보고 화면을 고른다. */
export function App({ path = window.location.pathname }: { path?: string }) {
  return path.startsWith('/app') ? <AppHome /> : <Landing />;
}
