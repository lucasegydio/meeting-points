# meeting.points — prévia local

## Atualização atual — primeira review real e nova TV

- `hopecore`, de Anatole Muster, é o destaque principal e integra a pilha de cinco discos. Texto integral de Lucas, 19 parágrafos, preservado do Visioncraft Music com autorização do autor e link de origem. Nota original: 10. Os demais textos continuam identificados como demonstrativos. Capa original de 3000 × 3000, variantes WebP sem ampliação e 13 faixas do catálogo Apple.
- Narração de teste em português brasileiro: aproximadamente 4min48s, voz sintética `pt-BR-AntonioNeural`, sem clonagem. O roteiro conversado fica separado do texto original e pode ser aberto no bloco do player. MP3 em `dist/audio/hopecore-review.mp3`; player persiste entre rotas, enquanto o navegador permitir. Servidor suporta MIME de áudio e byte ranges para avanço/retrocesso. A qualidade expressiva da voz ainda deve ser avaliada pelo Lucas.
- Pilha silenciosa: sem instrução, botão ou confirmação visual de reordenação. Feedback somente na disposição das capas; anúncio continua disponível para leitores de tela. Alt + setas continua como alternativa de teclado. Preferência salva localmente.
- TV com quatro páginas: Big Beach Boutique II, IRIS, Nurture Live / Secret Sky e Alive 2007. Hero cinematográfico, imagens locais de 1280px fornecidas pelo YouTube, cards de programa, filtros, lista pessoal “Ver depois”, modo cinema, próxima sessão e capítulos quando publicados pela fonte. Sem reprodução automática ao entrar na página. Iniciar um vídeo pausa a narração para evitar áudio sobreposto.
- Pesquisa aprofundada incorporada às páginas: duração e data do upload distintas do ano do show, contexto, créditos, sugestões de escuta explicitamente editoriais e fontes ao lado das informações. Alive 2007 é identificado como montagem de fã publicada por Gavrilo., não filme oficial. Não se afirma resolução nativa 4K. Secret Sky inclui aviso de fotossensibilidade e distingue equipe do ambiente virtual de créditos de palco. Informações não confirmadas permanecem ausentes.
- TV: editar `scripts/tv-editorial.json`, executar `node scripts/build-tv-catalog.mjs`. Metadados primários consultados em 09/09/2026 estão em `scripts/research/tv-primary.json`. O importador editorial preserva a narração existente. Geração opcional usa `scripts/narrate-review.py` e edge-tts em `.motion-analysis/voice-deps` na pasta superior; depois executar `node scripts/attach-narration.mjs`. Nenhuma credencial é embutida no site.
- Verificado: sintaxe, renderização e interações em testes locais de lógica/DOM simulado (15 reviews, texto integral, áudio, quatro programas, capítulos, cinema, lista pessoal, drag, moods e modal); decodificação integral do MP3; HTTP 200/206/416; comentários persistentes e validação de notas inteiras. Não houve inspeção visual nem reprodução dos embeds em navegador nesta etapa; disponibilidade dos vídeos depende do YouTube.
- Prévia exclusivamente local em http://127.0.0.1:4173. As seções abaixo registram o histórico e podem descrever versões anteriores.

## Atualização — busca, TV, moods e interação

- Links em artistas, gêneros, anos de lançamento e nomes dos créditos levam a `#busca?q=…&tipo=…`. Pessoas são pesquisadas tanto como artista principal quanto nos créditos/contribuições de qualquer faixa. A busca textual também inclui faixas. O filtro de ano clicado usa o lançamento; o seletor original continua sendo ano de escuta.
- Pilha de cinco discos: arraste uma capa para uma das cinco posições reveladas durante o gesto. Mouse/toque com limite de arraste, cancelamento, separação de clique e teclado (Alt + setas). `Reordenar` revela controles alternativos. Ordem é preferência local do visitante, não modifica a curadoria de outros usuários. Em falhas de armazenamento a interface informa que não salvou.
- Sombra aplicada à própria capa, sem a antiga placa rígida por baixo. Mola compartilhada pela pilha e pelas capas das reviews. `stack-interaction.js` e `card-tilt.js` substituem a interação anterior. Capa/contracapa folheiam com deslocamento lateral e retorno inspirado no vídeo `ssstwitter.com_1788960287512.mp4`; os originais seguem no pop-up. Botões e swipe alternam o lado; clicar amplia.
- Imagem editorial sempre quadrada. Cards de mood inspirados em `Captura de tela 2026-09-09 083248.png`: Desacelerar, Explorar e Ganhar energia, cada um com montagem visual, três sugestões de discos e modo imersivo. Preferência de mood guardada apenas no navegador. Usa referências fornecidas por Lucas, para prévia privada.
- Fundo azul/rosa discreto reage à rolagem, sem interceptar interações. Preferência por movimento reduzido respeitada.
- TV: set Sam Gellaitry / Boiler Room London (YouTube) e trecho de 47 s Floating Points / Ocotillo, Live at Outernet (Vimeo / Hamill Industries). URLs e embeds conferidos pelos serviços de oEmbed; disponibilidade futura ou regional depende das plataformas. Carregamento somente por clique, filtro de plataforma e um vídeo ativo por vez. Fontes visíveis na interface.
- Burial: bloco reservado para áudio. O visitante pode testar um arquivo local (até 200 MB), sem upload e sem gravação fictícia. Player fora do conteúdo de rota continua ao navegar; controles nativos e Media Session quando suportados. Pode continuar em outra aba/app enquanto o navegador permitir e permanecer aberto. Não persiste ao recarregar nem toca com o navegador fechado. Quando o áudio real chegar, preencher `audioReview.src`; revisar o texto para ser sua transcrição real, pois hoje é ilustrativo.
- Testes de implementação: `.motion-analysis/check-experience.mjs` na pasta superior (usa LinkeDOM instalado apenas nessa área de testes), mais teste da faixa horizontal e sintaxe de todos os módulos. Cobrem 14 reviews, links sem âncoras aninhadas, busca cruzada, gestos/reordenação, armazenamento, mola, frente/verso e TV. Não foi realizado teste visual em navegador nesta etapa.

Próximo passo editorial: receber a primeira review real e, se houver, o arquivo de áudio correspondente.

## Atualização — identidade, interação e fichas técnicas

- Nome definido: **meeting.points**. Card de textos simples novamente, sem selo/serifa/rodapé rosa; identidade azul e rosa preservada no restante.
- Capas da pilha abrem diretamente suas reviews ao clicar. Inclinação reativa ao ponteiro com interpolação de mola, retorno suave e respeito à preferência por movimento reduzido. Cinco destaques; Untrue incluído. A barra horizontal nativa foi ocultada; setas e controle compacto permanecem.
- **Untrue — Burial**: review demonstrativa, capa original 1400 × 1400 e encarte de capa/contracapa 3340 × 1468. Arquivos originais preservados, sem ampliação artificial. Pop-up alterna frente e verso; a imagem do verso inclui o encarte completo da edição verificada no MusicBrainz/Cover Art Archive.
- BPMs e créditos aparecem por faixa, com links das fontes. Créditos reunidos da produção/composição/mixagem/masterização têm expansão para manter a página compacta. Fontes consultadas: Deezer, MusicBrainz, Qobuz, créditos oficiais do Bandcamp e identificação de remixes no Spotify. Valores ausentes não são estimados; BPM zero retornado por API significa dado ausente.
- Scripts de complemento: `node scripts/enrich-track-details.mjs` e depois `node scripts/import-qobuz-credits.mjs`. O segundo preserva dados existentes e incorpora `scripts/verified-credit-overrides.json`. Auditorias registram cobertura e falhas, não garantem ficha completa. `add-untrue.mjs` é importador inicial; não reexecutar indiscriminadamente sobre uma ficha já enriquecida.
- Validação desta etapa: sintaxe, renderização das 14 fichas, cinco destaques, dez cards iniciais, filtros, links, mola, gestos, teclado, controles da faixa e persistência/segurança de comentários. Sem inspeção visual em navegador nesta etapa.

### Registro da etapa anterior (implementado na atualização acima)

- Palavras-chave clicáveis: gênero, produtor, artista e ano. Busca unificada deve cruzar autoria e participação, não só o artista principal (ex.: Mike Dean).
- **TV**: seleção de shows disponíveis em YouTube e Vimeo, com embeds. Sem vídeos ou integrações criados nesta etapa.

Os registros abaixo documentam etapas anteriores e podem descrever comportamentos já substituídos.

## Versão local atual — azul, rosa e comentários

- Iniciar com `npm run dev` (Node 24 ou superior). Prévia em http://127.0.0.1:4173. O servidor deve permanecer ligado; o antigo servidor Python não atende os comentários.
- Comentários com nick, texto e nota inteira 0–10 ficam em `.data/comments.sqlite`, fora dos arquivos públicos e do Git. Persistem entre reinícios e são compartilhados entre os navegadores que acessam este servidor. Não existe ainda uma publicação pública dessa base.
- `npm run test:comments` verifica persistência após reiniciar, validação de notas, isolamento por álbum, repetição segura de envio e validação da origem, usando uma base temporária independente na porta 4174.
- Capa da review com proporção explícita, altura automática, botão de ampliação e diálogo central sobre fundo desfocado. Fechamento pelo botão, Escape ou clique fora; foco retorna ao botão. Contracapas, quando cadastradas, aparecem atrás no hover/foco e também têm acesso por toque no botão “Ver contracapa”.
- `npm run sync:backs` consulta somente edições verificadas no MusicBrainz e procura imagens aprovadas como Back no Cover Art Archive. Fontes e arquivos originais são preservados. Auditoria em `scripts/back-covers-audit.json`; nenhum verso foi encontrado nas edições atuais. Campos opcionais: `backCover`, `backCoverOriginal`, `backCoverSource`.
- Notas demonstrativas existentes arredondadas para inteiros. Azul elétrico em ações, navegação, filtros e acentos; rosa nas notas e rodapé do card editorial. O card de Textos usa linhas próprias para conteúdo e rodapé, sem sobreposição. Estilos atuais de acabamento em `dist/review.css`.
- Hospedagem anterior pertence à conta anterior e não está acessível pela conta atual. Esta revisão está disponível localmente. O manifesto estático antigo não publica a API Node/SQLite; uma futura publicação precisa de adaptação do servidor e armazenamento.

As seções abaixo registram etapas anteriores do projeto.

## Estrutura atual — revisão 4

- Pilha editorial independente com exatamente cinco IDs em `featuredIds` (app.js). Não muda ao filtrar a coleção.
- Coleção e arquivo em uma faixa horizontal, com cards inspirados em Novas Refs: capa quadrada preservada, ficha clara, borda pontilhada, tipografia editorial e cor discreta da arte. Setas, slider de posição, teclado, toque, trackpad e arraste com mouse.
- Importador multifuente executado na atualização do site: `npm run sync:catalog`. Usa Apple/iTunes, Deezer, MusicBrainz e Cover Art Archive. Cache local de sete dias, ritmo de MusicBrainz, timeouts, tentativas para respostas temporárias, preservação de dados e imagens já confirmados. Não faz requisições a essas APIs a cada visita, nem promete disponibilidade universal.
- Originais mantidos em `dist/assets/hq`; variantes WebP responsivas sem ampliação artificial. A ficha permite abrir o original. Fonte e dimensões registradas por álbum; auditoria em `scripts/catalog-audit.json`.
- Descrições são resumos factuais construídos com metadados confirmados, não textos promocionais oficiais. Reviews fictícias continuam separadas. Créditos de produção ainda não disponíveis.
- Cyst: título canônico `ᲘᲘ`, com alias `00` para busca, resolvido por ID verificado e conferência da capa. Exceções persistidas em `scripts/catalog-overrides.json`.

Documentação das fontes: https://musicbrainz.org/doc/MusicBrainz_API e https://musicbrainz.org/doc/Cover_Art_Archive/API. O processador de imagens usa Sharp do ambiente de desenvolvimento; em outro ambiente pode-se definir FREQUENCIA_NODE_MODULES ou disponibilizar Sharp localmente.

Verificações desta revisão: renderização das 13 fichas, cinco destaques, 13 cards horizontais, independência dos filtros, metadados e caminhos das variantes; controles da faixa e pilha em testes de lógica. Conferência visual das capas em comparação com referências. Sem teste visual do site em navegador nesta sessão.

## Seleção atual — revisão 3

13 lançamentos fornecidos pelo usuário, reviews e notas fictícias, gêneros editoriais provisórios e identidade laranja/cobre. Busca sem distinção de acentos, filtro por gênero combinado com ano/busca, contagem e limpeza de filtros. Pilha ajustada dinamicamente para 13 capas.

Fonte da seleção: `scripts/selection.json`; importador atual: `scripts/import-selection.mjs`. Sete correspondências exatas no catálogo Apple/iTunes; demais capas extraídas das imagens enviadas, sem faixas inventadas. Título de Zeds Dead mantido parcial como na referência. Os assets anteriores foram preservados para recuperação, mas não aparecem na coleção.

Protótipo navegável com home, arquivo por ano de escuta, busca, ordenação por nota, detalhes de álbum e faixas, texto demonstrativo e mood board.

Nome provisório. Notas, anos de escuta, recomendação e reviews são exemplos, não conteúdo atribuído ao Lucas. Capas, títulos, datas e faixas foram consultados no catálogo Apple/iTunes em 9 de setembro de 2026. As imagens do mood board são referências fornecidas pelo usuário, para revisão privada.

## Executar

`npm run dev` — http://127.0.0.1:4173

`npm run check` — verifica a sintaxe JavaScript.

O conteúdo servido está em `dist`. O catálogo está em `dist/catalog.json`; os arquivos originais de referência permanecem na pasta superior. `scripts/fetch-catalog.mjs` consulta dados públicos para regenerar os exemplos. Não existe busca de catálogo em tempo real na interface desta versão.

## Movimento — revisão 2

Referência principal: `2026-09-09 08-43-01.mp4`, analisada por quadros de 0–16 s e uma sequência com 4 quadros por segundo. Capas em planos inclinados, seleção que se levanta e legenda ao lado inspiraram a visualização Pilha. As demais referências mostram navegação de discos, abertura de capas e profundidade.

Home inicia na pilha; arquivo mantém a grade. Ambos permitem alternar a visualização. Seleção por mouse, foco, setas, botões anterior/próximo e gesto horizontal no toque. Links para a review ficam separados da seleção da capa. Filtros e ordenação preservados. Entradas via IntersectionObserver, profundidade por ponteiro e animações CSS. Movimento reduzido respeitado; não há rolagem automática nem avanço automático da seleção.

## Próximas etapas

Painel privado com autenticação, armazenamento persistente de reviews e textos, importação de álbuns, upload de imagens, anotações por faixa e edição da recomendação semanal. BPM, produção e letras completas não foram integrados. Genius abre uma busca externa; Apple Music abre a página oficial, sem simular reprodução.

## Verificação

Conferir sintaxe, arquivos referenciados, seis registros e faixas no catálogo e resposta HTTP da home. Interface adaptativa por CSS, ainda sem teste visual em navegador. WebMCP opcional e detectado por capacidade: `filter_album_archive`; não validado em contexto WebMCP compatível nesta sessão.
