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

O roteiro para o usuário está em [`docs/teste-no-celular.md`](docs/teste-no-celular.md).

Nunca foi rodado em celular. O usuário tem Android e iPhone e testa com o Expo Go
(`npx expo start`, ou `npx expo start --tunnel` se o celular não estiver na mesma rede). Rode no
computador do usuário: a rede da sessão na nuvem bloqueia o ngrok (`tunnel.us.ngrok.com`), o
`exp.direct` e o túnel do Expo (`boltexpo.dev`), então o túnel não sobe lá.

O endereço de volta do login (`Linking.createURL('auth-callback')`) já foi conferido contra as
Redirect URLs:

| Onde roda               | Endereço gerado                       | Redirect URL que libera    |
| ----------------------- | ------------------------------------- | -------------------------- |
| Expo Go (rede ou túnel) | `exp://<host>/--/auth-callback`       | `exp://**`                 |
| Build do app            | `enxoval://auth-callback`             | `enxoval://**`             |
| Web (`npm run web`)     | `http://localhost:8081/auth-callback` | `http://localhost:8081/**` |

A web em outra porta ou pelo túnel cai na Site URL.

Pontos que só o aparelho confirma:

- Abas nativas (`expo-router/unstable-native-tabs`) e ícones (`sf` no iOS, `md` no Android).
- Volta do login para o app:
  - **iOS:** o `openAuthSessionAsync` captura o retorno.
  - **Android:** o deep link chega também ao Expo Router, na rota `src/app/auth-callback.tsx`.
    Ela também troca o código pela sessão (`concluirLogin`, uma troca só por código), o que cobre
    o caso de o sistema fechar o app enquanto a pessoa está no navegador.
- Sincronização entre dois aparelhos com a mesma conta.
- Compartilhamento entre duas contas: convite, permissões dadas pela dona e "sair da lista".
- "Excluir minha conta" pelo app. A função já foi testada de ponta a ponta no Supabase, mas não
  a partir do app.

### 3. Limpeza no Supabase — ação do usuário

O conector do Supabase estoura o tempo em comandos destrutivos (`drop`, `delete`), que esperam uma
confirmação que não chega. Rodar no SQL Editor do painel:

```sql
drop extension http;        -- usada só em testes (API do Mercado Livre e Edge Function)
drop table public.itens_lista; -- substituída por `itens` (listas compartilhadas); está vazia
```

Nenhuma das duas está em uso nem exposta.

### 4. Pendências do usuário no GitHub

- [ ] Mudar a branch padrão para `main` (Settings → General → Default branch). Hoje a padrão é
      `claude/plano-enxoval-app`.
- [ ] Apagar a branch antiga `claude/plano-enxoval-app`. O conteúdo dela já está na `main`.

### 5. Próximas funcionalidades

- **Fase 2b: opções com preço dentro do app.** Depende da aprovação da Shopee Affiliate Open
  API, que o usuário vai pedir.
  - Quando sair, criar uma tabela `ofertas` e uma Edge Function agendada (`pg_cron` + `pg_net`)
    que busca pelo campo `busca` de cada item.
  - As credenciais da Shopee vão em segredos da Edge Function, nunca no app.
  - O usuário decidiu não usar links de afiliado por enquanto.
- **Fase 3 restante:**
  - Alertas push, por exemplo quando a dona libera uma permissão ou um preço cai. Os de preço
    dependem da Fase 2b.
  - No Android, o Expo Go não recebe push desde o SDK 53. Testar exige um development build
    (`eas build --profile development`), além de conta no Expo e credenciais do Firebase (FCM).
- **Revisar os começos de cada fase** (`INICIO_COMPRA`) com quem for revisar o catálogo. A
  semana 32 para a mala da maternidade foi uma escolha de produto, não uma recomendação médica.
- **Revisar as faixas pesquisadas.** As faixas de `src/domain/faixas-preco.ts` vieram de resumos
  de busca (out/2026), porque o WebFetch está bloqueado nesta sessão.
  - Todos os 62 itens que não são "evitar" têm faixa; um teste garante isso para itens novos.
  - Ficaram de fora os preços de marcas importadas ou artesanais muito acima do comum.
  - Vale conferir de tempos em tempos e, quando houver uso, comparar com os preços informados.

### 6. Antes de publicar (Fase 4)

- Nome definitivo, ícone e splash (hoje: "Enxoval" e ícones do template Expo).
- Revisão profissional do catálogo (`src/domain/catalogo.ts`) e da lista de itens com selo
  Inmetro.
- **Política de privacidade e exclusão de conta:** já existem como telas do app
  (`src/app/privacidade.tsx` e `src/app/excluir-conta.tsx`), com links na aba Conta. Na versão
  web viram as páginas `/privacidade` e `/excluir-conta`, que são os endereços que as lojas
  pedem. Falta:
  - definir o **e-mail de contato** em `src/constants/app.ts` (sem ele, as páginas mostram "e-mail
    de contato a definir");
  - colocar a versão web no ar, por exemplo na Vercel, para ter os endereços públicos;
  - uma revisão jurídica do texto.
- **Exclusão de conta pelo app:** aba Conta → "Excluir minha conta", o que a Apple exige. Apaga
  também a lista e a data prevista do parto guardadas no aparelho.

## Estado atual

- **Branch:** `claude/app-enxoval`, recomeçada a partir da `main` depois do merge do PR #1.
- **PR:** #1 (Fases 0 a 2a) já está na `main`. O #2 traz:
  - a Fase 3 (compartilhamento) e o limite de tentativas de convite;
  - o "quando comprar" e as faixas de preço completas;
  - a exclusão de conta, a política de privacidade e a correção da volta do login no Android.
- **Supabase:** projeto `enxoval` (`ggcocihztrpwfptnuqbc`, região `sa-east-1`) na organização
  "relatorio de passagens", plano gratuito.
  - Tabelas `listas`, `membros_lista`, `itens` e `precos_informados`, além das funções
    (RPC), criadas pelas migrações em `supabase/migrations/`.
  - `privado.tentativas_convite` conta as tentativas de código de convite.
  - Edge Function `excluir-conta` (`supabase/functions/`), publicada com `verify_jwt = false`. Ela
    mesma confere o token no Supabase Auth.
  - `itens_lista` não é mais usada (ver item 3).
  - O advisor de segurança aponta as funções SECURITY DEFINER chamáveis pela API. É intencional:
    - `referencia_precos` devolve só agregados de 5 pessoas ou mais;
    - as operações de lista conferem dentro delas quem é dona ou membro.
  - O advisor também avisa que `privado.tentativas_convite` tem RLS sem política. É intencional:
    só a função `entrar_na_lista` mexe nela, e o esquema `privado` não é publicado.
- **Feito:**
  - Fase 0.
  - Fase 1: sugestões, lista, comprado, ordenação, orçamento, itens próprios, login com Google
    (falta a configuração do item 1) e sincronização da lista com a nuvem.
  - Fase 2a:
    - Tela "Comparar preço" (`src/app/preco/[catalogoId].tsx`), com a faixa comum, a busca do
      item nas 4 lojas e o "achou um preço? digite aqui".
    - O preço digitado é avaliado e compartilhado de forma anônima se a pessoa estiver logada.
    - A faixa aparece no card de sugestões, e a avaliação aparece na edição do item.
  - Fase 3, compartilhamento da lista:
    - A dona convida por código (aba Conta → "Enviar convite").
    - Para cada convidado, ela liga "pode editar a lista" e/ou "pode editar preços". Sem
      nenhuma das duas, o convidado só visualiza.
    - Ao entrar, a lista do convidado é juntada à compartilhada.
    - O convidado pode sair, e a dona pode removê-lo. Nos dois casos ele volta para a própria
      lista.
    - Código de convite: no máximo 10 tentativas por pessoa por hora.
  - Excluir conta (aba Conta): apaga a conta e os dados dela. Os convidados da dona voltam para
    as próprias listas.
  - Quando comprar:
    - A pessoa informa a data prevista do parto no topo da lista. Ela fica só no aparelho
      (`src/store/gestacao.ts`), nunca na nuvem, porque é dado de saúde (LGPD).
    - O cartão mostra as semanas, o trimestre e quantos itens já é hora de comprar.
    - O selo "Hora de comprar" aparece na lista e nas sugestões.
    - A lista pode ser ordenada por "Quando comprar".
    - As contas ficam em `src/domain/gestacao.ts`, com `INICIO_COMPRA`: 2º trimestre a partir
      da semana 14, 3º a partir da 28, maternidade a partir da 32 e "depois" a partir da data
      prevista.
- **Verificação:**
  - `npm run check` passa (lint, typecheck, Prettier, 116 testes do app, inclusive de componentes
    com a Testing Library, e 14 testes do banco).
  - "Quando comprar" conferido na web com Playwright, nos temas claro e escuro: cartão, selos,
    ordenação e a data mantida depois de recarregar.
  - `npm run test:banco` (também no CI) aplica todas as migrações num Postgres local (PGlite) e
    testa compartilhamento, permissões, exclusão de conta e limite de convites. Sem as migrações
    novas, os testes delas falham.
  - Exclusão de conta testada de ponta a ponta no Supabase real:
    - duas contas de teste (dona e convidado) entraram com senha e chamaram a função;
    - a lista e os itens da dona sumiram, e o convidado voltou para a própria lista;
    - as duas contas foram excluídas pela própria função, e o banco ficou vazio de novo.
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
  - Listas compartilhadas testadas no banco com gestante, parceiro, avó e um estranho (22
    verificações), em transação desfeita:
    - convite com código digitado em minúsculas e com hífen;
    - junção sem repetir itens do catálogo;
    - sem permissão não edita nada; só com preço muda o preço, mas não nome nem "comprado";
    - estranho não vê nada;
    - sair, remover e trocar o código;
    - sem login nada funciona.

## Como o compartilhamento funciona

- **Modelo:** cada pessoa tem sempre a própria lista (`listas.dona_id`) e aponta para uma lista
  ativa em `membros_lista`, que tem uma linha por pessoa.
  - Entrar numa lista compartilhada só troca esse ponteiro.
  - Sair, ou ser removido, volta o ponteiro para a própria lista. Nada é apagado, o que também
    evita os comandos destrutivos que travam no conector.
- **Permissões:**
  - RLS por lista, com funções auxiliares no esquema `privado`, que a API não publica.
  - O gatilho `conferir_edicao_item` impede quem só edita preço de mudar outra coisa.
  - A dona tem tudo. "Editar a lista" inclui editar preços.
- **No app:**
  - `garantir_lista` roda a cada sincronização e devolve a lista atual e as permissões, que ficam
    em `useSessaoStore().lista`.
  - `mesclarListas` recebe a permissão: com `leitura` a nuvem manda; com `precos` só a mudança de
    preço do aparelho é enviada, e por `update`, nunca `upsert`.
  - As telas usam `usePermissao()` para esconder ou travar o que não pode.
- **Entrar:** sincroniza, chama `entrar_na_lista`, que junta os itens no servidor, limpa a lista
  do aparelho e sincroniza de novo.
- **Outro aparelho:** a lista do aparelho guarda `listaId`. Se a pessoa virou convidada numa lista
  por outro celular, os itens locais, que são de outra lista, são descartados antes de
  sincronizar (`itensSaoDeOutraLista`). Voltando para a própria lista, eles ficam como cópia.

## Como a exclusão de conta funciona

- **App** (`excluirConta`, em `src/nuvem/auth.ts`): chama a Edge Function `excluir-conta`,
  esquece a sessão no aparelho (`signOut({ scope: 'local' })`) e apaga a lista do aparelho.
- **Edge Function:** confere o token com `auth.getUser` e apaga o usuário com
  `auth.admin.deleteUser`. Usa a chave secreta nova (`SUPABASE_SECRET_KEYS`) ou, sem ela, a
  `service_role`.
- **Banco:** tudo que é do usuário tem `on delete cascade` para `auth.users`. O gatilho
  `devolver_convidados` (antes de apagar uma lista) leva os convidados de volta às próprias
  listas, como se a dona os tivesse removido.

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
- **Unidade do preço:** cada item do catálogo diz como o preço é contado (`precoPor`: par, pacote,
  frasco, caixa, kit ou conjunto; sem valor, por unidade). A faixa, o campo "Preço encontrado por
  ..." e o "Preço por ..." da edição mostram essa unidade (`unidadeDePreco`).
  - Protetor de tomada e trava de gaveta passaram a ser 1 kit, porque são vendidos assim.
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
- **Sair da conta:** salva na nuvem antes e apaga a lista do aparelho. Se não conseguir salvar,
  não sai.
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
  - Teste o banco pelas ferramentas `mcp__Supabase__*`, em transação desfeita. Comandos com
    `delete` ou `drop` travam no conector; para esses cenários, use `npm run test:banco`.
  - Enquanto a extensão `http` existir, dá para chamar a API e as Edge Functions de dentro do
    banco (`extensions.http`). Foi assim que a exclusão de conta foi testada.
- **`.env` versionado:** só contém valores públicos (URL e chave publishable). A proteção dos
  dados é o RLS. Nunca coloque ali o Client secret do Google nem a chave `service_role`.
- **URL global:** o Expo já instala `URL`/`URLSearchParams` no celular, então o projeto não usa
  `react-native-url-polyfill`.
- **Login sem `expo-auth-session`:** a URL de retorno é montada com `Linking.createURL`.
- **Edge Functions:** rodam no Deno, por isso `supabase/functions` fica fora do `tsconfig.json` e
  do ESLint. Publique com a ferramenta `deploy_edge_function` do conector.
- **Testes do banco:** `supabase/testes/supabase-local.sql` recria o mínimo do Supabase (papéis,
  `auth.users`, `auth.uid()`, `pgcrypto`). Toda migração nova roda neles automaticamente.
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

- `anthropic-skills:grill-me`: fechar decisões de produto antes de codar (Fase 2b, alertas).
- `anthropic-skills:vercel-react-native-skills`: boas práticas de React Native e Expo nas telas.
- `run`: subir o app e conferir as mudanças funcionando.
- `code-review` e `security-review`: revisar o diff antes de cada push. O segundo vale
  principalmente quando mexer em RLS e login.
- `anthropic-skills:handoff`: atualizar este arquivo ao final de cada etapa.
