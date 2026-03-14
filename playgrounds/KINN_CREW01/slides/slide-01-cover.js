window.KINN_SLIDES.push({
  id: 'cover',
  theme: 'dark',
  render() {
    return `
<style>
@keyframes pulse01 { 0%,100%{transform:scale(1);opacity:0.15} 50%{transform:scale(1.08);opacity:0.08} }
.s01 { text-align:center;z-index:1;position:relative; }
.s01-bg { position:absolute;inset:0;pointer-events:none;overflow:hidden; }
.s01-glow { position:absolute;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(94,217,166,0.18) 0%,transparent 70%);top:50%;left:50%;transform:translate(-50%,-50%);animation:pulse01 8s ease-in-out infinite; }
.s01-logo { width:min(320px,60vw);margin:0 auto 1.5rem;display:block; }
.s01-logo svg { width:100%;fill:var(--ecru-white);filter:drop-shadow(0 0 30px rgba(94,217,166,0.3)); }
.s01-eyebrow { font-family:'Montserrat',sans-serif;font-weight:800;font-size:0.7rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--mintgreen);margin-bottom:1rem; }
.s01-title { font-family:'Montserrat',sans-serif;font-weight:900;font-size:clamp(2.5rem,6vw,5rem);color:var(--ecru-white);line-height:1;margin-bottom:0.5rem; }
.s01-date { font-family:'Futura',sans-serif;font-size:clamp(1rem,2vw,1.5rem);color:var(--spring-rain);margin-bottom:2rem;letter-spacing:0.05em; }
.s01-tag { display:inline-block;background:rgba(94,217,166,0.12);border:1px solid rgba(94,217,166,0.25);border-radius:100px;padding:0.4rem 1.25rem;font-family:'Montserrat',sans-serif;font-weight:700;font-size:0.75rem;color:var(--mintgreen);letter-spacing:0.08em;text-transform:uppercase; }
</style>
<div class="s01-bg"><div class="s01-glow"></div></div>
<div class="s01">
  <div class="s01-logo">
    <svg viewBox="0 0 931.35 308.55" xmlns="http://www.w3.org/2000/svg">
      <polygon points="495.04 20.27 569.04 153.27 569.04 20.27 654.04 20.27 654.04 288.27 572.54 288.27 498.04 159.27 498.04 288.27 416.04 288.27 416.04 20.27 495.04 20.27"/>
      <path d="M682.04,20.27l78.89.11,73.11,133.89V20.27h81v268h-80l-72-130v130h-78.5c-.61,0-1.53-.8-2.5,0V20.27Z"/>
      <polygon points="100.04 20.27 100.04 136.27 160.54 20.27 256.04 20.27 182.26 145.61 262.04 288.27 166.54 288.27 100.04 159.27 100.04 288.27 21.04 288.27 21.04 20.27 100.04 20.27"/>
      <path d="M359.04,20.27v265.5c0,.31,1.37,1.42,1,2.5h-82V20.27h81Z"/>
    </svg>
  </div>
  <div class="s01-eyebrow">Potluck · Crew Evening</div>
  <div class="s01-title">Potluck</div>
  <div class="s01-date">28. Februar 2026 · Innsbruck</div>
  <div class="s01-tag">10 Menschen · 1 Abend · Was wir aufbauen</div>
</div>`;
  }
});
