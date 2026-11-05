/* Edital CAU-TO: acompanhamento de estudos.
   Tudo roda no navegador. O progresso fica salvo no localStorage
   (chave STORE_KEY) e pode ser exportado ou importado em Ajustes. */
(function () {
  "use strict";

  const STORE_KEY = "edital-cau-to:v1";
  const STATUS = {
    nao_iniciado: "Não iniciado",
    andamento: "Em andamento",
    concluido: "Concluído",
    revisao: "Revisão pendente"
  };
  const STUDIED = new Set(["concluido", "revisao"]);
  const DISC_COLOR = { pt: "--d-pt", mt: "--d-mt", in: "--d-in", lg: "--d-lg", es: "--d-es" };
  const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  const WEEKDAYS_LONG = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
  const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

  // ---------- dados do edital achatados ----------
  const TOPICS = [];
  const TOPIC = {};
  const DISCS = [];
  EDITAL.blocos.forEach(b => {
    b.disciplinas.forEach(d => {
      const disc = { id: d.id, nome: d.nome, ref: d.ref, bloco: b, topics: [] };
      DISCS.push(disc);
      d.grupos.forEach(g => {
        g.assuntos.forEach(a => {
          const t = { ...a, disc, grupo: g, videos: VIDEOS[a.id] || { aulas: [], questoes: [] } };
          TOPICS.push(t); TOPIC[t.id] = t; disc.topics.push(t);
        });
      });
    });
  });
  // Peso de cada assunto no percentual geral: itens da área ÷ disciplinas da área ÷ assuntos da disciplina.
  // Nos conhecimentos básicos o edital não divide os 40 itens entre as 3 disciplinas, então a divisão é igual.
  const TOTAL_ITENS = EDITAL.blocos.reduce((s, b) => s + b.itens, 0);
  DISCS.forEach(d => {
    const share = d.bloco.itens / d.bloco.disciplinas.length;
    d.weight = share / TOTAL_ITENS;
    d.topics.forEach(t => { t.weight = d.weight / d.topics.length; });
  });

  // ---------- datas ----------
  const pad = n => String(n).padStart(2, "0");
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
  const diffDays = (a, b) => Math.round((parse(b) - parse(a)) / 86400000);
  const todayISO = () => iso(new Date());
  const fmt = s => { const d = parse(s); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`; };
  const fmtLong = s => { const d = parse(s); return `${WEEKDAYS_LONG[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`; };
  const weekStart = s => { const d = parse(s); const wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd); return iso(d); };

  // ---------- estado ----------
  const DEFAULTS = () => ({
    v: 1,
    topics: {},        // id -> { status, studiedAt, updatedAt }
    revDone: {},       // id -> { "0": "2026-11-05", ... }
    watch: {},         // videoId -> { max, dur, last }
    firstPlanned: {},  // id -> primeira data em que o assunto foi agendado
    settings: {
      exam: EDITAL.prova,
      days: [1, 2, 3, 4, 5, 6],
      intervals: [1, 7, 15, 30],
      maxHard: 1,
      reserveDays: 2,
      basicFirst: true,       // básicas primeiro (Tiago, 05/11/2026: vestibular em 22/11)
      basicUntil: "2026-11-21"
    }
  });
  let state = load();
  function load() {
    let s = null;
    try { s = JSON.parse(localStorage.getItem(STORE_KEY) || "null"); } catch (e) { s = null; }
    const d = DEFAULTS();
    if (!s || typeof s !== "object") return d;
    return { ...d, ...s, settings: { ...d.settings, ...(s.settings || {}) } };
  }
  let saveTimer = null;
  function save(now) {
    clearTimeout(saveTimer);
    const write = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { toast("Não foi possível salvar neste navegador."); } };
    if (now) write(); else saveTimer = setTimeout(write, 400);
  }
  window.addEventListener("beforeunload", () => save(true));

  const statusOf = id => (state.topics[id] && state.topics[id].status) || "nao_iniciado";
  const studied = id => STUDIED.has(statusOf(id));

  function setStatus(id, status) {
    const prev = state.topics[id] || {};
    const rec = { ...prev, status, updatedAt: new Date().toISOString() };
    if (STUDIED.has(status)) {
      if (!prev.studiedAt) rec.studiedAt = todayISO();
    } else {
      delete rec.studiedAt;
      delete state.revDone[id];
    }
    state.topics[id] = rec;
    save();
    const msg = STUDIED.has(status) && !prev.studiedAt
      ? `Marcado como ${STATUS[status].toLowerCase()}. Revisões agendadas para ${state.settings.intervals.map(n => fmt(addDays(rec.studiedAt, n))).join(", ")}.`
      : `Status: ${STATUS[status]}.`;
    toast(msg);
    render();
  }
  function setStudiedDate(id, date) {
    if (!state.topics[id] || !date) return;
    state.topics[id].studiedAt = date; save(); render();
  }

  // ---------- vídeos ----------
  const entryKey = e => e.video || ("PL:" + e.playlist);
  function watchPct(e) {
    if (!e.video) return null;
    const w = state.watch[e.video];
    if (!w || !w.dur) return 0;
    return Math.min(100, Math.round((w.max / w.dur) * 100));
  }
  function topicWatch(t) {
    const vids = t.videos.aulas.filter(e => e.video);
    let seen = 0, total = 0;
    vids.forEach(e => { const w = state.watch[e.video]; if (w && w.dur) { seen += Math.min(w.max, w.dur); total += w.dur; } });
    const pls = t.videos.aulas.filter(e => e.playlist).map(e => state.watch["PL:" + e.playlist]).filter(Boolean);
    pls.forEach(w => { seen += w.seen || 0; total += w.total || 0; });
    if (!total) return 0;
    return Math.round((seen / total) * 100);
  }

  // ---------- revisões ----------
  function reviewsOf(t) {
    const rec = state.topics[t.id];
    if (!rec || !rec.studiedAt || !STUDIED.has(rec.status)) return [];
    const done = state.revDone[t.id] || {};
    return state.settings.intervals.map((n, i) => ({
      topic: t, i, n, due: addDays(rec.studiedAt, n), done: done[i] || null,
      video: t.videos.questoes.length ? t.videos.questoes[i % t.videos.questoes.length] : null,
      repeated: t.videos.questoes.length > 0 && i >= t.videos.questoes.length
    }));
  }
  const allReviews = () => TOPICS.flatMap(reviewsOf);
  function toggleReview(id, i) {
    const m = state.revDone[id] || (state.revDone[id] = {});
    if (m[i]) delete m[i]; else m[i] = todayISO();
    // Assunto marcado como "revisão pendente" volta a "concluído" quando não há revisão vencida em aberto.
    const t = TOPIC[id];
    if (statusOf(id) === "revisao" && !reviewsOf(t).some(r => !r.done && r.due <= todayISO())) {
      state.topics[id].status = "concluido";
    }
    save(); toast(m[i] ? `Revisão ${i + 1} concluída em ${fmt(m[i])}.` : `Revisão ${i + 1} reaberta.`); render();
  }

  // ---------- cronograma ----------
  function studyDays(from, to) {
    const out = [];
    for (let d = from; d <= to; d = addDays(d, 1)) if (state.settings.days.includes(parse(d).getDay())) out.push(d);
    return out;
  }
  // Ordem de estudo: começa pelo que está em andamento; depois intercala as disciplinas,
  // sempre puxando a que está mais atrasada em relação ao seu total, na ordem do edital.
  function studyOrder() {
    const queues = DISCS.map(d => ({ d, q: d.topics.filter(t => !studied(t.id)) }));
    const inProgress = TOPICS.filter(t => statusOf(t.id) === "andamento");
    const seq = [...inProgress];
    queues.forEach(x => { x.q = x.q.filter(t => !inProgress.includes(t)); x.done = x.d.topics.length - x.q.length; });
    while (queues.some(x => x.q.length)) {
      const x = queues.filter(x => x.q.length).sort((a, b) => (a.done / a.d.topics.length) - (b.done / b.d.topics.length) || b.q.length - a.q.length)[0];
      seq.push(x.q.shift()); x.done++;
    }
    return seq;
  }
  let planCache = null;
  function buildPlan() {
    const today = todayISO();
    const exam = state.settings.exam;
    const lastDay = addDays(exam, -1);
    let days = today <= lastDay ? studyDays(today, lastDay) : [];
    const reserve = Math.min(state.settings.reserveDays, Math.max(0, days.length - 1));
    const contentDays = days.length ? days.slice(0, days.length - reserve) : [today];
    const seq = studyOrder();
    // o que já foi estudado hoje ocupa as vagas de hoje, para não puxar assunto extra
    const doneToday = TOPICS.filter(t => studied(t.id) && state.topics[t.id].studiedAt === today);
    const perDay = Math.max(1, Math.ceil((seq.length + doneToday.length) / contentDays.length));
    const plan = {};
    const fill = (dayList, pool) => {
      dayList.forEach((day, di) => {
        if (!pool.length) return;
        const picked = [];
        const already = day === today ? doneToday.length : 0;
        // cota do dia: o que falta dividido pelos dias que restam, para espalhar por igual
        const quota = Math.ceil((pool.length + already) / (dayList.length - di));
        while (picked.length + already < quota && pool.length) {
          const hard = picked.filter(t => t.c === 3).length;
          let idx = pool.findIndex(t => (t.c < 3 || hard < state.settings.maxHard) && !picked.some(p => p.disc === t.disc));
          if (idx < 0) idx = pool.findIndex(t => t.c < 3 || hard < state.settings.maxHard);
          if (idx < 0) idx = 0;
          picked.push(pool.splice(idx, 1)[0]);
        }
        if (picked.length) plan[day] = picked;
      });
      if (pool.length && dayList.length) { const last = dayList[dayList.length - 1]; plan[last] = (plan[last] || []).concat(pool); }
    };
    // fase 1 opcional: só as matérias básicas até a data escolhida; depois, o restante
    const until = state.settings.basicFirst ? state.settings.basicUntil : "";
    const basics = seq.filter(t => t.disc.bloco.id === "B"), others = seq.filter(t => t.disc.bloco.id !== "B");
    const d1 = until ? contentDays.filter(d => d <= until) : [];
    const d2 = contentDays.filter(d => !d1.includes(d));
    const phase = d1.length && basics.length && d2.length ? { until, basics: basics.length } : null;
    if (d1.length && basics.length && d2.length) { fill(d1, basics); fill(d2, others); }
    else if (d1.length && basics.length) { fill(d1, basics.concat(others)); }
    else fill(contentDays, seq.slice());
    // guarda a primeira data planejada de cada assunto para mostrar quando foi reagendado
    let changed = false;
    Object.entries(plan).forEach(([day, list]) => list.forEach(t => {
      if (!state.firstPlanned[t.id]) { state.firstPlanned[t.id] = day; changed = true; }
    }));
    if (changed) save();
    const counts = Object.values(plan).map(l => l.length);
    const lo = counts.length ? Math.min(...counts) : 0, hi = counts.length ? Math.max(...counts) : 0;
    const perDayLabel = lo === hi ? String(hi) : `${lo} a ${hi}`;
    planCache = { plan, perDay, perDayLabel, phase, days, contentDays, reserveDays: days.slice(contentDays.length) };
    return planCache;
  }
  function dateOfTopic(id) {
    const p = planCache || buildPlan();
    for (const [d, list] of Object.entries(p.plan)) if (list.some(t => t.id === id)) return d;
    return null;
  }

  // ---------- progresso ----------
  function discStats(d) {
    const c = { total: d.topics.length, concluido: 0, andamento: 0, revisao: 0, nao_iniciado: 0 };
    d.topics.forEach(t => c[statusOf(t.id)]++);
    c.studied = c.concluido + c.revisao;
    c.pct = Math.round((c.studied / c.total) * 100);
    return c;
  }
  function overall() {
    const c = { total: TOPICS.length, concluido: 0, andamento: 0, revisao: 0, nao_iniciado: 0, weighted: 0 };
    TOPICS.forEach(t => { const s = statusOf(t.id); c[s]++; if (STUDIED.has(s)) c.weighted += t.weight; });
    c.studied = c.concluido + c.revisao;
    c.pending = c.total - c.studied;
    c.pct = Math.round(c.weighted * 1000) / 10;
    return c;
  }

  // ---------- utilidades de interface ----------
  const $ = (s, el = document) => el.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const dc = t => `--dc: var(${DISC_COLOR[t.disc.id]})`;
  const ICON_PLAY = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
  let toastTimer;
  function toast(msg) {
    const el = $("#toast"); el.textContent = msg; el.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 3600);
  }
  function statusSelect(t) {
    const s = statusOf(t.id);
    return `<select class="status-select" data-s="${s}" data-status="${t.id}" aria-label="Status de ${esc(t.n)}">${
      Object.entries(STATUS).map(([k, v]) => `<option value="${k}"${k === s ? " selected" : ""}>${v}</option>`).join("")}</select>`;
  }
  function videoCount(t) {
    const a = t.videos.aulas.length, q = t.videos.questoes.length;
    if (!a) return `<span class="notfound">Conteúdo não encontrado</span>`;
    return `${a} aula${a > 1 ? "s" : ""}${q ? ` · ${q} de questões` : ""}`;
  }

  // ---------- telas ----------
  const VIEWS = ["painel", "progresso", "edital", "cronograma", "revisoes", "ajustes"];
  function route() { const h = location.hash.replace("#", ""); return VIEWS.includes(h) ? h : "painel"; }
  const filters = { q: "", status: "", disc: "" };

  function render() {
    buildPlan();
    const r = route();
    document.querySelectorAll("[data-view]").forEach(s => { s.hidden = s.dataset.view !== r; });
    document.querySelectorAll("[data-route]").forEach(a => a.classList.toggle("active", a.dataset.route === r));
    const el = document.querySelector(`[data-view="${r}"]`);
    ({ painel: renderPainel, progresso: renderProgresso, edital: renderEdital, cronograma: renderCronograma, revisoes: renderRevisoes, ajustes: renderAjustes })[r](el);
    renderNav();
    if (openTopicId) renderSheet(openTopicId);
  }

  function renderNav() {
    const o = overall();
    $("#navPct").textContent = `${String(o.pct).replace(".", ",")}%`;
    $("#navBar").style.width = o.pct + "%";
    const left = diffDays(todayISO(), state.settings.exam);
    $("#countdown").innerHTML = left >= 0 ? `<b class="num">${left}</b> dias até a prova (${fmt(state.settings.exam)})` : `Prova em ${fmt(state.settings.exam)}`;
    const due = allReviews().filter(x => !x.done && x.due <= todayISO()).length;
    const c = $("#navRevCount"); c.hidden = !due; c.textContent = due;
  }

  function taskStudy(t, day) {
    const s = statusOf(t.id);
    const first = state.firstPlanned[t.id];
    const late = !studied(t.id) && first && first < todayISO() && day && first < day;
    const aula = t.videos.aulas[0];
    return `<div class="task${studied(t.id) ? " is-done" : ""}" style="${dc(t)}">
      <span class="stripe"></span>
      <div style="min-width:0">
        <div class="task-title" data-open="${t.id}">${esc(t.t)}</div>
        <div class="task-meta"><span class="chip disc" style="${dc(t)}">${esc(t.disc.nome)} ${esc(t.n)}</span>
          ${t.c === 3 ? '<span class="chip">assunto pesado</span>' : ""}
          ${late ? `<span class="chip late">reagendado (era ${fmt(first)})</span>` : ""}
          ${studied(t.id) && state.topics[t.id].studiedAt ? `<span class="chip ok">estudado em ${fmt(state.topics[t.id].studiedAt)}</span>` : ""}
          <span>${videoCount(t)}</span></div>
      </div>
      <div class="task-actions">
        ${aula ? `<button class="btn small" data-play="${t.id}" data-kind="aulas" data-idx="0">${ICON_PLAY} Assistir aula</button>` : ""}
        ${statusSelect(t)}
      </div></div>`;
  }
  function taskReview(r) {
    const t = r.topic;
    const late = !r.done && r.due < todayISO();
    return `<div class="task is-review${r.done ? " is-done" : ""}" style="${dc(t)}">
      <span class="stripe"></span>
      <div style="min-width:0">
        <div class="task-title" data-open="${t.id}">Revisão ${r.i + 1}: ${esc(t.t)}</div>
        <div class="task-meta"><span class="chip review">revisão ${r.i + 1} de ${state.settings.intervals.length} · ${r.n} dia${r.n > 1 ? "s" : ""} após o estudo</span>
          <span class="chip disc" style="${dc(t)}">${esc(t.disc.nome)} ${esc(t.n)}</span>
          ${late ? `<span class="chip late">atrasada desde ${fmt(r.due)}</span>` : ""}
          ${r.done ? `<span class="chip ok">feita em ${fmt(r.done)}</span>` : ""}
          ${r.video ? `<span>${r.repeated ? "vídeo de questões repetido" : "vídeo de questões"}</span>` : '<span class="notfound">Vídeo de questões não encontrado</span>'}</div>
      </div>
      <div class="task-actions">
        ${r.video ? `<button class="btn small review" data-play="${t.id}" data-kind="questoes" data-idx="${r.i % t.videos.questoes.length}">${ICON_PLAY} Questões</button>` : ""}
        <button class="btn small${r.done ? "" : " primary"}" data-review="${t.id}" data-i="${r.i}">${r.done ? "Reabrir" : "Concluir revisão"}</button>
      </div></div>`;
  }

  function renderPainel(el) {
    const o = overall();
    const today = todayISO();
    const p = planCache;
    const todayTopics = p.plan[today] || [];
    const nextDay = Object.keys(p.plan).sort().find(d => d >= today);
    const revs = allReviews();
    const revToday = revs.filter(r => !r.done && r.due === today);
    const revLate = revs.filter(r => !r.done && r.due < today).sort((a, b) => a.due.localeCompare(b.due));
    const doneToday = TOPICS.filter(t => studied(t.id) && state.topics[t.id].studiedAt === today && !todayTopics.includes(t));
    const studyList = todayTopics.length ? todayTopics : (nextDay ? p.plan[nextDay] : []);
    const studyLabel = todayTopics.length ? "Para estudar hoje" : (nextDay ? `Próximo dia de estudo: ${fmtLong(nextDay)}` : "Nada a estudar");
    el.innerHTML = `
      <div class="page-head"><div><h1>${fmtLong(today).replace(/^./, c => c.toUpperCase())}</h1></div></div>
      <div class="grid two even">
        <div class="card">
          <h2 class="section" style="margin-top:0">${studyLabel}</h2>
          ${studyList.length ? studyList.map(t => taskStudy(t, todayTopics.length ? today : nextDay)).join("") : '<div class="empty">Todos os assuntos do edital estão estudados.</div>'}
          ${doneToday.map(t => taskStudy(t, today)).join("")}
        </div>
        <div class="card">
          <h2 class="section" style="margin-top:0">Revisões de hoje</h2>
          ${revToday.length ? revToday.map(taskReview).join("") : '<div class="empty">Nenhuma revisão marcada para hoje.</div>'}
          ${revLate.length ? `<h2 class="section">Revisões atrasadas</h2>${revLate.map(taskReview).join("")}` : ""}
        </div>
      </div>`;
  }

  function renderProgresso(el) {
    const o = overall();
    const pctTxt = n => String(Math.round(n * 10) / 10).replace(".", ",");
    el.innerHTML = `
      <div class="page-head"><div><h1>Progresso</h1>
        <p>Percentual do edital concluído, no geral e por disciplina. Contam como concluídos os assuntos marcados como concluído ou revisão pendente.</p></div></div>
      <div class="grid kpis prog-kpis">
        <div class="card kpi big"><div class="k-label">Edital concluído</div><div class="k-value num">${pctTxt(o.pct)}%</div><div class="bar"><span style="width:${o.pct}%"></span></div><div class="k-sub">Ponderado pelos itens da prova: 40 básicos, 30 complementares e 50 específicos.</div></div>
        <div class="card kpi"><div class="k-label">Concluídos</div><div class="k-value num">${o.studied}<small> / ${o.total}</small></div></div>
        <div class="card kpi"><div class="k-label">Em andamento</div><div class="k-value num">${o.andamento}</div></div>
        <div class="card kpi"><div class="k-label">Não iniciados</div><div class="k-value num">${o.nao_iniciado}</div></div>
        <div class="card kpi"><div class="k-label">Revisão pendente</div><div class="k-value num">${o.revisao}</div></div>
      </div>
      ${EDITAL.blocos.map(b => {
        const ds = DISCS.filter(d => d.bloco === b);
        return `<h2 class="section">${esc(b.nome)} <span style="color:var(--muted);font-weight:400">· ${b.itens} itens na prova</span></h2>
        <div class="grid disc-cards">${ds.map(d => { const st = discStats(d); return `
          <div class="card disc-card" style="--dc: var(${DISC_COLOR[d.id]})">
            <div class="dc-top"><span class="dot"></span><h3>${esc(d.nome)}</h3></div>
            <div class="dc-pct num">${st.pct}%</div>
            <div class="bar"><span style="width:${st.pct}%"></span></div>
            <div class="counts"><span><b>${st.studied}</b> de ${st.total} concluídos</span><span><b>${st.andamento}</b> em andamento</span><span><b>${st.nao_iniciado}</b> não iniciados</span><span><b>${st.revisao}</b> com revisão pendente</span></div>
            <a class="btn small" href="#edital" data-filter-disc="${d.id}">Ver assuntos</a>
          </div>`; }).join("")}</div>`;
      }).join("")}`;
  }

  function renderEdital(el) {
    const q = filters.q.trim().toLowerCase();
    const match = t => (!filters.status || statusOf(t.id) === filters.status) && (!filters.disc || t.disc.id === filters.disc)
      && (!q || (t.t + " " + t.grupo.t + " " + t.n).toLowerCase().includes(q));
    const o = overall();
    el.innerHTML = `
      <div class="page-head"><div><h1>Edital verticalizado</h1>
        <p>${TOPICS.length} assuntos do item 18.2 do edital, na ordem e com o texto do edital. Marque o status de cada um; as revisões são criadas quando você marca como concluído.</p></div>
        <div class="chip ok">${o.studied} de ${o.total} concluídos</div></div>
      <div class="filters">
        <input type="search" id="fQ" placeholder="Buscar assunto" value="${esc(filters.q)}" aria-label="Buscar assunto">
        <select id="fDisc" aria-label="Disciplina"><option value="">Todas as disciplinas</option>${DISCS.map(d => `<option value="${d.id}"${filters.disc === d.id ? " selected" : ""}>${esc(d.nome)}</option>`).join("")}</select>
        <select id="fStatus" aria-label="Status"><option value="">Todos os status</option>${Object.entries(STATUS).map(([k, v]) => `<option value="${k}"${filters.status === k ? " selected" : ""}>${v}</option>`).join("")}</select>
      </div>
      ${EDITAL.blocos.map(b => {
        const discs = DISCS.filter(d => d.bloco === b);
        const body = discs.map(d => {
          const ts = d.topics.filter(match);
          if (!ts.length) return "";
          const s = discStats(d);
          let lastG = null;
          return `<div class="disc" style="--dc: var(${DISC_COLOR[d.id]})">
            <div class="disc-head"><div><h3>${esc(d.nome)}</h3><div class="meta">Item ${d.ref} · ${s.studied}/${s.total} concluídos · ${s.andamento} em andamento · ${s.nao_iniciado} não iniciados</div></div>
              <div class="pct num">${s.pct}%</div><div class="bar"><span style="width:${s.pct}%"></span></div></div>
            ${ts.map(t => {
              const g = t.grupo !== lastG ? `<div class="grp-title">${esc(t.grupo.n)} ${esc(t.grupo.t)}</div>` : "";
              lastG = t.grupo;
              const w = topicWatch(t);
              const rv = reviewsOf(t); const rvDone = rv.filter(r => r.done).length;
              const planned = !studied(t.id) ? dateOfTopic(t.id) : null;
              return `${g}<div class="topic st-${statusOf(t.id)}">
                <div class="tn">${esc(t.n)}</div>
                <div style="min-width:0"><div class="tt" data-open="${t.id}">${esc(t.t)}</div>
                  <div class="tinfo"><span>${videoCount(t)}</span>
                    ${t.videos.aulas.length ? `<span class="watch"><span class="bar"><span style="width:${w}%"></span></span>${w}% assistido</span>` : ""}
                    ${rv.length ? `<span class="chip review">revisões ${rvDone}/${rv.length}</span>` : ""}
                    ${planned ? `<span class="chip">previsto ${fmt(planned)}</span>` : ""}
                    ${studied(t.id) && state.topics[t.id].studiedAt ? `<span class="chip ok">estudado ${fmt(state.topics[t.id].studiedAt)}</span>` : ""}
                  </div></div>
                <div class="tright">${statusSelect(t)}${t.videos.aulas.length ? `<button class="btn small" data-play="${t.id}" data-kind="aulas" data-idx="0">${ICON_PLAY} Aula</button>` : ""}</div>
              </div>`;
            }).join("")}</div>`;
        }).join("");
        if (!body) return "";
        return `<div class="block"><div class="block-head"><h2>${esc(b.nome)}</h2><div class="meta">${b.itens} itens na prova · item ${b.ref}</div></div>${body}</div>`;
      }).join("") || '<div class="empty">Nenhum assunto com esses filtros.</div>'}`;
    const fq = $("#fQ", el);
    fq.addEventListener("input", e => { filters.q = e.target.value; const pos = e.target.selectionStart; renderEdital(el); const n = $("#fQ", el); n.focus(); n.setSelectionRange(pos, pos); });
    $("#fDisc", el).addEventListener("change", e => { filters.disc = e.target.value; renderEdital(el); });
    $("#fStatus", el).addEventListener("change", e => { filters.status = e.target.value; renderEdital(el); });
  }

  function renderCronograma(el) {
    const p = planCache;
    const today = todayISO();
    const exam = state.settings.exam;
    // dias a mostrar: do primeiro estudo registrado (ou hoje) até a prova
    const studiedDates = TOPICS.map(t => state.topics[t.id] && state.topics[t.id].studiedAt).filter(Boolean).sort();
    const start = studiedDates.length && studiedDates[0] < today ? studiedDates[0] : today;
    const revs = allReviews();
    const byDayRev = {};
    revs.forEach(r => { const d = r.done || r.due; (byDayRev[d] = byDayRev[d] || []).push(r); });
    const byDayDone = {};
    TOPICS.forEach(t => { const s = state.topics[t.id]; if (s && s.studiedAt && STUDIED.has(s.status)) (byDayDone[s.studiedAt] = byDayDone[s.studiedAt] || []).push(t); });
    const end = exam;
    const weeks = [];
    for (let d = start; d <= end; d = addDays(d, 1)) {
      const ws = weekStart(d);
      let w = weeks[weeks.length - 1];
      if (!w || w.start !== ws) { w = { start: ws, days: [] }; weeks.push(w); }
      const isStudy = state.settings.days.includes(parse(d).getDay());
      const study = (p.plan[d] || []);
      const done = (byDayDone[d] || []).filter(t => !study.includes(t));
      const rv = (byDayRev[d] || []).filter(r => d < today ? true : true);
      const lateHere = d === today ? revs.filter(r => !r.done && r.due < today) : [];
      if (!isStudy && !study.length && !done.length && !rv.length && d !== exam) continue;
      w.days.push({ d, study, done, rv, lateHere, isStudy });
    }
    const cw = weekStart(today);
    el.innerHTML = `
      <div class="page-head"><div><h1>Cronograma</h1>
        <p>Montado sozinho a partir dos assuntos que faltam: ${p.perDayLabel} por dia de estudo,${p.phase ? ` com Português, Raciocínio Lógico e Matemática e Informática primeiro, até ${fmt(p.phase.until)}, e as demais matérias depois,` : ""} no máximo ${state.settings.maxHard} assunto pesado por dia e disciplinas alternadas. Ele se refaz a cada mudança de status; o que você já concluiu fica registrado no dia em que foi estudado.</p></div>
        <a class="btn" href="#ajustes">Dias e intervalos</a></div>
      ${weeks.filter(w => w.days.length).map((w, i) => `
        <div class="week${w.start === cw ? " current" : ""}">
          <div class="week-head"><h2>Semana ${i + 1}</h2><span class="k-sub" style="color:var(--muted);font-size:13px">${fmt(w.start)} a ${fmt(addDays(w.start, 6))}</span></div>
          <div class="days">${w.days.map(x => {
            const cls = ["day", x.d === today ? "today" : "", x.d < today ? "past" : "", x.d === exam ? "exam" : ""].join(" ");
            const reserve = p.reserveDays.includes(x.d);
            const items = x.study.map(t => taskStudy(t, x.d)).join("") + x.done.map(t => taskStudy(t, x.d)).join("") + x.rv.map(taskReview).join("") + x.lateHere.map(taskReview).join("");
            return `<div class="${cls}"><div class="day-head"><b>${fmtLong(x.d)}</b><span>${x.d === today ? "hoje" : ""}${x.d === exam ? "prova objetiva, à tarde" : ""}${reserve ? "reservado para revisão geral" : ""}</span></div>
              ${items || `<div class="empty">${x.d === exam ? "Boa prova." : reserve ? "Sem assunto novo. Use para revisar o que estiver pendente." : "Sem tarefas."}</div>`}</div>`;
          }).join("")}</div>
        </div>`).join("")}`;
  }

  function renderRevisoes(el) {
    const today = todayISO();
    const revs = allReviews();
    const done = revs.filter(r => r.done).sort((a, b) => b.done.localeCompare(a.done));
    const todayR = revs.filter(r => !r.done && r.due === today);
    const late = revs.filter(r => !r.done && r.due < today).sort((a, b) => a.due.localeCompare(b.due));
    const next = revs.filter(r => !r.done && r.due > today).sort((a, b) => a.due.localeCompare(b.due));
    const dueSoFar = revs.filter(r => r.due <= today || r.done).length;
    const pct = dueSoFar ? Math.round((done.length / dueSoFar) * 100) : 0;
    el.innerHTML = `
      <div class="page-head"><div><h1>Revisões</h1>
        <p>Cada assunto concluído gera ${state.settings.intervals.length} revisões, ${state.settings.intervals.join(", ")} dias depois do estudo. Em cada revisão a plataforma indica um vídeo de resolução de questões daquele assunto.</p></div></div>
      <div class="grid kpis rev-kpis">
        <div class="card kpi today"><div class="k-label">Para hoje</div><div class="k-value num">${todayR.length}</div></div>
        <div class="card kpi late"><div class="k-label">Atrasadas</div><div class="k-value num">${late.length}</div></div>
        <div class="card kpi"><div class="k-label">Próximas</div><div class="k-value num">${next.length}</div></div>
        <div class="card kpi"><div class="k-label">Concluídas</div><div class="k-value num">${done.length}</div><div class="k-sub">${pct}% das que já venceram</div></div>
      </div>
      <h2 class="section">Hoje</h2><div class="card">${todayR.length ? todayR.map(taskReview).join("") : '<div class="empty">Nenhuma revisão para hoje.</div>'}</div>
      <h2 class="section">Atrasadas</h2><div class="card">${late.length ? late.map(taskReview).join("") : '<div class="empty">Nenhuma revisão atrasada.</div>'}</div>
      <h2 class="section">Próximas</h2><div class="card">${next.length ? next.slice(0, 40).map(r => taskReview(r).replace('<div class="task-meta">', `<div class="task-meta"><span class="chip">${fmt(r.due)}</span>`)).join("") : '<div class="empty">Conclua um assunto para gerar as revisões dele.</div>'}</div>
      <h2 class="section">Concluídas</h2><div class="card">${done.length ? done.map(taskReview).join("") : '<div class="empty">Nenhuma revisão concluída ainda.</div>'}</div>`;
  }

  function renderAjustes(el) {
    const s = state.settings;
    el.innerHTML = `
      <div class="page-head"><div><h1>Ajustes</h1><p>As mudanças refazem o cronograma e as revisões que ainda não foram feitas.</p></div></div>
      <div class="card"><div class="form-grid">
        <div class="field"><label for="sExam">Data da prova</label><input type="date" id="sExam" value="${s.exam}"><div class="hint">Edital: 13/12/2026, à tarde (data provável).</div></div>
        <div class="field"><label>Dias de estudo</label><div class="weekdays">${[1, 2, 3, 4, 5, 6, 0].map(d => `<label><input type="checkbox" data-wd="${d}"${s.days.includes(d) ? " checked" : ""}> ${WEEKDAYS[d]}</label>`).join("")}</div></div>
        <div class="field"><label>Intervalos das revisões (dias após o estudo)</label><div class="intervals">${s.intervals.map((n, i) => `<input type="number" min="1" max="120" value="${n}" data-int="${i}" aria-label="Revisão ${i + 1}">`).join("")}</div>
          <div class="hint">Padrão: 1, 7, 15 e 30 dias. <button class="btn small" id="addInt" type="button">Adicionar revisão</button> <button class="btn small" id="rmInt" type="button">Remover a última</button></div></div>
        <div class="field"><label for="sHard">Assuntos pesados por dia</label><input type="number" id="sHard" min="1" max="5" value="${s.maxHard}"><div class="hint">Assuntos marcados como pesados: sintaxe, concordância, regência, equações, contagem, probabilidade, proposições, planilhas, improbidade, processo administrativo, Lei 12.378, administração financeira, de pessoas e de materiais, e redação oficial.</div></div>
        <div class="field"><label for="sReserve">Dias livres antes da prova</label><input type="number" id="sReserve" min="0" max="10" value="${s.reserveDays}"><div class="hint">Últimos dias de estudo sem assunto novo, só para revisão.</div></div>
        <div class="field"><label><input type="checkbox" id="sBasicOn"${s.basicFirst ? " checked" : ""}> Matérias básicas primeiro, até</label><input type="date" id="sBasic" value="${s.basicUntil || ""}"${s.basicFirst ? "" : " disabled"}><div class="hint">Português, Raciocínio Lógico e Matemática e Informática ficam todas antes dessa data; as outras matérias vêm depois.</div></div>
      </div></div>
      <h2 class="section">Seu progresso</h2>
      <div class="card"><p style="margin-top:0">O progresso fica salvo neste navegador. Para levar para outro aparelho, exporte aqui e importe lá.</p>
        <div class="filters"><button class="btn" id="exp">Exportar progresso</button>
          <label class="btn" for="imp">Importar progresso</label><input type="file" id="imp" accept="application/json" hidden>
          <button class="btn" id="reset">Apagar todo o progresso</button></div>
        <div id="confirmReset" hidden style="margin-top:12px"><b>Apagar status, revisões e tempo assistido?</b> Isso não pode ser desfeito. <button class="btn small primary" id="resetYes">Apagar</button> <button class="btn small" id="resetNo">Cancelar</button></div>
      </div>
      <h2 class="section">Sobre o conteúdo</h2>
      <div class="card"><p style="margin-top:0">Assuntos copiados do ${esc(EDITAL.fonte)}. As aulas e os vídeos de questões são do YouTube, de canais de terceiros; a plataforma só organiza os links e usa o player oficial incorporado. Quando um vídeo não permite incorporação, aparece o botão para abrir no YouTube.</p>
      <p style="margin-bottom:0">Assuntos sem vídeo adequado aparecem como <span class="notfound">Conteúdo não encontrado</span>.</p></div>`;
    const commit = () => { save(); render(); toast("Ajustes salvos."); };
    $("#sExam", el).addEventListener("change", e => { if (e.target.value) { s.exam = e.target.value; commit(); } });
    el.querySelectorAll("[data-wd]").forEach(c => c.addEventListener("change", () => {
      const days = [...el.querySelectorAll("[data-wd]:checked")].map(x => Number(x.dataset.wd));
      if (!days.length) { toast("Escolha pelo menos um dia de estudo."); c.checked = true; return; }
      s.days = days; commit();
    }));
    el.querySelectorAll("[data-int]").forEach(inp => inp.addEventListener("change", () => {
      const vals = [...el.querySelectorAll("[data-int]")].map(x => Math.max(1, Math.round(Number(x.value) || 1)));
      s.intervals = vals; commit();
    }));
    $("#addInt", el).addEventListener("click", () => { s.intervals.push((s.intervals[s.intervals.length - 1] || 30) + 30); commit(); });
    $("#rmInt", el).addEventListener("click", () => { if (s.intervals.length > 1) { s.intervals.pop(); commit(); } });
    $("#sHard", el).addEventListener("change", e => { s.maxHard = Math.max(1, Number(e.target.value) || 1); commit(); });
    $("#sBasicOn", el).addEventListener("change", e => { s.basicFirst = e.target.checked; commit(); });
    $("#sBasic", el).addEventListener("change", e => { s.basicUntil = e.target.value; commit(); });
    $("#sReserve", el).addEventListener("change", e => { s.reserveDays = Math.max(0, Number(e.target.value) || 0); commit(); });
    $("#exp", el).addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(state, null, 1)], { type: "application/json" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `progresso-cau-to-${todayISO()}.json`; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    });
    $("#imp", el).addEventListener("change", e => {
      const f = e.target.files[0]; if (!f) return;
      f.text().then(txt => {
        const data = JSON.parse(txt);
        if (!data || typeof data !== "object" || !data.topics) throw new Error("arquivo inválido");
        const d = DEFAULTS(); state = { ...d, ...data, settings: { ...d.settings, ...(data.settings || {}) } }; save(true); render(); toast("Progresso importado.");
      }).catch(() => toast("Esse arquivo não é um progresso exportado pela plataforma."));
    });
    $("#reset", el).addEventListener("click", () => { $("#confirmReset", el).hidden = false; });
    $("#resetNo", el).addEventListener("click", () => { $("#confirmReset", el).hidden = true; });
    $("#resetYes", el).addEventListener("click", () => { state = DEFAULTS(); save(true); render(); toast("Progresso apagado."); });
  }

  // ---------- painel do assunto ----------
  let openTopicId = null;
  function openSheet(id) { openTopicId = id; renderSheet(id); $("#sheet").hidden = false; $("#sheetBackdrop").hidden = false; $("#sheet").focus(); }
  function closeSheet() { openTopicId = null; $("#sheet").hidden = true; $("#sheetBackdrop").hidden = true; }
  function vitem(t, kind, e, i, extra) {
    const w = watchPct(e);
    return `<button class="vitem" data-play="${t.id}" data-kind="${kind}" data-idx="${i}">
      <span class="vplay">${ICON_PLAY}</span>
      <span style="min-width:0"><span class="vt">${esc(e.titulo)}</span>
      <span class="vm">${e.playlist ? '<span class="chip">playlist</span>' : ""}${e.canal ? `<span>${esc(e.canal)}</span>` : ""}
        ${e.verificado ? '<span class="chip ok">link conferido</span>' : '<span class="chip">link não conferido</span>'}
        ${w !== null && w > 0 ? `<span>${w}% assistido</span>` : ""}${extra || ""}</span></span></button>`;
  }
  function renderSheet(id) {
    const t = TOPIC[id]; if (!t) return;
    const rv = reviewsOf(t);
    const rec = state.topics[id];
    const planned = !studied(id) ? dateOfTopic(id) : null;
    $("#sheet").innerHTML = `
      <div class="sheet-top"><span class="chip disc" style="${dc(t)}">${esc(t.disc.nome)}</span><button class="icon-btn" id="sheetClose" aria-label="Fechar"><svg viewBox="0 0 24 24"><path d="M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19l5.6-5.6 5.6 5.6 1.4-1.4-5.6-5.6L19 6.4 17.6 5 12 10.6z"/></svg></button></div>
      <h2 id="sheetTitle">${esc(t.grupo.n)} ${esc(t.grupo.t)}</h2>
      <div class="ref">${esc(t.disc.bloco.nome)} · item ${esc(t.disc.ref)}, subitem ${esc(t.n)}${planned ? ` · previsto para ${fmt(planned)}` : ""}</div>
      <div class="edital-text" style="${dc(t)}"><small>Texto do edital</small>${esc(t.n)} ${esc(t.t)}</div>
      <div class="filters"><b>Status</b> ${statusSelect(t)}
        ${rec && rec.studiedAt ? `<label style="font-size:13px">estudado em <input type="date" id="studiedAt" value="${rec.studiedAt}" style="border:1px solid var(--line);border-radius:6px;padding:3px 6px;background:var(--surface)"></label>` : ""}</div>
      <p style="font-size:13px;color:var(--muted)">Assistir ao vídeo não conclui o assunto. Mude o status quando terminar de estudar.</p>
      <h2 class="section">Aulas</h2>
      <div class="vlist">${t.videos.aulas.length ? t.videos.aulas.map((e, i) => vitem(t, "aulas", e, i)).join("") : '<div class="notfound">Conteúdo não encontrado</div>'}</div>
      <h2 class="section">Revisões e vídeos de questões</h2>
      ${rv.length ? `<div class="card">${rv.map(r => `<div class="rev-line"><div style="min-width:0"><b>Revisão ${r.i + 1}</b> · ${fmt(r.due)}${r.done ? ` · <span class="chip ok">feita em ${fmt(r.done)}</span>` : r.due < todayISO() ? ' · <span class="chip late">atrasada</span>' : ""}
          <div style="font-size:13px;color:var(--muted)">${r.video ? esc(r.video.titulo) + (r.repeated ? " (repetido)" : "") : '<span class="notfound">Vídeo de questões não encontrado</span>'}</div></div>
          <div class="task-actions">${r.video ? `<button class="btn small review" data-play="${t.id}" data-kind="questoes" data-idx="${r.i % t.videos.questoes.length}">${ICON_PLAY}</button>` : ""}<button class="btn small${r.done ? "" : " primary"}" data-review="${t.id}" data-i="${r.i}">${r.done ? "Reabrir" : "Concluir"}</button></div></div>`).join("")}</div>`
        : `<p class="empty">As revisões aparecem quando o assunto for marcado como concluído.</p>`}
      <div class="vlist" style="margin-top:10px">${t.videos.questoes.length ? t.videos.questoes.map((e, i) => vitem(t, "questoes", e, i, `<span class="chip review">revisão ${(state.settings.intervals.map((_, k) => k).filter(k => k % t.videos.questoes.length === i).map(k => k + 1).join(", ")) || "extra"}</span>`)).join("") : '<div class="notfound">Vídeo de resolução de questões não encontrado</div>'}</div>`;
    $("#sheetClose").addEventListener("click", closeSheet);
    const sd = $("#studiedAt"); if (sd) sd.addEventListener("change", e => setStudiedDate(id, e.target.value));
  }

  // ---------- mini player ----------
  const P = { sumOpen: window.innerWidth > 1300, yt: null, ready: false, apiFailed: false, queue: [], idx: 0, topic: null, kind: "aulas", expanded: false, timer: null, pending: null };
  window.onYouTubeIframeAPIReady = function () {
    P.yt = new YT.Player("ytPlayer", {
      host: "https://www.youtube-nocookie.com",
      playerVars: { rel: 0, modestbranding: 1, playsinline: 1, origin: location.origin },
      events: {
        onReady: () => { P.ready = true; if (P.pending) { const x = P.pending; P.pending = null; loadEntry(x); } },
        onStateChange: onState,
        onError: onError
      }
    });
  };
  function loadApi() {
    if (window.YT && window.YT.Player) return;
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    s.onerror = () => { P.apiFailed = true; showMsg("Não foi possível carregar o player do YouTube nesta rede."); };
    document.head.appendChild(s);
  }
  function play(topicId, kind, idx) {
    const t = TOPIC[topicId];
    const list = t.videos[kind];
    if (!list || !list[idx]) return;
    P.topic = t; P.kind = kind; P.queue = list; P.idx = idx;
    $("#player").hidden = false; $("#player").classList.remove("minimized");
    if (!window.YT || !window.YT.Player) loadApi();
    if (statusOf(t.id) === "nao_iniciado" && kind === "aulas") { state.topics[t.id] = { ...(state.topics[t.id] || {}), status: "andamento", updatedAt: new Date().toISOString() }; save(); render(); toast("Assunto marcado como em andamento."); }
    loadEntry(list[idx]);
    syncSum();
  }
  function loadEntry(e) {
    showMsg(null);
    updatePlayerUi();
    if (!P.ready) { P.pending = e; if (P.apiFailed) showMsg("Não foi possível carregar o player do YouTube nesta rede."); return; }
    if (e.playlist) {
      P.yt.loadPlaylist({ listType: "playlist", list: e.playlist, index: 0 });
    } else {
      const w = state.watch[e.video];
      const start = w && w.last && w.dur && w.last < w.dur - 15 ? Math.floor(w.last) : 0;
      P.yt.loadVideoById({ videoId: e.video, startSeconds: start });
    }
  }
  function currentVideoId() {
    try { const u = P.yt.getVideoUrl(); const m = u && u.match(/[?&]v=([\w-]{11})/); return m ? m[1] : null; } catch (e) { return null; }
  }
  function track() {
    if (!P.ready || !P.yt.getPlayerState || P.yt.getPlayerState() !== 1) return;
    const vid = currentVideoId(); if (!vid) return;
    const cur = P.yt.getCurrentTime(), dur = P.yt.getDuration();
    if (!dur) return;
    const w = state.watch[vid] || (state.watch[vid] = { max: 0, dur: 0, last: 0 });
    w.dur = dur; w.last = cur;
    if (cur > w.max && cur - w.max < 30) w.max = cur; // conta só o trecho assistido, não pulos para a frente
    else if (cur <= w.max) { /* revendo */ }
    const e = P.queue[P.idx];
    if (e && e.playlist) {
      const pl = state.watch["PL:" + e.playlist] || (state.watch["PL:" + e.playlist] = { videos: {} });
      pl.videos = pl.videos || {}; pl.videos[vid] = 1;
      const ids = Object.keys(pl.videos);
      pl.seen = ids.reduce((s, id) => s + Math.min((state.watch[id] || {}).max || 0, (state.watch[id] || {}).dur || 0), 0);
      let n = 0; try { n = (P.yt.getPlaylist() || []).length; } catch (x) { n = ids.length; }
      const avg = ids.reduce((s, id) => s + ((state.watch[id] || {}).dur || 0), 0) / Math.max(1, ids.length);
      pl.total = avg * Math.max(n, ids.length);
    }
    save();
    updateWatchBar();
  }
  function updateWatchBar() {
    const vid = P.ready ? currentVideoId() : null;
    const w = vid && state.watch[vid];
    $("#playerWatch").style.width = (w && w.dur ? Math.min(100, (w.max / w.dur) * 100) : 0) + "%";
  }
  function onState(ev) {
    const playing = ev.data === 1;
    $("#pPlayIcon").innerHTML = playing ? '<path d="M6 5h4v14H6zm8 0h4v14h-4z"/>' : '<path d="M8 5v14l11-7z"/>';
    clearInterval(P.timer);
    if (playing) P.timer = setInterval(track, 4000);
    if (ev.data === 0 || ev.data === 2) { track(); }
    if (ev.data === 0 && !(P.queue[P.idx] && P.queue[P.idx].playlist) && P.idx < P.queue.length - 1) { /* fim do vídeo: não avança sozinho */ }
    updatePlayerUi();
  }
  function onError(ev) {
    const e = P.queue[P.idx];
    const url = e ? ytUrl(e) : "#";
    const why = (ev.data === 101 || ev.data === 150) ? "O dono deste vídeo não permite que ele seja reproduzido fora do YouTube."
      : ev.data === 100 ? "Este vídeo foi removido ou ficou privado." : "O YouTube não conseguiu reproduzir este vídeo aqui.";
    showMsg(`${why}<br><a href="${url}" target="_blank" rel="noopener">Abrir no YouTube</a>`);
  }
  function showMsg(html) { const m = $("#playerMsg"); if (!html) { m.hidden = true; return; } m.innerHTML = html; m.hidden = false; }
  const ytUrl = e => e.playlist ? `https://www.youtube.com/playlist?list=${e.playlist}` : `https://www.youtube.com/watch?v=${e.video}`;
  // ---------- resumo do assunto, ao lado do mini player ----------
  function sumHtml(t) {
    const s = (window.RESUMOS || {})[t.id];
    if (!s) return "";
    const ul = a => `<ul>${a.map(x => `<li>${x}</li>`).join("")}</ul>`;
    return `<div class="sum-sec"><div class="sum-h">Pontos principais</div>${ul(s.r)}</div>
      <div class="sum-sec"><div class="sum-h">Como a Quadrix cobra</div>${ul(s.q)}</div>
      <p class="sum-note">Resumo de referência da plataforma, feito a partir do estilo de cobrança da Quadrix. Para legislação, confira sempre o texto da lei.</p>`;
  }
  function syncSum() {
    const box = $("#playerSum"), pl = $("#player"), t = P.topic;
    const has = !!(t && (window.RESUMOS || {})[t.id]);
    $("#pSum").hidden = !has;
    $("#pSum").setAttribute("aria-pressed", String(P.sumOpen));
    $("#pSum").classList.toggle("on", P.sumOpen);
    const show = has && P.sumOpen && !pl.hidden && !pl.classList.contains("minimized") && !P.expanded;
    if (has && box.dataset.topic !== t.id) {
      box.dataset.topic = t.id;
      $("#sumTopic").textContent = `Resumo · ${t.disc.nome} ${t.n}`;
      $("#sumTitle").textContent = t.t;
      $("#sumBody").innerHTML = sumHtml(t);
      $("#sumBody").scrollTop = 0;
    }
    box.hidden = !show;
    if (show) document.documentElement.style.setProperty("--player-h", pl.offsetHeight + "px");
  }
  window.addEventListener("resize", () => { if (!$("#playerSum").hidden) syncSum(); });

  function updatePlayerUi() {
    const e = P.queue[P.idx]; if (!e || !P.topic) return;
    $("#playerTopic").textContent = `${P.kind === "questoes" ? "Questões · " : ""}${P.topic.disc.nome} ${P.topic.n}`;
    let title = e.titulo;
    if (e.playlist && P.ready) { try { const i = P.yt.getPlaylistIndex(); const n = (P.yt.getPlaylist() || []).length; if (n) title += ` (vídeo ${i + 1} de ${n})`; } catch (x) { } }
    $("#playerTitle").textContent = title;
    $("#playerYT").href = ytUrl(e);
    const sh = sumHtml(P.topic);
    $("#playerQueue").innerHTML = (sh ? `<details class="sum-inline" open><summary>Resumo do assunto</summary><div class="sum-body">${sh}</div></details>` : "") + `<div class="grp-title"${sh ? "" : ' style="border-top:0"'}>${P.kind === "questoes" ? "Vídeos de questões" : "Aulas"} do assunto</div>` + P.queue.map((q, i) =>
      `<button class="q-item${i === P.idx ? " active" : ""}" data-q="${i}">${esc(q.titulo)}<small>${q.playlist ? "playlist · " : ""}${esc(q.canal || "")}</small></button>`).join("");
    updateWatchBar();
  }
  function step(dir) {
    const e = P.queue[P.idx];
    if (e && e.playlist && P.ready) {
      const i = P.yt.getPlaylistIndex(), n = (P.yt.getPlaylist() || []).length;
      if (dir > 0 && i < n - 1) { P.yt.nextVideo(); return; }
      if (dir < 0 && i > 0) { P.yt.previousVideo(); return; }
    }
    const ni = P.idx + dir;
    if (ni < 0 || ni >= P.queue.length) { toast(dir > 0 ? "Este é o último vídeo da lista." : "Este é o primeiro vídeo da lista."); return; }
    P.idx = ni; loadEntry(P.queue[ni]);
  }
  function setExpanded(on) {
    P.expanded = on;
    $("#player").classList.toggle("expanded", on);
    let bd = $("#playerBackdrop");
    if (on && !bd) { bd = document.createElement("div"); bd.id = "playerBackdrop"; bd.className = "player-backdrop"; bd.addEventListener("click", () => setExpanded(false)); document.body.appendChild(bd); }
    if (!on && bd) bd.remove();
    $("#pExpand").title = on ? "Reduzir" : "Ampliar";
    syncSum();
  }
  $("#pPlay").addEventListener("click", () => { if (!P.ready) return; const s = P.yt.getPlayerState(); if (s === 1) P.yt.pauseVideo(); else P.yt.playVideo(); });
  $("#pPrev").addEventListener("click", () => step(-1));
  $("#pNext").addEventListener("click", () => step(1));
  $("#pExpand").addEventListener("click", () => { $("#player").classList.remove("minimized"); setExpanded(!P.expanded); });
  $("#pMin").addEventListener("click", () => { setExpanded(false); $("#player").classList.toggle("minimized"); syncSum(); });
  $("#pSum").addEventListener("click", () => { P.sumOpen = !P.sumOpen; if (P.expanded) { const d = document.querySelector(".sum-inline"); if (d) d.open = true; } syncSum(); });
  $("#sumClose").addEventListener("click", () => { P.sumOpen = false; syncSum(); });
  $("#pClose").addEventListener("click", () => { track(); try { P.yt && P.yt.stopVideo(); } catch (e) { } setExpanded(false); $("#player").hidden = true; syncSum(); render(); });
  $("#playerQueue").addEventListener("click", ev => { const b = ev.target.closest("[data-q]"); if (b) { P.idx = Number(b.dataset.q); loadEntry(P.queue[P.idx]); } });

  // ---------- eventos globais ----------
  document.addEventListener("change", ev => {
    const s = ev.target.closest("[data-status]");
    if (s) setStatus(s.dataset.status, s.value);
  });
  document.addEventListener("click", ev => {
    const p = ev.target.closest("[data-play]");
    if (p) { play(p.dataset.play, p.dataset.kind, Number(p.dataset.idx)); return; }
    const o = ev.target.closest("[data-open]");
    if (o) { openSheet(o.dataset.open); return; }
    const f = ev.target.closest("[data-filter-disc]");
    if (f) { filters.disc = f.dataset.filterDisc; filters.status = ""; filters.q = ""; }
    const r = ev.target.closest("[data-review]");
    if (r) { toggleReview(r.dataset.review, Number(r.dataset.i)); return; }
  });
  $("#sheetBackdrop").addEventListener("click", closeSheet);
  document.addEventListener("keydown", ev => { if (ev.key === "Escape") { if (P.expanded) setExpanded(false); else if (openTopicId) closeSheet(); } });
  window.addEventListener("hashchange", () => { render(); window.scrollTo(0, 0); });
  // atualiza a tela quando o dia muda com a página aberta
  let lastDay = todayISO();
  setInterval(() => { if (todayISO() !== lastDay) { lastDay = todayISO(); render(); } }, 60000);

  // expõe funções puras para os testes
  window.__CAU = { TOPICS, DISCS, buildPlan: () => buildPlan(), overall, discStats, allReviews, setStatus, getState: () => state, studyOrder };
  render();
})();
