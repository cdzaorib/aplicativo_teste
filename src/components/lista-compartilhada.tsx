import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Share, StyleSheet, Switch, View } from 'react-native';

import { Botao } from '@/components/botao';
import { Campo } from '@/components/campo';
import { confirmar } from '@/components/confirmar';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  buscarMembros,
  definirPermissoes,
  entrarNaLista,
  ErroCompartilhar,
  formatarCodigo,
  removerMembro,
  sairDaLista,
  trocarCodigoConvite,
  type Membro,
} from '@/nuvem/compartilhar';
import { permissaoNaLista, useSessaoStore, type InfoLista } from '@/store/sessao';

const mensagemDe = (erro: unknown) =>
  erro instanceof ErroCompartilhar ? erro.message : 'Algo deu errado. Tente de novo.';

/** Executa uma ação guardando o estado de "ocupado" e a mensagem de erro para a tela. */
function useAcao() {
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string>();
  async function executar(acao: () => Promise<unknown>) {
    setOcupado(true);
    setErro(undefined);
    try {
      await acao();
    } catch (e) {
      setErro(mensagemDe(e));
    } finally {
      setOcupado(false);
    }
  }
  return { ocupado, erro, executar };
}

/** Seção da tela Conta: convidar pessoas, permissões, entrar e sair de listas compartilhadas. */
export function ListaCompartilhada() {
  const lista = useSessaoStore((s) => s.lista);
  if (!lista) {
    return (
      <ThemedText type="small" themeColor="textSecondary">
        Carregando sua lista…
      </ThemedText>
    );
  }
  return lista.souDona ? <PainelDona lista={lista} /> : <PainelConvidado lista={lista} />;
}

function PainelDona({ lista }: { lista: InfoLista }) {
  const { ocupado, erro, executar } = useAcao();
  const [membros, setMembros] = useState<Membro[]>();
  const [codigo, setCodigo] = useState('');
  const convidados = membros?.filter((m) => !m.eDona) ?? [];

  const carregar = useCallback(() => {
    buscarMembros()
      .then(setMembros)
      .catch(() => setMembros([]));
  }, []);
  useFocusEffect(carregar);

  async function enviarConvite(codigoConvite: string) {
    try {
      await Share.share({
        message: `Vamos montar o enxoval juntos? Baixe o app Enxoval, entre com sua conta Google e, na aba Conta, use o código ${formatarCodigo(codigoConvite)}.`,
      });
    } catch {
      // Sem a folha de compartilhamento (ex.: navegador), o código continua visível na tela.
    }
  }

  return (
    <View style={styles.painel}>
      <ThemedText type="small" themeColor="textSecondary">
        Convide quem vai montar o enxoval com você. Quem entrar só vê a lista até você liberar
        edição.
      </ThemedText>

      {lista.codigoConvite && (
        <View style={styles.codigo}>
          <ThemedText type="small" themeColor="textSecondary">
            Código de convite
          </ThemedText>
          <ThemedText type="subtitle" selectable accessibilityLabel="Código de convite">
            {formatarCodigo(lista.codigoConvite)}
          </ThemedText>
          <Botao
            titulo="Enviar convite"
            onPress={() => enviarConvite(lista.codigoConvite!)}
            desabilitado={ocupado}
          />
          <Botao
            titulo="Gerar novo código"
            variante="secundario"
            desabilitado={ocupado}
            onPress={async () => {
              if (
                await confirmar(
                  'Gerar novo código',
                  'O código atual deixa de funcionar. Quem já entrou continua na lista.',
                  'Gerar',
                )
              ) {
                executar(trocarCodigoConvite);
              }
            }}
          />
        </View>
      )}

      <View style={styles.secao}>
        <ThemedText type="smallBold">Quem está na sua lista</ThemedText>
        {membros === undefined ? (
          <ThemedText type="small" themeColor="textSecondary">
            Carregando…
          </ThemedText>
        ) : convidados.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            Ninguém entrou ainda.
          </ThemedText>
        ) : (
          convidados.map((membro) => (
            <CartaoMembro
              key={membro.userId}
              membro={membro}
              ocupado={ocupado}
              onPermissoes={(editarLista, editarPrecos) =>
                executar(async () => {
                  await definirPermissoes(membro.userId, editarLista, editarPrecos);
                  carregar();
                })
              }
              onRemover={async () => {
                if (
                  await confirmar(
                    'Remover da lista',
                    `${membro.nome ?? 'Esta pessoa'} deixa de ver a sua lista e volta para a lista própria.`,
                    'Remover',
                  )
                ) {
                  executar(async () => {
                    await removerMembro(membro.userId);
                    carregar();
                  });
                }
              }}
            />
          ))
        )}
      </View>

      {membros !== undefined && convidados.length === 0 && (
        <View style={styles.secao}>
          <ThemedText type="smallBold">Recebeu um código de convite?</ThemedText>
          <Campo
            rotulo="Código"
            placeholder="XXXX-XXXX"
            autoCapitalize="characters"
            autoCorrect={false}
            value={codigo}
            onChangeText={setCodigo}
          />
          <Botao
            titulo={ocupado ? 'Entrando…' : 'Entrar na lista'}
            desabilitado={ocupado || codigo.replace(/[^A-Za-z0-9]/g, '').length < 8}
            onPress={async () => {
              if (
                await confirmar(
                  'Entrar na lista compartilhada',
                  'Os itens da sua lista serão juntados à lista compartilhada. Quem convidou decide o que você pode editar.',
                  'Entrar',
                )
              ) {
                executar(() => entrarNaLista(codigo));
              }
            }}
          />
        </View>
      )}

      {erro && <MensagemErro texto={erro} />}
    </View>
  );
}

function CartaoMembro({
  membro,
  ocupado,
  onPermissoes,
  onRemover,
}: {
  membro: Membro;
  ocupado: boolean;
  onPermissoes: (editarLista: boolean, editarPrecos: boolean) => void;
  onRemover: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.membro, { borderColor: theme.border }]}>
      <ThemedText type="smallBold">{membro.nome ?? 'Convidado'}</ThemedText>
      <LinhaPermissao
        rotulo="Pode editar a lista"
        valor={membro.podeEditarLista}
        desabilitado={ocupado}
        onChange={(valor) => onPermissoes(valor, membro.podeEditarPrecos)}
      />
      <LinhaPermissao
        rotulo="Pode editar preços"
        // Quem edita a lista já edita os preços.
        valor={membro.podeEditarPrecos || membro.podeEditarLista}
        desabilitado={ocupado || membro.podeEditarLista}
        onChange={(valor) => onPermissoes(membro.podeEditarLista, valor)}
      />
      <Botao titulo="Remover" variante="perigo" desabilitado={ocupado} onPress={onRemover} />
    </View>
  );
}

function LinhaPermissao({
  rotulo,
  valor,
  desabilitado,
  onChange,
}: {
  rotulo: string;
  valor: boolean;
  desabilitado: boolean;
  onChange: (valor: boolean) => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.linhaSwitch}>
      <ThemedText type="small" style={styles.textoSwitch}>
        {rotulo}
      </ThemedText>
      <Switch
        accessibilityLabel={rotulo}
        accessibilityState={{ checked: valor, disabled: desabilitado }}
        value={valor}
        disabled={desabilitado}
        onValueChange={onChange}
        trackColor={{ true: theme.primary }}
      />
    </View>
  );
}

const DESCRICAO_PERMISSAO = {
  total: 'Você pode editar a lista e os preços.',
  precos: 'Você pode editar os preços dos itens.',
  leitura: 'Você pode ver a lista. Para editar, peça à dona da lista.',
};

function PainelConvidado({ lista }: { lista: InfoLista }) {
  const { ocupado, erro, executar } = useAcao();
  return (
    <View style={styles.painel}>
      <ThemedText type="smallBold">
        Você está na lista{lista.nomeDona ? ` de ${lista.nomeDona}` : ' compartilhada'}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {DESCRICAO_PERMISSAO[permissaoNaLista(lista)]}
      </ThemedText>
      <Botao
        titulo={ocupado ? 'Saindo…' : 'Sair da lista compartilhada'}
        variante="perigo"
        desabilitado={ocupado}
        onPress={async () => {
          if (
            await confirmar(
              'Sair da lista',
              'Você volta para a sua própria lista, com uma cópia dos itens desta.',
              'Sair',
            )
          ) {
            executar(sairDaLista);
          }
        }}
      />
      {erro && <MensagemErro texto={erro} />}
    </View>
  );
}

function MensagemErro({ texto }: { texto: string }) {
  const theme = useTheme();
  return (
    <ThemedText type="small" style={{ color: theme.danger }}>
      {texto}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  painel: {
    gap: Spacing.three,
  },
  codigo: {
    gap: Spacing.two,
  },
  secao: {
    gap: Spacing.two,
  },
  membro: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: 1,
  },
  linhaSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  textoSwitch: {
    flex: 1,
  },
});
