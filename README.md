# Enxoval

Aplicativo mobile (Android e iOS) que ajuda a montar o enxoval do bebê: sugere o que comprar,
indica o que é essencial ou desaconselhado (com fonte oficial) e organiza a lista de compras com
orçamento. Com a data prevista do parto (guardada só no aparelho), mostra o que já é hora de
comprar em cada fase da gestação. Para cada item, abre a busca nas lojas e diz se um preço encontrado está caro, na
média ou barato demais para ser verdade. Com login pelo Google, a lista fica salva na nuvem e
sincroniza entre aparelhos e pode ser compartilhada com parceiro e família, com permissões
definidas pela gestante. A conta pode ser excluída pelo próprio app, com todos os dados dela.

Feito com React Native + Expo (SDK 57), TypeScript e Supabase (login e banco de dados).

## Como rodar

```bash
npm install
npx expo start
```

Abra o app **Expo Go** no celular (Android ou iPhone) e leia o QR code que aparece no terminal.
O celular e o computador precisam estar na mesma rede Wi-Fi.

Para ver no navegador: `npm run web`.

O `.env` já traz o endereço e a chave pública do Supabase. Para o login funcionar, o Google
precisa estar ativado no projeto: veja [`docs/login-google.md`](docs/login-google.md).

## Scripts

| Comando              | O que faz                                                                  |
| -------------------- | -------------------------------------------------------------------------- |
| `npm start`          | Inicia o servidor de desenvolvimento                                       |
| `npm test`           | Roda os testes do app (Jest)                                               |
| `npm run test:banco` | Aplica as migrações num Postgres local (PGlite) e testa as regras do banco |
| `npm run lint`       | Verifica o código com ESLint                                               |
| `npm run typecheck`  | Verifica os tipos com TypeScript                                           |
| `npm run format`     | Formata o código com Prettier                                              |
| `npm run check`      | Roda tudo acima, como o CI faz em cada push e PR                           |

## Estrutura

```
src/
  app/          telas (Expo Router: cada arquivo é uma rota)
    (tabs)/     abas: Minha lista, Sugestões, Conta
    item/       modais de criar e editar item
    preco/      modal de comparar preço
  components/   componentes visuais reutilizáveis
  domain/       regras de negócio sem React: catálogo, faixas de preço, avaliação, mesclagem
  nuvem/        Supabase: cliente, login, sincronização, compartilhamento e preços informados
  store/        estado da lista, da sessão e das referências de preço (Zustand)
  hooks/        hooks de tema e layout
  constants/    cores e espaçamentos
supabase/
  migrations/   estrutura do banco (listas, membros, itens, preços e regras de acesso)
  functions/    Edge Functions (Deno): excluir-conta
  testes/       testes do banco com PGlite (npm run test:banco)
```

## Documentos

- [`PLANO.md`](PLANO.md) — produto, decisões, fases e riscos.
- [`HANDOFF.md`](HANDOFF.md) — o que já foi feito e o que falta.
- [`docs/login-google.md`](docs/login-google.md) — como ativar o login com Google.
- [`docs/teste-no-celular.md`](docs/teste-no-celular.md) — roteiro de teste no Android e no iPhone.
