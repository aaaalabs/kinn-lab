window.KINN_SLIDES.push({
  id: 'fund',
  theme: 'mint',
  render() {
    return `
<style>
.s14 { width:100%;max-width:900px; }
.s14-label { font-size:0.7rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--dark-teal);margin-bottom:0.5rem;font-family:'Futura',sans-serif;opacity:0.85; }
.s14-h { font-family:'Montserrat',sans-serif;font-weight:900;font-size:clamp(2rem,5vw,3.5rem);color:var(--heavy-metal);margin-bottom:0.25rem;line-height:1; }
.s14-sub { font-family:'Montserrat',sans-serif;font-weight:700;font-size:0.9rem;color:var(--dark-teal);margin-bottom:1.75rem;opacity:0.9; }
.s14-tiers { display:grid;grid-template-columns:repeat(3,1fr);gap:1.25rem; }
.s14-tier { background:rgba(43,50,40,0.08);border-radius:16px;padding:1.75rem 1.25rem;text-align:center; }
.s14-tier.featured { background:var(--heavy-metal);color:var(--ecru-white); }
.s14-tier-name { font-family:'Montserrat',sans-serif;font-weight:900;font-size:0.7rem;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:0.75rem; }
.s14-tier.featured .s14-tier-name { color:var(--mintgreen); }
.s14-tier:not(.featured) .s14-tier-name { color:var(--dark-teal); }
.s14-price { font-family:'Montserrat',sans-serif;font-weight:900;font-size:2.5rem;color:var(--heavy-metal);line-height:1; }
.s14-tier.featured .s14-price { color:var(--ecru-white); }
.s14-period { font-family:'Futura',sans-serif;font-size:0.75rem;color:var(--dark-teal);margin-bottom:1rem; }
.s14-tier.featured .s14-period { color:var(--spring-rain); }
.s14-desc { font-family:'Futura',sans-serif;font-size:0.85rem;color:var(--heavy-metal);line-height:1.5;opacity:0.85; }
.s14-tier.featured .s14-desc { color:var(--ecru-white);opacity:0.8; }
.s14-status { display:flex;align-items:center;gap:0.75rem;background:rgba(43,50,40,0.08);border-radius:10px;padding:0.75rem 1.25rem;margin-bottom:1.5rem;font-family:'Montserrat',sans-serif;font-weight:700;font-size:0.85rem;color:var(--dark-teal); }
.s14-dot { width:8px;height:8px;border-radius:50%;background:var(--dark-teal); }
</style>
<div class="s14">
  <div class="s14-label">Slide 14 · KINN:FUND</div>
  <div class="s14-h">KINN:FUND</div>
  <div class="s14-sub">Community-finanzierte Unabhängigkeit</div>
  <div class="s14-status">
    <div class="s14-dot"></div>
    OpenCollective ist aufgesetzt · Wie kommunizieren wir das nach außen?
  </div>
  <div class="s14-tiers">
    <div class="s14-tier">
      <div class="s14-tier-name">FREUND</div>
      <div class="s14-price">5€</div>
      <div class="s14-period">/Monat</div>
      <div class="s14-desc">„Ich glaube an KINN" — Symbolische Unterstützung für alle, die dabei sein wollen.</div>
    </div>
    <div class="s14-tier featured">
      <div class="s14-tier-name">KINN:PATE ★</div>
      <div class="s14-price">15€</div>
      <div class="s14-period">/Monat</div>
      <div class="s14-desc">„Ich unterstütze aktiv" — Der Community-Beitrag der Stammgäste.</div>
    </div>
    <div class="s14-tier">
      <div class="s14-tier-name">TRÄGER</div>
      <div class="s14-price">50€</div>
      <div class="s14-period">/Monat</div>
      <div class="s14-desc">„Ich trage KINN" — Für Firmen und starke Unterstützer:innen.</div>
    </div>
  </div>
</div>`;
  }
});
