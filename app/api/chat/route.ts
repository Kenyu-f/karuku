import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { askMathTutor, fallbackMessageFor, type ChatTurn } from "@/lib/gemini";
import { buildUserTurn } from "@/lib/prompts";

const MAX_HISTORY_TURNS = 12; // 直近何ターンをAIに渡すか（トークン節約）

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  let body: { conversationId?: string; question?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "リクエストの形式が不正です" }, { status: 400 });
  }

  const question = body.question?.trim();
  if (!question) {
    return NextResponse.json({ error: "質問内容が空です" }, { status: 400 });
  }

  try {
    // 会話が指定されていなければ新規作成
    const conversation = body.conversationId
      ? await prisma.conversation.findFirstOrThrow({
          where: { id: body.conversationId, userId },
        })
      : await prisma.conversation.create({
          data: { userId, title: question.slice(0, 30) },
        });

    // ユーザーの発言を先に保存
    await prisma.message.create({
      data: { conversationId: conversation.id, role: "user", content: question },
    });

    // 直近履歴を取得してAIに渡す文脈を組み立て
    const pastMessages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
      take: MAX_HISTORY_TURNS * 2,
    });

    const history: ChatTurn[] = pastMessages.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));
    // 最新のユーザー発言はプロンプトのフォーマット指示を添えて上書き
    history[history.length - 1] = { role: "user", content: buildUserTurn(question) };

    let answer: string;
    let isError = false;
    try {
      answer = await askMathTutor(history);
    } catch (err) {
      answer = fallbackMessageFor(err);
      isError = true;
    }

    await prisma.message.create({
      data: { conversationId: conversation.id, role: "assistant", content: answer, isError },
    });

    // 学習履歴（質問ログ）にも記録
    await prisma.questionHistory.create({
      data: { userId, question },
    });

    return NextResponse.json({
      conversationId: conversation.id,
      answer,
      isError,
    });
  } catch (err) {
    console.error("[POST /api/chat] unexpected error:", err);
    return NextResponse.json(
      { error: "サーバー内部でエラーが発生しました。時間をおいて再度お試しください。" },
      { status: 500 }
    );
  }
}
