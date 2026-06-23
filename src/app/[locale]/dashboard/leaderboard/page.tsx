import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LeaderboardPage } from "@/components/game/leaderboard-page";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "dashboard.leaderboardPage.meta" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function LeaderboardRoute() {
  return <LeaderboardPage />;
}
