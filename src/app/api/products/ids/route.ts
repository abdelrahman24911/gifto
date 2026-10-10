import { NextResponse } from "next/server";
import { getProductsByIds } from "@/lib/data/products";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ids = url.searchParams.getAll("id").slice(0, 30);
  if (ids.length === 0) return NextResponse.json({ items: [] });

  try {
    const items = await getProductsByIds(ids);
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] }, { status: 502 });
  }
}