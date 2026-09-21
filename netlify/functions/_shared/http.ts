export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export interface AppErrorPayload {
  ok: false;
  errorKind: string;
  message: string;
}

export function errorResponse(kind: string, message: string, status: number): Response {
  const payload: AppErrorPayload = { ok: false, errorKind: kind, message };
  return jsonResponse(payload, status);
}
