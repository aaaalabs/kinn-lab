window.KINN_SLIDES.push({
  id: 'regulars',
  theme: 'light',
  render() {
    const top = [
      { name: 'Kathy Alume', count: 6, max: 6, img: 'images/crew_kathy.jpeg' },
      { name: 'Steven Lahmann', count: 6, max: 6, img: 'images/t028_lahmann-steven.jpg' },
      { name: 'Rafael', count: 4, max: 6, img: 'images/crew_rafael.jpeg' },
      { name: 'David Moling', count: 5, max: 6, img: 'images/crew_david.jpeg' },
    ];
    const dots = n => Array.from({length: 6}, (_,i) => `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${i < n ? 'var(--mintgreen)' : 'rgba(43,50,40,0.1)'};margin-right:3px"></span>`).join('');
    const avatar = p => p.img
      ? `<img src="${p.img}" alt="${p.name}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;flex-shrink:0;border:2px solid rgba(94,217,166,0.3)" onerror="this.outerHTML='<div style=\\'display:flex;width:40px;height:40px;border-radius:50%;background:rgba(43,50,40,0.08);align-items:center;justify-content:center;font-family:Montserrat,sans-serif;font-weight:900;font-size:0.9rem;color:var(--malta);flex-shrink:0\\'>${p.name[0]}</div>'">`
      : `<div style="display:flex;width:40px;height:40px;border-radius:50%;background:rgba(43,50,40,0.08);align-items:center;justify-content:center;font-family:'Montserrat',sans-serif;font-weight:900;font-size:0.9rem;color:var(--malta);flex-shrink:0">${p.name[0]}</div>`;
    const rows = top.map(p => `
      <div style="display:flex;align-items:center;gap:1rem;padding:0.65rem 0;border-bottom:1px solid rgba(43,50,40,0.07)">
        ${avatar(p)}
        <div style="width:130px;font-family:'Montserrat',sans-serif;font-weight:700;font-size:0.9rem;color:var(--heavy-metal)">${p.name}</div>
        <div>${dots(p.count)}</div>
        <div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:0.85rem;color:var(--teal)">${p.count}/${p.max}</div>
      </div>`).join('');
    return `
<style>
.s10 { width:100%;max-width:800px; }
.s10-label { font-size:0.7rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--teal);margin-bottom:0.5rem;font-family:'Futura',sans-serif; }
.s10-h { font-family:'Montserrat',sans-serif;font-weight:900;font-size:clamp(1.75rem,4vw,3rem);color:var(--heavy-metal);margin-bottom:0.25rem;line-height:1.1; }
.s10-sub { font-family:'Montserrat',sans-serif;font-weight:700;font-size:0.9rem;color:var(--teal);margin-bottom:1.5rem; }
.s10-callout { background:var(--heavy-metal);color:var(--ecru-white);border-radius:16px;padding:1.5rem 2rem;margin-top:1.5rem;text-align:center; }
.s10-callout-big { font-family:'Montserrat',sans-serif;font-weight:900;font-size:clamp(1.5rem,3vw,2.5rem);color:var(--mintgreen);margin-bottom:0.5rem; }
.s10-callout-sub { font-family:'Futura',sans-serif;font-size:0.9rem;color:var(--spring-rain);line-height:1.6; }
</style>
<div class="s10">
  <div class="s10-label">Slide 10 · Harte Kern</div>
  <div class="s10-h">Ihr seid der harte Kern</div>
  <div class="s10-sub">Top-Regulars nach Besuchshäufigkeit (letzten 6 Events)</div>
  <div>${rows}</div>
  <div style="font-family:'Futura',sans-serif;font-size:0.8rem;color:var(--malta);margin-top:0.75rem">+ 5 weitere Personen bei 4/6 Besuchen: Marco K., Desiree, Martin H., Matthias S., Sherin</div>
  <div class="s10-callout">
    <div class="s10-callout-big">IHR seid dabei.</div>
    <div class="s10-callout-sub">Mehrere von euch hier am Tisch sind in dieser Liste.<br>Das ist kein Zufall — das ist der Grund, warum wir diesen Abend veranstalten.</div>
  </div>
</div>`;
  }
});
