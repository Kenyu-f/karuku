import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AnalysisResult } from "@/lib/types";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const records = await prisma.analysisRecord.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const items = records.map((r) => ({
    id: r.id,
    createdAt: r.createdAt,
    result: {
      status: r.status,
      mistake: r.mistake,
      hint: r.hint,
      flowchart: JSON.parse(r.flowchart),
      steps: JSON.parse(r.steps),
    } as AnalysisResult,
  }));

  return NextResponse.json({ items });
}
