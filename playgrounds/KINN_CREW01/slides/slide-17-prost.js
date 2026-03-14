window.KINN_SLIDES.push({
  id: 'prost',
  theme: 'dark',
  render() {
    return `
<style>
@keyframes fadeUp17 { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
.s17 { text-align:center;z-index:1; }
.s17-word { font-family:'Montserrat',sans-serif;font-weight:900;font-size:clamp(5rem,18vw,12rem);color:var(--mintgreen);line-height:1;letter-spacing:-0.02em;animation:fadeUp17 0.8s ease forwards; }
.s17-glass { font-size:clamp(2rem,5vw,4rem);display:block;margin-top:0.5rem;animation:fadeUp17 0.8s 0.2s ease both; }
.s17-sub { font-family:'Futura',sans-serif;font-size:1rem;color:rgba(245,240,230,0.4);margin-top:1.5rem;letter-spacing:0.15em;text-transform:uppercase;animation:fadeUp17 0.8s 0.4s ease both; }
</style>
<div class="s17">
  <div class="s17-word">Prost</div>
  <span class="s17-glass">🥂</span>
  <div class="s17-sub">Auf uns. Auf KINN. Auf Tirol.</div>
</div>`;
  }
});
