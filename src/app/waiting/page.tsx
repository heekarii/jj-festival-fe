import type { Metadata } from "next";
import WaitingForm from "../components/WaitingForm";
import WaitingPositionLookup from "../components/WaitingPositionLookup";

export const metadata: Metadata = {
  title: "진격의 한잔 웨이팅",
  description: "진격의 한잔 웨이팅 요청",
};

export default function WaitingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-sky-100 via-slate-50 to-amber-100 p-6">
      <WaitingForm />
      <WaitingPositionLookup />
    </div>
  );
}
