# Plano — App de Enxoval do Bebê

Aplicativo mobile (Android + iOS) que sugere o que comprar para o enxoval, indica o que é
essencial, útil, opcional ou desaconselhado, e mostra onde está o melhor preço.

> Nome provisório ("Enxoval"). Status: Fases 1, 2a e compartilhamento (Fase 3) no código, além do "quando comprar" pela data prevista do parto e da exclusão de conta exigida pelas lojas; falta ativar o Google no Supabase — ver `HANDOFF.md`.

## 1. Problema e público

Quem está grávida (ou o parceiro/família) precisa comprar muita coisa, não sabe o que é
realmente necessário, gasta com itens inúteis e não tem como comparar preço de forma organizada.

**Proposta:** lista de enxoval inteligente = _o que comprar_ + _quando comprar_ + _o que evitar_ +
_onde está mais barato_.

## 2. Decisões técnicas

| Tema           | Decisão                                                  | Por quê                                                                                                         |
| -------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| App            | **React Native + Expo (TypeScript)**                     | Um código só para Android e iOS; builds na nuvem (EAS), sem precisar de Mac; TypeScript é muito pedido em vagas |
| Alternativa    | Flutter                                                  | Também serve; escolher só se você já conhece Dart                                                               |
| Kotlin + Swift | **Não**                                                  | Seriam dois apps separados (dobro do trabalho), e Swift exige Mac. Só faz sentido se o objetivo for vaga nativa |
| Backend        | **Supabase** (Postgres, Auth, Edge Functions, `pg_cron`) | Grátis para começar, resolve login, banco e tarefas agendadas sem servidor próprio                              |
| Notificações   | Expo Notifications                                       | Push Android/iOS com a mesma API                                                                                |
| Estado/dados   | Zustand + AsyncStorage, sincronizado com o Supabase      | Funciona offline; ao entrar com Google a lista vai para a nuvem (última alteração vence)                        |
| Qualidade      | ESLint, Prettier, Jest, GitHub Actions                   | Vira argumento de portfólio                                                                                     |

## 3. Funcionalidades

### 3.1 Catálogo curado (coração do app)

Cada item do catálogo tem:

- categoria (quarto, passeio, higiene, alimentação, roupas, segurança…);
- **prioridade:** `essencial` · `útil` · `opcional` · `evitar`;
- **quando comprar** (trimestre / antes da maternidade / depois do nascimento);
- **por quê** (texto curto) e **fonte** (SBP, Inmetro, Anvisa);
- exige certificação Inmetro? (cadeirinha, berço, carrinho, mamadeira, chupeta, etc. — **confirmar a lista vigente**);
- termos de busca usados para achar o produto nas lojas.

### 3.2 Lista do usuário

- adicionar item do catálogo ou item livre;
- marcar como comprado;
- ordenar por nome, valor, modelo, prioridade ou categoria;
- orçamento total previsto × gasto;
- compartilhar a lista com o parceiro/família (também ajuda a crescer).

### 3.3 Preços

- preço atual por loja + histórico;
- selo **barato / na média / caro** comparando com o histórico do próprio item;
- alerta push quando o preço cair abaixo do valor-alvo;
- botão "comprar" abre o link de afiliado.

## 4. Preços: como obter (ponto de maior risco técnico)

Situação verificada em out/2026:

- **Mercado Livre:**
  - A API exige login de desenvolvedor para tudo.
  - A busca de produtos responde 403 (testado pelo Supabase).
  - O programa de afiliados não tem API: os links são gerados um a um no painel.
- **Shopee:** a _Affiliate Open API_ busca por palavra e devolve preço e link. Exige aprovação, que
  o usuário vai pedir.
- **Amazon:** a PA-API foi desligada em maio de 2026. A _Creators API_ exige 10 vendas em 30 dias.

Por isso a Fase 2 foi dividida:

- **2a (feita):**
  - Botões que abrem a busca do item em cada loja.
  - "Achou um preço? Digite aqui", com a avaliação muito abaixo / abaixo / dentro / acima da
    faixa comum.
  - A faixa vem de uma pesquisa inicial (`src/domain/faixas-preco.ts`) e, quando há 5 pessoas ou
    mais, dos preços informados de forma anônima.
- **2b (estrutura pronta, falta a credencial da Shopee):** opções com preço dentro do app,
  coletadas por um robô (Edge Function + `pg_cron`), e histórico de preço. Para ligar:
  `docs/ofertas-shopee.md`.

## 5. Riscos e como tratar

| Risco                                                          | Tratamento                                                                                                                            |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Conteúdo "o que evitar" vira aconselhamento de saúde/segurança | Só incluir itens com **fonte oficial citada**; texto no tom de guia de compras; aviso legal; revisão de um pediatra antes de publicar |
| LGPD — data prevista do parto é dado de saúde (sensível)       | Guardar a data **só no aparelho** (calcular trimestre localmente) ou pedir consentimento explícito; não enviar ao servidor no MVP     |
| Preço desatualizado ou errado                                  | Mostrar "atualizado há X horas", nunca prometer preço; link leva ao site da loja                                                      |
| Afiliados reprovam a conta                                     | Validar o programa antes; manter plano B (feed de outra rede)                                                                         |
| Ninguém usa                                                    | Validar com 20–30 gestantes reais antes de investir em polimento (grupos, amigos, famílias)                                           |

## 6. Fases

**Fase 0 — Base (1 semana)**
Projeto Expo + TypeScript, lint, testes, CI, navegação, tema.

**Fase 1 — MVP (2–3 semanas)**
Catálogo curado (local, ~60–80 itens), lista, marcar comprado, ordenação, orçamento e
**login com Google** (Supabase Auth). A lista continua funcionando offline.
_Já dá para mostrar em entrevista e testar com usuárias._

**Fase 2 — Preços (3–4 semanas)**
2a, feita: comparar preço digitado com a faixa comum, links de busca nas lojas, preços informados
anônimos. 2b, estrutura pronta (tabelas, robô de coleta e tela); falta a credencial da Shopee
para ligar.

**Fase 3 — Engajamento e receita (2 semanas)**
Feito: compartilhamento da lista por código de convite. A dona decide, por pessoa, quem edita a
lista e quem edita preços. Feito também: avisos locais no começo de cada fase de compras. Falta:
alertas push vindos do servidor (permissão liberada, queda de preço). Links de afiliado ficaram para depois, por
decisão do usuário.

**Fase 4 — Lançamento (1–2 semanas)**
Ícone, telas da loja, política de privacidade, Google Play (taxa única) e Apple Developer (anual), TestFlight/teste fechado.
Já feito: exclusão de conta pelo app. Falta a página na web para pedir a exclusão, que o Google Play exige.

Estimativa total: **~6–8 semanas com dedicação integral** (varia com a curva de aprendizado de React Native).

## 7. Monetização

1. Comissão de afiliados (principal no começo).
2. Premium depois, se houver uso: alertas ilimitados, múltiplas listas, histórico completo.
3. Evitar anúncios: público sensível e dados de gestação.

## 8. Métricas de sucesso

- Ativação: % que cria lista com ≥ 10 itens.
- Retenção: voltam em 7 e 30 dias.
- Receita: cliques em "comprar" → compras (relatório do afiliado).
- Para portfólio: app publicado, README com decisões técnicas, CI verde, demo em vídeo.

## 9. Decisões tomadas (rodada de perguntas, 02/10/2026)

| Tema               | Decisão                                                                                        |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| Tecnologia         | React Native + Expo (TypeScript)                                                               |
| Dedicação          | Integral                                                                                       |
| Experiência        | Conhece JavaScript; está começando em React Native                                             |
| Aparelhos de teste | Android e iPhone (Expo Go); publicar primeiro no Android                                       |
| Escopo da Fase 1   | Catálogo, lista, comprado, ordenação, orçamento **+ login com Google**; preços na Fase 2       |
| Conteúdo           | Rascunho com fonte oficial por item; "evitar" só com fonte; revisão profissional antes da loja |
| Afiliados          | Mercado Livre já cadastrado; demais lojas entram aos poucos                                    |
| Público principal  | Gestante; parceiro e família como convidados (lista compartilhada)                             |

## 10. Pendências

- [x] Confirmar React Native + Expo
- [x] Montar a lista inicial de itens do catálogo e as fontes de cada um (rascunho em `src/domain/catalogo.ts`)
- [ ] Definir o nome do app
- [x] Verificar acesso às APIs das lojas (ver seção 4)
- [ ] Pedir acesso à Shopee Affiliate Open API (usuário)
- [ ] Encontrar um pediatra/enfermeira para revisar o conteúdo do catálogo
