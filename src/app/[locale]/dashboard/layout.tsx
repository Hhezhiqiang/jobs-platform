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
      {/* color-scheme is forced light via the root viewport export so the
          <meta> ends up in <head> where Safari honours it. */}
      <div data-app-root="true" data-dashboard-root="true" style={{ colorScheme: "light" }}>
        {children}
      </div>
      <DashboardEffects />
    </>
  );
}
