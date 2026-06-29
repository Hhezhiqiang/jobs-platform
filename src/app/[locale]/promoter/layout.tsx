import { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* App shell — color-scheme is forced light via the root viewport
          export (Next.js injects <meta name="color-scheme"> into <head>).
          See src/app/[locale]/globals.css `data-app-root` overrides. */}
      <div data-app-root="true" style={{ colorScheme: "light" }}>
        {children}
      </div>
    </>
  );
}
