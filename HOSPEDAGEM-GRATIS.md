# meeting.points — hospedagem gratis

Este projeto pode rodar de dois jeitos:

## 1. Site completo, com central, catalogo e comentarios

Use um servico que rode Node.js, como Render, Railway, Fly.io ou um servidor proprio.

Configuracao recomendada:

- Build command: deixe vazio, ou use `npm install` caso o servico peca um comando.
- Start command: `npm run dev`
- Porta: o servidor usa `PORT` automaticamente quando o servico define, e `4173` no computador local.

Depois de publicar, abra a URL do servico. A central fica em:

`/admin.html`

## 2. Site estatico no GitHub Pages

Use a pasta `dist`.

Essa opcao abre o site visualmente, mas nao mantem as APIs locais de comentarios, publicacao pela central e enriquecimento automatico. Para testar tudo como no computador, prefira a opcao completa com Node.js.

