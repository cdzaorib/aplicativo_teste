import { permissaoNaLista, type InfoLista } from '../sessao';

const lista = (dados: Partial<InfoLista>): InfoLista => ({
  id: 'l1',
  souDona: false,
  podeEditarLista: false,
  podeEditarPrecos: false,
  ...dados,
});

describe('permissaoNaLista', () => {
  it('sem conta ou como dona, pode tudo', () => {
    expect(permissaoNaLista(undefined)).toBe('total');
    expect(
      permissaoNaLista(lista({ souDona: true, podeEditarLista: true, podeEditarPrecos: true })),
    ).toBe('total');
  });

  it('convidado tem o que a dona liberou', () => {
    expect(permissaoNaLista(lista({ podeEditarLista: true, podeEditarPrecos: true }))).toBe(
      'total',
    );
    expect(permissaoNaLista(lista({ podeEditarPrecos: true }))).toBe('precos');
    expect(permissaoNaLista(lista({}))).toBe('leitura');
  });
});
