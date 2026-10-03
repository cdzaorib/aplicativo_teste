import { Alert, Platform } from 'react-native';

/** Pede confirmação antes de uma ação importante (na web usa o confirm do navegador). */
export function confirmar(
  titulo: string,
  mensagem: string,
  textoConfirmar: string,
): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${titulo}\n\n${mensagem}`));
  return new Promise((resolver) =>
    Alert.alert(titulo, mensagem, [
      { text: 'Cancelar', style: 'cancel', onPress: () => resolver(false) },
      { text: textoConfirmar, onPress: () => resolver(true) },
    ]),
  );
}
