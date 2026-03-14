window.KINN_SLIDES.push({
  id: 'roadmap',
  theme: 'light',
  render() {
    const items = [
      { date: '2. März',  event: 'TechTalk · Lokale KI',          sub: 'InnCubator IBK',                          type: 'techtalk' },
      { date: '5. März',  event: 'KINN#15',                        sub: 'IBK (85) + KUF (24) · Multi-City-Debut',  type: 'highlight' },
      { date: '5. März',  event: 'TechTalk · KI im Marketing',     sub: 'Kathy & Martin · PRESS THE BUTTON',       type: 'techtalk' },
      { date: '10. März', event: 'TechTalk · VOICE AI',            sub: 'Martin Hies · Tschamlerstraße',           type: 'techtalk' },
      { date: '12. März', event: 'KINN#16 · Kitzbühel',           sub: 'START.N · KINN:RAUS · 32 Regs',           type: 'kinn' },
      { date: '19. März', event: 'KINN#17 · Innsbruck',           sub: 'SOHO 2.0',                                type: 'kinn' },
      { date: '19. März', event: 'digital.tirol Impulstag',        sub: 'KINN-Präsenz',                            type: 'other' },
      { date: '24. März', event: 'AIC Build-a-thon',               sub: 'Innovation Week Tirol',                   type: 'other' },
      { date: '26. März', event: 'KINN#18 · Innsbruck',           sub: 'Location TBD',                            type: 'kinn' },
      { date: '31. März', event: 'TechTalk Summit · WKO',          sub: 'Quartals-Highlight',                      type: 'highlight' },
      { date: '2. April', event: 'KINN#19 · Innsbruck',           sub: 'Location TBD',                            type: 'kinn' },
      { date: '9. April', event: 'KINN#20 · Tiroler Bauernhöfe',  sub: 'bis 70 Personen · Catering · Outdoor',    type: 'highlight' },
      { date: '28. April',event: 'Afterwork @ WKO',                sub: '"WKO meets KINN"',                        type: 'other' },
    ];
    const c = {
      highlight: { dot: 'var(--mintgreen)',          date: 'var(--mintgreen)',  text: 'var(--heavy-metal)' },
      kinn:      { dot: 'var(--teal)',               date: 'var(--teal)',       text: 'var(--heavy-metal)' },
      techtalk:  { dot: 'var(--spring-rain)',        date: 'var(--malta)',      text: '#6B7068' },
      other:     { dot: 'rgba(43,50,40,0.15)',       date: 'var(--kangaroo)',   text: '#6B7068' },
    };
    const rows = items.map(it => {
      const col = c[it.type];
      return `<div style="display:flex;align-items:center;gap:0.75rem;padding:0.38rem 0.5rem;border-bottom:1px solid rgba(43,50,40,0.05);${it.type==='highlight' ? 'background:rgba(94,217,166,0.05);border-radius:6px;border-bottom:none;margin:2px 0;' : ''}">
        <div style="width:65px;flex-shrink:0;font-family:'Montserrat',sans-serif;font-weight:800;font-size:0.7rem;color:${col.date}">${it.date}</div>
        <div style="width:6px;height:6px;border-radius:50%;background:${col.dot};flex-shrink:0"></div>
        <div style="font-family:'Montserrat',sans-serif;font-weight:${it.type==='highlight'?'800':'700'};font-size:0.82rem;color:${col.text}">${it.event}</div>
        <div style="font-family:'Futura',sans-serif;font-size:0.72rem;color:#9B9890;margin-left:0.25rem">${it.sub}</div>
      </div>`;
    }).join('');
    return `
<style>
.s13 { width:100%;max-width:880px; }
.s13-label { font-size:0.7rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--teal);margin-bottom:0.5rem;font-family:'Futura',sans-serif; }
.s13-h { font-family:'Montserrat',sans-serif;font-weight:900;font-size:clamp(1.75rem,4vw,3rem);color:var(--heavy-metal);margin-bottom:0.25rem;line-height:1.1; }
.s13-sub { font-family:'Montserrat',sans-serif;font-weight:700;font-size:0.9rem;color:var(--teal);margin-bottom:1rem; }
.s13-legend { display:flex;gap:1.25rem;margin-bottom:0.85rem; }
.s13-leg { display:flex;align-items:center;gap:0.35rem;font-family:'Futura',sans-serif;font-size:0.68rem;color:#9B9890; }
</style>
<div class="s13">
  <div class="s13-label">Slide 13 · Roadmap</div>
  <div class="s13-h">Was kommt als Nächstes?</div>
  <div class="s13-sub">März – April 2026</div>
  <div class="s13-legend">
    <div class="s13-leg"><div style="width:6px;height:6px;border-radius:50%;background:var(--mintgreen)"></div>KINN Highlight</div>
    <div class="s13-leg"><div style="width:6px;height:6px;border-radius:50%;background:var(--teal)"></div>KINN Event</div>
    <div class="s13-leg"><div style="width:6px;height:6px;border-radius:50%;background:var(--spring-rain)"></div>TechTalk</div>
    <div class="s13-leg"><div style="width:6px;height:6px;border-radius:50%;background:rgba(43,50,40,0.2)"></div>Sonstiges</div>
  </div>
  <div>${rows}</div>
</div>`;
  }
});
