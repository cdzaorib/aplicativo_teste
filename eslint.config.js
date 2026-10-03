// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    // As Edge Functions rodam no Deno, com outro TypeScript e outras importações.
    ignores: ['dist/*', '.expo/*', 'supabase/functions/*'],
  },
]);
