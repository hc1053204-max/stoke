(() => {
  'use strict';
  const data=()=>window.TPBLData;
  const STORE_KEY='tpbl-awards-v1';
  function eligiblePlayers(){
    const s=data().getState();
    return data().TEAMS.flatMap(team=>data().roster(team).map(player=>({player,team,record:s.standings[team]})))
      .filter(x=>Number(x.player.stats?.gp)>=12);
  }
  function statLine({player,team,record}){
    const gp=Math.max(1,Number(player.stats?.gp)||0),points=Number(player.stats?.pts)||0;
    return {player,team,gp,ppg:points/gp,rating:Number(player.rating)||0,winPct:record?.g?record.w/record.g:0};
  }
  function calculate(){
    const s=data().getState(),players=eligiblePlayers().map(statLine);
    if(!players.length)return null;
    const byPoints=[...players].sort((a,b)=>b.ppg-a.ppg||b.rating-a.rating||a.player.name.localeCompare(b.player.name));
    const mvp=[...players].sort((a,b)=>((b.rating*.65)+(b.ppg*1.8)+(b.winPct*10))-((a.rating*.65)+(a.ppg*1.8)+(a.winPct*10))||b.ppg-a.ppg)[0];
    const teams=data().ranked();
    const allLeague=[...players].sort((a,b)=>b.rating-a.rating||b.ppg-a.ppg).slice(0,5).map(x=>({name:x.player.name,team:x.team,rating:x.rating,ppg:Number(x.ppg.toFixed(1))}));
    const coach=[...teams].sort((a,b)=>(b.g?b.w/b.g:0)-(a.g?a.w/a.g:0)||((b.ptsFor-b.ptsAgainst)-(a.ptsFor-a.ptsAgainst)))[0];
    return {
      season:s.season,awardedAt:new Date().toISOString(),
      mvp:{name:mvp.player.name,team:mvp.team,rating:mvp.rating,ppg:Number(mvp.ppg.toFixed(1))},
      scoringLeader:{name:byPoints[0].player.name,team:byPoints[0].team,ppg:Number(byPoints[0].ppg.toFixed(1)),points:Number(byPoints[0].player.stats?.pts)||0},
      allLeague,
      coachOfYear:{team:coach.team,record:`${coach.w}-${coach.l}`}
    };
  }
  function ensureAwards(){
    const s=data().getState();
    if(!window.TPBLSchedule.complete())return null;
    s.awardsBySeason=s.awardsBySeason&&typeof s.awardsBySeason==='object'?s.awardsBySeason:{};
    const key=String(s.season);
    if(!s.awardsBySeason[key]){
      const awards=calculate();
      if(awards){s.awardsBySeason[key]=awards;data().addHistory(`第 ${s.season} 季年度獎項已公布：MVP ${awards.mvp.name}（${awards.mvp.team}）。`);data().save(true);}
    }
    return s.awardsBySeason[key]||null;
  }
  const originalPlayNext=window.TPBLSchedule.playNext;
  window.TPBLSchedule.playNext=function(){const result=originalPlayNext();if(!result?.error&&window.TPBLSchedule.complete())ensureAwards();return result;};
  window.TPBLAwards={calculate,ensureAwards,getAll(){return data().getState().awardsBySeason||{};}};
})();
