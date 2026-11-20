import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from '../../apps/web/src/App.tsx';

afterEach(cleanup);

describe('web', () => {
  it('로그인 전 첫 화면을 보여 준다', () => {
    render(<App path="/" />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Causal Education Academy');
    for (const role of ['원장', '강사', '학생', '학부모']) expect(screen.getByText(role)).toBeTruthy();
    expect(screen.getByRole('button', { name: /로그인/ }).hasAttribute('disabled')).toBe(true);
  });

  it('/app 은 빈 화면이다', () => {
    render(<App path="/app" />);
    expect(screen.getByRole('main', { name: '앱' }).childElementCount).toBe(0);
  });
});
