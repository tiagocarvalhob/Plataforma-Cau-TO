// Conteúdo programático do cargo 200 (Assistente Administrativo), copiado do
// Edital nº 1 do CAU-TO, de 6 de outubro de 2026 (Instituto Quadrix), item 18.2.
// O texto de cada assunto é o do edital, sem resumo nem acréscimo.
//
// Campos de cada assunto:
//   id    identificador interno (disciplina + número do edital)
//   n     número do subitem no edital
//   t     texto do subitem, exatamente como no edital
//   c     complexidade estimada para o cronograma (1 leve, 2 média, 3 pesada).
//         É uma estimativa da plataforma, usada só para não juntar vários
//         assuntos pesados no mesmo dia. Pode ser ajustada aqui.

window.EDITAL = {
  fonte: "Edital nº 1 – CAU-TO, de 6/10/2026 (Instituto Quadrix), item 18.2",
  cargo: "Assistente Administrativo (código 200)",
  prova: "2026-12-13",
  blocos: [
    {
      id: "B",
      nome: "Conhecimentos básicos",
      itens: 40,
      ref: "18.2.2",
      disciplinas: [
        {
          id: "pt",
          nome: "Língua Portuguesa",
          ref: "18.2.2.1",
          grupos: [
            { n: "1", t: "Compreensão e Interpretação de Textos", assuntos: [
              { id: "pt1.1", n: "1.1", c: 2, t: "Análise de textos variados, incluindo digitais (e-mails, redes sociais) e multimodais (gráficos, tabelas)." },
              { id: "pt1.2", n: "1.2", c: 2, t: "Identificação de tipos textuais, figuras de linguagem, denotação e conotação." }
            ]},
            { n: "2", t: "Análise Linguística e Semântica", assuntos: [
              { id: "pt2.1", n: "2.1", c: 1, t: "Ortografia oficial." },
              { id: "pt2.2", n: "2.2", c: 1, t: "Significado de palavras (sinônimos, antônimos, etc.)." },
              { id: "pt2.3", n: "2.3", c: 3, t: "Emprego das classes de palavras e colocação de pronomes." }
            ]},
            { n: "3", t: "Estruturação Textual", assuntos: [
              { id: "pt3.1", n: "3.1", c: 2, t: "Coesão, coerência e uso de conectores." },
              { id: "pt3.2", n: "3.2", c: 2, t: "Emprego correto de tempos e modos verbais." }
            ]},
            { n: "4", t: "Sintaxe", assuntos: [
              { id: "pt4.1", n: "4.1", c: 3, t: "Estrutura de orações e períodos." },
              { id: "pt4.2", n: "4.2", c: 3, t: "Relações de coordenação e subordinação." },
              { id: "pt4.3", n: "4.3", c: 3, t: "Concordância verbal e nominal." },
              { id: "pt4.4", n: "4.4", c: 3, t: "Regência verbal e nominal e uso da crase." }
            ]},
            { n: "5", t: "Pontuação", assuntos: [
              { id: "pt5.1", n: "5.1", c: 2, t: "Uso correto dos sinais de pontuação." }
            ]},
            { n: "6", t: "Reescrita e Produção Textual", assuntos: [
              { id: "pt6.1", n: "6.1", c: 2, t: "Reescrita de frases e textos." },
              { id: "pt6.2", n: "6.2", c: 1, t: "Adequação da linguagem a diferentes contextos." }
            ]}
          ]
        },
        {
          id: "mt",
          nome: "Raciocínio Lógico e Matemática",
          ref: "18.2.2.2",
          grupos: [
            { n: "1", t: "Matemática Básica", assuntos: [
              { id: "mt1.1", n: "1.1", c: 1, t: "Operações com conjuntos numéricos." },
              { id: "mt1.2", n: "1.2", c: 2, t: "Razão, proporção, porcentagem e regra de três (simples e composta)." },
              { id: "mt1.3", n: "1.3", c: 3, t: "Funções e equações (1º e 2º graus)." },
              { id: "mt1.4", n: "1.4", c: 2, t: "Progressões (aritmética e geométrica)." }
            ]},
            { n: "2", t: "Análise Combinatória e Probabilidade", assuntos: [
              { id: "mt2.1", n: "2.1", c: 3, t: "Princípios de contagem (arranjos, combinações, permutações)." },
              { id: "mt2.2", n: "2.2", c: 3, t: "Noções de probabilidade." }
            ]},
            { n: "3", t: "Raciocínio Lógico", assuntos: [
              { id: "mt3.1", n: "3.1", c: 2, t: "Estruturas lógicas e argumentação (dedução, indução)." },
              { id: "mt3.2", n: "3.2", c: 2, t: "Diagramas lógicos." },
              { id: "mt3.3", n: "3.3", c: 3, t: "Proposições e conectivos." }
            ]},
            { n: "4", t: "Raciocínio Analítico e Espacial", assuntos: [
              { id: "mt4.1", n: "4.1", c: 2, t: "Raciocínio verbal, matemático e sequencial." },
              { id: "mt4.2", n: "4.2", c: 2, t: "Orientação no espaço e no tempo." }
            ]},
            { n: "5", t: "Análise de Dados", assuntos: [
              { id: "mt5.1", n: "5.1", c: 1, t: "Estatística básica (média, moda, mediana)." },
              { id: "mt5.2", n: "5.2", c: 1, t: "Interpretação de gráficos e tabelas." }
            ]},
            { n: "6", t: "Matemática Financeira", assuntos: [
              { id: "mt6.1", n: "6.1", c: 2, t: "Juros simples e compostos." },
              { id: "mt6.2", n: "6.2", c: 2, t: "Descontos e taxas." }
            ]}
          ]
        },
        {
          id: "in",
          nome: "Noções de Informática",
          ref: "18.2.2.3",
          grupos: [
            { n: "1", t: "Conceitos Fundamentais", assuntos: [
              { id: "in1.1", n: "1.1", c: 1, t: "Hardware, software e periféricos." }
            ]},
            { n: "2", t: "Aplicativos de Escritório e Comunicação", assuntos: [
              { id: "in2.1", n: "2.1", c: 3, t: "Editores de texto, planilhas e apresentações (Microsoft 365, Google Workspace)." },
              { id: "in2.2", n: "2.2", c: 1, t: "Ferramentas de comunicação (Teams, Meet)." }
            ]},
            { n: "3", t: "Sistemas Operacionais", assuntos: [
              { id: "in3.1", n: "3.1", c: 2, t: "Noções de Windows (10 e 11)." },
              { id: "in3.2", n: "3.2", c: 1, t: "Sistemas móveis (Android e iOS)." }
            ]},
            { n: "4", t: "Redes e Internet", assuntos: [
              { id: "in4.1", n: "4.1", c: 2, t: "Conceitos básicos de redes, internet e intranet." },
              { id: "in4.2", n: "4.2", c: 1, t: "Navegadores (Chrome, Firefox, Edge)." },
              { id: "in4.3", n: "4.3", c: 1, t: "Uso de e-mail (Outlook, webmail) e sites de busca." }
            ]},
            { n: "5", t: "Gerenciamento e Segurança da Informação", assuntos: [
              { id: "in5.1", n: "5.1", c: 1, t: "Organização de arquivos e pastas." },
              { id: "in5.2", n: "5.2", c: 1, t: "Armazenamento em nuvem (OneDrive, Google Drive)." },
              { id: "in5.3", n: "5.3", c: 2, t: "Segurança (vírus, antivírus, firewall)." },
              { id: "in5.4", n: "5.4", c: 1, t: "Procedimentos de backup." }
            ]},
            { n: "6", t: "Transformação Digital", assuntos: [
              { id: "in6.1", n: "6.1", c: 1, t: "Conceitos básicos de Inteligência Artificial e computação em nuvem." }
            ]}
          ]
        }
      ]
    },
    {
      id: "C",
      nome: "Conhecimentos complementares",
      itens: 30,
      ref: "18.2.3",
      disciplinas: [
        {
          id: "lg",
          nome: "Legislação e Ética na Administração Pública",
          ref: "18.2.3.1",
          grupos: [
            { n: "1", t: "Ética no Setor Público", assuntos: [
              { id: "lg1.1", n: "1.1", c: 1, t: "Conceito de ética na função pública." },
              { id: "lg1.2", n: "1.2", c: 2, t: "Princípios fundamentais da Administração Pública." }
            ]},
            { n: "2", t: "Improbidade Administrativa", assuntos: [
              { id: "lg2.1", n: "2.1", c: 3, t: "Noções da Lei nº 8.429/1992." }
            ]},
            { n: "3", t: "Processo Administrativo", assuntos: [
              { id: "lg3.1", n: "3.1", c: 3, t: "Noções da Lei nº 9.784/1999, direitos e deveres." }
            ]},
            { n: "4", t: "Transparência e Acesso à Informação", assuntos: [
              { id: "lg4.1", n: "4.1", c: 2, t: "Noções da Lei nº 12.527/2011 e seus decretos." }
            ]},
            { n: "5", t: "Proteção de Dados Pessoais", assuntos: [
              { id: "lg5.1", n: "5.1", c: 2, t: "Noções da Lei Geral de Proteção de Dados – LGPD (Lei nº 13.709/2018)." }
            ]},
            { n: "6", t: "Lei nº 12.378/2010", assuntos: [
              { id: "lg6", n: "6", c: 3, t: "Lei nº 12.378/2010: regulamentação do exercício da Arquitetura e Urbanismo; organização do Conselho de Arquitetura e Urbanismo do Brasil (CAU/BR) e dos Conselhos de Arquitetura e Urbanismo dos Estados e do Distrito Federal (CAU/UF); competências institucionais." }
            ]},
            { n: "7", t: "Regimento Interno do CAU-TO", assuntos: [
              { id: "lg7", n: "7", c: 2, t: "Regimento Interno do CAU-TO." }
            ]}
          ]
        }
      ]
    },
    {
      id: "E",
      nome: "Conhecimentos específicos",
      itens: 50,
      ref: "18.2.4.1",
      disciplinas: [
        {
          id: "es",
          nome: "Específicos – Assistente Administrativo",
          ref: "18.2.4.1",
          grupos: [
            { n: "1", t: "Noções de Administração", assuntos: [
              { id: "es1.1", n: "1.1", c: 1, t: "Funções administrativas: planejamento, organização, direção e controle." },
              { id: "es1.2", n: "1.2", c: 3, t: "Noções de Administração Financeira, Administração de Pessoas e Administração de Materiais." },
              { id: "es1.3", n: "1.3", c: 1, t: "Procedimentos Administrativos e Manuais Administrativos." },
              { id: "es1.4", n: "1.4", c: 2, t: "Organização e Métodos." },
              { id: "es1.5", n: "1.5", c: 2, t: "Gestão de estoque e suprimentos de escritório." }
            ]},
            { n: "2", t: "Organização e Estrutura Organizacional", assuntos: [
              { id: "es2.1", n: "2.1", c: 2, t: "Conceito e tipos de estrutura organizacional." },
              { id: "es2.2", n: "2.2", c: 1, t: "Relações humanas e desempenho profissional." },
              { id: "es2.3", n: "2.3", c: 1, t: "Desenvolvimento de equipes de trabalho." },
              { id: "es2.4", n: "2.4", c: 1, t: "Noções de cidadania e relações públicas." }
            ]},
            { n: "3", t: "Comunicação Organizacional", assuntos: [
              { id: "es3.1", n: "3.1", c: 1, t: "Comunicação interna e externa." },
              { id: "es3.2", n: "3.2", c: 3, t: "Redação oficial de documentos." },
              { id: "es3.3", n: "3.3", c: 2, t: "Tipos de documentos administrativos." },
              { id: "es3.4", n: "3.4", c: 2, t: "Protocolo: recepção, classificação, registro e distribuição de documentos." },
              { id: "es3.5", n: "3.5", c: 1, t: "Expedição de correspondência: registro e encaminhamento." }
            ]},
            { n: "4", t: "Atendimento ao Público", assuntos: [
              { id: "es4.1", n: "4.1", c: 1, t: "Qualidade no atendimento: comunicabilidade, apresentação, atenção, cortesia, interesse, presteza, eficiência, tolerância, discrição, conduta, objetividade." },
              { id: "es4.2", n: "4.2", c: 1, t: "Postura profissional e relações interpessoais." },
              { id: "es4.3", n: "4.3", c: 1, t: "Atendimento telefônico e presencial." },
              { id: "es4.4", n: "4.4", c: 1, t: "Atendimento a públicos internos e externos." }
            ]},
            { n: "5", t: "Trabalho em Equipe", assuntos: [
              { id: "es5.1", n: "5.1", c: 1, t: "Personalidade e relacionamento." },
              { id: "es5.2", n: "5.2", c: 1, t: "Eficácia no comportamento interpessoal." },
              { id: "es5.3", n: "5.3", c: 1, t: "Fatores positivos do relacionamento." },
              { id: "es5.4", n: "5.4", c: 1, t: "Comportamento receptivo e defensivo." },
              { id: "es5.5", n: "5.5", c: 1, t: "Empatia e compreensão mútua." }
            ]},
            { n: "6", t: "Organização e Controle de Documentos", assuntos: [
              { id: "es6.1", n: "6.1", c: 2, t: "Noções de arquivologia." },
              { id: "es6.2", n: "6.2", c: 2, t: "Tipos de arquivos e métodos de arquivamento." },
              { id: "es6.3", n: "6.3", c: 1, t: "Gestão eletrônica de documentos." },
              { id: "es6.4", n: "6.4", c: 1, t: "Digitalização de documentos." }
            ]}
          ]
        }
      ]
    }
  ]
};
