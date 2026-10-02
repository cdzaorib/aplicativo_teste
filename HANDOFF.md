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
- Compartilhamento entre duas contas: convite, permissões dadas pela dona e "sair da lista".

### 3. Limpeza no Supabase — ação do usuário

O conector do Supabase estoura o tempo em comandos destrutivos (`drop`, `delete`), que esperam uma
confirmação que não chega. Rodar no SQL Editor do painel:

```sql
drop extension http;        -- ligada só para testar a API do Mercado Livre
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
- **Limite de tentativas de código de convite.** Hoje não há limite. O código tem 8 caracteres
  de 32 opções, cerca de 10¹² combinações.
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

- **Branch:** `claude/app-enxoval`, recomeçada a partir da `main` depois do merge do PR #1.
- **PR:** #1 (Fases 0 a 2a) já está na `main`. A Fase 3 vai num PR novo (ver o link na conversa).
- **Supabase:** projeto `enxoval` (`ggcocihztrpwfptnuqbc`, região `sa-east-1`) na organização
  "relatorio de passagens", plano gratuito.
  - Tabelas `listas`, `membros_lista`, `itens` e `precos_informados`, além das funções
    (RPC), criadas pelas migrações em `supabase/migrations/`.
  - `itens_lista` não é mais usada (ver item 3).
  - O advisor de segurança aponta as funções SECURITY DEFINER chamáveis pela API. É intencional:
    - `referencia_precos` devolve só agregados de 5 pessoas ou mais;
    - as operações de lista conferem dentro delas quem é dona ou membro.
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
- **Verificação:**
  - `npm run check` passa (lint, typecheck, Prettier, 90 testes, inclusive de componentes com a
    Testing Library).
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

- `anthropic-skills:grill-me`: fechar decisões de produto antes de codar (Fase 2b, alertas).
- `anthropic-skills:vercel-react-native-skills`: boas práticas de React Native e Expo nas telas.
- `run`: subir o app e conferir as mudanças funcionando.
- `code-review` e `security-review`: revisar o diff antes de cada push. O segundo vale
  principalmente quando mexer em RLS e login.
- `anthropic-skills:handoff`: atualizar este arquivo ao final de cada etapa.
