window.KINN_SLIDES.push({
  id: 'diskussion',
  theme: 'light',
  render() {
    const questions = [
      { num: '01', q: 'KINN:FUND', detail: 'OpenCollective ist live. Wie kommunizieren wir das nach außen?' },
      { num: '02', q: 'Kommunikationskanal', detail: 'Discord ist raus, WhatsApp kein Community-Kanal. Was nutzen wir zwischen den Events?' },
      { num: '03', q: 'Rollen-Ownership', detail: 'Wer übernimmt welchen Bereich verbindlich — nicht nur "gerne" sondern mit Ownership?' },
      { num: '04', q: 'Onboarding neuer Crew', detail: 'Wenn wir wachsen: Wie holen wir neue Crew-Mitglieder an Bord?' },
      { num: '05', q: 'Feedback-System', detail: 'Wie sammeln wir systematisch, was funktioniert und was nicht?' },
    ];
    const cards = questions.map(q => `
      <div style="background:white;border:1px solid rgba(43,50,40,0.1);border-radius:12px;padding:1.1rem 1.25rem;display:flex;gap:1rem;align-items:flex-start">
        <div style="font-family:'Montserrat',sans-serif;font-weight:900;font-size:1.5rem;color:rgba(94,217,166,0.4);line-height:1;flex-shrink:0">${q.num}</div>
        <div>
          <div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:0.95rem;color:var(--heavy-metal);margin-bottom:0.25rem">${q.q}</div>
          <div style="font-family:'Futura',sans-serif;font-size:0.82rem;color:#6B7068;line-height:1.5">${q.detail}</div>
        </div>
      </div>`).join('');
    return `
<style>
.s15 { width:100%;max-width:820px; }
.s15-label { font-size:0.7rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--teal);margin-bottom:0.5rem;font-family:'Futura',sans-serif; }
.s15-h { font-family:'Montserrat',sans-serif;font-weight:900;font-size:clamp(1.75rem,4vw,3rem);color:var(--heavy-metal);margin-bottom:0.25rem;line-height:1.1; }
.s15-sub { font-family:'Montserrat',sans-serif;font-weight:700;font-size:0.9rem;color:var(--teal);margin-bottom:1.5rem; }
.s15-note { background:rgba(94,217,166,0.08);border-left:3px solid var(--mintgreen);border-radius:0 8px 8px 0;padding:0.75rem 1.25rem;font-size:0.82rem;color:var(--heavy-metal);margin-top:1rem; }
</style>
<div class="s15">
  <div class="s15-label">Slide 15 · Diskussion</div>
  <div class="s15-h">Offene Fragen</div>
  <div class="s15-sub">5 Themen für den Abend — keine richtigen Antworten, nur gute Gespräche</div>
  <div style="display:flex;flex-direction:column;gap:0.75rem">${cards}</div>
  <div class="s15-note">Kein Protokoll, kein Ergebnisdruck. Wir reden, was sich richtig anfühlt.</div>
</div>`;
  }
});
