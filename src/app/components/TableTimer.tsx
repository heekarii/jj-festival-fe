"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export type Table = {
  id: number;
  name: string;
  entryTime: string | null;
};

type Props = {
  initialTables: Table[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function TableTimer({ initialTables }: Props) {
  const router = useRouter();
  // ① 서버에서 받아온 초기 상태
  const [tables, setTables] = useState<Table[]>(initialTables);

  useEffect(() => {
    setTables(initialTables);
  }, [initialTables]);

  // ② 실시간 시계
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ③ API 호출 후 상태 업데이트
  const handleEnter = async (id: number) => {
    if (!API_BASE) return;

    const previousTables = tables;
    const optimisticEntryTime = new Date().toISOString();

    setTables((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, entryTime: optimisticEntryTime }
          : t
      )
    );

    try {
      const res = await fetch(`${API_BASE}/tables/${id}/enter`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Failed to enter table.");
      }

      router.refresh();
    } catch (error) {
      console.error(error);
      setTables(previousTables);
      router.refresh();
    }
  };

  const handleReset = async (id: number) => {
    if (!API_BASE) return;

    const previousTables = tables;

    setTables((prev) =>
      prev.map((t) => (t.id === id ? { ...t, entryTime: null } : t))
    );

    try {
      const res = await fetch(`${API_BASE}/tables/${id}/reset`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Failed to reset table.");
      }

      router.refresh();
    } catch (error) {
      console.error(error);
      setTables(previousTables);
      router.refresh();
    }
  };

  const formatElapsed = (start: Date) => {
    const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    return [h, m, s]
      .map((v) => v.toString().padStart(2, "0"))
      .join(":");
  };

  return (
    <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="border-b px-4 py-4 sm:px-6">
        <h2 className="text-lg font-bold text-gray-900">테이블 목록</h2>
        <p className="mt-1 text-sm leading-6 text-gray-500">
          입장 처리 후 테이블별 이용 시간을 실시간으로 확인할 수 있습니다.
        </p>
      </div>

      <div className="divide-y md:hidden">
        {tables.map((t) => {
          const entered = !!t.entryTime;
          const start = entered ? new Date(t.entryTime!) : null;

          return (
            <div key={t.id} className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-gray-900">
                    {t.name}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {entered ? start!.toLocaleTimeString() : "-"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    entered
                      ? "bg-blue-50 text-blue-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {entered ? "이용 중" : "빈 테이블"}
                </span>
              </div>

              <div className="rounded-xl bg-gray-50 px-4 py-3">
                <p className="text-xs font-semibold text-gray-500">경과 시간</p>
                <p className="mt-1 font-mono text-2xl font-bold text-gray-900">
                  {entered && start ? formatElapsed(start) : "-:-:-"}
                </p>
              </div>

              {entered ? (
                <button
                  className="w-full rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 active:scale-95"
                  onClick={() => handleReset(t.id)}
                >
                  리셋
                </button>
              ) : (
                <button
                  className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 active:scale-95"
                  onClick={() => handleEnter(t.id)}
                >
                  입장
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr className="bg-gray-50 text-left text-sm text-gray-500">
              <th className="px-6 py-4 font-semibold">테이블</th>
              <th className="px-6 py-4 font-semibold">입장 시간</th>
              <th className="px-6 py-4 font-semibold">경과 시간</th>
              <th className="px-6 py-4 text-center font-semibold">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {tables.map((t) => {
              const entered = !!t.entryTime;
              const start = entered ? new Date(t.entryTime!) : null;
              return (
                <tr key={t.id} className="transition hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    {t.name}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {entered ? start!.toLocaleTimeString() : "-"}
                  </td>
                  <td className="px-6 py-4 font-mono text-gray-900">
                    {entered && start ? formatElapsed(start) : "-"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {entered ? (
                      <button
                        className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 active:scale-95"
                        onClick={() => handleReset(t.id)}
                      >
                        리셋
                      </button>
                    ) : (
                      <button
                        className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 active:scale-95"
                        onClick={() => handleEnter(t.id)}
                      >
                        입장
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
