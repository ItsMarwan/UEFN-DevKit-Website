import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase server config missing");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const users = Number(body.users);
    const guilds = Number(body.guilds);
    const last_updated = Number(body.last_updated);

    if (
      Number.isNaN(users) ||
      Number.isNaN(guilds) ||
      Number.isNaN(last_updated) ||
      users < 0 ||
      guilds < 0 ||
      last_updated < 0
    ) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { error } = await supabase
      .from("bot_stats")
      .upsert({ id: 1, users, guilds, last_updated })
      .eq("id", 1);

    if (error) {
      console.error("/internal/stats/update supabase error", error);
      return NextResponse.json({ error: "Database update failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("/internal/stats/update error", err);
    return NextResponse.json({ error: "Failed to update stats" }, { status: 500 });
  }
}
