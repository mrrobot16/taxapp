import { NextResponse } from "next/server";

// Use 127.0.0.1 explicitly to avoid IPv6 resolution issues with localhost
const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`, { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[health proxy] Could not reach backend:", err);
    return NextResponse.json(
      { status: "offline", doc_count: 0 },
      { status: 503 }
    );
  }
}
