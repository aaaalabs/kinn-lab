window.KINN_SLIDES.push({
  id: 'manifest',
  theme: 'dark',
  render() {
    const values = [
      { word: 'AUGENHÖHE', motto: 'Menschen vor Hierarchie', desc: 'Jede Stimme zählt. Founder oder Student — beim KINN spielt das keine Rolle.' },
      { word: 'NEUGIER', motto: 'Lernen statt Lehren', desc: 'Wir kommen, um zu fragen, nicht um zu präsentieren. Jede Perspektive ist wertvoll.' },
      { word: 'VERTRAUEN', motto: 'Offen und verletzlich sein', desc: 'Echte Gespräche brauchen ein Umfeld, in dem man sich traut, ehrlich zu sein.' },
      { word: 'OFFENHEIT', motto: 'Kein Pitch, kein Push', desc: 'Wir verkaufen nichts. Wir teilen. Das macht den Unterschied.' },
    ];
    const cards = values.map(v => `
      <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:1.75rem 1.5rem">
        <div style="font-family:'Montserrat',sans-serif;font-weight:900;font-size:1.2rem;color:var(--mintgreen);letter-spacing:0.08em;margin-bottom:0.35rem">${v.word}</div>
        <div style="font-family:'Montserrat',sans-serif;font-weight:700;font-size:0.75rem;color:var(--spring-rain);letter-spacing:0.04em;margin-bottom:0.75rem;text-transform:uppercase">${v.motto}</div>
        <div style="font-family:'Futura',sans-serif;font-size:0.85rem;color:rgba(245,240,230,0.7);line-height:1.6">${v.desc}</div>
      </div>`).join('');
    return `
<style>
.s16 { width:100%;max-width:900px; }
.s16-label { font-size:0.7rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--spring-rain);margin-bottom:0.5rem;font-family:'Futura',sans-serif; }
.s16-h { font-family:'Montserrat',sans-serif;font-weight:900;font-size:clamp(2rem,5vw,3.5rem);color:var(--ecru-white);margin-bottom:0.25rem;line-height:1; }
.s16-sub { font-family:'Montserrat',sans-serif;font-weight:700;font-size:0.9rem;color:var(--spring-rain);margin-bottom:2rem; }
.s16-grid { display:grid;grid-template-columns:1fr 1fr;gap:1.25rem; }
</style>
<div class="s16">
  <div class="s16-label">Slide 16 · Manifest</div>
  <div class="s16-h">Das sind wir.</div>
  <div class="s16-sub">Die Werte hinter KINN — nicht als Regeln, sondern als Haltung</div>
  <div class="s16-grid">${cards}</div>
</div>`;
  }
});
