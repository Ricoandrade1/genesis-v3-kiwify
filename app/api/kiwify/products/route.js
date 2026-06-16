import { NextResponse } from "next/server";
import { createKiwifyProduct } from "@/lib/kiwify";

export async function POST(request) {
  let body;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON invalido." }, { status: 400 });
  }

  try {
    const result = await createKiwifyProduct(body);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const status = error.message.includes("obrigatorio") || error.message.includes("preco") ? 400 : 502;
    return NextResponse.json({ ok: false, error: error.message }, { status });
  }
}

