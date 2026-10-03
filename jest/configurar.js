// Roda antes de cada arquivo de teste. O tema (useTheme) lê a preferência salva no aparelho, então
// todo componente usa o AsyncStorage: nos testes, ele é o de memória.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
