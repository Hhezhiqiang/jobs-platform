import { Metadata } from "next";
import { LeaderboardPage } from "@/components/game/leaderboard-page";

export const metadata: Metadata = {
  title: "排行榜 | 求职平台",
  description: "查看全站求职者排名，与大家一起竞技成长",
};

export default function LeaderboardRoute() {
  return <LeaderboardPage />;
}
