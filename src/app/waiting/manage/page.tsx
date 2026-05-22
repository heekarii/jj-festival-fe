import type { Metadata } from "next";
import Link from "next/link";
import AutoRefresh from "../../components/AutoRefresh";
import WaitingManager, {
  type Waiting,
  type WaitingTable,
} from "../../components/WaitingManager";

export const metadata: Metadata = {
  title: "웨이팅 목록 관리 페이지",
  description: "N:AND BAR 웨이팅 목록 관리 페이지",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

async function fetchWaitingList(): Promise<Waiting[]> {
  if (!API_BASE) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL이 설정되지 않았습니다.");
  }

  const res = await fetch(`${API_BASE}/waiting`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("웨이팅 목록을 불러오지 못했습니다.");
  }

  const data: Waiting[] = await res.json();

  return data.map((waiting, index) => ({
    ...waiting,
    waitingNumber: index + 1,
  }));
}

async function fetchTables(): Promise<WaitingTable[]> {
  if (!API_BASE) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL이 설정되지 않았습니다.");
  }

  const res = await fetch(`${API_BASE}/tables`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("테이블 목록을 불러오지 못했습니다.");
  }

  return res.json();
}

export default async function WaitingManagePage() {
  const [initialWaitingList, initialTables] = await Promise.all([
    fetchWaitingList(),
    fetchTables(),
  ]);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-5 sm:px-6 sm:py-8">
      <AutoRefresh />
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 sm:mb-6 sm:gap-4">
          <div className="flex flex-wrap gap-2 text-sm sm:gap-3">
            <Link
              href="/"
              className="font-medium text-blue-600 hover:underline"
            >
              테이블 입장 관리
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              href="/waiting"
              className="font-medium text-blue-600 hover:underline"
            >
              고객 웨이팅 화면
            </Link>
          </div>
        </div>

        <div className="mb-6 sm:mb-8">
          <p className="text-sm font-semibold text-blue-600">N:AND BAR</p>

          <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
            웨이팅 목록 관리
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500 sm:text-base">
            축제 주점의 웨이팅 예약자를 확인하고 입장 처리를 할 수 있습니다.
          </p>
        </div>

        <WaitingManager
          initialWaitingList={initialWaitingList}
          initialTables={initialTables}
        />
      </div>
    </main>
  );
}
