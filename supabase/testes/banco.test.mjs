// Testes das regras do banco: aplica todas as migrações num Postgres local (PGlite) e simula
// pessoas usando a API, com o papel `authenticated` e o usuário no token, como o Supabase faz.
// Cada teste roda numa transação desfeita no fim. Rode com `npm run test:banco`.
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { after, before, beforeEach, afterEach, describe, it } from 'node:test';

const pasta = new URL('..', import.meta.url);
let db;

before(async () => {
  db = await PGlite.create({ extensions: { pgcrypto } });
  await db.exec(await readFile(new URL('testes/supabase-local.sql', pasta), 'utf8'));
  const migracoes = (await readdir(new URL('migrations/', pasta))).filter((f) =>
    f.endsWith('.sql'),
  );
  for (const arquivo of migracoes.sort()) {
    await db.exec(await readFile(new URL(`migrations/${arquivo}`, pasta), 'utf8'));
  }
});

after(() => db.close());
beforeEach(() => db.exec('begin'));
afterEach(() => db.exec('rollback'));

/** Cria uma pessoa em auth.users, como o login com Google faz. */
async function pessoa(nome) {
  const id = randomUUID();
  await db.query('insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)', [
    id,
    `${nome.toLowerCase()}@teste.local`,
    { full_name: nome },
  ]);
  return id;
}

/** Roda uma consulta como a pessoa, pela API (sem usuário: como visitante anônimo). */
async function como(usuario, sql, params = []) {
  await db.exec(`set local role ${usuario ? 'authenticated' : 'anon'}`);
  await db.query("select set_config('request.jwt.claims', $1, true)", [
    usuario ? JSON.stringify({ sub: usuario, role: 'authenticated' }) : '',
  ]);
  // Num erro, quem chamou desfaz a transação (ou o savepoint), e isso já devolve o papel.
  const { rows } = await db.query(sql, params);
  await db.exec('reset role');
  return rows;
}

/** Como `como`, mas espera um erro e devolve o código dele (SQLSTATE). */
async function falhaComo(usuario, sql, params = []) {
  await db.exec('savepoint antes_do_erro');
  try {
    await como(usuario, sql, params);
  } catch (erro) {
    await db.exec('rollback to savepoint antes_do_erro');
    return erro.code;
  }
  assert.fail(`deveria ter falhado: ${sql}`);
}

async function garantirLista(usuario) {
  const [lista] = await como(usuario, 'select * from public.garantir_lista()');
  return lista;
}

async function entrar(usuario, codigo) {
  const [linha] = await como(usuario, 'select public.entrar_na_lista($1) as lista', [codigo]);
  return linha.lista;
}

/** Item gravado direto no banco, para preparar o cenário. */
async function item(lista, id, catalogoId = null, nome = id) {
  await db.query(
    `insert into public.itens (lista_id, id, catalogo_id, nome, categoria, prioridade,
       criado_em, atualizado_em)
     values ($1, $2, $3, $4, 'quarto', 'essencial', now(), now())`,
    [lista, id, catalogoId, nome],
  );
}

async function membro(usuario) {
  const { rows } = await db.query('select * from public.membros_lista where user_id = $1', [
    usuario,
  ]);
  return rows[0];
}

/** Dona com a lista criada e um convidado (que tinha a própria lista) dentro dela. */
async function listaCompartilhada() {
  const dona = await pessoa('Gabi');
  const convidado = await pessoa('Paulo');
  const listaDona = await garantirLista(dona);
  const listaConvidado = await garantirLista(convidado);
  await item(listaDona.lista_id, 'berco-dona', 'berco');
  await item(listaConvidado.lista_id, 'berco-convidado', 'berco');
  await item(listaConvidado.lista_id, 'body-convidado', 'body');
  await entrar(convidado, listaDona.codigo_convite);
  return { dona, convidado, listaDona, listaConvidado };
}

describe('listas compartilhadas', () => {
  it('cria a lista própria com código de convite na primeira vez', async () => {
    const gabi = await pessoa('Gabi');
    const lista = await garantirLista(gabi);
    assert.equal(lista.e_dona, true);
    assert.match(lista.codigo_convite, /^[A-HJ-NP-Z2-9]{8}$/);
    assert.equal(lista.nome_dona, 'Gabi');
  });

  it('entra pelo código em minúsculas e com hífen, juntando itens sem repetir', async () => {
    const { convidado, listaDona } = await listaCompartilhada();
    const itens = await como(convidado, 'select id from public.itens order by id');
    // O berço do convidado não entra, porque a lista já tem um berço do catálogo.
    assert.deepEqual(
      itens.map((i) => i.id),
      ['berco-dona', 'body-convidado'],
    );
    const codigo = listaDona.codigo_convite.toLowerCase();
    const outra = await pessoa('Avó');
    assert.equal(
      await entrar(outra, `${codigo.slice(0, 4)}-${codigo.slice(4)}`),
      listaDona.lista_id,
    );
  });

  it('convidado sem permissão só visualiza', async () => {
    const { convidado, listaDona } = await listaCompartilhada();
    const alterados = await como(
      convidado,
      "update public.itens set preco_centavos = 1 where id = 'berco-dona' returning id",
    );
    assert.equal(alterados.length, 0);
    assert.equal(
      await falhaComo(
        convidado,
        `insert into public.itens (lista_id, id, nome, categoria, prioridade, criado_em, atualizado_em)
         values ($1, 'novo', 'Novo', 'quarto', 'util', now(), now())`,
        [listaDona.lista_id],
      ),
      '42501',
    );
  });

  it('quem só edita preços muda o preço, mas não o resto do item', async () => {
    const { dona, convidado } = await listaCompartilhada();
    await como(dona, 'select public.definir_permissoes($1, false, true)', [convidado]);
    const alterados = await como(
      convidado,
      "update public.itens set preco_centavos = 59900 where id = 'berco-dona' returning id",
    );
    assert.equal(alterados.length, 1);
    assert.equal(
      await falhaComo(convidado, "update public.itens set comprado = true where id = 'berco-dona'"),
      '42501',
    );
  });

  it('quem não está na lista não vê nada', async () => {
    await listaCompartilhada();
    const estranho = await pessoa('Estranho');
    assert.equal((await como(estranho, 'select * from public.itens')).length, 0);
    assert.equal((await como(estranho, 'select * from public.membros_lista')).length, 0);
  });

  it('só a dona muda permissões e remove pessoas, e ela não pode sair da própria lista', async () => {
    const { dona, convidado, listaConvidado } = await listaCompartilhada();
    assert.equal(
      await falhaComo(convidado, 'select public.definir_permissoes($1, true, true)', [convidado]),
      '42501',
    );
    assert.equal(await falhaComo(dona, 'select public.sair_da_lista()'), 'P0001');
    await como(dona, 'select public.remover_membro($1)', [convidado]);
    const depois = await membro(convidado);
    assert.equal(depois.lista_id, listaConvidado.lista_id);
    assert.equal(depois.e_dona, true);
  });

  it('convidado sai e volta para a própria lista', async () => {
    const { convidado, listaConvidado } = await listaCompartilhada();
    await como(convidado, 'select public.sair_da_lista()');
    const lista = await garantirLista(convidado);
    assert.equal(lista.lista_id, listaConvidado.lista_id);
    assert.equal(lista.e_dona, true);
  });

  it('sem login não chama nenhuma operação', async () => {
    assert.equal(await falhaComo(null, 'select * from public.garantir_lista()'), '42501');
    assert.equal(await falhaComo(null, "select public.entrar_na_lista('AAAAAAAA')"), '42501');
  });
});

describe('excluir conta', () => {
  it('apaga a lista, os itens e os preços da dona e devolve o convidado à lista dele', async () => {
    const { dona, convidado, listaDona, listaConvidado } = await listaCompartilhada();
    await db.query(
      "insert into public.precos_informados (user_id, catalogo_id, preco_centavos) values ($1, 'berco', 90000)",
      [dona],
    );

    await db.query('delete from auth.users where id = $1', [dona]);

    const contar = async (sql, params) => (await db.query(sql, params)).rows[0].n;
    assert.equal(
      await contar('select count(*)::int n from public.listas where id = $1', [listaDona.lista_id]),
      0,
    );
    assert.equal(
      await contar('select count(*)::int n from public.itens where lista_id = $1', [
        listaDona.lista_id,
      ]),
      0,
    );
    assert.equal(
      await contar('select count(*)::int n from public.membros_lista where user_id = $1', [dona]),
      0,
    );
    assert.equal(
      await contar('select count(*)::int n from public.precos_informados where user_id = $1', [
        dona,
      ]),
      0,
    );

    const lista = await garantirLista(convidado);
    assert.equal(lista.lista_id, listaConvidado.lista_id);
    assert.equal(lista.e_dona, true);
    assert.equal(lista.pode_editar_lista, true);
    const itens = await como(convidado, 'select id from public.itens order by id');
    assert.deepEqual(
      itens.map((i) => i.id),
      ['berco-convidado', 'body-convidado'],
    );
  });

  it('convidado que exclui a conta sai da lista da dona sem mexer nela', async () => {
    const { dona, convidado, listaDona } = await listaCompartilhada();
    await db.query('delete from auth.users where id = $1', [convidado]);
    const membros = await como(dona, 'select user_id from public.membros_lista');
    assert.deepEqual(
      membros.map((m) => m.user_id),
      [dona],
    );
    assert.equal((await garantirLista(dona)).lista_id, listaDona.lista_id);
  });

  it('garantir_lista reaproveita a lista própria e não duplica', async () => {
    const gabi = await pessoa('Gabi');
    const { rows } = await db.query(
      "insert into public.listas (dona_id, codigo_convite) values ($1, 'TESTEAAA') returning id",
      [gabi],
    );
    assert.equal((await garantirLista(gabi)).lista_id, rows[0].id);
    assert.equal((await garantirLista(gabi)).lista_id, rows[0].id);
  });
});

describe('limite de tentativas de convite', () => {
  it('código errado devolve null e não gera erro', async () => {
    const paulo = await pessoa('Paulo');
    assert.equal(await entrar(paulo, 'ZZZZZZZZ'), null);
  });

  it('bloqueia depois de 10 tentativas na mesma hora e libera na hora seguinte', async () => {
    const { listaDona } = await listaCompartilhada();
    const curioso = await pessoa('Curioso');
    for (let i = 0; i < 10; i++) assert.equal(await entrar(curioso, 'ZZZZZZZZ'), null);

    assert.equal(await falhaComo(curioso, "select public.entrar_na_lista('ZZZZZZZZ')"), 'P0001');
    // Nem o código certo passa enquanto está bloqueado.
    assert.equal(
      await falhaComo(curioso, 'select public.entrar_na_lista($1)', [listaDona.codigo_convite]),
      'P0001',
    );

    await db.query(
      "update privado.tentativas_convite set inicio = now() - interval '61 minutes' where user_id = $1",
      [curioso],
    );
    assert.equal(await entrar(curioso, listaDona.codigo_convite), listaDona.lista_id);
  });

  it('ninguém lê nem altera a contagem pela API', async () => {
    const paulo = await pessoa('Paulo');
    await entrar(paulo, 'ZZZZZZZZ');
    assert.equal(await falhaComo(paulo, 'select * from privado.tentativas_convite'), '42501');
  });
});
