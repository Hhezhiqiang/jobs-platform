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
      {/* App shell — force light mode and override volt-theme dark cascade.
          See src/app/[locale]/globals.css `data-app-root` overrides. */}
      <meta name="color-scheme" content="light only" />
      <div data-app-root="true" style={{ colorScheme: "light" }}>
        {children}
      </div>
    </>
  );
}
