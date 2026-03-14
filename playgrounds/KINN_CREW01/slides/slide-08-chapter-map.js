window.KINN_SLIDES.push({
  id: 'chapter-map',
  theme: 'light',
  render() {
    return `
<style>
.s08 { width:100%;max-width:960px; }
.s08-label { font-size:0.7rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--teal);margin-bottom:0.5rem;font-family:'Futura',sans-serif; }
.s08-h { font-family:'Montserrat',sans-serif;font-weight:900;font-size:clamp(1.75rem,4vw,3rem);color:var(--heavy-metal);margin-bottom:0.25rem;line-height:1.1; }
.s08-sub { font-family:'Montserrat',sans-serif;font-weight:700;font-size:0.9rem;color:var(--teal);margin-bottom:1.5rem; }
.s08-section-label { font-family:'Montserrat',sans-serif;font-weight:900;font-size:0.6rem;letter-spacing:0.15em;text-transform:uppercase;color:var(--malta);margin-bottom:0.75rem;padding-bottom:0.4rem;border-bottom:1px solid rgba(43,50,40,0.08); }
.s08-chapters { display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem;margin-bottom:1rem; }
.s08-raus { display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem;margin-bottom:1rem; }
.s08-region { border-radius:14px;padding:1.25rem 1.1rem;position:relative; }
.s08-region.hub { background:var(--heavy-metal);color:var(--ecru-white); }
.s08-region.chapter { background:rgba(94,217,166,0.1);border:2px solid rgba(94,217,166,0.35); }
.s08-region.chapter-next { background:rgba(168,200,176,0.1);border:2px solid rgba(168,200,176,0.35); }
.s08-region.raus { background:rgba(189,178,161,0.08);border:1px solid rgba(189,178,161,0.3); }
.s08-region.scout { background:rgba(189,178,161,0.05);border:1px dashed rgba(189,178,161,0.3); }
.s08-badge { display:inline-block;font-family:'Montserrat',sans-serif;font-weight:800;font-size:0.6rem;letter-spacing:0.08em;text-transform:uppercase;padding:0.2rem 0.55rem;border-radius:5px;margin-bottom:0.5rem; }
.s08-region.hub .s08-badge { background:var(--mintgreen);color:var(--heavy-metal); }
.s08-region.chapter .s08-badge { background:rgba(94,217,166,0.25);color:var(--dark-teal); }
.s08-region.chapter-next .s08-badge { background:rgba(168,200,176,0.25);color:var(--teal); }
.s08-region.raus .s08-badge { background:rgba(189,178,161,0.2);color:#6B7068; }
.s08-region.scout .s08-badge { background:rgba(189,178,161,0.1);color:var(--kangaroo); }
.s08-name { font-family:'Montserrat',sans-serif;font-weight:900;font-size:1.05rem;margin-bottom:0.15rem; }
.s08-region.hub .s08-name { color:var(--ecru-white); }
.s08-name { color:var(--heavy-metal); }
.s08-city { font-family:'Futura',sans-serif;font-size:0.75rem;margin-bottom:0.5rem; }
.s08-region.hub .s08-city { color:var(--kangaroo); }
.s08-city { color:#6B7068; }
.s08-stat { font-family:'Montserrat',sans-serif;font-weight:700;font-size:0.78rem; }
.s08-region.hub .s08-stat { color:var(--spring-rain); }
.s08-region.chapter .s08-stat { color:var(--dark-teal); }
.s08-region.chapter-next .s08-stat { color:var(--teal); }
.s08-stat { color:#6B7068; }
.s08-who { font-family:'Futura',sans-serif;font-size:0.72rem;margin-top:0.25rem;color:#6B7068; }
.s08-region.hub .s08-who { color:var(--kangaroo); }
.s08-note { background:rgba(94,217,166,0.08);border-left:3px solid var(--mintgreen);border-radius:0 8px 8px 0;padding:0.65rem 1.1rem;font-size:0.8rem;color:var(--heavy-metal); }
</style>
<div class="s08">
  <div class="s08-label">Slide 08 · Chapter-Map</div>
  <div class="s08-h">Chapter-Map Tirol</div>
  <div class="s08-sub">Chapters brauchen lokale Leader — das ist der Unterschied</div>

  <div class="s08-section-label">KINN:CHAPTERS — mit lokalen Leaders</div>
  <div class="s08-chapters">
    <div class="s08-region hub">
      <div class="s08-badge">Hub · Zentrale</div>
      <div class="s08-name">Innsbruck</div>
      <div class="s08-city">Wöchentlich · IBK</div>
      <div class="s08-stat">72 Lernbar · 24–32 parallel · 1×/Monat</div>
      <div class="s08-who">Lead: Thomas · Martin</div>
    </div>
    <div class="s08-region chapter">
      <div class="s08-badge">Chapter · Live ✓</div>
      <div class="s08-name">Kufstein</div>
      <div class="s08-city">Unterland · Seit KINN#15</div>
      <div class="s08-stat">24 TN · ausgebucht</div>
      <div class="s08-who">Lead: Desiree · Juri</div>
    </div>
    <div class="s08-region chapter-next">
      <div class="s08-badge">Chapter · Nächstes</div>
      <div class="s08-name">Reutte</div>
      <div class="s08-city">Außerfern · In Aufbau</div>
      <div class="s08-stat">Leader rekrutiert</div>
      <div class="s08-who">Lead: Fabian</div>
    </div>
  </div>

  <div class="s08-section-label">KINN:RAUS — Einzel-Events, kein Chapter</div>
  <div class="s08-raus">
    <div class="s08-region raus">
      <div class="s08-badge">KINN:RAUS</div>
      <div class="s08-name">Kitzbühel</div>
      <div class="s08-city">12. März · KINN#16 · START.N</div>
      <div class="s08-stat">34/36 Regs</div>
    </div>
    <div class="s08-region raus">
      <div class="s08-badge">KINN:RAUS</div>
      <div class="s08-name">Wattens / Kramsach</div>
      <div class="s08-city">9. April · Tiroler Bauernhöfe</div>
      <div class="s08-stat">bis 70 Personen · Outdoor</div>
    </div>
    <div class="s08-region scout">
      <div class="s08-badge">Scouting · ~Mai</div>
      <div class="s08-name">Osttirol</div>
      <div class="s08-city">Lienz & Umgebung</div>
      <div class="s08-stat">Leader gesucht</div>
      <div class="s08-who">+ weitere Regionen folgen</div>
    </div>
  </div>

  <div class="s08-note"><strong>Chapters ≠ KINN:RAUS.</strong> Ein Chapter entsteht erst wenn es lokale Menschen gibt, die Ownership übernehmen. Das skaliert — One-off-Events nicht.</div>
</div>`;
  }
});
