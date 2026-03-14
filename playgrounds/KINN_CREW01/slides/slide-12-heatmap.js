window.KINN_SLIDES.push({
  id: 'heatmap',
  theme: 'light',
  render() {
    const bars = [
      { label: 'Tisch-Moderation', count: 6, max: true },
      { label: 'Format-Ideen', count: 5 },
      { label: 'TechTalk Hosting', count: 5 },
      { label: 'Workshop Hosting', count: 5 },
      { label: 'Plattform Dev', count: 4 },
      { label: 'Content / Social', count: 3 },
      { label: 'Check-In', count: 3 },
      { label: 'Event Aufbau', count: 3 },
      { label: 'Sponsoren / Firmen', count: 2 },
      { label: 'Chapter-Aufbau', count: 2 },
      { label: 'Community Mgmt', count: 2 },
      { label: 'Merch / Imagefilm', count: 1 },
    ];
    const maxCount = 6;
    const rows = bars.map(b => {
      const pct = Math.round((b.count / maxCount) * 100);
      const color = b.count >= 5 ? 'var(--mintgreen)' : b.count >= 3 ? 'var(--teal)' : 'var(--spring-rain)';
      return `<div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.5rem">
        <div style="width:140px;flex-shrink:0;font-family:'Futura',sans-serif;font-size:0.8rem;color:var(--heavy-metal);text-align:right">${b.label}</div>
        <div style="flex:1;height:24px;background:rgba(43,50,40,0.06);border-radius:4px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:${color};border-radius:4px;display:flex;align-items:center;padding-left:0.5rem;font-family:'Montserrat',sans-serif;font-weight:800;font-size:0.75rem;color:${b.count >= 4 ? 'var(--heavy-metal)' : 'white'};transition:width 0.5s">${b.count}</div>
        </div>
      </div>`;
    }).join('');
    return `
<style>
.s12 { width:100%;max-width:820px; }
.s12-label { font-size:0.7rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--teal);margin-bottom:0.5rem;font-family:'Futura',sans-serif; }
.s12-h { font-family:'Montserrat',sans-serif;font-weight:900;font-size:clamp(1.75rem,4vw,3rem);color:var(--heavy-metal);margin-bottom:0.25rem;line-height:1.1; }
.s12-sub { font-family:'Montserrat',sans-serif;font-weight:700;font-size:0.9rem;color:var(--teal);margin-bottom:1.5rem; }
.s12-note { background:rgba(94,217,166,0.08);border-left:3px solid var(--mintgreen);border-radius:0 8px 8px 0;padding:0.75rem 1.25rem;font-size:0.85rem;color:var(--heavy-metal);margin-top:1rem; }
</style>
<div class="s12">
  <div class="s12-label">Slide 12 · Energie</div>
  <div class="s12-h">Wo liegt die Energie?</div>
  <div class="s12-sub">Rollen-Interessen aus dem Crew-Fragebogen (n=11)</div>
  ${rows}
  <div class="s12-note"><strong>Tisch-Moderation dominiert</strong> — 6 von 11 wollen moderieren. Das ist ein starkes Signal für Format-Kapazität.</div>
</div>`;
  }
});
