# Ativar o login com Google

O código do login já está pronto. Falta criar a credencial no Google e colocá-la no Supabase.
Leva uns 15 minutos e só precisa ser feito uma vez.

- Projeto Supabase: **enxoval** (`ggcocihztrpwfptnuqbc`, região São Paulo)
- URL de retorno do Supabase: `https://ggcocihztrpwfptnuqbc.supabase.co/auth/v1/callback`

## 1. Google Cloud: criar a credencial

1. Acesse https://console.cloud.google.com e crie um projeto chamado **Enxoval**.
2. No menu, abra **Google Auth Platform** e clique em **Get started**:
   - Nome do app: **Enxoval**
   - E-mail de suporte: o seu
   - Público (Audience): **External**
   - Contato: o seu e-mail
3. Em **Clients**, clique em **Create client**:
   - Tipo de aplicativo: **Web application**
   - Nome: **Enxoval Supabase**
   - Em **Authorized redirect URIs**, adicione a URL de retorno do Supabase (acima).
4. Copie o **Client ID** e o **Client secret** que aparecem.
5. Em **Audience**, enquanto o app estiver em modo de teste, adicione em **Test users** os
   e-mails Google que vão testar (o seu, por exemplo). Para liberar para qualquer pessoa, use
   **Publish app** depois.

> O Client secret é uma senha. Não coloque no código nem no repositório; ele vai só no painel do
> Supabase.

## 2. Supabase: ligar o Google

No painel do Supabase (https://supabase.com/dashboard), projeto **enxoval**:

1. **Authentication → Sign In / Providers → Google**: ative, cole o Client ID e o Client secret e
   salve.
2. **Authentication → URL Configuration → Redirect URLs**: adicione
   - `exp://**` (para testar no Expo Go)
   - `enxoval://**` (para o app instalado, quando gerarmos o build)
   - `http://localhost:8081/**` (para testar no navegador)

## 3. Testar

```bash
npx expo start
```

No Expo Go, abra **Conta → Entrar com Google**. Depois de entrar, a tela mostra seu nome e
"Lista salva na nuvem às …". Para conferir os dados: painel do Supabase → **Table Editor →
itens** (e **listas** / **membros_lista** para o compartilhamento).

O roteiro completo de teste no celular está em [`teste-no-celular.md`](teste-no-celular.md).

Se o navegador mostrar um erro e voltar para o app sem entrar:

- **"Unsupported provider"**: o Google não foi ativado no passo 2.1.
- **Volta para uma página errada**: falta a Redirect URL do passo 2.2. Se `exp://**` não
  funcionar, adicione o endereço exato que o Expo mostra no terminal com `/--/auth-callback` no
  final (ex.: `exp://192.168.0.10:8081/--/auth-callback`).
- **"Access blocked" no Google**: o seu e-mail não está em **Test users** (passo 1.5).
