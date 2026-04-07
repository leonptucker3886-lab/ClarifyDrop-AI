import { NextRequest, NextResponse } from "next/server";
import { results } from "@/lib/store";

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get("orderId");

  if (!orderId) {
    return NextResponse.json({ error: "Order ID required" }, { status: 400 });
  }

  const result = results.get(orderId);

  if (!result) {
    return NextResponse.json({ error: "Result not found" }, { status: 404 });
  }

  return NextResponse.json({ result });
}
