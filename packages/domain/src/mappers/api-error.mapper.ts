export function mapApiFieldErrorsToFormErrors(
  fieldErrors: Record<string, string[]> | undefined
): Record<string, { message: string }> {
  if (!fieldErrors) return {};
  return Object.fromEntries(
    Object.entries(fieldErrors).map(([field, errors]) => [
      field,
      { message: errors[0] ?? "Invalid value" },
    ])
  );
}

export interface ApiErrorResponse {
  detail?: string | Array<{ loc: (string | number)[]; msg: string; type: string }>;
  fieldErrors?: Record<string, string[]>;
  requestId?: string;
}

export function extractApiErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const e = error as ApiErrorResponse;
    if (typeof e.detail === "string") return e.detail;
    if (Array.isArray(e.detail) && e.detail.length > 0) {
      return e.detail[0]?.msg ?? "Validation error";
    }
  }
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred";
}
