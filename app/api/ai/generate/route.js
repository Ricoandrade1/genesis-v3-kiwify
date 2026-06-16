import { NextResponse } from "next/server";
import { generateAiModule } from "@/lib/ai";

export async function POST(request) {
  let body;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON invalido." }, { status: 400 });
  }

  try {
    const result = await generateAiModule(body);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido na IA.";
    const status = message.includes("obrigatorio") || message.includes("invalido") ? 400 : 502;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

