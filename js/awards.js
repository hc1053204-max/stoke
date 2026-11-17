(() => {
  'use strict';
  const data=()=>window.TPBLData;
  const REQUIRED_GAMES=12;
  function eligiblePlayers(){
    const s=data().getState();
    return data().TEAMS.flatMap(team=>data().roster(team).map(player=>({player,team,record:s.standings[team]})))
      .filter(x=>Number(x.player.stats?.gp)>=REQUIRED_GAMES);
  }
  function line(item){
    const gp=Math.max(1,Number(item.player.stats?.gp)||0),points=Number(item.player.stats?.pts)||0;
    return {...item,gp,ppg:points/gp,rating:Number(item.player.rating)||0,winPct:item.record?.g?item.record.w/item.record.g:0};
  }
  function calculate(){
    const s=data().getState(),players=eligiblePlayers().map(line);
    if(!players.length)return null;
    const ppg=(a,b)=>b.ppg-a.ppg||b.rating-a.rating;
    const mvp=[...players].sort((a,b)=>(b.rating*.65+b.ppg*1.8+b.winPct*10)-(a.rating*.65+a.ppg*1.8+a.winPct*10)||ppg(a,b))[0];
    const scoring=[...players].sort(ppg)[0];
    const standings=data().ranked();
    const topDefense=[...standings].filter(t=>t.g>0).sort((a,b)=>a.ptsAgainst/a.g-b.ptsAgainst/b.g||b.w-a.w).slice(0,3).map(t=>t.team);
    const allLeague=[...players].sort((a,b)=>b.rating-a.rating||ppg(a,b)).slice(0,5).map(x=>({name:x.player.name,team:x.team,rating:x.rating,ppg:Number(x.ppg.toFixed(1))}));
    const defensiveFirst=[...players].filter(x=>topDefense.includes(x.team)).sort((a,b)=>b.rating-a.rating||ppg(a,b)).slice(0,5).map(x=>({name:x.player.name,team:x.team,rating:x.rating,ppg:Number(x.ppg.toFixed(1))}));
    const coach=[...standings].sort((a,b)=>(b.g?b.w/b.g:0)-(a.g?a.w/a.g:0)||((b.ptsFor-b.ptsAgainst)-(a.ptsFor-a.ptsAgainst)))[0];
    const topSeed=standings[0];
    return {
      season:s.season,awardedAt:new Date().toISOString(),
      mvp:{name:mvp.player.name,team:mvp.team,rating:mvp.rating,ppg:Number(mvp.ppg.toFixed(1))},
      scoringLeader:{name:scoring.player.name,team:scoring.team,ppg:Number(scoring.ppg.toFixed(1)),points:Number(scoring.player.stats?.pts)||0},
      allLeague,defensiveFirst,
      coachOfYear:{team:coach.team,record:`${coach.w}-${coach.l}`},
      honors:{regularSeasonTopSeed:topSeed.team,defensiveTeam:topDefense[0]||null,leagueChampion:null}
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
  function recordChampion(team){
    const s=data().getState(),awards=ensureAwards();
    if(!awards||!team)return null;
    awards.honors=awards.honors||{};
    if(awards.honors.leagueChampion!==team){awards.honors.leagueChampion=team;data().addHistory(`第 ${s.season} 季聯盟冠軍：${team}。`);data().save(true);}
    return awards;
  }
  const originalPlayNext=window.TPBLSchedule.playNext;
  window.TPBLSchedule.playNext=function(){const before=data().getState().awardsBySeason?.[String(data().getState().season)];const result=originalPlayNext();if(!result?.error&&window.TPBLSchedule.complete()){const awards=ensureAwards();if(awards&&!before)window.dispatchEvent(new CustomEvent('tpbl:awards-reveal',{detail:awards}));}return result;};
  const originalPlayoffGame=window.TPBLPlayoffs.play;
  if(originalPlayoffGame){window.TPBLPlayoffs.play=function(){const result=originalPlayoffGame();const p=data().getState().postseason;if(p?.champion){const prior=data().getState().awardsBySeason?.[String(data().getState().season)]?.honors?.leagueChampion;const awards=recordChampion(p.champion);if(awards&&!prior)window.dispatchEvent(new CustomEvent('tpbl:champion-reveal',{detail:{season:data().getState().season,team:p.champion,mvp:awards.mvp}});}return result;};}
  window.TPBLAwards={calculate,ensureAwards,recordChampion,getAll(){return data().getState().awardsBySeason||{};}};
})();
