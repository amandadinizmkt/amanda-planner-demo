import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { COACH_COMPORTAMENTO, montarContextoPessoal } from "@/lib/coach";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ============================================================
//  A IA DENTRO DO APP — a chamada do Claude mora AQUI, no
//  servidor. A chave é secreta e nunca vai pro navegador. O
//  "system" é montado com o contexto REAL do usuário logado
//  (tasks, pendências, metas, insights, estudos), lido do
//  Supabase com RLS — não é um texto fixo como em negocio.ts.
// ============================================================

const client = new Anthropic();

type Msg = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    return NextResponse.json(
      { error: "Falta a chave. Coloque ANTHROPIC_API_KEY no .env.local." },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Faça login pra falar com o Coach." }, { status: 401 });
  }

  let body: { mensagens?: unknown };
  try {
    body = (await req.json()) as { mensagens?: unknown };
  } catch {
    return NextResponse.json({ error: "Envio inválido." }, { status: 400 });
  }

  // Freio de custo: limita tamanho de cada mensagem e quantidade no histórico.
  // (Num produto de verdade, some a isto um LIMITE POR USUÁRIO/DIA.)
  const mensagens = Array.isArray(body.mensagens) ? (body.mensagens as Msg[]) : [];
  const limpas = mensagens
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }))
    .slice(-30);
  if (!limpas.length || limpas[limpas.length - 1].role !== "user") {
    return NextResponse.json({ error: "Mande uma mensagem." }, { status: 400 });
  }

  try {
    const contexto = await montarContextoPessoal(supabase);
    const msg = await client.messages.create({
      model: "claude-opus-4-8", // padrão. Pra respostas simples e baratas: "claude-haiku-4-5".
      max_tokens: 700,
      system: `${COACH_COMPORTAMENTO}\n\n${contexto}`,
      messages: limpas,
    });

    const resposta = msg.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    return NextResponse.json({
      resposta,
      uso: { entrada: msg.usage.input_tokens, saida: msg.usage.output_tokens },
    });
  } catch (err: unknown) {
    const m = err instanceof Error ? err.message : "Erro ao chamar a IA.";
    return NextResponse.json({ error: m }, { status: 502 });
  }
}
