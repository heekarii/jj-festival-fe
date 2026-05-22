"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export type Waiting = {
  id: number;
  waitingNumber: number;
  phone: string;
  partySize: number;
};

export type WaitingTable = {
  id: number;
  name: string;
  entryTime: string | null;
};

type WaitingManagerProps = {
  initialWaitingList: Waiting[];
  initialTables: WaitingTable[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
type LoadingAction = "enter" | "delete";

function refreshWaitingNumbers(waitingList: Waiting[]): Waiting[] {
  return waitingList.map((waiting, index) => ({
    ...waiting,
    waitingNumber: index + 1,
  }));
}

function getAvailableTables(tables: WaitingTable[]): WaitingTable[] {
  return tables.filter((table) => !table.entryTime);
}

export default function WaitingManager({
  initialWaitingList,
  initialTables,
}: WaitingManagerProps) {
  const router = useRouter();
  const [waitingList, setWaitingList] =
    useState<Waiting[]>(initialWaitingList);
  const [tables, setTables] = useState<WaitingTable[]>(initialTables);
  const [selectedTableIds, setSelectedTableIds] = useState<
    Record<number, string>
  >({});

  const [loadingAction, setLoadingAction] = useState<{
    id: number;
    action: LoadingAction;
  } | null>(null);

  useEffect(() => {
    setWaitingList(initialWaitingList);
  }, [initialWaitingList]);

  useEffect(() => {
    setTables(initialTables);
  }, [initialTables]);

  const availableTables = getAvailableTables(tables);

  const handleEnter = async (id: number) => {
    const selectedTableId = Number(selectedTableIds[id]);
    const selectedTable = tables.find((table) => table.id === selectedTableId);

    if (!selectedTable || selectedTable.entryTime) {
      alert("배치할 빈 테이블을 선택해 주세요.");
      return;
    }

    const isConfirmed = window.confirm(
      `${selectedTable.name}에 배치하고 해당 웨이팅을 입장 처리할까요?`
    );

    if (!isConfirmed) return;

    if (!API_BASE) {
      alert("API 주소가 설정되지 않았습니다.");
      return;
    }

    const previousWaitingList = waitingList;
    const previousTables = tables;
    const previousSelectedTableIds = selectedTableIds;

    try {
      setLoadingAction({ id, action: "enter" });
      const optimisticEntryTime = new Date().toISOString();

      setTables((prev) =>
        prev.map((table) =>
          table.id === selectedTableId
            ? { ...table, entryTime: optimisticEntryTime }
            : table
        )
      );
      setWaitingList((prev) =>
        refreshWaitingNumbers(prev.filter((waiting) => waiting.id !== id))
      );
      setSelectedTableIds((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });

      const tableRes = await fetch(`${API_BASE}/tables/${selectedTableId}/enter`, {
        method: "POST",
      });

      if (!tableRes.ok) {
        throw new Error("테이블 입장 처리에 실패했습니다.");
      }

      const waitingRes = await fetch(`${API_BASE}/waiting/${id}/enter`, {
        method: "POST",
      });

      if (!waitingRes.ok) {
        throw new Error("입장 처리에 실패했습니다.");
      }

      router.refresh();
    } catch (error) {
      console.error(error);
      setWaitingList(previousWaitingList);
      setTables(previousTables);
      setSelectedTableIds(previousSelectedTableIds);
      router.refresh();
      alert("입장 처리 중 오류가 발생했습니다.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDelete = async (id: number) => {
    const isConfirmed = window.confirm("해당 웨이팅을 삭제할까요?");

    if (!isConfirmed) return;

    if (!API_BASE) {
      alert("API 주소가 설정되지 않았습니다.");
      return;
    }

    try {
      setLoadingAction({ id, action: "delete" });

      const res = await fetch(`${API_BASE}/waiting/${id}/delete`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("삭제에 실패했습니다.");
      }

      setWaitingList((prev) =>
        refreshWaitingNumbers(prev.filter((waiting) => waiting.id !== id))
      );
      setSelectedTableIds((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (error) {
      console.error(error);
      alert("삭제 처리 중 오류가 발생했습니다.");
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        <div className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
          <p className="text-sm text-gray-500">현재 대기 팀</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {waitingList.length}
            <span className="ml-1 text-lg font-medium text-gray-500">팀</span>
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="border-b px-4 py-4 sm:px-6">
          <h2 className="text-lg font-bold text-gray-900">웨이팅 목록</h2>
          <p className="mt-1 text-sm leading-6 text-gray-500">
            빈 테이블을 선택한 뒤 입장 처리하면 테이블 이용 시간이 시작됩니다.
          </p>
        </div>

        <div className="divide-y md:hidden">
          {waitingList.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <div className="mx-auto flex max-w-sm flex-col items-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl">
                  ??
                </div>
                <p className="text-lg font-semibold text-gray-800">
                  현재 대기 중인 웨이팅이 없습니다.
                </p>
                <p className="mt-2 text-sm leading-6 text-gray-500">
                  새로운 웨이팅이 등록되면 여기에 표시됩니다.
                </p>
              </div>
            </div>
          ) : (
            waitingList.map((waiting) => {
              const isEntering =
                loadingAction?.id === waiting.id &&
                loadingAction.action === "enter";
              const isDeleting =
                loadingAction?.id === waiting.id &&
                loadingAction.action === "delete";
              const isCurrentRowLoading = loadingAction?.id === waiting.id;

              return (
                <div key={waiting.id} className="space-y-4 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-gray-900">
                        {waiting.waitingNumber}번
                      </p>
                      <p className="mt-1 break-all text-sm text-gray-600">
                        {waiting.phone}
                      </p>
                    </div>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                      {waiting.partySize}명
                    </span>
                  </div>

                  <select
                    value={selectedTableIds[waiting.id] ?? ""}
                    onChange={(event) =>
                      setSelectedTableIds((prev) => ({
                        ...prev,
                        [waiting.id]: event.target.value,
                      }))
                    }
                    disabled={isCurrentRowLoading || availableTables.length === 0}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-medium text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="">
                      {availableTables.length === 0
                        ? "빈 테이블 없음"
                        : "테이블 선택"}
                    </option>
                    {availableTables.map((table) => (
                      <option key={table.id} value={table.id}>
                        {table.name}
                      </option>
                    ))}
                  </select>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleEnter(waiting.id)}
                      disabled={
                        isCurrentRowLoading || !selectedTableIds[waiting.id]
                      }
                      className="rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-400"
                    >
                      {isEntering ? "처리 중..." : "입장 처리"}
                    </button>
                    <button
                      onClick={() => handleDelete(waiting.id)}
                      disabled={isCurrentRowLoading}
                      className="rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50 active:scale-95 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
                    >
                      {isDeleting ? "삭제 중..." : "삭제"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[820px] border-collapse">
            <thead>
              <tr className="bg-gray-50 text-left text-sm text-gray-500">
                <th className="px-6 py-4 font-semibold">대기번호</th>
                <th className="px-6 py-4 font-semibold">연락처</th>
                <th className="px-6 py-4 font-semibold">인원 수</th>
                <th className="px-6 py-4 font-semibold">배치 테이블</th>
                <th className="px-6 py-4 text-center font-semibold">관리</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {waitingList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl">
                        ✓
                      </div>
                      <p className="text-lg font-semibold text-gray-800">
                        현재 대기 중인 웨이팅이 없습니다.
                      </p>
                      <p className="mt-2 text-sm text-gray-500">
                        새로운 웨이팅이 등록되면 이곳에 표시됩니다.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                waitingList.map((waiting) => {
                  const isEntering =
                    loadingAction?.id === waiting.id &&
                    loadingAction.action === "enter";
                  const isDeleting =
                    loadingAction?.id === waiting.id &&
                    loadingAction.action === "delete";
                  const isCurrentRowLoading =
                    loadingAction?.id === waiting.id;

                  return (
                    <tr
                      key={waiting.id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {waiting.waitingNumber}번
                      </td>

                      <td className="px-6 py-4 text-gray-700">
                        {waiting.phone}
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900">
                          {waiting.partySize}
                        </span>
                        <span className="ml-1 text-gray-500">명</span>
                      </td>

                      <td className="px-6 py-4">
                        <select
                          value={selectedTableIds[waiting.id] ?? ""}
                          onChange={(event) =>
                            setSelectedTableIds((prev) => ({
                              ...prev,
                              [waiting.id]: event.target.value,
                            }))
                          }
                          disabled={
                            isCurrentRowLoading || availableTables.length === 0
                          }
                          className="w-full min-w-32 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                        >
                          <option value="">
                            {availableTables.length === 0
                              ? "빈 테이블 없음"
                              : "테이블 선택"}
                          </option>
                          {availableTables.map((table) => (
                            <option key={table.id} value={table.id}>
                              {table.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleEnter(waiting.id)}
                            disabled={
                              isCurrentRowLoading ||
                              !selectedTableIds[waiting.id]
                            }
                            className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-400"
                          >
                            {isEntering ? "처리 중..." : "입장 처리"}
                          </button>
                          <button
                            onClick={() => handleDelete(waiting.id)}
                            disabled={isCurrentRowLoading}
                            className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50 active:scale-95 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
                          >
                            {isDeleting ? "삭제 중..." : "삭제"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
