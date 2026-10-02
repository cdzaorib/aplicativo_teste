import type { RegistroNuvem } from '@/domain/sincronizacao';
import { deLinha, paraLinha } from '../linhas';

const completo: RegistroNuvem = {
  id: 'abc',
  catalogoId: 'berco',
  nome: 'Berço',
  categoria: 'quarto',
  prioridade: 'essencial',
  modelo: 'Mini',
  precoCentavos: 79990,
  quantidade: 1,
  comprado: true,
  removido: false,
  criadoEm: Date.UTC(2026, 9, 2, 12, 0, 0, 123),
  atualizadoEm: Date.UTC(2026, 9, 2, 13, 30, 0, 456),
};

describe('conversão entre item e linha da tabela', () => {
  it('usa os nomes de coluna do banco e datas ISO', () => {
    expect(paraLinha(completo, 'usuario-1')).toEqual({
      id: 'abc',
      user_id: 'usuario-1',
      catalogo_id: 'berco',
      nome: 'Berço',
      categoria: 'quarto',
      prioridade: 'essencial',
      modelo: 'Mini',
      preco_centavos: 79990,
      quantidade: 1,
      comprado: true,
      removido: false,
      criado_em: '2026-10-02T12:00:00.123Z',
      atualizado_em: '2026-10-02T13:30:00.456Z',
    });
  });

  it('volta ao mesmo item, inclusive com as datas no formato que o Supabase devolve', () => {
    const linha = {
      ...paraLinha(completo, 'usuario-1'),
      criado_em: '2026-10-02T12:00:00.123+00:00',
      atualizado_em: '2026-10-02T13:30:00.456+00:00',
    };
    expect(deLinha(linha)).toEqual(completo);
  });

  it('trata campos opcionais vazios', () => {
    const { catalogoId: _c, precoCentavos: _p, ...semOpcionais } = completo;
    const linha = paraLinha(semOpcionais, 'usuario-1');

    expect(linha).toMatchObject({ catalogo_id: null, preco_centavos: null });
    expect(deLinha(linha)).toEqual(semOpcionais);
  });
});
