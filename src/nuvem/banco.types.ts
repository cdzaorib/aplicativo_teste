// Tipos das tabelas e funções do banco, gerados pelo Supabase. Não edite à mão: depois de mudar
// o banco (supabase/migrations), gere de novo com a ferramenta `generate_typescript_types` do
// conector do Supabase ou com `npx supabase gen types typescript --project-id ggcocihztrpwfptnuqbc`.
// Depois rode `npm run format`.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.18';
  };
  public: {
    Tables: {
      historico_ofertas: {
        Row: {
          catalogo_id: string;
          dia: string;
          loja: string;
          mediana_centavos: number;
          menor_preco_centavos: number;
          quantidade: number;
        };
        Insert: {
          catalogo_id: string;
          dia: string;
          loja: string;
          mediana_centavos: number;
          menor_preco_centavos: number;
          quantidade: number;
        };
        Update: {
          catalogo_id?: string;
          dia?: string;
          loja?: string;
          mediana_centavos?: number;
          menor_preco_centavos?: number;
          quantidade?: number;
        };
        Relationships: [];
      };
      itens: {
        Row: {
          atualizado_em: string;
          catalogo_id: string | null;
          categoria: string;
          comprado: boolean;
          comprado_por: string | null;
          criado_em: string;
          id: string;
          lista_id: string;
          modelo: string;
          nome: string;
          preco_centavos: number | null;
          prioridade: string;
          quantidade: number;
          removido: boolean;
        };
        Insert: {
          atualizado_em: string;
          catalogo_id?: string | null;
          categoria: string;
          comprado?: boolean;
          comprado_por?: string | null;
          criado_em: string;
          id: string;
          lista_id: string;
          modelo?: string;
          nome: string;
          preco_centavos?: number | null;
          prioridade: string;
          quantidade?: number;
          removido?: boolean;
        };
        Update: {
          atualizado_em?: string;
          catalogo_id?: string | null;
          categoria?: string;
          comprado?: boolean;
          comprado_por?: string | null;
          criado_em?: string;
          id?: string;
          lista_id?: string;
          modelo?: string;
          nome?: string;
          preco_centavos?: number | null;
          prioridade?: string;
          quantidade?: number;
          removido?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'itens_lista_id_fkey';
            columns: ['lista_id'];
            isOneToOne: false;
            referencedRelation: 'listas';
            referencedColumns: ['id'];
          },
        ];
      };
      itens_lista: {
        Row: {
          atualizado_em: string;
          catalogo_id: string | null;
          categoria: string;
          comprado: boolean;
          criado_em: string;
          id: string;
          modelo: string;
          nome: string;
          preco_centavos: number | null;
          prioridade: string;
          quantidade: number;
          removido: boolean;
          user_id: string;
        };
        Insert: {
          atualizado_em: string;
          catalogo_id?: string | null;
          categoria: string;
          comprado?: boolean;
          criado_em: string;
          id: string;
          modelo?: string;
          nome: string;
          preco_centavos?: number | null;
          prioridade: string;
          quantidade?: number;
          removido?: boolean;
          user_id?: string;
        };
        Update: {
          atualizado_em?: string;
          catalogo_id?: string | null;
          categoria?: string;
          comprado?: boolean;
          criado_em?: string;
          id?: string;
          modelo?: string;
          nome?: string;
          preco_centavos?: number | null;
          prioridade?: string;
          quantidade?: number;
          removido?: boolean;
          user_id?: string;
        };
        Relationships: [];
      };
      links_presentes: {
        Row: {
          codigo: string;
          criado_em: string;
          lista_id: string;
        };
        Insert: {
          codigo: string;
          criado_em?: string;
          lista_id: string;
        };
        Update: {
          codigo?: string;
          criado_em?: string;
          lista_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'links_presentes_lista_id_fkey';
            columns: ['lista_id'];
            isOneToOne: true;
            referencedRelation: 'listas';
            referencedColumns: ['id'];
          },
        ];
      };
      listas: {
        Row: {
          codigo_convite: string;
          criada_em: string;
          dona_id: string;
          id: string;
        };
        Insert: {
          codigo_convite: string;
          criada_em?: string;
          dona_id: string;
          id?: string;
        };
        Update: {
          codigo_convite?: string;
          criada_em?: string;
          dona_id?: string;
          id?: string;
        };
        Relationships: [];
      };
      membros_lista: {
        Row: {
          e_dona: boolean;
          entrou_em: string;
          lista_id: string;
          nome: string | null;
          pode_editar_lista: boolean;
          pode_editar_precos: boolean;
          user_id: string;
        };
        Insert: {
          e_dona?: boolean;
          entrou_em?: string;
          lista_id: string;
          nome?: string | null;
          pode_editar_lista?: boolean;
          pode_editar_precos?: boolean;
          user_id: string;
        };
        Update: {
          e_dona?: boolean;
          entrou_em?: string;
          lista_id?: string;
          nome?: string | null;
          pode_editar_lista?: boolean;
          pode_editar_precos?: boolean;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'membros_lista_lista_id_fkey';
            columns: ['lista_id'];
            isOneToOne: false;
            referencedRelation: 'listas';
            referencedColumns: ['id'];
          },
        ];
      };
      ofertas: {
        Row: {
          avaliacao: number | null;
          catalogo_id: string;
          coletado_em: string;
          imagem_url: string | null;
          link: string;
          loja: string;
          nome: string;
          preco_max_centavos: number;
          preco_min_centavos: number;
          produto_id: string;
          vendas: number | null;
        };
        Insert: {
          avaliacao?: number | null;
          catalogo_id: string;
          coletado_em?: string;
          imagem_url?: string | null;
          link: string;
          loja: string;
          nome: string;
          preco_max_centavos: number;
          preco_min_centavos: number;
          produto_id: string;
          vendas?: number | null;
        };
        Update: {
          avaliacao?: number | null;
          catalogo_id?: string;
          coletado_em?: string;
          imagem_url?: string | null;
          link?: string;
          loja?: string;
          nome?: string;
          preco_max_centavos?: number;
          preco_min_centavos?: number;
          produto_id?: string;
          vendas?: number | null;
        };
        Relationships: [];
      };
      precos_informados: {
        Row: {
          catalogo_id: string;
          criado_em: string;
          dia: string;
          id: number;
          loja: string | null;
          preco_centavos: number;
          user_id: string;
        };
        Insert: {
          catalogo_id: string;
          criado_em?: string;
          dia?: string;
          id?: never;
          loja?: string | null;
          preco_centavos: number;
          user_id?: string;
        };
        Update: {
          catalogo_id?: string;
          criado_em?: string;
          dia?: string;
          id?: never;
          loja?: string | null;
          preco_centavos?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      presentes: {
        Row: {
          chave_reserva_hash: string | null;
          incluido_em: string;
          item_id: string;
          lista_id: string;
          reservado_em: string | null;
          reservado_por: string | null;
        };
        Insert: {
          chave_reserva_hash?: string | null;
          incluido_em?: string;
          item_id: string;
          lista_id: string;
          reservado_em?: string | null;
          reservado_por?: string | null;
        };
        Update: {
          chave_reserva_hash?: string | null;
          incluido_em?: string;
          item_id?: string;
          lista_id?: string;
          reservado_em?: string | null;
          reservado_por?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'presentes_lista_id_item_id_fkey';
            columns: ['lista_id', 'item_id'];
            isOneToOne: true;
            referencedRelation: 'itens';
            referencedColumns: ['lista_id', 'id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      criar_link_presentes: { Args: never; Returns: string };
      definir_permissoes: {
        Args: { editar_lista: boolean; editar_precos: boolean; membro: string };
        Returns: undefined;
      };
      desfazer_reserva_presente: {
        Args: { chave: string; codigo_link: string; item: string };
        Returns: undefined;
      };
      entrar_na_lista: { Args: { codigo: string }; Returns: string };
      garantir_lista: {
        Args: never;
        Returns: {
          codigo_convite: string;
          e_dona: boolean;
          lista_id: string;
          nome_dona: string;
          pode_editar_lista: boolean;
          pode_editar_precos: boolean;
        }[];
      };
      liberar_presente: { Args: { item: string }; Returns: undefined };
      novo_codigo_convite: { Args: never; Returns: string };
      referencia_precos: {
        Args: never;
        Returns: {
          catalogo_id: string;
          p25_centavos: number;
          p75_centavos: number;
          quantidade: number;
        }[];
      };
      remover_membro: { Args: { membro: string }; Returns: undefined };
      reservar_presente: {
        Args: { codigo_link: string; item: string; nome_convidado: string };
        Returns: string;
      };
      sair_da_lista: { Args: never; Returns: undefined };
      trocar_link_presentes: { Args: never; Returns: string };
      ver_lista_presentes: { Args: { codigo_link: string }; Returns: Json };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
