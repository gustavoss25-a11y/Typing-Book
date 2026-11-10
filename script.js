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
const btnAmbiente = document.getElementById("btn-ambiente");
const btnTema = document.getElementById("btn-tema");
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

  // Antes só avançava se "digitado === textoAtual.texto" (tudo 100% certo).
  // Agora avança assim que a pessoa chega ao final do texto (mesmo tamanho),
  // independente de ter erros não corrigidos pelo caminho — a precisão%
  // continua sendo calculada e mostrada normalmente no resultado.
  if (digitado.length === textoAtual.texto.length) {
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
// Tema claro/escuro (manual) — fica salvo e não depende do sistema
// ============================================================================
// Antes o modo escuro entrava sozinho via "prefers-color-scheme", o que
// deixava o site escuro sem a pessoa escolher (caso o sistema dela já
// esteja no escuro). Agora é sempre a pessoa quem decide, com um botão.

function lerPreferenciaTema() {
  try {
    const salvo = localStorage.getItem("typingbook_tema");
    return salvo === "escuro" ? "escuro" : "claro"; // claro por padrão
  } catch (e) {
    return "claro";
  }
}

function salvarPreferenciaTema(tema) {
  try {
    localStorage.setItem("typingbook_tema", tema);
  } catch (e) {
    // ignora — preferência é um extra, não essencial
  }
}

let temaAtual = lerPreferenciaTema();

function aplicarTema() {
  if (temaAtual === "escuro") {
    document.documentElement.setAttribute("data-tema", "escuro");
  } else {
    document.documentElement.removeAttribute("data-tema");
  }
  btnTema.textContent = temaAtual === "escuro" ? "☀️" : "🌙";
  btnTema.title = temaAtual === "escuro" ? "Ativar modo claro" : "Ativar modo escuro";
  btnTema.setAttribute("aria-pressed", temaAtual === "escuro" ? "true" : "false");
}

btnTema.addEventListener("click", () => {
  temaAtual = temaAtual === "escuro" ? "claro" : "escuro";
  salvarPreferenciaTema(temaAtual);
  aplicarTema();
});

aplicarTema(); // estado inicial, antes de qualquer outra coisa na tela

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
  // o ícone (teclado com ondinhas / teclado com traço) já troca sozinho
  // via CSS a partir do aria-pressed — aqui só atualizamos o estado e o título
  btnSom.setAttribute("aria-pressed", somAtivado ? "true" : "false");
  btnSom.title = somAtivado ? "Desativar som do teclado" : "Ativar som do teclado";
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

// Toque em duas partes, para lembrar mais de perto uma máquina de escrever
// mecânica de verdade:
//   1) "clique" — o estalo seco do mecanismo da tecla armando, um transiente
//      bem curto e levemente metálico (ruído passado por um filtro passa-faixa
//      numa frequência média-alta);
//   2) "baque" — a barra do tipo batendo no rolo/papel, um instante depois,
//      com corpo mais grave e um pouco mais longo (ruído passa-baixo + um
//      tom grave curto).
// As duas partes juntas dão a sensação de "tec-TUM" de uma tecla mecânica,
// em vez de um único som genérico. Continua tudo suave (sem agudos ásperos,
// sem variação brusca de tom) e com pequena variação aleatória a cada toque.
function tocarSomTecla() {
  if (!somAtivado) return;
  try {
    const ctx = obterAudioCtx();
    const agora = ctx.currentTime;

    // 1) clique do mecanismo
    const fonteClique = ctx.createBufferSource();
    fonteClique.buffer = obterBufferRuido(ctx);
    const filtroClique = ctx.createBiquadFilter();
    filtroClique.type = "bandpass";
    filtroClique.frequency.value = 2200 + Math.random() * 900;
    filtroClique.Q.value = 3.2;
    const ganhoClique = ctx.createGain();
    ganhoClique.gain.setValueAtTime(0.07, agora);
    ganhoClique.gain.exponentialRampToValueAtTime(0.001, agora + 0.018);
    fonteClique.connect(filtroClique).connect(ganhoClique).connect(ctx.destination);
    fonteClique.start(agora);
    fonteClique.stop(agora + 0.02);

    // 2) baque da barra do tipo no rolo, chega um pouquinho depois do clique
    const inicioBaque = agora + 0.006 + Math.random() * 0.004;

    const fonteBaque = ctx.createBufferSource();
    fonteBaque.buffer = obterBufferRuido(ctx);
    const filtroBaque = ctx.createBiquadFilter();
    filtroBaque.type = "lowpass";
    filtroBaque.frequency.value = 550 + Math.random() * 300;
    filtroBaque.Q.value = 0.6;
    const ganhoBaque = ctx.createGain();
    ganhoBaque.gain.setValueAtTime(0.11, inicioBaque);
    ganhoBaque.gain.exponentialRampToValueAtTime(0.001, inicioBaque + 0.055);
    fonteBaque.connect(filtroBaque).connect(ganhoBaque).connect(ctx.destination);
    fonteBaque.start(inicioBaque);
    fonteBaque.stop(inicioBaque + 0.06);

    const oscBaque = ctx.createOscillator();
    oscBaque.type = "triangle";
    oscBaque.frequency.setValueAtTime(150 + Math.random() * 25, inicioBaque);
    oscBaque.frequency.exponentialRampToValueAtTime(90, inicioBaque + 0.05);
    const ganhoOscBaque = ctx.createGain();
    ganhoOscBaque.gain.setValueAtTime(0.06, inicioBaque);
    ganhoOscBaque.gain.exponentialRampToValueAtTime(0.001, inicioBaque + 0.05);
    oscBaque.connect(ganhoOscBaque).connect(ctx.destination);
    oscBaque.start(inicioBaque);
    oscBaque.stop(inicioBaque + 0.06);
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

// ============================================================================
// Som ambiente (opcional) — vários sons soltos à escolha, com volume próprio
// ============================================================================
// Tudo sintetizado na hora com a Web Audio API (ruído filtrado + alguns
// osciladores pontuais), sem nenhum arquivo de áudio. Os navegadores só
// deixam tocar áudio depois de alguma interação da pessoa com a página —
// então, se estiver ligado, o som começa sozinho assim que ela clica ou
// digita pela primeira vez em qualquer lugar do site.
//
// Passando o mouse (ou focando via teclado) sobre o botão de som ambiente
// aparece um painel com a lista de sons disponíveis e um controle de volume
// — trocar de som ou mexer no volume funciona mesmo com o som já tocando.

function lerPreferenciaAmbiente() {
  try {
    const salvo = localStorage.getItem("typingbook_ambiente_ativado");
    return salvo === null ? true : salvo === "true"; // ligado por padrão
  } catch (e) {
    return true;
  }
}

function salvarPreferenciaAmbiente(ativado) {
  try {
    localStorage.setItem("typingbook_ambiente_ativado", ativado ? "true" : "false");
  } catch (e) {
    // ignora — preferência é um extra, não essencial
  }
}

const TIPOS_AMBIENTE_VALIDOS = ["chuva", "floresta", "fogueira", "ondas"];

function lerTipoAmbiente() {
  try {
    const salvo = localStorage.getItem("typingbook_ambiente_tipo");
    return salvo && TIPOS_AMBIENTE_VALIDOS.includes(salvo) ? salvo : "chuva";
  } catch (e) {
    return "chuva";
  }
}

function salvarTipoAmbiente(tipo) {
  try {
    localStorage.setItem("typingbook_ambiente_tipo", tipo);
  } catch (e) {
    // ignora
  }
}

function lerVolumeAmbiente() {
  try {
    const salvo = localStorage.getItem("typingbook_ambiente_volume");
    const n = salvo === null ? 60 : parseInt(salvo, 10);
    return (isNaN(n) ? 60 : Math.min(100, Math.max(0, n))) / 100;
  } catch (e) {
    return 0.6;
  }
}

function salvarVolumeAmbiente(volume01) {
  try {
    localStorage.setItem("typingbook_ambiente_volume", String(Math.round(volume01 * 100)));
  } catch (e) {
    // ignora
  }
}

const listaSons = document.getElementById("lista-sons");
const botoesSom = listaSons ? Array.from(listaSons.querySelectorAll(".opcao-som")) : [];
const sliderVolumeAmbiente = document.getElementById("slider-volume-ambiente");

let ambienteAtivado = lerPreferenciaAmbiente();
let tipoAmbiente = lerTipoAmbiente();
let volumeAmbiente = lerVolumeAmbiente();
let nosAmbiente = null; // nós/temporizadores do som ambiente tocando agora, se houver
let ganhoMestreVolume = null; // nó de volume único, persiste entre trocas de som

function atualizarBotaoAmbiente() {
  // o ícone (nuvem com linhas de vento / nuvem com traço) já troca sozinho
  // via CSS a partir do aria-pressed — aqui só atualizamos o estado e o título
  btnAmbiente.setAttribute("aria-pressed", ambienteAtivado ? "true" : "false");
  btnAmbiente.title = ambienteAtivado ? "Desativar som ambiente" : "Ativar som ambiente";
}

function atualizarBotoesSom() {
  botoesSom.forEach(btn => {
    btn.setAttribute("aria-pressed", btn.dataset.som === tipoAmbiente ? "true" : "false");
  });
}

btnAmbiente.addEventListener("click", () => {
  ambienteAtivado = !ambienteAtivado;
  salvarPreferenciaAmbiente(ambienteAtivado);
  atualizarBotaoAmbiente();
  if (ambienteAtivado) {
    iniciarAmbiente();
  } else {
    pararAmbiente();
  }
});

botoesSom.forEach(btn => {
  btn.addEventListener("click", () => {
    const novoTipo = btn.dataset.som;
    if (novoTipo === tipoAmbiente) return;
    trocarPerfilAmbiente(novoTipo);
  });
});

if (sliderVolumeAmbiente) {
  sliderVolumeAmbiente.value = String(Math.round(volumeAmbiente * 100));
  sliderVolumeAmbiente.addEventListener("input", () => {
    volumeAmbiente = Number(sliderVolumeAmbiente.value) / 100;
    salvarVolumeAmbiente(volumeAmbiente);
    if (ganhoMestreVolume) ganhoMestreVolume.gain.value = volumeAmbiente;
  });
}

atualizarBotaoAmbiente(); // estado inicial do botão
atualizarBotoesSom(); // destaca o som salvo na lista

function criarBufferRuidoMarrom(ctx, duracaoSeg) {
  // "ruído marrom": cada amostra é uma pequena variação sobre a anterior
  // (em vez de totalmente aleatória, como o ruído branco usado no som do
  // teclado) — isso tira os agudos e deixa um chiado grave e constante,
  // parecido com chuva, vento, fogo ou mar ao longe, dependendo do filtro
  // aplicado em cima dele em cada perfil de som abaixo.
  const tamanho = Math.floor(ctx.sampleRate * duracaoSeg);
  const buffer = ctx.createBuffer(1, tamanho, ctx.sampleRate);
  const dados = buffer.getChannelData(0);
  let ultimo = 0;
  for (let i = 0; i < tamanho; i++) {
    const branco = Math.random() * 2 - 1;
    ultimo = (ultimo + 0.02 * branco) / 1.02;
    dados[i] = ultimo * 3.5; // compensa o volume naturalmente baixo do ruído marrom
  }
  return buffer;
}

function obterGanhoMestreVolume(ctx) {
  if (!ganhoMestreVolume) {
    ganhoMestreVolume = ctx.createGain();
    ganhoMestreVolume.gain.value = volumeAmbiente;
    ganhoMestreVolume.connect(ctx.destination);
  }
  return ganhoMestreVolume;
}

// --- perfil "chuva e vento" (o som original desta seção) -------------------
function iniciarPerfilChuva(ctx, destino) {
  const ganhoPerfil = ctx.createGain();
  ganhoPerfil.gain.value = 0;
  ganhoPerfil.connect(destino);

  const fonteChuva = ctx.createBufferSource();
  fonteChuva.buffer = criarBufferRuidoMarrom(ctx, 4);
  fonteChuva.loop = true;
  const filtroChuva = ctx.createBiquadFilter();
  filtroChuva.type = "lowpass";
  filtroChuva.frequency.value = 900;
  const ganhoChuva = ctx.createGain();
  ganhoChuva.gain.value = 0.05;

  const fonteVento = ctx.createBufferSource();
  fonteVento.buffer = criarBufferRuidoMarrom(ctx, 6);
  fonteVento.loop = true;
  const filtroVento = ctx.createBiquadFilter();
  filtroVento.type = "bandpass";
  filtroVento.frequency.value = 400;
  filtroVento.Q.value = 0.5;
  const ganhoVento = ctx.createGain();
  ganhoVento.gain.value = 0.025; // base constante; o LFO soma rajadas por cima

  const lfo = ctx.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = 0.07; // uma "rajada" a cada ~14s, bem devagar
  const ganhoLfo = ctx.createGain();
  ganhoLfo.gain.value = 0.018;
  lfo.connect(ganhoLfo).connect(ganhoVento.gain);

  fonteChuva.connect(filtroChuva).connect(ganhoChuva).connect(ganhoPerfil);
  fonteVento.connect(filtroVento).connect(ganhoVento).connect(ganhoPerfil);

  const agora = ctx.currentTime;
  ganhoPerfil.gain.setValueAtTime(0, agora);
  ganhoPerfil.gain.linearRampToValueAtTime(1, agora + 1.5); // entra bem devagar

  fonteChuva.start(agora);
  fonteVento.start(agora);
  lfo.start(agora);

  return { fontes: [fonteChuva, fonteVento, lfo], ganhoPerfil };
}

// --- perfil "floresta": vento mais arejado entre folhas + passarinhos ao longe, de vez em quando ---
function tocarPassaro(ctx, destino) {
  try {
    const agora = ctx.currentTime;
    const bips = 2 + Math.floor(Math.random() * 2); // 2 ou 3 bipzinhos por canto
    for (let i = 0; i < bips; i++) {
      const inicio = agora + i * (0.12 + Math.random() * 0.07);
      const freqBase = 2200 + Math.random() * 1400;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freqBase, inicio);
      osc.frequency.exponentialRampToValueAtTime(freqBase * 1.3, inicio + 0.05);
      osc.frequency.exponentialRampToValueAtTime(freqBase * 0.85, inicio + 0.1);
      const ganho = ctx.createGain();
      ganho.gain.setValueAtTime(0, inicio);
      ganho.gain.linearRampToValueAtTime(0.045, inicio + 0.015);
      ganho.gain.exponentialRampToValueAtTime(0.001, inicio + 0.12);
      osc.connect(ganho).connect(destino);
      osc.start(inicio);
      osc.stop(inicio + 0.13);
    }
  } catch (e) {
    // se falhar, só não canta dessa vez
  }
}

function iniciarPerfilFloresta(ctx, destino) {
  const ganhoPerfil = ctx.createGain();
  ganhoPerfil.gain.value = 0;
  ganhoPerfil.connect(destino);

  const fonteFolhas = ctx.createBufferSource();
  fonteFolhas.buffer = criarBufferRuidoMarrom(ctx, 5);
  fonteFolhas.loop = true;
  const filtroFolhas = ctx.createBiquadFilter();
  filtroFolhas.type = "bandpass";
  filtroFolhas.frequency.value = 1200; // mais agudo/arejado que a chuva — folhas, não chuvisco
  filtroFolhas.Q.value = 0.6;
  const ganhoFolhas = ctx.createGain();
  ganhoFolhas.gain.value = 0.05;

  const lfo = ctx.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = 0.09;
  const ganhoLfo = ctx.createGain();
  ganhoLfo.gain.value = 0.02;
  lfo.connect(ganhoLfo).connect(ganhoFolhas.gain);

  fonteFolhas.connect(filtroFolhas).connect(ganhoFolhas).connect(ganhoPerfil);

  const agora = ctx.currentTime;
  ganhoPerfil.gain.setValueAtTime(0, agora);
  ganhoPerfil.gain.linearRampToValueAtTime(1, agora + 1.5);

  fonteFolhas.start(agora);
  lfo.start(agora);

  // passarinhos distantes, em intervalos aleatórios — não é um loop, é
  // reagendado a cada vez, pra nunca soar igual duas vezes seguidas
  let timeoutPassaro = null;
  function agendarPassaro() {
    timeoutPassaro = setTimeout(() => {
      tocarPassaro(ctx, ganhoPerfil);
      agendarPassaro();
    }, 3500 + Math.random() * 6000);
  }
  agendarPassaro();

  return {
    fontes: [fonteFolhas, lfo],
    ganhoPerfil,
    aoParar: () => { if (timeoutPassaro) clearTimeout(timeoutPassaro); },
  };
}

// --- perfil "fogueira": ronco grave constante + crepitar aleatório -----------
function tocarCrepitar(ctx, destino) {
  try {
    const agora = ctx.currentTime;
    const fonte = ctx.createBufferSource();
    fonte.buffer = obterBufferRuido(ctx); // reaproveita o ruído branco curto do som do teclado
    const filtro = ctx.createBiquadFilter();
    filtro.type = "bandpass";
    filtro.frequency.value = 1500 + Math.random() * 2500;
    filtro.Q.value = 1.5;
    const ganho = ctx.createGain();
    const pico = 0.05 + Math.random() * 0.07;
    ganho.gain.setValueAtTime(pico, agora);
    ganho.gain.exponentialRampToValueAtTime(0.001, agora + 0.03 + Math.random() * 0.03);
    fonte.connect(filtro).connect(ganho).connect(destino);
    fonte.start(agora);
    fonte.stop(agora + 0.08);
  } catch (e) {
    // se falhar, só não crepita dessa vez
  }
}

function iniciarPerfilFogueira(ctx, destino) {
  const ganhoPerfil = ctx.createGain();
  ganhoPerfil.gain.value = 0;
  ganhoPerfil.connect(destino);

  const fonteRonco = ctx.createBufferSource();
  fonteRonco.buffer = criarBufferRuidoMarrom(ctx, 4);
  fonteRonco.loop = true;
  const filtroRonco = ctx.createBiquadFilter();
  filtroRonco.type = "lowpass";
  filtroRonco.frequency.value = 350; // bem grave — o "corpo" da fogueira
  const ganhoRonco = ctx.createGain();
  ganhoRonco.gain.value = 0.06;
  fonteRonco.connect(filtroRonco).connect(ganhoRonco).connect(ganhoPerfil);

  const agora = ctx.currentTime;
  ganhoPerfil.gain.setValueAtTime(0, agora);
  ganhoPerfil.gain.linearRampToValueAtTime(1, agora + 1.2);
  fonteRonco.start(agora);

  // estalos de lenha em intervalos curtos e aleatórios
  let timeoutCrepitar = null;
  function agendarCrepitar() {
    timeoutCrepitar = setTimeout(() => {
      tocarCrepitar(ctx, ganhoPerfil);
      agendarCrepitar();
    }, 90 + Math.random() * 420);
  }
  agendarCrepitar();

  return {
    fontes: [fonteRonco],
    ganhoPerfil,
    aoParar: () => { if (timeoutCrepitar) clearTimeout(timeoutCrepitar); },
  };
}

// --- perfil "ondas do mar": ruído grave que incha e recua devagar, tipo maré ---
function iniciarPerfilOndas(ctx, destino) {
  const ganhoPerfil = ctx.createGain();
  ganhoPerfil.gain.value = 0;
  ganhoPerfil.connect(destino);

  const fonteOnda = ctx.createBufferSource();
  fonteOnda.buffer = criarBufferRuidoMarrom(ctx, 6);
  fonteOnda.loop = true;
  const filtroOnda = ctx.createBiquadFilter();
  filtroOnda.type = "lowpass";
  filtroOnda.frequency.value = 650;
  const ganhoOnda = ctx.createGain();
  ganhoOnda.gain.value = 0.045;

  const lfo = ctx.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = 0.12; // uma "onda" quebrando a cada ~8s
  const ganhoLfo = ctx.createGain();
  ganhoLfo.gain.value = 0.035;
  lfo.connect(ganhoLfo).connect(ganhoOnda.gain);

  fonteOnda.connect(filtroOnda).connect(ganhoOnda).connect(ganhoPerfil);

  const agora = ctx.currentTime;
  ganhoPerfil.gain.setValueAtTime(0, agora);
  ganhoPerfil.gain.linearRampToValueAtTime(1, agora + 1.5);
  fonteOnda.start(agora);
  lfo.start(agora);

  return { fontes: [fonteOnda, lfo], ganhoPerfil };
}

const PERFIS_AMBIENTE = {
  chuva: iniciarPerfilChuva,
  floresta: iniciarPerfilFloresta,
  fogueira: iniciarPerfilFogueira,
  ondas: iniciarPerfilOndas,
};

function iniciarAmbiente() {
  if (nosAmbiente || !ambienteAtivado) return;
  try {
    const ctx = obterAudioCtx();
    const destino = obterGanhoMestreVolume(ctx);
    const construirPerfil = PERFIS_AMBIENTE[tipoAmbiente] || PERFIS_AMBIENTE.chuva;
    nosAmbiente = { ...construirPerfil(ctx, destino), ctx };
  } catch (e) {
    // se o som ambiente falhar por qualquer motivo, o resto do site segue normal
  }
}

function pararAmbiente() {
  if (!nosAmbiente) return;
  try {
    const { fontes, ganhoPerfil, aoParar, ctx } = nosAmbiente;
    if (aoParar) aoParar();
    const agora = ctx.currentTime;
    // some suavemente em vez de cortar seco, pra não dar um "clique" no ouvido
    ganhoPerfil.gain.setValueAtTime(ganhoPerfil.gain.value, agora);
    ganhoPerfil.gain.linearRampToValueAtTime(0, agora + 0.4);
    setTimeout(() => {
      fontes.forEach(no => {
        try { no.stop(); } catch (e2) {
          // pode já ter parado sozinho — sem problema
        }
      });
    }, 450);
  } catch (e) {
    // ignora
  }
  nosAmbiente = null;
}

function trocarPerfilAmbiente(novoTipo) {
  tipoAmbiente = novoTipo;
  salvarTipoAmbiente(tipoAmbiente);
  atualizarBotoesSom();
  if (nosAmbiente) {
    // troca ao vivo: desliga o perfil atual com um fade e liga o novo logo em seguida,
    // sem precisar desligar o botão principal nem perder o estado "ligado"
    pararAmbiente();
    setTimeout(() => { if (ambienteAtivado) iniciarAmbiente(); }, 420);
  }
}

// tenta iniciar o ambiente assim que a pessoa interagir pela primeira vez
// com a página (clique ou tecla) — exigência dos navegadores para tocar áudio
function tentarIniciarAmbienteNaPrimeiraInteracao() {
  if (ambienteAtivado) iniciarAmbiente();
  document.removeEventListener("click", tentarIniciarAmbienteNaPrimeiraInteracao);
  document.removeEventListener("keydown", tentarIniciarAmbienteNaPrimeiraInteracao);
}
document.addEventListener("click", tentarIniciarAmbienteNaPrimeiraInteracao);
document.addEventListener("keydown", tentarIniciarAmbienteNaPrimeiraInteracao);

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
