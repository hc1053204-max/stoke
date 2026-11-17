(() => {
  'use strict';
  const data=()=>window.TPBLData;
  function pending(){return data().getState().schedule.find(game=>!game.played)||null;}
  function complete(){return data().TEAMS.every(team=>data().getState().standings[team].g>=data().GAMES);}
  function play(game) {
    if(!game||game.played) return null;
    const s=data().getState(),ra=s.standings[game.a],rb=s.standings[game.b];
    if(!ra||!rb||ra.g>=data().GAMES||rb.g>=data().GAMES) return null;
    const score=(team,home)=>Math.max(65,Math.round(82+Math.random()*22+(data().strength(team)-70)*.48+(game.home===home?2.5:0)));
    let a=score(game.a,game.a),b=score(game.b,game.b);if(a===b)b++;
    ra.g++;rb.g++;ra.ptsFor+=a;ra.ptsAgainst+=b;rb.ptsFor+=b;rb.ptsAgainst+=a;
    game.played=true;game.score=[a,b];game.winner=a>b?game.a:game.b;
    if(a>b){ra.w++;rb.l++;}else{rb.w++;ra.l++;}
    for(const team of [game.a,game.b]) for(const player of data().roster(team)) {
      if(player.injury>0) player.injury--;
      else if(player.starter&&Math.random()<.008) player.injury=data().rand(1,3);
      if(player.starter&&!player.injury){player.stats=player.stats||{gp:0,pts:0};player.stats.gp++;player.stats.pts+=data().rand(4,24);}
    }
    const s2=data().getState();s2.gameIndex=s2.schedule.filter(g=>g.played).length;
    data().addHistory(`${game.a} ${a}：${b} ${game.b}｜${game.winner} 獲勝`);
    if(complete())data().addHistory('例行賽結束，六強季後賽即將開始。');
    return {a,b,winner:game.winner,game};
  }
  function playNext(){if(data().getState().postseason)return {error:'季後賽期間請使用季後賽頁面。'};const game=pending();if(!game)return {error:'例行賽已完成。'};return play(game);}
  function standingsReady(){return complete();}
  window.TPBLSchedule={pending,complete,play,playNext,standingsReady};
})();
