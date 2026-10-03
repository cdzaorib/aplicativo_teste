import { act, renderHook } from '@testing-library/react-native';
import * as ReactNative from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
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
});
