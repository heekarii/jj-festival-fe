"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { fetchWaitingQueuePosition } from "@/lib/api/waitingPosition";

const PHONE_LENGTH = 11;

function toPhoneDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, PHONE_LENGTH);
}

export default function WaitingPositionLookup() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [queueNumber, setQueueNumber] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setQueueNumber(null);

    const phoneDigits = toPhoneDigits(phone);
    if (!phoneDigits) {
      setErrorMessage("연락처를 입력해 주세요.");
      return;
    }
    if (phoneDigits.length !== PHONE_LENGTH) {
      setErrorMessage("연락처는 숫자 11자리로 입력해 주세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetchWaitingQueuePosition(phoneDigits);
      if (res.ok) {
        setQueueNumber(res.queueNumber);
      } else {
        setErrorMessage(
          "등록된 웨이팅을 찾을 수 없거나 순번을 불러올 수 없습니다.",
        );
      }
    } catch {
      setErrorMessage("서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 w-full max-w-md rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-md">
      <h2 className="mb-1 text-lg font-semibold text-slate-900">
        내 웨이팅 순번 조회
      </h2>
      <p className="mb-4 text-sm text-slate-600">
        접수 시 사용한 연락처로 현재 대기 순번(몇 번째)을 확인합니다.
      </p>

      <form className="flex flex-col gap-3" onSubmit={handleSubmit} noValidate>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-slate-700">연락처</span>
          <input
            type="text"
            name="lookupPhone"
            autoComplete="tel"
            inputMode="numeric"
            maxLength={PHONE_LENGTH}
            pattern="[0-9]{11}"
            placeholder="01012341234"
            value={phone}
            onChange={(e) => setPhone(toPhoneDigits(e.target.value))}
            disabled={loading}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 placeholder:text-slate-400 outline-none ring-sky-500/30 focus:border-sky-600 focus:ring-4 disabled:opacity-60"
            required
          />
        </label>

        {errorMessage ? (
          <p className="text-sm text-red-700" role="alert">
            {errorMessage}
          </p>
        ) : null}

        {queueNumber !== null ? (
          <p className="text-sm font-medium text-emerald-800" role="status">
            현재 웨이팅{" "}
            <span className="text-lg font-bold text-emerald-900">
              {queueNumber}
            </span>
            번째 순서입니다.
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "조회 중…" : "순번 조회"}
        </button>
      </form>
    </div>
  );
}
