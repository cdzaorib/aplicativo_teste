# Handoff — App Enxoval

Atualizado em 02/10/2026. Atualize este arquivo ao final de cada etapa.

Produto, decisões e fases: [`PLANO.md`](PLANO.md). Como rodar e estrutura de pastas:
[`README.md`](README.md).

## O que falta (em ordem)

### 1. Ativar o Google no Supabase — ação do usuário

O código do login e da sincronização está pronto, mas o provedor Google ainda não foi configurado.
Até lá, o botão "Entrar com Google" abre uma página de erro do Supabase. O passo a passo para o
usuário está em [`docs/login-google.md`](docs/login-google.md):

- Criar a credencial OAuth no Google Cloud.
- Ativar o Google no Supabase.
- Cadastrar as Redirect URLs.

Não há ferramenta nesta sessão para mexer na configuração de Auth do Supabase. O conector só
acessa o banco.

### 2. Testar em aparelho físico

Nunca foi rodado em celular. O usuário tem Android e iPhone e testa com o Expo Go
(`npx expo start`). Pontos que só o aparelho confirma:

- Abas nativas (`expo-router/unstable-native-tabs`) e ícones (`sf` no iOS, `md` no Android).
- Volta do login para o app:
  - **iOS:** o `openAuthSessionAsync` captura o retorno.
  - **Android:** o deep link pode chegar também ao Expo Router. Por isso existe a rota
    `src/app/auth-callback.tsx`, que só redireciona para Conta.
- Sincronização entre dois aparelhos com a mesma conta.

### 3. Pendências do usuário no GitHub

- [ ] Mudar a branch padrão para `main` (Settings → General → Default branch). Hoje a padrão é
      `claude/plano-enxoval-app`.
- [ ] Apagar a branch antiga `claude/plano-enxoval-app`. O conteúdo dela já está na branch nova.
- [ ] Revisar e fazer merge do PR #1.

### 4. Próximas funcionalidades

- **Compartilhar a lista com parceiro ou família (Fase 3).**
  - Hoje cada item pertence a um usuário (`user_id`).
  - Compartilhar exige tabelas `listas` e `membros_lista` e trocar o RLS para "membro da lista".
  - Decidir com o usuário (`grill-me`) antes de codar.
- **Fase 2 (preços):**
  - Lojas iniciais e forma de obter preço (API de afiliado ou feed).
  - O Mercado Livre já tem conta de afiliado.
  - Os requisitos dos programas foram vistos em blogs e precisam ser confirmados.

### 5. Antes de publicar (Fase 4)

- Nome definitivo, ícone e splash (hoje: "Enxoval" e ícones do template Expo).
- Revisão profissional do catálogo (`src/domain/catalogo.ts`) e da lista de itens com selo
  Inmetro.
- Política de privacidade: o app agora guarda nome, e-mail e a lista na nuvem.

## Estado atual

- **Branch:** `claude/app-enxoval`, com base em `main`.
- **PR:** https://github.com/cdzaorib/aplicativo_teste/pull/1 (draft), com CI em GitHub Actions.
- **Supabase:** projeto `enxoval` (`ggcocihztrpwfptnuqbc`, região `sa-east-1`) na organização
  "relatorio de passagens", plano gratuito.
  - Tabela `itens_lista` criada pela migração em `supabase/migrations/`.
  - Os advisors de segurança e desempenho não acusam nada.
- **Feito:**
  - Fase 0.
  - Fase 1: sugestões, lista, comprado, ordenação, orçamento, itens próprios, login com Google
    (falta a configuração do item 1) e sincronização da lista com a nuvem.
- **Verificação:**
  - `npm run check` passa (lint, typecheck, Prettier, 57 testes).
  - `expo export` gera os bundles de Android, iOS e web.
  - Fluxo web com Playwright, inclusive a persistência após recarregar.
  - RLS testado no banco com dois usuários simulados, numa transação desfeita:
    - cada um lê e grava só os próprios itens;
    - o upsert por `user_id,id` funciona;
    - ninguém apaga linhas.

## Como a sincronização funciona

- **Mesclagem:** `src/domain/sincronizacao.ts` é uma função pura. Para cada item vence a versão
  com `atualizadoEm` mais recente, e em empate vale a nuvem.
  - Remoções são lógicas (`removido = true`). No aparelho ficam em `removidos` até serem
    enviadas.
- **Concorrência:** `src/nuvem/sincronizar-lista.ts` repete a mesclagem se o usuário alterou a
  lista durante a sincronização (`versaoLocal`). Há teste disso.
- **Gatilhos** (`src/nuvem/iniciar.ts`): ao entrar, ao abrir o app com sessão, ao voltar para o
  app e 2 s depois da última alteração.
  - Ele só é ligado depois que a lista do aparelho foi carregada, para não mesclar com uma lista
    vazia.
- **Sair:** salva na nuvem antes e apaga a lista do aparelho. Se não conseguir salvar, não sai.
- **Limites conhecidos:**
  - Usa o relógio de cada aparelho.
  - Busca no máximo 1000 itens, o limite padrão do Supabase.

## Contexto que não está óbvio no código

- **Rede desta sessão:**
  - Bloqueia `docs.expo.dev`, a API do Expo e `ggcocihztrpwfptnuqbc.supabase.co`.
  - Instale pacotes com `EXPO_OFFLINE=1 npx expo install <pacote>` e confira as APIs nos tipos em
    `node_modules`.
  - Teste o banco pelas ferramentas `mcp__Supabase__*`.
- **`.env` versionado:** só contém valores públicos (URL e chave publishable). A proteção dos
  dados é o RLS. Nunca coloque ali o Client secret do Google nem a chave `service_role`.
- **URL global:** o Expo já instala `URL`/`URLSearchParams` no celular, então o projeto não usa
  `react-native-url-polyfill`.
- **Login sem `expo-auth-session`:** a URL de retorno é montada com `Linking.createURL`.
- **TypeScript 6:** `types` começa vazio, por isso o `tsconfig.json` declara
  `["jest", "expo/types"]`.
- **Hidratação da lista:**
  - A flag `carregada` existe porque o `persist` não conclui a hidratação quando a leitura falha.
  - Na pré-renderização web a hidratação é pulada (`skipHydration`).
  - A lista salva está na versão 2, com `migrarListaSalva` para dados da versão 1.
- **Abas na web:** os `TabTrigger` precisam ser filhos diretos do elemento passado ao `TabList`.
- **Preços:** guardados em centavos inteiros.
- **Usuário:** conhece JavaScript e está começando em React Native, com dedicação integral.
  Explique as decisões e evite abstrações desnecessárias.

## Skills sugeridas

- `anthropic-skills:grill-me`: fechar as decisões do compartilhamento de lista e da Fase 2 antes
  de codar.
- `anthropic-skills:vercel-react-native-skills`: boas práticas de React Native e Expo nas telas.
- `run`: subir o app e conferir as mudanças funcionando.
- `code-review` e `security-review`: revisar o diff antes de cada push. O segundo vale
  principalmente quando mexer em RLS e login.
- `anthropic-skills:handoff`: atualizar este arquivo ao final de cada etapa.
