# Plano — App de Enxoval do Bebê

Aplicativo mobile (Android + iOS) que sugere o que comprar para o enxoval, indica o que é
essencial, útil, opcional ou desaconselhado, e mostra onde está o melhor preço.

> Nome provisório ("Enxoval"). Status: Fases 0 e 1 em andamento — ver `HANDOFF.md`.

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
| Estado/dados   | Zustand + AsyncStorage (lista salva no aparelho)         | Simples e funciona offline; a sincronização com o Supabase entra junto com o login                              |
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

Ordem de preferência:

1. **APIs oficiais / feeds de afiliados** (Mercado Livre, Amazon PA-API, redes como Awin/Lomadee, Magalu Parceiro, Shopee Afiliados).
2. Scraping — só como último recurso, com poucas lojas, com limite de requisições e **depois de ler os termos de uso** de cada site. Quebra com frequência e pode ser proibido.

> Antes de codar a Fase 2: confirmar os termos atuais e requisitos de cada programa de afiliados
> (alguns exigem vendas mínimas ou conta aprovada). Isso muda quais lojas entram no MVP.

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
Supabase, tabelas de produtos/lojas/preços, coletor agendado (2–3 lojas), histórico, selo barato/caro.

**Fase 3 — Engajamento e receita (2 semanas)**
Alertas push, links de afiliado e compartilhamento da lista.

**Fase 4 — Lançamento (1–2 semanas)**
Ícone, telas da loja, política de privacidade, Google Play (taxa única) e Apple Developer (anual), TestFlight/teste fechado.

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
- [ ] Definir as 2–3 lojas iniciais e verificar acesso a API/afiliados
- [ ] Encontrar um pediatra/enfermeira para revisar o conteúdo do catálogo
