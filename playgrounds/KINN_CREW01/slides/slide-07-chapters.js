window.KINN_SLIDES.push({
  id: 'chapters',
  theme: 'light',
  render() {
    return `
<style>
.s07 { width:100%;max-width:900px; }
.s07-label { font-size:0.7rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--teal);margin-bottom:0.5rem;font-family:'Futura',sans-serif; }
.s07-h { font-family:'Montserrat',sans-serif;font-weight:900;font-size:clamp(1.75rem,4vw,3rem);color:var(--heavy-metal);margin-bottom:0.25rem;line-height:1.1; }
.s07-sub { font-family:'Montserrat',sans-serif;font-weight:700;font-size:0.9rem;color:var(--teal);margin-bottom:2rem; }
.s07-model { display:grid;grid-template-columns:1fr auto 1fr 1fr 1fr;gap:0;align-items:center;margin-bottom:2rem; }
.s07-hub { background:var(--heavy-metal);color:var(--ecru-white);border-radius:16px;padding:1.5rem 1.25rem;text-align:center; }
.s07-hub-label { font-family:'Montserrat',sans-serif;font-weight:900;font-size:0.65rem;letter-spacing:0.12em;text-transform:uppercase;color:var(--mintgreen);margin-bottom:0.25rem; }
.s07-hub-name { font-family:'Montserrat',sans-serif;font-weight:900;font-size:1.5rem;color:var(--ecru-white); }
.s07-hub-num { font-family:'Montserrat',sans-serif;font-weight:700;font-size:0.8rem;color:var(--spring-rain);margin-top:0.25rem; }
.s07-arrow { font-size:2rem;color:var(--mintgreen);text-align:center;padding:0 0.5rem; }
.s07-node { background:white;border:1px solid rgba(43,50,40,0.12);border-radius:12px;padding:1.25rem 1rem;text-align:center;margin:0 0.25rem; }
.s07-node-name { font-family:'Montserrat',sans-serif;font-weight:800;font-size:1rem;color:var(--heavy-metal);margin-bottom:0.25rem; }
.s07-node-status { font-family:'Montserrat',sans-serif;font-weight:700;font-size:0.65rem;letter-spacing:0.08em;text-transform:uppercase;padding:0.2rem 0.5rem;border-radius:4px; }
.s07-node-status.live { background:rgba(94,217,166,0.15);color:var(--dark-teal); }
.s07-node-status.planned { background:rgba(168,200,176,0.15);color:var(--teal); }
.s07-node-status.idea { background:rgba(189,178,161,0.15);color:var(--malta); }
.s07-principle { background:rgba(94,217,166,0.08);border-left:3px solid var(--mintgreen);border-radius:0 12px 12px 0;padding:1rem 1.5rem;font-family:'Montserrat',sans-serif;font-weight:800;font-size:1.1rem;color:var(--heavy-metal); }
</style>
<div class="s07">
  <div class="s07-label">Slide 07 · Chapters</div>
  <div class="s07-h">Die Lösung: Chapters</div>
  <div class="s07-sub">Nicht ein größerer Raum — sondern parallele Standorte</div>
  <div class="s07-model">
    <div class="s07-hub">
      <div class="s07-hub-label">Hub · Kern</div>
      <div class="s07-hub-name">IBK</div>
      <div class="s07-hub-num">72 Lernbar + 24–32 parallel</div>
    </div>
    <div class="s07-arrow">→</div>
    <div class="s07-node">
      <div class="s07-node-name">Kufstein</div>
      <div class="s07-node-status live">Chapter · Live</div>
      <div style="font-family:'Futura',sans-serif;font-size:0.65rem;color:#6B7068;margin-top:0.35rem">Desiree · Juri</div>
    </div>
    <div class="s07-node">
      <div class="s07-node-name">Reutte</div>
      <div class="s07-node-status planned">Chapter · Nächstes</div>
      <div style="font-family:'Futura',sans-serif;font-size:0.65rem;color:#6B7068;margin-top:0.35rem">Fabian</div>
    </div>
    <div class="s07-node">
      <div class="s07-node-name">+ weitere</div>
      <div class="s07-node-status idea">Scouting läuft</div>
      <div style="font-family:'Futura',sans-serif;font-size:0.65rem;color:#6B7068;margin-top:0.35rem">Leaders gesucht</div>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem;margin-bottom:1.5rem">
    <div style="text-align:center;padding:1rem;background:white;border-radius:12px;border:1px solid rgba(43,50,40,0.1)">
      <div style="font-family:'Montserrat',sans-serif;font-weight:900;font-size:1.5rem;color:var(--mintgreen)">✓</div>
      <div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:0.8rem;color:var(--heavy-metal);margin-top:0.25rem">Lokale Leader</div>
      <div style="font-family:'Futura',sans-serif;font-size:0.78rem;color:#6B7068;margin-top:0.25rem">Jeder Standort hat eigene Crew</div>
    </div>
    <div style="text-align:center;padding:1rem;background:white;border-radius:12px;border:1px solid rgba(43,50,40,0.1)">
      <div style="font-family:'Montserrat',sans-serif;font-weight:900;font-size:1.5rem;color:var(--mintgreen)">✓</div>
      <div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:0.8rem;color:var(--heavy-metal);margin-top:0.25rem">Gleiches Format</div>
      <div style="font-family:'Futura',sans-serif;font-size:0.78rem;color:#6B7068;margin-top:0.25rem">KINN-Identität bleibt erhalten</div>
    </div>
    <div style="text-align:center;padding:1rem;background:white;border-radius:12px;border:1px solid rgba(43,50,40,0.1)">
      <div style="font-family:'Montserrat',sans-serif;font-weight:900;font-size:1.5rem;color:var(--mintgreen)">✓</div>
      <div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:0.8rem;color:var(--heavy-metal);margin-top:0.25rem">Unlimitiert skalierbar</div>
      <div style="font-family:'Futura',sans-serif;font-size:0.78rem;color:#6B7068;margin-top:0.25rem">Keine Venue-Engpässe mehr</div>
    </div>
  </div>
  <div class="s07-principle">„Jeder Standort braucht lokale Leader. Deshalb seid <em>ihr</em> hier."</div>
</div>`;
  }
});
