window.KINN_SLIDES.push({
  id: 'demand',
  theme: 'light',
  render() {
    return `
<style>
.s05 { width: 100%; max-width: 860px; }
.s05-label { font-size: 0.7rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--teal); margin-bottom: 0.5rem; font-family: 'Futura', sans-serif; }
.s05-h { font-family: 'Montserrat', sans-serif; font-weight: 900; font-size: clamp(2rem, 5vw, 3.5rem); color: var(--heavy-metal); margin-bottom: 0.5rem; line-height: 1.1; }
.s05-sub { font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 0.9rem; color: var(--teal); margin-bottom: 2rem; }
.s05-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
.s05-card { background: white; border: 1px solid rgba(43,50,40,0.1); border-radius: 16px; padding: 1.75rem 1.5rem; }
.s05-big { font-family: 'Montserrat', sans-serif; font-weight: 900; font-size: clamp(2.5rem, 5vw, 4rem); color: var(--teal); line-height: 1; }
.s05-big-unit { font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 0.75rem; color: var(--malta); letter-spacing: 0.08em; text-transform: uppercase; margin-top: 0.25rem; }
.s05-big-desc { font-family: 'Futura', sans-serif; font-size: 0.9rem; color: #6B7068; margin-top: 0.5rem; line-height: 1.5; }
.s05-wl { display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(212,149,106,0.1); border: 1px solid rgba(212,149,106,0.3); border-radius: 8px; padding: 0.75rem 1.25rem; font-family: 'Montserrat', sans-serif; font-weight: 800; font-size: 0.85rem; color: #B07840; }
.s05-wl-dot { width: 8px; height: 8px; border-radius: 50%; background: #D4956A; }
</style>
<div class="s05">
  <div class="s05-label">Slide 05 · Nachfrage</div>
  <div class="s05-h">Nachfrage > Kapazität</div>
  <div class="s05-sub">Die Zahlen sprechen für sich</div>
  <div class="s05-grid">
    <div class="s05-card">
      <div class="s05-big">44</div>
      <div class="s05-big-unit">Registrierungen · Tag 1</div>
      <div class="s05-big-desc">KINN#15: Am ersten Tag bereits 44 Anmeldungen — bevor irgendeine Werbung lief.</div>
    </div>
    <div class="s05-card">
      <div class="s05-big">7</div>
      <div class="s05-big-unit">Tage bis ausgebucht</div>
      <div class="s05-big-desc">Innsbruck war nach einer Woche voll. 4 Wochen vor dem Event. 63 Regs in den ersten 3 Tagen.</div>
    </div>
    <div class="s05-card">
      <div class="s05-big">27+</div>
      <div class="s05-big-unit">Warteliste · KINN#14</div>
      <div class="s05-big-desc">Nach Absagen noch 27 Personen auf der Warteliste — echte unerfüllte Nachfrage.</div>
    </div>
    <div class="s05-card" style="display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;gap:1rem;background:rgba(94,217,166,0.05);border-color:rgba(94,217,166,0.3)">
      <div style="font-family:'Montserrat',sans-serif;font-weight:900;font-size:1.1rem;color:var(--heavy-metal)">Das Signal ist klar.</div>
      <div style="font-family:'Futura',sans-serif;font-size:0.9rem;color:#6B7068;line-height:1.6">Mehr Menschen wollen KINN als wir aktuell bedienen können. Die Frage ist nicht <em>ob</em> wir skalieren — sondern <em>wie</em>.</div>
    </div>
  </div>
</div>`;
  }
});
