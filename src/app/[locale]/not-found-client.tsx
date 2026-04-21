"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

export default function NotFoundClient() {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "zh";
  const t = useTranslations("notFound");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center px-4">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">{t("title")}</p>
        <Link
          href={`/${locale}`}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          ← {t("backToHome")}
        </Link>
      </div>
    </div>
  );
}
