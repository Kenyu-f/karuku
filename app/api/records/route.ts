import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AnalysisResult } from "@/lib/types";

export type RecordSummary = AnalysisResult & { id: string; createdAt: string };

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  try {
    const records = await prisma.analysisRecord.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const items: RecordSummary[] = records.map((r) => ({
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      status: r.status as AnalysisResult["status"],
      mistake: r.mistake,
      hint: r.hint,
      flowchart: JSON.parse(r.flowchart),
      steps: JSON.parse(r.steps),
    }));

    return NextResponse.json({ records: items });
  } catch (err) {
    console.error("[GET /api/records] error:", err);
    return NextResponse.json({ error: "履歴の取得に失敗しました" }, { status: 500 });
  }
}
