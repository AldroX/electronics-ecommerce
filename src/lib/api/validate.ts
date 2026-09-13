/// ============================================================
/// src/lib/api/validate.ts - Middleware Zod parse wrapper
/// Envuelve todos los route handlers: parse query params, body, params.
/// Devuelve { success, data } o { error: { code: VALIDATION_ERROR, issues } }.
/// Task 2.15
/// ============================================================

import { z } from 'zod';
import { ErrorCode } from '@/lib/api/error-codes';

// Type for validation result - Zod v4 uses z.ZodIssue for issue type
type ZodIssue = any; // Use any to avoid strict ZodIssue type requirements

// Type for validation result
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: ErrorCode;
    message: string;
    issues?: ZodIssue[];
  };
}

// Validate query parameters
export function validateQuery<T extends z.ZodTypeAny>(
  schema: T,
  searchParams: URLSearchParams
): ValidationResult<z.infer<T>> {
  const raw: Record<string, string | string[]> = {};
  for (const [key, value] of searchParams.entries()) {
    // Handle multiple values for same key
    if (raw[key]) {
      if (Array.isArray(raw[key])) {
        (raw[key] as string[]).push(String(value));
      } else {
        raw[key] = [raw[key] as string, String(value)];
      }
    } else {
      raw[key] = String(value);
    }
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    return {
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Error de validación en query parameters',
        issues: result.error.issues,
      },
    };
  }

  return { success: true, data: result.data };
}

// Validate route parameters (params)
export function validateParams<T extends z.ZodTypeAny>(
  schema: T,
  params: Record<string, string | undefined>
): ValidationResult<z.infer<T>> {
  const result = schema.safeParse(params);
  if (!result.success) {
    return {
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Error de validación en parámetros de ruta',
        issues: result.error.issues,
      },
    };
  }

  return { success: true, data: result.data };
}

// Validate request body (JSON)
export async function validateBody<T extends z.ZodTypeAny>(
  schema: T,
  request: Request
): Promise<ValidationResult<z.infer<T>>> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return {
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Error de validación en body',
          issues: result.error.issues,
        },
      };
    }
    return { success: true, data: result.data };
  } catch (err) {
    if (err instanceof SyntaxError) {
      return {
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Body JSON inválido',
          issues: [{ code: 'custom', message: 'El body no es un JSON válido' }],
        },
      };
    }
    return {
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Error al parsear body',
        issues: [{ code: 'custom', message: String(err) }],
      },
    };
  }
}

// Validate request body (FormData)
export async function validateFormData<T extends z.ZodTypeAny>(
  schema: T,
  request: Request
): Promise<ValidationResult<z.infer<T>>> {
  try {
    const formData = await request.formData();
    const raw: Record<string, any> = {};

    for (const [key, value] of formData.entries()) {
      if (raw[key]) {
        if (Array.isArray(raw[key])) {
          raw[key].push(value);
        } else {
          raw[key] = [raw[key], value];
        }
      } else {
        raw[key] = value;
      }
    }

    const result = schema.safeParse(raw);
    if (!result.success) {
      return {
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Error de validación en form data',
          issues: result.error.issues,
        },
      };
    }
    return { success: true, data: result.data };
  } catch (err) {
    return {
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Error al parsear form data',
        issues: [{ code: 'custom', message: String(err) }],
      },
    };
  }
}

// Create standard error response for validation errors
export function createValidationErrorResponse(error: ValidationResult<any>['error']): Response {
  return new Response(
    JSON.stringify({
      ok: false,
      error,
    }),
    {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

// Higher-order function to wrap API route handlers with validation
export function withValidation<
  TQuery extends z.ZodTypeAny = any,
  TParams extends z.ZodTypeAny = any,
  TBody extends z.ZodTypeAny = any,
>(
  options: {
    querySchema?: TQuery;
    paramsSchema?: TParams;
    bodySchema?: TBody;
    formDataSchema?: TBody;
  },
  handler: (context: {
    query?: z.infer<TQuery>;
    params?: z.infer<TParams>;
    body?: z.infer<TBody>;
    request: Request;
  }) => Promise<Response>
) {
  return async (context: {
    request: Request;
    params: Record<string, string | undefined>;
  }): Promise<Response> => {
    const { querySchema, paramsSchema, bodySchema, formDataSchema } = options;
    const { request, params } = context;

    let queryResult: ValidationResult<any> | undefined;
    let paramsResult: ValidationResult<any> | undefined;

    // Validate query params
    if (querySchema) {
      const url = new URL(request.url);
      queryResult = validateQuery(querySchema, url.searchParams);
      if (!queryResult.success) {
        return createValidationErrorResponse(queryResult.error!);
      }
    }

    // Validate route params
    if (paramsSchema) {
      paramsResult = validateParams(paramsSchema, params);
      if (!paramsResult.success) {
        return createValidationErrorResponse(paramsResult.error!);
      }
    }

    // Validate body (JSON or FormData)
    let bodyData: any;
    if (bodySchema || formDataSchema) {
      const contentType = request.headers.get('content-type') || '';
      if (contentType.includes('multipart/form-data') && formDataSchema) {
        const formResult = await validateFormData(formDataSchema, request);
        if (!formResult.success) {
          return createValidationErrorResponse(formResult.error!);
        }
        bodyData = formResult.data;
      } else if (bodySchema) {
        const bodyResult = await validateBody(bodySchema, request);
        if (!bodyResult.success) {
          return createValidationErrorResponse(bodyResult.error!);
        }
        bodyData = bodyResult.data;
      }
    }

    // Call the handler with validated data
    return handler({
      query: queryResult?.data,
      params: paramsResult?.data,
      body: bodyData,
      request,
    });
  };
}

// Helper to create typed validation errors
export const ValidationErrors = {
  query: (issues?: ZodIssue[]) => ({
    code: ErrorCode.VALIDATION_ERROR,
    message: 'Error de validación en query parameters',
    issues,
  }),
  params: (issues?: ZodIssue[]) => ({
    code: ErrorCode.VALIDATION_ERROR,
    message: 'Error de validación en parámetros de ruta',
    issues,
  }),
  body: (issues?: ZodIssue[]) => ({
    code: ErrorCode.VALIDATION_ERROR,
    message: 'Error de validación en body',
    issues,
  }),
  formData: (issues?: ZodIssue[]) => ({
    code: ErrorCode.VALIDATION_ERROR,
    message: 'Error de validación en form data',
    issues,
  }),
};
