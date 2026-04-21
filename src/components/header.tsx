"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

interface HeaderProps {
  transparent?: boolean;
}

export function Header({ transparent = false }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";
  const isCompany = session?.user?.role === "COMPANY";
  const isAdmin = session?.user?.role === "ADMIN";
  const t = useTranslations();
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "zh";
  const isEn = locale === "en";

  // Build switch URL by replacing locale prefix
  const switchLocalePath = `/${isEn ? "zh" : "en"}${pathname?.substring(locale.length + 1) || ""}`;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".user-menu-container")) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { label: t("nav.jobs"), href: `/${locale}/jobs`, icon: "💼" },
    { label: t("nav.companies"), href: `/${locale}/companies`, icon: "🏢" },
    { label: t("nav.blog"), href: `/${locale}/blog`, icon: "📝" },
    { label: t("nav.careerTrail"), href: `/${locale}/career-trail`, icon: "📊" },
  ];

  const isActivePath = (href: string) => {
    const pathWithoutLocale = pathname?.substring(locale.length + 1) || "";
    const hrefWithoutLocale = href.substring(locale.length + 1);
    return pathWithoutLocale === hrefWithoutLocale ||
           pathWithoutLocale.startsWith(hrefWithoutLocale + "/");
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        transparent
          ? "bg-transparent"
          : "bg-white/80 backdrop-blur-md border-b border-gray-200/50"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:shadow-blue-500/30 transition-shadow">
              J
            </div>
            <span className={`text-xl font-bold ${transparent ? "text-white" : "text-gray-900"}`}>
              {t("site.name")}
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = isActivePath(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all hover:bg-gray-100/50 ${
                    transparent
                      ? isActive
                        ? "text-white bg-white/20"
                        : "text-white/90 hover:text-white"
                      : isActive
                        ? "text-blue-600 bg-blue-50"
                        : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Locale Switcher */}
            <Link
              href={switchLocalePath}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-all ${
                transparent
                  ? "border-white/30 text-white hover:bg-white/10"
                  : "border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
              title={t("locale.switch")}
            >
              {t("locale.switchTo")}
            </Link>

            {isLoggedIn ? (
              <div className="relative user-menu-container">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all"
                >
                  {session?.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || t("nav.dashboard")}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                      {(session?.user?.name || "U").charAt(0)}
                    </div>
                  )}
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                      {isCompany && (
                        <>
                          <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase">{t("header.company")}</div>
                          <Link href={`/${locale}/company/dashboard`} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                            <span>🏢</span> {t("header.jobMgmt")}
                          </Link>
                          <Link href={`/${locale}/company/applications`} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                            <span>📄</span> {t("header.resumes")}
                          </Link>
                        </>
                      )}

                      {isAdmin && (
                        <>
                          <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase">{t("header.admin")}</div>
                          <Link href={`/${locale}/admin`} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                            <span>⚙️</span> {t("header.admin")}
                          </Link>
                        </>
                      )}

                      {!isCompany && !isAdmin && (
                        <>
                          <Link href={`/${locale}/dashboard/favorites`} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                            <span>❤️</span> {t("header.favorites")}
                          </Link>
                          <Link href={`/${locale}/dashboard/applications`} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                            <span>📋</span> {t("header.applications")}
                          </Link>
                        </>
                      )}

                      <div className="border-t border-gray-100 my-2" />
                      <Link href={`/${locale}/dashboard/settings`} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                        <span>⚙️</span> {t("header.settings")}
                      </Link>
                      <button
                        onClick={() => { setUserMenuOpen(false); signOut({ callbackUrl: `/${locale}` }); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                      >
                        <span>🚪</span> {t("nav.logout")}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href={`/${locale}/auth/login`}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    transparent
                      ? "text-white hover:bg-white/10"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {t("nav.login")}
                </Link>
                <Link
                  href={`/${locale}/auth/register`}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all"
                >
                  {t("nav.register")}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={t("header.menu")}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}

            <div className="border-t border-gray-200 my-2" />

            {/* Mobile Locale Switcher */}
            <Link
              href={switchLocalePath}
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>🌐</span> {t("locale.switch")}: {t("locale.switchTo")}
            </Link>

            {!isLoggedIn && (
              <>
                <div className="border-t border-gray-200 my-2" />
                <Link
                  href={`/${locale}/auth/login`}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t("nav.login")}
                </Link>
                <Link
                  href={`/${locale}/auth/register`}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t("nav.register")}
                </Link>
              </>
            )}

            {isLoggedIn && (
              <>
                <div className="border-t border-gray-200 my-2" />
                {isCompany && (
                  <Link
                    href={`/${locale}/company/dashboard`}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>🏢</span> {t("header.company")}
                  </Link>
                )}
                <Link
                  href={`/${locale}/dashboard`}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>👤</span> {t("nav.dashboard")}
                </Link>
                <button
                  onClick={() => { setMobileMenuOpen(false); signOut({ callbackUrl: `/${locale}` }); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <span>🚪</span> {t("nav.logout")}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
