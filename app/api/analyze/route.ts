import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeMathImages, AiUnavailableError, fallbackMessageFor } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { problemImage, answerImage } = await req.json();

    if (!problemImage || !answerImage) {
      return NextResponse.json(
        { error: "problemImage と answerImage は必須です" },
        { status: 400 }
      );
    }

    const result = await analyzeMathImages(problemImage, answerImage);

    // ログイン済みの場合のみ、学習履歴として自動保存する(未ログインでも解析自体は利用可能)
    const session = await getServerSession(authOptions);
    let saved = false;
    if (session?.user) {
      try {
        const userId = (session.user as { id: string }).id;
        await prisma.analysisRecord.create({
          data: {
            userId,
            status: result.status,
            mistake: result.mistake,
            hint: result.hint,
            flowchart: JSON.stringify(result.flowchart),
            steps: JSON.stringify(result.steps),
          },
        });
        saved = true;
      } catch (dbErr) {
        // 保存に失敗しても解析結果自体は返す(ユーザー体験を止めない)
        console.error("[POST /api/analyze] failed to save history:", dbErr);
      }
    }

    return NextResponse.json({ ...result, saved });
  } catch (err) {
    console.error("[POST /api/analyze] error:", err);
    const message =
      err instanceof AiUnavailableError ? fallbackMessageFor(err) : "解析中にエラーが発生しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
