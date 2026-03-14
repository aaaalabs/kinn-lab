window.KINN_SLIDES.push({
  id: 'kinn15',
  theme: 'mint',
  render() {
    return `
<style>
.s04 { width: 100%; max-width: 800px; text-align: center; }
.s04-label { font-size: 0.7rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--dark-teal); margin-bottom: 0.75rem; font-family: 'Futura', sans-serif; opacity: 0.8; }
.s04-h { font-family: 'Montserrat', sans-serif; font-weight: 900; font-size: clamp(2rem, 5vw, 3.5rem); color: var(--heavy-metal); margin-bottom: 0.5rem; line-height: 1; }
.s04-sub { font-family: 'Futura', sans-serif; font-size: 1rem; color: var(--dark-teal); margin-bottom: 2.5rem; opacity: 0.9; }
.s04-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin: 0 auto; max-width: 700px; }
.s04-stat { background: rgba(43,50,40,0.1); border-radius: 16px; padding: 2rem 1rem; backdrop-filter: blur(4px); }
.s04-num { font-family: 'Montserrat', sans-serif; font-weight: 900; font-size: clamp(3rem, 7vw, 5rem); color: var(--heavy-metal); line-height: 1; }
.s04-unit { font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 0.7rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--dark-teal); margin-top: 0.5rem; }
.s04-desc { font-family: 'Futura', sans-serif; font-size: 0.85rem; color: var(--heavy-metal); margin-top: 0.5rem; opacity: 0.75; }
.s04-badge { display: inline-block; margin-top: 2rem; background: var(--heavy-metal); color: var(--mintgreen); font-family: 'Montserrat', sans-serif; font-weight: 800; font-size: 0.75rem; letter-spacing: 0.1em; text-transform: uppercase; padding: 0.5rem 1.5rem; border-radius: 100px; }
</style>
<div class="s04">
  <div class="s04-label">Slide 04 · Rekord</div>
  <div class="s04-h">KINN#15</div>
  <div class="s04-sub">5. März 2026 · Erstes simultanes Multi-City-Event</div>
  <div class="s04-grid">
    <div class="s04-stat">
      <div class="s04-num">110</div>
      <div class="s04-unit">Teilnehmer</div>
      <div class="s04-desc">IBK 86 + KUF 24<br>gleichzeitig</div>
    </div>
    <div class="s04-stat">
      <div class="s04-num">2</div>
      <div class="s04-unit">Städte</div>
      <div class="s04-desc">Innsbruck &<br>Kufstein</div>
    </div>
    <div class="s04-stat">
      <div class="s04-num">0</div>
      <div class="s04-unit">Freie Plätze</div>
      <div class="s04-desc">Beide Standorte<br>ausgebucht</div>
    </div>
  </div>
  <div class="s04-badge">Proof of Concept: Chapters funktionieren</div>
</div>`;
  }
});
