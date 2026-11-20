import type { FastifyReply, FastifyRequest } from 'fastify';

/** 핸들러가 던지면 계약의 Error 형식({code, message})으로 응답한다. */
export class HttpError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export const notFound = (what: string) => new HttpError(404, 'NOT_FOUND', `${what}을(를) 찾을 수 없다`);

/** 계약의 operationId 하나를 처리한다. 응답 본문을 돌려주거나 reply 로 직접 보낸다. */
export type Handler = (request: FastifyRequest, reply: FastifyReply) => Promise<unknown>;

export type Handlers = Record<string, Handler>;
