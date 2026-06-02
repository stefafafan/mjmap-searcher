export const renderIndexPage = (): string => `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>MJ縮退マップ検索</title>
    <style>
      @font-face {
        font-family: "MJMap Glyphs";
        src: url("/fonts/mjmap-glyphs.woff2") format("woff2");
        font-display: block;
      }

      :root {
        color-scheme: light;
        --bg: #f7f5f1;
        --ink: #181714;
        --muted: #69645d;
        --line: #d8d0c4;
        --panel: #fffdf8;
        --accent: #0f766e;
        --accent-ink: #ffffff;
        --danger: #b42318;
        font-family:
          Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
          sans-serif;
      }

      * {
        box-sizing: border-box;
      }

      body {
        min-height: 100svh;
        margin: 0;
        background:
          linear-gradient(90deg, rgba(24, 23, 20, 0.035) 1px, transparent 1px),
          linear-gradient(rgba(24, 23, 20, 0.03) 1px, transparent 1px),
          var(--bg);
        background-size: 32px 32px;
        color: var(--ink);
      }

      button,
      input {
        font: inherit;
      }

      button {
        min-height: 2.5rem;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: var(--panel);
        color: var(--ink);
        cursor: pointer;
        transition:
          border-color 140ms ease,
          background 140ms ease,
          transform 140ms ease;
      }

      button:hover {
        border-color: var(--accent);
        transform: translateY(-1px);
      }

      button:active {
        transform: translateY(0);
      }

      .app {
        width: min(1120px, calc(100% - 32px));
        margin: 0 auto;
        padding: 40px 0 56px;
      }

      .header {
        padding-bottom: 24px;
        border-bottom: 1px solid var(--line);
      }

      .title {
        margin: 0;
        font-size: clamp(1.75rem, 3.5vw, 3rem);
        font-weight: 720;
        letter-spacing: 0;
        line-height: 1.05;
      }

      .summary {
        max-width: 36rem;
        margin: 14px 0 0;
        color: var(--muted);
        font-size: 1rem;
      }

      .attribution {
        margin: 12px 0 0;
        color: var(--muted);
        font-size: 0.875rem;
      }

      .repo-link {
        margin: 10px 0 0;
        color: var(--muted);
        font-size: 0.875rem;
      }

      .attribution a,
      .repo-link a {
        color: var(--accent);
        text-decoration-thickness: 1px;
        text-underline-offset: 3px;
      }

      .search {
        display: grid;
        gap: 8px;
        justify-items: start;
        padding: 28px 0;
        border-bottom: 1px solid var(--line);
      }

      .control-row {
        display: grid;
        grid-template-columns: 8rem auto;
        gap: 12px;
        align-items: center;
      }

      label {
        color: var(--muted);
        font-size: 0.875rem;
        font-weight: 620;
      }

      input {
        width: 8rem;
        min-height: 4rem;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: var(--panel);
        color: var(--ink);
        font-family:
          "MJMap Glyphs", "Hiragino Mincho ProN", "Yu Mincho", "Noto Serif CJK JP",
          serif;
        font-size: 2.25rem;
        line-height: 1;
        padding: 0.5rem 0.875rem;
        text-align: center;
      }

      input:focus {
        outline: 3px solid rgba(15, 118, 110, 0.18);
        border-color: var(--accent);
      }

      .submit {
        min-width: 8rem;
        min-height: 4rem;
        border-color: var(--accent);
        background: var(--accent);
        color: var(--accent-ink);
        font-weight: 680;
      }

      .status {
        min-height: 1.5rem;
        margin: 0;
        color: var(--muted);
        font-size: 0.925rem;
      }

      .status[data-tone="error"] {
        color: var(--danger);
      }

      .hint {
        margin: 0;
        color: var(--muted);
        font-size: 0.875rem;
      }

      .results {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 28px;
        padding-top: 28px;
      }

      section {
        min-width: 0;
      }

      .section-head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--line);
      }

      h2 {
        margin: 0;
        font-size: 1rem;
        letter-spacing: 0;
      }

      .count {
        color: var(--muted);
        font-size: 0.875rem;
      }

      .list {
        display: grid;
        gap: 0;
      }

      .candidate {
        display: grid;
        grid-template-columns: minmax(5.5rem, auto) minmax(0, 1fr) auto;
        gap: 16px;
        align-items: center;
        min-height: 7.5rem;
        padding: 16px 0;
        border-bottom: 1px solid var(--line);
      }

      .glyph {
        font-family:
          "MJMap Glyphs", "Hiragino Mincho ProN", "Yu Mincho", "Noto Serif CJK JP",
          serif;
        font-size: clamp(4rem, 11vw, 6.5rem);
        line-height: 1;
      }

      .meta {
        min-width: 0;
      }

      .codepoint {
        overflow-wrap: anywhere;
        color: var(--muted);
        font-family:
          "SFMono-Regular", Consolas, "Liberation Mono", Menlo, ui-monospace, monospace;
        font-size: 0.95rem;
      }

      .copy {
        min-width: 5rem;
        padding: 0 0.875rem;
      }

      .empty {
        margin: 0;
        padding: 24px 0;
        color: var(--muted);
      }

      @media (max-width: 760px) {
        .app {
          width: min(100% - 24px, 1120px);
          padding-top: 24px;
        }

        .header,
        .results {
          grid-template-columns: 1fr;
        }

        .control-row {
          grid-template-columns: 1fr;
          width: 100%;
        }

        input {
          width: 100%;
        }

        .submit {
          width: 100%;
        }

        .candidate {
          grid-template-columns: minmax(4.75rem, auto) minmax(0, 1fr);
        }

        .copy {
          grid-column: 1 / -1;
          width: 100%;
        }
      }
    </style>
  </head>
  <body>
    <main class="app">
      <header class="header">
        <div>
          <h1 class="title">MJ縮退マップ検索</h1>
          <p class="summary">入力された文字から縮退先と縮退元候補を検索します。</p>
          <p class="attribution">
            本サービスは、IPAの著作物である
            <a href="https://moji.or.jp/mojikiban/map/" rel="license noreferrer" target="_blank">文字情報基盤 縮退マップ（MJ縮退マップ）</a>
            を利用して生成した検索データを使用しています。MJ縮退マップはクリエイティブ・コモンズ 表示-継承 2.1 日本 ライセンス（CC BY-SA 2.1 JP）で提供されています。
          </p>
          <p class="attribution">
            文字表示には、
            <a href="https://moji.or.jp/mojikiban/font/" rel="noreferrer" target="_blank">IPAmj明朝フォント</a>
            から、このサービスの検索データに現れる文字を subset 化して生成した Web フォントを使用しています。この Web フォントは
            <a href="/fonts/IPA_Font_License_Agreement_v1.0.txt">IPAフォントライセンス v1.0</a>
            で提供されています。
          </p>
          <p class="repo-link">
            ソースコード:
            <a href="https://github.com/stefafafan/mjmap-searcher" rel="noreferrer" target="_blank">github.com/stefafafan/mjmap-searcher</a>
          </p>
        </div>
      </header>

      <form class="search" id="lookup-form">
        <label for="char-input">検索する文字</label>
        <div class="control-row">
          <input id="char-input" name="char" autocomplete="off" inputmode="text" aria-describedby="char-hint status" />
          <button class="submit" type="submit">検索</button>
        </div>
        <p class="hint" id="char-hint">例: 髙、邉、齋</p>
        <p class="status" id="status">1文字を入力して検索してください。</p>
      </form>

      <div class="results">
        <section aria-labelledby="shrink-title">
          <div class="section-head">
            <h2 id="shrink-title">縮退先候補</h2>
            <span class="count" id="shrink-count">0</span>
          </div>
          <div class="list" id="shrink-list"></div>
        </section>

        <section aria-labelledby="reverse-title">
          <div class="section-head">
            <h2 id="reverse-title">縮退元候補</h2>
            <span class="count" id="reverse-count">0</span>
          </div>
          <div class="list" id="reverse-list"></div>
        </section>
      </div>
    </main>

    <script>
      const form = document.querySelector('#lookup-form');
      const input = document.querySelector('#char-input');
      const status = document.querySelector('#status');
      const shrinkList = document.querySelector('#shrink-list');
      const reverseList = document.querySelector('#reverse-list');
      const shrinkCount = document.querySelector('#shrink-count');
      const reverseCount = document.querySelector('#reverse-count');

      const setStatus = (message, tone = '') => {
        status.textContent = message;
        status.dataset.tone = tone;
      };

      const candidateNode = ({ char, codepoint }) => {
        const row = document.createElement('div');
        row.className = 'candidate';

        const glyph = document.createElement('div');
        glyph.className = 'glyph';
        glyph.textContent = char;

        const meta = document.createElement('div');
        meta.className = 'meta';

        const code = document.createElement('div');
        code.className = 'codepoint';
        code.textContent = codepoint;
        meta.append(code);

        const copy = document.createElement('button');
        copy.className = 'copy';
        copy.type = 'button';
        copy.textContent = 'コピー';
        copy.addEventListener('click', async () => {
          await navigator.clipboard.writeText(char);
          copy.textContent = 'コピー済み';
          window.setTimeout(() => {
            copy.textContent = 'コピー';
          }, 1000);
        });

        row.append(glyph, meta, copy);
        return row;
      };

      const renderCandidates = (container, countElement, candidates) => {
        container.replaceChildren();
        countElement.textContent = String(candidates.length);

        if (candidates.length === 0) {
          const empty = document.createElement('p');
          empty.className = 'empty';
          empty.textContent = '候補はありません。';
          container.append(empty);
          return;
        }

        container.append(...candidates.map(candidateNode));
      };

      const fetchCandidates = async (path, char) => {
        const response = await fetch(path + '?char=' + encodeURIComponent(char));
        const body = await response.json();

        if (!response.ok) {
          throw new Error(body.message ?? '検索に失敗しました。');
        }

        return body;
      };

      const lookup = async (char) => {
        setStatus('検索しています...');

        const [shrink, reverse] = await Promise.all([
          fetchCandidates('/api/shrink', char),
          fetchCandidates('/api/reverse', char),
        ]);

        renderCandidates(shrinkList, shrinkCount, shrink);
        renderCandidates(reverseList, reverseCount, reverse);
        setStatus('検索が完了しました。');
      };

      form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const char = input.value.trim();

        try {
          await lookup(char);
        } catch (error) {
          renderCandidates(shrinkList, shrinkCount, []);
          renderCandidates(reverseList, reverseCount, []);
          setStatus(error instanceof Error ? error.message : '検索に失敗しました。', 'error');
        }
      });

      renderCandidates(shrinkList, shrinkCount, []);
      renderCandidates(reverseList, reverseCount, []);
    </script>
  </body>
</html>`;
