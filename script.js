// ============================================================================
// script.js — motor de digitação do TypingBook (protótipo v0)
// ============================================================================
// Sem framework, sem build, sem backend. Tudo roda no navegador.
// Progresso/recordes ficam salvos no localStorage (só neste navegador).
// ============================================================================

// --- elementos da tela -------------------------------------------------
const telaSelecao = document.getElementById("tela-selecao");
const telaDigitacao = document.getElementById("tela-digitacao");
const telaResultado = document.getElementById("tela-resultado");

const listaTextos = document.getElementById("lista-textos");
const tituloAtual = document.getElementById("titulo-atual");
const textoAlvoEl = document.getElementById("texto-alvo");
const inputDigitacao = document.getElementById("input-digitacao");

const statWpm = document.getElementById("stat-wpm");
const statPrecisao = document.getElementById("stat-precisao");
const statProgresso = document.getElementById("stat-progresso");

const resultadoWpm = document.getElementById("resultado-wpm");
const resultadoPrecisao = document.getElementById("resultado-precisao");
const resultadoTempo = document.getElementById("resultado-tempo");

const btnVoltar = document.getElementById("btn-voltar");
const btnRepetir = document.getElementById("btn-repetir");
const btnProximo = document.getElementById("btn-proximo");

const btnSom = document.getElementById("btn-som");
const resultadoTitulo = document.getElementById("resultado-titulo");
const resultadoRecorde = document.getElementById("resultado-recorde");

// --- estado da sessão de digitação atual --------------------------------
let textoAtual = null;   // objeto { id, titulo, autor, texto }
let inicioEm = null;      // timestamp do primeiro caractere digitado
let concluido = false;

// --- navegação entre telas ----------------------------------------------
function mostrarTela(tela) {
  [telaSelecao, telaDigitacao, telaResultado].forEach(t => t.classList.add("escondida"));
  tela.classList.remove("escondida");
}

// --- tela 1: lista de textos ---------------------------------------------
function montarListaTextos() {
  listaTextos.innerHTML = "";
  TEXTOS.forEach(texto => {
    const recorde = lerRecorde(texto.id);
    const btn = document.createElement("button");
    btn.className = "cartao-texto";
    btn.innerHTML = `
      <div class="titulo">${texto.titulo}</div>
      <div class="meta">${texto.autor} · ${texto.texto.length} caracteres${recorde ? ` · recorde: ${recorde.wpm} ppm` : ""}</div>
    `;
    btn.addEventListener("click", () => iniciarTexto(texto));
    listaTextos.appendChild(btn);
  });
}

// --- tela 2: digitação -----------------------------------------------------
function iniciarTexto(texto) {
  textoAtual = texto;
  inicioEm = null;
  concluido = false;

  tituloAtual.textContent = `${texto.titulo} — ${texto.autor}`;
  renderizarTextoAlvo("");
  inputDigitacao.value = "";
  inputDigitacao.maxLength = texto.texto.length;

  atualizarStats("", 0);

  mostrarTela(telaDigitacao);
  // pequeno delay para garantir que o foco funcione após a troca de tela
  setTimeout(() => inputDigitacao.focus(), 50);
}

function renderizarTextoAlvo(digitado) {
  const alvo = textoAtual.texto;
  let html = "";
  for (let i = 0; i < alvo.length; i++) {
    const charAlvo = alvo[i];
    let classe = "char-pendente";
    if (i < digitado.length) {
      classe = digitado[i] === charAlvo ? "char-correto" : "char-errado";
    } else if (i === digitado.length) {
      classe += " char-atual";
    }
    // IMPORTANTE: usar espaço normal aqui, nunca &nbsp;. O &nbsp; é um espaço
    // "não-quebrável" — ele impede o navegador de quebrar linha naquele ponto,
    // o que fazia o parágrafo inteiro virar uma única linha gigante (por isso
    // a tela "andava para a esquerda" ao digitar). Com espaço normal + o
    // "white-space: pre-wrap" do .texto-alvo no CSS, o texto quebra em várias
    // linhas normalmente, como um parágrafo de verdade.
    const charVisivel = escapeHtml(charAlvo);
    html += `<span class="${classe}">${charVisivel}</span>`;
  }
  textoAlvoEl.innerHTML = html;
}

function escapeHtml(c) {
  if (c === "<") return "&lt;";
  if (c === ">") return "&gt;";
  if (c === "&") return "&amp;";
  return c;
}

function contarAcertos(digitado, alvo) {
  let acertos = 0;
  const limite = Math.min(digitado.length, alvo.length);
  for (let i = 0; i < limite; i++) {
    if (digitado[i] === alvo[i]) acertos++;
  }
  return acertos;
}

function atualizarStats(digitado, tempoMs) {
  const alvo = textoAtual.texto;
  const acertos = contarAcertos(digitado, alvo);

  const precisao = digitado.length === 0 ? 100 : Math.round((acertos / digitado.length) * 100);
  const progresso = Math.round((digitado.length / alvo.length) * 100);

  const minutos = tempoMs / 1000 / 60;
  const wpm = minutos > 0 ? Math.round((acertos / 5) / minutos) : 0;

  statWpm.textContent = wpm;
  statPrecisao.textContent = `${precisao}%`;
  statProgresso.textContent = `${Math.min(progresso, 100)}%`;

  return { wpm, precisao };
}

inputDigitacao.addEventListener("input", () => {
  if (concluido || !textoAtual) return;

  if (inicioEm === null) inicioEm = Date.now();

  const digitado = inputDigitacao.value;
  renderizarTextoAlvo(digitado);
  const { wpm, precisao } = atualizarStats(digitado, Date.now() - inicioEm);

  if (digitado === textoAtual.texto) {
    concluido = true;
    const tempoTotalMs = Date.now() - inicioEm;
    finalizarTexto(wpm, precisao, tempoTotalMs);
  }
});

// clicar no texto também foca o campo de digitação
textoAlvoEl.addEventListener("click", () => inputDigitacao.focus());

// --- tela 3: resultado -------------------------------------------------
function finalizarTexto(wpm, precisao, tempoTotalMs) {
  // compara com o recorde ANTES de sobrescrevê-lo, para saber se dá pra
  // comemorar um recorde novo
  const recordeAnterior = lerRecorde(textoAtual.id);
  const bateuRecorde = !!recordeAnterior && wpm > recordeAnterior.wpm;

  resultadoWpm.textContent = wpm;
  resultadoPrecisao.textContent = `${precisao}%`;
  resultadoTempo.textContent = `${Math.round(tempoTotalMs / 1000)}s`;
  resultadoTitulo.textContent = `Você concluiu: ${textoAtual.titulo}`;
  resultadoRecorde.textContent = bateuRecorde ? "🏆 Novo recorde pessoal!" : "";

  salvarRecordeSeMelhor(textoAtual.id, wpm, precisao);
  mostrarTela(telaResultado);
  tocarSomConclusao();
}

// --- localStorage: recordes simples por texto --------------------------
function chaveRecorde(id) {
  return `typingbook_recorde_${id}`;
}

function lerRecorde(id) {
  try {
    const bruto = localStorage.getItem(chaveRecorde(id));
    return bruto ? JSON.parse(bruto) : null;
  } catch (e) {
    return null; // localStorage pode falhar (modo privado, etc.) — segue sem recorde
  }
}

function salvarRecordeSeMelhor(id, wpm, precisao) {
  try {
    const atual = lerRecorde(id);
    if (!atual || wpm > atual.wpm) {
      localStorage.setItem(chaveRecorde(id), JSON.stringify({ wpm, precisao }));
    }
  } catch (e) {
    // ignora silenciosamente — recorde é um extra, não essencial
  }
}

// ============================================================================
// Som de digitação (opcional) — máquina de escrever / teclado mecânico
// ============================================================================
// Não usamos arquivo de áudio: o som é sintetizado na hora com a Web Audio
// API (ruído filtrado + um tom grave curto), o que mantém o site 100%
// estático e leve, sem depender de licença de nenhum efeito sonoro pronto.

function lerPreferenciaSom() {
  try {
    const salvo = localStorage.getItem("typingbook_som_ativado");
    return salvo === null ? true : salvo === "true"; // ligado por padrão
  } catch (e) {
    return true;
  }
}

function salvarPreferenciaSom(ativado) {
  try {
    localStorage.setItem("typingbook_som_ativado", ativado ? "true" : "false");
  } catch (e) {
    // ignora — preferência é um extra, não essencial
  }
}

let somAtivado = lerPreferenciaSom();

function atualizarBotaoSom() {
  btnSom.textContent = somAtivado ? "🔊" : "🔇";
  btnSom.setAttribute("aria-pressed", somAtivado ? "true" : "false");
  btnSom.title = somAtivado ? "Desativar som de digitação" : "Ativar som de digitação";
}

btnSom.addEventListener("click", () => {
  somAtivado = !somAtivado;
  salvarPreferenciaSom(somAtivado);
  atualizarBotaoSom();
});

atualizarBotaoSom(); // estado inicial do botão

let audioCtx = null;
let bufferRuidoClique = null;

function obterAudioCtx() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    audioCtx = new Ctx();
  }
  // navegadores suspendem o áudio até haver interação do usuário com a
  // página; como isso é chamado a partir de uma tecla pressionada, já
  // conta como interação e o resume() de novo não tem custo se já estiver ativo.
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function obterBufferRuido(ctx) {
  if (bufferRuidoClique) return bufferRuidoClique;
  const duracaoSeg = 0.05;
  const tamanho = Math.floor(ctx.sampleRate * duracaoSeg);
  bufferRuidoClique = ctx.createBuffer(1, tamanho, ctx.sampleRate);
  const dados = bufferRuidoClique.getChannelData(0);
  for (let i = 0; i < tamanho; i++) dados[i] = Math.random() * 2 - 1;
  return bufferRuidoClique;
}

// clique curto: ruído filtrado (textura do "estalo" mecânico) + um "thock"
// grave de corpo, com pequena variação aleatória para não soar repetitivo
function tocarSomTecla() {
  if (!somAtivado) return;
  try {
    const ctx = obterAudioCtx();
    const agora = ctx.currentTime;

    const fonteRuido = ctx.createBufferSource();
    fonteRuido.buffer = obterBufferRuido(ctx);
    const filtroRuido = ctx.createBiquadFilter();
    filtroRuido.type = "highpass";
    filtroRuido.frequency.value = 2200 + Math.random() * 1000;
    const ganhoRuido = ctx.createGain();
    ganhoRuido.gain.setValueAtTime(0.22, agora);
    ganhoRuido.gain.exponentialRampToValueAtTime(0.001, agora + 0.045);
    fonteRuido.connect(filtroRuido).connect(ganhoRuido).connect(ctx.destination);
    fonteRuido.start(agora);
    fonteRuido.stop(agora + 0.05);

    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(150 + Math.random() * 50, agora);
    osc.frequency.exponentialRampToValueAtTime(70, agora + 0.03);
    const ganhoOsc = ctx.createGain();
    ganhoOsc.gain.setValueAtTime(0.16, agora);
    ganhoOsc.gain.exponentialRampToValueAtTime(0.001, agora + 0.05);
    osc.connect(ganhoOsc).connect(ctx.destination);
    osc.start(agora);
    osc.stop(agora + 0.06);
  } catch (e) {
    // se o áudio falhar por qualquer motivo, a digitação segue normal
  }
}

// "tcharam" de duas notas tocado ao concluir um texto
function tocarSomConclusao() {
  if (!somAtivado) return;
  try {
    const ctx = obterAudioCtx();
    const agora = ctx.currentTime;
    [523.25, 783.99].forEach((freq, i) => { // Dó5, Sol5
      const inicio = agora + i * 0.09;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const ganho = ctx.createGain();
      ganho.gain.setValueAtTime(0, inicio);
      ganho.gain.linearRampToValueAtTime(0.22, inicio + 0.015);
      ganho.gain.exponentialRampToValueAtTime(0.001, inicio + 0.35);
      osc.connect(ganho).connect(ctx.destination);
      osc.start(inicio);
      osc.stop(inicio + 0.36);
    });
  } catch (e) {
    // ignora
  }
}

// teclas que não devem soar (modificadores, navegação, teclas de função)
const TECLAS_SEM_SOM = new Set([
  "Shift", "Control", "Alt", "Meta", "CapsLock", "Tab", "Escape",
  "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
  "Home", "End", "PageUp", "PageDown", "Insert",
  "NumLock", "ScrollLock", "Pause", "ContextMenu",
  "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",
]);

inputDigitacao.addEventListener("keydown", (ev) => {
  if (TECLAS_SEM_SOM.has(ev.key)) return;
  tocarSomTecla();
});

// --- botões de navegação -------------------------------------------------
btnVoltar.addEventListener("click", () => {
  mostrarTela(telaSelecao);
  montarListaTextos();
});

btnRepetir.addEventListener("click", () => iniciarTexto(textoAtual));

btnProximo.addEventListener("click", () => {
  mostrarTela(telaSelecao);
  montarListaTextos();
});

// --- início ---------------------------------------------------------------
montarListaTextos();
mostrarTela(telaSelecao);
