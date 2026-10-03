# Métricas de uso

Consultas prontas para acompanhar as métricas do [`PLANO.md`](../PLANO.md) (seção 8) quando o app
tiver pessoas usando. Elas são úteis também para contar em entrevistas quantas pessoas usam o
app e como.

O app não tem rastreamento nem ferramenta de analytics, e os formulários de privacidade das lojas
dizem isso. Os números saem dos dados que o app já guarda, sempre somados: nenhuma consulta
mostra quem é quem.

Para rodar, abra o painel do Supabase, projeto **enxoval** → **SQL Editor**, cole uma consulta e
clique em **Run**. Todas só leem dados.

## Pessoas

Quantas contas existem e quantas entraram recentemente.

```sql
select count(*) as pessoas,
       count(*) filter (where created_at > now() - interval '30 days') as novas_30_dias,
       count(*) filter (where last_sign_in_at > now() - interval '7 days') as entraram_7_dias,
       count(*) filter (where last_sign_in_at > now() - interval '30 days') as entraram_30_dias
from auth.users;
```

"Entrou" quer dizer que fez login. Quem continua logada e só abre o app não conta de novo, então
use as métricas de lista abaixo para saber quem volta.

## Ativação e retenção

- **Ativação:** quantas listas têm 10 itens ou mais.
- **Retenção:** quantas listas foram alteradas 7 e 30 dias depois de criadas. É uma aproximação,
  porque olhar a lista sem mudar nada não deixa rastro.

```sql
with por_lista as (
  select l.id,
         l.criada_em,
         count(i.id) filter (where not i.removido) as itens,
         count(i.id) filter (where not i.removido and i.comprado) as comprados,
         max(i.atualizado_em) as ultima_alteracao
  from public.listas l
  left join public.itens i on i.lista_id = l.id
  -- Só listas em uso pela dona: a lista própria de quem é convidado fica parada.
  where exists (select 1 from public.membros_lista m where m.user_id = l.dona_id and m.lista_id = l.id)
  group by l.id, l.criada_em
)
select count(*) as listas,
       count(*) filter (where itens >= 10) as com_10_itens_ou_mais,
       round(100.0 * count(*) filter (where itens >= 10) / nullif(count(*), 0), 1) as ativacao_pct,
       count(*) filter (where criada_em < now() - interval '7 days') as listas_com_7_dias,
       count(*) filter (where criada_em < now() - interval '7 days'
                          and ultima_alteracao >= criada_em + interval '7 days') as voltaram_depois_de_7_dias,
       count(*) filter (where criada_em < now() - interval '30 days') as listas_com_30_dias,
       count(*) filter (where criada_em < now() - interval '30 days'
                          and ultima_alteracao >= criada_em + interval '30 days') as voltaram_depois_de_30_dias,
       round(avg(itens), 1) as media_de_itens,
       round(100.0 * sum(comprados) / nullif(sum(itens), 0), 1) as comprados_pct
from por_lista;
```

Para a retenção, compare `voltaram_depois_de_7_dias` com `listas_com_7_dias`, porque só faz
sentido contar as listas que já têm 7 dias. O mesmo vale para 30 dias.

Só entram as listas de quem fez login. Quem usa o app sem conta não aparece em nenhuma consulta.

## Compartilhamento

```sql
select count(distinct lista_id) filter (where not e_dona) as listas_compartilhadas,
       count(*) filter (where not e_dona) as convidados,
       count(*) filter (where not e_dona and pode_editar_lista) as podem_editar_a_lista,
       count(*) filter (where not e_dona and not pode_editar_lista and pode_editar_precos) as so_precos
from public.membros_lista;
```

## Preços informados

Quantos preços as pessoas digitaram nos últimos 180 dias e quantos itens já têm referência
própria, ou seja, 5 pessoas ou mais informando.

```sql
select count(*) as precos_informados,
       count(distinct user_id) as pessoas,
       count(distinct catalogo_id) as itens,
       (select count(*) from public.referencia_precos()) as itens_com_referencia_propria
from public.precos_informados
where dia > current_date - 180;
```

## Itens mais escolhidos

Os 15 itens que mais aparecem nas listas e em quantas já foram comprados. Ajuda a revisar o
catálogo.

```sql
select coalesce(catalogo_id, '(item próprio)') as item,
       count(*) as listas,
       count(*) filter (where comprado) as comprado_em
from public.itens
where not removido
group by 1
order by 2 desc
limit 15;
```
