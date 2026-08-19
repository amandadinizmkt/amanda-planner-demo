import type { SupabaseClient } from "@supabase/supabase-js";
import { toISODate } from "./utils/date";

// ============================================================
//  O "CÉREBRO" DO COACH IA — mesmo padrão do app de referência
//  da aula (negocio.ts), só que o contexto não é fixo: é montado
//  na hora, a partir dos dados REAIS do usuário logado (tasks,
//  pendências, metas, insights, estudos). RLS no Supabase garante
//  que cada query já volta só os dados de quem está autenticado.
// ============================================================

export const COACH_COMPORTAMENTO = `Você é o Coach do Planner — um assistente pessoal que entende a rotina da pessoa a partir dos dados reais dela, listados abaixo. Quando ela pedir ajuda pra organizar o dia, priorizar ou destravar algo, RECOMENDE com base no que está pendente e explique o porquê em uma frase. Aponte padrões (uma meta que não bate há dias, uma pendência atrasada, um tema que se repete nos insights). Nunca invente tarefa, meta, prazo ou dado que não esteja na lista — se não tiver a informação, diga com sinceridade. Seja direto e encorajador, sem sermão. Respostas objetivas.`;

function bloco(titulo: string, linhas: string[]): string {
  return `${titulo}\n${linhas.length ? linhas.join("\n") : "(nada por aqui)"}`;
}

export async function montarContextoPessoal(supabase: SupabaseClient): Promise<string> {
  const hoje = toISODate(new Date());
  const em7dias = toISODate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  const [tasksRes, pendenciasRes, metasRes, checksRes, insightsRes, estudosRes] =
    await Promise.all([
      supabase
        .from("tasks")
        .select("title,date,priority,status")
        .neq("status", "Concluída")
        .gte("date", hoje)
        .lte("date", em7dias)
        .order("date"),
      supabase
        .from("pendencias")
        .select("title,deadline,priority,status")
        .eq("status", "Aberta")
        .order("priority", { ascending: false }),
      supabase
        .from("metas")
        .select("id,label,target,target_unit")
        .eq("is_active", true)
        .order("order"),
      supabase.from("meta_checks").select("meta_id,completed,value").eq("date", hoje),
      supabase
        .from("insights")
        .select("title,content,category,created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase.from("estudos").select("title,status,category").eq("status", "em andamento"),
    ]);

  const tasksBlock = bloco(
    "TAREFAS PENDENTES (próximos 7 dias):",
    (tasksRes.data ?? []).map((t) => `- [${t.status}] ${t.title} · ${t.date} · prioridade ${t.priority}`)
  );

  const pendenciasBlock = bloco(
    "PENDÊNCIAS ABERTAS:",
    (pendenciasRes.data ?? []).map(
      (p) => `- ${p.title} · prioridade ${p.priority}${p.deadline ? ` · prazo ${p.deadline}` : ""}`
    )
  );

  const checksByMeta = new Map((checksRes.data ?? []).map((c) => [c.meta_id, c]));
  const metasBlock = bloco(
    "METAS DE HOJE:",
    (metasRes.data ?? []).map((m) => {
      const check = checksByMeta.get(m.id);
      const status = check?.completed
        ? "batida"
        : m.target
          ? `${check?.value ?? 0}/${m.target} ${m.target_unit ?? ""}`.trim()
          : "não batida";
      return `- ${m.label}: ${status}`;
    })
  );

  const insightsBlock = bloco(
    "ÚLTIMOS INSIGHTS SALVOS:",
    (insightsRes.data ?? []).map((i) => `- [${i.category}] ${i.title}: ${i.content.slice(0, 140)}`)
  );

  const estudosBlock = bloco(
    "ESTUDOS EM ANDAMENTO:",
    (estudosRes.data ?? []).map((e) => `- ${e.title} (${e.category})`)
  );

  return `DADOS REAIS DE ${hoje} — use SOMENTE isto pra responder, não invente nada fora daqui:

${tasksBlock}

${pendenciasBlock}

${metasBlock}

${insightsBlock}

${estudosBlock}`;
}
