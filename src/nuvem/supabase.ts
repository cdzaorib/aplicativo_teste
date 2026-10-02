import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const chave = process.env.EXPO_PUBLIC_SUPABASE_KEY;

/** Cliente do Supabase, ou `null` se o app foi gerado sem as variáveis do `.env`. */
export const supabase =
  url && chave
    ? createClient(url, chave, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          // Na pré-renderização estática da versão web (Node) não há onde guardar a sessão.
          persistSession: typeof window !== 'undefined',
          detectSessionInUrl: false,
          flowType: 'pkce',
        },
      })
    : null;
