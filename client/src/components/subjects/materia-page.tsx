import { useParams, Link } from "react-router-dom"
import { getSubjectById } from "@/lib/subjects"
import {
  ArrowLeft, BookOpen, Target, Lightbulb, GraduationCap, MessageSquare, ChevronRight,
  BookOpenText, PenLine, BookMarked, Languages, Palette, Dumbbell,
  Sigma, FlaskConical, Atom, Leaf, ScrollText, Globe, Users, Brain,
  Newspaper,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

const iconMap: Record<string, LucideIcon> = {
  BookOpenText, PenLine, BookMarked, Languages, Palette, Dumbbell,
  Sigma, FlaskConical, Atom, Leaf, ScrollText, Globe, Users, Brain,
  Newspaper, Target,
}

interface SubjectContent {
  enemWeight: string
  enemDescription: string
  topics: string[]
  studyTips: string[]
  studyApproach: string
}

const SUBJECT_CONTENTS: Record<string, SubjectContent> = {
  portuguese: {
    enemWeight: "45 questões na área de Linguagens e suas Tecnologias",
    enemDescription:
      "O ENEM avalia a interpretação de textos, o conhecimento da norma culta da língua portuguesa, o reconhecimento de figuras de linguagem e o entendimento de diferentes gêneros textuais. A prova é majoritariamente interpretativa: saber ler com atenção vale mais do que decorar regras. Caem bastante questões que misturam dois textos (interdisciplinaridade) e pedem que o candidato identifique a ideia que pode ser confirmada ou negada pelas fontes.",
    topics: [
      "Interpretação de textos literários e não literários",
      "Norma culta: concordância, regência, crase, pontuação e ortografia",
      "Figuras de linguagem: metáfora, metonímia, ironia, hipérbole, antítese",
      "Gêneros textuais: crônica, artigo de opinião, poema, charge, propaganda",
      "Relações entre textos diferentes (intertextualidade)",
      "Sentido figurado das palavras em contexto",
      "Estratégias de argumentação e coesão textual",
      "Marcadores textuais: conjunções, advérbios, sequenciais",
      "Produção de sentido a partir de imagens e infográficos",
    ],
    studyTips: [
      "Leia toda manhã um texto de jornal ou revista e tente resumir a ideia principal em uma frase",
      "Pratique a interpretação com provas anteriores do ENEM — foque em questões que pedem a ideia central",
      "Aprenda as figuras de linguagem mais comuns e identifique exemplos em textos do dia a dia",
      "Estude crase de forma prática: compare frases com e sem crase para perceber o padrão",
      "Monte um caderno de erros: toda vez que errar uma questão, anote o motivo para revisar depois",
    ],
    studyApproach:
      "Comece pelo mais frequente: interpretação e gramática aplicada. Foque em praticar com provas anteriores em vez de estudar regras isoladamente. Reserve pelo menos 30 minutos por dia para ler textos variados — isso treina a leitura rápida e a identificação de ideias centrais, que é o que mais cai na prova.",
  },

  essay: {
    enemWeight: "1000 pontos — até 50% da nota total",
    enemDescription:
      "A redação do ENEM é o componente mais determinante da nota. O texto dissertativo-argumentativo é avaliado em 5 competências (0 a 200 pontos cada): domínio da norma culta (C1), compreensão da proposta e aplicação de conceitos de várias áreas (C2), seleção e organização de argumentos (C3), conhecimento dos mecanismos linguísticos de argumentação (C4) e proposta de intervenção detalhada e que respeite os direitos humanos (C5). Temas variam entre questões sociais, ambientais, tecnológicas e culturais.",
    topics: [
      "Competência 1: Domínio da escrita formal e norma culta",
      "Competência 2: Compreender a proposta e mobilizar conhecimentos de diversas áreas",
      "Competência 3: Selecionar, relacionar e organizar argumentos",
      "Competência 4: Demonstrar domínio dos recursos de coesão e argumentação",
      "Competência 5: Elaborar proposta de intervenção detalhada e que respeite os direitos humanos",
      "Estrutura do texto dissertativo-argumentativo: introdução, desenvolvimento e conclusão",
      "Temas recorrentes: desigualdade social, tecnologia, meio ambiente, cultura e identidade",
      "Uso de repertório sociocultural: citar leis, filósofos, dados estatísticos, obras literárias",
    ],
    studyTips: [
      "Pratique redação pelo menos duas vezes por semana — a prática constante é o que mais evolui a nota",
      "Estude a estrutura do parágrafo argumentativo: tese → argumento → exemplificação → fechamento",
      "Leia redações modelo nota 1000 e anote os padrões que elas seguem",
      "Memorize 5 repertórios versáteis (filósofos, leis, dados, obras) que servem para vários temas",
      "Cuidado com a proposta de intervenção: ela deve ser específica, com agente, ação, efeito e detalhamento",
      "Evite repetir palavras: use sinônimos e referências nominais para manter a coesão",
    ],
    studyApproach:
      "A redação não é talento — é técnica. Comece dominando a estrutura básica (introdução, 2 a 3 parágrafos de desenvolvimento e conclusão). Depois, foque em cada competência por vez: primeiro a norma culta (C1), depois os argumentos (C3) e por fim a proposta de intervenção (C5). Anote os temas que mais caem e prepare repertórios para cada um.",
  },

  literature: {
    enemWeight: "Dentro de 45 questões de Linguagens",
    enemDescription:
      "A literatura no ENEM é avaliada por meio da interpretação de trechos de obras e poemas. Caim textos de diferentes períodos literários brasileiros, desde o Barroco até o Contemporâneo. O candidato precisa reconhecer características de cada movimento, identificar figuras de linguagem, entender o contexto histórico e interpretar o sentido das obras. A banca cobra menos decoreba e mais capacidade de leitura e interpretação.",
    topics: [
      "Barroco: Gongalves Dias, Gregório de Matos — antítese, cultismo, sensismo",
      "Arcadismo: Cláudio Manuel da Costa, Santa Rita Durão — fuga do campo, utopia",
      "Romantismo: José de Alencar, Castro Alves — sentimentalismo, indianismo, abolicionismo",
      "Realismo/Naturalismo: Machado de Assis, Aluísio Azevedo — crítica social, determinismo",
      "Parnasianismo: Olavo Bilac — rigor formal, métrica, poesia objetiva",
      "Simbolismo: Cruz e Sousa — subjetividade, musicalidade, misticismo",
      "Modernismo (1ª fase): Mário de Andrade, Oswald de Andrade — antropofagia, linguagem coloquial",
      "Modernismo (2ª fase): Clarice Lispector, Guimarães Rosa — introspecção, experimentalismo linguístico",
      "Literatura Contemporânea: Conceição Evaristo, Balzac — vozes periféricas, realismo social",
      "Figuras de linguagem aplicadas à poesia: metáfora, aliteração, assonâncias, rima, metro",
    ],
    studyTips: [
      "Monte um quadro-resumo dos períodos literários: período, características, autores principais e obras",
      "Leia os poemas que mais caem no ENEM: 'Canção do exílio', 'Navio Negreiro', 'Os Lusíadas'",
      "Pratique a identificação de figuras de linguagem em poemas — isso cai todo ano",
      "Associe cada período ao contexto histórico: Revolução Industrial, Independência, Era Vargas",
      "Não decore biografias de autores — foque nas características da obra e no sentido do texto",
    ],
    studyApproach:
      "Literatura no ENEM é interpretação, não decoreba. Foque em reconhecer as características visuais e temáticas de cada período (Barroco = exagero, Simbolismo = musicalidade, Modernismo = ruptura). pratique lendo trechos de poemas de diferentes épocas e identificando o período e as figuras de linguagem usadas.",
  },

  english: {
    enemWeight: "Dentro de 45 questões de Linguagens",
    enemDescription:
      "O ENEM cobra inglês por meio da interpretação de textos em inglês, sem exigir tradução literal. O candidato precisa entender vocabulário em contexto, reconhecer estruturas gramaticais aplicadas e interpretar o sentido geral de textos informativos, opinativos ou literários. O nível cobrado é intermediário — não é necessário ser fluente, mas sim ter boa capacidade de leitura e interpretação.",
    topics: [
      "Interpretação de textos em inglês: ideia central e detalhes",
      "Vocabulário em contexto: prefixos, sufixos e cognatos com o português",
      "Estruturas gramaticais: tempos verbais, voz passiva, condicionais",
      "Gêneros textuais: notícias, poemas, crônicas, textos acadêmicos simplificados",
      "Inferência de significado de palavras desconhecidas pelo contexto",
      "Expressões idiomáticas e phrasal verbs comuns",
      "Relação entre o texto em inglês e a realidade brasileira (tema interdisciplinar)",
    ],
    studyTips: [
      "Leia notícias curtas em inglês todos os dias (BBC Learning English, News in Levels)",
      "Assista séries e filmes com legendas em inglês para naturalizar o vocabulário",
      "Pratique inferência: quando encontrar uma palavra que não sabe, tente deduzir pelo contexto antes de procurar no dicionário",
      "Foque em phrasal verbs e expressões idiomáticas — elas aparecem frequentemente nas provas",
      "Faça simulados do ENEM e analise as questões de inglês que errou, anotando o vocabulário novo",
    ],
    studyApproach:
      "Inglês do ENEM não exige fluência — exige leitura estratégica. Treine com provas anteriores e foque em entender a ideia geral dos textos. Aprenda a usar cognatos (palavras parecidas em português e inglês) e o contexto para deduzir significados. Não se preocupe com gramática avançada; foque no que aparece nos textos.",
  },

  arts: {
    enemWeight: "Dentro de 45 questões de Linguagens",
    enemDescription:
      "Artes no ENEM é avaliada por meio da interpretação de imagens, pinturas, esculturas, músicas, cinemas e manifestações artísticas. O candidato precisa relacionar obras de arte aos seus contextos históricos e sociais, reconhecer estilos e movimentos artísticos, e interpretar mensagens em diferentes linguagens visuais e sonoras. A prova mistura diferentes formas de expressão artística em uma mesma questão.",
    topics: [
      "Linguagens visuais: pintura, escultura, arquitetura, fotografia",
      "Música: MPB, samba, rap, funk — música como manifestação cultural",
      "Cinema: cinema brasileiro, documentários, linguagem audiovisual",
      "História da arte: Renascimento, Barroco, Arte Moderna, Arte Contemporânea",
      "Arte e cultura popular: festas populares, artesanato, patrimônio imaterial",
      "Relação entre arte e política: censura, resistência, arte engajada",
      "Linguagem cinematográfica: planos, enquadramento, montagem, narração visual",
      "Arte digital e novas mídias: arte urbana, street art, memes como expressão",
    ],
    studyTips: [
      "Assista a filmes brasileiros que caem no ENEM: Central do Brasil, Cidade de Deus, Bacurau",
      "Estude os movimentos artísticos mais cobrados: Renascimento, Arte Moderna brasileira, Cinema Novo",
      "Pratique com provas anteriores identificando qual período ou estilo uma obra representa",
      "Preste atenção em como a música é usada como ferramenta de resistência e identidade cultural",
      "Aprenda a descrever obras de arte: tema, técnica, cores, composição e mensagem",
    ],
    studyApproach:
      "Artes no ENEM é interpretação de imagens e contexto cultural. Foque em reconhecer os principais movimentos artísticos brasileiros e mundiais e como eles se conectam com a história. Pratique descrevendo obras de arte e associando-as ao período e à intenção do artista.",
  },

  pe: {
    enemWeight: "Dentro de 45 questões de Linguagens",
    enemDescription:
      "Educação Física no ENEM cobra conceitos de saúde, exercícios físicos, atividade física e qualidade de vida. O candidato precisa entender a importância da atividade física para a prevenção de doenças, reconhecer práticas corporais diversificadas, associar o exercício a benefícios psicológicos e compreender a relação entre corpo, saúde e sociedade. Questões misturam tabelas, gráficos e textos informativos.",
    topics: [
      "Benefícios da atividade física para a saúde: prevenção de doenças, qualidade de vida",
      "Exercício e saúde mental: redução do estresse, ansiedade, melhoria do sono",
      "Práticas corporais diversificadas: danças, artes marciais, atividades aquáticas",
      "Sedentarismo: riscos à saúde, como combater no dia a dia",
      "Nutrição e exercício: alimentação equilibrada, hidratação, orientação nutricional",
      "Atividade física na terceira idade: adaptações, benefícios, recomendações",
      "Desporto e rendimento: treinamento, periodização, lesões comuns",
      "Atividade física como prática social: inclusão, accessibility, adaptação",
    ],
    studyTips: [
      "Associe os benefícios do exercício a dados e estatísticas — o ENEM gosta de questões com gráficos",
      "Estude os efeitos do sedentarismo e saiba relacionar com doenças como diabetes e hipertensão",
      "Leia sobre práticas corporais indígenas e populares — questões interdisciplinares são comuns",
      "Pratique com provas anteriores: identifique o tipo de questão (tabela, gráfico, texto) e desenvolva a leitura crítica",
      "Cuidado com pegadinhas: algumas questões trocam palavras-chave e mudam completamente o sentido",
    ],
    studyApproach:
      "Educação Física no ENEM é mais sobre saúde e sociedade do que sobre exercícios. Foque em entender os benefícios da atividade física, os riscos do sedentarismo e como a prática corporal se conecta com a qualidade de vida. Leia atentamente os gráficos e tabelas que aparecem nas questões.",
  },

  math: {
    enemWeight: "45 questões — maior peso na nota do ENEM",
    enemDescription:
      "Matemática tem o maior peso entre todas as áreas no ENEM. As questões exigem resolução de problemas com situações reais: finanças, geometria espacial, estatística de dados, funções e probabilidades. O candidato precisa interpretar o enunciado, montar a equação ou situação e resolver. A prova cobra muito raciocínio lógico e aplicação prática do conteúdo.",
    topics: [
      "Funções: afim, quadrática, exponencial, logarítmica, modular — gráficos e propriedades",
      "Geometria plana e espacial: áreas, volumes, semelhança, congruência, teorema de Pitágoras",
      "Estatística e probabilidade: média, mediana, moda, desvio padrão, gráficos, eventos",
      "Álgebra: equações do 1º e 2º graus, sistemas lineares, inequações",
      "Trigonometria: seno, cosseno, tangente, arcos, aplicações em problemas reais",
      "Porcentagem: aumento, desconto, juros simples e compostos, tabela price",
      "Números: conjuntos numéricos, divisibilidade, MMC, MDC, frações",
      "Razão e proporção: regra de três simples e composta, grandezas proporcionais",
      "PA (Progressão Aritmética) e PG (Progressão Geométrica)",
      "Matriz financeira: interpretação de tabelas de custos, receitas e investimentos",
    ],
    studyTips: [
      "Pratique diariamente: matemática evolui com constância, não com decoreba",
      "Foque em funções e geometria — eles somam mais de 40% das questões de matemática",
      "Aprenda a ler enunciados com atenção: o ENEM usa situações reais e muita informação nos textos",
      "Monte um caderno de fórmulas: anote as fórmulas mais usadas e revise antes de cada simulado",
      "Faça simulados cronometrados para treinar a gestão do tempo na prova",
      "Estude gráficos e tabelas: saiba interpretar dados, calcular médias e fazer inferências",
    ],
    studyApproach:
      "Matemática exige prática diária. Comece pelas funções (afim e quadrática) que são a base de muitas questões. Depois foque em geometria e estatística. Não decore fórmulas sem entender — aprenda a aplicar cada uma em situações reais. Treine com simulados cronometrados para desenvolver a velocidade de resolução.",
  },

  chemistry: {
    enemWeight: "Dentro de 45 questões de Ciências da Natureza",
    enemDescription:
      "Química no ENEM é avaliada por meio de questões que misturam conteúdo de química orgânica, inorgânica e estequiometria, sempre aplicadas a situações reais do cotidiano. Caim muito a leitura de tabelas, gráficos e equações químicas balanceadas. O candidato precisa interpretar processos químicos, associar transformações de matéria à vida diária e resolver cálculos estequiométricos.",
    topics: [
      "Química orgânica: hidrocarbonetos, funções oxigenadas e nitrogenadas, isomeria",
      "Estequiometria: massa molar, mols, concentração, equações balanceadas",
      "Tabela Periódica: propriedades periódicas, configuração eletrônica, ligações químicas",
      "Soluções: concentração em mol/L, diluição, miscibilidade",
      "Eletroquímica: pilhas, eletrólise, oxidação-redução",
      "Química ambiental: poluição, gases do efeito estufa, camada de ozônio",
      "Reações ácido-base: pH, neutralização, indicadores",
      "Gases ideais: leis de Boyle, Charles, Dalton",
      "Cinemética: velocidade de reação, fatores que a influenciam",
      "Química dos alimentos: conservação, aditivos, reações de Maillard",
    ],
    studyTips: [
      "Estude química orgânica com atenção: ela representa grande parte das questões de química no ENEM",
      "Pratique estequiometria com problemas do cotidiano: receitas de cozinha, combustíveis, medicamentos",
      "Aprenda a equilibrar equações químicas — isso é pré-requisito para resolver muitas questões",
      "Cuidado com conversões de unidades: mol/L, g/mL — muitas questões erram por unidade",
      "Leia enunciados com calma: o ENEM usa situações reais e omite informações que você precisa deduzir",
    ],
    studyApproach:
      "Química do ENEM é aplicação, não teoria pura. Foque em química orgânica (funções e reações) e estequiometria (cálculos com mols e massas). Treine com provas anteriores para acostumar com o formato das questões, que sempre usam situações reais como base.",
  },

  physics: {
    enemWeight: "Dentro de 45 questões de Ciências da Natureza",
    enemDescription:
      "Física no ENEM cobra aplicação de conceitos a situações cotidianas: carros freando, popsicles derretendo, luzes refletindo. O candidato precisa interpretar o enunciado, identificar as grandezas envolvidas e aplicar a fórmula correta. Caim bastante mecânica, ótica, eletricidade, termodinâmica e ondas. As questões exigem raciocínio lógico e leitura atenta de gráficos.",
    topics: [
      "Mecânica: MRU, MRUV, queda livre, Leis de Newton, energia cinética e potencial",
      "Ótica: reflexão, refração, espelhos, lentes, formação de imagens",
      "Eletricidade: circuitos elétricos, Ohm, potência, resistência, semicondutores",
      "Termodinâmica: calor, temperatura, dilatação, transmissão de calor, gases",
      "Ondas: tipos, som, luz, difração, interferência",
      "Magnetismo: campo magnético, indução eletromagnética, eletromagnetismo",
      "Fluidos: pressão, empuxo, teorema de Stevin, Princípio de Pascal",
      "Trabalho e energia: teorema trabalho-energia, potência, conservação de energia",
      "Gravitação universal: Lei de Newton, órbitas, satélites",
      "Física moderna: efeito fotoelétrico, dualidade onda-partícula (noções básicas)",
    ],
    studyTips: [
      "Mecânica é a base: domine MRU, MRUV e as Leis de Newton antes de avançar para outros temas",
      "Aprenda a identificar o tipo de problema pelo enunciado — isso agiliza muito a resolução",
      "Pratique com provas anteriores: o ENEM sempre usa situações reais e precisa que você leia com atenção",
      "Monte uma lista de fórmulas organizadas por tema e revise antes de cada simulado",
      "Cuidado com unidades de medida: sempre converta para o SI (m, kg, s) antes de calcular",
      "Estude circuitos elétricos com diagramas: desenhe e resolva problemas visuais",
    ],
    studyApproach:
      "Física do ENEM é identificar qual lei se aplica a cada situação. Comece por mecânica, que é a base e representa muitas questões. Depois avance para ótica e eletricidade. Treine lendo enunciados e listando as grandezas conhecidas antes de tentar resolver — isso evita erros por pressa.",
  },

  biology: {
    enemWeight: "Dentro de 45 questões de Ciências da Natureza",
    enemDescription:
      "Biologia no ENEM cobra temas que conectam ciência e sociedade: genética aplicada à medicina, biologia celular em contextos de saúde, ecologia e sustentabilidade, fisiologia humana e epidemiologia. O candidato precisa interpretar tabelas genéticas, gráficos populacionais e textos científicos. Questões interdisciplinares são muito frequentes, misturando biologia com saúde pública, meio ambiente e tecnologia.",
    topics: [
      "Genética: mendelismo, codominância, ligação ao sexo, mutações, DG",
      "Biologia celular: organelas, divisão celular (mitose e meiose), ciclo celular",
      "Ecologia: cadeia alimentar, ciclagem de matéria, biomas, desmatamento, biodiversidade",
      "Fisiologia humana: sistema digestório, respiratório, circulatório, nervoso",
      "Evolução: seleção natural, deriva genética, especiação, darwinismo",
      "Biotecnologia: GMOs, clonagem, engenharia genética, terapia gênica",
      "Imunologia: tipos de imunidade, vacinas, respostas imunológicas",
      "Microbiologia: vírus, bactérias, pandemias, antibióticos",
      "Botânica: fotossíntese, respiração celular, ecologia de plantas",
      "Saúde pública: epidemiologia, endemicidade, políticas de saúde",
    ],
    studyTips: [
      "Foque em genética e ecologia — eles representam grande parte das questões de biologia no ENEM",
      "Pratique interpretando tabelas de genética: cruzamentos, fenótipos, genótipos",
      "Estude ecologia associando com notícias atuais: desmatamento, mudanças climáticas, epidemias",
      "Relacione biologia celular com doenças: como mutações genéticas causam doenças hereditárias",
      "Leia atentamente os gráficos: o ENEM cobra muito a capacidade de ler dados biológicos",
    ],
    studyApproach:
      "Biologia do ENEM conecta ciência com problemas reais. Foque em genética (tabelas e cruzamentos), ecologia (ciclos e cadeias alimentares) e fisiologia humana (sistemas do corpo). Sempre leia os gráficos com atenção — muitas questões pedem interpretação de dados, não apenas conhecimento teórico.",
  },

  history: {
    enemWeight: "Dentro de 45 questões de Ciências Humanas",
    enemDescription:
      "História no ENEM é avaliada por meio da interpretação de textos históricos, documentos, charges, imagens e mapas. O candidato precisa entender processos históricos do Brasil e do mundo, reconhecer causas e consequências de eventos, e associar o passado ao presente. Caim temas como Brasil colonial, independência, República, Era Vargas, ditadura militar e redemocratização, além de histórias mundiais.",
    topics: [
      "Brasil colonial: exploração do pau-brasil, escravidão, ciclo do ouro, Minas Gerais",
      "Independência do Brasil: D. Pedro I, influências iluministas, motivations econômicas",
      "República Velha: política do café com leite, Coronelismo, Revolta de Canudos",
      "Era Vargas: populismo, industrialização, CLT, Estado Novo, propaganda",
      "Ditadura militar (1964-1985): AI-5, censura, resistência, movimentos estudantis",
      "Redemocratização: Diretas Já, Constituição de 1988, partidos políticos",
      "História mundial: Revolução Francesa, Revolução Industrial, Guerras Mundiais",
      "Movimentos sociais: abolicionismo, sufragismo, movimento negro, feminismo",
      "Cultura e identidade: sincretismo religioso, cultura popular, memória coletiva",
      "Geopolítica: Guerra Fria, descolonização, blocos econômicos",
    ],
    studyTips: [
      "Monte uma linha do tempo com os principais eventos da história do Brasil — isso ajuda a visualizar causas e consequências",
      "Associe cada período histórico a um contexto mundial: Revolução Industrial ↔ Escravidão no Brasil",
      "Pratique com charges e documentos históricos — o ENEM cobra muito a interpretação visual",
      "Não decore datas isoladamente: entenda o que aconteceu e por que foi importante",
      "Leia sobre movimentos de resistência: Abolicionismo, Ditadura, Diretas Já",
    ],
    studyApproach:
      "História do ENEM é interpretação e contextualização. Foque em entender os processos (não decorar nomes e datas). Comece pelo Brasil colonial e avance cronologicamente até a redemocratização. Pratique com charges e documentos — eles aparecem toda prova e treinam a interpretação histórica.",
  },

  geography: {
    enemWeight: "Dentro de 45 questões de Ciências Humanas",
    enemDescription:
      "Geografia no ENEM é avaliada por meio de mapas, gráficos, imagens de satélite e textos informativos. O candidato precisa interpretar dados espaciais, entender processos de urbanização, globalização, desigualdade territorial e questões ambientais. A prova cobra muito a relação entre espaço geográfico, sociedade e política. Questões misturam geografia física (clima, relevo) e humana (população, economia).",
    topics: [
      "Geografia física: clima, relevo, hidrografia, biomas brasileiros",
      "Brasil continental: regiões, rede urbana, transportes, integração nacional",
      "Urbanização: crescimento urbano, favelização, mobilidade urbana, gentrificação",
      "Globalização: fluxos econômicos, multinacionais, divisão internacional do trabalho",
      "Questões ambientais: desmatamento, mudanças climáticas, gestão de recursos hídricos",
      "Agricultura: agronegócio, reforma agrária, agricultura familiar, modelo grãos",
      "População: crescimento demográfico, transição demográfica, distribuição espacial",
      "Geopolítica: fronteiras, conflitos territoriais, blocos econômicos, soberania",
      "Indicadores de desenvolvimento: IDH, Gini, PIB per capita, envelhecimento populacional",
      "Recursos naturais: mineração, petróleo, energia renovável, conflitos por recursos",
    ],
    studyTips: [
      "Pratique a leitura de mapas: identifique regiões, altitude, clima e uso do solo",
      "Associe dados geográficos com notícias atuais: desmatamento na Amazônia, seca no Nordeste",
      "Estude os biomas brasileiros: localização, clima, vegetação, problemas ambientais",
      "Cuidado com os gráficos: muitas questões de geografia exigem interpretação de dados demográficos",
      "Leia sobre urbanização brasileira: favelas, mobilidade, políticas públicas de habitação",
    ],
    studyApproach:
      "Geografia do ENEM é leitura de mapas, gráficos e dados. Foque em geografia brasileira (biomas, urbanização, desigualdade) e globalização. Pratique interpretando mapas temáticos e gráficos populacionais. Sempre associe os dados geográficos com a realidade social e política.",
  },

  sociology: {
    enemWeight: "Dentro de 45 questões de Ciências Humanas",
    enemDescription:
      "Sociologia no ENEM cobra interpretação de conceitos sociais aplicados à realidade brasileira. O candidato precisa entender desigualdade social, movimentos sociais, cultura,Identidade, relações de poder e funcionamento da sociedade. A prova mistura textos de sociólogos, dados estatísticos, imagens e notícias. Questões interdisciplinares são muito comuns, conectando sociologia com história, geografia e atualidades.",
    topics: [
      "Sociedade de classes: desigualdade social, mobilidade social, estratificação",
      "Cultura:Identidade cultural, diversidade,etnocentrismo, relativismo cultural",
      "Movimentos sociais: MST, movimento negro, feminismo, LGBTQIA+, sindicalismo",
      "Poder e política: Estado, hegemonia, legitimação do poder, democracia",
      "Trabalho: precarização, terceirização, desemprego, novas formas de trabalho",
      "Educação: função social da escola, desigualdade de acesso, meritocracia",
      "Mídia e comunicação: manipulação da informação, redes sociais, opinião pública",
      "Religião: secularização, fundamentalismo, sincretismo religioso no Brasil",
      "Globalização: homogeneização cultural, resistência cultural, impactos sociais",
      "Saúde coletiva: SUS, desigualdade de acesso, pandemia e impactos sociais",
    ],
    studyTips: [
      "Leia sobre os principais conceitos: desigualdade social,Identidade cultural, movimentos sociais",
      "Associe conceitos sociológicos com situações reais: favelas, desemprego, protestos",
      "Estude os pensadores mais cobrados: Marx, Weber, Durkheim, Boaventura de Sousa Santos",
      "Pratique com provas anteriores: identifique o conceito sociológico que a questão está pedindo",
      "Cuidado com interpretações simplistas: sociologia exige pensar a sociedade em camadas",
    ],
    studyApproach:
      "Sociologia do ENEM é pensar sobre a sociedade de forma crítica. Foque em desigualdade social,Identidade cultural e movimentos sociais — são os temas mais cobrados. Pratique conectando conceitos com a realidade: toda questão de sociologia tem um caso prático por trás.",
  },

  philosophy: {
    enemWeight: "Dentro de 45 questões de Ciências Humanas",
    enemDescription:
      "Filosofia no ENEM cobra interpretação de textos filosóficos e aplicação de conceitos à vida cotidiana. O candidato precisa reconhecer pensadores importantes, entender questões éticas, lógicas e existenciais, e relacionar filosofia com eventos históricos e sociais. A prova mistura trechos de filósofos com imagens, charges e textos contemporâneos.",
    topics: [
      "Pensadores gregos: Sócrates, Platão, Aristóteles — busca da verdade, dialética, ética",
      "Iluminismo: Locke, Montesquieu, Rousseau — razão, liberdade, separação de poderes",
      "Ética: o que é certo e errado, dilemas morais, responsabilidade social",
      "Lógica: raciocínio dedutivo, induutivo, falácias, argumentação válida",
      "Existencialismo: Sartre, Camus, Kierkegaard — liberdade, angústia, sentido da existência",
      "Kant: imperativo categórico,Iluminismo como saída da menoridade",
      "Foucault: poder, instituições, vigilância, loucura",
      "Marx: alienação,Classes sociais, mais-valia, ideologia",
      "Filosofia política: contrato social, democracia, direitos humanos",
      "Epistemologia: como conhecemos, limites da razão, relativismo",
    ],
    studyTips: [
      "Estude os principais pensadores em ordem cronológica: Sócrates → Platão → Aristóteles → Kant → Marx",
      "Relacione cada pensador com sua principal contribuição: Platão = mundo das ideias, Marx =Classes sociais",
      "Pratique com trechos de textos filosóficos: o ENEM sempre traz um trecho para você interpretar",
      "Cuidado com as respostas fáceis: filosofia exige pensar além da primeira impressão",
      "Leia sobre dilemas éticos atuais: inteligência artificial, biodiversidade, direitos humanos",
    ],
    studyApproach:
      "Filosofia do ENEM é interpretação de textos e aplicação de conceitos. Foque nos pensadores mais cobrados: Sócrates, Platão, Kant e Marx. Não decore biografias — entenda o que cada um defendia e como isso se aplica à sociedade atual. Pratique lendo trechos filosóficos e identificando a ideia central.",
  },

  "current-affairs": {
    enemWeight: "Presente em todas as áreas — interdisciplinar",
    enemDescription:
      "Atualidades no ENEM aparecem transversalmente em todas as provas, desde Linguagens até Matemática. O candidato precisa estar informado sobre temas quentes do ano: política brasileira, economia, meio ambiente, tecnologia, saúde pública e direitos humanos. A banca usa notícias recentes como base para criar questões interdisciplinares que conectam o tema atual com o conteúdo de cada área.",
    topics: [
      "Política brasileira: eleições, reformas, Congresso, STF, pacto federativo",
      "Economia: inflação, PIB, desemprego, política fiscal, PIX, criptomoedas",
      "Meio ambiente: mudanças climáticas, desmatamento, energia limpa, COP",
      "Saúde pública: SUS, epidemias, vacinas, ciência, síntese de medicamentos",
      "Tecnologia: inteligência artificial, redes sociais, privacidade, segurança cibernética",
      "Direitos humanos: igualdade racial, gênero, inclusão, mobilidade urbana",
      "Relações internacionais: BRICS, guerra Rússia-Ucrânia, acordos comerciais",
      "Educação: ENEM, vestibular, desigualdade de acesso, ensino híbrido",
      "Cultura: séries, filmes, literatura, manifestações culturais brasileiras",
      "Agricultura: segurança alimentar, agronegócio, reforma agrária, food truck",
    ],
    studyTips: [
      "Leia notícias todos os dias: foque em política, economia, meio ambiente e tecnologia",
      "Assine alertas de notícias de veículos confiáveis: Estadão, Folha, G1",
      "Associe as notícias com os conteúdos das matérias: uma notícia sobre Amazônia pode cair em geografia, biologia ou atualidades",
      "Cuidado com opiniões pessoais em provas: o ENEM pede análise objetiva, não posicionamento político",
      "Pratique com simulados que misturam temas: é assim que a prova real funciona",
    ],
    studyApproach:
      "Atualidades do ENEM não é uma matéria separada — ela aparece em todas as provas. Leia notícias diárias e associe com o conteúdo das matérias. Foque nos temas que mais se conectam com o ENEM: política brasileira, meio ambiente, tecnologia e direitos humanos.",
  },

  enem: {
    enemWeight: "Prova composta por 180 questões + redação",
    enemDescription:
      "O ENEM (Exame Nacional do Ensino Médio) é a principal porta de entrada para universidades brasileiras via SiSU. A prova tem 4 provas objetivas (45 questões cada, com peso variável por área) + redação (1000 pontos). Cada questão vale de 100 a 150 pontos dependendo da área. A nota do SiSU é calculada pela média ponderada das áreas, com peso diferente para cada curso. Prova acontece em dois domingos, manhã e tarde.",
    topics: [
      "Estrutura da prova: 4 provas objetivas + redação, 2 domingos, manhã e tarde",
      "Áreas e pesos: Linguagens, Matemática, Ciências da Natureza, Ciências Humanas, Redação",
      "Pontuação: cada prova vale 1000 pontos, redação vale 1000 pontos, total = 5000 pontos",
      "SiSU: como funciona a inscrição, ponderação por curso, lista de espera",
      "Correção: leitura óptica, gabarito oficial, recursos e interpretação de gabarito",
      "Inscrição: prazos, taxa (ou isenção), documentos necessários",
      "Estratégia de prova: gestão do tempo, chute inteligente, marcar questões difíceis",
      "Preparação: simulados, cronograma de estudos, descanso antes da prova",
      "Acessibilidade: provas adaptadas, tempo extra, sala especial",
      "Pós-ENEM: resultado, análise de nota, processos seletivos alternativos (vestibular, ENEM-PPL)",
    ],
    studyTips: [
      "Faça simulados completos pelo menos 3 vezes por mês — a experiência de prova é insubstituível",
      "Gerencie o tempo: 5 minutos por questão, respondendo primeiro as mais fáceis",
      "Não deixe nenhuma questão em branco: não tem penalidade por erro, então chute se necessário",
      "Estude pelo menos 2 horas por dia, distribuindo entre todas as áreas",
      "Durma bem nos dias anteriores à prova: cansaço diminui a capacidade de raciocínio",
      "Leve caneta azul e preta, documento com foto, lápis e borracha — organize-se na véspera",
    ],
    studyApproach:
      "O ENEM é uma maratona, não uma prova rápida. Comece sua preparação pelo menos 6 meses antes, com um cronograma realista que cubra todas as áreas. Foque em suas fraquezas mas não abandone seus pontos fortes. Pratique com provas anteriores sempre que possível — elas revelam o padrão da banca e os temas que mais caem.",
  },
}

export default function MateriaPage() {
  const { subjectId } = useParams<{ subjectId: string }>()
  const subject = subjectId ? getSubjectById(subjectId) : null
  const content = subjectId ? SUBJECT_CONTENTS[subjectId] : null

  if (!subject || !content) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="glass galaxy-glow rounded-2xl p-8 max-w-md w-full text-center">
          <Target className="size-12 text-violet-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-foreground mb-2">
            Matéria não encontrada
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            A matéria solicitada não existe ou o link está incorreto.
          </p>
          <Link
            to="/app/chat"
            className="inline-flex items-center gap-2 text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors"
          >
            <ArrowLeft className="size-4" />
            Voltar ao chat
          </Link>
        </div>
      </div>
    )
  }

  const Icon = iconMap[subject.icon] || BookOpen
  const areaColors: Record<string, string> = {
    Linguagens: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    Matemática: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    "Ciências da Natureza": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    "Ciências Humanas": "bg-amber-500/20 text-amber-300 border-amber-500/30",
    Geral: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  }

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        {/* Back button */}
        <Link
          to="/app/chat"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group"
        >
          <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
          Voltar
        </Link>

        {/* Subject header */}
        <div className="flex items-start gap-4 mb-8">
          <div className="glass galaxy-glow rounded-2xl p-3 shrink-0">
            <Icon className={`size-8 ${subject.color}`} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              {subject.label}
            </h1>
            <span
              className={`inline-block text-xs font-medium px-3 py-1 rounded-full border ${areaColors[subject.area] || areaColors["Geral"]}`}
            >
              {subject.area}
            </span>
          </div>
        </div>

        {/* Content sections */}
        <div className="space-y-4">
          {/* O que cai no ENEM */}
          <div className="glass galaxy-glow rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-8 rounded-lg bg-violet-500/15 flex items-center justify-center shrink-0">
                <Target className="size-4 text-violet-400" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                O que cai no ENEM
              </h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              {content.enemDescription}
            </p>
            <div className="glass rounded-xl px-4 py-3 mt-3">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground/80">Peso na prova:</span>{" "}
                {content.enemWeight}
              </p>
            </div>
          </div>

          {/* Principais tópicos */}
          <div className="glass galaxy-glow rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-8 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
                <BookOpen className="size-4 text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Principais tópicos
              </h2>
            </div>
            <ul className="space-y-2">
              {content.topics.map((topic, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <ChevronRight className="size-4 text-blue-400/60 mt-0.5 shrink-0" />
                  <span className="leading-relaxed">{topic}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Tabela Periódica - apenas para Química */}
          {subjectId === "chemistry" && (
            <Link
              to="/app/materia/chemistry/tabela-periodica"
              className="flex items-center gap-4 glass galaxy-glow galaxy-glow-hover rounded-2xl p-6 hover:bg-accent/30 transition-all group"
            >
              <div className="size-12 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                <FlaskConical className="size-6 text-emerald-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-foreground">
                  Tabela Periódica Interativa
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Explore os 118 elementos com busca, filtros por categoria e detalhes completos
                </p>
              </div>
              <ChevronRight className="size-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>
          )}

          {/* Dicas de estudo */}
          <div className="glass galaxy-glow rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-8 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                <Lightbulb className="size-4 text-amber-400" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Dicas de estudo
              </h2>
            </div>
            <ul className="space-y-2">
              {content.studyTips.map((tip, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <ChevronRight className="size-4 text-amber-400/60 mt-0.5 shrink-0" />
                  <span className="leading-relaxed">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Como estudar */}
          <div className="glass galaxy-glow rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-8 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
                <GraduationCap className="size-4 text-emerald-400" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Como estudar
              </h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {content.studyApproach}
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8">
          <Link
            to="/app/chat"
            className="flex items-center justify-center gap-2 w-full glass galaxy-glow galaxy-glow-hover rounded-2xl px-6 py-4 text-sm font-medium text-foreground hover:bg-accent/50 transition-all group"
          >
            <MessageSquare className="size-4 text-violet-400" />
            Conversar sobre {subject.label}
            <ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  )
}
