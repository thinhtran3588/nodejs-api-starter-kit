import { AuthorizationExceptionCode } from '@app/common/enums/authorization-exception-code';

const UNAUTHORIZED_CODES = new Set<string>([
  AuthorizationExceptionCode.UNAUTHORIZED,
  AuthorizationExceptionCode.INVALID_TOKEN,
]);

const FORBIDDEN_CODES = new Set<string>([
  AuthorizationExceptionCode.FORBIDDEN,
  AuthorizationExceptionCode.INSUFFICIENT_PERMISSIONS,
]);

export function getStatusCodeFromErrorCode(
  code: string
): 400 | 401 | 403 | 404 {
  if (UNAUTHORIZED_CODES.has(code)) {
    return 401;
  }

  if (FORBIDDEN_CODES.has(code)) {
    return 403;
  }

  return code.endsWith('_NOT_FOUND') ? 404 : 400;
}
