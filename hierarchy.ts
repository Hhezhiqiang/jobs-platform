import { prisma } from "@/lib/prisma";

export const COMMISSION_TIERS = [
  { level: 1, rate: 30.0, label: "直推佣金" },
  { level: 2, rate: 15.0, label: "间推佣金" },
  { level: 3, rate: 10.0, label: "团队佣金" },
  { level: 4, rate: 5.0, label: "团队佣金" },
  { level: 5, rate: 5.0, label: "团队佣金" },
];

export async function getDownlineTree(promoterId: string, maxDepth: number = 10) {
  const tree: any[] = [];
  const queue: { id: string; depth: number; side: string }[] = [{ id: promoterId, depth: 0, side: "root" }];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current.id)) continue;
    visited.add(current.id);

    if (current.depth > 0) {
      const member: any = await prisma.$queryRaw`
        SELECT id, name, email, COALESCE(level, 0) as level,
               COALESCE("placement_depth", 0) as "placementDepth",
               COALESCE("left_team_count", 0) as "leftTeamCount",
               COALESCE("right_team_count", 0) as "rightTeamCount"
        FROM promoters WHERE id = ${current.id}
      `;
      if (member.length > 0) {
        tree.push({ ...member[0], side: current.side });
      }
    }

    if (current.depth < maxDepth) {
      const leftChildren: any = await prisma.$queryRaw`
        SELECT id FROM promoters WHERE "parent_left_id" = ${current.id}
      `;
      for (const child of leftChildren) {
        queue.push({ id: child.id, depth: current.depth + 1, side: "left" });
      }
      const rightChildren: any = await prisma.$queryRaw`
        SELECT id FROM promoters WHERE "parent_right_id" = ${current.id}
      `;
      for (const child of rightChildren) {
        queue.push({ id: child.id, depth: current.depth + 1, side: "right" });
      }
    }
  }
  return tree;
}

export async function getMatrixStats(promoterId: string) {
  const stats: any = await prisma.$queryRaw`
    SELECT COALESCE("left_team_count", 0) as "leftTeamCount",
           COALESCE("right_team_count", 0) as "rightTeamCount"
    FROM promoters WHERE id = ${promoterId}
  `;
  return stats[0];
}
