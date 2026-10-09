---
name: oled-doc
description: Build a self-contained OLED-black, monochromatic HTML document (research docs, proposals, design write-ups) with INTERACTIVE step-through workflow diagrams (clickable next/back navigation). Use whenever the user asks for an HTML doc, a research/proposal page, a "nice doc", or a visual write-up of a flow/plan/architecture.
---

# OLED Doc

Produce a single, self-contained HTML file styled as a **pure-black (OLED) monochromatic document** with **interactive step-through workflow diagrams**. This is the house style — match it every time unless the user overrides a specific point.

## Non-negotiable rules

1. **One self-contained file.** All CSS and JS inline in the `.html`. No external stylesheets, fonts, CDNs, or frameworks. It must work offline by double-clicking.
2. **OLED black + monochrome.** Background is pure `#000`. The entire palette is grayscale — **no color hues**. Distinguish states (ok / warn / bad) by *border style* (solid/dashed) and *fill brightness*, never by color. (If the user explicitly asks for one accent hue, add exactly one and keep everything else grayscale.)
3. **Every workflow / flow / process MUST be a diagram**, not a paragraph. If the doc describes a sequence, pipeline, loop, or architecture, render it visually.
4. **Think in diagrams first, and reach for three modes.** Before writing a paragraph, ask "is this a flow, a sequence, a set of network/service calls, or an architecture?" If yes, it becomes a diagram. The three modes, in order of richness:
   - **(a) Interactive step-through walkthrough** — REQUIRED for every process. Back/Next buttons, clickable nodes, step counter, arrow-key support, updating caption.
   - **(b) Static SVG workflow diagram** — add this above the walkthrough whenever the process has **multiple actors, shared resources, ownership, or containment** (architecture, "who lives where", "who touches what"). The SVG shows space; the walkthrough shows time. Both monochrome.
   - **(c) Interactive network call diagram** — the strongest option for **service-to-service / request-response / API call sequences**. Wire the SVG's arrows and nodes to the walkthrough steps so stepping Next *lights up the active hop* (client → API → cache → db → response). It is mode (a) and (b) fused: the map animates as you walk the calls. Default to this whenever the doc describes network calls, message flows, or a request crossing several services. See "Interactive network call diagram" below.
5. **Save to `docs/`** by default (`docs/<topic>.html`). Create the dir if missing.
6. **When done, open it in Chrome:** `open -a "Google Chrome" <abs-path>` (macOS). Mention they can also drag it anywhere.
7. **No em-dashes (—) in the document's copy.** Don't use `—`, `&mdash;`, or `&#8212;` in any prose, heading, caption, callout, or table cell. Rewrite with a comma, colon, parentheses, or two separate sentences instead. (En-dashes in numeric ranges are fine; this rule is specifically about the em-dash as a sentence connector.)

## Document structure

- **Header**: a mono `eyebrow` label, a gradient `<h1>` (white→gray), `meta` chips (date, author, tags), and a `lede` paragraph with a left border.
- **Sections**: each `<h2>` is a mono uppercase label prefixed with a zero-padded number (`01`, `02`, …). Keep numbering sequential — renumber if you insert a section. Give every `<section>` an `id` (e.g. `id="s01"`) so the index can link to it.
- **Left index (TOC) sidebar**: for any doc with **4+ sections**, add a `position:fixed` left sidebar (`.toc`, ~240px) listing each section as a mono-numbered link. Smooth-scroll via `html{scroll-behavior:smooth}`, highlight the active link with an `IntersectionObserver` (`rootMargin:'-20% 0px -70% 0px'`), and clear room with `@media(min-width:1181px){body{padding-left:240px}}`; hide the sidebar below that width so the single-column layout is untouched on laptops/mobile. Keep it monochrome (active link = `--text` + white number). Use the component below.
- **Components available**: verdict/comparison tables, callout boxes (with a mono `tag`), clean bordered lists, "key shifts" from→to grids, a two-column sources list of real links.
- **Footer**: mono, dim, centered — filename + theme note.

## Theme tokens (paste into `<style>`)

```css
:root{
  --bg:#000;--surface:#0a0a0a;--surface-2:#111;--border:#262626;--border-bright:#3a3a3a;
  --text:#f2f2f2;--text-dim:#b4b4b4;--text-faint:#8f8f8f;--accent:#fff;
  --mono:"SF Mono","JetBrains Mono",ui-monospace,Menlo,monospace;
  --sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,system-ui,sans-serif;
}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font-family:var(--sans);font-size:17px;line-height:1.7;-webkit-font-smoothing:antialiased}
.wrap{max-width:920px;margin:0 auto;padding:72px 28px 120px}
h1{font-size:40px;line-height:1.12;font-weight:600;letter-spacing:-.02em;margin:0 0 22px;
  background:linear-gradient(180deg,#fff,#9a9a9a);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.eyebrow{font-family:var(--mono);font-size:12px;letter-spacing:.28em;text-transform:uppercase;color:var(--text-faint);margin-bottom:18px}
h2{font-size:13px;font-family:var(--mono);letter-spacing:.22em;text-transform:uppercase;color:var(--text-faint);
  margin:0 0 28px;padding-bottom:14px;border-bottom:1px solid var(--border)}
h2 .num{color:var(--accent)}
code{font-family:var(--mono);font-size:.88em;background:var(--surface-2);border:1px solid var(--border);border-radius:5px;padding:1px 6px}
a{color:var(--text);border-bottom:1px solid var(--border-bright);text-decoration:none}
.callout{border:1px solid var(--border-bright);border-left:3px solid #6a6a6a;border-radius:10px;padding:18px 22px;background:var(--surface);margin:24px 0}
.callout .tag{font-family:var(--mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--text-faint);margin-bottom:8px}
```

State badges stay monochrome — vary brightness + border style only:
```css
.badge{font-family:var(--mono);font-size:11px;font-weight:600;padding:3px 9px;border-radius:6px;border:1px solid var(--border-bright);display:inline-block}
.b-ok{color:#fff;background:#1c1c1c;border-color:#555}
.b-warn{color:#c9c9c9;background:#141414;border-color:#3a3a3a;border-style:dashed}
.b-bad{color:#8a8a8a;background:#0d0d0d;border-color:#2a2a2a}
```

## Typography (stick to this — don't improvise)

Two families only, both system/web-safe so the file stays self-contained (no font CDNs):

- **Sans (body & headings):** `-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, system-ui, sans-serif` — used for prose, titles, node labels.
- **Mono (labels, code, UI chrome):** `"SF Mono", "JetBrains Mono", "Fira Code", ui-monospace, Menlo, monospace` — used for eyebrows, section numbers, badges, counters, buttons, captions' stage line, footer.

The rule of thumb: **anything that is a label, tag, number, or control = mono uppercase with wide letter-spacing. Anything you actually read in sentences = sans.**

Fixed type scale — reuse these, don't invent new sizes:

| Element | Family | Size | Weight | Letter-spacing | Notes |
|---|---|---|---|---|---|
| `h1` | sans | 40px (30px ≤680px) | 600 | -0.02em | white→gray gradient text |
| `h2` section label | mono | 13px | 600 | 0.22em | UPPERCASE, dim |
| `h3` | sans | 20px | 600 | -0.01em | |
| eyebrow | mono | 12px | 400 | 0.28em | UPPERCASE, faint |
| body `p` | sans | 17px | 400 | normal | line-height 1.7, `#eaeaea` |
| lede | sans | 20px | 400 | normal | line-height 1.6, `#dadada`, left border |
| meta chips | mono | 12px | 400 | normal | |
| badge / tag | mono | 11px | 600 | 0.05–0.16em | UPPERCASE |
| table header | mono | 11px | 400 | 0.14em | UPPERCASE, faint |
| buttons / counter | mono | 13px | 400–600 | normal | |
| footer | mono | 12px | 400 | normal | faint, centered |

Base `body{font-size:17px;line-height:1.7}`. Headings use `letter-spacing` tightening (negative) and labels use widening (positive) — that contrast is core to the look. Use real `font-weight` values (400/600), never `bold`.

**Readability floor (don't regress this).** OLED black is unforgiving — dim greys on pure black read as unreadable. So: prose (`p`, list items, table cells, walkthrough captions, figcaptions) is `#eaeaea` and **never below 16.5px**; the lede is `#dadada` at 20px. `--text-dim` (`#b4b4b4`) and `--text-faint` (`#8f8f8f`) are for **labels/chrome only** (eyebrows, section numbers, mono chips, TOC links) — never for sentences you actually read. If text feels greyed-out, it's wrong; lift it toward `#eaeaea` and bump the size, don't leave it dim.

## The interactive walkthrough component (REQUIRED for diagrams)

Drop this in for each workflow. It shows every step as a node (so the whole flow is visible), highlights the active one, and lets the user step with **Next/Back buttons, clicking a node, or arrow keys**. A caption panel updates per step. Multiple walkthroughs per page are supported (it scopes per `[data-walk]`).

```html
<div class="walk" data-walk>
  <div class="walk-track">
    <button class="wnode" data-i="0">
      <span class="wn-num">1</span>
      <span class="wn-title">Capture</span>
    </button>
    <span class="wn-arrow">→</span>
    <button class="wnode" data-i="1">
      <span class="wn-num">2</span>
      <span class="wn-title">Diagnose</span>
    </button>
    <span class="wn-arrow">→</span>
    <button class="wnode" data-i="2">
      <span class="wn-num">3</span>
      <span class="wn-title">Fix</span>
    </button>
  </div>

  <div class="walk-detail">
    <div class="wd-stage" data-detail="0">Step 1 · Capture</div>
    <p class="wd-body" data-detail="0">What happens in step one…</p>
    <div class="wd-stage" data-detail="1" hidden>Step 2 · Diagnose</div>
    <p class="wd-body" data-detail="1" hidden>What happens in step two…</p>
    <div class="wd-stage" data-detail="2" hidden>Step 3 · Fix</div>
    <p class="wd-body" data-detail="2" hidden>What happens in step three…</p>
  </div>

  <div class="walk-nav">
    <button class="wbtn wprev">← Back</button>
    <span class="wcount"><b>1</b> / 3</span>
    <button class="wbtn wnext">Next →</button>
  </div>
</div>
```

```css
.walk{background:radial-gradient(800px 320px at 50% -10%,#141414,transparent 70%),var(--surface);
  border:1px solid var(--border);border-radius:16px;padding:32px 28px}
.walk-track{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:center}
.wnode{display:flex;flex-direction:column;align-items:center;gap:6px;min-width:120px;cursor:pointer;
  background:var(--surface-2);border:1px solid var(--border);border-radius:12px;padding:16px 18px;
  color:var(--text-dim);font-family:var(--sans);transition:all .2s;opacity:.55}
.wnode:hover{opacity:.85;border-color:var(--border-bright)}
.wnode.active{opacity:1;border-color:#6a6a6a;color:var(--text);
  background:linear-gradient(180deg,#1a1a1a,#0e0e0e);box-shadow:0 12px 44px -22px rgba(255,255,255,.3)}
.wnode.done{opacity:.8;border-color:var(--border-bright)}
.wn-num{font-family:var(--mono);font-size:12px;font-weight:600;width:24px;height:24px;border-radius:7px;
  display:inline-flex;align-items:center;justify-content:center;background:#222;color:var(--text-dim)}
.wnode.active .wn-num{background:var(--accent);color:#000}
.wn-title{font-size:14px;font-weight:600}
.wn-arrow{color:var(--text-faint);font-family:var(--mono)}
.walk-detail{margin-top:24px;border:1px solid var(--border);border-radius:12px;padding:20px 22px;background:#000;min-height:96px}
.wd-stage{font-family:var(--mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--text-faint);margin-bottom:10px}
.wd-body{margin:0;color:#cfcfcf;font-size:15px}
.walk-nav{display:flex;align-items:center;justify-content:center;gap:18px;margin-top:22px}
.wbtn{font-family:var(--mono);font-size:13px;color:var(--text);background:var(--surface-2);
  border:1px solid var(--border-bright);border-radius:9px;padding:9px 18px;cursor:pointer;transition:all .15s}
.wbtn:hover:not(:disabled){background:#1c1c1c;border-color:#5a5a5a}
.wbtn:disabled{opacity:.3;cursor:not-allowed}
.wcount{font-family:var(--mono);font-size:13px;color:var(--text-dim)}
.wcount b{color:var(--text)}
@media(max-width:680px){.wn-arrow{display:none}.wnode{min-width:0;flex:1 1 80px}}
```

```html
<script>
document.querySelectorAll('[data-walk]').forEach(function(walk){
  var nodes   = walk.querySelectorAll('.wnode');
  var details = walk.querySelectorAll('[data-detail]');
  var prev    = walk.querySelector('.wprev');
  var next    = walk.querySelector('.wnext');
  var count   = walk.querySelector('.wcount b');
  var total   = nodes.length;
  var i = 0;
  function render(){
    nodes.forEach(function(n,idx){
      n.classList.toggle('active', idx===i);
      n.classList.toggle('done', idx<i);
    });
    details.forEach(function(d){ d.hidden = (+d.dataset.detail !== i); });
    if(count) count.textContent = i+1;
    prev.disabled = i===0;
    next.disabled = i===total-1;
  }
  next.addEventListener('click', function(){ if(i<total-1){i++;render();} });
  prev.addEventListener('click', function(){ if(i>0){i--;render();} });
  nodes.forEach(function(n){ n.addEventListener('click', function(){ i=+n.dataset.i; render(); }); });
  walk.tabIndex = 0;
  walk.addEventListener('keydown', function(e){
    if(e.key==='ArrowRight'){ if(i<total-1){i++;render();} }
    if(e.key==='ArrowLeft'){ if(i>0){i--;render();} }
  });
  render();
});
</script>
```

### Variants
- **Linear flow** → the horizontal track above.
- **Closing loop / cycle** → after the last node show a dashed "↺ loops back" return bar; on the final step the caption explains the loop closing.
- **Vertical pipeline** → switch `.walk-track` to `flex-direction:column` and use a vertical connector instead of `→`.

Keep the interaction model identical across variants: highlight-active + Back/Next + clickable nodes + arrow keys + updating caption.

## The left index (TOC) sidebar component

For any doc with 4+ sections, drop this in. It is a fixed left rail of mono-numbered links; the active section highlights as you scroll, and it disappears below 1181px so the single-column reading experience is unchanged on smaller screens.

```html
<nav class="toc" aria-label="Contents">
  <div class="toc-label">Contents</div>
  <a href="#s01" data-toc="s01"><span class="toc-num">01</span> First Section</a>
  <a href="#s02" data-toc="s02"><span class="toc-num">02</span> Second Section</a>
  <a href="#s03" data-toc="s03"><span class="toc-num">03</span> Third Section</a>
  <a href="#s04" data-toc="s04"><span class="toc-num">04</span> Fourth Section</a>
</nav>
```

Each section must carry the matching id: `<section id="s01"> … </section>`.

```css
html{scroll-behavior:smooth}
.toc{position:fixed;top:0;left:0;width:240px;height:100vh;overflow-y:auto;
  padding:72px 22px 40px;border-right:1px solid var(--border);background:#000;display:none;z-index:20}
.toc-label{font-family:var(--mono);font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:var(--text-faint);margin-bottom:18px}
.toc a{display:flex;gap:10px;align-items:baseline;font-size:13px;color:var(--text-dim);
  text-decoration:none;border:none;padding:7px 0;line-height:1.45;transition:color .15s}
.toc a:hover{color:var(--text)}
.toc a.active{color:var(--text)}
.toc-num{font-family:var(--mono);font-size:11px;color:var(--text-faint);flex:0 0 auto}
.toc a.active .toc-num{color:var(--accent)}
@media(min-width:1181px){body{padding-left:240px}.toc{display:block}}
```

```html
<script>
(function(){
  var links = {};
  document.querySelectorAll('.toc a[data-toc]').forEach(function(a){ links[a.dataset.toc] = a; });
  var obs = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){
        Object.keys(links).forEach(function(k){ links[k].classList.remove('active'); });
        if(links[e.target.id]) links[e.target.id].classList.add('active');
      }
    });
  }, {rootMargin:'-20% 0px -70% 0px'});
  document.querySelectorAll('section[id]').forEach(function(s){ obs.observe(s); });
})();
</script>
```

## The workflow SVG diagram (pair with each walkthrough that has actors)

Step-throughs are great at showing *time*. They're weak at showing *spatial relationships*: who lives where, what contains what, who is touching a shared resource. Pair every walkthrough that explains an architecture or multi-actor flow with a **static SVG diagram directly above the walkthrough**. The SVG is the map; the walkthrough animates time over that map.

Use this pattern when **any** of these are true:
- Multiple actors / roles / tasks operate in parallel.
- One side of the system "contains" another (scope, transaction, session, namespace, owner).
- The insight is about *who opens / closes / mutates* a shared resource.
- You want to compare two architectures side by side (before vs after, naive vs fixed).

Skip it for purely sequential pipelines with one actor; the walkthrough alone is enough.

### Layout pattern

A two-column composition inside a 720x360 viewBox:

- **Left column** — actor boxes stacked vertically. Each ~110×40, rounded 7px. Ordinary actors: `fill="#111"` `stroke="#3a3a3a"`. The actor whose role drives the insight: `fill="#1c1c1c"` `stroke="#fff"` (1.5px), label text `#fff`.
- **Right column** — a large container rectangle (~480×320, rounded 12px) representing the system. Mono uppercase eyebrow at the top with letter-spacing 2.4em and color `#5c5c5c`.
- **Inside the container** — one or more nested regions. A **dashed-border** region (`stroke="#cfcfcf"` `stroke-dasharray="5,4"`) marks a *bounded resource*: scope, transaction, session, lifecycle. Inside it, small info panels: mono uppercase label in `#5c5c5c`, value text in `#ededed`.
- **Arrows** — `stroke="#666"` (1.2px) for ordinary connections, `stroke="#fff"` (1.5px) for the connection of interest. Use `<marker>` in `<defs>` for the arrowhead, and use Bézier paths so arrows curve cleanly from left actor stack to right container.
- **Bottom panel** (optional) — a "RESULT" box that states the outcome (crash, success, invariant). Use white border for failure, dim border for success.

### CSS for the figure wrapper

```css
figure.diagram{margin:24px 0 6px;padding:18px 14px 14px;background:#050505;border:1px solid var(--border);border-radius:14px}
figure.diagram svg{width:100%;height:auto;display:block}
figure.diagram figcaption{margin-top:14px;padding:0 8px;font-family:var(--mono);font-size:12px;color:var(--text-dim);line-height:1.6;letter-spacing:.01em}
figure.diagram figcaption code{font-size:.92em}
```

### Skeleton template

```html
<figure class="diagram">
  <svg viewBox="0 0 720 360" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="brief diagram description">
    <defs>
      <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#8a8a8a"/></marker>
      <marker id="arr-bright" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#fff"/></marker>
    </defs>

    <!-- LEFT: actors -->
    <g font-family="SF Mono,monospace" font-size="12" fill="#cfcfcf">
      <rect x="20" y="30"  width="110" height="40" rx="7" fill="#111"    stroke="#3a3a3a"/><text x="75" y="55"  text-anchor="middle">Actor A</text>
      <rect x="20" y="90"  width="110" height="40" rx="7" fill="#111"    stroke="#3a3a3a"/><text x="75" y="115" text-anchor="middle">Actor B</text>
      <rect x="20" y="210" width="110" height="40" rx="7" fill="#1c1c1c" stroke="#fff" stroke-width="1.5"/><text x="75" y="235" text-anchor="middle" fill="#fff">Actor of interest</text>
    </g>

    <!-- arrows: ordinary -->
    <g stroke="#666" stroke-width="1.2" fill="none" marker-end="url(#arr)">
      <path d="M130,50  C170,50 170,110 200,110"/>
      <path d="M130,110 C170,110 170,140 200,140"/>
    </g>
    <!-- arrow: actor of interest -->
    <path d="M130,230 C170,230 170,210 200,210" stroke="#fff" stroke-width="1.5" fill="none" marker-end="url(#arr-bright)"/>

    <!-- RIGHT: the system -->
    <g>
      <rect x="200" y="20"  width="500" height="320" rx="12" fill="#0a0a0a" stroke="#3a3a3a"/>
      <text x="218" y="45"  font-family="SF Mono,monospace" font-size="10" letter-spacing="2.4" fill="#5c5c5c">SYSTEM_NAME</text>

      <!-- bounded resource (dashed border = a scope / lifecycle / region) -->
      <rect x="218" y="62"  width="464" height="262" rx="10" fill="#050505" stroke="#cfcfcf" stroke-dasharray="5,4"/>
      <text x="236" y="86"  font-family="SF Mono,monospace" font-size="10" letter-spacing="2.4" fill="#cfcfcf">SCOPE_NAME</text>
      <text x="236" y="106" font-family="SF Mono,monospace" font-size="11" fill="#cfcfcf">one-line statement of ownership</text>

      <!-- info panel -->
      <text x="236" y="146" font-family="SF Mono,monospace" font-size="10" letter-spacing="2.2" fill="#5c5c5c">METRIC_NAME</text>
      <text x="236" y="166" font-family="SF Mono,monospace" font-size="13" fill="#ededed">value evolution: 0 → N → 0</text>

      <text x="236" y="206" font-family="SF Mono,monospace" font-size="10" letter-spacing="2.2" fill="#5c5c5c">ORDER</text>
      <text x="236" y="226" font-family="SF Mono,monospace" font-size="13" fill="#ededed">A → B → C → D</text>

      <!-- result panel (white border = failure / important; dim border = success) -->
      <rect x="236" y="252" width="430" height="58" rx="8" fill="#1c1c1c" stroke="#fff"/>
      <text x="451" y="274" text-anchor="middle" font-family="SF Mono,monospace" font-size="12" fill="#fff">outcome headline</text>
      <text x="451" y="294" text-anchor="middle" font-family="SF Mono,monospace" font-size="11" fill="#cfcfcf">outcome detail (the "why")</text>
    </g>
  </svg>
  <figcaption>One sentence in mono, dim. Restate the diagram's claim plainly: who did what, what went wrong (or held).</figcaption>
</figure>
```

### Color and stroke discipline

Still strictly monochrome. Encode emphasis with brightness, stroke width, and dash pattern only:

| Use | Stroke | Fill | Text | Notes |
|---|---|---|---|---|
| Ordinary actor / arrow | `#666` 1.2px | actor `#111` | `#cfcfcf` | the default |
| Actor of interest / critical arrow | `#fff` 1.5px | actor `#1c1c1c` | `#fff` | the one driving the story |
| Bounded region (scope, session, transaction) | `#cfcfcf` dashed (`5,4`) | `#050505` | `#cfcfcf` | dashed = a *lifecycle boundary* |
| System container | `#3a3a3a` solid | `#0a0a0a` | label `#5c5c5c` | holds everything |
| Result panel (failure / critical) | `#fff` solid | `#1c1c1c` | headline `#fff`, detail `#cfcfcf` | the punchline |
| Result panel (success / clean) | `#5a5a5a` solid | `#1c1c1c` | `#ededed` | quieter punchline |

### Side-by-side comparison

When you have a "before vs after" or "naive vs fixed" pair, build **two figures** with the same layout pattern and the same viewBox. Place them in adjacent sections (e.g. `02 Before`, `03 After`). Keep actor positions and panel positions stable across the two so the eye can scan and spot what moved. Walkthrough comes below each.

### What goes in the figcaption

One sentence, mono, dim. Restate the diagram's *claim* plainly so the reader knows what they're looking at without parsing the SVG.

Good:
> Workers enter the connection, all four pierce the cancel scope's boundary, and whoever finishes last calls `__exit__`.

> The cancel scope sits inside the owner task, so worker exit order cannot trigger cleanup mismatch.

Bad (too vague):
> Diagram of the before state.

## Interactive network call diagram (SVG wired to the walkthrough)

This is the house style's strongest diagram, and the default whenever the doc describes **network calls, request/response sequences, message flows, or a request crossing several services**. Instead of a static map plus a separate walkthrough, you **wire the SVG into the walkthrough** so each Next/Back step lights up the active hop. The reader literally watches the call travel: client to API, API to cache, cache miss to db, response back.

### How it works

Put the `<figure class="diagram">` **inside** the `[data-walk]` container (above `.walk-track`). Tag every arrow and node that belongs to a step with `data-step="N"` (0-indexed, matching the walkthrough step). Elements are dim by default and become `lit` when their step is active. One arrow can belong to several steps if it stays relevant; just repeat is not possible, so for multi-step relevance give it the lowest step and leave it lit by adding the class in render for `>=`. Keep it simple: one hop per step is the cleanest read.

```html
<div class="walk" data-walk>
  <figure class="diagram">
    <svg viewBox="0 0 720 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="request path across services">
      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#8f8f8f"/></marker>
      </defs>
      <!-- nodes: each lights on its step -->
      <g font-family="SF Mono,monospace" font-size="12">
        <rect data-step="0" x="20"  y="86" width="120" height="44" rx="8" fill="#1c1c1c" stroke="#3a3a3a"/><text x="80"  y="113" text-anchor="middle" fill="#eaeaea">client</text>
        <rect data-step="1" x="220" y="86" width="120" height="44" rx="8" fill="#1c1c1c" stroke="#3a3a3a"/><text x="280" y="113" text-anchor="middle" fill="#eaeaea">api</text>
        <rect data-step="2" x="420" y="20" width="120" height="44" rx="8" fill="#1c1c1c" stroke="#3a3a3a"/><text x="480" y="47"  text-anchor="middle" fill="#eaeaea">cache</text>
        <rect data-step="3" x="420" y="152" width="120" height="44" rx="8" fill="#1c1c1c" stroke="#3a3a3a"/><text x="480" y="179" text-anchor="middle" fill="#eaeaea">db</text>
      </g>
      <!-- call arrows: each lights on its step -->
      <g fill="none" stroke="#666" stroke-width="1.4" marker-end="url(#arr)">
        <path data-step="0" d="M140,108 L214,108"/>
        <path data-step="1" d="M340,100 C380,100 380,46 414,46"/>
        <path data-step="2" d="M340,116 C380,116 380,174 414,174"/>
        <path data-step="3" d="M414,186 C360,210 200,210 150,150" marker-end="url(#arr)"/>
      </g>
    </svg>
    <figcaption>Step through the request: client hits the api, the api checks the cache, misses, falls through to the db, and the response unwinds back.</figcaption>
  </figure>

  <div class="walk-track"> … wnodes 1..N as usual … </div>
  <div class="walk-detail"> … per-step captions … </div>
  <div class="walk-nav"> … Back / counter / Next … </div>
</div>
```

```css
/* dim every wired element; the active step lights up. Monochrome only. */
.diagram [data-step]{opacity:.28;transition:opacity .25s,stroke .25s,fill .25s}
.diagram [data-step].lit{opacity:1}
.diagram path[data-step].lit{stroke:#fff;stroke-width:1.8}
.diagram rect[data-step].lit{stroke:#fff;stroke-width:1.6;fill:#262626}
```

### Wiring it to the existing walkthrough JS

The walkthrough loop already iterates `[data-walk]`. Add three lines inside that same `forEach` so the SVG reacts to the step index. Drop this block into the existing script (or extend `render()`):

```js
// inside document.querySelectorAll('[data-walk]').forEach(function(walk){ ... })
var calls = walk.querySelectorAll('.diagram [data-step]');
// ...and inside render():
calls.forEach(function(c){ c.classList.toggle('lit', +c.dataset.step === i); });
```

That is the whole trick: the SVG and the step counter share one index `i`, so Next/Back/click/arrow-keys all drive the call animation for free. Everything stays monochrome; the active hop is shown by lifting opacity and switching its stroke to white, never by color.

### When to use which

- Pure linear process, one actor, no calls between parties: **walkthrough alone**.
- Architecture / containment / "who owns what", but not a call sequence you step through: **static SVG above the walkthrough**.
- A request or message hopping across services, queues, caches, or actors: **interactive network call diagram** (wire the SVG to the walkthrough). This is the preferred default for anything network-shaped.

## Workflow

1. Confirm the topic/content (use prior research or ask if thin).
2. Decide the diagram mode per section: network/call sequence → **interactive network call diagram** (wire SVG to walkthrough); multiple actors / containment but not a call sequence → **static SVG + walkthrough**; plain linear process → **walkthrough alone**.
3. If the doc has 4+ sections, plan the **left index (TOC) sidebar** and give every `<section>` an `id`.
4. Write the single HTML file to `docs/<topic>.html` using the tokens + walkthrough component (+ SVG figure / wired call diagram / TOC where planned). Honor the readability floor.
5. Render *every* process as an interactive walkthrough; use tables/callouts for the rest.
6. For before/after or naive/fixed pairs, build two SVG figures with the same viewBox and stable actor positions so the eye can compare.
7. Open it in Chrome and tell the user the path + that it's a standalone file.
