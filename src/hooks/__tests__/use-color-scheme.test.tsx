import { act, renderHook } from '@testing-library/react-native';
import * as ReactNative from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { useAparenciaStore } from '@/store/aparencia';

beforeEach(() => {
  jest.spyOn(ReactNative.Appearance, 'setColorScheme').mockImplementation(() => {});
  jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('light');
});

describe('useColorScheme', () => {
  it('usa o tema escolhido e, no automático, o do celular', async () => {
    useAparenciaStore.setState({ aparencia: 'automatica' });
    const { result } = await renderHook(() => useColorScheme());
    expect(result.current).toBe('light');

    await act(() => useAparenciaStore.setState({ aparencia: 'escura' }));
    expect(result.current).toBe('dark');
  });

  it('o tema preto usa o fundo totalmente preto; o escuro, o cinza escuro', async () => {
    useAparenciaStore.setState({ aparencia: 'escura' });
    const { result } = await renderHook(() => useTheme());
    expect(result.current.background).toBe(Colors.dark.background);

    await act(() => useAparenciaStore.setState({ aparencia: 'preta' }));
    expect(result.current.background).toBe('#000000');

    await act(() => useAparenciaStore.setState({ aparencia: 'clara' }));
    expect(result.current).toBe(Colors.light);
  });
});
