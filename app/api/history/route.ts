import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/history            -> ログインユーザーの会話一覧（タイトルのみ、軽量）
// GET /api/history?id=xxx      -> 指定した会話の全メッセージ
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("id");

  try {
    if (conversationId) {
      const conversation = await prisma.conversation.findFirst({
        where: { id: conversationId, userId },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });
      if (!conversation) {
        return NextResponse.json({ error: "会話が見つかりません" }, { status: 404 });
      }
      return NextResponse.json({ conversation });
    }

    const conversations = await prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, updatedAt: true },
    });
    return NextResponse.json({ conversations });
  } catch (err) {
    console.error("[GET /api/history] error:", err);
    return NextResponse.json({ error: "履歴の取得に失敗しました" }, { status: 500 });
  }
}
