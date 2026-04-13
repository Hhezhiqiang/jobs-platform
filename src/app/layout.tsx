export const metadata = {
  title: "JobsBro招聘平台",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <head>
        <meta httpEquiv="refresh" content="0;url=/zh" />
      </head>
      <body>{children}</body>
    </html>
  );
}

