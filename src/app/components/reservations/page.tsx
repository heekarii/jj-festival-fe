export const dynamic = "force-dynamic";
export const revalidate = 0;

type Reservation = {
  id: number;
  phoneNumber: string;
  peopleCount: number;
  visitTime: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

async function fetchReservations(): Promise<Reservation[]> {
  if (!API_BASE) {
    console.error("NEXT_PUBLIC_API_BASE_URL이 설정되지 않았습니다.");
    return [];
  }

  try {
    const res = await fetch(`${API_BASE}/reservations`, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("예약자 목록을 불러오지 못했습니다.");
      return [];
    }

    return res.json();
  } catch (error) {
    console.error("예약자 목록 요청 중 오류가 발생했습니다.", error);
    return [];
  }
}

export default async function ReservationManagementPage() {
  const reservations = await fetchReservations();

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-8 text-gray-900">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <p className="mb-2 text-sm font-semibold text-blue-600">CSW</p>
          <h1 className="text-3xl font-bold">예약자 관리</h1>
          <p className="mt-2 text-gray-600">
            예약자가 입력한 연락처, 인원수, 방문 예정 시간을 확인하는
            페이지입니다.
          </p>
        </header>

        <section className="mb-6">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">총 예약 건수</p>
            <p className="mt-2 text-2xl font-bold">{reservations.length}건</p>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-lg font-semibold">예약자 목록</h2>
          </div>

          {reservations.length === 0 ? (
            <div className="px-5 py-12 text-center text-gray-500">
              아직 등록된 예약자가 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-sm font-semibold text-gray-600">
                      번호
                    </th>
                    <th className="px-5 py-3 text-sm font-semibold text-gray-600">
                      연락처
                    </th>
                    <th className="px-5 py-3 text-sm font-semibold text-gray-600">
                      인원수
                    </th>
                    <th className="px-5 py-3 text-sm font-semibold text-gray-600">
                      방문 예정 시간
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {reservations.map((reservation, index) => (
                    <tr
                      key={reservation.id}
                      className="border-t border-gray-100"
                    >
                      <td className="px-5 py-4">{index + 1}</td>
                      <td className="px-5 py-4 font-medium">
                        {reservation.phoneNumber}
                      </td>
                      <td className="px-5 py-4">
                        {reservation.peopleCount}명
                      </td>
                      <td className="px-5 py-4 font-medium">
                        {reservation.visitTime}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}