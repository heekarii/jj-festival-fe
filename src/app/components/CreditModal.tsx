"use client";

import { useEffect, useId, useState } from "react";

const credits = [
  {
    label: "Leader",
    value: "조희석(SW24)",
  },
  {
    label: "Developer",
    value: "정원엽(SW23), 박채연(CSW25), 빈상훈(SW24)",
  },
  {
    label: "QA",
    value: "김예담(CSW25), 이가은(CSW25)",
  },
];

export default function CreditModal() {
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <footer className="flex justify-center border-t border-gray-200 bg-white px-4 py-3">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="text-xs font-medium text-gray-500 underline underline-offset-4 transition hover:text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
          aria-haspopup="dialog"
        >
          Credit
        </button>
      </footer>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/45 px-4 py-5 backdrop-blur-sm sm:items-center"
          role="presentation"
          onMouseDown={() => setIsOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-full max-w-md rounded-2xl bg-white p-5 text-gray-900 shadow-2xl sm:p-6"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
                  Credits
                </p>
                <h2 id={titleId} className="mt-2 text-xl font-bold">
                  콘텐츠소프트웨어학과 학생회 &ldquo;현&quot; 축제 TF
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-xl leading-none text-gray-500 transition hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                aria-label="크레딧 닫기"
              >
                ×
              </button>
            </div>

            <dl className="mt-5 divide-y divide-gray-100 rounded-xl border border-gray-100">
              {credits.map((credit) => (
                <div
                  key={credit.label}
                  className="grid grid-cols-[5.5rem_1fr] gap-3 px-4 py-3 text-sm"
                >
                  <dt className="font-semibold text-gray-500">
                    {credit.label}
                  </dt>
                  <dd className="text-gray-900">{credit.value}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-4 text-sm leading-6 text-gray-500">
              2026, 세종대학교 제 9대 콘텐츠소프트웨어학과 학생회 &ldquo;현&quot;. All rights reserved.
            </p>
          </section>
        </div>
      ) : null}
    </>
  );
}
