import { Metadata } from "next";
import { DashboardEffects } from "@/components/game/dashboard-effects";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <DashboardEffects />
    </>
  );
}
