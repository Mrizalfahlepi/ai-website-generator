import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = createServerClient();
    const { data: website, error } = await supabase
      .from("websites")
      .select("id, title, prompt, html, provider, tokens_used, created_at, updated_at")
      .eq("id", id)
      .single();

    if (error || !website) {
      return NextResponse.json(
        { error: "Website tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json(website);
  } catch (error) {
    console.error("Get website error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data website." },
      { status: 500 }
    );
  }
}
