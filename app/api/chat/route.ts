import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { askMathTutor, fallbackMessageFor, type ChatTurn, type ImageInput } from "@/lib/gemini";
import { buildUserTurn } from "@/lib/prompts";

const MAX_HISTORY_TURNS = 12; // 直近何ターンをAIに渡すか(トークン節約)
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // base64換算で概算5MBまで

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  let body: {
    conversationId?: string;
    question?: string;
    image?: { mimeType: string; data: string }; // data: base64(data:...;base64, は除いた本体のみ)
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "リクエストの形式が不正です" }, { status: 400 });
  }

  const question = (body.question ?? "").trim();
  const image = body.image;

  if (!question && !image) {
    return NextResponse.json({ error: "質問内容または画像を入力してください" }, { status: 400 });
  }
  if (image) {
    if (!image.mimeType?.startsWith("image/")) {
      return NextResponse.json({ error: "画像形式が不正です" }, { status: 400 });
    }
    if (image.data.length > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "画像サイズが大きすぎます(5MB以下にしてください)" }, { status: 400 });
    }
  }

  try {
    const conversation = body.conversationId
      ? await prisma.conversation.findFirstOrThrow({
          where: { id: body.conversationId, userId },
        })
      : await prisma.conversation.create({
          data: { userId, title: question ? question.slice(0, 30) : "画像からの質問" },
        });

    // ユーザーの発言を保存(画像そのものはDBに保存せず、添付した事実のみ記録する)
    const userContentForDb = image ? `${question ? question + "\n" : ""}[画像を添付]` : question;
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: userContentForDb,
        hasImage: Boolean(image),
      },
    });

    const pastMessages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
      take: MAX_HISTORY_TURNS * 2,
    });

    const history: ChatTurn[] = pastMessages.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));
    // 最新のユーザー発言はプロンプトのフォーマット指示を添えて上書き(画像はここに添付する)
    history[history.length - 1] = { role: "user", content: buildUserTurn(question, Boolean(image)) };

    const imageInput: ImageInput | undefined = image
      ? { mimeType: image.mimeType, data: image.data }
      : undefined;

    let answer: string;
    let isError = false;
    try {
      answer = await askMathTutor(history, imageInput);
    } catch (err) {
      answer = fallbackMessageFor(err);
      isError = true;
    }

    await prisma.message.create({
      data: { conversationId: conversation.id, role: "assistant", content: answer, isError },
    });

    await prisma.questionHistory.create({
      data: { userId, question: question || "(画像からの質問)" },
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
