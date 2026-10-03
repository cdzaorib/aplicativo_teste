# Publicar nas lojas

Um guia do que falta para colocar o app na Google Play e na App Store. Os builds são feitos na
nuvem do Expo (EAS), sem precisar de Android Studio nem de Mac. A configuração já está em
`eas.json`:

- `preview`: APK para instalar direto no Android e testar;
- `production`: versão para as lojas.

As regras das lojas mudam; confira cada item no console da loja na hora de publicar.

## 1. Decisões que são suas

- [ ] **Nome do app.** Hoje é "Enxoval", provisório (`app.json` e `src/constants/app.ts`).
- [ ] **Identificador do app.** É um nome único, que não muda depois de publicar, por exemplo
      `br.com.seudominio.enxoval`. Vai em `app.json`:

      ```json
      "ios": { "bundleIdentifier": "br.com.seudominio.enxoval" },
      "android": { "package": "br.com.seudominio.enxoval" }
      ```

- [ ] **E-mail de contato** para a política de privacidade e os pedidos de exclusão
      (`src/constants/app.ts`).
- [ ] **Ícone e tela de abertura.** Hoje são os do modelo do Expo (`assets/images`).

## 2. Contas

- **Expo:** grátis. Crie em expo.dev.
- **Google Play Console:** taxa única de US$ 25. Contas pessoais novas precisam de um **teste
  fechado com pelo menos 12 pessoas por 14 dias** antes de publicar.
- **Apple Developer Program:** US$ 99 por ano.

## 3. Gerar os builds

No computador, na pasta do projeto:

```bash
npx eas-cli@latest login
npx eas-cli@latest init          # liga o projeto à sua conta Expo (uma vez)
npx eas-cli@latest build --profile preview --platform android   # APK para testar
npx eas-cli@latest build --profile production --platform all    # versões para as lojas
npx eas-cli@latest submit --platform android                    # envia para a Google Play
npx eas-cli@latest submit --platform ios                        # envia para a App Store
```

No build do app instalado, a volta do login usa `enxoval://auth-callback`, que já está nas
Redirect URLs do Supabase (`docs/login-google.md`).

## 4. Versão web no ar (privacidade, exclusão e lista de presentes)

A versão web do app serve para três coisas: as duas páginas que as lojas pedem e a lista de
presentes do chá de bebê, que os convidados abrem pelo link sem instalar nada.

O `vercel.json` já está pronto: ele monta a versão web e faz os endereços com código (como
`/presente/K7P2…`) abrirem a página certa. Na Vercel, importe o repositório do GitHub (ou rode
`npx vercel` na pasta do projeto) e publique.

Depois de publicar:

1. Coloque o endereço em `ENDERECO_WEB`, em `src/constants/app.ts` (por exemplo,
   `'https://enxoval.vercel.app'`). Sem ele, o app no celular não tem link de presentes para
   enviar.
2. No Supabase, em **Authentication → URL Configuration → Redirect URLs**, adicione
   `https://SEU-ENDERECO/**`, para o login funcionar também na versão web publicada.

Os endereços ficam assim:

- política de privacidade: `https://SEU-ENDERECO/privacidade`;
- exclusão de conta (Google Play): `https://SEU-ENDERECO/excluir-conta`;
- lista de presentes: `https://SEU-ENDERECO/presente/CÓDIGO` (o app monta e envia).

## 5. Formulários de privacidade (rascunho)

Com base no que o app faz hoje. Revise antes de enviar.

**Google Play, "Segurança dos dados":**

- **Dados coletados:**
  - **Informações pessoais:** nome e e-mail, para a conta (funcionalidade do app);
  - **Conteúdo gerado pelo usuário:** a lista do enxoval, os preços informados e, na lista de
    presentes, o nome que cada convidado digita (funcionalidade do app).
- **Dados compartilhados com terceiros:** nenhum. Supabase e Google atuam como prestadores de
  serviço, o que não conta como compartilhamento.
- **Data prevista do parto:** não é coletada; fica só no aparelho.
- **Criptografia em trânsito:** sim.
- **A pessoa pode pedir a exclusão:** sim, pelo app e pela página `/excluir-conta`.

**App Store, "Privacidade do app":**

- **Informações de contato** (nome, e-mail): ligadas à pessoa, para funcionalidade do app.
- **Conteúdo do usuário** (lista, preços): ligado à pessoa, para funcionalidade do app.
- **Identificadores** (ID do usuário): ligados à pessoa, para funcionalidade do app.
- **Rastreamento:** não.

## 6. "Entrar com a Apple"

A regra 4.8 da App Store pede que apps com login de terceiros, como o Google, ofereçam também uma
opção de login com foco em privacidade, como **Entrar com a Apple**. O código já está pronto e
desligado. Para ativar, siga [`login-apple.md`](login-apple.md) antes de enviar para a App Store.

## 7. Antes de enviar

- [ ] Revisão do catálogo por um profissional de saúde (pediatra ou enfermeira).
- [ ] Revisão jurídica da política de privacidade.
- [ ] Teste completo em aparelho ([`teste-no-celular.md`](teste-no-celular.md)).
- [ ] Screenshots das telas para a página da loja: lista, sugestões, comparar preço e lista
      compartilhada.
