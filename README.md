# Enxoval

Aplicativo mobile (Android e iOS) que ajuda a montar o enxoval do bebê: sugere o que comprar,
indica o que é essencial ou desaconselhado (com fonte oficial) e organiza a lista de compras com
orçamento. Em breve: login com Google e comparação de preços entre lojas.

Feito com React Native + Expo (SDK 57) e TypeScript.

## Como rodar

```bash
npm install
npx expo start
```

Abra o app **Expo Go** no celular (Android ou iPhone) e leia o QR code que aparece no terminal.
O celular e o computador precisam estar na mesma rede Wi-Fi.

Para ver no navegador: `npm run web`.

## Scripts

| Comando             | O que faz                                        |
| ------------------- | ------------------------------------------------ |
| `npm start`         | Inicia o servidor de desenvolvimento             |
| `npm test`          | Roda os testes (Jest)                            |
| `npm run lint`      | Verifica o código com ESLint                     |
| `npm run typecheck` | Verifica os tipos com TypeScript                 |
| `npm run format`    | Formata o código com Prettier                    |
| `npm run check`     | Roda tudo acima, como o CI faz em cada push e PR |

## Estrutura

```
src/
  app/          telas (Expo Router: cada arquivo é uma rota)
    (tabs)/     abas: Minha lista, Sugestões, Conta
    item/       modais de criar e editar item
  components/   componentes visuais reutilizáveis
  domain/       regras de negócio sem React: tipos, catálogo, ordenação, preços
  store/        estado da lista (Zustand, salvo no aparelho)
  hooks/        hooks de tema e layout
  constants/    cores e espaçamentos
```

## Documentos

- [`PLANO.md`](PLANO.md) — produto, decisões, fases e riscos.
- [`HANDOFF.md`](HANDOFF.md) — o que já foi feito e o que falta.
