// contracts/openapi/*.yaml 을 읽어 Fastify가 쓰는 요청 검사·응답 형식 스키마로 바꾼다.
// 계약이 원본이고, 서버는 여기서 만든 스키마를 그대로 쓴다.
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

type Json = Record<string, unknown>;

export interface ContractOperation {
  operationId: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Fastify 경로 문법: /academies/:academyId */
  url: string;
  /** OpenAPI 경로 문법: /academies/{academyId} */
  path: string;
  schema: { params?: Json; body?: Json; response: Record<string, Json> };
}

export interface Contract {
  /** Fastify addSchema 로 등록할 공용 스키마. $id 는 컴포넌트 이름이다. */
  schemas: Json[];
  operations: ContractOperation[];
}

const METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;
const SCHEMA_REF = '#/components/schemas/';
const OPENAPI_ONLY_KEYS = new Set(['examples', 'example']);

function rewriteSchema(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(rewriteSchema);
  if (node === null || typeof node !== 'object') return node;
  const out: Json = {};
  for (const [key, value] of Object.entries(node)) {
    if (OPENAPI_ONLY_KEYS.has(key)) continue;
    if (key === '$ref' && typeof value === 'string' && value.startsWith(SCHEMA_REF)) {
      out.$ref = `${value.slice(SCHEMA_REF.length)}#`;
    } else {
      out[key] = rewriteSchema(value);
    }
  }
  return out;
}

function resolveRef(doc: Json, node: Json): Json {
  const ref = node.$ref;
  if (typeof ref !== 'string') return node;
  if (!ref.startsWith('#/')) throw new Error(`외부 $ref 는 지원하지 않는다: ${ref}`);
  let cur: unknown = doc;
  for (const part of ref.slice(2).split('/')) cur = (cur as Json)[part];
  if (!cur || typeof cur !== 'object') throw new Error(`찾을 수 없는 $ref: ${ref}`);
  return cur as Json;
}

function jsonSchemaOf(content: unknown): Json | undefined {
  const schema = (content as Json | undefined)?.['application/json'] as Json | undefined;
  return schema?.schema ? (rewriteSchema(schema.schema) as Json) : undefined;
}

export function loadContract(file: string | URL): Contract {
  const doc = parse(readFileSync(file, 'utf8')) as Json;
  const components = (doc.components ?? {}) as Json;
  const schemas = Object.entries((components.schemas ?? {}) as Json).map(([name, schema]) => ({
    $id: name,
    ...(rewriteSchema(schema) as Json),
  }));

  const operations: ContractOperation[] = [];
  for (const [path, rawItem] of Object.entries(doc.paths as Json)) {
    const item = rawItem as Json;
    const shared = ((item.parameters ?? []) as Json[]).map((p) => resolveRef(doc, p));
    for (const method of METHODS) {
      const op = item[method] as Json | undefined;
      if (!op) continue;
      const operationId = op.operationId;
      if (typeof operationId !== 'string') throw new Error(`${method} ${path}: operationId 가 없다`);

      const params = [...shared, ...((op.parameters ?? []) as Json[]).map((p) => resolveRef(doc, p))];
      const pathParams = params.filter((p) => p.in === 'path');
      const schema: ContractOperation['schema'] = { response: {} };
      if (pathParams.length) {
        schema.params = {
          type: 'object',
          required: pathParams.map((p) => p.name),
          properties: Object.fromEntries(pathParams.map((p) => [p.name, rewriteSchema(p.schema)])),
        };
      }
      if (op.requestBody) {
        schema.body = jsonSchemaOf(resolveRef(doc, op.requestBody as Json).content);
      }
      for (const [status, rawRes] of Object.entries((op.responses ?? {}) as Json)) {
        const body = jsonSchemaOf(resolveRef(doc, rawRes as Json).content);
        if (body) schema.response[status] = body;
      }

      operations.push({
        operationId,
        method: method.toUpperCase() as ContractOperation['method'],
        path,
        url: path.replace(/\{(\w+)\}/g, ':$1'),
        schema,
      });
    }
  }
  return { schemas, operations };
}
