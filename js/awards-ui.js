(() => {
  'use strict';
  const $=selector=>document.querySelector(selector),esc=value=>window.TPBLData.esc(value);
  let view='season';
  const allAwards=()=>Object.values(window.TPBLAwards.getAll()).sort((a,b)=>b.season-a.season);
  function awardCard(title,person,detail){return `<section class="card span-6"><h3>${title}</h3><div class="award-winner"><strong>${esc(person||'尚未公布')}</strong><span>${detail}</span></div></section>`;}
  function leaderboard(awards){
    const counts=new Map();
    const add=(name,team,award)=>{if(!name)return;const key=`${name}::${team||''}`;const row=counts.get(key)||{name,team:team||'',mvp:0,scoring:0,first:0,defense:0};row[award]++;counts.set(key,row);};
    awards.forEach(a=>{add(a.mvp?.name,a.mvp?.team,'mvp');add(a.scoringLeader?.name,a.scoringLeader?.team,'scoring');(a.allLeague||[]).forEach(p=>add(p.name,p.team,'first'));(a.defensiveFirst||[]).forEach(p=>add(p.name,p.team,'defense'));});
    const players=[...counts.values()].sort((a,b)=>b.mvp-a.mvp||b.scoring-a.scoring||b.first-a.first||a.name.localeCompare(b.name));
    const teamCounts=new Map();awards.forEach(a=>{const h=a.honors||{};for(const [field,label] of [['leagueChampion','championships'],['regularSeasonTopSeed','topSeeds'],['defensiveTeam','bestDefense']])if(h[field]){const r=teamCounts.get(h[field])||{team:h[field],championships:0,topSeeds:0,bestDefense:0};r[label]++;teamCounts.set(h[field],r);}});
    return `<section class="card span-12"><h3>球員獎項排行榜 <small>按 MVP 次數排序</small></h3><div class="table-wrap"><table><thead><tr><th>排名</th><th>球員</th><th>球隊</th><th>MVP</th><th>得分王</th><th>年度第一隊</th><th>防守第一隊</th></tr></thead><tbody>${players.length?players.map((p,i)=>`<tr><td>${i+1}</td><td>${esc(p.name)}</td><td>${esc(p.team)}</td><td>${p.mvp}</td><td>${p.scoring}</td><td>${p.first}</td><td>${p.defense}</td></tr>`).join(''):'<tr><td colspan="7" class="empty">尚無年度獎項資料。</td></tr>'}</tbody></table></div></section><section class="card span-12"><h3>球隊榮譽排行榜</h3><div class="table-wrap"><table><thead><tr><th>球隊</th><th>聯盟冠軍</th><th>例行賽第一</th><th>最佳防守</th></tr></thead><tbody>${[...teamCounts.values()].sort((a,b)=>b.championships-a.championships||b.topSeeds-a.topSeeds).map(t=>`<tr><td>${esc(t.team)}</td><td>${t.championships}</td><td>${t.topSeeds}</td><td>${t.bestDefense}</td></tr>`).join('')||'<tr><td colspan="4" class="empty">尚無球隊榮譽資料。</td></tr>'}</tbody></table></div></section>`;
  }
  function awardsView(){
    const state=window.TPBLData.getState(),current=window.TPBLAwards.ensureAwards(),awards=allAwards();
    if(view==='leaderboard')return `<div class="grid"><section class="card span-12"><div class="row"><div><h3>歷年獎項排行榜</h3><p class="muted">統計本機存檔中已結算的球季獎項。</p></div><button data-award-view="season">返回本季獎項</button></div></section>${leaderboard(awards)}</div>`;
    if(!current)return `<div class="grid"><section class="card span-12"><h3>年度獎項</h3><p class="muted">完成全部 126 場例行賽後公布獎項。球員需至少出賽 12 場才具個人獎項資格。</p><div class="progress"><i style="width:${Math.min(100,state.gameIndex/126*100)}%"></i></div><p>目前賽程：${state.gameIndex}/126</p><button data-award-view="leaderboard">查看歷年排行榜</button></section>${awards.length?leaderboard(awards):''}</div>`;
    const honors=current.honors||{};
    return `<div class="grid"><section class="card span-12"><div class="row"><div><h3>🏆 第 ${current.season} 季年度獎項</h3><p class="muted">個人獎項資格：例行賽至少出賽 12 場。</p></div><button data-award-view="leaderboard">查看歷年排行榜</button></div></section>${awardCard('年度最有價值球員｜MVP',current.mvp.name,`${esc(current.mvp.team)} · OVR ${current.mvp.rating} · ${current.mvp.ppg} 分／場`)}${awardCard('年度得分王',current.scoringLeader.name,`${esc(current.scoringLeader.team)} · ${current.scoringLeader.ppg} 分／場 · 總得分 ${current.scoringLeader.points}`)}${awardCard('年度最佳教練',current.coachOfYear.team,`例行賽戰績 ${current.coachOfYear.record}`)}${awardCard('例行賽第一名',honors.regularSeasonTopSeed||'待定','例行賽最佳戰績')}${awardCard('最佳防守球隊',honors.defensiveTeam||'待定','依每場平均失分排序')}${awardCard('聯盟冠軍',honors.leagueChampion||'季後賽尚未結束',honors.leagueChampion?'總冠軍':'完成季後賽後公布') }<section class="card span-12"><h3>年度第一隊</h3>${(current.allLeague||[]).map((p,i)=>`<div class="entry"><span>${i+1}. ${esc(p.name)} <span class="pill">${esc(p.team)}</span></span><b>${p.rating} OVR · ${p.ppg} PPG</b></div>`).join('')}</section><section class="card span-12"><h3>年度防守第一隊</h3>${(current.defensiveFirst||[]).map((p,i)=>`<div class="entry"><span>${i+1}. ${esc(p.name)} <span class="pill">${esc(p.team)}</span></span><b>${p.rating} OVR</b></div>`).join('')||'<p class="muted">尚無合格球員。</p>'}</section>${awards.length>1?`<section class="card span-12"><h3>歷屆 MVP</h3>${awards.filter(a=>a.season!==current.season).map(a=>`<div class="entry"><span>第 ${a.season} 季</span><b>${esc(a.mvp.name)} · ${esc(a.mvp.team)}</b></div>`).join('')}</section>`:''}</div>`;
  }
  function openReveal(kind,detail){
    const old=document.querySelector('.ceremony-backdrop');if(old)old.remove();
    const isChampion=kind==='champion',title=isChampion?'🏆 總冠軍！':'🏅 年度獎項揭曉';
    const content=isChampion?`<p class="ceremony-kicker">第 ${detail.season} 季冠軍</p><h2>${esc(detail.team)}</h2><p>本季最有價值球員：<strong>${esc(detail.mvp?.name||'')}</strong></p>`:`<p class="ceremony-kicker">第 ${detail.season} 季</p><h2>年度 MVP</h2><p class="ceremony-player">${esc(detail.mvp?.name||'')}</p><p>${esc(detail.mvp?.team||'')} · ${detail.mvp?.ppg||0} 分／場</p>`;
    const modal=document.createElement('div');modal.className='ceremony-backdrop';modal.innerHTML=`<section class="ceremony" role="dialog" aria-modal="true" aria-label="${title}"><button class="ceremony-close" aria-label="關閉">×</button><div class="ceremony-trophy">${isChampion?'🏆':'🏀'}</div><p class="ceremony-title">${title}</p>${content}<button class="primary ceremony-dismiss">繼續</button></section>`;document.body.appendChild(modal);modal.querySelectorAll('.ceremony-close,.ceremony-dismiss').forEach(button=>button.addEventListener('click',()=>modal.remove()));modal.addEventListener('click',e=>{if(e.target===modal)modal.remove();});
  }
  const nav=document.querySelector('.tabs');
  if(nav){
    const button=document.createElement('button');button.type='button';button.dataset.awardsPage='true';button.textContent='獎項與榮譽';nav.appendChild(button);
    nav.addEventListener('click',event=>{const target=event.target.closest('[data-awards-page]');if(!target)return;event.preventDefault();event.stopPropagation();nav.querySelectorAll('button').forEach(b=>b.classList.remove('active'));target.classList.add('active');view='season';awardsView();});
    nav.addEventListener('click',event=>{if(event.target.closest('[data-page]'))button.classList.remove('active');});
  }
  document.addEventListener('click',event=>{const b=event.target.closest('[data-award-view]');if(!b)return;view=b.dataset.awardView;awardsView();});
  window.addEventListener('tpbl:awards-reveal',event=>openReveal('awards',event.detail));
  window.addEventListener('tpbl:champion-reveal',event=>openReveal('champion',event.detail));
  window.TPBLAwardsUI={render:awardsView};
})();
