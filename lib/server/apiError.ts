export function parseBackendError(error: unknown): {
  status: number;
  message: string;
  data?: Record<string, unknown>;
} {
  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message);
      if (parsed.status) return parsed;
    } catch {
      /* Network errors are not JSON. */
    }
  }
  return {
    status: 503,
    message: "서버에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.",
  };
}
