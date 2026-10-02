import { formatarCodigo } from '../compartilhar';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

describe('formatarCodigo', () => {
  it('separa o código em dois blocos', () => {
    expect(formatarCodigo('K7P2QX9M')).toBe('K7P2-QX9M');
  });
});
