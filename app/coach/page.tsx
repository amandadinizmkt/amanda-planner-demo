"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Msg = { role: "user" | "assistant"; content: string };

const SUGESTOES = [
  "O que eu deveria priorizar hoje?",
  "Tem alguma meta que eu tô deixando passar?",
  "Resuma minhas pendências em aberto",
];

export default function CoachPage() {
  const [mensagens, setMensagens] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [ultimoUso, setUltimoUso] = useState<{ entrada: number; saida: number } | null>(null);
  const fimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens, loading]);

  async function enviar(texto: string) {
    const conteudo = texto.trim();
    if (!conteudo || loading) return;

    const proximas: Msg[] = [...mensagens, { role: "user", content: conteudo }];
    setMensagens(proximas);
    setInput("");
    setErro("");
    setLoading(true);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensagens: proximas }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao chamar o Coach.");
      setMensagens([...proximas, { role: "assistant", content: data.resposta }]);
      setUltimoUso(data.uso);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao chamar o Coach.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-6 flex flex-col h-[calc(100vh-3rem)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-sm">
          <Sparkles size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Coach IA</h1>
          <p className="text-xs text-gray-400">Fala com base nas suas tarefas, metas e insights de verdade</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pb-3">
        {mensagens.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm text-gray-500 mb-3">
              Pergunte algo sobre a sua rotina — eu leio suas tarefas, pendências, metas de hoje e insights salvos.
            </p>
            <div className="flex flex-col gap-2">
              {SUGESTOES.map((s) => (
                <button
                  key={s}
                  onClick={() => enviar(s)}
                  className="text-left text-sm text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl px-3.5 py-2.5 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {mensagens.map((m, i) => (
          <div
            key={i}
            className={cn(
              "rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[85%] whitespace-pre-wrap",
              m.role === "user"
                ? "bg-purple-600 text-white ml-auto"
                : "bg-white border border-gray-100 shadow-sm text-gray-800"
            )}
          >
            {m.content}
          </div>
        ))}

        {loading && (
          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl px-4 py-3 text-sm text-gray-400 flex items-center gap-2 max-w-[85%]">
            <Loader2 size={14} className="animate-spin" /> pensando...
          </div>
        )}

        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3">{erro}</div>
        )}

        {ultimoUso && (
          <p className="text-[10px] text-gray-300 text-right">
            tokens: {ultimoUso.entrada} entrada · {ultimoUso.saida} saída
          </p>
        )}

        <div ref={fimRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviar(input);
        }}
        className="flex items-center gap-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-2 mt-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunte algo pro seu Coach..."
          className="flex-1 text-sm outline-none bg-transparent px-3 py-2 text-gray-700 placeholder-gray-400"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 disabled:opacity-40 transition-colors shrink-0"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
