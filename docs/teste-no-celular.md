# Roteiro de teste no celular

Um passo a passo para testar o app no Android e no iPhone com o **Expo Go**. Marque cada item
que funcionou. Quando algo der errado, tire um print e anote o passo. Copie a mensagem de erro,
se aparecer.

## 0. Preparar (uma vez)

1. Instale o **Expo Go** no celular (Play Store ou App Store), na versão mais recente.
2. No computador, pegue a versão mais nova do código. Enquanto o PR #2 não estiver na `main`, ela
   fica na branch `claude/app-enxoval`:

   ```bash
   git fetch origin
   git checkout claude/app-enxoval
   git pull
   npm install
   ```

3. Inicie o app:

   ```bash
   npx expo start
   ```

   - Computador e celular precisam estar **na mesma rede Wi-Fi**. Se não estiverem, ou se o
     celular não conectar, use `npx expo start --tunnel`.
   - **Android:** abra o Expo Go e use "Scan QR code".
   - **iPhone:** aponte a câmera para o QR code e toque no aviso do Expo Go.

## 1. Sem login

- [ ] O app abre na aba **Minha lista**, vazia, com o cartão "Quando comprar".
- [ ] **Sugestões:** os itens aparecem por categoria, com prioridade e fonte. "Adicionar N itens
      essenciais" coloca os essenciais na lista.
- [ ] Filtros **Essencial / Útil / Opcional / Evitar** funcionam. Os itens "Evitar" mostram a
      fonte e não têm botão de adicionar.
- [ ] **Minha lista:**
  - [ ] marcar e desmarcar "comprado";
  - [ ] a barra de progresso e o total mudam;
  - [ ] as ordenações funcionam, inclusive "Quando comprar".
- [ ] Tocar num item abre a edição.
  - [ ] Mudar modelo, preço ("Preço por …") e quantidade e salvar.
  - [ ] O total "Previsto" muda.
- [ ] **Item próprio:** "Adicionar item próprio" cria um item fora do catálogo.
- [ ] **Remover** um item, na tela de edição, pede confirmação.
- [ ] **Enviar a lista por mensagem**, no fim da lista, abre o compartilhamento com a lista em
      texto ("Falta comprar", "Já comprado" e os totais). Mande para você mesmo no WhatsApp e
      confira.
- [ ] **Comparar preço:** num item das sugestões, toque em "Comparar preços".
  - [ ] Aparece a faixa comum, com a unidade ("por par", "por pacote"…).
  - [ ] Os botões das lojas abrem a busca.
  - [ ] Digitar um preço e tocar em "Avaliar preço" mostra se está barato, na média ou caro.
- [ ] **Quando comprar:** informe uma data prevista do parto (por exemplo, daqui a 3 meses).
  - [ ] O cartão mostra as semanas e o trimestre.
  - [ ] Os itens da fase ganham o selo "Hora de comprar".
  - [ ] "Alterar" e "Apagar data" funcionam.
- [ ] Feche o app de vez e abra de novo: a lista e a data continuam lá.

## 2. Login com Google

Antes, ative o Google no Supabase seguindo [`login-google.md`](login-google.md). O seu e-mail
precisa estar em **Test users**.

- [ ] **Conta → Entrar com Google** abre o navegador.
  - [ ] Depois de escolher a conta, volta para o app.
  - [ ] Mostra seu nome e "Lista salva na nuvem às …".
- [ ] A lista que você montou sem login continua lá. No painel do Supabase, em **Table Editor →
      itens**, os itens aparecem.
- [ ] Mude algo na lista. Em poucos segundos, o horário de "Lista salva na nuvem" muda.
- [ ] **Dois aparelhos com a mesma conta:** entre no outro celular e confira se a lista aparece
      igual. Mude algo num e toque em "Sincronizar agora" no outro.
- [ ] **Sair:** a lista some do aparelho. Entrar de novo traz a lista de volta.

## 3. Lista compartilhada (precisa de duas contas Google)

Chamaremos de **A** a conta da gestante e de **B** a do parceiro ou familiar. As duas precisam
estar em **Test users** no Google.

- [ ] **A**, na aba **Conta**, vê o código de convite. "Enviar convite" abre o compartilhamento.
- [ ] **B**, na aba **Conta**, digita o código, com ou sem hífen, e toca em "Entrar na lista".
  - [ ] A lista de **B** passa a ser a de **A**, com os itens de **B** juntados, sem repetir
        itens do catálogo.
  - [ ] Na aba **Minha lista** de **B** aparece "Lista compartilhada de A".
- [ ] Sem permissão, **B** só vê:
  - [ ] não consegue marcar "comprado";
  - [ ] não vê "Adicionar";
  - [ ] na edição, os campos ficam travados.
- [ ] **A** liga "Pode editar preços" para **B**.
  - [ ] Depois de sincronizar, **B** consegue mudar só o preço.
  - [ ] A mudança aparece para **A**.
- [ ] **A** liga "Pode editar a lista" para **B**: **B** passa a editar tudo.
- [ ] **B** toca em "Sair da lista compartilhada" e volta para a própria lista, com uma cópia dos
      itens.
- [ ] **B** entra de novo e **A** usa "Remover": **B** volta para a própria lista.
- [ ] **Código errado** mostra "Código de convite inválido". Depois de 10 tentativas erradas na
      mesma hora, aparece "Muitas tentativas".

## 4. Excluir conta (use uma conta de teste)

- [ ] **Conta → Excluir minha conta** pede confirmação.
  - [ ] Depois de excluir, o app volta para a tela de entrar, com a lista vazia.
- [ ] Se a conta excluída era dona de uma lista compartilhada, quem estava nela volta para a
      própria lista depois de sincronizar.
- [ ] No painel do Supabase, em **Authentication → Users**, a conta sumiu.

## O que me mandar

Para cada item que falhou, mande:

- o número do passo;
- Android ou iPhone;
- o que você esperava e o que aconteceu;
- o print, se tiver.

O terminal onde roda o `npx expo start` também mostra erros em vermelho; copie-os se aparecerem.
