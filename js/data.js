(() => {
  'use strict';
  const KEY = 'front-office-tpbl-optimized-v1';
  const TEAMS = ['桃園台啤永豐雲豹','福爾摩沙台新夢想家','新北中信特攻','新竹御嵿攻城獅','臺北台新戰神','高雄全家海神','臺北富邦勇士'];
  const POSITIONS = ['PG','SG','SF','PF','C'];
  const LOCAL_NAMES = `曹薰襄 呂濟而 劉元凱 高錦瑋 徐宏瑋 汪哲宇 丁冠皓 莊博元 林信寬 王皓吉 黃鎮 董永全 盧冠良 蔣淯安 周柏臣 陳振傑 馬建豪 張宗憲 吳家興 許皓程 張維恩 蔡宇謙 鍾明輝 李學林 劉季軒 周士淵 何信華 余德龍 余宗廷 林冠宇 陳子豪 張家維 王俊凱 李明哲 周柏安 吳承翰 黃建宏 蔡昱廷 許博翔 鄭宇翔 郭柏廷`.split(/\s+/);
  const IMPORT_NAMES = `Ray McCallum|Malcolm Miller|Adrien Moerman|Michael Eric|Daron Russell|Kristijan Krajina|Ivan Aska|Nysier Brooks|Austin Daye|Sani Sakakini|Jason Washburn|Kenny Manigault|Axel Toupane|Manny Harris|Tyler Hansbrough|Shawn Long|Jalen Jones|Melo Trimble|Jacob Pullen|Brady Manek|Rasheed Sulaimon|Matt Costello|Jerian Grant|Javonte Smart|Lorenzo Brown|Shabazz Napier|Tyler Cavanaugh|Nathan Knight|Youssou Ndoye|Hunter Maldonado|Grant Basile|Marek Klassen|Javion Hamlet|Kadeem Jack`.split('|');
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const uid = () => `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const shuffle = (list) => { const a = [...list]; for (let i=a.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const isForeign = p => Boolean(p && (p.isForeign || p.foreign));
  const blankStandings = () => Object.fromEntries(TEAMS.map(team => [team,{w:0,l:0,g:0,ptsFor:0,ptsAgainst:0}]));
  function createPlayer(name, team, foreign, i=0) {
    const rating = foreign ? rand(70,87) : rand(62,84);
    return {id:uid(),name,team,pos:POSITIONS[i%POSITIONS.length],age:rand(20,33),rating,potential:Math.min(99,rating+rand(3,16)),salary:foreign?0:rand(4,16),salaryUsd:foreign?rand(7000,16000):0,isForeign:foreign,starter:false,injury:0,years:rand(1,3),stats:{gp:0,pts:0}};
  }
  function createSchedule() {
    const games=[];
    for(let i=0;i<TEAMS.length;i++) for(let j=i+1;j<TEAMS.length;j++) for(let n=0;n<6;n++) {
      const a=TEAMS[i],b=TEAMS[j]; games.push({id:`g-${games.length+1}`,a,b,home:n%2?a:b,played:false,score:null,winner:null});
    }
    return shuffle(games);
  }
  function createFreeAgents() {
    return [...LOCAL_NAMES.slice(0,20).map((n,i)=>createPlayer(n,'自由球員',false,i)),...IMPORT_NAMES.slice(0,16).map((n,i)=>createPlayer(n,'自由球員',true,i))];
  }
  function fresh() {
    const locals=shuffle(LOCAL_NAMES),imports=shuffle(IMPORT_NAMES),rosters={};
    TEAMS.forEach((team,ti)=>{
      const players=[];
      for(let i=0;i<12;i++) players.push(createPlayer(locals.pop()||`本土球員${ti+1}-${i+1}`,team,false,i));
      for(let i=0;i<4;i++) players.push(createPlayer(imports.pop()||`洋將${ti+1}-${i+1}`,team,true,i));
      players.filter(p=>!p.isForeign).slice(0,5).forEach(p=>p.starter=true);
      rosters[team]=players;
    });
    return {version:2,team:TEAMS[0],manager:'總經理',season:1,rosters,freeAgents:createFreeAgents(),standings:blankStandings(),schedule:createSchedule(),gameIndex:0,history:[{date:new Date().toLocaleDateString('zh-TW'),text:'新賽季正式開幕，祝各隊好運！'}],postseason:null,champions:[]};
  }
  function normalizePlayer(raw,team,i) {
    const foreign=isForeign(raw),rating=Number(raw.rating)||70;
    return {...raw,id:String(raw.id||uid()),name:String(raw.name||`球員${i+1}`),team,pos:POSITIONS.includes(raw.pos)?raw.pos:POSITIONS[i%5],age:Math.max(18,Number(raw.age)||24),rating,potential:Math.max(rating,Number(raw.potential)||rating+5),salary:foreign?0:Math.max(0,Number(raw.salary)||5),salaryUsd:foreign?Math.max(0,Number(raw.salaryUsd)||10000):0,isForeign:foreign,starter:Boolean(raw.starter),injury:Math.max(0,Number(raw.injury)||0),years:Math.max(1,Number(raw.years)||1),stats:{gp:0,pts:0,...(raw.stats||{})}};
  }
  function normalize(raw) {
    if(!raw||typeof raw!=='object'||!raw.rosters) return fresh();
    const base=fresh(),s={...base,...raw};
    s.team=TEAMS.includes(raw.team)?raw.team:TEAMS[0];s.manager=String(raw.manager||'總經理').slice(0,24);s.season=Math.max(1,Number(raw.season)||1);
    s.rosters={};TEAMS.forEach(team=>{const list=Array.isArray(raw.rosters[team])?raw.rosters[team]:base.rosters[team];s.rosters[team]=list.map((p,i)=>normalizePlayer(p,team,i));});
    s.freeAgents=(Array.isArray(raw.freeAgents)?raw.freeAgents:base.freeAgents).map((p,i)=>normalizePlayer(p,'自由球員',i));
    s.standings=blankStandings();TEAMS.forEach(team=>{const old=raw.standings?.[team]||{};const w=Math.max(0,Number(old.w)||0),l=Math.max(0,Number(old.l)||0);s.standings[team]={...old,w,l,g:Math.max(w+l,Number(old.g)||0),ptsFor:Math.max(0,Number(old.ptsFor)||0),ptsAgainst:Math.max(0,Number(old.ptsAgainst)||0)};});
    const oldSchedule=Array.isArray(raw.schedule)?raw.schedule:[];
    s.schedule=oldSchedule.length===126?oldSchedule.map((g,i)=>({...g,id:g.id||`g-${i+1}`,a:TEAMS.includes(g.a)?g.a:base.schedule[i].a,b:TEAMS.includes(g.b)?g.b:base.schedule[i].b,home:TEAMS.includes(g.home)?g.home:g.a,played:Boolean(g.played)||(!('played'in g)&&i<(Number(raw.gameIndex)||0)),score:Array.isArray(g.score)?g.score:null,winner:g.winner||null})):base.schedule;
    s.gameIndex=s.schedule.filter(g=>g.played).length;
    s.history=Array.isArray(raw.history)?raw.history.slice(0,150):[];s.champions=Array.isArray(raw.champions)?raw.champions:[];
    s.postseason=raw.postseason&&Array.isArray(raw.postseason.series)?raw.postseason:null;
    return s;
  }
  let state;try{state=normalize(JSON.parse(localStorage.getItem(KEY)||'null'));}catch{state=fresh();}
  const api={KEY,TEAMS,POSITIONS,DOM_CAP:200,IMPORT_CAP:4,FOREIGN_CAP:40000,GAMES:36,LEAGUE_GAMES:126,esc,isForeign,rand,uid,shuffle,blankStandings,createPlayer,createSchedule,fresh,normalize,getState:()=>state,setState:value=>{state=value;},save(silent=false){try{localStorage.setItem(KEY,JSON.stringify(state));return true;}catch{return false;}},addHistory(text){state.history.unshift({date:new Date().toLocaleDateString('zh-TW'),text});state.history=state.history.slice(0,150);},roster(team=state.team){return state.rosters[team]||[];},domesticPayroll(team=state.team){return this.roster(team).filter(p=>!isForeign(p)).reduce((n,p)=>n+(Number(p.salary)||0),0);},foreignPayroll(team=state.team){return this.roster(team).filter(isForeign).reduce((n,p)=>n+(Number(p.salaryUsd)||0),0);},ranked(){return TEAMS.map(team=>({team,...state.standings[team]})).sort((a,b)=>b.w-a.w||a.l-b.l||((b.ptsFor-b.ptsAgainst)-(a.ptsFor-a.ptsAgainst))||TEAMS.indexOf(a.team)-TEAMS.indexOf(b.team));},average(team){const list=this.roster(team);return list.length?list.reduce((n,p)=>n+(Number(p.rating)||0),0)/list.length:65;},strength(team){const starters=this.roster(team).filter(p=>p.starter&&!p.injury);return (starters.length?starters.reduce((n,p)=>n+p.rating,0)/starters.length:this.average(team))-(this.roster(team).some(p=>p.injury)?2:0);}};
  window.TPBLData=api;
})();
