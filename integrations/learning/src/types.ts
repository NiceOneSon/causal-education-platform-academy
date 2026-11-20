// learning 레포와 주고받는 형식. learning 쪽 계약이 정해지면 그에 맞춰 바꾼다 (가정).

/** academy가 저장한 제출 하나를 learning에 넘길 때의 형식. 학생 이름 등 개인정보는 넘기지 않는다. */
export interface SubmissionForLearning {
  /** academy DB의 제출 id */
  submissionId: string;
  /** 학생을 가리키는 불투명 id (이름이 아님) */
  studentRef: string;
  itemId: string;
  itemVersion: string;
  answer: unknown;
  submittedAt: string;
}

export interface SubmitReceipt {
  /** learning이 준 접수 번호. 결과를 찾을 때 쓴다. */
  ticket: string;
}

/** learning이 돌려주는 결과. 내용은 learning이 정하고 academy는 저장·전달만 한다. */
export type LearningResult =
  | { status: 'pending'; ticket: string }
  | { status: 'done'; ticket: string; submissionId: string; payload: unknown; completedAt: string };

/** learning에서 승인·배포된 문항. academy에서는 읽기만 한다. */
export interface PublishedItem {
  itemId: string;
  version: string;
  publishedAt: string;
  content: unknown;
}

export interface LearningClient {
  submit(submission: SubmissionForLearning): Promise<SubmitReceipt>;
  getResult(ticket: string): Promise<LearningResult>;
  listPublishedItems(since?: string): Promise<PublishedItem[]>;
}
