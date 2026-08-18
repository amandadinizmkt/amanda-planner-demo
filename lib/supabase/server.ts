import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Cliente Supabase pra Route Handlers (server-side) — lê a sessão do
// usuário a partir dos cookies (o mesmo padrão do middleware.ts). Com RLS
// ativo nas tabelas, cada query já volta só os dados do usuário logado.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Chamado num Route Handler sem permissão de escrita de cookie —
            // ok, o middleware já cuida do refresh de sessão.
          }
        },
      },
    }
  );
}
