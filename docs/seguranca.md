# Segurança

Revisão feita em 03/10/2026. Refaça a cada mudança no banco (migração nova) ou nas Edge Functions.

## SQL injection

Não há caminho para SQL injection:

- **App:** todas as consultas usam o supabase-js, com filtros `.eq()` e funções (RPC) com
  argumentos nomeados. O texto digitado vira parâmetro e nunca entra no SQL. Os filtros do tempo
  real (`src/nuvem/tempo-real.ts`) usam só ids gerados pelo servidor (a lista e o usuário).
- **Banco:** nenhuma função monta SQL com texto (não há `EXECUTE` nem `format()` com valor de fora).
  As 23 funções `SECURITY DEFINER` fixam `search_path = ''` e escrevem o esquema de cada tabela.
- **Edge Functions:** usam o supabase-js. A busca na Shopee monta o GraphQL com
  `JSON.stringify`, que escapa o texto, e os termos vêm do catálogo do próprio app.

Conferido no Supabase de verdade, chamando a API de fora só com a chave pública:

| Tentativa                                                               | Resposta                              |
| ----------------------------------------------------------------------- | ------------------------------------- |
| Filtro de ofertas com `' or '1'='1`                                     | `[]` (o texto é comparado como texto) |
| Código da lista de presentes com `' or '1'='1`                          | `null` (nenhuma lista)                |
| Nome do convidado com `'); select pg_sleep(5); --`                      | recusado como link inválido, na hora  |
| Ler `itens` e `presentes`, mudar `listas` e entrar numa lista sem login | 401, permissão negada (42501)         |
| Edge Functions sem chave ou sem login                                   | 401                                   |

## Quem acessa o quê

- **RLS:** todas as tabelas têm RLS. Cada pessoa só lê e muda o que a lista dela permite.
- **Sem login:** o papel `anon` não tem permissão nenhuma nas tabelas da lista (migração
  `20261003060000_endurecer_permissoes.sql`). Ele só:
  - lê as ofertas;
  - chama as funções da lista de presentes, que exigem o código secreto do link (16 caracteres
    aleatórios, de `gen_random_bytes`).
- **Com login:** `listas` e `membros_lista` mudam só pelas funções do app. Ninguém apaga itens
  ou preços pela API, nem usa `TRUNCATE`, que ignoraria o RLS.
- **Convites:** no máximo 10 tentativas de código por pessoa por hora.
- **Edge Functions:**
  - `excluir-conta` confere o token no Supabase Auth;
  - `coletar-ofertas` exige a chave `x-chave-coleta`, que fica nos segredos.

Os testes (`npm run test:supabase`, também no CI) cobrem cada regra acima. O advisor de
segurança do Supabase aponta só o que é intencional (ver `HANDOFF.md`).

## Segredos

- O `.env` do repositório tem só a URL e a chave pública (`sb_publishable_...`), feitas para
  ficar dentro do app.
- A chave secreta, o segredo do Google e as credenciais da Shopee ficam só no painel do
  Supabase (Edge Functions → Secrets) e nunca entram no código.

## Web

- O React escapa todo texto: nome de convidado, nome de item e perguntas aparecem como texto,
  nunca como HTML.
- O app abre só links `https` das ofertas, e a coleta descarta link ou imagem que não seja
  `https`. Um `javascript:` vindo do banco não roda.

## Dados de saúde

A data prevista do parto, a próxima consulta e as perguntas ficam só no aparelho (LGPD). Ver a
política de privacidade (`src/app/privacidade.tsx`).

## Pendências conhecidas

- **Dependências:** o `npm audit` aponta falhas em pacotes que vêm junto com o Expo.
  - Quase todas estão em ferramentas de build (`node-forge`, `braces` e `uuid`), fora do app
    publicado.
  - A única que chega ao app é a `decode-uri-component`, usada pelo expo-router para ler links.
    Um link malformado pode deixar o app lento, sem vazar dados.
  - Já estamos na última versão do SDK 57. Rode `npx expo install --fix` quando sair
    atualização.
- **Sessão no aparelho:** a sessão do login fica no AsyncStorage, que é o padrão do Supabase
  para React Native e fica na área privada do app. O `expo-secure-store` criptografaria, mas
  tem limite de tamanho por valor; fica para avaliar antes de publicar.
