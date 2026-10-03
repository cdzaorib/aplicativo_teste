/** Nome do app (provisório até a decisão do nome definitivo). */
export const NOME_APP = 'Enxoval';

/**
 * Dados do app usados na política de privacidade e na página de exclusão de conta.
 *
 * Antes de publicar, defina o e-mail de contato (exigido pelas lojas e pela LGPD). Sem ele, as
 * páginas mostram "e-mail de contato a definir".
 */
export const EMAIL_CONTATO: string | undefined = undefined;

/**
 * "Entrar com a Apple" (só no iPhone). Ligue depois de configurar o provedor Apple no Supabase
 * (docs/login-apple.md); antes disso, o botão daria erro.
 */
export const LOGIN_APPLE_ATIVO = false;

/** Quando a política de privacidade foi revisada pela última vez. */
export const POLITICA_ATUALIZADA_EM = 'outubro de 2026';

/**
 * Endereço da versão web no ar (por exemplo, https://enxoval.vercel.app), sem barra no fim. É de
 * lá que os convidados abrem a lista de presentes. Sem ele, o app no celular não tem link para
 * enviar; na própria versão web, usa o endereço da página aberta.
 */
export const ENDERECO_WEB: string | undefined = undefined;
