/// ============================================================
/// Error codes estructurados (task 2.16)
/// ============================================================

// Error codes for API responses
export const enum ErrorCode {
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  RATE_LIMITED = 'RATE_LIMITED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

// Type for error codes (union type)
export type ErrorCodeValue =
  | ErrorCode.NOT_FOUND
  | ErrorCode.VALIDATION_ERROR
  | ErrorCode.UNAUTHORIZED
  | ErrorCode.FORBIDDEN
  | ErrorCode.RATE_LIMITED
  | ErrorCode.INTERNAL_ERROR;

// Error response shape
export interface ApiError {
  code: ErrorCodeValue;
  message: string;
}

// Success response shape
export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

// Union response type: success or error
export type ApiResponse<T> = ApiSuccess<T> | { ok: false; error: ApiError };

// Generic error handler for API routes
export function createApiError(code: ErrorCodeValue, message: string): ApiError {
  return { code, message };
}

// Common error instances
export const Errors = {
  notFound: (msg = 'Recurso no encontrado') => createApiError(ErrorCode.NOT_FOUND, msg),
  validationError: (msg = 'Error de validación', issues?: unknown) =>
    createApiError(ErrorCode.VALIDATION_ERROR, msg),
  unauthorized: (msg = 'No autorizado') => createApiError(ErrorCode.UNAUTHORIZED, msg),
  forbidden: (msg = 'Prohibido') => createApiError(ErrorCode.FORBIDDEN, msg),
  internalError: (msg = 'Error interno del servidor') =>
    createApiError(ErrorCode.INTERNAL_ERROR, msg),
};

// Type guard for ApiResponse
export function isApiSuccess<T>(response: ApiResponse<T>): response is ApiSuccess<T> {
  return 'ok' in response && (response as ApiSuccess<T>).ok === true;
}

export function isApiError<T>(
  response: ApiResponse<T>
): response is { ok: false; error: ApiError } {
  return 'ok' in response && (response as { ok: false }).ok === false;
}
