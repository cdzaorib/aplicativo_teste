import { combinaComBusca, normalizarTexto } from '../busca';
import { CATALOGO } from '../catalogo';

const nomes = (busca: string) =>
  CATALOGO.filter((item) => combinaComBusca(item, busca)).map((item) => item.id);

describe('busca no catálogo', () => {
  it('ignora acentos e maiúsculas', () => {
    expect(normalizarTexto('  Berço ÁLCOOL ')).toBe('berco alcool');
    expect(nomes('berco')).toContain('berco');
    expect(nomes('ALCOOL')).toEqual(['alcool-70']);
  });

  it('exige todas as palavras, em qualquer ordem', () => {
    expect(nomes('manga longa body')).toEqual(['body-longo']);
    expect(nomes('body curta')).toEqual(['body-curto']);
  });

  it('com a busca vazia, mostra tudo', () => {
    expect(nomes('   ')).toHaveLength(CATALOGO.length);
  });

  it('sem nada parecido, não acha nada', () => {
    expect(nomes('patinete')).toEqual([]);
  });
});
