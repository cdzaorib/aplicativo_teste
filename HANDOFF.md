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

### 3. Remover a extensão `http` do Supabase — ação do usuário

Ela foi ligada só para testar a API do Mercado Livre a partir do servidor. O `drop extension`
pelo conector estoura o tempo, provavelmente porque comandos destrutivos esperam uma confirmação.

- Não está exposta na API do app (o esquema `extensions` não é publicado), e os advisors não a
  apontam.
- Remover no SQL Editor do painel com `drop extension http;`.

### 4. Pendências do usuário no GitHub

- [ ] Mudar a branch padrão para `main` (Settings → General → Default branch). Hoje a padrão é
      `claude/plano-enxoval-app`.
- [ ] Apagar a branch antiga `claude/plano-enxoval-app`. O conteúdo dela já está na branch nova.
- [ ] Revisar e fazer merge do PR #1.

### 5. Próximas funcionalidades

- **Fase 2b: opções com preço dentro do app.** Depende da aprovação da Shopee Affiliate Open
  API, que o usuário vai pedir.
  - Quando sair, criar uma tabela `ofertas` e uma Edge Function agendada (`pg_cron` + `pg_net`)
    que busca pelo campo `busca` de cada item.
  - As credenciais da Shopee vão em segredos da Edge Function, nunca no app.
  - O usuário decidiu não usar links de afiliado por enquanto.
- **Compartilhar a lista com parceiro ou família (Fase 3).**
  - Exige tabelas `listas` e `membros_lista` e trocar o RLS de `itens_lista` para "membro da
    lista".
  - Decidir com o usuário (`grill-me`) antes de codar.
- **Revisar as faixas pesquisadas.** As faixas de `src/domain/faixas-preco.ts` vieram de resumos
  de busca (out/2026), porque o WebFetch está bloqueado nesta sessão. 19 itens têm faixa, e os
  outros ficam sem faixa até haver preços informados.

### 6. Antes de publicar (Fase 4)

- Nome definitivo, ícone e splash (hoje: "Enxoval" e ícones do template Expo).
- Revisão profissional do catálogo (`src/domain/catalogo.ts`) e da lista de itens com selo
  Inmetro.
- Política de privacidade: o app guarda nome, e-mail e a lista na nuvem, além dos preços
  informados. Esses ficam ligados ao usuário só para limite e exclusão, nunca expostos.

## Estado atual

- **Branch:** `claude/app-enxoval`, com base em `main`.
- **PR:** https://github.com/cdzaorib/aplicativo_teste/pull/1 (draft), com CI em GitHub Actions.
- **Supabase:** projeto `enxoval` (`ggcocihztrpwfptnuqbc`, região `sa-east-1`) na organização
  "relatorio de passagens", plano gratuito.
  - Tabelas `itens_lista` e `precos_informados` e a função `referencia_precos`, criadas pelas
    migrações em `supabase/migrations/`.
  - O advisor de segurança aponta só o `referencia_precos` (SECURITY DEFINER executável sem
    login). É intencional: a função devolve apenas agregados de 5 pessoas ou mais.
- **Feito:**
  - Fase 0.
  - Fase 1: sugestões, lista, comprado, ordenação, orçamento, itens próprios, login com Google
    (falta a configuração do item 1) e sincronização da lista com a nuvem.
  - Fase 2a:
    - Tela "Comparar preço" (`src/app/preco/[catalogoId].tsx`), com a faixa comum, a busca do
      item nas 4 lojas e o "achou um preço? digite aqui".
    - O preço digitado é avaliado e compartilhado de forma anônima se a pessoa estiver logada.
    - A faixa aparece no card de sugestões, e a avaliação aparece na edição do item.
- **Verificação:**
  - `npm run check` passa (lint, typecheck, Prettier, 73 testes).
  - `expo export` gera os bundles de Android, iOS e web.
  - Fluxo web com Playwright, inclusive a persistência após recarregar.
  - RLS testado no banco com dois usuários simulados, numa transação desfeita:
    - cada um lê e grava só os próprios itens;
    - o upsert por `user_id,id` funciona;
    - ninguém apaga linhas.
  - Preços informados testados no banco com seis usuários simulados:
    - o upsert do mesmo dia funciona;
    - ninguém lê preços de outros;
    - sem login dá para ler a referência, mas não informar preço;
    - a referência só aparece com 5 pessoas e resiste a um valor distorcido.

## Como a avaliação de preço funciona

- **Avaliação** (`src/domain/precos.ts`), em relação à faixa comum [mín, máx]:
  - abaixo de 60% do mínimo: "muito abaixo, desconfie" (golpe, usado ou sem Inmetro);
  - abaixo do mínimo: "abaixo";
  - até o máximo: "dentro";
  - acima disso: "acima".
- **Faixa:**
  - Com 5 pessoas ou mais informando, vale a faixa central (25% a 75%) do preço mais recente de
    cada pessoa nos últimos 180 dias (`referencia_precos`).
  - Antes disso, vale a faixa pesquisada.
- **Envio:** um preço por item, por pessoa, por dia. Informar de novo substitui o anterior.
- **Cache:** as referências ficam no aparelho (`src/store/referencias.ts`) e são atualizadas no
  máximo de hora em hora.

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
  - Bloqueia `docs.expo.dev`, a API do Expo, `ggcocihztrpwfptnuqbc.supabase.co` e quase todos os
    sites no WebFetch. O WebSearch funciona.
  - Para testar APIs externas, foi usada a extensão `http` no banco (ver item 3 de "O que
    falta").
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
