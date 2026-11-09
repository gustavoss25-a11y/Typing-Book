// ============================================================================
// textos.js — biblioteca de textos do TypingBook
// ============================================================================
//
// Cada texto é um objeto com: id, titulo, autor, texto.
// Os três textos abaixo são EXEMPLOS DE DEMONSTRAÇÃO escritos para este
// protótipo — não são trechos de obras literárias reais. Isso foi proposital:
// é melhor você mesmo copiar o texto exato de uma fonte confiável (Wikisource
// ou Project Gutenberg) do que confiar numa citação "de memória", porque
// qualquer erro de digitação no texto original vira um bug permanente no app
// (a pessoa nunca vai conseguir "acertar" aquele trecho).
//
// COMO TROCAR por um texto real de domínio público (leva uns 2 minutos):
//   1. Abra, por exemplo, https://www.gutenberg.org/cache/epub/55752/pg55752.txt
//      (Dom Casmurro, Machado de Assis) ou https://pt.wikisource.org
//   2. Encontre o capítulo/trecho que quer usar e copie o texto exatamente
//      como está (sem corrigir ortografia antiga, acentos etc.)
//   3. Cole dentro de um novo objeto aqui embaixo, seguindo o mesmo formato.
//   4. Dê um "id" único (ex: "dom-casmurro-cap1").
//
// Dica: comece com trechos curtos (1-2 parágrafos, uns 300-600 caracteres).
// Trechos muito longos deixam a primeira experiência cansativa.
// ============================================================================

const TEXTOS = [
  {
    id: "exemplo-foco",
    titulo: "Sobre foco (texto de exemplo)",
    autor: "TypingBook — placeholder",
    texto: "Quando lemos apenas com os olhos, a mente escapa com facilidade para outros lugares. Mas quando cada palavra precisa passar pelos dedos antes de avançar, alguma coisa muda: não dá para pular frases, não dá para fingir que leu. É nesse ritmo mais lento e mais honesto que a leitura vira, de fato, atenção."
  },
  {
    id: "exemplo-habito",
    titulo: "Sobre hábitos (texto de exemplo)",
    autor: "TypingBook — placeholder",
    texto: "Um hábito novo raramente nasce perfeito. Ele começa pequeno, quase sem graça, repetido em dias que parecem iguais demais para importar. Só depois de um tempo é que a pessoa percebe: aquilo que parecia só uma tarefa chata virou, sem aviso, uma parte natural do dia."
  },
  {
    id: "exemplo-curto",
    titulo: "Trecho curto (texto de exemplo)",
    autor: "TypingBook — placeholder",
    texto: "Este é um texto bem curto, só para testar rapidamente o funcionamento do app."
  }
];
