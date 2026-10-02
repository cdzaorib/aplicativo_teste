# Handoff — App Enxoval

Atualizado em 02/10/2026. Atualize este arquivo ao final de cada etapa.

Produto, decisões e fases: [`PLANO.md`](PLANO.md). Como rodar e estrutura de pastas:
[`README.md`](README.md).

## O que falta (em ordem)

### 1. Login com Google (último item da Fase 1) — depende de ação do usuário

Precisa de contas que só o usuário pode criar ou autorizar:

- [ ] **Projeto Supabase.** O usuário cria em supabase.com ou autoriza o Claude a criar pelo
      conector Supabase da sessão. Não foi criado nada até agora.
- [ ] **Credencial OAuth no Google Cloud** (tipo "Web application") com a URL de callback do
      Supabase, configurada em Supabase → Authentication → Providers → Google.
- [ ] **Decisão técnica:** login pelo navegador (`supabase.auth.signInWithOAuth` +
      `expo-web-browser` + `expo-auth-session`, funciona no Expo Go) ou login nativo
      (`@react-native-google-signin/google-signin`, exige development build). **Recomendação:
      navegador no MVP**, porque o usuário testa pelo Expo Go.
- [ ] Depois do login: tabela da lista no Supabase com RLS por usuário e sincronização com a
      lista local (`src/store/lista.ts`). Hoje a lista existe só no aparelho.

### 2. Testar em aparelho físico

Nunca foi rodado em celular. Só foram verificados os bundles (`expo export`) e a versão web
(Playwright). O usuário tem Android e iPhone e deve testar com o Expo Go (`npx expo start`).
Atenção às abas nativas (`expo-router/unstable-native-tabs`) e aos ícones (`sf` no iOS, `md` no
Android), que não foram vistos rodando.

### 3. Pendências do usuário no GitHub

- [ ] Mudar a branch padrão para `main` (Settings → General → Default branch). Hoje a padrão é
      `claude/plano-enxoval-app`, a primeira branch enviada ao repositório vazio.
- [ ] Apagar a branch antiga `claude/plano-enxoval-app`. O conteúdo dela (`PLANO.md`) já está
      na branch nova.
- [ ] Revisar e fazer merge do PR #1.

### 4. Antes de publicar (Fase 4)

- Nome definitivo, ícone e splash. Hoje: nome provisório "Enxoval" e ícones do template Expo
  em `assets/`.
- Revisão do catálogo (`src/domain/catalogo.ts`) por pediatra ou enfermeira. Todo o conteúdo
  é rascunho, e o app mostra o aviso "Conteúdo em revisão".
- Confirmar a lista de produtos com certificação compulsória do Inmetro (campo `inmetro`).

### 5. Fase 2 (preços) — fechar decisões antes de codar

Lojas iniciais e forma de obter preço (API de afiliado ou feed). O Mercado Livre já tem conta
de afiliado, e as outras lojas entram aos poucos. Os requisitos dos programas foram pesquisados
em blogs, não nas páginas oficiais, e precisam ser confirmados.

## Estado atual

- **Branch:** `claude/app-enxoval`, com base em `main`.
- **PR:** https://github.com/cdzaorib/aplicativo_teste/pull/1 (draft), com CI em GitHub Actions.
- **Feito:**
  - Fase 0 completa.
  - Fase 1 sem login: sugestões, lista, comprado, ordenação, orçamento, itens próprios, modo
    escuro e versão web.
- **Verificação:**
  - `npm run check` passa (lint, typecheck, Prettier, 34 testes).
  - `expo export` gera os bundles de Android, iOS e web.

## Contexto que não está óbvio no código

- **Rede desta sessão:** bloqueia `docs.expo.dev` e a API do Expo.
  - Instalar pacotes com `EXPO_OFFLINE=1 npx expo install <pacote>`, que usa as versões
    compatíveis com o SDK.
  - Conferir APIs nos tipos em `node_modules`. O `AGENTS.md` do template avisa que as APIs do
    Expo mudam a cada SDK.
- **TypeScript 6:** a lista `types` agora começa vazia, então o `tsconfig.json` declara
  `["jest", "expo/types"]`.
- **Hidratação da lista:**
  - O `persist` do Zustand não marca a hidratação como concluída quando a leitura falha. Por
    isso existe a flag `carregada`, preenchida em `onRehydrateStorage`.
  - Na pré-renderização web (Node), a hidratação é pulada (`skipHydration`).
  - Ambos os casos têm teste em `src/store/__tests__/lista.test.ts`.
- **Abas na web:** os `TabTrigger` precisam ser filhos diretos do elemento passado ao `TabList`
  (`src/components/app-tabs.web.tsx`). Senão a tela fica em branco.
- **Preços:** guardados em centavos inteiros (`precoCentavos`).
- **Histórico Git:** a reescrita da branch antiga foi negada pelo controle de permissões. Por
  isso o trabalho foi para uma branch nova a partir de `main`.
- **Usuário:** conhece JavaScript e está começando em React Native, com dedicação integral.
  Explique as decisões e evite abstrações desnecessárias.

## Skills sugeridas

- `anthropic-skills:grill-me`: fechar as decisões da Fase 2 (lojas, coleta de preços) e do login
  antes de codar.
- `anthropic-skills:vercel-react-native-skills`: boas práticas de React Native e Expo ao criar
  telas (listas, performance).
- `run`: subir o app e conferir as mudanças funcionando.
- `code-review` e `simplify`: revisar o diff antes de cada push.
- `anthropic-skills:handoff`: atualizar este arquivo ao final de cada etapa.
- Para o Supabase, usar as ferramentas `mcp__Supabase__*` da sessão. Criar o projeto só com
  autorização do usuário.
