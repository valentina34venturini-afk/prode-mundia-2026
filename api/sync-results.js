import { createClient } from '@supabase/supabase-js';

const TEAM_MAP = {
  'Mexico':'México','South Africa':'Sudáfrica','Korea Republic':'Corea del Sur',
  'Czech Republic':'Chequia','Czechia':'Chequia','Canada':'Canadá',
  'Bosnia and Herzegovina':'Bosnia y Herzegovina','Qatar':'Catar','Switzerland':'Suiza',
  'Brazil':'Brasil','Morocco':'Marruecos','Haiti':'Haití','Scotland':'Escocia',
  'United States':'Estados Unidos','Paraguay':'Paraguay','Australia':'Australia',
  'Türkiye':'Turquía','Turkey':'Turquía','Germany':'Alemania','Curaçao':'Curazao',
  "Côte d'Ivoire":'Costa de Marfil','Ivory Coast':'Costa de Marfil','Ecuador':'Ecuador',
  'Netherlands':'Países Bajos','Japan':'Japón','Sweden':'Suecia','Tunisia':'Túnez',
  'Belgium':'Bélgica','Egypt':'Egipto','Iran':'Irán','New Zealand':'Nueva Zelanda',
  'Spain':'España','Cape Verde':'Cabo Verde','Saudi Arabia':'Arabia Saudita',
  'Uruguay':'Uruguay','France':'Francia','Senegal':'Senegal','Iraq':'Irak',
  'Norway':'Noruega','Argentina':'Argentina','Algeria':'Argelia','Austria':'Austria',
  'Jordan':'Jordania','Portugal':'Portugal','Congo DR':'RD Congo','DR Congo':'RD Congo',
  'Uzbekistan':'Uzbekistán','Colombia':'Colombia','England':'Inglaterra',
  'Croatia':'Croacia','Ghana':'Ghana','Panama':'Panamá',
};

const MATCHES = {
  'México|Sudáfrica':'g1','Corea del Sur|Chequia':'g2','Chequia|Sudáfrica':'g3',
  'México|Corea del Sur':'g4','México|Chequia':'g5','Corea del Sur|Sudáfrica':'g6',
  'Canadá|Bosnia y Herzegovina':'g7','Catar|Suiza':'g8','Suiza|Bosnia y Herzegovina':'g9',
  'Canadá|Catar':'g10','Canadá|Suiza':'g11','Bosnia y Herzegovina|Catar':'g12',
  'Brasil|Marruecos':'g13','Haití|Escocia':'g14','Escocia|Marruecos':'g15',
  'Brasil|Haití':'g16','Escocia|Brasil':'g17','Marruecos|Haití':'g18',
  'Estados Unidos|Paraguay':'g19','Australia|Turquía':'g20','Estados Unidos|Australia':'g21',
  'Turquía|Paraguay':'g22','Estados Unidos|Turquía':'g23','Paraguay|Australia':'g24',
  'Alemania|Curazao':'g25','Costa de Marfil|Ecuador':'g26','Alemania|Costa de Marfil':'g27',
  'Ecuador|Curazao':'g28','Ecuador|Alemania':'g29','Curazao|Costa de Marfil':'g30',
  'Países Bajos|Japón':'g31','Suecia|Túnez':'g32','Países Bajos|Suecia':'g33',
  'Túnez|Japón':'g34','Túnez|Países Bajos':'g35','Japón|Suecia':'g36',
  'Bélgica|Egipto':'g37','Irán|Nueva Zelanda':'g38','Bélgica|Irán':'g39',
  'Nueva Zelanda|Egipto':'g40','Nueva Zelanda|Bélgica':'g41','Egipto|Irán':'g42',
  'España|Cabo Verde':'g43','Arabia Saudita|Uruguay':'g44','España|Arabia Saudita':'g45',
  'Uruguay|Cabo Verde':'g46','Uruguay|España':'g47','Cabo Verde|Arabia Saudita':'g48',
  'Francia|Senegal':'g49','Irak|Noruega':'g50','Francia|Irak':'g51',
  'Noruega|Senegal':'g52','Noruega|Francia':'g53','Senegal|Irak':'g54',
  'Argentina|Argelia':'g55','Austria|Jordania':'g56','Argentina|Austria':'g57',
  'Jordania|Argelia':'g58','Jordania|Argentina':'g59','Argelia|Austria':'g60',
  'Portugal|RD Congo':'g61','Uzbekistán|Colombia':'g62','Portugal|Uzbekistán':'g63',
  'Colombia|RD Congo':'g64','Colombia|Portugal':'g65','RD Congo|Uzbekistán':'g66',
  'Inglaterra|Croacia':'g67','Ghana|Panamá':'g68','Inglaterra|Ghana':'g69',
  'Panamá|Croacia':'g70','Panamá|Inglaterra':'g71','Croacia|Ghana':'g72',
};

export default async function handler(req, res) {
  const secret = process.env.SYNC_SECRET;
  if (secret && req.headers['x-sync-secret'] !== secret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Falta FOOTBALL_DATA_API_KEY' });

  try {
    const response = await fetch(
      'https://api.football-data.org/v4/competitions/WC/matches?status=FINISHED',
      { headers: { 'X-Auth-Token': apiKey } }
    );
    if (!response.ok) return res.status(502).json({ error: await response.text() });

    const { matches = [] } = await response.json();
    if (!matches.length) return res.json({ synced: 0, message: 'Sin partidos terminados aún.' });

    const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const rows = [];

    for (const match of matches) {
      const score = match.score?.fullTime;
      if (!score || score.home === null) continue;
      const t1 = TEAM_MAP[match.homeTeam?.name] || match.homeTeam?.name;
      const t2 = TEAM_MAP[match.awayTeam?.name] || match.awayTeam?.name;
      const key = `${t1}|${t2}`;
      const keySwap = `${t2}|${t1}`;
      const matchId = MATCHES[key] || MATCHES[keySwap];
      if (!matchId) continue;
      const swapped = !MATCHES[key];
      rows.push({ match_id: matchId, goals_home: swapped ? score.away : score.home, goals_away: swapped ? score.home : score.away });
    }

    if (rows.length) {
      const { error } = await supabase.from('results').upsert(rows, { onConflict: 'match_id' });
      if (error) return res.status(500).json({ error: error.message });
    }

    return res.json({ synced: rows.length, total: matches.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
