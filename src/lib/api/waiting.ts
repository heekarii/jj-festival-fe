/**
 * Waiting API request/response (see docs/API_WAITING.md).
 */
export type WaitingRequestBody = {
  phone: string;
  people: number;
};

export type WaitingResponseBody = {
  result: boolean;
  message?: string;
};

export type WaitingSubmitResult = {
  ok: boolean;
  message?: string;
};

const DEFAULT_PATH = "waiting";

function waitingSubmitUrl(): string {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
  const path = (process.env.NEXT_PUBLIC_WAITING_PATH ?? DEFAULT_PATH).replace(
    /^\/+/,
    "",
  );
  if (!base) {
    return `/${path}`;
  }
  return `${base}/${path}`;
}

function parseWaitingResult(data: unknown): WaitingSubmitResult {
  if (data === true) {
    return { ok: true };
  }
  if (
    typeof data === "object" &&
    data !== null &&
    "result" in data &&
    typeof (data as WaitingResponseBody).result === "boolean"
  ) {
    const body = data as WaitingResponseBody;
    return {
      ok: body.result,
      message: typeof body.message === "string" ? body.message : undefined,
    };
  }
  return { ok: false };
}

/**
 * POST waiting registration.
 * Prefer JSON body `{ "result": boolean, "message"?: string }`; raw boolean `true` is accepted for backward compatibility.
 */
export async function submitWaiting(
  body: WaitingRequestBody,
): Promise<WaitingSubmitResult> {
  const payload = {
    phone: body.phone,
    people: body.people,
    /** Same value as `people`; admin list UI (WaitingManager) expects `partySize`. */
    partySize: body.people,
  };
  const response = await fetch(waitingSubmitUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  if (!response.ok) {
    return { ok: false };
  }
  const data: unknown = await response.json();
  return parseWaitingResult(data);
}
