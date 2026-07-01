import { redirect } from "next/navigation";

const USER_ROUTE_MAP: Record<string, string> = {
  applications: "dashboard/applications",
  favorites: "dashboard/favorites",
  notifications: "dashboard/notifications",
  profile: "dashboard/profile",
  resumes: "dashboard/resumes",
  settings: "dashboard/settings",
  promoter: "promoter/dashboard",
};

export default async function UserAliasPage({
  params,
}: {
  params: Promise<{ locale: string; path: string[] }>;
}) {
  const { locale, path } = await params;
  const firstSegment = path[0];
  const target = firstSegment ? USER_ROUTE_MAP[firstSegment] : "dashboard";

  redirect(`/${locale}/${target || "dashboard"}`);
}
