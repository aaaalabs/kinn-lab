window.KINN_SLIDES.push({
  id: 'testimonials',
  theme: 'light',
  render() {
    const quotes = [
      { name: 'Jurij Tkaciov', role: 'Founder, FaceAR', img: 'images/t026_tkaciov-jurij.jpg', quote: 'Echte Ökosysteme entstehen durch Menschen, Rhythmus und Vertrauen — nicht durch Hype.' },
      { name: 'Claudia Brandl', role: 'Founder, CBRA Digital', img: 'images/t012_brandl-claudia.jpg', quote: '1h ist einfach zu kurz ;) aber sehr sehr spannend — gerne mehr davon!' },
      { name: 'Desiree Schier', role: 'Founder, Wependio', img: 'images/t025_schier-desiree.jpg', quote: 'Dieses KI-Format kostet nichts. Und ist trotzdem unbezahlbar. Kein Programm. Keine Slides. Keine Pitches.' },
      { name: 'Andre Daberto', role: 'CXO Fullet', img: 'images/t039_daberto-andre.jpg', quote: 'Das einzige öffentliche Netzwerk in der Region, das Einzelpersonen, Startups und Konzerne wirklich in einem Raum versammelt.' },
    ];
    const cards = quotes.map(q => `
      <div style="background:white;border:1px solid rgba(43,50,40,0.1);border-radius:16px;padding:1.75rem 1.5rem;position:relative">
        <div style="position:absolute;top:1rem;left:1.5rem;font-family:'Montserrat',sans-serif;font-weight:900;font-size:2.5rem;color:rgba(94,217,166,0.3);line-height:1">"</div>
        <div style="font-family:'Futura',sans-serif;font-size:0.9rem;color:var(--heavy-metal);line-height:1.65;font-style:italic;margin-top:1rem;margin-bottom:1rem">${q.quote}</div>
        <div style="border-top:1px solid rgba(43,50,40,0.08);padding-top:0.75rem;display:flex;align-items:center;gap:0.75rem">
          <img src="${q.img}" alt="${q.name}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;flex-shrink:0" onerror="this.style.display='none'">
          <div>
            <div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:0.8rem;color:var(--heavy-metal)">${q.name}</div>
            <div style="font-family:'Futura',sans-serif;font-size:0.75rem;color:var(--teal);margin-top:0.1rem">${q.role}</div>
          </div>
        </div>
      </div>`).join('');
    return `
<style>
.s09 { width:100%;max-width:900px; }
.s09-label { font-size:0.7rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--teal);margin-bottom:0.5rem;font-family:'Futura',sans-serif; }
.s09-h { font-family:'Montserrat',sans-serif;font-weight:900;font-size:clamp(1.75rem,4vw,3rem);color:var(--heavy-metal);margin-bottom:0.25rem;line-height:1.1; }
.s09-sub { font-family:'Montserrat',sans-serif;font-weight:700;font-size:0.9rem;color:var(--teal);margin-bottom:1.5rem; }
.s09-grid { display:grid;grid-template-columns:1fr 1fr;gap:1.25rem; }
</style>
<div class="s09">
  <div class="s09-label">Slide 09 · Stimmen</div>
  <div class="s09-h">Was die Community sagt</div>
  <div class="s09-sub">45 Testimonials · Hier die vier stärksten</div>
  <div class="s09-grid">${cards}</div>
</div>`;
  }
});
