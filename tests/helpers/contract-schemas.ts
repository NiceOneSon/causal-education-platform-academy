// 응답이 계약(OpenAPI)의 스키마와 맞는지 서버 바깥에서 따로 검사한다.
import { Ajv } from 'ajv';
import addFormatsModule from 'ajv-formats';
import { loadContract } from '../../apps/api/src/contract.ts';

const addFormats = addFormatsModule as unknown as (ajv: Ajv) => Ajv;

export const contractUrl = new URL('../../contracts/openapi/academies.yaml', import.meta.url);
export const contract = loadContract(contractUrl);

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
for (const schema of contract.schemas) ajv.addSchema(schema);

export function contractErrors(schemaName: string, value: unknown): string | null {
  const validate = ajv.getSchema(schemaName);
  if (!validate) throw new Error(`계약에 없는 스키마: ${schemaName}`);
  return validate(value) ? null : ajv.errorsText(validate.errors);
}
