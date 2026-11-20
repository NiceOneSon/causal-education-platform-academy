import { describe, expect, it } from 'vitest';
import { createStubLearningClient } from '../../integrations/learning/src/index.ts';

const submission = {
  submissionId: 'sub-1',
  studentRef: 'student-ref-1',
  itemId: 'item-1',
  itemVersion: 'v1',
  answer: { choice: 2 },
  submittedAt: '2026-01-01T00:00:00.000Z',
};

describe('가짜 learning', () => {
  it('제출을 받으면 결과는 pending 이고, 나중에 채워진다', async () => {
    const learning = createStubLearningClient();
    const { ticket } = await learning.submit(submission);
    expect(await learning.getResult(ticket)).toEqual({ status: 'pending', ticket });

    learning.completeWith(ticket, { note: '테스트가 정한 결과' });
    const result = await learning.getResult(ticket);
    expect(result.status).toBe('done');
    if (result.status === 'done') {
      expect(result.submissionId).toBe('sub-1');
      expect(result.payload).toEqual({ note: '테스트가 정한 결과' });
    }
  });

  it('배포된 문항만 돌려준다', async () => {
    const learning = createStubLearningClient();
    expect(await learning.listPublishedItems()).toEqual([]);
    learning.publish({ itemId: 'item-1', version: 'v1', publishedAt: '2026-01-02T00:00:00.000Z', content: {} });
    expect(await learning.listPublishedItems('2026-01-01T00:00:00.000Z')).toHaveLength(1);
    expect(await learning.listPublishedItems('2026-01-03T00:00:00.000Z')).toHaveLength(0);
  });
});
