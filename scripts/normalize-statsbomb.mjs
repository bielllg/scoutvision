const countries = {
  Australia: 'Austrália', Belgium: 'Bélgica', Brazil: 'Brasil', Cameroon: 'Camarões',
  Canada: 'Canadá', Croatia: 'Croácia', Denmark: 'Dinamarca', Ecuador: 'Equador',
  England: 'Inglaterra', France: 'França', Germany: 'Alemanha', Ghana: 'Gana', Iran: 'Irã', Japan: 'Japão',
  Mexico: 'México', Morocco: 'Marrocos', Netherlands: 'Países Baixos', Poland: 'Polônia',
  Qatar: 'Catar', 'Saudi Arabia': 'Arábia Saudita', Serbia: 'Sérvia', 'South Korea': 'Coreia do Sul',
  Spain: 'Espanha', Switzerland: 'Suíça', Tunisia: 'Tunísia', 'United States': 'Estados Unidos',
  Uruguay: 'Uruguai', Wales: 'País de Gales',
};
const stages = {
  'Group Stage': 'Fase de grupos', 'Round of 16': 'Oitavas de final',
  'Quarter-finals': 'Quartas de final', 'Semi-finals': 'Semifinal',
  '3rd Place Final': 'Disputa de 3º lugar', Final: 'Final',
};
const positions = [
  'Sem posição', 'Goleiro', 'Lateral-direito', 'Zagueiro pela direita', 'Zagueiro central',
  'Zagueiro pela esquerda', 'Lateral-esquerdo', 'Ala-direito', 'Ala-esquerdo',
  'Volante pela direita', 'Volante central', 'Volante pela esquerda', 'Meia pela direita',
  'Meia-central pela direita', 'Meia-central', 'Meia-central pela esquerda', 'Meia pela esquerda',
  'Ponta-direita', 'Meia-atacante pela direita', 'Meia-atacante', 'Meia-atacante pela esquerda',
  'Ponta-esquerda', 'Atacante pela direita', 'Centroavante', 'Atacante pela esquerda', 'Segundo atacante',
];
const types = {
  Shot: 'Finalização', Pass: 'Passe', Carry: 'Condução', Dribble: 'Drible', Interception: 'Interceptação',
  Pressure: 'Pressão', Block: 'Bloqueio', Clearance: 'Corte', 'Ball Recovery': 'Recuperação de bola',
  'Ball Receipt*': 'Recepção', 'Goal Keeper': 'Ação de goleiro', 'Foul Committed': 'Falta cometida',
  'Foul Won': 'Falta sofrida', Dispossessed: 'Perda de posse',
};
const outcomes = {
  Goal: 'Gol', Saved: 'Defendida', 'Off T': 'Para fora', Post: 'Na trave', Blocked: 'Bloqueada',
  'Wayward': 'Sem direção', 'Saved Off T': 'Defendida fora da direção', 'Saved To Post': 'Defendida na trave',
  Complete: 'Completo', Incomplete: 'Incompleto', Out: 'Fora', 'Pass Offside': 'Impedimento',
  Won: 'Ganho', Lost: 'Perdido', Success: 'Bem-sucedido', 'Success In Play': 'Ganho em jogo',
  'Success Out': 'Ganho para fora', 'Lost In Play': 'Perdido em jogo', 'Lost Out': 'Perdido para fora',
  'Touched Out': 'Toque para fora', 'Saved Twice': 'Defendida em dois tempos', Claim: 'Bola dominada',
  'In Play Safe': 'Bola em jogo sem perigo', 'In Play Danger': 'Bola em jogo com perigo', 'No Touch': 'Sem toque',
};

const periodStarts = [0, 0, 45, 90, 105];
const periodLengths = [0, 45, 45, 15, 15];
const successfulDefensiveOutcomes = new Set(['Won', 'Success', 'Success In Play', 'Success Out']);

export function roleFor(id) {
  if (id === 1) return 'Goleiro';
  if (id >= 2 && id <= 8) return 'Defensor';
  if ((id >= 9 && id <= 16) || (id >= 18 && id <= 20)) return 'Meio-campista';
  if (id >= 17 && id <= 25) return 'Atacante';
  return 'Sem posição';
}

export function positionFor(id) {
  return positions[id] || positions[0];
}

function playingTime(clock, period) {
  const [minutes, seconds] = clock.split(':').map(Number);
  const start = periodStarts[period];
  if (!Number.isFinite(minutes) || !Number.isFinite(seconds) || start === undefined) {
    throw new Error('Intervalo de escalação inválido: ' + clock + ' / ' + period);
  }
  return start + Math.min(periodLengths[period], Math.max(0, minutes + seconds / 60 - start));
}

function participation(player, matchId, teamId, finalMinute) {
  if (!Array.isArray(player.positions)) throw new Error(matchId + ' — posições da escalação ausentes.');
  const intervals = player.positions
    .filter((position) => position.from_period < 5)
    .map((position) => {
      const from = playingTime(position.from, position.from_period);
      const to = position.to && position.to_period < 5
        ? playingTime(position.to, position.to_period)
        : finalMinute;
      return { from, to, positionId: position.position_id, starter: position.start_reason === 'Starting XI' };
    })
    .sort((a, b) => a.from - b.from);
  const positionMinutes = {};
  let end = 0;
  for (const interval of intervals) {
    const minutes = Math.max(0, interval.to - Math.max(interval.from, end));
    positionMinutes[interval.positionId] = (positionMinutes[interval.positionId] || 0) + minutes;
    end = Math.max(end, interval.to);
  }
  const minutes = Object.values(positionMinutes).reduce((total, value) => total + value, 0);
  const positionId = intervals[0]?.positionId;
  return {
    playerId: player.player_id, matchId, teamId,
    position: positionFor(positionId), shirt: player.jersey_number ?? null,
    starter: Number(intervals.some((item) => item.starter)), played: Number(intervals.length > 0),
    positionBreakdown: JSON.stringify(positionMinutes),
    minutes, goals: 0, assists: 0, shots: 0, xg: 0, passes: 0, completed: 0,
    dribbles: 0, tackles: 0, interceptions: 0, carries: 0, progressiveCarries: 0,
    keyPasses: 0, xgAssisted: 0,
  };
}

function coordinates(location) {
  return Array.isArray(location) && Number.isFinite(location[0]) && Number.isFinite(location[1])
    && location[0] >= 0 && location[0] <= 120 && location[1] >= 0 && location[1] <= 80
    ? location : null;
}

function shotXg(shot) {
  const xg = shot?.statsbomb_xg;
  return Number.isFinite(xg) && xg >= 0 && xg <= 1 ? xg : null;
}

function addExpected(total, value) {
  return total === null || value === null ? null : total + value;
}

function updateStats(row, event, eventsById) {
  const type = event.type.name;
  const data = event.pass || event.shot || event.carry || event.dribble || event.duel || event.interception || event.goalkeeper;
  const isTackle = type === 'Duel' && event.duel?.type?.name === 'Tackle';
  const outcome = data?.outcome?.name;
  if (type === 'Shot') {
    row.shots += 1;
    row.goals += Number(outcome === 'Goal');
    row.xg = addExpected(row.xg, shotXg(data));
  } else if (type === 'Pass') {
    row.passes += 1;
    row.completed += Number(!outcome || outcome === 'Complete');
    row.assists += Number(data?.goal_assist === true);
    const shotId = data?.assisted_shot_id;
    if (shotId || data?.shot_assist || data?.goal_assist) {
      row.keyPasses += 1;
      row.xgAssisted = addExpected(row.xgAssisted, shotXg(eventsById.get(shotId)?.shot));
    }
  } else if (type === 'Dribble') {
    row.dribbles += Number(outcome === 'Complete');
  } else if (type === 'Carry') {
    row.carries += 1;
    const start = coordinates(event.location);
    const end = coordinates(data?.end_location);
    if (start && end && end[0] - start[0] >= 10) row.progressiveCarries += 1;
  } else if (isTackle) {
    row.tackles += Number(successfulDefensiveOutcomes.has(outcome));
  } else if (type === 'Interception') {
    row.interceptions += Number(successfulDefensiveOutcomes.has(outcome));
  }

  return { isTackle, data, outcome };
}

function teamData(raw, side) {
  const name = raw[side + '_team_name'];
  const id = raw[side + '_team_id'];
  if (!Number.isInteger(id) || typeof name !== 'string') throw new Error('Identidade de seleção inválida.');
  return { id, name: countries[name] || name, group: raw[side + '_team_group'] || null };
}

export function buildMatch(raw, lineups, rawEvents) {
  const matchId = raw.match_id;
  const home = teamData(raw.home_team, 'home');
  const away = teamData(raw.away_team, 'away');
  const stage = stages[raw.competition_stage?.name];
  if (lineups.length !== 2 || rawEvents.length < 1000 || typeof stage !== 'string'
    || !/^\d{4}-\d{2}-\d{2}$/.test(raw.match_date) || raw.match_status !== 'available'
    || !Number.isInteger(raw.home_score) || !Number.isInteger(raw.away_score)
    || !Number.isInteger(raw.match_week)) {
    throw new Error(matchId + ' — estrutura de partida incompleta.');
  }

  let lastPeriod = 0;
  let shootout = false;
  const eventsById = new Map();
  const formation = {};
  for (const event of rawEvents) {
    if (!event.type?.name || !event.id || !Number.isInteger(event.period) || eventsById.has(event.id)) {
      throw new Error(matchId + ' — evento inválido ou duplicado.');
    }
    eventsById.set(event.id, event);
    if (event.period < 5) lastPeriod = Math.max(lastPeriod, event.period);
    if (event.period === 5) shootout = true;
    if (event.type.name === 'Starting XI') {
      const shape = event.tactics?.formation;
      formation[event.team.id] = shape ? String(shape).split('').join('-') : null;
    }
  }
  const duration = periodStarts[lastPeriod] + periodLengths[lastPeriod];
  if (duration !== 90 && duration !== 120) throw new Error(matchId + ' — duração inválida.');
  const players = [];
  const participants = new Map();
  for (const lineup of lineups) {
    const team = lineup.team_id === home.id ? home : away;
    if (team.id !== lineup.team_id || !Array.isArray(lineup.lineup)) throw new Error(matchId + ' — escalação inválida.');
    for (const player of lineup.lineup) {
      if (!Number.isInteger(player.player_id) || typeof player.player_name !== 'string' || participants.has(player.player_id)) {
        throw new Error(matchId + ' — atleta da escalação inválido ou duplicado.');
      }
      const country = player.country?.name;
      const row = participation(player, matchId, team.id, duration);
      participants.set(player.player_id, row);
      players.push({
        id: player.player_id, name: player.player_name, shortName: player.player_nickname || player.player_name,
        teamId: team.id, team: team.name, position: row.position, role: roleFor(0), shirt: row.shirt,
        birthDate: player.birth_date || player.date_of_birth || null, country: countries[country] || country || null,
      });
    }
  }

  let homePenalties = shootout ? 0 : null;
  let awayPenalties = shootout ? 0 : null;
  const events = [];
  const goals = [];
  for (const event of rawEvents) {
    const type = event.type.name;
    const goal = type === 'Shot' && event.shot?.outcome?.name === 'Goal';
    const teamId = event.team?.id;
    const playerId = event.player?.id;
    if (event.period === 5) {
      if (goal && teamId === home.id) homePenalties += 1;
      if (goal && teamId === away.id) awayPenalties += 1;
      continue;
    }
    const ownGoal = type === 'Own Goal For';
    if (goal || ownGoal) {
      const defendingEvent = ownGoal && event.related_events
        ?.map((id) => eventsById.get(id))
        .find((related) => related?.type?.name === 'Own Goal Against' && related.team?.id !== teamId);
      const scorerId = ownGoal ? defendingEvent?.player?.id : playerId;
      const creditedPlayerId = participants.has(scorerId) ? scorerId : null;
      goals.push({ id: event.id, matchId, teamId, playerId: creditedPlayerId, minute: event.minute,
        period: event.period, ownGoal: Number(ownGoal) });
    }
    const row = participants.get(playerId);
    if (!row?.played) continue;
    const { isTackle, data, outcome } = updateStats(row, event, eventsById);
    const label = isTackle ? 'Desarme' : types[type];
    const location = coordinates(event.location);
    if (!label || !location) continue;
    const end = coordinates(data?.end_location || event.goalkeeper?.end_location || event.clearance?.end_location);
    events.push({
      id: event.id, matchId, playerId, eventIndex: event.index, minute: event.minute, second: event.second,
      period: event.period, type: label, x: location[0], y: location[1],
      endX: end?.[0] ?? null, endY: end?.[1] ?? null,
      outcome: outcomes[outcome] || outcome || (type === 'Pass' ? 'Completo' : null),
      xg: type === 'Shot' ? shotXg(data) : null,
    });
  }
  const match = {
    id: matchId, date: raw.match_date, homeId: home.id, awayId: away.id,
    home: home.name, away: away.name, homeScore: raw.home_score, awayScore: raw.away_score,
    stage, round: raw.match_week,
    group: stage === 'Fase de grupos' && home.group === away.group ? home.group : null,
    homePenalties, awayPenalties, stadium: raw.stadium?.name?.trim() || null,
    homeFormation: formation[home.id] ?? null, awayFormation: formation[away.id] ?? null,
    sourceUpdated: raw.last_updated || null, coordinateVersion: raw.metadata?.xy_fidelity_version || null,
    shotVersion: raw.metadata?.shot_fidelity_version || null,
  };
  if (goals.filter((item) => item.teamId === home.id).length !== match.homeScore
    || goals.filter((item) => item.teamId === away.id).length !== match.awayScore) {
    throw new Error(matchId + ' — placar diverge da contagem de eventos de gol.');
  }
  return { match, teams: [home, away], players, appearances: [...participants.values()], events, goals };
}

export function combineTeams(results) {
  const teams = new Map();
  for (const { match, teams: matchTeams } of results) {
    for (const team of matchTeams) {
      if (!teams.has(team.id)) teams.set(team.id, { ...team, games: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 });
      const totals = teams.get(team.id);
      const isHome = team.id === match.homeId;
      const gf = isHome ? match.homeScore : match.awayScore;
      const ga = isHome ? match.awayScore : match.homeScore;
      totals.group ||= team.group;
      totals.games += 1;
      totals.gf += gf;
      totals.ga += ga;
      totals.wins += Number(gf > ga);
      totals.draws += Number(gf === ga);
      totals.losses += Number(gf < ga);
    }
  }
  if (teams.size !== 32) throw new Error('Foram encontradas ' + teams.size + ' seleções; esperadas 32.');
  for (const { match } of results) {
    if (match.stage !== 'Fase de grupos') continue;
    const home = teams.get(match.homeId);
    const away = teams.get(match.awayId);
    // An opponent in a group-stage match belongs to the same group as its opponent.
    home.group ||= away.group;
    away.group ||= home.group;
    match.group = home.group;
    if (!match.group || home.group !== away.group) throw new Error(match.id + ' — grupo inconsistente.');
  }
  const groupCounts = [...teams.values()].reduce((counts, team) => {
    counts[team.group] = (counts[team.group] || 0) + 1;
    return counts;
  }, {});
  if (Object.keys(groupCounts).length !== 8 || Object.values(groupCounts).some((count) => count !== 4)) {
    throw new Error('Grupos incompletos ou inconsistentes.');
  }
  return [...teams.values()];
}
