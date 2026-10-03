import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

import { temaEscolhido, useAparenciaStore } from '../aparencia';

describe('aparência', () => {
  it('o automático segue o sistema; claro e escuro valem sempre', () => {
    expect(temaEscolhido('automatica', 'dark')).toBe('dark');
    expect(temaEscolhido('automatica', 'light')).toBe('light');
    expect(temaEscolhido('clara', 'dark')).toBe('light');
    expect(temaEscolhido('escura', 'light')).toBe('dark');
  });

  it('no celular, troca também o tema dos componentes do sistema', () => {
    const trocar = jest.spyOn(Appearance, 'setColorScheme').mockImplementation(() => {});
    const { definirAparencia } = useAparenciaStore.getState();

    definirAparencia('escura');
    expect(trocar).toHaveBeenLastCalledWith('dark');
    expect(useAparenciaStore.getState().aparencia).toBe('escura');

    definirAparencia('clara');
    expect(trocar).toHaveBeenLastCalledWith('light');

    // No automático, devolve a escolha ao sistema.
    definirAparencia('automatica');
    expect(trocar).toHaveBeenLastCalledWith('unspecified');
  });

  it('ao abrir, aplica o tema salvo e libera a splash screen', async () => {
    const trocar = jest.spyOn(Appearance, 'setColorScheme').mockImplementation(() => {});
    useAparenciaStore.setState({ carregada: false, aparencia: 'automatica' });
    jest
      .spyOn(AsyncStorage, 'getItem')
      .mockResolvedValueOnce(JSON.stringify({ state: { aparencia: 'escura' }, version: 0 }));

    await useAparenciaStore.persist.rehydrate();

    expect(useAparenciaStore.getState()).toMatchObject({ aparencia: 'escura', carregada: true });
    expect(trocar).toHaveBeenLastCalledWith('dark');
  });

  it('libera a splash screen mesmo se a leitura falhar, para não travar o app', async () => {
    useAparenciaStore.setState({ carregada: false });
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('falhou'));
    jest.spyOn(console, 'warn').mockImplementationOnce(() => {});

    await useAparenciaStore.persist.rehydrate();

    expect(useAparenciaStore.getState().carregada).toBe(true);
    expect(console.warn).toHaveBeenCalled();
  });
});
