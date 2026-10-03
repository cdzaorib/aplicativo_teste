// Testes das regras do banco: aplica todas as migrações num Postgres local (PGlite) e simula
// pessoas usando a API, com o papel `authenticated` e o usuário no token, como o Supabase faz.
// Cada teste roda numa transação desfeita no fim. Rode com `npm run test:supabase`.
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

describe('ofertas', () => {
  /** Oferta gravada como a coleta grava (com a chave secreta, fora das regras de acesso). */
  async function oferta(catalogoId, produtoId, precoCentavos) {
    await db.query(
      `insert into public.ofertas (catalogo_id, loja, produto_id, nome, preco_min_centavos,
         preco_max_centavos, link)
       values ($1, 'shopee', $2, 'Produto', $3, $3, 'https://shopee.com.br/produto')`,
      [catalogoId, produtoId, precoCentavos],
    );
  }

  it('qualquer pessoa vê as ofertas, com ou sem login', async () => {
    await oferta('berco', '1', 89900);
    const gabi = await pessoa('Gabi');
    assert.equal((await como(null, 'select * from public.ofertas')).length, 1);
    assert.equal((await como(gabi, 'select * from public.ofertas')).length, 1);
  });

  it('só a coleta grava: pela API ninguém cria, muda ou apaga ofertas', async () => {
    await oferta('berco', '1', 89900);
    const gabi = await pessoa('Gabi');
    const inserir = `insert into public.ofertas (catalogo_id, loja, produto_id, nome,
        preco_min_centavos, preco_max_centavos, link)
      values ('berco', 'shopee', '2', 'Falsa', 100, 100, 'https://exemplo.com')`;
    assert.equal(await falhaComo(null, inserir), '42501');
    assert.equal(await falhaComo(gabi, inserir), '42501');
    assert.equal(
      await falhaComo(gabi, 'update public.ofertas set preco_min_centavos = 1'),
      '42501',
    );
    assert.equal(await falhaComo(gabi, 'delete from public.ofertas'), '42501');
    assert.equal(
      await falhaComo(
        gabi,
        "insert into public.historico_ofertas values ('berco', 'shopee', current_date, 1, 1, 1)",
      ),
      '42501',
    );
  });

  it('recusa oferta com preço inválido', async () => {
    await db.exec('savepoint antes');
    await assert.rejects(oferta('berco', '3', 0));
    await db.exec('rollback to savepoint antes');
  });
});

describe('tempo real', () => {
  it('avisa só as mudanças dos itens e das pessoas da lista', async () => {
    const { rows } = await db.query(
      `select schemaname || '.' || tablename as tabela from pg_publication_tables
       where pubname = 'supabase_realtime' order by 1`,
    );
    assert.deepEqual(
      rows.map((linha) => linha.tabela),
      ['public.itens', 'public.membros_lista', 'public.presentes'],
    );
  });
});

describe('quem comprou', () => {
  const comprador = async (id) =>
    (await db.query('select comprado_por from public.itens where id = $1', [id])).rows[0]
      .comprado_por;

  it('registra quem marcou como comprado e apaga ao desmarcar', async () => {
    const { dona, convidado } = await listaCompartilhada();
    await como(dona, 'select public.definir_permissoes($1, true, false)', [convidado]);

    await como(convidado, "update public.itens set comprado = true where id = 'berco-dona'");
    assert.equal(await comprador('berco-dona'), convidado);

    await como(dona, "update public.itens set comprado = false where id = 'berco-dona'");
    assert.equal(await comprador('berco-dona'), null);

    await como(dona, "update public.itens set comprado = true where id = 'berco-dona'");
    assert.equal(await comprador('berco-dona'), dona);
  });

  it('ninguém troca o comprador pela API, nem ao editar o preço', async () => {
    const { dona, convidado } = await listaCompartilhada();
    await como(dona, "update public.itens set comprado = true where id = 'berco-dona'");
    await como(dona, 'select public.definir_permissoes($1, true, false)', [convidado]);

    await como(convidado, "update public.itens set comprado_por = $1 where id = 'berco-dona'", [
      convidado,
    ]);
    await como(convidado, "update public.itens set preco_centavos = 59900 where id = 'berco-dona'");
    assert.equal(await comprador('berco-dona'), dona);

    // Item novo já marcado: vale quem criou, não o valor enviado.
    await como(
      convidado,
      `insert into public.itens (lista_id, id, nome, categoria, prioridade, comprado, comprado_por,
         criado_em, atualizado_em)
       select lista_id, 'banheira', 'Banheira', 'higiene', 'util', true, $1, now(), now()
       from public.membros_lista where user_id = $2`,
      [dona, convidado],
    );
    assert.equal(await comprador('banheira'), convidado);
  });

  it('esquece o comprador que excluiu a conta, sem mexer no item', async () => {
    const { dona, convidado } = await listaCompartilhada();
    await como(dona, 'select public.definir_permissoes($1, true, false)', [convidado]);
    await como(convidado, "update public.itens set comprado = true where id = 'berco-dona'");

    await db.query('delete from auth.users where id = $1', [convidado]);

    const { rows } = await db.query(
      "select comprado, comprado_por from public.itens where id = 'berco-dona'",
    );
    assert.deepEqual(rows, [{ comprado: true, comprado_por: null }]);
  });
});

describe('lista de presentes', () => {
  /** Dona com dois itens na lista de presentes, um fora dela, e o link criado. */
  async function listaDePresentes() {
    const compartilhada = await listaCompartilhada();
    const { dona, listaDona } = compartilhada;
    await item(listaDona.lista_id, 'banheira', 'banheira', 'Banheira');
    await item(listaDona.lista_id, 'absorvente', 'absorvente-pos-parto', 'Absorvente pós-parto');
    await como(
      dona,
      `insert into public.presentes (lista_id, item_id) values ($1, 'berco-dona'), ($1, 'banheira')`,
      [listaDona.lista_id],
    );
    const [{ codigo }] = await como(dona, 'select public.criar_link_presentes() as codigo');
    return { ...compartilhada, codigo };
  }
  const ver = async (codigo) =>
    (await como(null, 'select public.ver_lista_presentes($1) as lista', [codigo]))[0].lista;
  const reservar = async (codigo, itemId, nome) =>
    (
      await como(null, 'select public.reservar_presente($1, $2, $3) as chave', [
        codigo,
        itemId,
        nome,
      ])
    )[0].chave;

  it('cria um link secreto, o mesmo da segunda vez, só para quem edita a lista', async () => {
    const { dona, convidado, codigo } = await listaDePresentes();
    assert.match(codigo, /^[A-HJ-NP-Z2-9]{16}$/);
    assert.equal(
      (await como(dona, 'select public.criar_link_presentes() as codigo'))[0].codigo,
      codigo,
    );
    assert.equal(await falhaComo(convidado, 'select public.criar_link_presentes()'), '42501');
    assert.equal(await falhaComo(null, 'select public.criar_link_presentes()'), '42501');
  });

  it('o convidado sem login vê só os itens escolhidos e o primeiro nome da dona', async () => {
    const { codigo } = await listaDePresentes();
    const lista = await ver(`${codigo.slice(0, 8).toLowerCase()}-${codigo.slice(8)}`);
    assert.equal(lista.nome, 'Gabi');
    assert.deepEqual(
      lista.itens.map((i) => [i.nome, i.situacao]),
      [
        ['Banheira', 'livre'],
        ['berco-dona', 'livre'],
      ],
    );
    assert.equal(JSON.stringify(lista).includes('@'), false); // nenhum e-mail
  });

  it('um código inventado não abre a lista de ninguém', async () => {
    await listaDePresentes();
    assert.equal(await ver('AAAAAAAAAAAAAAAA'), null);
    assert.equal(await ver(''), null);
    assert.equal(await ver(null), null);
    assert.equal(
      await falhaComo(
        null,
        "select public.reservar_presente('AAAAAAAAAAAAAAAA', 'banheira', 'Tia')",
      ),
      'P0001',
    );
  });

  it('cada presente só pode ser escolhido uma vez, e só os da lista', async () => {
    const { codigo } = await listaDePresentes();
    assert.ok(await reservar(codigo, 'banheira', '  Tia Maria  '));
    const lista = await ver(codigo);
    assert.equal(lista.itens.find((i) => i.id === 'banheira').situacao, 'reservado');
    // O convidado não vê quem escolheu.
    assert.equal(JSON.stringify(lista).includes('Maria'), false);

    for (const [itemId, nome] of [
      ['banheira', 'Tio João'], // já escolhido
      ['absorvente', 'Tio João'], // fora da lista de presentes
      ['berco-dona', '   '], // sem nome
      ['berco-dona', 'x'.repeat(61)], // nome longo demais
    ]) {
      assert.equal(
        await falhaComo(null, 'select public.reservar_presente($1, $2, $3)', [
          codigo,
          itemId,
          nome,
        ]),
        'P0001',
      );
    }
  });

  it('quem está na lista vê quem escolheu; quem é de fora não vê nada', async () => {
    const { dona, convidado, codigo } = await listaDePresentes();
    await reservar(codigo, 'banheira', 'Tia Maria');
    const daDona = await como(
      dona,
      "select reservado_por from public.presentes where item_id = 'banheira'",
    );
    assert.deepEqual(daDona, [{ reservado_por: 'Tia Maria' }]);
    assert.equal((await como(convidado, 'select * from public.presentes')).length, 2);
    const estranho = await pessoa('Estranho');
    assert.equal((await como(estranho, 'select * from public.presentes')).length, 0);
    assert.equal((await como(estranho, 'select * from public.links_presentes')).length, 0);
    assert.equal((await como(null, 'select * from public.presentes')).length, 0);
  });

  it('desfaz com a chave certa; com outra chave, não', async () => {
    const { codigo } = await listaDePresentes();
    const chave = await reservar(codigo, 'banheira', 'Tia Maria');
    assert.equal(
      await falhaComo(null, 'select public.desfazer_reserva_presente($1, $2, $3)', [
        codigo,
        'banheira',
        randomUUID(),
      ]),
      'P0001',
    );
    await como(null, 'select public.desfazer_reserva_presente($1, $2, $3)', [
      codigo,
      'banheira',
      chave,
    ]);
    assert.equal((await ver(codigo)).itens.find((i) => i.id === 'banheira').situacao, 'livre');
  });

  it('pela API, ninguém reserva nem muda o link direto na tabela', async () => {
    const { dona, convidado, listaDona } = await listaDePresentes();
    await como(dona, 'select public.definir_permissoes($1, true, false)', [convidado]);
    assert.equal(
      await falhaComo(convidado, "update public.presentes set reservado_por = 'Eu'"),
      '42501',
    );
    assert.equal(
      await falhaComo(
        convidado,
        `insert into public.presentes (lista_id, item_id, reservado_por) values ($1, 'absorvente', 'Eu')`,
        [listaDona.lista_id],
      ),
      '42501',
    );
    assert.equal(
      await falhaComo(dona, "update public.links_presentes set codigo = 'FACIL'"),
      '42501',
    );
  });

  it('quem não edita a lista não inclui, não tira nem libera presentes', async () => {
    const { convidado, listaDona, codigo } = await listaDePresentes();
    await reservar(codigo, 'banheira', 'Tia Maria');
    assert.equal(
      await falhaComo(
        convidado,
        `insert into public.presentes (lista_id, item_id) values ($1, 'absorvente')`,
        [listaDona.lista_id],
      ),
      '42501',
    );
    const tirados = await como(convidado, 'delete from public.presentes returning item_id');
    assert.equal(tirados.length, 0);
    assert.equal(await falhaComo(convidado, "select public.liberar_presente('banheira')"), '42501');
  });

  it('a dona libera um presente e troca o link; o link antigo para de funcionar', async () => {
    const { dona, codigo } = await listaDePresentes();
    await reservar(codigo, 'banheira', 'Brincadeira');
    await como(dona, "select public.liberar_presente('banheira')");
    await reservar(codigo, 'berco-dona', 'Vovó');

    const [{ novo }] = await como(dona, 'select public.trocar_link_presentes() as novo');
    assert.notEqual(novo, codigo);
    assert.equal(await ver(codigo), null);
    const lista = await ver(novo);
    assert.deepEqual(
      lista.itens.map((i) => [i.id, i.situacao]),
      [
        ['banheira', 'livre'],
        ['berco-dona', 'reservado'],
      ],
    );
  });

  it('item comprado ou removido não pode ser escolhido', async () => {
    const { dona, codigo } = await listaDePresentes();
    await como(dona, "update public.itens set comprado = true where id = 'banheira'");
    await como(dona, "update public.itens set removido = true where id = 'berco-dona'");
    const lista = await ver(codigo);
    assert.deepEqual(
      lista.itens.map((i) => [i.id, i.situacao]),
      [['banheira', 'comprado']],
    );
    assert.equal(
      await falhaComo(null, 'select public.reservar_presente($1, $2, $3)', [
        codigo,
        'banheira',
        'Tia',
      ]),
      'P0001',
    );
  });

  it('excluir a conta da dona apaga o link e a lista de presentes', async () => {
    const { dona, codigo } = await listaDePresentes();
    await db.query('delete from auth.users where id = $1', [dona]);
    assert.equal(await ver(codigo), null);
    const { rows } = await db.query('select count(*)::int as n from public.presentes');
    assert.equal(rows[0].n, 0);
  });
});
