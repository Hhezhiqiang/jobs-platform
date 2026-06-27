import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://jobquip.com"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Fallback root layout. Locale-specific routes are wrapped by
    // src/app/[locale]/layout.tsx which sets <html lang={locale}>.
    // This shell only renders for locale-agnostic routes (sitemap, robots,
    // opengraph-image, error fallbacks).
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
