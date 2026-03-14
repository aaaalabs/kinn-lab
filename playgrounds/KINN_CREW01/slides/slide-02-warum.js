window.KINN_SLIDES.push({
  id: 'warum',
  theme: 'light',
  render() {
    return `
<style>
.s02 { text-align:center;max-width:800px; }
.s02-label { font-size:0.7rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--teal);margin-bottom:1.5rem;font-family:'Futura',sans-serif; }
.s02-big { font-family:'Montserrat',sans-serif;font-weight:900;font-size:clamp(2rem,5vw,4rem);color:var(--heavy-metal);line-height:1.15;margin-bottom:2rem; }
.s02-big em { color:var(--teal);font-style:normal; }
.s02-line { width:60px;height:3px;background:var(--mintgreen);border-radius:2px;margin:0 auto 2rem; }
.s02-sub { font-family:'Futura',sans-serif;font-size:1rem;color:#6B7068;max-width:500px;margin:0 auto;line-height:1.7; }
</style>
<div class="s02">
  <div class="s02-label">Warum wir hier sind</div>
  <div class="s02-big">Wir <em>feiern.</em><br>Wir <em>richten uns aus.</em><br>Wir <em>bauen gemeinsam weiter.</em></div>
  <div class="s02-line"></div>
  <div class="s02-sub">Kein Pitch-Deck. Kein Bericht. Ein Abend unter Freunden — die zusammen etwas aufbauen, das Tirol braucht.</div>
</div>`;
  }
});
