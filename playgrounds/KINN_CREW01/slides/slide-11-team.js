window.KINN_SLIDES.push({
  id: 'team',
  theme: 'dark',
  render() {
    const people = [
      { name: 'Thomas', roles: ['Strategie', 'Content'], img: 'images/avatar_new04.png' },
      { name: 'Martin H.', roles: ['TechTalk', 'Sponsoren', 'Event Aufbau'], img: 'images/crew_martin.png' },
      { name: 'Desiree', roles: ['Format-Ideen', 'Workshop', 'Chapter-Aufbau'], img: 'images/t046_arzic-desiree.jpg' },
      { name: 'Marco K.', roles: ['Community Mgmt', 'Chapter-Aufbau', 'Location'], img: 'images/crew_marco.jpeg' },
      { name: 'Sherin', roles: ['Workshop', 'Social Media', 'Plattform Dev'], img: 'images/t023_grimbergen-sherin.jpg' },
      { name: 'Daniel M.', roles: ['Plattform Dev', 'TechTalk'], img: 'images/t001_meischl-daniel.jpg' },
      { name: 'Matthias S.', roles: ['TechTalk', 'Workshop'], img: 'images/t011_sammer-matthias.jpg' },
      { name: 'David M.', roles: ['Plattform Dev'], img: 'images/crew_david.jpeg' },
      { name: 'Stephan P.', roles: ['Location Scouting'], img: 'images/t047_pichler-stephan.jpg' },
      { name: 'Steven L.', roles: ['Podcast', 'KINN:RAUS'], img: 'images/t028_lahmann-steven.jpg' },
      { name: 'Christoph', roles: ['Tisch-Mod'], img: 'images/crew_christoph_r.jpeg' },
    ];
    const avatar = p => p.img
      ? `<img src="${p.img}" alt="${p.name}" style="width:56px;height:56px;border-radius:50%;object-fit:cover;margin-bottom:0.6rem;border:2px solid rgba(94,217,166,0.3)" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
        + `<div style="display:none;width:56px;height:56px;border-radius:50%;background:rgba(94,217,166,0.15);border:2px solid rgba(94,217,166,0.3);align-items:center;justify-content:center;font-family:'Montserrat',sans-serif;font-weight:900;font-size:1.1rem;color:var(--mintgreen);margin-bottom:0.6rem">${p.name[0]}</div>`
      : `<div style="display:flex;width:56px;height:56px;border-radius:50%;background:rgba(94,217,166,0.1);border:2px solid rgba(94,217,166,0.2);align-items:center;justify-content:center;font-family:'Montserrat',sans-serif;font-weight:900;font-size:1.1rem;color:var(--mintgreen);margin-bottom:0.6rem">${p.name[0]}</div>`;
    const cards = people.map(p => `
      <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:1rem 0.85rem;display:flex;flex-direction:column;align-items:center;text-align:center;">
        ${avatar(p)}
        <div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:0.9rem;color:var(--ecru-white);margin-bottom:0.5rem">${p.name}</div>
        <div style="display:flex;flex-wrap:wrap;gap:0.25rem;justify-content:center">${p.roles.map(r => `<span style="font-family:'Futura',sans-serif;font-size:0.6rem;background:rgba(94,217,166,0.15);color:var(--mintgreen);padding:0.15rem 0.4rem;border-radius:4px">${r}</span>`).join('')}</div>
      </div>`).join('');
    return `
<style>
.s11 { width:100%;max-width:940px; }
.s11-label { font-size:0.7rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--spring-rain);margin-bottom:0.5rem;font-family:'Futura',sans-serif; }
.s11-h { font-family:'Montserrat',sans-serif;font-weight:900;font-size:clamp(1.75rem,4vw,3rem);color:var(--ecru-white);margin-bottom:0.25rem;line-height:1.1; }
.s11-sub { font-family:'Montserrat',sans-serif;font-weight:700;font-size:0.9rem;color:var(--spring-rain);margin-bottom:1.5rem; }
.s11-grid { display:grid;grid-template-columns:repeat(4,1fr);gap:0.75rem; }
</style>
<div class="s11">
  <div class="s11-label">Slide 11 · Team</div>
  <div class="s11-h">Wer sitzt hier?</div>
  <div class="s11-sub">11 Menschen · 1 gemeinsames Ziel · Tirol</div>
  <div class="s11-grid">${cards}</div>
</div>`;
  }
});
