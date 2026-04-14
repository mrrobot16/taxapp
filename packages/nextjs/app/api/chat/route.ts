import { NextRequest } from "next/server";
import {
  API_ROUTES,
  BACKEND_UNREACHABLE_ERROR_MESSAGE,
  DEFAULT_BACKEND_URL,
  HTTP_STATUS_SERVICE_UNAVAILABLE,
} from "@/constants";

// Use 127.0.0.1 explicitly to avoid IPv6 resolution issues with localhost
const BACKEND_URL = process.env.BACKEND_URL ?? DEFAULT_BACKEND_URL;

export async function POST(req: NextRequest) {
  const body = await req.json();

  let upstream: Response;
  try {
    upstream = await fetch(`${BACKEND_URL}${API_ROUTES.chat}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return new Response(
      JSON.stringify({ error: BACKEND_UNREACHABLE_ERROR_MESSAGE }),
      { status: HTTP_STATUS_SERVICE_UNAVAILABLE, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!upstream.ok) {
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Stream SSE response straight back to the browser
  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
