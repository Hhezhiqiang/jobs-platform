"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Briefcase, Building2, BookOpen, TrendingUp, Globe, User, ChevronDown, Menu, X, LogOut } from "lucide-react";

interface HeaderProps {
  transparent?: boolean;
}

export function Header({ transparent = false }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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

  // Track scroll for header styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    { label: t("nav.jobs"), href: `/${locale}/jobs`, icon: Briefcase },
    { label: t("nav.companies"), href: `/${locale}/companies`, icon: Building2 },
    { label: t("nav.blog"), href: `/${locale}/blog`, icon: BookOpen },
    { label: t("nav.careerTrail"), href: `/${locale}/career-trail`, icon: TrendingUp },
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
        transparent && !scrolled
          ? "bg-transparent"
          : "bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:shadow-lg group-hover:shadow-blue-500/20 transition-all">
              J
            </div>
            <span className={`text-lg font-bold tracking-tight ${transparent && !scrolled ? "text-white" : "text-gray-900"}`}>
              {t("site.name")}
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = isActivePath(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    transparent && !scrolled
                      ? isActive
                        ? "text-white bg-white/20"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                      : isActive
                        ? "text-blue-600 bg-blue-50"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            {/* Locale Switcher */}
            <Link
              href={switchLocalePath}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                transparent && !scrolled
                  ? "text-white/80 hover:text-white hover:bg-white/10"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/50"
              }`}
              title={t("locale.switch")}
            >
              <Globe className="w-4 h-4" />
              {isEn ? "EN" : "中文"}
            </Link>

            {isLoggedIn ? (
              <div className="relative user-menu-container">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                    transparent && !scrolled
                      ? "text-white/90 hover:bg-white/10"
                      : "text-gray-700 hover:bg-gray-100/50"
                  }`}
                >
                  {session?.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || t("nav.dashboard")}
                      width={28}
                      height={28}
                      className="w-7 h-7 rounded-full ring-2 ring-white/50"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                      {(session?.user?.name || "U").charAt(0)}
                    </div>
                  )}
                  <ChevronDown className={`w-4 h-4 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900 truncate">{session?.user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
                      </div>
                      {isCompany && (
                        <Link href={`/${locale}/company/dashboard`} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                          <Building2 className="w-4 h-4" />
                          {t("header.company")}
                        </Link>
                      )}
                      {isAdmin && (
                        <Link href={`/${locale}/admin`} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                          <User className="w-4 h-4" />
                          {t("header.admin")}
                        </Link>
                      )}
                      {!isCompany && !isAdmin && (
                        <>
                          <Link href={`/${locale}/dashboard/favorites`} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                            <Briefcase className="w-4 h-4" />
                            {t("header.favorites")}
                          </Link>
                          <Link href={`/${locale}/dashboard/applications`} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                            <BookOpen className="w-4 h-4" />
                            {t("header.applications")}
                          </Link>
                        </>
                      )}
                      <div className="border-t border-gray-100 my-1" />
                      <Link href={`/${locale}/dashboard/settings`} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                        <User className="w-4 h-4" />
                        {t("header.settings")}
                      </Link>
                      <button
                        onClick={() => { setUserMenuOpen(false); signOut({ callbackUrl: `/${locale}` }); }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" />
                        {t("nav.logout")}
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
                    transparent && !scrolled
                      ? "text-white/90 hover:bg-white/10"
                      : "text-gray-700 hover:bg-gray-100/50"
                  }`}
                >
                  {t("nav.login")}
                </Link>
                <Link
                  href={`/${locale}/auth/register`}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all hover:shadow-md hover:shadow-blue-500/20"
                >
                  {t("nav.register")}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className={`md:hidden p-2 rounded-lg transition-all ${
              transparent && !scrolled
                ? "text-white hover:bg-white/10"
                : "text-gray-600 hover:bg-gray-100/50"
            }`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={t("header.menu")}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200/50 py-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="w-5 h-5 text-gray-400" />
                  {item.label}
                </Link>
              );
            })}
            <div className="border-t border-gray-200 my-2" />
            <Link
              href={switchLocalePath}
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Globe className="w-5 h-5 text-gray-400" />
              {t("locale.switch")}: {isEn ? "中文" : "English"}
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
                <Link
                  href={`/${locale}/dashboard`}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="w-5 h-5 text-gray-400" />
                  {t("nav.dashboard")}
                </Link>
                <button
                  onClick={() => { setMobileMenuOpen(false); signOut({ callbackUrl: `/${locale}` }); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <LogOut className="w-5 h-5" />
                  {t("nav.logout")}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
