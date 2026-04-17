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
  const otherLocale = isEn ? "zh" : "en";

  // Build switch URL by replacing locale prefix
  const switchLocalePath = `/${otherLocale}${pathname?.substring(locale.length + 1) || ""}`;

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

  // Check if current path matches nav item for highlighting
  const isActivePath = (href: string) => {
    // Remove locale prefix for comparison
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
              {isEn ? "JobQuip" : "招聘平台"}
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
              {isEn ? "中文" : "English"}
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
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm">
                      {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || "U"}
                    </div>
                  )}
                  <span className={`text-sm font-medium ${transparent ? "text-white" : "text-gray-700"}`}>
                    {session?.user?.name || t("nav.dashboard")}
                  </span>
                  <svg
                    className={`w-4 h-4 ${transparent ? "text-white" : "text-gray-500"} transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                    <Link
                      href={`/${locale}/dashboard`}
                      className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      {t("nav.dashboard")}
                    </Link>

                    {(isCompany || isAdmin) && (
                      <>
                        <div className="my-2 border-t border-gray-100" />
                        <Link
                          href={`/${locale}/company/dashboard`}
                          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          {isEn ? "Company" : "企业管理"}
                        </Link>
                        <Link
                          href={`/${locale}/company/jobs`}
                          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {isEn ? "Job Mgmt" : "职位管理"}
                        </Link>
                        <Link
                          href={`/${locale}/company/applications`}
                          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                          </svg>
                          {isEn ? "Resumes" : "收到的简历"}
                        </Link>
                      </>
                    )}

                    {isAdmin && (
                      <>
                        <div className="my-2 border-t border-gray-100" />
                        <Link
                          href={`/${locale}/admin`}
                          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {isEn ? "Admin" : "管理后台"}
                        </Link>
                        <Link
                          href={`/${locale}/admin/companies`}
                          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          {isEn ? "Reviews" : "企业审核"}
                        </Link>
                      </>
                    )}

                    <div className="my-2 border-t border-gray-100" />

                    <Link
                      href={`/${locale}/dashboard/favorites`}
                      className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      {isEn ? "Favorites" : "我的收藏"}
                    </Link>
                    <Link
                      href={`/${locale}/dashboard/applications`}
                      className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {isEn ? "Applications" : "我的申请"}
                    </Link>
                    <Link
                      href={`/${locale}/dashboard/profile`}
                      className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {isEn ? "Settings" : "账号设置"}
                    </Link>
                    <hr className="my-2 border-gray-100" />
                    <button
                      onClick={() => {
                        signOut({ callbackUrl: `/${locale}` });
                        setUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 text-left"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      {t("nav.logout")}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href={`/${locale}/auth/login`}
                  className={`px-4 py-2 text-sm font-medium transition-all rounded-lg ${
                    transparent
                      ? "text-white hover:bg-white/10"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {t("nav.login")}
                </Link>
                <Link
                  href={`/${locale}/auth/register`}
                  className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 ${
                    transparent
                      ? "bg-white text-blue-600 hover:bg-gray-100"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {t("nav.register")}
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? t("header.closeMenu") : t("header.menu")}
            aria-expanded={mobileMenuOpen}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 animate-fade-in">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => {
                const isActive = isActivePath(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span aria-hidden="true">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
              <hr className="my-2" />

              {/* Mobile Locale Switcher */}
              <Link
                href={switchLocalePath}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>🌐</span>
                {t("locale.switch")}: <span className="font-medium">{isEn ? "中文" : "English"}</span>
              </Link>

              {isLoggedIn ? (
                <>
                  <Link
                    href={`/${locale}/dashboard`}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>👤</span>
                    {t("nav.dashboard")}
                  </Link>
                  {(isCompany || isAdmin) && (
                    <>
                      <Link
                        href={`/${locale}/company/dashboard`}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span>🏢</span>
                        {isEn ? "Company" : "企业管理"}
                      </Link>
                      <Link
                        href={`/${locale}/company/jobs`}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span>💼</span>
                        {isEn ? "Job Mgmt" : "职位管理"}
                      </Link>
                    </>
                  )}
                  {isAdmin && (
                    <Link
                      href={`/${locale}/admin/companies`}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span>⚙️</span>
                      {isEn ? "Reviews" : "企业审核"}
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      signOut({ callbackUrl: `/${locale}` });
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <span>🚪</span>
                    {t("nav.logout")}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href={`/${locale}/auth/login`}
                    className="px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t("nav.login")}
                  </Link>
                  <Link
                    href={`/${locale}/auth/register`}
                    className="mx-4 py-3 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t("nav.register")}
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
