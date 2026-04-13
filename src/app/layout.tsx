import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://jobs-platform-gold.vercel.app"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}
