import { NextRequest, NextResponse } from "next/server";
import { generateWebsite } from "@/lib/ai/engine";
import { z } from "zod";

const generateSchema = z.object({
  prompt: z.string().min(3, "Prompt minimal 3 karakter").max(1000),
});

const rateLimit = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Terlalu banyak request. Coba lagi dalam 1 menit." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = generateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const result = await generateWebsite(parsed.data.prompt);

    return NextResponse.json({
      html: result.html,
      provider: result.provider,
      tokensUsed: result.tokensUsed,
      enhancedPrompt: result.enhancedPrompt,
    });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: "Gagal generate website. Silakan coba lagi." },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
export const maxDuration = 60;
