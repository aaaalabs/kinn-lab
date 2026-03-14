window.KINN_SLIDES.push({
  id: 'kapazitaet',
  theme: 'light',
  render() {
    return `
<style>
.s06 { width: 100%; max-width: 860px; }
.s06-label { font-size: 0.7rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--teal); margin-bottom: 0.5rem; font-family: 'Futura', sans-serif; }
.s06-h { font-family: 'Montserrat', sans-serif; font-weight: 900; font-size: clamp(1.75rem, 4vw, 3rem); color: var(--heavy-metal); margin-bottom: 0.25rem; line-height: 1.1; }
.s06-sub { font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 0.9rem; color: var(--teal); margin-bottom: 1.75rem; }
.s06-hero { font-family: 'Montserrat', sans-serif; font-weight: 900; font-size: clamp(3rem, 8vw, 5.5rem); color: var(--teal); line-height: 1; margin-bottom: 0.25rem; }
.s06-hero-sub { font-family: 'Futura', sans-serif; font-size: 0.9rem; color: #6B7068; margin-bottom: 1.5rem; }
.s06-bars { display: flex; flex-direction: column; gap: 0.6rem; margin: 1.5rem 0; }
.s06-bar-row { display: flex; align-items: center; gap: 0.75rem; }
.s06-bar-label { font-family: 'Futura', sans-serif; font-size: 0.8rem; color: var(--heavy-metal); width: 130px; flex-shrink: 0; }
.s06-bar-track { flex: 1; height: 22px; background: rgba(43,50,40,0.06); border-radius: 4px; overflow: hidden; }
.s06-bar-fill { height: 100%; border-radius: 4px; display: flex; align-items: center; padding-left: 0.5rem; font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 0.7rem; color: white; }
.s06-note { background: rgba(212,149,106,0.08); border-left: 3px solid #D4956A; border-radius: 0 8px 8px 0; padding: 0.75rem 1.25rem; font-size: 0.85rem; color: var(--heavy-metal); margin-top: 1rem; }
</style>
<div class="s06">
  <div class="s06-label">Slide 06 · Kapazität</div>
  <div class="s06-h">Das Kapazitäts-Problem</div>
  <div class="s06-sub">Tirol hat zu wenige Venues für KINN-Formate</div>
  <div style="display:grid;grid-template-columns:auto 1fr;gap:2rem;align-items:start">
    <div>
      <div class="s06-hero">87%</div>
      <div class="s06-hero-sub">der Venues in Tirol<br>fassen max. 40 Personen</div>
    </div>
    <div class="s06-bars">
      <div class="s06-bar-row">
        <div class="s06-bar-label">≤ 20 Personen</div>
        <div class="s06-bar-track"><div class="s06-bar-fill" style="width:35%;background:var(--malta)">35%</div></div>
      </div>
      <div class="s06-bar-row">
        <div class="s06-bar-label">21–40 Personen</div>
        <div class="s06-bar-track"><div class="s06-bar-fill" style="width:52%;background:var(--teal)">52%</div></div>
      </div>
      <div class="s06-bar-row">
        <div class="s06-bar-label">41–80 Personen</div>
        <div class="s06-bar-track"><div class="s06-bar-fill" style="width:10%;background:var(--spring-rain)">10%</div></div>
      </div>
      <div class="s06-bar-row">
        <div class="s06-bar-label">80+ Personen</div>
        <div class="s06-bar-track"><div class="s06-bar-fill" style="width:3%;background:var(--mintgreen)">3%</div></div>
      </div>
      <div style="margin-top:0.75rem;display:flex;gap:1rem;flex-wrap:wrap">
        <div style="background:rgba(94,217,166,0.1);border:1px solid rgba(94,217,166,0.3);border-radius:8px;padding:0.5rem 0.85rem;font-family:'Montserrat',sans-serif;font-weight:700;font-size:0.75rem;color:var(--teal)">KINN#11: 71 TN — Ausnahme</div>
        <div style="background:rgba(212,149,106,0.1);border:1px solid rgba(212,149,106,0.3);border-radius:8px;padding:0.5rem 0.85rem;font-family:'Montserrat',sans-serif;font-weight:700;font-size:0.75rem;color:#B07840">KINN#14: 27 auf WL</div>
      </div>
    </div>
  </div>
  <div class="s06-note"><strong>Die Lösung ist nicht ein größerer Raum.</strong> Die Lösung ist: parallele Standorte. Chapters.</div>
</div>`;
  }
});
