// 개발·테스트용 가짜 learning. 채점하지 않는다.
// 결과는 테스트가 completeWith() 로 정해 줄 때까지 pending 이다.
import type { LearningClient, LearningResult, PublishedItem, SubmissionForLearning } from './types.ts';

export interface StubLearningClient extends LearningClient {
  /** 테스트에서 결과를 채운다 (learning이 나중에 결과를 돌려준 상황을 흉내 낸다). */
  completeWith(ticket: string, payload: unknown): void;
  /** 테스트에서 배포 문항을 넣는다. */
  publish(item: PublishedItem): void;
  readonly submissions: readonly SubmissionForLearning[];
}

export function createStubLearningClient(): StubLearningClient {
  const submissions: SubmissionForLearning[] = [];
  const tickets = new Map<string, SubmissionForLearning>();
  const results = new Map<string, LearningResult>();
  const items: PublishedItem[] = [];
  let seq = 0;

  return {
    submissions,

    async submit(submission) {
      const ticket = `stub-${++seq}`;
      submissions.push(submission);
      tickets.set(ticket, submission);
      results.set(ticket, { status: 'pending', ticket });
      return { ticket };
    },

    async getResult(ticket) {
      const result = results.get(ticket);
      if (!result) throw new Error(`unknown ticket: ${ticket}`);
      return result;
    },

    async listPublishedItems(since) {
      return items.filter((i) => !since || i.publishedAt > since);
    },

    completeWith(ticket, payload) {
      const submission = tickets.get(ticket);
      if (!submission) throw new Error(`unknown ticket: ${ticket}`);
      results.set(ticket, {
        status: 'done',
        ticket,
        submissionId: submission.submissionId,
        payload,
        completedAt: new Date().toISOString(),
      });
    },

    publish(item) {
      items.push(item);
    },
  };
}
