// Servidor da versão web exportada (`npx expo export -p web`) para os testes de ponta a ponta.
// Segue as mesmas regras do vercel.json: endereços sem ".html", as reescritas das rotas
// dinâmicas e o 404 com a página "não encontrada".
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join } from 'node:path';

const PASTA = process.env.E2E_PASTA ?? 'dist';
const PORTA = Number(process.env.E2E_PORTA ?? 8150);
const vercel = JSON.parse(readFileSync('vercel.json', 'utf8'));

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
};

/** "/presente/:codigo" -> /^\/presente\/[^/]+$/ */
const reescritas = vercel.rewrites.map(({ source, destination }) => ({
  padrao: new RegExp(`^${source.replace(/:[^/]+/g, '[^/]+')}$`),
  destino: destination,
}));

function arquivo(caminho) {
  const candidato = join(PASTA, caminho);
  if (existsSync(candidato) && statSync(candidato).isFile()) return candidato;
  if (existsSync(`${candidato}.html`)) return `${candidato}.html`;
  return undefined;
}

createServer((req, res) => {
  let caminho = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (caminho === '/') caminho = '/index';
  // Arquivos que existem (como /item/novo) vêm antes das reescritas, como na Vercel.
  let encontrado = arquivo(caminho);
  if (!encontrado) {
    const reescrita = reescritas.find(({ padrao }) => padrao.test(caminho));
    if (reescrita) encontrado = arquivo(reescrita.destino);
  }
  const status = encontrado ? 200 : 404;
  encontrado ??= join(PASTA, '+not-found.html');
  res.writeHead(status, {
    'Content-Type': TIPOS[extname(encontrado)] ?? 'application/octet-stream',
  });
  createReadStream(encontrado).pipe(res);
}).listen(PORTA, () => console.log(`Versão web em http://localhost:${PORTA} (${PASTA})`));
