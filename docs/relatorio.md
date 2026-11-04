# Relatório da curadoria (04/11/2026)

## Edital analisado

Edital nº 1/2026 do CAU-TO, cargo 200: Assistente Administrativo, banca Instituto Quadrix. Prova objetiva de certo ou errado com 120 itens, prevista para 13/12/2026 à tarde. Os assuntos são os do item 18.2.

| Área | Disciplina | Assuntos | Itens na prova |
|---|---|---|---|
| Conhecimentos básicos | Língua Portuguesa | 14 | 40 itens no total da área (o edital não divide entre as disciplinas) |
| Conhecimentos básicos | Raciocínio Lógico e Matemática | 15 | |
| Conhecimentos básicos | Noções de Informática | 13 | |
| Conhecimentos complementares | Legislação e Ética na Administração Pública | 8 | 30 |
| Conhecimentos específicos | Assistente Administrativo | 27 | 50 |
| **Total** | | **77** | **120** |

Cada assunto da plataforma corresponde a um subitem numerado do edital, com o texto copiado sem resumo. Onde o edital agrupa vários temas num só subitem (por exemplo, a Lei nº 12.378/2010 inteira), o subitem foi mantido como um assunto só, com o texto completo.

## Como os vídeos foram escolhidos

- Busca no YouTube por assunto, com preferência para playlists completas e canais de concurso (Prof. Álvaro Ferreira, Professor Noslen, Pablo Jamilk, Focus Concursos, JC Concursos, Aprova Concursos e outros).
- Cada vídeo foi associado pelo conteúdo descrito na página do YouTube (título, descrição e capítulos que apareciam na busca), não só pela semelhança do título. Vídeos de outros cargos ou outras leis foram descartados.
- Para revisão, foram escolhidos vídeos de **resolução de questões já existentes** no YouTube, de preferência da banca Quadrix ou no formato certo ou errado.
- Nada foi escrito pela plataforma: não há resumo, apostila, aula escrita nem questão própria.

## Números

- 77 assuntos do edital.
- 74 assuntos com pelo menos uma aula.
- 281 links únicos: 141 aulas e 141 vídeos de questões (um link aparece nas duas listas), sendo 9 playlists.
- **68 links conferidos** no oEmbed do YouTube, que confirma que o vídeo existe e permite incorporação. Na tela, aparecem com o selo "link conferido".
- **213 links ainda não conferidos.** Eles vieram da busca do YouTube, mas a ferramenta de conferência ficou sem cota durante o trabalho. Aparecem com o selo "link não conferido". Para conferir tudo, rode `python3 scripts/verificar_links.py` e depois `python3 scripts/gerar_videos.py`. Se algum não abrir, o player avisa e mostra o botão "Abrir no YouTube".

## Assuntos sem conteúdo adequado

**Sem aula (aparecem como "Conteúdo não encontrado"):**

- **Legislação 7: Regimento Interno do CAU-TO.** Só foram encontrados vídeos sobre os regimentos de outros CAUs (RJ, CE, MS, SP), que são documentos diferentes. Não foram associados.
- **Específicos 5.4: Comportamento receptivo e defensivo.**
- **Específicos 5.5: Empatia e compreensão mútua.** Para esses dois, os vídeos encontrados eram de autoajuda ou de outros contextos, não de concurso.

**Sem vídeo de resolução de questões** (a revisão aparece com "vídeo de questões não encontrado"): Informática 2.2, 3.2 e 5.1; Específicos 3.3, 3.5, 4.2, 4.3, 5.1 e 6.4, além dos três acima.

**Cobertura fraca:** Informática 3.2 (Android e iOS) tem só um vídeo de canal geral de tecnologia, não de concurso. Está marcado assim no título.

A lista completa, assunto por assunto, está em [cobertura.md](cobertura.md).
