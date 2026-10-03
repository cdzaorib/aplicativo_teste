# Ativar o "Entrar com a Apple"

O código está pronto, mas desligado (`LOGIN_APPLE_ATIVO = false` em `src/constants/app.ts`).
Ligue antes de publicar no iPhone: a regra 4.8 da App Store pede uma opção de login com foco em
privacidade quando o app tem login com Google.

O app usa o login nativo do iPhone (`expo-apple-authentication`) e entra no Supabase com o token
da Apple (`entrarComApple`, em `src/nuvem/auth.ts`). O botão só aparece no iPhone. No Android e na
web, o login continua só com Google.

## 1. Supabase: ligar a Apple

No painel do Supabase, projeto **enxoval** → **Authentication → Sign In / Providers → Apple**:

1. Ative o provedor.
2. Em **Client IDs**, coloque, separados por vírgula:
   - `host.exp.Exponent`, para testar no Expo Go;
   - o identificador do app (ex.: `br.com.seudominio.enxoval`), para o app instalado. Veja a
     decisão do identificador em [`publicar.md`](publicar.md).
3. Salve. O login nativo não precisa da chave secreta (Secret Key); ela só é usada no login pela
   web.

## 2. Apple Developer (para o app instalado)

Com a conta do Apple Developer Program, o identificador do app precisa da capacidade **Sign in with
Apple**. O `app.json` já pede isso (`"usesAppleSignIn": true`), e o build do EAS configura sozinho
quando você entra com a conta Apple.

## 3. Ligar no app e testar

1. Em `src/constants/app.ts`, troque para `LOGIN_APPLE_ATIVO = true`.
2. No iPhone, pelo Expo Go, abra **Conta**. Deve aparecer o botão **"Sign in with Apple"** abaixo
   do "Entrar com Google".
3. Entre e confira que a tela mostra "Lista salva na nuvem às …".

Observações:

- **Nome:** a Apple só envia o nome no primeiro login. O app guarda esse nome na conta. Se você já
  tinha entrado antes em testes, o nome pode não vir; nesse caso a tela mostra o e-mail.
- **E-mail escondido:** a pessoa pode escolher esconder o e-mail. Aí o Supabase recebe um endereço
  da Apple (`@privaterelay.appleid.com`), e tudo continua funcionando.
