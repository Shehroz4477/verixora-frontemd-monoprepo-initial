interface ApiErrorPayload {
  error?: string;
  detail?: string;
  title?: string;
  errors?: Record<string, string[] | string>;
}

interface ApiFailure {
  status?: number;
  error?: ApiErrorPayload | string;
  message?: string;
}

/** Converts transport and API failures into short, actionable user messages. */
export function describeApiError(error: unknown, fallback: string): string {
  const failure = error as ApiFailure | undefined;
  const payload = failure?.error;

  if (typeof payload === 'string' && payload.trim()) return payload.trim();
  if (payload && typeof payload === 'object') {
    const message = payload.error || payload.detail || payload.title;
    if (message?.trim()) return message.trim();

    const validationMessage = Object.values(payload.errors || {})
      .flatMap(value => Array.isArray(value) ? value : [value])
      .find(value => value?.trim());
    if (validationMessage?.trim()) return validationMessage.trim();
  }

  switch (failure?.status) {
    case 0:
      return 'Verixora could not reach the local API. Check Wi-Fi, the API address, and that the backend is running.';
    case 401:
      return 'Your secure session has ended. Sign in again from this registered device.';
    case 403:
      return 'This registered device is not permitted to complete that action.';
    case 404:
      return 'This feature is not available on the current API. Update the backend and try again.';
    case 409:
      return 'This action conflicts with the current security state. Refresh and review the latest status.';
    case 503:
      return 'The required security service is temporarily unavailable. No security data was changed; try again after local services are running.';
    default:
      return fallback;
  }
}
