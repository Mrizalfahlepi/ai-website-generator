import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    // Get user ID from header (will be set by auth middleware in Fase 3)
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Login diperlukan." },
        { status: 401 }
      );
    }

    const supabase = createServerClient();
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .single();

    if (error || !profile) {
      return NextResponse.json(
        { error: "Profil tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({ credits: profile.credits });
  } catch (error) {
    console.error("Credits error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data kredit." },
      { status: 500 }
    );
  }
}
