(() => {
  'use strict';
  const $=selector=>document.querySelector(selector),esc=value=>window.TPBLData.esc(value);
  function awardCard(title,person,detail){return `<section class="card span-6"><h3>${title}</h3><div class="award-winner"><strong>${esc(person)}</strong><span>${detail}</span></div></section>`;}
  function render(){
    const state=window.TPBLData.getState(),awards=window.TPBLAwards.ensureAwards();
    const archived=Object.values(window.TPBLAwards.getAll()).sort((a,b)=>b.season-a.season);
    if(!awards){
      $('#pageRoot').innerHTML=`<div class="grid"><section class="card"><h3>年度獎項</h3><p class="muted">完成全部 126 場例行賽後公布年度獎項。球員需至少出賽 12 場才具個人獎項資格。</p><div class="progress"><i style="width:${Math.min(100,state.gameIndex/126*100)}%"></i></div><p>目前賽程：${state.gameIndex}/126</p></section>${archived.length?`<section class="card"><h3>歷屆獎項</h3>${archived.map(a=>`<div class="entry"><span>第 ${a.season} 季 MVP</span><b>${esc(a.mvp.name)} · ${esc(a.mvp.team)}</b></div>`).join('')}</section>`:''}</div>`;
      return;
    }
    const prior=archived.filter(a=>a.season!==awards.season);
    $('#pageRoot').innerHTML=`<div class="grid"><section class="card span-12"><h3>🏆 第 ${awards.season} 季年度獎項</h3><p class="muted">例行賽結束後自動結算。個人獎項資格：至少出賽 12 場。</p></section>${awardCard('年度最有價值球員｜MVP',awards.mvp.name,`${esc(awards.mvp.team)} · OVR ${awards.mvp.rating} · ${awards.mvp.ppg} 分／場`)}${awardCard('年度得分王',awards.scoringLeader.name,`${esc(awards.scoringLeader.team)} · ${awards.scoringLeader.ppg} 分／場 · 總得分 ${awards.scoringLeader.points}`)}${awardCard('年度最佳教練',awards.coachOfYear.team,`例行賽戰績 ${awards.coachOfYear.record}`)}<section class="card span-12"><h3>年度第一隊</h3>${awards.allLeague.map((p,i)=>`<div class="entry"><span>${i+1}. ${esc(p.name)} <span class="pill">${esc(p.team)}</span></span><b>${p.rating} OVR · ${p.ppg} PPG</b></div>`).join('')}</section>${prior.length?`<section class="card span-12"><h3>歷屆 MVP</h3>${prior.map(a=>`<div class="entry"><span>第 ${a.season} 季</span><b>${esc(a.mvp.name)} · ${esc(a.mvp.team)}</b></div>`).join('')}</section>`:''}</div>`;
  }
  const nav=document.querySelector('.tabs');
  if(nav){
    const button=document.createElement('button');button.type='button';button.dataset.awardsPage='true';button.textContent='年度獎項';nav.appendChild(button);
    nav.addEventListener('click',event=>{
      const target=event.target.closest('[data-awards-page]');if(!target)return;
      event.preventDefault();event.stopPropagation();
      nav.querySelectorAll('button').forEach(b=>b.classList.remove('active'));target.classList.add('active');render();
    });
    nav.addEventListener('click',event=>{if(event.target.closest('[data-page]'))button.classList.remove('active');});
  }
  window.TPBLAwardsUI={render};
})();
