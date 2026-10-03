import { useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { Botao } from '@/components/botao';
import { Campo } from '@/components/campo';
import { Chips } from '@/components/chips';
import { Icone } from '@/components/icone';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { lerPreco, precoParaTexto } from '@/domain/lista';
import type { Permissao } from '@/domain/sincronizacao';
import {
  CATEGORIAS,
  PRIORIDADES,
  type ItemLista,
  type Prioridade,
  type UnidadePreco,
} from '@/domain/tipos';
import { useTheme } from '@/hooks/use-theme';

export type ValoresItem = Pick<
  ItemLista,
  'nome' | 'modelo' | 'categoria' | 'prioridade' | 'quantidade' | 'precoCentavos' | 'comprado'
>;

type Props = {
  inicial: ValoresItem;
  mostrarComprado?: boolean;
  /** Numa lista compartilhada, o que a pessoa pode alterar. */
  permissao?: Permissao;
  /** Como o preço do item é contado (por par, por pacote...). */
  unidadePreco?: UnidadePreco;
  onSalvar: (valores: ValoresItem) => void;
};

// "Evitar" só existe no catálogo curado; itens próprios usam as demais prioridades.
const { evitar: _evitar, ...PRIORIDADES_ITEM_PROPRIO } = PRIORIDADES;

export function ItemForm({
  inicial,
  mostrarComprado,
  permissao = 'total',
  unidadePreco = 'unidade',
  onSalvar,
}: Props) {
  const theme = useTheme();
  const editaItem = permissao === 'total';
  const editaPreco = permissao !== 'leitura';
  const [nome, setNome] = useState(inicial.nome);
  const [modelo, setModelo] = useState(inicial.modelo);
  const [preco, setPreco] = useState(precoParaTexto(inicial.precoCentavos));
  const [quantidade, setQuantidade] = useState(inicial.quantidade);
  const [categoria, setCategoria] = useState(inicial.categoria);
  const [prioridade, setPrioridade] = useState<Prioridade>(inicial.prioridade);
  const [comprado, setComprado] = useState(inicial.comprado);
  const [tentouSalvar, setTentouSalvar] = useState(false);

  const precoCentavos = lerPreco(preco);
  const erroNome = tentouSalvar && !nome.trim() ? 'Informe o nome do item.' : undefined;
  const erroPreco =
    preco.trim() && precoCentavos === undefined ? 'Use um valor como 149,90.' : undefined;

  function salvar() {
    setTentouSalvar(true);
    if (!nome.trim() || erroPreco) return;
    onSalvar({
      nome: nome.trim(),
      modelo: modelo.trim(),
      precoCentavos,
      quantidade,
      categoria,
      prioridade,
      comprado,
    });
  }

  return (
    <View style={styles.form}>
      {permissao !== 'total' && (
        <ThemedText type="small" themeColor="textSecondary">
          {permissao === 'precos'
            ? 'Nesta lista compartilhada você pode alterar só o preço.'
            : 'Nesta lista compartilhada você pode só visualizar os itens.'}
        </ThemedText>
      )}
      <Campo
        rotulo="Nome"
        value={nome}
        onChangeText={setNome}
        erro={erroNome}
        editable={editaItem}
      />
      <Campo
        rotulo="Modelo ou marca"
        placeholder="Opcional"
        value={modelo}
        onChangeText={setModelo}
        editable={editaItem}
      />
      <Campo
        rotulo={`Preço por ${unidadePreco} (R$)`}
        placeholder="0,00"
        keyboardType="decimal-pad"
        value={preco}
        onChangeText={setPreco}
        erro={erroPreco}
        editable={editaPreco}
      />

      <View style={styles.secao}>
        <ThemedText type="smallBold">Quantidade</ThemedText>
        <View style={styles.contador}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Diminuir quantidade"
            disabled={!editaItem || quantidade <= 1}
            onPress={() => setQuantidade((q) => Math.max(1, q - 1))}
            style={[styles.botaoContador, { backgroundColor: theme.backgroundElement }]}>
            <Icone nome="diminuir" cor={theme.text} />
          </Pressable>
          <ThemedText type="smallBold" style={styles.valorContador}>
            {quantidade}
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Aumentar quantidade"
            disabled={!editaItem}
            onPress={() => setQuantidade((q) => q + 1)}
            style={[styles.botaoContador, { backgroundColor: theme.backgroundElement }]}>
            <Icone nome="adicionar" cor={theme.text} />
          </Pressable>
        </View>
      </View>

      <View style={styles.secao}>
        <ThemedText type="smallBold">Categoria</ThemedText>
        <Chips
          rotulo="Categoria"
          opcoes={CATEGORIAS}
          valor={categoria}
          onChange={setCategoria}
          desabilitado={!editaItem}
        />
      </View>

      <View style={styles.secao}>
        <ThemedText type="smallBold">Prioridade</ThemedText>
        <Chips
          rotulo="Prioridade"
          opcoes={PRIORIDADES_ITEM_PROPRIO}
          valor={prioridade === 'evitar' ? undefined : prioridade}
          onChange={setPrioridade}
          desabilitado={!editaItem}
        />
      </View>

      {mostrarComprado && (
        <View style={styles.linhaSwitch}>
          <ThemedText type="smallBold">Já comprei</ThemedText>
          <Switch
            accessibilityLabel="Já comprei"
            aria-checked={comprado}
            aria-disabled={!editaItem}
            value={comprado}
            onValueChange={setComprado}
            disabled={!editaItem}
            trackColor={{ true: theme.primary }}
          />
        </View>
      )}

      {editaPreco && <Botao titulo="Salvar" onPress={salvar} />}
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.three,
  },
  secao: {
    gap: Spacing.two,
  },
  contador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  botaoContador: {
    width: 44,
    height: 44,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valorContador: {
    minWidth: 24,
    textAlign: 'center',
  },
  linhaSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
