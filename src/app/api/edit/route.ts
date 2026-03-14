import { NextRequest, NextResponse } from "next/server";
import { editWebsite } from "@/lib/ai/engine";
import { createServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const editSchema = z.object({
  websiteId: z.string().uuid("Invalid website ID"),
  editPrompt: z.string().min(3, "Edit prompt minimal 3 karakter").max(1000),
  currentHtml: z.string().min(100, "HTML terlalu pendek"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = editSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { websiteId, editPrompt, currentHtml } = parsed.data;

    const result = await editWebsite(currentHtml, editPrompt);

    // Save edit to Supabase
    const supabase = createServerClient();
    const { error: dbError } = await supabase.from("edits").insert({
      website_id: websiteId,
      edit_prompt: editPrompt,
      html_before: currentHtml.substring(0, 5000),
      html_after: result.html.substring(0, 5000),
    });

    if (dbError) {
      console.warn("Failed to save edit to DB:", dbError);
    }

    // Update website HTML
    await supabase
      .from("websites")
      .update({ html: result.html, updated_at: new Date().toISOString() })
      .eq("id", websiteId);

    return NextResponse.json({
      html: result.html,
      provider: result.provider,
      tokensUsed: result.tokensUsed,
    });
  } catch (error) {
    console.error("Edit error:", error);
    return NextResponse.json(
      { error: "Gagal mengedit website. Silakan coba lagi." },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
export const maxDuration = 60;
