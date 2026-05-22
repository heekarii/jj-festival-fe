"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { submitWaiting } from "@/lib/api/waiting";

const PHONE_LENGTH = 11;

function toPhoneDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, PHONE_LENGTH);
}

export default function WaitingForm() {
  const [phone, setPhone] = useState("");
  const [peopleInput, setPeopleInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<"idle" | "success" | "failure">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setResult("idle");

    const phoneDigits = toPhoneDigits(phone);
    const people = Number.parseInt(peopleInput, 10);

    if (!phoneDigits) {
      setErrorMessage("연락처를 입력해 주세요.");
      return;
    }
    if (phoneDigits.length !== PHONE_LENGTH) {
      setErrorMessage("연락처는 숫자 11자리로 입력해 주세요.");
      return;
    }
    if (!Number.isFinite(people) || people < 1) {
      setErrorMessage("인원수는 1명 이상의 숫자로 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const submitResult = await submitWaiting({
        phone: phoneDigits,
        people,
      });
      setResult(submitResult.ok ? "success" : "failure");
      if (submitResult.ok) {
        setPhone("");
        setPeopleInput("");
      } else if (submitResult.message) {
        setErrorMessage(submitResult.message);
      }
    } catch {
      setResult("failure");
      setErrorMessage("서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-slate-900">
        N:AND BAR 웨이팅
      </h1>
      <p className="mb-6 text-sm text-slate-600">
        연락처와 인원을 입력해 웨이팅을 접수합니다.
      </p>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-slate-700">연락처</span>
          <input
            type="text"
            name="phone"
            autoComplete="tel"
            inputMode="numeric"
            maxLength={PHONE_LENGTH}
            pattern="[0-9]{11}"
            placeholder="01012341234"
            value={phone}
            onChange={(e) => setPhone(toPhoneDigits(e.target.value))}
            disabled={submitting}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 placeholder:text-slate-400 outline-none ring-sky-500/30 transition focus:border-sky-600 focus:ring-4 disabled:opacity-60"
            required
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-slate-700">인원수</span>
          <input
            type="number"
            name="people"
            min={1}
            step={1}
            placeholder="명"
            value={peopleInput}
            onChange={(e) => setPeopleInput(e.target.value)}
            disabled={submitting}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 placeholder:text-slate-400 outline-none ring-sky-500/30 transition focus:border-sky-600 focus:ring-4 disabled:opacity-60"
            required
          />
        </label>

        {errorMessage ? (
          <p className="text-sm text-red-700" role="alert">
            {errorMessage}
          </p>
        ) : null}

        {result === "success" ? (
          <p className="text-sm text-emerald-700" role="status">
            웨이팅이 접수되었습니다.
          </p>
        ) : null}

        {result === "failure" && !errorMessage ? (
          <p className="text-sm text-red-700" role="alert">
            웨이팅 처리에 실패했습니다. 입력 정보를 확인하거나 다시 시도해 주세요.
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 rounded-lg bg-sky-600 py-3 text-base font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? "전송 중…" : "웨이팅 접수"}
        </button>
      </form>
    </div>
  );
}
