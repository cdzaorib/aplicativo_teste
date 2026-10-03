// Exclui a conta de quem chama (botão "Excluir minha conta", na aba Conta do app).
//
// Apagar o usuário apaga em cascata a lista própria e os itens dela, a participação em listas
// compartilhadas, os preços informados e a contagem de tentativas de convite. Os convidados de
// uma dona voltam para as próprias listas (gatilho `devolver_convidados`).
//
// Publicada com verify_jwt = false: a função confere o token da pessoa no Supabase Auth, porque
// a verificação automática não entende as chaves novas (sb_publishable/sb_secret).
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function resposta(corpo: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

/** Chave secreta nova (sb_secret_...) ou, se o projeto não tiver, a service_role antiga. */
function chaveSecreta(): string {
  const novas = Deno.env.get('SUPABASE_SECRET_KEYS');
  const nova: string | undefined = novas ? JSON.parse(novas).default : undefined;
  return nova ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return resposta({ erro: 'Use POST.' }, 405);

  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return resposta({ erro: 'É preciso entrar na conta.' }, 401);

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, chaveSecreta(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // O Supabase Auth confere o token: só quem tem a sessão exclui a própria conta.
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return resposta({ erro: 'Sessão inválida. Entre de novo.' }, 401);

  const { error: erroExclusao } = await admin.auth.admin.deleteUser(data.user.id);
  if (erroExclusao) {
    console.error('Falha ao excluir conta', data.user.id, erroExclusao.message);
    return resposta({ erro: 'Não foi possível excluir a conta.' }, 500);
  }
  return resposta({ ok: true });
});
