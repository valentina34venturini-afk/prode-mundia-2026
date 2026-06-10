import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from './lib/supabase';
import {
  signUpWithPassword, signInWithPassword, signOut, onAuthChange,
  getProfile, createProfile,
  getRoster, getPredictions, savePredictions, getAllPredictions,
  getResults, saveResult, deleteResult,
  getKnockouts, addKnockout,
  getPin, setPin,
} from './db';
import {
  GROUP_MATCHES, GROUPS, FLAGS, flag, computePoints,
  DOW, MON, fmtKO, isLocked,
  dateKeyOf, buildDates, dateLabel, etToday, defaultDate,
} from './data';

// =====================================================================
// PANTALLA DE AUTENTICACIÓN
// =====================================================================

function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handle = async () => {
    if (!email.includes('@') || password.length < 6) {
      setErr('Email válido y contraseña de al menos 6 caracteres.'); return;
    }
    setLoading(true); setErr('');
    if (isNew) {
      const { error } = await signUpWithPassword(email, password);
      if (error) setErr(error.message);
    } else {
      const { error } = await signInWithPassword(email, password);
      if (error?.message?.includes('Invalid login')) {
        setErr('Email o contraseña incorrectos.');
      } else if (error) setErr(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="auth-screen">
      <div className="card join">
        <div className="join-eyebrow">PRODE Mundial 2026</div>
        <h2>{isNew ? 'Crear cuenta' : 'Ingresar'}</h2>
        <p className="muted" style={{marginTop:6}}>
          {isNew ? 'Elegí una contraseña para tu cuenta.' : 'Ingresá con tu email y contraseña.'}
        </p>
        {err && <p className="err">{err}</p>}
        <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:14}}>
          <input type="email" value={email} placeholder="tu@email.com"
            onChange={e => setEmail(e.target.value)} />
          <input type="password" value={password} placeholder="Contraseña (mín. 6 caracteres)"
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handle()} />
        </div>
        <div className="join-row" style={{marginTop:10}}>
          <button className="btn-gold" style={{flex:1}} disabled={loading} onClick={handle}>
            {loading ? '…' : (isNew ? 'Crear cuenta' : 'Entrar')}
          </button>
        </div>
        <p className="hint" style={{textAlign:'center',marginTop:12}}>
          {isNew ? '¿Ya tenés cuenta?' : '¿Primera vez?'}{' '}
          <button className="btn-link" onClick={() => { setIsNew(o => !o); setErr(''); }}>
            {isNew ? 'Iniciá sesión' : 'Creá una cuenta'}
          </button>
        </p>
      </div>
    </div>
  );
};

  if (sent) return (
    <div className="auth-screen">
      <div className="card join">
        <div className="join-eyebrow">Revisá tu casilla</div>
        <h2>¡Te mandamos el link!</h2>
        <p className="muted" style={{ marginTop: 10, lineHeight: 1.6 }}>
          Abrí el email que te llegó de Supabase y hacé clic en
          <strong> "Confirm your signup"</strong>. Después volvé a esta página.
        </p>
      </div>
    </div>
  );

  return (
    <div className="auth-screen">
      <div className="card join">
        <div className="join-eyebrow">PRODE Mundial 2026</div>
        <h2>Ingresá con tu email</h2>
        <p className="muted" style={{ marginTop: 6, lineHeight: 1.5 }}>
          Te mandamos un <strong>link mágico</strong> al instante. Sin contraseña.
        </p>
        {err && <p className="err">{err}</p>}
        <div className="join-row">
          <input
            type="email" value={email} placeholder="tu@email.com"
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
          <button className="btn-gold" disabled={loading || !email.trim()} onClick={handleSubmit}>
            {loading ? '…' : 'Entrar'}
          </button>
        </div>
        <p className="hint">La primera vez te va a pedir que elijas un nombre para el PRODE.</p>
      </div>
    </div>
  );
}

// =====================================================================
// SETUP DE PERFIL (primera vez)
// =====================================================================

function SetupProfile({ userId, onDone }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async () => {
    const n = name.trim();
    if (!n) return;
    setLoading(true); setErr('');
    const { data, error } = await createProfile(userId, n);
    if (error) {
      setErr(error.code === '23505' ? 'Ese nombre ya lo usa alguien. Elegí otro.' : error.message);
    } else {
      onDone(data);
    }
    setLoading(false);
  };

  return (
    <div className="auth-screen">
      <div className="card join">
        <div className="join-eyebrow">Último paso</div>
        <h2>¿Cómo querés que te llamen?</h2>
        <p className="muted" style={{ marginTop: 6 }}>Este nombre va a aparecer en la tabla del PRODE.</p>
        {err && <p className="err">{err}</p>}
        <div className="join-row">
          <input
            value={name} placeholder="Tu nombre o apodo" maxLength={24}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
          <button className="btn-gold" disabled={loading || !name.trim()} onClick={handleSubmit}>
            {loading ? '…' : 'Listo'}
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// COMPONENTES DE NAVEGACIÓN (modo fecha / grupo)
// =====================================================================

function ModeToggle({ mode, setMode }) {
  return (
    <div className="modetog">
      <button className={mode === 'fecha' ? 'on' : ''} onClick={() => setMode('fecha')}>Por fecha</button>
      <button className={mode === 'grupo' ? 'on' : ''} onClick={() => setMode('grupo')}>Por grupo</button>
    </div>
  );
}

function Selector({ mode, dates, dsel, setDsel, gsel, setGsel, hasExtra, activeRef, results, allMatches }) {
  if (mode === 'grupo') return (
    <div className="grpbar">
      {GROUPS.map(g => (
        <button key={g} ref={gsel === g ? activeRef : null}
          className={'gtab' + (gsel === g ? ' on' : '')} onClick={() => setGsel(g)}>{g}</button>
      ))}
      {hasExtra && (
        <button ref={gsel === 'KO' ? activeRef : null}
          className={'gtab ko' + (gsel === 'KO' ? ' on' : '')} onClick={() => setGsel('KO')}>Elim.</button>
      )}
    </div>
  );

  const today = etToday();
  return (
    <div className="grpbar datebar">
      {dates.map(d => {
        if (d === 'elim') return (
          <button key="elim" ref={dsel === 'elim' ? activeRef : null}
            className={'dtab ko' + (dsel === 'elim' ? ' on' : '')} onClick={() => setDsel('elim')}>Elim.</button>
        );
        const ms = allMatches.filter(m => dateKeyOf(m.ko) === d);
        const done = ms.length > 0 && ms.every(m => results[m.id]);
        const isToday = d === today;
        const [y, mo, da] = d.split('-');
        return (
          <button key={d} ref={dsel === d ? activeRef : null}
            className={'dtab' + (dsel === d ? ' on' : '') + (done ? ' done' : '') + (isToday ? ' today' : '')}
            onClick={() => setDsel(d)}>
            <span className="dt-dow">{DOW[new Date(+y, +mo - 1, +da).getDay()]}</span>
            <span className="dt-day">{+da}</span>
            <span className="dt-mon">{isToday ? 'hoy' : MON[+mo - 1]}</span>
          </button>
        );
      })}
    </div>
  );
}

// =====================================================================
// PRONÓSTICOS
// =====================================================================

function Predictions({ me, allMatches, results }) {
  const [mode, setMode] = useState('fecha');
  const dates = useMemo(() => buildDates(allMatches), [allMatches]);
  const [dsel, setDsel] = useState(() => defaultDate(dates));
  const [gsel, setGsel] = useState('A');
  const [preds, setPreds] = useState({});
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadingMine, setLoadingMine] = useState(true);
  const activeRef = useRef(null);

  useEffect(() => { setDsel(d => dates.includes(d) ? d : defaultDate(dates)); }, [dates]);
  useEffect(() => { activeRef.current?.scrollIntoView({ inline: 'center', block: 'nearest' }); }, [dsel, gsel, mode]);

  useEffect(() => {
    let on = true;
    getPredictions(me.id).then(mine => { if (on) { setPreds(mine); setLoadingMine(false); } });
    return () => { on = false; };
  }, [me.id]);

  const hasExtra = dates.includes('elim') || allMatches.some(m => m.stage === 'ko');
  const view = mode === 'fecha'
    ? (dsel === 'elim' ? allMatches.filter(m => m.stage === 'ko' && !m.ko) : allMatches.filter(m => dateKeyOf(m.ko) === dsel))
    : (gsel === 'KO' ? allMatches.filter(m => m.stage === 'ko') : allMatches.filter(m => m.group === gsel));

  const setScore = (id, side, val) => {
    const v = val === '' ? '' : Math.max(0, Math.min(20, parseInt(val, 10) || 0));
    setPreds(p => ({ ...p, [id]: { ...(p[id] || {}), [side]: v } }));
    setDirty(true); setSaved(false);
  };

  const save = async () => {
    const clean = {};
    for (const m of allMatches) {
      const locked = isLocked(m.ko) || results[m.id];
      const p = preds[m.id];
      if (locked && p) { clean[m.id] = p; continue; }
      if (!locked && p && p.h !== '' && p.a !== '' && p.h !== undefined) {
        clean[m.id] = { h: Number(p.h), a: Number(p.a) };
      }
    }
    const err = await savePredictions(me.id, clean);
    if (!err) { setDirty(false); setSaved(true); setTimeout(() => setSaved(false), 2500); }
  };

  if (loadingMine) return <div className="muted center pad">Cargando tus pronósticos…</div>;

  return (
    <>
      <ModeToggle mode={mode} setMode={setMode} />
      <Selector mode={mode} dates={dates} dsel={dsel} setDsel={setDsel}
        gsel={gsel} setGsel={setGsel} hasExtra={hasExtra}
        activeRef={activeRef} results={results} allMatches={allMatches} />

      <div className="grphead">
        {mode === 'fecha'
          ? (dsel === 'elim' ? 'Eliminatorias' : 'Partidos del ' + dateLabel(dsel))
          : (gsel === 'KO' ? 'Eliminatorias' : 'Grupo ' + gsel)}
      </div>

      <div className="list">
        {view.length === 0 && (
          <div className="card empty">
            {mode === 'fecha' && dsel === 'elim'
              ? 'El organizador agrega los cruces desde "Resultados" cuando se conozcan.'
              : 'No hay partidos en esta sección.'}
          </div>
        )}
        {view.map(m => {
          const p = preds[m.id] || {};
          const res = results[m.id];
          const locked = isLocked(m.ko) || !!res;
          const pts = res ? computePoints(p, res) : null;
          return (
            <div className={'match' + (locked ? ' locked' : '')} key={m.id}>
              <div className="match-meta">
                <span className="badge-grp">{m.stage === 'ko' ? (m.label || 'Elim.') : 'Grupo ' + m.group}</span>
                <span className="ko-time">{fmtKO(m.ko)}</span>
              </div>
              <div className="match-row">
                <div className="team t-l"><span className="fl">{flag(m.t1)}</span><span className="tn">{m.t1}</span></div>
                <div className="score">
                  <input type="number" inputMode="numeric" min="0" max="20"
                    value={p.h ?? ''} disabled={locked}
                    onChange={e => setScore(m.id, 'h', e.target.value)} />
                  <span className="dash">–</span>
                  <input type="number" inputMode="numeric" min="0" max="20"
                    value={p.a ?? ''} disabled={locked}
                    onChange={e => setScore(m.id, 'a', e.target.value)} />
                </div>
                <div className="team t-r"><span className="tn">{m.t2}</span><span className="fl">{flag(m.t2)}</span></div>
              </div>
              <div className="match-foot">
                {res ? (
                  <><span className="final">Final {res.h}–{res.a}</span>{pts !== null && <span className={'stamp s' + pts}>+{pts}</span>}</>
                ) : locked ? (
                  <span className="closed">Cerrado · esperando resultado</span>
                ) : (
                  <span className="open">Abierto para pronosticar</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className={'savebar' + (dirty ? ' show' : '')}>
        <div className="savebar-in">
          <span>{saved ? '¡Guardado!' : 'Tenés cambios sin guardar'}</span>
          <button className="btn-gold" onClick={save}>Guardar pronósticos</button>
        </div>
      </div>
    </>
  );
}

// =====================================================================
// TABLA DE POSICIONES
// =====================================================================

function Standings({ me, results, allMatches, reload }) {
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState(false);

  const compute = useCallback(async () => {
    setBusy(true);
    const [roster, allPreds] = await Promise.all([getRoster(), getAllPredictions()]);

    // Agrupar pronósticos por usuario
    const predsByUser = {};
    for (const p of allPreds) {
      if (!predsByUser[p.user_id]) predsByUser[p.user_id] = {};
      predsByUser[p.user_id][p.match_id] = { h: p.goals_home, a: p.goals_away };
    }

    const out = roster.map(({ id, display_name }) => {
      const up = predsByUser[id] || {};
      let total = 0, ex = 0, win = 0, hit = 0, played = 0;
      for (const m of allMatches) {
        const res = results[m.id];
        if (!res) continue;
        const pts = computePoints(up[m.id], res);
        if (pts === null) continue;
        played++; total += pts;
        if (pts === 5) ex++; else if (pts === 3) win++; else if (pts === 1) hit++;
      }
      return { id, name: display_name, total, ex, win, hit, played };
    }).sort((a, b) => b.total - a.total || b.ex - a.ex || a.name.localeCompare(b.name));

    setRows(out); setBusy(false);
  }, [results, allMatches]);

  useEffect(() => { compute(); }, [compute]);

  const playedAny = useMemo(() => Object.keys(results || {}).length > 0, [results]);

  return (
    <>
      <div className="tabla-top">
        <h2>Tabla de posiciones</h2>
        <button className="btn-ghost" disabled={busy} onClick={async () => { await reload(); compute(); }}>
          {busy ? 'Actualizando…' : 'Actualizar'}
        </button>
      </div>

      {!playedAny && (
        <div className="card empty" style={{ marginBottom: 12 }}>
          Todavía no se cargó ningún resultado. Cuando el organizador cargue el primero, los puntos aparecen acá.
        </div>
      )}

      {rows && rows.length === 0 && (
        <div className="card empty">Nadie cargó pronósticos todavía. ¡Sé el primero!</div>
      )}

      {rows && rows.length > 0 && (
        <div className="board">
          <div className="board-h"><span>#</span><span>Jugador</span><span>PJ</span><span>5</span><span>3</span><span>1</span><span className="pt">Pts</span></div>
          {rows.map((r, i) => (
            <div key={r.id} className={'board-r' + (r.id === me.id ? ' mine' : '') + (i === 0 && r.total > 0 ? ' lead' : '')}>
              <span className="rk">{i + 1}</span>
              <span className="nm">{i === 0 && r.total > 0 ? '👑 ' : ''}{r.name}</span>
              <span>{r.played}</span><span>{r.ex}</span><span>{r.win}</span><span>{r.hit}</span>
              <span className="pt">{r.total}</span>
            </div>
          ))}
        </div>
      )}
      <p className="legend">PJ pronosticados · 5 exactos · 3 ganador · 1 marcador</p>
    </>
  );
}

// =====================================================================
// ADMIN: CARGAR RESULTADOS
// =====================================================================

function Admin({ allMatches, results, setResults, extra, setExtra }) {
  const [pin, setPin_] = useState('');
  const [stored, setStored] = useState(undefined);
  const [unlocked, setUnlocked] = useState(false);
  const [mode, setMode] = useState('fecha');
  const dates = useMemo(() => buildDates(allMatches), [allMatches]);
  const [dsel, setDsel] = useState(() => defaultDate(dates));
  const [gsel, setGsel] = useState('A');
  const [draft, setDraft] = useState({});
  const [toast, setToast] = useState('');
  const activeRef = useRef(null);

  useEffect(() => { getPin().then(p => setStored(p)); }, []);
  useEffect(() => { setDraft(results); }, [results]);
  useEffect(() => { setDsel(d => dates.includes(d) ? d : defaultDate(dates)); }, [dates]);
  useEffect(() => { activeRef.current?.scrollIntoView({ inline: 'center', block: 'nearest' }); }, [dsel, gsel, mode, unlocked]);

  const hasExtra = dates.includes('elim') || allMatches.some(m => m.stage === 'ko');
  const view = mode === 'fecha'
    ? (dsel === 'elim' ? allMatches.filter(m => m.stage === 'ko' && !m.ko) : allMatches.filter(m => dateKeyOf(m.ko) === dsel))
    : (gsel === 'KO' ? allMatches.filter(m => m.stage === 'ko') : allMatches.filter(m => m.group === gsel));

  const ping = t => { setToast(t); setTimeout(() => setToast(''), 2400); };
  const createPin_ = async () => {
    if (pin.trim().length < 3) { ping('El PIN tiene que tener al menos 3 caracteres.'); return; }
    await setPin(pin.trim()); setStored(pin.trim()); setUnlocked(true);
  };
  const tryUnlock = () => { if (pin === stored) setUnlocked(true); else ping('PIN incorrecto.'); };

  const setD = (id, side, val) => {
    const v = val === '' ? '' : Math.max(0, Math.min(20, parseInt(val, 10) || 0));
    setDraft(d => ({ ...d, [id]: { ...(d[id] || {}), [side]: v } }));
  };
  const handleSave = async id => {
    const d = draft[id];
    if (!d || d.h === '' || d.a === '' || d.h === undefined) { ping('Cargá los dos goles.'); return; }
    const err = await saveResult(id, Number(d.h), Number(d.a));
    if (err) { ping('Error al guardar: ' + err.message); return; }
    setResults(prev => ({ ...prev, [id]: { h: Number(d.h), a: Number(d.a) } }));
    ping('Resultado guardado ✓');
  };
  const handleDelete = async id => {
    await deleteResult(id);
    setResults(prev => { const n = { ...prev }; delete n[id]; return n; });
    setDraft(dd => { const c = { ...dd }; delete c[id]; return c; });
    ping('Resultado borrado.');
  };

  if (stored === undefined) return <div className="muted center pad">Cargando…</div>;

  if (!unlocked) return (
    <div className="card join">
      <div className="join-eyebrow">Panel del organizador</div>
      <h2>{stored ? 'Ingresá el PIN' : 'Creá un PIN'}</h2>
      <p className="muted" style={{ marginTop: 6, lineHeight: 1.5 }}>
        {stored
          ? 'Solo quien organiza el PRODE puede cargar los resultados reales.'
          : 'Primera vez acá. Elegí un PIN (mín. 3 caracteres) para proteger los resultados.'}
      </p>
      {toast && <p className="err">{toast}</p>}
      <div className="join-row">
        <input value={pin} placeholder="PIN" maxLength={20}
          onChange={e => setPin_(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (stored ? tryUnlock() : createPin_())} />
        <button className="btn-gold" onClick={stored ? tryUnlock : createPin_}>
          {stored ? 'Entrar' : 'Crear PIN'}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <ModeToggle mode={mode} setMode={setMode} />
      <Selector mode={mode} dates={dates} dsel={dsel} setDsel={setDsel}
        gsel={gsel} setGsel={setGsel} hasExtra={hasExtra}
        activeRef={activeRef} results={results} allMatches={allMatches} />
      <div className="grphead">
        {mode === 'fecha'
          ? (dsel === 'elim' ? 'Eliminatorias' : 'Resultados del ' + dateLabel(dsel))
          : (gsel === 'KO' ? 'Eliminatorias' : 'Grupo ' + gsel + ' · resultados')}
      </div>

      <div className="list">
        {view.length === 0 && <div className="card empty">No hay partidos en esta sección.</div>}
        {view.map(m => {
          const d = draft[m.id] || {};
          const has = !!results[m.id];
          return (
            <div className={'match' + (has ? ' done' : '')} key={m.id}>
              <div className="match-meta">
                <span className="badge-grp">{m.stage === 'ko' ? (m.label || 'Elim.') : 'Grupo ' + m.group}</span>
                <span className="ko-time">{fmtKO(m.ko)}</span>
              </div>
              <div className="match-row">
                <div className="team t-l"><span className="fl">{flag(m.t1)}</span><span className="tn">{m.t1}</span></div>
                <div className="score">
                  <input type="number" inputMode="numeric" min="0" max="20" value={d.h ?? ''}
                    onChange={e => setD(m.id, 'h', e.target.value)} />
                  <span className="dash">–</span>
                  <input type="number" inputMode="numeric" min="0" max="20" value={d.a ?? ''}
                    onChange={e => setD(m.id, 'a', e.target.value)} />
                </div>
                <div className="team t-r"><span className="tn">{m.t2}</span><span className="fl">{flag(m.t2)}</span></div>
              </div>
              <div className="match-foot admin-foot">
                <button className="btn-gold sm" onClick={() => handleSave(m.id)}>{has ? 'Actualizar' : 'Guardar resultado'}</button>
                {has && <button className="btn-ghost sm" onClick={() => handleDelete(m.id)}>Borrar</button>}
              </div>
            </div>
          );
        })}
      </div>

      <AddKnockout extra={extra} setExtra={setExtra}
        onAdd={lbl => { setMode('grupo'); setGsel('KO'); ping('Agregaste: ' + lbl); }} />

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

// =====================================================================
// AGREGAR PARTIDO DE ELIMINATORIA
// =====================================================================

function AddKnockout({ extra, setExtra, onAdd }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [t1, setT1] = useState('');
  const [t2, setT2] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const teamList = Object.keys(FLAGS);

  const add = async () => {
    if (!t1 || !t2 || t1 === t2) return;
    const ko = date ? `${date}T${time || '16:00'}:00-04:00` : '';
    const m = { id: 'k' + Date.now(), stage: 'ko', label: label.trim() || 'Eliminatoria', t1, t2, ko };
    const err = await addKnockout(m);
    if (err) { alert('Error al agregar: ' + err.message); return; }
    setExtra(prev => [...prev, m]);
    setLabel(''); setT1(''); setT2(''); setDate(''); setTime(''); setOpen(false);
    onAdd(m.label);
  };

  return (
    <div className="card addko">
      <button className="addko-toggle" onClick={() => setOpen(o => !o)}>
        {open ? '▾ ' : '▸ '} Agregar partido de eliminatoria
      </button>
      {open && (
        <div className="addko-form">
          <label>Etapa
            <input value={label} placeholder="Ej: Octavos 1, Cuartos A, Semifinal" onChange={e => setLabel(e.target.value)} />
          </label>
          <div className="addko-2">
            <label>Equipo 1
              <select value={t1} onChange={e => setT1(e.target.value)}>
                <option value="">Elegir…</option>
                {teamList.map(t => <option key={t} value={t}>{flag(t)} {t}</option>)}
              </select>
            </label>
            <label>Equipo 2
              <select value={t2} onChange={e => setT2(e.target.value)}>
                <option value="">Elegir…</option>
                {teamList.map(t => <option key={t} value={t}>{flag(t)} {t}</option>)}
              </select>
            </label>
          </div>
          <div className="addko-2">
            <label>Fecha <input type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
            <label>Hora (ET) <input type="time" value={time} onChange={e => setTime(e.target.value)} /></label>
          </div>
          <button className="btn-gold" disabled={!t1 || !t2 || t1 === t2} onClick={add}>Agregar</button>
          {extra.length > 0 && <p className="hint">{extra.length} partido(s) de eliminatoria cargado(s).</p>}
        </div>
      )}
    </div>
  );
}

// =====================================================================
// APP ROOT
// =====================================================================

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = cargando
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState('pred');
  const [results, setResults] = useState({});
  const [extra, setExtra] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Inicializar sesión
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const sub = onAuthChange(s => {
      setSession(s);
      if (!s) { setProfile(null); setLoaded(false); }
    });
    return () => sub.unsubscribe();
  }, []);

  // Cargar perfil cuando hay sesión
  useEffect(() => {
    if (!session) return;
    getProfile(session.user.id).then(p => setProfile(p));
  }, [session]);

  const reload = useCallback(async () => {
    const [res, ex] = await Promise.all([getResults(), getKnockouts()]);
    setResults(res); setExtra(ex); setLoaded(true);
  }, []);

  useEffect(() => { if (profile) reload(); }, [profile, reload]);

  const allMatches = useMemo(() => [...GROUP_MATCHES, ...extra], [extra]);

  // --- Estados de carga ---
  if (session === undefined) return (
    <div className="prode-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <p className="muted">Cargando…</p>
    </div>
  );
  if (!session) return <div className="prode-root"><AuthScreen /></div>;
  if (!profile) return <div className="prode-root"><SetupProfile userId={session.user.id} onDone={p => setProfile(p)} /></div>;

  // --- App principal ---
  return (
    <div className="prode-root">
      <header className="hd">
        <div className="hd-in">
          <div className="hd-mark">
            <span className="ball">★</span>
            <div>
              <h1>PRODE Mundial 2026</h1>
              <p>Cargá tus pronósticos y mirá la tabla en vivo</p>
            </div>
          </div>
          <button className="who" onClick={signOut} title="Cerrar sesión">
            <span className="who-dot" />
            {profile.display_name}
            <span className="who-x">salir</span>
          </button>
        </div>
      </header>

      <nav className="tabs">
        <button className={tab === 'pred' ? 'on' : ''} onClick={() => setTab('pred')}>Pronósticos</button>
        <button className={tab === 'tabla' ? 'on' : ''} onClick={() => { setTab('tabla'); reload(); }}>Tabla</button>
        <button className={tab === 'admin' ? 'on' : ''} onClick={() => { setTab('admin'); reload(); }}>Resultados</button>
      </nav>

      <main className="wrap">
        {!loaded && <div className="muted center pad">Cargando el PRODE…</div>}
        {loaded && tab === 'pred' && (
          <Predictions me={profile} allMatches={allMatches} results={results} />
        )}
        {loaded && tab === 'tabla' && (
          <Standings me={profile} results={results} allMatches={allMatches} reload={reload} />
        )}
        {loaded && tab === 'admin' && (
          <Admin allMatches={allMatches} results={results} setResults={setResults}
            extra={extra} setExtra={setExtra} />
        )}
      </main>

      <footer className="ft">
        <p>Puntaje: <b>5</b> exacto o empate acertado · <b>3</b> ganador · <b>1</b> un marcador · <b>0</b> nada</p>
        <p style={{ marginTop: 4 }}>
          <button className="btn-link" onClick={signOut}>Cerrar sesión</button>
        </p>
      </footer>
    </div>
  );
}
