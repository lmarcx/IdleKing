import { redirect } from "next/navigation";

import { getDuelFightHref } from "@/lib/duel-data";

type DuelPageProps = {
  params: Promise<{
    duelId: string;
  }>;
};

export default async function LegacyWorldsDuelPage({ params }: DuelPageProps) {
  const { duelId } = await params;
  redirect(getDuelFightHref(duelId) ?? "/game/kingdom");
}
