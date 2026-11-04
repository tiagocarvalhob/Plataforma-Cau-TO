# Edital CAU-TO: plataforma de estudos

Plataforma para acompanhar os estudos do concurso do **CAU-TO 2026, cargo 200: Assistente Administrativo** (Instituto Quadrix, prova objetiva de certo ou errado prevista para 13/12/2026).

Ela organiza o edital verticalizado e liga cada assunto a **aulas e vídeos de resolução de questões que já existem no YouTube**. A plataforma não tem conteúdo próprio: não há apostilas, resumos, textos explicativos nem questões escritas por ela. Assunto sem vídeo adequado aparece como **Conteúdo não encontrado**.

## O que tem

- **Edital verticalizado**: os 77 assuntos do item 18.2 do Edital nº 1/2026, na ordem e com o texto do edital, separados em conhecimentos básicos (Língua Portuguesa, Raciocínio Lógico e Matemática, Noções de Informática), complementares (Legislação e Ética na Administração Pública) e específicos. Há busca e filtros por disciplina e status.
- **Mini player**: usa o player oficial incorporado do YouTube. Ele fica fixo no canto enquanto você navega, mostra o assunto e o título da aula, pode ser ampliado, recolhido ou fechado, e passa para o vídeo anterior ou o próximo, inclusive dentro de playlists. Se o dono do vídeo não permitir incorporação, o player avisa e mostra o botão para abrir no YouTube.
- **Status por assunto**: Não iniciado, Em andamento, Concluído e Revisão pendente, sempre marcado por você. O tempo assistido de cada vídeo é registrado sozinho, mas **assistir não conclui o assunto**. Ao dar play numa aula de um assunto não iniciado, ele passa para "em andamento".
- **Percentuais**: por assunto (tempo assistido), por disciplina e do edital inteiro. O percentual geral é ponderado pelos itens da prova: 40 básicos (divididos igualmente entre as 3 disciplinas, porque o edital não detalha), 30 complementares e 50 específicos. Também mostra quantos assuntos estão concluídos, em andamento e não iniciados.
- **Cronograma automático**: distribui os assuntos que faltam pelos dias de estudo até a véspera da prova, por semana e por dia. Alterna as disciplinas, coloca no máximo um assunto pesado por dia (configurável) e deixa os últimos dias livres para revisão. Se você atrasar, ele refaz os dias seguintes e marca o assunto como "reagendado"; o que já foi concluído continua registrado no dia em que foi estudado.
- **Revisões espaçadas**: cada assunto concluído gera revisões 1, 7, 15 e 30 dias depois (intervalos configuráveis). Elas aparecem no cronograma, no painel e na tela de revisões, separadas em hoje, atrasadas, próximas e concluídas. Concluir uma revisão grava a data.
- **Vídeos de questões nas revisões**: cada revisão indica um vídeo de resolução de questões do YouTube daquele assunto, um diferente por revisão quando existe mais de um.
- **Progresso salvo**: tudo fica no `localStorage` do navegador e continua lá depois de atualizar a página ou fechar o navegador. Em Ajustes dá para exportar o progresso num arquivo JSON e importar em outro aparelho.

## Como rodar

Não precisa instalar nada além de um navegador. Como o player do YouTube não funciona abrindo o arquivo direto (`file://`), sirva a pasta com qualquer servidor estático:

```bash
git clone https://github.com/<seu-usuario>/plataforma-cau-to.git
cd plataforma-cau-to
python3 -m http.server 8000
```

Abra http://localhost:8000 no navegador.

### Publicar no GitHub Pages

No repositório, vá em **Settings → Pages**, em "Build and deployment" escolha **Deploy from a branch**, branch `main`, pasta `/ (root)`, e salve. Em um ou dois minutos o site fica em `https://<seu-usuario>.github.io/plataforma-cau-to/`.

## Estrutura

```
index.html              página única
css/style.css           visual (tema claro e escuro)
js/edital.js            assuntos do edital, com o texto original e o peso de cada área
js/videos.js            vídeos de cada assunto (gerado, não edite à mão)
js/app.js               telas, progresso, player, cronograma e revisões
dados/candidatos.txt    curadoria: assunto | a (aula) ou q (questões) | ID do vídeo ou PL:ID da playlist | título
dados/verificados.txt   links conferidos no oEmbed do YouTube
dados/quebrados.txt     links descartados (removidos, privados ou sem incorporação)
scripts/gerar_videos.py gera js/videos.js a partir de dados/
scripts/verificar_links.py confere os links no YouTube
scripts/relatorio.js    gera docs/cobertura.md
docs/relatorio.md       como a curadoria foi feita e o que ficou faltando
docs/cobertura.md       tabela de vídeos por assunto
```

## Atualizar os vídeos

1. Edite `dados/candidatos.txt` (uma linha por vídeo ou playlist).
2. Confira os links: `python3 scripts/verificar_links.py` (não precisa de chave de API; usa o oEmbed público do YouTube).
3. Gere o arquivo do site: `python3 scripts/gerar_videos.py`.
4. Opcional: `node scripts/relatorio.js > docs/cobertura.md`.

## Privacidade

O site não tem servidor, login, senhas nem chaves de API. O progresso fica só no seu navegador. Os vídeos tocam pelo domínio `youtube-nocookie.com`.

## Créditos

Os vídeos pertencem aos seus canais no YouTube e são exibidos pelo player oficial. O texto dos assuntos vem do Edital nº 1/2026 do CAU-TO. O layout de edital verticalizado foi inspirado em plataformas de estudo para concursos, sem usar marca, textos ou imagens de nenhuma delas.
