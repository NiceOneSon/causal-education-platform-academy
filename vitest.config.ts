import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'api',
          include: ['tests/api/**/*.test.ts', 'tests/contracts/**/*.test.ts'],
          environment: 'node',
          globalSetup: ['tests/helpers/global-setup.ts'],
          // 테스트 DB 하나를 같이 쓰므로 파일을 차례로 돌린다.
          fileParallelism: false,
        },
      },
      {
        test: {
          name: 'integrations',
          include: ['tests/integrations/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        plugins: [react()],
        test: {
          name: 'web',
          include: ['tests/web/**/*.test.tsx'],
          environment: 'jsdom',
        },
      },
    ],
  },
});
