import { NextRequest, NextResponse } from "next/server";
import { analyzeImages } from "@/lib/mock";

export async function POST(req: NextRequest) {
  try {
    const { problemImage, answerImage } = await req.json();

    if (!problemImage || !answerImage) {
      return NextResponse.json(
        { error: "problemImage と answerImage は必須です" },
        { status: 400 }
      );
    }

    const result = await analyzeImages(problemImage, answerImage);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "解析中にエラーが発生しました" }, { status: 500 });
  }
}
