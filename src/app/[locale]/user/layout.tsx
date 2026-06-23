"use client";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useLocale } from "next-intl";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  useEffect(() => {
    if (status === "unauthenticated") {
      const cb = pathname ? encodeURIComponent(pathname) : "";
      router.push(`/${locale}/auth/login?callbackUrl=${cb}`);
    }
  }, [status, router, pathname, locale]);

  if (status === "loading" || status === "unauthenticated") {
    return <div className="min-h-screen flex items-center justify-center">加载中...</div>;
  }

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
