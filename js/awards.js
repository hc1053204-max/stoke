(() => {
  'use strict';

  const data = () => window.TPBLData;
  const REQUIRED_GAMES = 12;

  function eligiblePlayers() {
    const state = data().getState();
    return data().TEAMS.flatMap(team =>
      data().roster(team).map(player => ({ player, team, record: state.standings[team] }))
    ).filter(item => Number(item.player.stats?.gp) >= REQUIRED_GAMES);
  }

  function statLine(item) {
    const games = Math.max(1, Number(item.player.stats?.gp) || 0);
    const points = Number(item.player.stats?.pts) || 0;
    return {
      ...item,
      games,
      ppg: points / games,
      rating: Number(item.player.rating) || 0,
      winPct: item.record?.g ? item.record.w / item.record.g : 0,
    };
  }

  function calculate() {
    const state = data().getState();
    const players = eligiblePlayers().map(statLine);
    if (!players.length) return null;

    const byScoring = (a, b) => b.ppg - a.ppg || b.rating - a.rating;
    const mvp = [...players].sort((a, b) =>
      (b.rating * 0.65 + b.ppg * 1.8 + b.winPct * 10) -
      (a.rating * 0.65 + a.ppg * 1.8 + a.winPct * 10) || byScoring(a, b)
    )[0];
    const scoringLeader = [...players].sort(byScoring)[0];
    const standings = data().ranked();
    const defensiveTeams = [...standings]
      .filter(team => team.g > 0)
      .sort((a, b) => a.ptsAgainst / a.g - b.ptsAgainst / b.g || b.w - a.w)
      .slice(0, 3)
      .map(team => team.team);
    const toAwardPlayer = item => ({
      name: item.player.name,
      team: item.team,
      rating: item.rating,
      ppg: Number(item.ppg.toFixed(1)),
    });
    const allLeague = [...players].sort((a, b) => b.rating - a.rating || byScoring(a, b))
      .slice(0, 5).map(toAwardPlayer);
    const defensiveFirst = [...players].filter(item => defensiveTeams.includes(item.team))
      .sort((a, b) => b.rating - a.rating || byScoring(a, b))
      .slice(0, 5).map(toAwardPlayer);
    const coach = [...standings].sort((a, b) =>
      (b.g ? b.w / b.g : 0) - (a.g ? a.w / a.g : 0) ||
      ((b.ptsFor - b.ptsAgainst) - (a.ptsFor - a.ptsAgainst))
    )[0];

    return {
      season: state.season,
      awardedAt: new Date().toISOString(),
      mvp: { name: mvp.player.name, team: mvp.team, rating: mvp.rating, ppg: Number(mvp.ppg.toFixed(1)) },
      scoringLeader: {
        name: scoringLeader.player.name,
        team: scoringLeader.team,
        ppg: Number(scoringLeader.ppg.toFixed(1)),
        points: Number(scoringLeader.player.stats?.pts) || 0,
      },
      allLeague,
      defensiveFirst,
      coachOfYear: { team: coach.team, record: `${coach.w}-${coach.l}` },
      honors: {
        regularSeasonTopSeed: standings[0]?.team || null,
        defensiveTeam: defensiveTeams[0] || null,
        leagueChampion: null,
      },
    };
  }

  function ensureAwards() {
    const state = data().getState();
    if (!window.TPBLSchedule.complete()) return null;
    if (!state.awardsBySeason || typeof state.awardsBySeason !== 'object') state.awardsBySeason = {};

    const key = String(state.season);
    if (!state.awardsBySeason[key]) {
      const awards = calculate();
      if (awards) {
        state.awardsBySeason[key] = awards;
        data().addHistory(`第 ${state.season} 季年度獎項已公布：MVP ${awards.mvp.name}（${awards.mvp.team}）。`);
        data().save(true);
      }
    }
    return state.awardsBySeason[key] || null;
  }

  function recordChampion(team) {
    const state = data().getState();
    const awards = ensureAwards();
    if (!awards || !team) return null;

    awards.honors = awards.honors || {};
    if (awards.honors.leagueChampion !== team) {
      awards.honors.leagueChampion = team;
      data().addHistory(`第 ${state.season} 季聯盟冠軍：${team}。`);
      data().save(true);
    }
    return awards;
  }

  const originalPlayNext = window.TPBLSchedule.playNext;
  window.TPBLSchedule.playNext = function () {
    const state = data().getState();
    const hadAwards = Boolean(state.awardsBySeason?.[String(state.season)]);
    const result = originalPlayNext();
    if (!result?.error && window.TPBLSchedule.complete()) {
      const awards = ensureAwards();
      if (awards && !hadAwards) {
        window.dispatchEvent(new CustomEvent('tpbl:awards-reveal', { detail: awards }));
      }
    }
    return result;
  };

  const originalPlayoffGame = window.TPBLPlayoffs.play;
  if (typeof originalPlayoffGame === 'function') {
    window.TPBLPlayoffs.play = function () {
      const result = originalPlayoffGame();
      const state = data().getState();
      const champion = state.postseason?.champion;
      if (champion) {
        const previousChampion = state.awardsBySeason?.[String(state.season)]?.honors?.leagueChampion;
        const awards = recordChampion(champion);
        if (awards && !previousChampion) {
          window.dispatchEvent(new CustomEvent('tpbl:champion-reveal', {
            detail: { season: state.season, team: champion, mvp: awards.mvp },
          }));
        }
      }
      return result;
    };
  }

  window.TPBLAwards = {
    calculate,
    ensureAwards,
    recordChampion,
    getAll() { return data().getState().awardsBySeason || {}; },
  };
})();
