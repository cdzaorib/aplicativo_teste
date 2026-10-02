import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import type { ColorValue } from 'react-native';

const ICONES = {
  marcado: { ios: 'checkmark.circle.fill', android: 'check_circle' },
  desmarcado: { ios: 'circle', android: 'radio_button_unchecked' },
  adicionar: { ios: 'plus', android: 'add' },
  diminuir: { ios: 'minus', android: 'remove' },
  aviso: { ios: 'exclamationmark.triangle.fill', android: 'warning' },
  info: { ios: 'info.circle', android: 'info' },
  selo: { ios: 'checkmark.seal', android: 'verified' },
  check: { ios: 'checkmark', android: 'check' },
} satisfies Record<string, { ios: SFSymbol; android: AndroidSymbol }>;

export type NomeIcone = keyof typeof ICONES;

type IconeProps = {
  nome: NomeIcone;
  cor: ColorValue;
  tamanho?: number;
};

export function Icone({ nome, cor, tamanho = 20 }: IconeProps) {
  const { ios, android } = ICONES[nome];
  return <SymbolView name={{ ios, android, web: android }} tintColor={cor} size={tamanho} />;
}
