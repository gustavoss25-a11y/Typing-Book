# TypingBook — protótipo v0

Primeira versão do site: você lê digitando o texto, cada tecla é comparada em
tempo real com o original, e no fim aparecem suas estatísticas (PPM = palavras
por minuto, precisão e tempo).

É um site 100% estático: **não tem backend, não tem login, não precisa de
build**. Só HTML, CSS e JavaScript puro. Isso foi proposital — é a forma mais
simples de começar, e dá pra publicar de graça no GitHub Pages.

## Arquivos

- `index.html` — estrutura das três telas (escolher texto / digitar / resultado)
- `style.css` — toda a aparência (cores, fontes, destaque de acerto/erro)
- `script.js` — o motor: compara o que você digita com o texto, calcula PPM e
  precisão, controla a navegação entre telas
- `textos.js` — a "biblioteca" de textos. **Leia os comentários desse arquivo**:
  os 3 textos de agora são só placeholders de demonstração, escritos para este
  protótipo — não são trechos de livros reais. Lá dentro tem o passo a passo
  de como trocar por um texto real de domínio público (Machado de Assis,
  José de Alencar etc.), copiando do Project Gutenberg ou do Wikisource.

## Como testar agora, no seu computador

Mais simples possível: dê duplo clique no arquivo `index.html`. Ele abre
no navegador normalmente, sem precisar instalar nada.

## Como publicar de graça no GitHub Pages

Veja o passo a passo que te mandei na conversa (ou repita comigo quando
quiser revisitar):

1. Criar uma conta gratuita no GitHub, se ainda não tiver.
2. Criar um novo repositório público (ex: nome `typingbook`).
3. Usar o botão "Add file → Upload files" para subir os 4 arquivos deste
   pacote (pode arrastar e soltar).
4. Ir em Settings → Pages, escolher a branch `main` e a pasta `/ (root)`,
   salvar.
5. Esperar 1-2 minutos. O link do seu site aparece na própria página de Pages,
   algo como `https://seu-usuario.github.io/typingbook/`.

## O que ainda falta (por design, de propósito — é fase 0)

- Sem login — progresso/recorde fica salvo só no navegador (localStorage),
  por texto.
- Sem upload de PDF próprio ainda — isso é feature de fase 2.
- Textos são só placeholders — trocar por domínio público real é o próximo
  passo natural antes de mostrar pra qualquer outra pessoa.
- Nenhum checkpoint de compreensão ainda (ideia registrada para mais pra
  frente, como diferencial frente a produtos parecidos).

As decisões e o plano de fases completo estão salvos no projeto "TypingBook"
no Claude, para consulta quando quiser retomar.
