'use strict';
const AREAS = {
bureau:   { label: 'Бюро',         color: 'var(--bureau)' },
aparts:   { label: 'Апарты',       color: 'var(--aparts)' },
personal: { label: 'Личный бренд', color: 'var(--personal)' },
body:     { label: 'Тело',         color: 'var(--body-c)' },
content:  { label: 'Контент',      color: 'var(--content-c)' },
home:     { label: 'Среда',        color: 'var(--home-c)' },
life:     { label: 'Яркость',      color: 'var(--life-c)' },
finance:  { label: 'Финансы',      color: 'var(--finance-c)' },
};
const DAYS_RU  = ['вс','пн','вт','ср','чт','пт','сб'];
const MONTHS   = ['января','февраля','марта','апреля','мая','июня',
'июля','августа','сентября','октября','ноября','декабря'];
const MONTHS_S = ['янв','фев','мар','апр','май','июн',
'июл','авг','сен','окт','ноя','дек'];
const MODULES_DEF = [
{ id:'body',      label:'Тело',       sub:'Сон, вес, вода, шаги, симптомы',        defaultOn: true },
{ id:'nutrition', label:'Питание',    sub:'КБЖУ, приёмы пищи',                     defaultOn: false },
{ id:'home',      label:'Среда / FlyLady', sub:'Зоны уборки, рутины',              defaultOn: true },
{ id:'sport',     label:'Спорт',      sub:'Тренировки, нагрузка, прогресс',         defaultOn: false },
{ id:'learning',  label:'Обучение',   sub:'Курсы, книги, навыки',                   defaultOn: false },
{ id:'hobbies',   label:'Хобби',      sub:'Проекты, время на себя',                 defaultOn: false },
{ id:'people',    label:'Люди',       sub:'Дни рождения, подарки, общение',         defaultOn: false },
{ id:'travel',    label:'Путешествия',sub:'Планирование поездок',                   defaultOn: false },
{ id:'medicine',  label:'Медицина',   sub:'Врачи, анализы, лекарства',              defaultOn: false },
{ id:'car',       label:'Машина',     sub:'ТО, страховки, расходы',                 defaultOn: false },
{ id:'docs',      label:'Документы',  sub:'Паспорта, визы, сроки',                  defaultOn: false },
{ id:'life',      label:'Яркость жизни', sub:'Путешествия, культура, радость',      defaultOn: false },
];
const STORE_KEY = 'mms';
function defaultData() {
const mods = {};
MODULES_DEF.forEach(m => { mods[m.id] = { enabled: m.defaultOn, data: {} }; });
return {
meta: { version: 1, created: dateStr(new Date()) },
goals:        [],
habits:       [],
days:         {},
calendar:     [],
people:       [],
transactions: [],
posts:        [],
ideas:        [],
shoots:       [],
modules:      mods,
};
}
let D = (() => {
try {
const s = localStorage.getItem(STORE_KEY);
if (!s) return defaultData();
const d = JSON.parse(s);
MODULES_DEF.forEach(m => {
if (!d.modules) d.modules = {};
if (!d.modules[m.id]) d.modules[m.id] = { enabled: m.defaultOn, data: {} };
});
['goals','habits','calendar','people','transactions','posts','ideas']
.forEach(k => { if (!Array.isArray(d[k])) d[k] = []; });
if (!d.days) d.days = {};
return d;
} catch(e) { return defaultData(); }
})();
let _saveTimer = null;
function save() {
clearTimeout(_saveTimer);
_saveTimer = setTimeout(() => {
localStorage.setItem(STORE_KEY, JSON.stringify(D));
}, 400);
}
function saveNow() {
clearTimeout(_saveTimer);
localStorage.setItem(STORE_KEY, JSON.stringify(D));
}
function dateStr(d) {
return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function parseDate(s) {
if (!s) return null;
const d = new Date(s + 'T00:00:00');
return isNaN(d) ? null : d;
}
function today() {
const d = new Date();
d.setHours(0,0,0,0);
return d;
}
function daysDiff(a, b) {
return Math.round((b - a) / 86400000);
}
function fmtDate(d) {
if (!d) return '';
return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
function fmtShort(d) {
if (!d) return '';
return `${d.getDate()} ${MONTHS_S[d.getMonth()]}`;
}
function getDayRec(ds) {
if (!D.days[ds]) D.days[ds] = {
steps: {}, habits: {},
energy: 0, mood: 0,
note: '',
morning_done: false,
evening_done: false,
};
return D.days[ds];
}
let activeDate = today();
function navDay(delta) {
const nd = new Date(activeDate);
nd.setDate(nd.getDate() + delta);
if (nd > today()) return;
activeDate = nd;
renderToday();
}
function isToday(d) {
const t = today();
return d.getDate()===t.getDate() && d.getMonth()===t.getMonth() && d.getFullYear()===t.getFullYear();
}
function uid() {
return Date.now().toString(36) + Math.random().toString(36).slice(2,6);
}
function toast(msg, dur=1800) {
const el = document.getElementById('toast');
el.textContent = msg;
el.classList.add('show');
setTimeout(() => el.classList.remove('show'), dur);
}
function modEnabled(id) {
return D.modules[id]?.enabled === true;
}
function nav(name, el) {
document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
document.querySelectorAll('.tn-tab').forEach(t => t.classList.remove('active'));
document.getElementById('view-'+name).classList.add('active');
if (el) el.classList.add('active');
if (name === 'today')    renderToday();
if (name === 'goals')    { renderGoals(); }
if (name === 'progress') { renderProgress(); }
if (name === 'calendar') { renderCalendar(); }
if (name === 'finance')  { renderFinance(); }
if (name === 'content')  { renderContent(); }
if (name === 'life')     { renderLife(); }
if (name === 'home')     { renderHome(); }
if (name === 'settings') renderSettings();
}
function renderToday() {
const ds   = dateStr(activeDate);
const rec  = getDayRec(ds);
const diff = daysDiff(today(), activeDate);
const DNAMES = ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];
document.getElementById('tdLabel').textContent =
`${DNAMES[activeDate.getDay()]}, ${activeDate.getDate()} ${MONTHS[activeDate.getMonth()]}`;
let sub = '';
if (diff === 0)       sub = 'сегодня';
else if (diff === -1) sub = 'вчера';
else if (diff === -2) sub = 'позавчера';
else if (diff < 0)   sub = `${Math.abs(diff)} дн. назад`;
document.getElementById('tdSub').textContent = sub;
document.getElementById('btnNextDay').disabled = (diff >= 0);
renderSteps(ds, rec);
renderHabits(ds, rec);
renderEM('energyRow', rec.energy, 'energy', ds);
renderEM('moodRow',   rec.mood,   'mood',   ds);
document.getElementById('dayNote').value = rec.note || '';
updateScore(rec);
document.getElementById('btnCloseDay').style.display  = rec.evening_done ? 'none' : '';
document.getElementById('dayClosedBadge').style.display = rec.evening_done ? '' : 'none';
document.getElementById('sideBody').style.display      = modEnabled('body')      ? '' : 'none';
document.getElementById('sideNutrition').style.display = modEnabled('nutrition') ? '' : 'none';
document.getElementById('sideHome').style.display      = modEnabled('home')      ? '' : 'none';
if (modEnabled('body'))      fillBodyFields(ds);
if (modEnabled('nutrition')) fillNutFields(ds);
if (modEnabled('home'))      renderHomeZone(ds);
renderCalToday(ds);
}
function getTodaySteps(ds) {
const result = [];
const d = parseDate(ds);
D.goals.forEach(g => {
if (g.done) return;
g.steps.forEach(s => {
if (s.done) return;
if (!s.date) return;
const sd = parseDate(s.date);
if (!sd) return;
const diff = daysDiff(sd, d);
if (s.date === ds || (diff > 0 && diff <= 7)) {
result.push({
id: s.id, goalId: g.id, text: s.text,
area: g.area, date: s.date,
done: !!(D.days[ds]?.steps?.[s.id]),
overdue: s.date !== ds,
source: 'goal',
});
}
});
});
const rec = getDayRec(ds);
(rec.quickSteps || []).forEach(qs => {
result.push({
id: qs.id, goalId: null, text: qs.text,
area: null, date: ds,
done: !!(rec.steps[qs.id]),
overdue: false,
source: 'quick',
});
});
return result;
}
function renderSteps(ds, rec) {
const steps = getTodaySteps(ds);
const el = document.getElementById('stepsList');
if (!steps.length) {
el.innerHTML = '<div class="empty">Шагов нет. Добавь цели или быстрый шаг.</div>';
return;
}
el.innerHTML = '';
steps.forEach(s => {
const row = document.createElement('div');
row.className = `cr${s.done ? ' done' : ''}${s.area ? ' bc-'+s.area : ''}`;
row.onclick = () => toggleStep(ds, s);
const areaLabel = s.area ? `<span class="cr-meta ac-${s.area}">${AREAS[s.area]?.label||s.area}</span>` : '';
const overdueLabel = s.overdue ? `<span class="cr-meta" style="color:var(--red);">просрочен</span>` : '';
row.innerHTML = `
<div class="cr-box">${s.done ? '+' : ''}</div>
<div class="cr-txt">${s.text}</div>
${areaLabel}${overdueLabel}
${s.source==='quick' ? `<span class="cr-del" onclick="event.stopPropagation();deleteQuickStep('${ds}','${s.id}')">x</span>` : ''}
`;
el.appendChild(row);
});
}
function toggleStep(ds, s) {
const rec = getDayRec(ds);
const newVal = !rec.steps[s.id];
rec.steps[s.id] = newVal;
if (s.goalId) {
const g = D.goals.find(x => x.id === s.goalId);
if (g) {
const gs = g.steps.find(x => x.id === s.id);
if (gs) {
gs.done = newVal;
gs.doneDate = newVal ? ds : null;
}
}
}
save();
renderSteps(ds, rec);
updateScore(rec);
}
function quickAddStep() {
const inp = document.getElementById('quickStepInp');
const text = inp.value.trim();
if (!text) return;
const ds = dateStr(activeDate);
const rec = getDayRec(ds);
if (!rec.quickSteps) rec.quickSteps = [];
const id = uid();
rec.quickSteps.push({ id, text });
inp.value = '';
save();
renderSteps(ds, rec);
updateScore(rec);
}
function deleteQuickStep(ds, id) {
const rec = getDayRec(ds);
rec.quickSteps = (rec.quickSteps||[]).filter(s => s.id !== id);
delete rec.steps[id];
save();
renderSteps(ds, rec);
updateScore(rec);
}
function renderHabits(ds, rec) {
const el = document.getElementById('habitsList');
const d  = parseDate(ds);
const dow = d.getDay();
const active = D.habits.filter(h => {
if (h.archived) return false;
if (h.frequency === 'daily') return true;
if (h.frequency === 'weekdays') return dow >= 1 && dow <= 5;
if (h.frequency === 'weekly') return dow === 1;
return true;
});
if (!active.length) {
el.innerHTML = '<div class="empty">Привычек нет. Добавь в разделе Цели.</div>';
return;
}
el.innerHTML = '';
active.forEach(h => {
const done = !!(rec.habits[h.id]);
const row = document.createElement('div');
row.className = `cr${done ? ' done' : ''}${h.area ? ' bc-'+h.area : ''}`;
row.onclick = () => toggleHabit(ds, h.id);
row.innerHTML = `
<div class="cr-box">${done ? '+' : ''}</div>
<div class="cr-txt">${h.name}</div>
${h.area ? `<span class="cr-meta ac-${h.area}">${AREAS[h.area]?.label||h.area}</span>` : ''}
`;
el.appendChild(row);
});
}
function toggleHabit(ds, hid) {
const rec = getDayRec(ds);
rec.habits[hid] = !rec.habits[hid];
save();
renderHabits(ds, rec);
updateScore(rec);
}
function renderEM(rowId, val, field, ds) {
const el = document.getElementById(rowId);
el.innerHTML = '';
for (let i = 1; i <= 5; i++) {
const dot = document.createElement('div');
dot.className = `em-dot${val === i ? ' on' : ''}`;
dot.textContent = i;
dot.onclick = () => {
const rec = getDayRec(ds);
rec[field] = (rec[field] === i) ? 0 : i;
save();
renderEM(rowId, rec[field], field, ds);
};
el.appendChild(dot);
}
}
function updateScore(rec) {
const ds = dateStr(activeDate);
const steps  = getTodaySteps(ds);
const habits = D.habits.filter(h => !h.archived);
const totalSteps  = steps.length;
const doneSteps   = steps.filter(s => s.done).length;
const totalHabits = habits.length;
const doneHabits  = habits.filter(h => rec.habits[h.id]).length;
const total = totalSteps + totalHabits;
const done  = doneSteps + doneHabits;
const pct   = total > 0 ? Math.round(done / total * 100) : 0;
document.getElementById('scoreNum').textContent = pct + '%';
const circ = 2 * Math.PI * 18;
const offset = circ - (pct / 100) * circ;
document.getElementById('ringFill').setAttribute('stroke-dashoffset', offset.toFixed(1));
}
function saveNote() {
const ds  = dateStr(activeDate);
const rec = getDayRec(ds);
rec.note  = document.getElementById('dayNote').value;
save();
}
function closeDay() {
const ds  = dateStr(activeDate);
const rec = getDayRec(ds);
rec.evening_done = true;
save();
document.getElementById('btnCloseDay').style.display    = 'none';
document.getElementById('dayClosedBadge').style.display = '';
toast('День закрыт. Молодец!');
}
function fillBodyFields(ds) {
const bod = D.modules.body.data[ds] || {};
document.getElementById('bodySleep').value   = bod.sleep   || '';
document.getElementById('bodyWeight').value  = bod.weight  || '';
document.getElementById('bodyWater').value   = bod.water   || '';
document.getElementById('bodySteps').value   = bod.steps   || '';
document.getElementById('bodySymptoms').value= bod.symptoms|| '';
}
function saveBodyField(field, val) {
const ds = dateStr(activeDate);
if (!D.modules.body.data[ds]) D.modules.body.data[ds] = {};
D.modules.body.data[ds][field] = val;
save();
}
function fillNutFields(ds) {
const nut = D.modules.nutrition.data[ds] || {};
document.getElementById('nutKkal').value   = nut.kkal    || '';
document.getElementById('nutProtein').value= nut.protein || '';
document.getElementById('nutFat').value    = nut.fat     || '';
document.getElementById('nutCarb').value   = nut.carb    || '';
}
function saveNutField(field, val) {
const ds = dateStr(activeDate);
if (!D.modules.nutrition.data[ds]) D.modules.nutrition.data[ds] = {};
D.modules.nutrition.data[ds][field] = val;
save();
}
const FLYLADY_ZONES = [
'Прихожая и коридор',
'Кухня',
'Детская / кабинет',
'Спальня и ванная',
'Гостиная',
];
function renderHomeZone(ds) {
const d    = parseDate(ds);
const week = Math.floor((d.getDate() - 1) / 7);
const zone = FLYLADY_ZONES[week % FLYLADY_ZONES.length];
document.getElementById('homeZoneToday').textContent = zone;
}
function renderCalToday(ds) {
const el   = document.getElementById('calTodayList');
const evts = D.calendar.filter(e => e.date === ds);
const bdays = getBirthdaysSoon(ds, 2);
if (!evts.length && !bdays.length) {
el.innerHTML = '<div class="empty">Событий нет</div>';
return;
}
el.innerHTML = '';
bdays.forEach(b => {
const d = document.createElement('div');
d.style.cssText = 'font-size:12px;color:var(--gold);padding:3px 0;';
d.textContent = b.label;
el.appendChild(d);
});
evts.forEach(e => {
const d = document.createElement('div');
d.style.cssText = 'font-size:12px;color:var(--dim);padding:3px 0;border-bottom:1px solid var(--border);';
d.textContent = `${e.time ? e.time + ' ' : ''}${e.title}`;
el.appendChild(d);
});
}
function getBirthdaysSoon(ds, days) {
if (!modEnabled('people')) return [];
const result = [];
const d = parseDate(ds);
D.people.forEach(p => {
if (!p.birthday) return;
const [bm, bd] = p.birthday.split('-').map(Number);
for (let i = 0; i <= days; i++) {
const check = new Date(d);
check.setDate(d.getDate() + i);
if (check.getMonth()+1 === bm && check.getDate() === bd) {
result.push({ label: i === 0 ? `ДР: ${p.name}` : `Завтра ДР: ${p.name}`, daysLeft: i });
}
}
});
return result;
}
function renderSettings() {
const el = document.getElementById('modulesList');
el.innerHTML = '';
MODULES_DEF.forEach(m => {
const enabled = modEnabled(m.id);
const row = document.createElement('div');
row.style.cssText = 'display:flex;align-items:center;gap:14px;padding:10px 0;border-bottom:1px solid var(--border);';
row.innerHTML = `
<div style="flex:1;">
<div style="font-size:13px;color:var(--dim);">${m.label}</div>
<div style="font-size:11px;color:var(--muted);margin-top:2px;">${m.sub}</div>
</div>
<button onclick="toggleModule('${m.id}',this)"
style="padding:6px 14px;border-radius:20px;font-family:var(--font-m);font-size:10px;letter-spacing:2px;cursor:pointer;transition:all .15s;
background:${enabled ? 'var(--green-dim)' : 'transparent'};
border:1px solid ${enabled ? 'var(--green)' : 'var(--border)'};
color:${enabled ? 'var(--green)' : 'var(--muted)'};">
${enabled ? 'Включён' : 'Выкл.'}
</button>
`;
el.appendChild(row);
});
const key = localStorage.getItem('mms_api_key') || '';
document.getElementById('apiKeyInp').value = key ? '••••••••••••' : '';
}
function toggleModule(id, btn) {
D.modules[id].enabled = !D.modules[id].enabled;
save();
const on = D.modules[id].enabled;
btn.textContent = on ? 'Включён' : 'Выкл.';
btn.style.background    = on ? 'var(--green-dim)' : 'transparent';
btn.style.borderColor   = on ? 'var(--green)' : 'var(--border)';
btn.style.color         = on ? 'var(--green)' : 'var(--muted)';
toast(on ? `${id} включён` : `${id} выключен`);
}
function saveApiKey() {
const val = document.getElementById('apiKeyInp').value.trim();
if (!val || val.startsWith('•')) { toast('Введи ключ'); return; }
localStorage.setItem('mms_api_key', val);
document.getElementById('apiKeyInp').value = '••••••••••••';
toast('Ключ сохранён');
}
function clearApiKey() {
localStorage.removeItem('mms_api_key');
document.getElementById('apiKeyInp').value = '';
toast('Ключ удалён');
}
function getApiKey() {
return localStorage.getItem('mms_api_key') || '';
}
function exportData() {
const json = JSON.stringify(D, null, 2);
const blob = new Blob([json], { type: 'application/json' });
const a    = document.createElement('a');
a.href     = URL.createObjectURL(blob);
a.download = `mms_backup_${dateStr(new Date())}.json`;
a.click();
}
function importData(e) {
const file = e.target.files[0];
if (!file) return;
const reader = new FileReader();
reader.onload = ev => {
try {
const imported = JSON.parse(ev.target.result);
if (!imported.meta || !imported.goals) throw new Error('bad format');
D = imported;
saveNow();
renderToday();
toast('Данные импортированы');
} catch(err) {
toast('Ошибка импорта: ' + err.message);
}
};
reader.readAsText(file);
}
function resetAll() {
if (!confirm('Удалить ВСЕ данные? Это нельзя отменить.')) return;
D = defaultData();
saveNow();
renderToday();
toast('Данные сброшены');
}
migrateCc2Weeks();
renderToday();
renderSettings();
let _detailGoalId = null;
let _editingGoalId = null;
let _msRows = [];
let _stepCtx = { goalId: null, msId: null };
function renderGoals() {
const el = document.getElementById('goalsList');
if (!el) return;
el.innerHTML = '';
const active = D.goals.filter(g => !g.done);
const done   = D.goals.filter(g =>  g.done);
if (!active.length && !done.length) {
el.innerHTML = '<div class="empty" style="padding:24px 0;">Целей пока нет. Нажми «+ Новая цель» и задай первую.</div>';
return;
}
const now = today();
function renderCard(g) {
const end  = parseDate(g.deadline);
const lag  = calcLag(g);
const color = (AREAS[g.area]?.color) || 'var(--gold)';
const dLeft = end ? daysDiff(now, end) : null;
const card = document.createElement('div');
card.style.cssText = `background:var(--surface);border-radius:var(--r);padding:16px 18px;margin-bottom:8px;cursor:pointer;border-left:3px solid ${color};transition:background .15s;`;
card.onmouseenter = () => card.style.background = 'var(--surface2)';
card.onmouseleave = () => card.style.background = 'var(--surface)';
card.onclick = () => openGoalDetail(g.id);
const pctDone = lag ? lag.pctDone : 0;
const pctTime = lag ? lag.pctTime : 0;
const behind  = lag ? lag.behind  : false;
card.innerHTML = `
<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:8px;">
<div>
<div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:${color};margin-bottom:3px;">${AREAS[g.area]?.label||g.area}</div>
<div style="font-family:var(--font-s);font-size:18px;font-weight:300;color:var(--text);">${g.title}</div>
</div>
<div style="display:flex;gap:6px;flex-shrink:0;">
<button onclick="event.stopPropagation();openGoalForm('${g.id}')" style="background:none;border:none;color:var(--muted);font-size:11px;cursor:pointer;padding:3px 6px;font-family:var(--font-m);transition:color .15s;" onmouseover="this.style.color='var(--gold)'" onmouseout="this.style.color='var(--muted)'">ред.</button>
<button onclick="event.stopPropagation();deleteGoal('${g.id}')" style="background:none;border:none;color:var(--muted);font-size:14px;cursor:pointer;padding:3px 4px;transition:color .15s;" onmouseover="this.style.color='var(--red)'" onmouseout="this.style.color='var(--muted)'">x</button>
</div>
</div>
<div class="prog-bar">
<div class="prog-fill" style="width:${pctDone}%;background:${behind?'var(--red)':color};"></div>
</div>
<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-top:4px;">
<span style="${behind?'color:var(--red);':''}">Сделано: ${pctDone}%${behind?' — отстаёшь на '+lag.lagDays+' дн.':''}</span>
<span>${end?(dLeft>0?dLeft+' дн. осталось':dLeft===0?'сегодня дедлайн':'просрочено на '+Math.abs(dLeft)+' дн.'):'без дедлайна'}</span>
</div>
${g.milestones?.length ? `<div style="font-size:10px;color:var(--muted);margin-top:4px;">${g.milestones.filter(m=>m.done).length}/${g.milestones.length} вех</div>` : ''}
`;
el.appendChild(card);
}
if (active.length) {
active.forEach(renderCard);
}
if (done.length) {
const lbl = document.createElement('div');
lbl.style.cssText = 'font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--faint);margin:16px 0 8px;';
lbl.textContent = 'Выполненные';
el.appendChild(lbl);
done.forEach(renderCard);
}
}
function calcLag(g) {
const end = parseDate(g.deadline);
if (!end || !g.steps?.length) return null;
const now = today();
const start = parseDate(g.created) || new Date(end.getTime() - 180*86400000);
const totalDays = Math.max(1, daysDiff(start, end));
const elapsed   = Math.max(0, daysDiff(start, now));
const pctTime   = Math.min(100, Math.round(elapsed / totalDays * 100));
const pctDone   = Math.round(g.steps.filter(s=>s.done).length / g.steps.length * 100);
const lag       = pctTime - pctDone;
const lagDays   = Math.round(lag / 100 * totalDays);
return { pctDone, pctTime, lagDays, behind: lag > 8 };
}
function openGoalDetail(id) {
_detailGoalId = id;
document.getElementById('goalsMain').style.display  = 'none';
document.getElementById('goalDetail').style.display = '';
renderGoalDetail(id);
}
function closeGoalDetail() {
_detailGoalId = null;
document.getElementById('goalDetail').style.display  = 'none';
document.getElementById('goalsMain').style.display   = '';
renderGoals();
}
function renderGoalDetail(id) {
const g = D.goals.find(x => x.id === id);
if (!g) return;
const color = AREAS[g.area]?.color || 'var(--gold)';
document.getElementById('gdTitle').textContent = g.title;
document.getElementById('gdTitle').style.color = color;
const lag = calcLag(g);
const end = parseDate(g.deadline);
const dLeft = end ? daysDiff(today(), end) : null;
const side = document.getElementById('gdSide');
side.innerHTML = `
<div style="margin-bottom:16px;">
<div class="sec-label">Прогресс</div>
<div class="prog-bar" style="height:5px;">
<div class="prog-fill" style="width:${lag?lag.pctDone:0}%;background:${lag?.behind?'var(--red)':color};"></div>
</div>
<div style="font-size:12px;color:var(--muted);margin-top:5px;">Сделано ${lag?lag.pctDone:0}% · Время ${lag?lag.pctTime:0}%</div>
${lag?.behind ? `
<div style="font-size:11px;color:var(--red);margin-top:8px;margin-bottom:8px;">Отставание: ${lag.lagDays} дн.</div>
<div style="display:flex;flex-direction:column;gap:6px;">
<button class="btn btn-gold btn-sm" style="justify-content:center;" onclick="strategyPush('${id}')">Поднажать — успеть</button>
<button class="btn btn-sm" style="justify-content:center;" onclick="strategyExtend('${id}')">Перенести срок</button>
</div>` : ''}
</div>
<div style="margin-bottom:16px;">
<div class="sec-label">Дедлайн</div>
<div style="font-size:13px;color:var(--dim);">${end ? fmtDate(end) : '—'}</div>
${dLeft !== null ? `<div style="font-size:11px;color:var(--muted);margin-top:2px;">${dLeft>0?dLeft+' дн.':dLeft===0?'сегодня':'просрочено'}</div>` : ''}
</div>
${g.measure ? `<div style="margin-bottom:16px;"><div class="sec-label">Критерий</div><div style="font-size:12px;color:var(--dim);line-height:1.5;">${g.measure}</div></div>` : ''}
<div>
<div class="sec-label">Привычки цели</div>
<div id="gdHabits"></div>
<button class="btn btn-sm" style="margin-top:6px;width:100%;justify-content:center;" onclick="openHabitForm('${id}')">+ Привычка</button>
</div>
`;
const gh = D.habits.filter(h => h.goalId === id && !h.archived);
const gdh = document.getElementById('gdHabits');
if (gdh) {
gdh.innerHTML = gh.length ? '' : '<div class="empty">Нет</div>';
gh.forEach(h => {
const d2 = document.createElement('div');
d2.style.cssText = 'display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border);';
d2.innerHTML = `<span style="flex:1;font-size:12px;color:var(--dim);">${h.name}</span>
<span style="font-size:10px;color:var(--muted);">${h.frequency==='daily'?'ежедн.':h.frequency==='weekdays'?'пн-пт':'раз в нед.'}</span>
<button onclick="archiveHabit('${h.id}')" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:12px;" onmouseover="this.style.color='var(--red)'" onmouseout="this.style.color='var(--muted)'">x</button>`;
gdh.appendChild(d2);
});
}
const ms_el = document.getElementById('gdMilestones');
ms_el.innerHTML = '';
const msMap = {};
(g.steps||[]).forEach(s => {
const k = s.msId || '_free';
if (!msMap[k]) msMap[k] = [];
msMap[k].push(s);
});
const now2 = today();
function renderMsBlock(ms, steps) {
const msEnd = ms ? parseDate(ms.deadline) : null;
const overdue = msEnd && !ms?.done && msEnd < now2;
const block = document.createElement('div');
block.style.cssText = 'border-bottom:1px solid var(--border);';
const hdr = document.createElement('div');
hdr.style.cssText = 'display:flex;align-items:center;gap:10px;padding:12px 20px;cursor:pointer;';
if (ms) {
hdr.innerHTML = `
<div onclick="toggleMilestone('${id}','${ms.id}')" style="width:16px;height:16px;border-radius:50%;border:1px solid ${ms.done?'var(--green)':'var(--border)'};background:${ms.done?'var(--green-dim)':'transparent'};display:flex;align-items:center;justify-content:center;font-size:10px;color:${ms.done?'var(--green)':'transparent'};cursor:pointer;flex-shrink:0;">+</div>
<div style="flex:1;" onclick="toggleMilestone('${id}','${ms.id}')">
<div style="font-size:14px;color:var(--dim);${ms.done?'text-decoration:line-through;opacity:.5;':''}">${ms.title}</div>
${msEnd ? `<div style="font-size:10px;color:${overdue?'var(--red)':'var(--muted)'};">${fmtDate(msEnd)}${overdue?' — просрочена':''}</div>` : ''}
</div>
<div style="font-size:10px;color:var(--muted);">${steps.filter(s=>s.done).length}/${steps.length}</div>
<button onclick="openStepForm('${id}','${ms.id}')" class="btn btn-sm">+ Шаг</button>
`;
} else {
hdr.innerHTML = `<div style="flex:1;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);">Без вехи</div>
<button onclick="openStepForm('${id}',null)" class="btn btn-sm">+ Шаг</button>`;
}
block.appendChild(hdr);
const qa = document.createElement('div');
qa.className = 'add-inline';
qa.style.cssText = 'padding:0 20px 10px;';
const msIdVal = ms ? ms.id : 'null';
qa.innerHTML = `
<input placeholder="Быстрый шаг..." id="qa_${msIdVal}" onkeydown="if(event.key==='Enter')quickGoalStep('${id}','${msIdVal==='null'?'':ms?.id||''}',this.value,this)">
<button onclick="quickGoalStep('${id}','${ms?.id||''}',document.getElementById('qa_${msIdVal}').value,document.getElementById('qa_${msIdVal}'))">+</button>
`;
const stepsList = document.createElement('div');
stepsList.style.cssText = 'padding:0 20px;';
steps.sort((a,b) => (a.date||'zzz').localeCompare(b.date||'zzz')).forEach(s => {
const sd = parseDate(s.date);
const stepOver = sd && !s.done && sd < now2;
const row = document.createElement('div');
row.className = `cr${s.done?' done':''}`;
if (s.area || g.area) row.classList.add('bc-'+(s.area||g.area));
if (stepOver) row.style.borderLeftColor = 'var(--red)';
row.onclick = () => toggleGoalStep(id, s.id);
row.innerHTML = `
<div class="cr-box">${s.done?'+':''}</div>
<div class="cr-txt">${s.text}</div>
${s.date ? `<span class="cr-meta">${fmtShort(sd)}</span>` : ''}
${s.priority==='high' ? '<span style="font-size:9px;color:var(--gold);letter-spacing:1px;text-transform:uppercase;padding:1px 5px;border:1px solid var(--gold-dim);border-radius:2px;">важный</span>' : ''}
<span class="cr-del" onclick="event.stopPropagation();deleteGoalStep('${id}','${s.id}')">x</span>
`;
stepsList.appendChild(row);
});
block.appendChild(stepsList);
block.appendChild(qa);
ms_el.appendChild(block);
}
(g.milestones||[]).forEach(ms => {
renderMsBlock(ms, msMap[ms.id] || []);
});
if (msMap['_free']?.length || !(g.milestones?.length)) {
renderMsBlock(null, msMap['_free'] || []);
}
}
function toggleGoalStep(goalId, stepId) {
const g = D.goals.find(x => x.id === goalId);
if (!g) return;
const s = g.steps.find(x => x.id === stepId);
if (!s) return;
s.done = !s.done;
s.doneDate = s.done ? dateStr(today()) : null;
const ds = dateStr(today());
const rec = getDayRec(ds);
rec.steps[stepId] = s.done;
save();
renderGoalDetail(goalId);
updateScore(rec);
}
function deleteGoalStep(goalId, stepId) {
const g = D.goals.find(x => x.id === goalId);
if (!g) return;
g.steps = g.steps.filter(s => s.id !== stepId);
save();
renderGoalDetail(goalId);
}
function quickGoalStep(goalId, msId, text, inp) {
text = (text||'').trim();
if (!text) return;
const g = D.goals.find(x => x.id === goalId);
if (!g) return;
g.steps.push({
id: uid(), msId: msId||null, text,
date: dateStr(today()), priority: 'normal',
done: false, doneDate: null
});
inp.value = '';
save();
renderGoalDetail(goalId);
}
function toggleMilestone(goalId, msId) {
const g = D.goals.find(x => x.id === goalId);
if (!g) return;
const ms = g.milestones.find(x => x.id === msId);
if (!ms) return;
ms.done = !ms.done;
ms.doneDate = ms.done ? dateStr(today()) : null;
save();
renderGoalDetail(goalId);
toast(ms.done ? 'Веха достигнута!' : 'Веха открыта');
}
function strategyPush(goalId) {
const g = D.goals.find(x => x.id === goalId);
if (!g) return;
const end = parseDate(g.deadline);
const now2 = today();
const dLeft = Math.max(1, daysDiff(now2, end));
const remaining = g.steps.filter(s => !s.done);
const perDay = Math.ceil(remaining.length / dLeft);
let day = new Date(now2);
remaining.forEach((s, i) => {
if (i > 0 && i % perDay === 0) { day = new Date(day); day.setDate(day.getDate()+1); }
s.date = dateStr(day);
});
save();
renderGoalDetail(goalId);
toast('Шаги перераспределены — поднажимаем!');
}
function strategyExtend(goalId) {
const g = D.goals.find(x => x.id === goalId);
if (!g) return;
const lag = calcLag(g);
if (!lag) return;
const end = parseDate(g.deadline);
end.setDate(end.getDate() + lag.lagDays + 3);
g.deadline = dateStr(end);
g.milestones?.filter(m => !m.done).forEach(m => {
const md = parseDate(m.deadline);
if (md) { md.setDate(md.getDate() + lag.lagDays); m.deadline = dateStr(md); }
});
save();
renderGoalDetail(goalId);
toast('Срок перенесён на ' + lag.lagDays + ' дн.');
}
function openGoalForm(id = null) {
_editingGoalId = id;
_msRows = [];
const g = id ? D.goals.find(x => x.id === id) : null;
document.getElementById('goalFormTitle').textContent = id ? 'Редактировать цель' : 'Новая цель';
document.getElementById('gf-title').value    = g?.title    || '';
document.getElementById('gf-area').value     = g?.area     || 'bureau';
document.getElementById('gf-deadline').value = g?.deadline || '';
document.getElementById('gf-measure').value  = g?.measure  || '';
document.getElementById('aiStatus').style.display = 'none';
document.getElementById('aiKeyBlock').style.display = 'none';
const list = document.getElementById('msFormList');
list.innerHTML = '';
if (g?.milestones?.length) {
g.milestones.forEach(ms => addMsRow(ms.title, ms.deadline));
} else {
addMsRow(); addMsRow(); addMsRow();
}
window._aiPlan = null;
document.getElementById('goalFormModal').classList.add('open');
setTimeout(() => document.getElementById('gf-title').focus(), 80);
}
function closeGoalForm() {
document.getElementById('goalFormModal').classList.remove('open');
}
function addMsRow(title='', deadline='') {
const id = 'ms_' + uid();
_msRows.push(id);
const row = document.createElement('div');
row.id = id;
row.style.cssText = 'display:flex;gap:6px;align-items:center;margin-bottom:5px;';
row.innerHTML = `
<input class="f-input" placeholder="Веха ${_msRows.length}..." value="${title}" style="flex:1;">
<input class="f-input" type="date" value="${deadline}" style="width:150px;flex:none;">
<button onclick="document.getElementById('${id}').remove();_msRows=_msRows.filter(r=>r!=='${id}')" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:16px;padding:0 4px;" onmouseover="this.style.color='var(--red)'" onmouseout="this.style.color='var(--muted)'">x</button>
`;
document.getElementById('msFormList').appendChild(row);
}
function saveGoal() {
const title    = document.getElementById('gf-title').value.trim();
const deadline = document.getElementById('gf-deadline').value;
if (!title) { toast('Укажи название'); return; }
const area    = document.getElementById('gf-area').value;
const measure = document.getElementById('gf-measure').value.trim();
const newMs = [];
document.querySelectorAll('#msFormList > div').forEach(row => {
const inputs = row.querySelectorAll('input');
const t = inputs[0]?.value.trim();
const d = inputs[1]?.value;
if (t) newMs.push({ id: uid(), title: t, deadline: d||'', done: false, doneDate: null });
});
if (_editingGoalId) {
const g = D.goals.find(x => x.id === _editingGoalId);
if (g) {
g.title = title; g.area = area;
g.deadline = deadline; g.measure = measure;
g.milestones = newMs.map(nm => {
const ex = g.milestones?.find(em => em.title === nm.title);
return ex ? { ...ex, deadline: nm.deadline } : nm;
});
}
} else {
const newGoal = {
id: uid(), title, area, deadline, measure,
created: dateStr(today()),
done: false, doneDate: null,
milestones: newMs,
steps: []
};
D.goals.push(newGoal);
if (window._aiPlan) {
applyAiPlan(newGoal, window._aiPlan);
window._aiPlan = null;
}
}
save();
closeGoalForm();
renderGoals();
toast('Цель сохранена');
}
function deleteGoal(id) {
if (!confirm('Удалить цель и все шаги?')) return;
D.goals = D.goals.filter(g => g.id !== id);
save();
renderGoals();
toast('Удалено');
}
function openStepForm(goalId, msId) {
_stepCtx = { goalId, msId };
document.getElementById('sf-text').value  = '';
document.getElementById('sf-date').value  = dateStr(today());
document.getElementById('sf-priority').value = 'normal';
document.getElementById('stepFormModal').classList.add('open');
setTimeout(() => document.getElementById('sf-text').focus(), 80);
}
function closeStepForm() {
document.getElementById('stepFormModal').classList.remove('open');
}
function saveStep() {
const text = document.getElementById('sf-text').value.trim();
if (!text) { toast('Введи текст шага'); return; }
const g = D.goals.find(x => x.id === _stepCtx.goalId);
if (!g) return;
g.steps.push({
id: uid(),
msId: _stepCtx.msId || null,
text,
date: document.getElementById('sf-date').value,
priority: document.getElementById('sf-priority').value,
done: false, doneDate: null
});
save();
closeStepForm();
renderGoalDetail(_stepCtx.goalId);
toast('Шаг добавлен');
}
function openHabitForm(goalId) {
const name = prompt('Название привычки:');
if (!name?.trim()) return;
const freq = prompt('Частота (daily / weekdays / weekly):', 'daily');
const g = D.goals.find(x => x.id === goalId);
D.habits.push({
id: uid(), goalId,
name: name.trim(),
area: g?.area || null,
frequency: freq||'daily',
archived: false,
createdDate: dateStr(today())
});
save();
renderGoalDetail(goalId);
toast('Привычка добавлена');
}
function archiveHabit(id) {
const h = D.habits.find(x => x.id === id);
if (h) { h.archived = true; save(); }
if (_detailGoalId) renderGoalDetail(_detailGoalId);
}
async function aiSuggest() {
const title    = document.getElementById('gf-title').value.trim();
const deadline = document.getElementById('gf-deadline').value;
const measure  = document.getElementById('gf-measure').value.trim();
const area     = document.getElementById('gf-area').value;
if (!title || !deadline) { toast('Укажи название и дедлайн'); return; }
const key = getApiKey();
if (!key) {
document.getElementById('aiKeyBlock').style.display = '';
return;
}
const btn = document.getElementById('aiBtn');
const status = document.getElementById('aiStatus');
btn.textContent = 'Думаю...';
btn.disabled = true;
status.style.display = '';
status.textContent = 'Claude анализирует цель...';
const end = parseDate(deadline);
const months = end ? Math.round(daysDiff(today(), end) / 30) : 6;
const todayS = dateStr(today());
const prompt = `Ты помощник по личному планированию. Пользователь ставит цель.
Цель: ${title}
Область: ${AREAS[area]?.label||area}
Дедлайн: ${deadline} (примерно ${months} мес.)
${measure ? 'Критерий достижения: '+measure : ''}
Сегодня: ${todayS}
Верни ТОЛЬКО JSON без markdown и пояснений:
{
"milestones": [{"title":"...","deadline":"YYYY-MM-DD"}],
"steps": [{"text":"...","date":"YYYY-MM-DD","msIndex":0,"priority":"normal"}],
"habits": [{"name":"...","frequency":"daily"}],
"reasoning": "1-2 предложения"
}
Правила: вех 3-5, шагов 12-25 конкретных, распредели по датам от ${todayS} до ${deadline}, привычек 2-4. Всё на русском.`;
try {
const resp = await fetch('https://api.anthropic.com/v1/messages', {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'x-api-key': key,
'anthropic-version': '2023-06-01',
'anthropic-dangerous-direct-browser-access': 'true'
},
body: JSON.stringify({
model: 'claude-sonnet-4-20250514',
max_tokens: 2000,
messages: [{ role: 'user', content: prompt }]
})
});
if (!resp.ok) {
const err = await resp.json().catch(() => ({}));
if (resp.status === 401) {
status.textContent = 'Неверный API ключ.';
document.getElementById('aiKeyBlock').style.display = '';
} else {
status.textContent = 'Ошибка: ' + (err.error?.message || resp.status);
}
btn.textContent = 'Предложить план — Claude';
btn.disabled = false;
return;
}
const data = await resp.json();
const text = data.content?.[0]?.text || '';
let plan;
try {
plan = JSON.parse(text.replace(/^```json\s*/,'').replace(/```\s*$/,'').trim());
} catch(e) {
status.textContent = 'Не удалось разобрать ответ. Попробуй ещё раз.';
btn.textContent = 'Предложить план — Claude';
btn.disabled = false;
return;
}
const list = document.getElementById('msFormList');
list.innerHTML = '';
_msRows = [];
(plan.milestones||[]).forEach(ms => addMsRow(ms.title, ms.deadline));
window._aiPlan = plan;
const hNames = (plan.habits||[]).map(h=>h.name).join(', ');
status.textContent = (plan.reasoning||'') + (hNames ? ' · Привычки: ' + hNames : '');
btn.textContent = 'Обновить план — Claude';
btn.disabled = false;
toast('Claude предложил план — проверь вехи');
} catch(e) {
status.textContent = 'Ошибка: ' + e.message;
btn.textContent = 'Предложить план — Claude';
btn.disabled = false;
}
}
function saveAiKey() {
const val = document.getElementById('aiKeyInp').value.trim();
if (!val) { toast('Введи ключ'); return; }
localStorage.setItem('mms_api_key', val);
document.getElementById('aiKeyBlock').style.display = 'none';
document.getElementById('aiKeyInp').value = '';
toast('Ключ сохранён');
aiSuggest();
}
function applyAiPlan(g, plan) {
(plan.steps||[]).forEach(s => {
const ms = g.milestones[s.msIndex ?? 0];
g.steps.push({
id: uid(), msId: ms?.id || null,
text: s.text, date: s.date || dateStr(today()),
priority: s.priority || 'normal',
done: false, doneDate: null
});
});
(plan.habits||[]).forEach(h => {
if (!D.habits.find(ex => ex.name === h.name && ex.goalId === g.id)) {
D.habits.push({
id: uid(), goalId: g.id,
name: h.name, area: g.area,
frequency: h.frequency || 'daily',
archived: false, createdDate: dateStr(today())
});
}
});
}
let _progressWeekOffset = 0;
function navProgressWeek(d) {
_progressWeekOffset += d;
if (_progressWeekOffset > 0) _progressWeekOffset = 0;
renderProgress();
}
function getWeekBounds(offset) {
const d = today();
const dow = d.getDay();
const mon = new Date(d);
mon.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1) + offset * 7);
mon.setHours(0,0,0,0);
const sun = new Date(mon);
sun.setDate(mon.getDate() + 6);
sun.setHours(23,59,59,999);
return { mon, sun };
}
function renderProgress() {
const { mon, sun } = getWeekBounds(_progressWeekOffset);
const isCurrentWeek = _progressWeekOffset === 0;
document.getElementById('progressWeekLabel').textContent =
fmtShort(mon) + ' — ' + fmtShort(sun);
document.getElementById('btnProgressNext').disabled = isCurrentWeek;
const goalsEl = document.getElementById('progressGoals');
goalsEl.innerHTML = '';
if (!D.goals.filter(g => !g.done).length) {
goalsEl.innerHTML = '<div class="empty">Нет активных целей</div>';
} else {
D.goals.filter(g => !g.done).forEach(g => {
const lag   = calcLag(g);
const color = AREAS[g.area]?.color || 'var(--gold)';
const end   = parseDate(g.deadline);
const dLeft = end ? daysDiff(today(), end) : null;
const weekSteps = (g.steps||[]).filter(s => {
if (!s.doneDate) return false;
const d2 = parseDate(s.doneDate);
return d2 >= mon && d2 <= sun;
});
const row = document.createElement('div');
row.style.cssText = 'padding:12px 0;border-bottom:1px solid var(--border);cursor:pointer;';
row.onclick = () => { nav('goals', document.querySelector('.tn-tab:nth-child(3)')); openGoalDetail(g.id); };
row.innerHTML = `
<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:8px;">
<div>
<div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:${color};margin-bottom:2px;">${AREAS[g.area]?.label||g.area}</div>
<div style="font-size:14px;color:var(--dim);">${g.title}</div>
</div>
<div style="text-align:right;flex-shrink:0;">
<div style="font-size:11px;color:var(--muted);">${weekSteps.length} шагов за неделю</div>
${dLeft !== null ? `<div style="font-size:11px;color:${dLeft<7?'var(--red)':'var(--muted)'};">${dLeft>0?dLeft+' дн. осталось':dLeft===0?'дедлайн сегодня':'просрочено'}</div>` : ''}
</div>
</div>
<div style="display:flex;align-items:center;gap:8px;">
<div class="prog-bar" style="flex:1;"><div class="prog-fill" style="width:${lag?lag.pctDone:0}%;background:${lag?.behind?'var(--red)':color};"></div></div>
<div style="font-size:11px;color:var(--muted);white-space:nowrap;">${lag?lag.pctDone:0}%${lag?.behind?' — отст. '+lag.lagDays+' дн.':''}</div>
</div>
`;
goalsEl.appendChild(row);
});
}
const habitsEl = document.getElementById('progressHabits');
habitsEl.innerHTML = '';
const activeHabits = D.habits.filter(h => !h.archived);
if (!activeHabits.length) {
habitsEl.innerHTML = '<div class="empty">Нет привычек</div>';
} else {
const weekDays = [];
for (let i = 0; i < 7; i++) {
const d2 = new Date(mon);
d2.setDate(mon.getDate() + i);
if (d2 <= sun && d2 <= today()) weekDays.push(dateStr(d2));
}
const elapsed = weekDays.length;
activeHabits.forEach(h => {
const done = weekDays.filter(ds => D.days[ds]?.habits?.[h.id]).length;
const pct  = elapsed > 0 ? Math.round(done / elapsed * 100) : 0;
const color = AREAS[h.area]?.color || 'var(--muted)';
const row = document.createElement('div');
row.style.cssText = 'display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--border);';
row.innerHTML = `
<div style="flex:1;font-size:13px;color:var(--dim);">${h.name}</div>
<div style="display:flex;gap:3px;">
${weekDays.map(ds => {
const isDone = !!(D.days[ds]?.habits?.[h.id]);
return `<div style="width:18px;height:18px;border-radius:50%;background:${isDone?color:'var(--surface2)'};border:1px solid ${isDone?color:'var(--border)'};"></div>`;
}).join('')}
</div>
<div style="font-size:11px;color:var(--muted);width:40px;text-align:right;">${done}/${elapsed}</div>
`;
habitsEl.appendChild(row);
});
}
const bodySecEl = document.getElementById('progressBodySec');
bodySecEl.style.display = modEnabled('body') ? '' : 'none';
if (modEnabled('body')) {
const bodyEl = document.getElementById('progressBody');
const weekDays2 = [];
for (let i = 0; i < 7; i++) {
const d2 = new Date(mon); d2.setDate(mon.getDate() + i);
if (d2 <= sun && d2 <= today()) weekDays2.push(dateStr(d2));
}
const vals = { sleep:[], weight:[], water:[], steps:[] };
weekDays2.forEach(ds => {
const b = D.modules.body.data[ds];
if (!b) return;
if (b.sleep)  vals.sleep.push(parseFloat(b.sleep));
if (b.weight) vals.weight.push(parseFloat(b.weight));
if (b.water)  vals.water.push(parseFloat(b.water));
if (b.steps)  vals.steps.push(parseFloat(b.steps));
});
const avg = arr => arr.length ? (arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(1) : '—';
bodyEl.innerHTML = `
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;">
${[['Сон, ч', avg(vals.sleep)],['Вес, кг', avg(vals.weight)],['Вода, мл', avg(vals.water)],['Шаги', avg(vals.steps)]].map(([lbl,val]) =>
`<div style="background:var(--surface);border-radius:var(--r);padding:10px 12px;">
<div style="font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:4px;">${lbl}</div>
<div style="font-family:var(--font-s);font-size:22px;font-weight:300;color:var(--dim);">${val}</div>
</div>`).join('')}
</div>`;
}
const chartEl = document.getElementById('progressMoodChart');
const DNAMES = ['пн','вт','ср','чт','пт','сб','вс'];
const days7 = [];
for (let i = 0; i < 7; i++) {
const d2 = new Date(mon); d2.setDate(mon.getDate() + i);
days7.push({ ds: dateStr(d2), lbl: DNAMES[i], future: d2 > today() });
}
chartEl.innerHTML = `
<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;">
${days7.map(({ds,lbl,future}) => {
const rec = D.days[ds];
const e = rec?.energy || 0;
const m = rec?.mood   || 0;
return `<div style="text-align:center;">
<div style="font-size:9px;color:var(--muted);letter-spacing:1px;margin-bottom:4px;">${lbl}</div>
<div style="height:40px;display:flex;flex-direction:column;justify-content:flex-end;gap:2px;">
<div style="height:${future?0:Math.max(2,e/5*36)}px;background:var(--gold);border-radius:2px;opacity:.8;transition:height .3s;" title="Энергия: ${e}"></div>
<div style="height:${future?0:Math.max(2,m/5*36)}px;background:var(--green);border-radius:2px;opacity:.7;transition:height .3s;" title="Настроение: ${m}"></div>
</div>
<div style="font-size:9px;color:var(--faint);margin-top:3px;">${e||'—'}</div>
</div>`;
}).join('')}
</div>
<div style="display:flex;gap:14px;margin-top:8px;font-size:10px;color:var(--muted);">
<span><span style="display:inline-block;width:10px;height:10px;background:var(--gold);border-radius:2px;margin-right:4px;vertical-align:middle;"></span>Энергия</span>
<span><span style="display:inline-block;width:10px;height:10px;background:var(--green);border-radius:2px;margin-right:4px;vertical-align:middle;"></span>Настроение</span>
</div>`;
}
let _calYear  = new Date().getFullYear();
let _calMonth = new Date().getMonth();
let _selectedCalDay = null;
let _editingEventId = null;
function navCalMonth(d) {
_calMonth += d;
if (_calMonth > 11) { _calMonth = 0; _calYear++; }
if (_calMonth < 0)  { _calMonth = 11; _calYear--; }
renderCalendar();
}
function renderCalendar() {
if (_calView === 'week') { renderCalWeek(); return; }
document.getElementById('calMonthLabel').textContent =
MONTHS[_calMonth].charAt(0).toUpperCase() + MONTHS[_calMonth].slice(1) + ' ' + _calYear;
const grid = document.getElementById('calGrid');
grid.innerHTML = '';
['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].forEach(d => {
const hdr = document.createElement('div');
hdr.style.cssText = 'text-align:center;padding:8px 4px;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);border-bottom:1px solid var(--border);';
hdr.textContent = d;
grid.appendChild(hdr);
});
const first = new Date(_calYear, _calMonth, 1);
const lastDay = new Date(_calYear, _calMonth + 1, 0).getDate();
let startDow = first.getDay();
if (startDow === 0) startDow = 7;
const todayStr = dateStr(today());
for (let i = 1; i < startDow; i++) {
grid.appendChild(Object.assign(document.createElement('div'), {
style: 'border-right:1px solid var(--border);border-bottom:1px solid var(--border);min-height:70px;'
}));
}
for (let day = 1; day <= lastDay; day++) {
const ds = `${_calYear}-${String(_calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
const isToday2 = ds === todayStr;
const isSelected = ds === _selectedCalDay;
const evts = D.calendar.filter(e => e.date === ds);
const deadlines = D.goals.filter(g => g.deadline === ds && !g.done);
const mmdd = ds.slice(5);
const bdays = modEnabled('people') ? D.people.filter(p => p.birthday === mmdd) : [];
const cell = document.createElement('div');
cell.style.cssText = `border-right:1px solid var(--border);border-bottom:1px solid var(--border);min-height:70px;padding:4px;cursor:pointer;transition:background .1s;background:${isSelected?'var(--surface2)':isToday2?'var(--gold-bg)':'var(--bg)'};`;
cell.onmouseenter = () => { if (!isSelected) cell.style.background = 'var(--surface)'; };
cell.onmouseleave = () => { cell.style.background = isSelected?'var(--surface2)':isToday2?'var(--gold-bg)':'var(--bg)'; };
cell.onclick = () => openCalDay(ds);
const numStyle = `width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;margin-bottom:3px;${isToday2?'background:var(--gold);color:#fff;font-weight:600;':'color:var(--dim);'}`;
cell.innerHTML = `<div style="${numStyle}">${day}</div>`;
const dots = [...evts, ...deadlines.map(g=>({type:'deadline',title:g.title})), ...bdays.map(p=>({type:'birthday',title:p.name}))];
dots.slice(0,3).forEach(e => {
const dot = document.createElement('div');
const c = e.type==='deadline'?'var(--red)':e.type==='birthday'?'var(--gold)':'var(--blue)';
dot.style.cssText = `font-size:10px;color:${c};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.3;`;
dot.textContent = e.title;
cell.appendChild(dot);
});
if (dots.length > 3) {
const more = document.createElement('div');
more.style.cssText = 'font-size:9px;color:var(--faint);';
more.textContent = '+' + (dots.length - 3);
cell.appendChild(more);
}
grid.appendChild(cell);
}
const total = (startDow - 1) + lastDay;
const rem = 7 - (total % 7);
if (rem < 7) {
for (let i = 0; i < rem; i++) {
grid.appendChild(Object.assign(document.createElement('div'), {
style: 'border-right:1px solid var(--border);border-bottom:1px solid var(--border);min-height:70px;background:var(--surface);'
}));
}
}
}
let _calView = 'month';
let _calWeekOffset = 0;
function setCalView(view) {
_calView = view;
const mBtn = document.getElementById('calViewMonth');
const wBtn = document.getElementById('calViewWeek');
if (mBtn && wBtn) {
if (view === 'month') {
mBtn.style.background = 'var(--surface2)'; mBtn.style.color = 'var(--dim)';
wBtn.style.background = 'transparent';      wBtn.style.color = 'var(--muted)';
} else {
wBtn.style.background = 'var(--surface2)'; wBtn.style.color = 'var(--dim)';
mBtn.style.background = 'transparent';      mBtn.style.color = 'var(--muted)';
}
}
document.getElementById('calGrid').style.display     = view === 'month' ? 'grid' : 'none';
document.getElementById('calWeekGrid').style.display = view === 'week'  ? '' : 'none';
renderCalendar();
}
function navCal(d) {
if (_calView === 'month') {
navCalMonth(d);
} else {
_calWeekOffset += d;
renderCalendar();
}
}
function renderCalWeek() {
const now = today();
const dow = now.getDay();
const mon = new Date(now);
mon.setDate(now.getDate() - (dow===0?6:dow-1) + _calWeekOffset*7);
mon.setHours(0,0,0,0);
const sun = new Date(mon); sun.setDate(mon.getDate()+6);
document.getElementById('calMonthLabel').textContent =
fmtShort(mon) + ' — ' + fmtShort(sun) + ' ' + mon.getFullYear();
const DNAMES = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const todayStr = dateStr(today());
const grid = document.getElementById('calWeekGrid');
let html = `<table style="width:100%;border-collapse:collapse;min-width:500px;"><tr>`;
for (let i=0; i<7; i++) {
const d = new Date(mon); d.setDate(mon.getDate()+i);
const ds = dateStr(d);
const isToday = ds === todayStr;
html += `<th style="padding:8px 6px 6px;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:${isToday?'var(--gold)':'var(--muted)'};font-weight:400;border-bottom:1px solid var(--border);text-align:left;width:14.28%;background:${isToday?'var(--gold-bg)':'var(--bg)'};">
${DNAMES[i]} <span style="font-family:var(--font-s);font-size:16px;font-weight:300;">${d.getDate()}</span>
</th>`;
}
html += '</tr><tr style="vertical-align:top;">';
for (let i=0; i<7; i++) {
const d = new Date(mon); d.setDate(mon.getDate()+i);
const ds = dateStr(d);
const isToday = ds === todayStr;
const evts = D.calendar.filter(e => e.date === ds);
const deadlines = D.goals.filter(g => g.deadline === ds && !g.done);
const mmdd = ds.slice(5);
const bdays = modEnabled('people') ? D.people.filter(p => p.birthday === mmdd) : [];
html += `<td style="padding:4px;border-right:1px solid var(--border);min-height:80px;background:${isToday?'var(--gold-bg)':'var(--bg)'};vertical-align:top;" onclick="openCalDay('${ds}')">`;
bdays.forEach(p => {
html += `<div style="font-size:10px;color:var(--gold);padding:3px 5px;background:var(--gold-bg);border-radius:2px;margin-bottom:2px;">ДР: ${p.name}</div>`;
});
deadlines.forEach(g => {
html += `<div style="font-size:10px;color:var(--red);padding:3px 5px;background:var(--red-bg);border-radius:2px;margin-bottom:2px;">Дедл: ${g.title.slice(0,20)}</div>`;
});
evts.forEach(e => {
html += `<div style="font-size:11px;color:var(--dim);padding:3px 5px;background:var(--surface);border-radius:2px;margin-bottom:2px;cursor:pointer;" onclick="event.stopPropagation();openEventForm('${ds}','${e.id}')">${e.time?e.time+' ':''}${e.title}</div>`;
});
html += `<div style="font-size:16px;color:var(--faint);text-align:center;padding-top:4px;cursor:pointer;" onclick="event.stopPropagation();openEventForm('${ds}',null)">+</div>`;
html += '</td>';
}
html += '</tr></table>';
grid.innerHTML = html;
}
function openCalDay(ds) {
_selectedCalDay = ds;
const d = parseDate(ds);
document.getElementById('calDayTitle').textContent = `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
document.getElementById('calDayDetail').style.display = '';
const evtsEl = document.getElementById('calDayEvents');
evtsEl.innerHTML = '';
const evts = D.calendar.filter(e => e.date === ds);
const deadlines = D.goals.filter(g => g.deadline === ds && !g.done);
const mmdd = ds.slice(5);
const bdays = modEnabled('people') ? D.people.filter(p => p.birthday === mmdd) : [];
if (!evts.length && !deadlines.length && !bdays.length) {
evtsEl.innerHTML = '<div class="empty">Событий нет</div>';
}
bdays.forEach(p => {
const row = document.createElement('div');
row.style.cssText = 'padding:8px 10px;background:var(--gold-bg);border-radius:var(--r);margin-bottom:5px;border-left:3px solid var(--gold);';
row.innerHTML = `<div style="font-size:12px;color:var(--gold);">День рождения</div><div style="font-size:14px;color:var(--dim);">${p.name}</div>`;
evtsEl.appendChild(row);
});
deadlines.forEach(g => {
const row = document.createElement('div');
row.style.cssText = 'padding:8px 10px;background:var(--red-bg);border-radius:var(--r);margin-bottom:5px;border-left:3px solid var(--red);cursor:pointer;';
row.onclick = () => { nav('goals', document.querySelector('.tn-tab:nth-child(3)')); openGoalDetail(g.id); };
row.innerHTML = `<div style="font-size:10px;color:var(--red);letter-spacing:2px;text-transform:uppercase;">Дедлайн цели</div><div style="font-size:14px;color:var(--dim);">${g.title}</div>`;
evtsEl.appendChild(row);
});
evts.forEach(e => {
const row = document.createElement('div');
row.style.cssText = 'padding:8px 10px;background:var(--surface);border-radius:var(--r);margin-bottom:5px;cursor:pointer;border-left:3px solid var(--blue);display:flex;align-items:flex-start;gap:10px;';
row.onclick = () => openEventForm(ds, e.id);
row.innerHTML = `
<div style="flex:1;">
${e.time ? `<div style="font-size:11px;color:var(--muted);margin-bottom:2px;">${e.time}</div>` : ''}
<div style="font-size:14px;color:var(--dim);">${e.title}</div>
${e.note ? `<div style="font-size:11px;color:var(--muted);margin-top:2px;">${e.note}</div>` : ''}
</div>`;
evtsEl.appendChild(row);
});
document.getElementById('calDayDetail').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
renderCalendar();
}
function closeCalDay() {
_selectedCalDay = null;
document.getElementById('calDayDetail').style.display = 'none';
renderCalendar();
}
function openEventForm(ds, eventId) {
_editingEventId = eventId;
const e = eventId ? D.calendar.find(x => x.id === eventId) : null;
document.getElementById('eventFormTitle').textContent = eventId ? 'Редактировать событие' : 'Новое событие';
document.getElementById('ef-title').value = e?.title || '';
document.getElementById('ef-date').value  = e?.date  || ds || dateStr(today());
document.getElementById('ef-time').value  = e?.time  || '';
document.getElementById('ef-type').value  = e?.type  || 'event';
document.getElementById('ef-note').value  = e?.note  || '';
document.getElementById('btnDeleteEvent').style.display = eventId ? '' : 'none';
document.getElementById('eventFormModal').classList.add('open');
setTimeout(() => document.getElementById('ef-title').focus(), 80);
}
function closeEventForm() {
document.getElementById('eventFormModal').classList.remove('open');
}
function saveEvent() {
const title = document.getElementById('ef-title').value.trim();
if (!title) { toast('Укажи название'); return; }
const ev = {
id:    _editingEventId || uid(),
title,
date:  document.getElementById('ef-date').value,
time:  document.getElementById('ef-time').value || null,
type:  document.getElementById('ef-type').value,
note:  document.getElementById('ef-note').value.trim() || null,
done:  false,
};
if (_editingEventId) {
const idx = D.calendar.findIndex(x => x.id === _editingEventId);
if (idx >= 0) D.calendar[idx] = ev;
} else {
D.calendar.push(ev);
}
save();
closeEventForm();
renderCalendar();
if (_selectedCalDay === ev.date) openCalDay(ev.date);
toast('Событие сохранено');
}
function deleteEvent() {
if (!_editingEventId) return;
if (!confirm('Удалить событие?')) return;
D.calendar = D.calendar.filter(e => e.id !== _editingEventId);
save();
closeEventForm();
renderCalendar();
if (_selectedCalDay) openCalDay(_selectedCalDay);
toast('Удалено');
}
let _finYear    = new Date().getFullYear();
let _finMonth   = new Date().getMonth();
let _finTab     = 'overview';
let _finSubTab  = 'all';
let _editTxnId  = null;
let _editPlId   = null;
let _txnType    = 'income';
const INC_CATS = {
bureau_income:  'Доход Бюро',
aparts_income:  'Доход Апарты',
freelance:      'Фриланс',
salary:         'Зарплата',
interest:       'Проценты/дивиденды',
gift:           'Подарок',
other_income:   'Другое',
};
const EXP_CATS = {
food:        'Еда',
transport:   'Транспорт',
health:      'Здоровье',
beauty:      'Красота/уход',
clothes:     'Одежда',
home_exp:    'Дом/быт',
education:   'Обучение',
entertainment:'Развлечения',
travel:      'Путешествия',
bureau_exp:  'Расходы Бюро',
aparts_exp:  'Расходы Апарты',
other_exp:   'Другое',
};
const PROJ_COLORS = {
bureau:'var(--bureau)', aparts:'var(--aparts)',
personal:'var(--personal)', other:'var(--muted)'
};
const PROJ_LABELS = { bureau:'Бюро', aparts:'Апарты', personal:'Личное', other:'Другое' };
function navFinMonth(d) {
_finMonth += d;
if (_finMonth > 11) { _finMonth = 0; _finYear++; }
if (_finMonth < 0)  { _finMonth = 11; _finYear--; }
renderFinance();
}
function setFinTab(tab, el) {
_finTab = tab;
document.querySelectorAll('.fin-tab').forEach(t => {
t.style.color = 'var(--muted)'; t.style.borderBottomColor = 'transparent';
});
el.style.color = 'var(--gold)'; el.style.borderBottomColor = 'var(--gold)';
['overview','txns','planned'].forEach(t => {
const el2 = document.getElementById('fin-'+t);
if (el2) el2.style.display = t === tab ? '' : 'none';
});
if (tab === 'planned') renderPlanned();
}
function setFinSubTab(sub, el) {
_finSubTab = sub;
document.querySelectorAll('.fin-sub-tab').forEach(t => {
t.style.color = 'var(--muted)'; t.style.borderBottomColor = 'transparent';
});
el.style.color = 'var(--gold)'; el.style.borderBottomColor = 'var(--gold)';
renderFinList();
}
function getMonthTxns() {
return D.transactions.filter(t => {
const d = parseDate(t.date);
return d && d.getFullYear() === _finYear && d.getMonth() === _finMonth;
});
}
function renderFinance() {
const now = today();
document.getElementById('finMonthLabel').textContent =
MONTHS[_finMonth].charAt(0).toUpperCase() + MONTHS[_finMonth].slice(1) + ' ' + _finYear;
document.getElementById('btnFinNext').disabled =
(_finYear === now.getFullYear() && _finMonth >= now.getMonth());
renderFinOverview();
if (_finTab === 'txns')    renderFinList();
if (_finTab === 'planned') renderPlanned();
}
function renderFinOverview() {
const txns   = getMonthTxns();
const income  = txns.filter(t=>t.type==='income').reduce((s,t)=>s+Number(t.amount),0);
const expense = txns.filter(t=>t.type==='expense').reduce((s,t)=>s+Number(t.amount),0);
const balance = income - expense;
const impulse = txns.filter(t=>t.type==='expense'&&t.impulsive).reduce((s,t)=>s+Number(t.amount),0);
const fmt = n => Math.round(n).toLocaleString('ru-RU');
document.getElementById('finSummary').innerHTML = [
['Доходы',   fmt(income),   'var(--green)',  ''],
['Расходы',  fmt(expense),  'var(--red)',    impulse>0?`импульсив.: ${fmt(impulse)}`:''],
['Баланс',   (balance>=0?'+':'')+fmt(balance), balance>=0?'var(--green)':'var(--red)', ''],
['Транзакций', txns.length, 'var(--dim)',    ''],
].map(([lbl,val,clr,sub]) => `
<div style="background:var(--bg);padding:14px 18px;">
<div style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--muted);margin-bottom:5px;">${lbl}</div>
<div style="font-family:var(--font-s);font-size:24px;font-weight:300;color:${clr};line-height:1;">${val}</div>
${sub?`<div style="font-size:10px;color:var(--muted);margin-top:3px;">${sub}</div>`:''}
</div>`).join('');
renderPlannedIndicator(income, expense);
const projects = ['bureau','aparts','personal','other'];
const projEl = document.getElementById('finByProject');
projEl.innerHTML = '';
projects.forEach(proj => {
const pInc = txns.filter(t=>t.type==='income'&&t.project===proj).reduce((s,t)=>s+Number(t.amount),0);
const pExp = txns.filter(t=>t.type==='expense'&&t.project===proj).reduce((s,t)=>s+Number(t.amount),0);
if (!pInc && !pExp) return;
const c = PROJ_COLORS[proj];
const cell = document.createElement('div');
cell.style.cssText = `background:var(--bg);padding:14px 18px;border-left:3px solid ${c};`;
cell.innerHTML = `
<div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:${c};margin-bottom:6px;">${PROJ_LABELS[proj]}</div>
<div style="display:flex;gap:16px;">
${pInc?`<div><div style="font-size:9px;color:var(--muted);">доход</div><div style="font-family:var(--font-s);font-size:18px;font-weight:300;color:var(--green);">+${fmt(pInc)}</div></div>`:''}
${pExp?`<div><div style="font-size:9px;color:var(--muted);">расход</div><div style="font-family:var(--font-s);font-size:18px;font-weight:300;color:var(--red);">-${fmt(pExp)}</div></div>`:''}
</div>`;
projEl.appendChild(cell);
});
renderFinChart();
renderCatBreakdown('finIncCats', txns.filter(t=>t.type==='income'), INC_CATS, 'var(--green)');
renderCatBreakdown('finExpCats', txns.filter(t=>t.type==='expense'), EXP_CATS, 'var(--red)');
}
function renderFinChart() {
const el = document.getElementById('finChart');
if (!el) return;
const months = [];
for (let i = 5; i >= 0; i--) {
let m = _finMonth - i;
let y = _finYear;
while (m < 0) { m += 12; y--; }
months.push({ y, m, label: MONTHS_S[m] + ' ' + (y!==new Date().getFullYear()?y:'') });
}
const data = months.map(({ y, m }) => {
const txns = D.transactions.filter(t => {
const d = parseDate(t.date);
return d && d.getFullYear() === y && d.getMonth() === m;
});
return {
income:  txns.filter(t=>t.type==='income').reduce((s,t)=>s+Number(t.amount),0),
expense: txns.filter(t=>t.type==='expense').reduce((s,t)=>s+Number(t.amount),0),
};
});
const maxVal = Math.max(...data.map(d => Math.max(d.income, d.expense)), 1);
const fmt = n => n >= 1000 ? Math.round(n/1000)+'к' : Math.round(n);
el.innerHTML = `
<div style="display:flex;align-items:flex-end;gap:8px;height:80px;">
${data.map((d, i) => `
<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;">
<div style="width:100%;display:flex;gap:2px;align-items:flex-end;justify-content:center;height:64px;">
<div style="flex:1;background:var(--green);border-radius:2px 2px 0 0;height:${Math.round(d.income/maxVal*60)}px;opacity:.8;min-height:${d.income?2:0}px;transition:height .4s;" title="Доход: ${Math.round(d.income).toLocaleString('ru-RU')}"></div>
<div style="flex:1;background:var(--red);border-radius:2px 2px 0 0;height:${Math.round(d.expense/maxVal*60)}px;opacity:.7;min-height:${d.expense?2:0}px;transition:height .4s;" title="Расход: ${Math.round(d.expense).toLocaleString('ru-RU')}"></div>
</div>
<div style="font-size:9px;color:var(--muted);text-align:center;white-space:nowrap;">${months[i].label}</div>
</div>`).join('')}
</div>
<div style="display:flex;gap:14px;margin-top:8px;font-size:10px;color:var(--muted);">
<span><span style="display:inline-block;width:10px;height:10px;background:var(--green);border-radius:2px;margin-right:4px;vertical-align:middle;opacity:.8;"></span>Доходы</span>
<span><span style="display:inline-block;width:10px;height:10px;background:var(--red);border-radius:2px;margin-right:4px;vertical-align:middle;opacity:.7;"></span>Расходы</span>
</div>`;
}
function renderCatBreakdown(elId, txns, cats, color) {
const el = document.getElementById(elId);
const first = el.firstElementChild;
el.innerHTML = '';
el.appendChild(first);
if (!txns.length) { const d=document.createElement('div'); d.className='empty'; d.textContent='Нет данных'; el.appendChild(d); return; }
const total = txns.reduce((s,t)=>s+Number(t.amount),0);
const byCat = {};
txns.forEach(t => { byCat[t.category||'other'] = (byCat[t.category||'other']||0) + Number(t.amount); });
Object.entries(byCat).sort((a,b)=>b[1]-a[1]).forEach(([cat,sum]) => {
const pct = Math.round(sum/total*100);
const row = document.createElement('div');
row.style.cssText = 'margin-bottom:8px;';
row.innerHTML = `
<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--dim);margin-bottom:3px;">
<span>${cats[cat]||cat}</span>
<span style="color:var(--muted);">${Math.round(sum).toLocaleString('ru-RU')} (${pct}%)</span>
</div>
<div style="height:3px;background:var(--surface2);border-radius:2px;">
<div style="height:100%;width:${pct}%;background:${color};border-radius:2px;opacity:.7;"></div>
</div>`;
el.appendChild(row);
});
}
function renderPlannedIndicator(income, expense) {
if (!D.planned) D.planned = [];
const now = today();
const planned = D.planned.filter(p => {
return true;
});
if (!planned.length) {
document.getElementById('finPlannedIndicator').style.display = 'none';
return;
}
const totalPlanned = planned.reduce((s,p)=>s+Number(p.amount),0);
const alreadyPaid  = D.transactions.filter(t => {
const d = parseDate(t.date);
return d && d.getFullYear()===_finYear && d.getMonth()===_finMonth && t.type==='expense';
}).reduce((s,t)=>s+Number(t.amount),0);
const remaining = totalPlanned - alreadyPaid;
const canAfford = income - alreadyPaid >= totalPlanned - alreadyPaid;
const ind = document.getElementById('finPlannedIndicator');
const txt = document.getElementById('finPlannedIndicatorText');
const fmt = n => Math.round(n).toLocaleString('ru-RU');
if (remaining > 0 && !canAfford) {
ind.style.display = '';
ind.style.background = 'var(--red-bg)';
txt.innerHTML = `Запланированных платежей: <b>${fmt(totalPlanned)}</b>. Доходов: <b>${fmt(income)}</b>. <span style="color:var(--red);">Не хватает: ${fmt(totalPlanned - income)}</span>`;
} else if (remaining > 0) {
ind.style.display = '';
ind.style.background = 'var(--gold-bg)';
txt.innerHTML = `Запланированных платежей: <b>${fmt(totalPlanned)}</b>. Доходов: <b>${fmt(income)}</b>. <span style="color:var(--green);">Хватает, остаток: ${fmt(income - totalPlanned)}</span>`;
} else {
ind.style.display = 'none';
}
}
function renderPlanned() {
if (!D.planned) D.planned = [];
const now = today();
const el  = document.getElementById('finPlannedList');
if (!el) return;
if (!D.planned.length) { el.innerHTML = '<div class="empty">Нет регулярных платежей</div>'; }
else {
el.innerHTML = '';
const sorted = [...D.planned].sort((a,b)=>Number(a.day)-Number(b.day));
sorted.forEach(p => {
const dueDate = new Date(_finYear, _finMonth, Number(p.day));
const isPast  = dueDate < now;
const color   = PROJ_COLORS[p.project]||'var(--muted)';
const row = document.createElement('div');
row.style.cssText = `display:flex;align-items:center;gap:12px;padding:10px 12px;background:var(--surface);border-radius:var(--r);margin-bottom:5px;cursor:pointer;border-left:3px solid ${color};`;
row.onclick = () => openPlannedForm(p.id);
row.innerHTML = `
<div style="font-size:13px;color:var(--muted);font-family:var(--font-mono);min-width:24px;">${p.day}</div>
<div style="flex:1;">
<div style="font-size:13px;color:var(--dim);">${p.name}</div>
<div style="font-size:10px;color:var(--muted);margin-top:1px;">${PROJ_LABELS[p.project]||p.project}</div>
</div>
<div style="font-family:var(--font-s);font-size:16px;font-weight:300;color:${isPast?'var(--muted)':'var(--dim)'};">${Math.round(p.amount).toLocaleString('ru-RU')}</div>
${isPast?'<div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;">оплачено?</div>':''}
`;
el.appendChild(row);
});
}
if (!D.cushions) D.cushions = [];
const cushEl = document.getElementById('finCushionList');
if (cushEl) {
cushEl.innerHTML = '';
if (!D.cushions.length) { cushEl.innerHTML = '<div class="empty">Нет подушек</div>'; }
else {
D.cushions.forEach(c => {
const pct = c.target > 0 ? Math.min(100, Math.round(c.current/c.target*100)) : 0;
const row = document.createElement('div');
row.style.cssText = 'padding:10px 12px;background:var(--surface);border-radius:var(--r);margin-bottom:6px;cursor:pointer;';
row.onclick = () => openCushionEditForm(c.id);
row.innerHTML = `
<div style="display:flex;justify-content:space-between;margin-bottom:5px;">
<div style="font-size:13px;color:var(--dim);">${c.name}</div>
<div style="font-size:12px;color:var(--muted);">${Math.round(c.current).toLocaleString('ru-RU')} / ${Math.round(c.target).toLocaleString('ru-RU')}</div>
</div>
<div class="prog-bar"><div class="prog-fill" style="width:${pct}%;background:var(--green);"></div></div>
<div style="font-size:10px;color:var(--muted);margin-top:3px;">${pct}%</div>`;
cushEl.appendChild(row);
});
}
}
}
function setTxnType(type) {
_txnType = type;
const iBtn = document.getElementById('txnTypeIncome');
const eBtn = document.getElementById('txnTypeExpense');
if (type === 'income') {
iBtn.style.cssText += 'background:var(--green-dim);border-color:var(--green);color:var(--green);';
eBtn.style.cssText += 'background:transparent;border-color:var(--border);color:var(--muted);';
} else {
eBtn.style.cssText += 'background:var(--red-dim);border-color:var(--red);color:var(--red);';
iBtn.style.cssText += 'background:transparent;border-color:var(--border);color:var(--muted);';
}
const catEl = document.getElementById('txn-cat');
catEl.innerHTML = '';
const cats = type === 'income' ? INC_CATS : EXP_CATS;
Object.entries(cats).forEach(([k,v]) => {
const o = document.createElement('option');
o.value = k; o.textContent = v;
catEl.appendChild(o);
});
}
function openTxnForm(type, id=null) {
_editTxnId = id;
const t = id ? D.transactions.find(x=>x.id===id) : null;
document.getElementById('txnFormTitle').textContent = id ? 'Редактировать' : 'Новая транзакция';
document.getElementById('txn-amount').value   = t?.amount   || '';
document.getElementById('txn-date').value     = t?.date     || dateStr(today());
document.getElementById('txn-desc').value     = t?.desc     || '';
document.getElementById('txn-project').value  = t?.project  || 'personal';
document.getElementById('txn-impulsive').checked = t?.impulsive || false;
document.getElementById('btnDeleteTxn').style.display = id ? '' : 'none';
setTxnType(t?.type || type || 'income');
if (t?.category) document.getElementById('txn-cat').value = t.category;
document.getElementById('txnFormModal').classList.add('open');
setTimeout(() => document.getElementById('txn-amount').focus(), 80);
}
function closeTxnForm() {
document.getElementById('txnFormModal').classList.remove('open');
}
function saveTxn() {
const amount = parseFloat(document.getElementById('txn-amount').value);
if (!amount || amount <= 0) { toast('Укажи сумму'); return; }
const txn = {
id:        _editTxnId || uid(),
type:      _txnType,
amount,
date:      document.getElementById('txn-date').value,
desc:      document.getElementById('txn-desc').value.trim(),
project:   document.getElementById('txn-project').value,
category:  document.getElementById('txn-cat').value,
impulsive: document.getElementById('txn-impulsive').checked,
};
if (_editTxnId) {
const idx = D.transactions.findIndex(x=>x.id===_editTxnId);
if (idx>=0) D.transactions[idx] = txn;
} else {
D.transactions.push(txn);
}
save(); closeTxnForm(); renderFinance();
toast('Сохранено');
}
function deleteTxn() {
if (!_editTxnId || !confirm('Удалить?')) return;
D.transactions = D.transactions.filter(x=>x.id!==_editTxnId);
save(); closeTxnForm(); renderFinance();
toast('Удалено');
}
function renderFinList() {
const el = document.getElementById('finList');
if (!el) return;
let txns = getMonthTxns();
if (_finSubTab === 'income')    txns = txns.filter(t => t.type==='income');
if (_finSubTab === 'expense')   txns = txns.filter(t => t.type==='expense');
if (_finSubTab === 'impulsive') txns = txns.filter(t => t.impulsive);
txns.sort((a,b) => (b.date||'').localeCompare(a.date||''));
if (!txns.length) { el.innerHTML = '<div class="empty" style="padding:20px 0;">Транзакций нет</div>'; return; }
const byDate = {};
txns.forEach(t => { if (!byDate[t.date]) byDate[t.date]=[]; byDate[t.date].push(t); });
el.innerHTML = '';
const fmt = n => Math.round(n).toLocaleString('ru-RU');
Object.entries(byDate).sort((a,b)=>b[0].localeCompare(a[0])).forEach(([ds, dTxns]) => {
const d = parseDate(ds);
const grp = document.createElement('div');
grp.style.cssText = 'margin-bottom:14px;';
grp.innerHTML = `<div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);padding:10px 0 6px;">${fmtDate(d)}</div>`;
dTxns.forEach(t => {
const isInc = t.type === 'income';
const c = PROJ_COLORS[t.project]||'var(--muted)';
const row = document.createElement('div');
row.style.cssText = `display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--surface);border-radius:var(--r);margin-bottom:4px;cursor:pointer;border-left:3px solid ${c};transition:background .1s;`;
row.onmouseenter = () => row.style.background = 'var(--surface2)';
row.onmouseleave = () => row.style.background = 'var(--surface)';
row.onclick = () => openTxnForm(t.type, t.id);
const cats = isInc ? INC_CATS : EXP_CATS;
row.innerHTML = `
<div style="flex:1;">
<div style="font-size:13px;color:var(--dim);">${t.desc||'—'}</div>
<div style="font-size:10px;color:var(--muted);margin-top:2px;">${PROJ_LABELS[t.project]||''} · ${cats[t.category]||t.category||''}${t.impulsive?' · импульсивная':''}</div>
</div>
<div style="font-size:16px;font-family:var(--font-s);font-weight:300;color:${isInc?'var(--green)':'var(--red)'};">${isInc?'+':'−'}${fmt(t.amount)}</div>`;
grp.appendChild(row);
});
el.appendChild(grp);
});
}
function openPlannedForm(id) {
if (!D.planned) D.planned = [];
_editPlId = id;
const p = id ? D.planned.find(x=>x.id===id) : null;
document.getElementById('plannedFormTitle').textContent = id ? 'Редактировать платёж' : 'Плановый платёж';
document.getElementById('pl-name').value    = p?.name    || '';
document.getElementById('pl-amount').value  = p?.amount  || '';
document.getElementById('pl-day').value     = p?.day     || '';
document.getElementById('pl-project').value = p?.project || 'personal';
document.getElementById('pl-cat').value     = p?.cat     || 'other';
document.getElementById('btnDeletePlanned').style.display = id ? '' : 'none';
document.getElementById('plannedFormModal').classList.add('open');
setTimeout(() => document.getElementById('pl-name').focus(), 80);
}
function closePlannedForm() {
document.getElementById('plannedFormModal').classList.remove('open');
}
function savePlanned() {
const name   = document.getElementById('pl-name').value.trim();
const amount = parseFloat(document.getElementById('pl-amount').value);
const day    = parseInt(document.getElementById('pl-day').value);
if (!name || !amount || !day) { toast('Заполни все поля'); return; }
if (!D.planned) D.planned = [];
const pl = { id: _editPlId||uid(), name, amount, day, project: document.getElementById('pl-project').value, cat: document.getElementById('pl-cat').value };
if (_editPlId) {
const idx = D.planned.findIndex(x=>x.id===_editPlId);
if (idx>=0) D.planned[idx] = pl;
} else {
D.planned.push(pl);
}
save(); closePlannedForm(); renderFinance();
toast('Платёж сохранён');
}
function deletePlanned() {
if (!_editPlId || !confirm('Удалить?')) return;
D.planned = D.planned.filter(x=>x.id!==_editPlId);
save(); closePlannedForm(); renderFinance();
toast('Удалено');
}
function openCushionForm() {
const name   = prompt('Название подушки (например: Бюро 3 месяца):');
if (!name?.trim()) return;
const target  = parseFloat(prompt('Целевая сумма:'));
const current = parseFloat(prompt('Текущая сумма (0 если нет):') || '0');
if (!target) return;
if (!D.cushions) D.cushions = [];
D.cushions.push({ id:uid(), name:name.trim(), target, current: current||0 });
save(); renderPlanned();
toast('Подушка добавлена');
}
function openCushionEditForm(id) {
if (!D.cushions) return;
const c = D.cushions.find(x=>x.id===id);
if (!c) return;
const cur = parseFloat(prompt(`Текущая сумма в подушке «${c.name}»:`, c.current)||c.current);
if (isNaN(cur)) return;
c.current = cur;
save(); renderPlanned();
toast('Обновлено');
}
const DEF_WEEKS=[{label:"Неделя 1",name:"«Возвращение»",goal:"цель: 1 000 подписчиков",days:[{date:"09.03",day:"Пн",shoot:false,event:"",personal:{text:"Reel — театр с песенкой\n«Год молчала. Возвращаюсь.»",time:"19:00",status:"draft"},bureau:{text:"Stories — деталь объекта\nинтрига без текста",time:"20:00",status:"draft"},aparts:{text:"Stories — даты апреля\n«Сезон начинается»",time:"12:00",status:"draft"},note:""},{date:"10.03",day:"Вт",shoot:true,event:" Стройка",personal:null,bureau:{text:"Снять: общий план, детали\nматериалы, эскизы в руках",time:"",status:"draft"},aparts:{text:"Снять: атмосфера объекта",time:"",status:"draft"},note:" Съёмочный день на базе.\n\n ПОЯВЛЕНИЕ 1 — РУКИ:\nВ одном кадре его руки держат план рядом с твоими. Без имени. Без объяснений."},{date:"11.03",day:"Ср",shoot:false,event:" Театр с Леной",personal:{text:"Stories — живые из театра\nс Леной (будущий коллаб)",time:"20:00",status:"draft"},bureau:null,aparts:null,note:"Снять Лену в театре — материал для коллаба.\nПознакомить аудиторию с ней заранее"},{date:"12.03",day:"Чт",shoot:false,event:"",personal:{text:"Карусель «Кто я — честно»\n5 слайдов, 5 фраз",time:"19:00",status:"draft"},bureau:{text:"Пост — знакомство бюро\nбез пафоса",time:"18:00",status:"draft"},aparts:{text:"Пост — сезонный анонс\nдаты + карусель квартир",time:"19:00",status:"draft"},note:""},{date:"13.03",day:"Пт",shoot:true,event:" Стройка",personal:{text:"Stories закулисье\nобъект + кофе + деталь",time:"18:00",status:"draft"},bureau:{text:"Снять: Reel объект изнутри\nголос за кадром (публикация 14.03)",time:"",status:"draft"},aparts:null,note:"Второй съёмочный день.\nГолос писать дома в тишине отдельно"},{date:"14.03",day:"Сб",shoot:false,event:"",personal:{text:"Пост личное — история\nили питерский момент",time:"11:00",status:"draft"},bureau:{text:"Reel — объект изнутри\n«Год на одном объекте»",time:"19:00",status:"draft"},aparts:{text:"Reel — тур по квартире\n«Проектировала сама»",time:"11:00",status:"draft"},note:""},{date:"15.03",day:"Вс",shoot:false,event:"",personal:null,bureau:null,aparts:{text:"Stories — отзыв гостя\nна фоне фото квартиры",time:"18:00",status:"draft"},note:"Лёгкий день — только одна сторис апартов"}]},{label:"Неделя 2",name:"«Экспертиза»",goal:"цель: 100K просмотров суммарно",days:[{date:"16.03",day:"Пн",shoot:false,event:" Театр с Леной",personal:{text:"Stories театр — живые\n+ знакомство с Леной\n«Скоро коллаб»",time:"20:00",status:"draft"},bureau:null,aparts:null,note:"Второй поход в театр.\nСнять совместный материал для коллаба 22.03"},{date:"17.03",day:"Вт",shoot:true,event:" Стройка",personal:null,bureau:{text:"Снять материал для:\n— Reel «Материал решает всё»\n— Детали СПА-зоны\n— Эскизы крупным планом",time:"",status:"draft"},aparts:null,note:"Съёмочный день.\nФокус на материалах и фактурах крупным планом"},{date:"18.03",day:"Ср",shoot:false,event:"",personal:{text:"Reel «Возраст как оружие»\nголос за кадром, кадры объекта",time:"19:00",status:"draft"},bureau:{text:"Карусель «Рестораны\nзакрываются — не про еду»",time:"18:00",status:"draft"},aparts:{text:"Карусель «5 причин\nприехать в Питер в апреле»",time:"18:00",status:"draft"},note:"Репост карусели бюро в stories личного"},{date:"19.03",day:"Чт",shoot:false,event:"",personal:null,bureau:{text:"Reel «Материал решает всё»\nкрупные планы фактур\nголос за кадром",time:"19:00",status:"draft"},aparts:{text:"Stories — карта\n«10 минут от Эрмитажа»",time:"12:00",status:"draft"},note:""},{date:"20.03",day:"Пт",shoot:true,event:" Стройка",personal:{text:"Stories закулисье\n\n Stories — силуэт напарника\nна объекте. Первое имя вскользь.",time:"18:00",status:"draft"},bureau:{text:"Снять: зоны СПА\nготовые фрагменты, детали отделки",time:"",status:"draft"},aparts:null,note:" Съёмочный день — СПА.\n\n ПОЯВЛЕНИЕ 2 — СИЛУЭТ:\nСторис: стоит спиной, смотрит на объект.\n«Мы с [имя] смотрим на эту стену уже сорок минут. Она того стоит.»"},{date:"21.03",day:"Сб",shoot:false,event:"",personal:{text:"Пост личное — смешное\nили питерское",time:"11:00",status:"draft"},bureau:null,aparts:{text:"Reel — Питер как персонаж\nпрогулка + квартиры",time:"11:00",status:"draft"},note:""},{date:"22.03",day:"Вс",shoot:false,event:"",personal:{text:"Stories — анонс коллаба\n«Скоро с Леной»",time:"18:00",status:"draft"},bureau:null,aparts:{text:"Stories — живая владелица\nперед заездом гостей",time:"12:00",status:"draft"},note:"Финальная подготовка материала для коллаба"}]},{label:"Неделя 3",name:"«Система»",goal:"цель: рубрики + гайд + коллаб",days:[{date:"23.03",day:"Пн",shoot:false,event:"",personal:null,bureau:{text:"Reel — запуск рубрики\n«Объект изнутри» #1\nПочему 3 раза меняли пол",time:"18:00",status:"draft"},aparts:null,note:"Первый выпуск рубрики — якорный контент бюро"},{date:"24.03",day:"Вт",shoot:true,event:" Стройка +  Коллаб с Леной",personal:{text:"Stories — съёмка коллаба\nс Леной на локации",time:"13:00",status:"draft"},bureau:{text:" КОЛЛАБ с Леной\nReel «Пространство нанимает»\nCollab-функция",time:"13:00",status:"draft"},aparts:null,note:"Встреча с Леной для съёмки коллаба.\n\n ПОЯВЛЕНИЕ 3 — ГОЛОС:\nДо встречи с Леной — сторис. Снимаешь его со спины, он отмахивается.\n«Снимать не даёт. Зато проектирует хорошо.»"},{date:"25.03",day:"Ср",shoot:false,event:"",personal:{text:"Stories → репост коллаба\n«Поговорили с Леной честно. Смотри в бюро»",time:"14:00",status:"draft"},bureau:null,aparts:{text:"Карусель «Как я обустраивала\nквартиру — и что изменила бы»",time:"18:00",status:"draft"},note:""},{date:"26.03",day:"Чт",shoot:false,event:"",personal:{text:"Пост — история личная\nвыгорание / переезд / брак",time:"19:00",status:"draft"},bureau:{text:"Пост — анонс гайда\n«5 вопросов владельца HoReCa»\nДирект: ОБЪЕКТ",time:"12:00",status:"draft"},aparts:null,note:"Репост анонса гайда в stories личного аккаунта"},{date:"27.03",day:"Пт",shoot:true,event:" Стройка",personal:null,bureau:{text:"Снять: прогресс объекта\nдо/после фрагментов",time:"",status:"draft"},aparts:{text:"Снять атмосферу\nприроды вокруг базы",time:"",status:"draft"},note:"Съёмка прогресса — материал для итогов месяца"},{date:"28.03",day:"Сб",shoot:false,event:"",personal:{text:"Reel — питерское утро",time:"11:00",status:"draft"},bureau:{text:"Карусель «Как я работаю\nот звонка до открытия»",time:"18:00",status:"draft"},aparts:{text:"Stories — отзыв гостя\n+ стикер бронирования",time:"12:00",status:"draft"},note:""},{date:"29.03",day:"Вс",shoot:false,event:"",personal:null,bureau:null,aparts:{text:"Карусель «Майские в Питере»\nгид от жителя, ссылка на бронь",time:"18:00",status:"draft"},note:"Важно до майских — закрыть даты"}]},{label:"Неделя 4",name:"«Масштаб»",goal:"цель: заявки в бюро + бронирования апартов",days:[{date:"30.03",day:"Пн",shoot:false,event:"",personal:{text:"Карусель «Три аккаунта.\nОдна я. Как это работает»",time:"19:00",status:"draft"},bureau:{text:"Пост — мягкий анонс консультаций\nДирект: РАЗБОР",time:"18:00",status:"draft"},aparts:null,note:"Репост анонса консультаций в stories личного"},{date:"31.03",day:"Вт",shoot:true,event:" Стройка",personal:null,bureau:{text:"Снять: финальный материал\nпрогресс объекта, итоговые кадры",time:"",status:"draft"},aparts:null,note:"Последний съёмочный день месяца"},{date:"01.04",day:"Ср",shoot:false,event:"",personal:{text:" Пост-раскрытие\n«Партнёр. Бывший муж.\nСемь лет перерыва. Клиенты не заметили.»",time:"",status:"draft"},bureau:{text:"Reel «СПА изнутри»\nматериалы / свет / акустика",time:"19:00",status:"draft"},aparts:{text:"Reel — белые ночи на горизонте\n«Апрель ещё есть»",time:"11:00",status:"draft"},note:" МОМЕНТ РАСКРЫТИЯ:\n«Архитектура получается лучше, чем семейная жизнь. Хотя это тоже было неплохо.»\nПубликовать только если первые 3 появления прошли комфортно."},{date:"02.04",day:"Чт",shoot:false,event:"",personal:null,bureau:{text:"Карусель — кейс подписчика\nразбор присланного кафе",time:"19:00",status:"draft"},aparts:{text:"Stories — живая проверка квартир\nперед сезоном",time:"12:00",status:"draft"},note:"Запросить фото кафе у подписчиков (через stories 23.03)"},{date:"03.04",day:"Пт",shoot:true,event:" Стройка",personal:{text:"Stories закулисье",time:"18:00",status:"draft"},bureau:{text:"Снять: материал для рубрики #2\n«Объект изнутри»",time:"",status:"draft"},aparts:null,note:""},{date:"04.04",day:"Сб",shoot:false,event:"",personal:{text:"Пост — итоги марта\nчестно: цифры / что вышло / что нет",time:"18:00",status:"draft"},bureau:null,aparts:{text:"Карусель апрель —\nобновить даты и спецпредложение",time:"11:00",status:"draft"},note:""},{date:"05.04",day:"Вс",shoot:false,event:"",personal:{text:"Stories голосование\n«Больше жизни или больше профессии?»",time:"20:00",status:"draft"},bureau:{text:"Stories голосование\n«Что показывать с объекта?»",time:"20:00",status:"draft"},aparts:{text:"Stories голосование\n«Квартиры или Питер?»",time:"20:00",status:"draft"},note:"Финал месяца — аудитория выбирает план на апрель"}]}];
const DEF_HOOKS=[{id:1,type:"question",text:"Почему дорогой ремонт выглядит дешевле дешёвого?",pain:"Потратил — не то",emotion:"Любопытство",account:"bureau"},{id:2,type:"question",text:"Что я проверяю в чужом заведении первые 10 секунд?",pain:"Правильно ли у меня",emotion:"Любопытство",account:"bureau"},{id:3,type:"question",text:"Почему гости не возвращаются — хотя всё красиво?",pain:"Нет повторных броней",emotion:"Тревога",account:"aparts"},{id:4,type:"question",text:"За что дизайнеры берут деньги, которые вам не нужны?",pain:"Чувствую переплату",emotion:"Гнев",account:"bureau"},{id:5,type:"question",text:"Почему я отказалась от проекта с большим бюджетом?",pain:"Деньги решают всё",emotion:"Любопытство",account:"personal"},{id:6,type:"question",text:"Что видит архитектор, когда заходит в вашу квартиру?",pain:"Стыд за жильё",emotion:"Тревога",account:"personal"},{id:7,type:"question",text:"Почему я выгорала три раза — и возвращалась?",pain:"Думаю бросить",emotion:"Надежда",account:"personal"},{id:8,type:"number",text:"1 диван поднял выручку квартиры на 30%. Вот какой.",pain:"Дизайн vs доход",emotion:"FOMO",account:"aparts"},{id:9,type:"number",text:"3 ошибки, которые я вижу в 90% питерских квартир.",pain:"Делаю неправильно",emotion:"Тревога",account:"bureau"},{id:10,type:"number",text:"За 30 лет я видела 400+ объектов. Жалею о двух.",pain:"Боюсь пожалеть",emotion:"Любопытство",account:"bureau"},{id:11,type:"number",text:"Потолок 3 метра — и я покрасила его тёмным. Вот что вышло.",pain:"Боюсь рисковать",emotion:"Надежда",account:"personal"},{id:12,type:"number",text:"Институт выгнал меня с 3 курса. Я вернулась через 7 лет.",pain:"Недостаточно профи",emotion:"Надежда",account:"personal"},{id:13,type:"number",text:"Я закрывала бизнес 3 раза. Вот что каждый раз шло не так.",pain:"Бизнес не растёт",emotion:"Надежда",account:"personal"},{id:14,type:"contrast",text:"Все вешают зеркала чтобы расширить. Я убираю.",pain:"Советы не работают",emotion:"Гнев",account:"bureau"},{id:15,type:"contrast",text:"Все делают «как в отеле». Мои квартиры — наоборот.",pain:"Все одинаковые",emotion:"Любопытство",account:"aparts"},{id:16,type:"contrast",text:"Все дизайнеры показывают готовое. Я — когда всё плохо.",pain:"Инстаграм нереален",emotion:"Гнев",account:"personal"},{id:17,type:"contrast",text:"Мне говорили: в 50 поздно начинать. Я переехала в Питер.",pain:"Возраст = ограничение",emotion:"Надежда",account:"personal"},{id:18,type:"contrast",text:"Все боятся цвета на потолке. Я начинаю с него.",pain:"Делаю стандартно",emotion:"Надежда",account:"bureau"},{id:19,type:"contrast",text:"Муж уходил четыре раза. Интерьер оставался. Вот что это значит.",pain:"Хочу дом который мой",emotion:"Любопытство",account:"personal"},{id:20,type:"anchor",text:"Мне 52. Я архитектор. И я до сих пор делаю это иначе.",pain:"Нет ролевой модели",emotion:"Надежда",account:"all"}];
function load(){
try{
const w=localStorage.getItem('cc2_weeks');
const h=localStorage.getItem('cc2_hooks');
return{weeks:w?JSON.parse(w):JSON.parse(JSON.stringify(DEF_WEEKS)),hooks:h?JSON.parse(h):JSON.parse(JSON.stringify(DEF_HOOKS))};
}catch(e){return{weeks:JSON.parse(JSON.stringify(DEF_WEEKS)),hooks:JSON.parse(JSON.stringify(DEF_HOOKS))};}
}
function save(){localStorage.setItem('cc2_weeks',JSON.stringify(S.weeks));localStorage.setItem('cc2_hooks',JSON.stringify(S.hooks));}
function migrateCc2Weeks() {
try {
const cc2 = localStorage.getItem('cc2_weeks');
const data = cc2 ? JSON.parse(cc2) : DEF_WEEKS;
if (!data || !data.length) return;
const existIds = new Set(D.posts.map(p => p.id));
if (!D.shoots) D.shoots = [];
const shootDates = new Set(D.shoots.map(s => s.date));
data.forEach(wk => {
(wk.days||[]).forEach(day => {
if (!day.date) return;
const parts = day.date.split('.');
if (parts.length < 2) return;
const ds = '2026-' + parts[1].padStart(2,'0') + '-' + parts[0].padStart(2,'0');
['personal','bureau','aparts'].forEach(acc => {
const p = day[acc];
if (p && p.text) {
const id = 'cc2_' + ds + '_' + acc;
if (!existIds.has(id)) {
existIds.add(id);
D.posts.push({ id, account:acc, date:ds, time:p.time||null, status:p.status||'draft', text:p.text });
}
}
});
if (day.shoot && !shootDates.has(ds)) {
shootDates.add(ds);
D.shoots.push({ date:ds, event:day.event||'', bureau:'', aparts:'', personal:'', note:'' });
}
});
});
save();
} catch(e) { console.warn('cc2 migration:', e); }
}
let _contentWeekOffset = 0;
let _selectedContentDay = null;
let _editingPostId = null;
const ACCOUNT_COLORS = {
bureau: 'var(--bureau)', aparts: 'var(--aparts)', personal: 'var(--personal)'
};
const ACCOUNT_LABELS = { bureau: 'Бюро', aparts: 'Апарты', personal: 'Личный' };
const STATUS_LABELS  = { draft: 'черновик', ready: 'готово', done: 'опубликовано' };
const STATUS_COLORS  = { draft: 'var(--muted)', ready: 'var(--blue)', done: 'var(--green)' };
function navContentWeek(d) {
_contentWeekOffset += d;
if (_contentWeekOffset > 0) _contentWeekOffset = 0;
renderContent();
}
function switchContentTab(tab, el) {
document.querySelectorAll('.fn-tab').forEach(t => t.classList.remove('active'));
el.classList.add('active');
document.getElementById('ctab-plan').style.display   = tab === 'plan'  ? '' : 'none';
document.getElementById('ctab-ideas').style.display  = tab === 'ideas' ? '' : 'none';
if (tab === 'ideas') renderIdeas();
}
function renderContent() {
const { mon, sun } = getWeekBounds(_contentWeekOffset);
document.getElementById('contentWeekLabel').textContent = fmtShort(mon) + ' — ' + fmtShort(sun);
document.getElementById('btnContentNext').disabled = _contentWeekOffset >= 0;
const grid = document.getElementById('contentWeekGrid');
grid.innerHTML = '';
const DNAMES = ['пн','вт','ср','чт','пт','сб','вс'];
const todayStr = dateStr(today());
for (let i = 0; i < 7; i++) {
const d = new Date(mon); d.setDate(mon.getDate() + i);
const ds = dateStr(d);
const isToday2 = ds === todayStr;
const isSel = ds === _selectedContentDay;
const dayPosts = D.posts.filter(p => p.date === ds);
const col = document.createElement('div');
col.style.cssText = `background:${isSel?'var(--surface2)':isToday2?'var(--gold-bg)':'var(--bg)'};padding:8px 6px;min-height:80px;cursor:pointer;transition:background .1s;border-right:1px solid var(--border);`;
col.onmouseenter = () => { if (!isSel) col.style.background = 'var(--surface)'; };
col.onmouseleave = () => { col.style.background = isSel?'var(--surface2)':isToday2?'var(--gold-bg)':'var(--bg)'; };
col.onclick = () => openContentDay(ds);
col.innerHTML = `<div style="font-size:9px;letter-spacing:1px;text-transform:uppercase;color:var(--muted);">${DNAMES[i]}</div>
<div style="font-size:16px;font-family:var(--font-s);font-weight:300;color:${isToday2?'var(--gold)':'var(--dim)'};margin-bottom:4px;">${d.getDate()}</div>`;
const shoot = (D.shoots||[]).find(s => s.date === ds);
if (shoot) {
const shootDot = document.createElement('div');
shootDot.style.cssText = 'font-size:9px;letter-spacing:1px;text-transform:uppercase;color:var(--gold);background:var(--gold-bg);border-radius:2px;padding:1px 4px;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
shootDot.textContent = 'съёмка' + (shoot.event?' · '+shoot.event.slice(0,12):'');
col.appendChild(shootDot);
}
dayPosts.slice(0,3).forEach(p => {
const dot = document.createElement('div');
dot.style.cssText = `font-size:10px;color:${ACCOUNT_COLORS[p.account]||'var(--muted)'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.4;`;
dot.textContent = ACCOUNT_LABELS[p.account]||p.account;
col.appendChild(dot);
});
if (dayPosts.length > 3) {
const m = document.createElement('div');
m.style.cssText = 'font-size:9px;color:var(--faint);';
m.textContent = '+' + (dayPosts.length - 3);
col.appendChild(m);
}
grid.appendChild(col);
}
if (_selectedContentDay) renderContentDayPosts(_selectedContentDay);
}
function openContentDay(ds) {
_selectedContentDay = ds;
renderContent();
}
function renderContentDayPosts(ds) {
const el = document.getElementById('contentDayPosts');
const d = parseDate(ds);
const posts = D.posts.filter(p => p.date === ds);
el.innerHTML = `
<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
<div style="font-family:var(--font-s);font-size:16px;font-weight:300;flex:1;">${d ? fmtDate(d) : ds}</div>
<button class="btn btn-gold btn-sm" onclick="openPostForm('${ds}',null)">+ Пост</button>
<button class="btn btn-sm" onclick="openShootForm('${ds}')">+ Съёмка</button>
</div>
`;
const shoot = (D.shoots||[]).find(s => s.date === ds);
if (shoot) {
const shootEl = document.createElement('div');
shootEl.style.cssText = 'padding:12px 14px;background:var(--gold-bg);border-radius:var(--r);margin-bottom:12px;border-left:3px solid var(--gold);cursor:pointer;';
shootEl.onclick = () => openShootForm(ds);
let shootHtml = `<div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--gold);margin-bottom:6px;">Съёмочный день${shoot.event?' · '+shoot.event:''}</div>`;
['bureau','aparts','personal'].forEach(acc => {
if (shoot[acc]) {
shootHtml += `<div style="margin-bottom:5px;"><span style="font-size:10px;letter-spacing:1px;text-transform:uppercase;color:${ACCOUNT_COLORS[acc]};margin-right:6px;">${ACCOUNT_LABELS[acc]}</span><span style="font-size:12px;color:var(--dim);">${shoot[acc]}</span></div>`;
}
});
if (shoot.note) shootHtml += `<div style="font-size:11px;color:var(--muted);margin-top:6px;white-space:pre-line;line-height:1.5;">${shoot.note}</div>`;
shootEl.innerHTML = shootHtml;
el.appendChild(shootEl);
}
if (!posts.length && !shoot) {
el.innerHTML += '<div class="empty">Постов нет — нажми + чтобы добавить</div>';
return;
} else if (!posts.length) {
return;
}
['bureau','aparts','personal'].forEach(acc => {
const accPosts = posts.filter(p => p.account === acc);
if (!accPosts.length) return;
const sec = document.createElement('div');
sec.style.marginBottom = '12px';
sec.innerHTML = `<div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:${ACCOUNT_COLORS[acc]};margin-bottom:6px;">${ACCOUNT_LABELS[acc]}</div>`;
accPosts.forEach(p => {
const row = document.createElement('div');
row.style.cssText = `padding:10px 12px;background:var(--surface);border-radius:var(--r);margin-bottom:4px;cursor:pointer;border-left:3px solid ${ACCOUNT_COLORS[acc]||'var(--border)'};transition:background .1s;`;
row.onmouseenter = () => row.style.background = 'var(--surface2)';
row.onmouseleave = () => row.style.background = 'var(--surface)';
row.onclick = () => openPostForm(ds, p.id);
row.innerHTML = `
<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
${p.time ? `<span style="font-size:11px;color:var(--muted);">${p.time}</span>` : ''}
<span style="font-size:10px;letter-spacing:1px;color:${STATUS_COLORS[p.status]||'var(--muted)'};">${STATUS_LABELS[p.status]||p.status}</span>
</div>
<div style="font-size:13px;color:var(--dim);line-height:1.45;">${p.text||'Без текста'}</div>
`;
sec.appendChild(row);
});
el.appendChild(sec);
});
}
function openPostForm(ds, postId) {
_editingPostId = postId;
const p = postId ? D.posts.find(x => x.id === postId) : null;
document.getElementById('postFormTitle').textContent = postId ? 'Редактировать пост' : 'Новый пост';
document.getElementById('pf-account').value = p?.account || 'bureau';
document.getElementById('pf-date').value    = p?.date    || ds || dateStr(today());
document.getElementById('pf-time').value    = p?.time    || '';
document.getElementById('pf-status').value  = p?.status  || 'draft';
document.getElementById('pf-text').value    = p?.text    || '';
document.getElementById('btnDeletePost').style.display = postId ? '' : 'none';
document.getElementById('postFormModal').classList.add('open');
setTimeout(() => document.getElementById('pf-text').focus(), 80);
}
function closePostForm() {
document.getElementById('postFormModal').classList.remove('open');
}
function savePost() {
const post = {
id:      _editingPostId || uid(),
account: document.getElementById('pf-account').value,
date:    document.getElementById('pf-date').value,
time:    document.getElementById('pf-time').value || null,
status:  document.getElementById('pf-status').value,
text:    document.getElementById('pf-text').value.trim(),
};
if (!post.date) { toast('Укажи дату'); return; }
if (_editingPostId) {
const idx = D.posts.findIndex(x => x.id === _editingPostId);
if (idx >= 0) D.posts[idx] = post;
} else {
D.posts.push(post);
}
save();
closePostForm();
if (_selectedContentDay === post.date) renderContentDayPosts(post.date);
renderContent();
toast('Пост сохранён');
}
function deletePost() {
if (!_editingPostId || !confirm('Удалить пост?')) return;
D.posts = D.posts.filter(p => p.id !== _editingPostId);
save();
closePostForm();
renderContent();
toast('Удалено');
}
function saveIdea() {
const text = document.getElementById('idea-text').value.trim();
if (!text) { toast('Введи текст идеи'); return; }
D.ideas.push({
id: uid(),
text,
account: document.getElementById('idea-account').value,
format:  document.getElementById('idea-format').value,
tags:    document.getElementById('idea-tags').value.split(',').map(t=>t.trim()).filter(Boolean),
createdDate: dateStr(today()),
});
document.getElementById('idea-text').value = '';
document.getElementById('idea-tags').value = '';
save();
renderIdeas();
toast('Идея сохранена');
}
function renderIdeas() {
const el = document.getElementById('ideasList');
const cnt = document.getElementById('ideaCount');
if (cnt) cnt.textContent = D.ideas.length;
if (!el) return;
if (!D.ideas.length) { el.innerHTML = '<div class="empty">Идей пока нет</div>'; return; }
el.innerHTML = '';
[...D.ideas].reverse().forEach(idea => {
const row = document.createElement('div');
row.style.cssText = 'padding:10px 12px;background:var(--surface);border-radius:var(--r);margin-bottom:6px;border-left:3px solid '+(ACCOUNT_COLORS[idea.account]||'var(--border)')+';';
row.innerHTML = `
<div style="display:flex;align-items:flex-start;gap:8px;">
<div style="flex:1;">
<div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:${ACCOUNT_COLORS[idea.account]||'var(--muted)'};margin-bottom:3px;">${ACCOUNT_LABELS[idea.account]||idea.account} · ${idea.format||''}</div>
<div style="font-size:13px;color:var(--dim);line-height:1.45;">${idea.text}</div>
${idea.tags?.length ? `<div style="font-size:10px;color:var(--muted);margin-top:4px;">${idea.tags.join(' · ')}</div>` : ''}
</div>
<button onclick="moveIdeaToPlan('${idea.id}')" class="btn btn-gold btn-sm" style="flex-shrink:0;">В план</button>
<button onclick="deleteIdea('${idea.id}')" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:14px;padding:0 3px;" onmouseover="this.style.color='var(--red)'" onmouseout="this.style.color='var(--muted)'">x</button>
</div>
`;
el.appendChild(row);
});
}
function deleteIdea(id) {
D.ideas = D.ideas.filter(i => i.id !== id);
save(); renderIdeas(); toast('Удалено');
}
function moveIdeaToPlan(id) {
const idea = D.ideas.find(x => x.id === id);
if (!idea) return;
openPostForm(dateStr(today()), null);
setTimeout(() => {
document.getElementById('pf-account').value = idea.account;
document.getElementById('pf-text').value    = idea.text;
}, 100);
}
let _editShootDate = null;
function openShootForm(ds) {
if (!D.shoots) D.shoots = [];
_editShootDate = ds;
const s = D.shoots.find(x => x.date === ds);
document.getElementById('shootFormTitle').textContent = s ? 'Редактировать съёмку' : 'Съёмочный день';
document.getElementById('sh-date').value    = ds || dateStr(today());
document.getElementById('sh-event').value   = s?.event    || '';
document.getElementById('sh-bureau').value  = s?.bureau   || '';
document.getElementById('sh-aparts').value  = s?.aparts   || '';
document.getElementById('sh-personal').value= s?.personal || '';
document.getElementById('sh-note').value    = s?.note     || '';
document.getElementById('btnDeleteShoot').style.display = s ? '' : 'none';
document.getElementById('shootFormModal').classList.add('open');
setTimeout(() => document.getElementById('sh-event').focus(), 80);
}
function closeShootForm() {
document.getElementById('shootFormModal').classList.remove('open');
}
function saveShoot() {
if (!D.shoots) D.shoots = [];
const date = document.getElementById('sh-date').value;
if (!date) { toast('Укажи дату'); return; }
const shoot = {
date,
event:   document.getElementById('sh-event').value.trim(),
bureau:  document.getElementById('sh-bureau').value.trim(),
aparts:  document.getElementById('sh-aparts').value.trim(),
personal:document.getElementById('sh-personal').value.trim(),
note:    document.getElementById('sh-note').value.trim(),
};
const idx = D.shoots.findIndex(s => s.date === date);
if (idx >= 0) D.shoots[idx] = shoot;
else D.shoots.push(shoot);
save();
closeShootForm();
if (_selectedContentDay === date) renderContentDayPosts(date);
renderContent();
toast('Съёмка сохранена');
}
function deleteShoot() {
if (!_editShootDate || !confirm('Удалить съёмочный день?')) return;
D.shoots = (D.shoots||[]).filter(s => s.date !== _editShootDate);
save();
closeShootForm();
renderContent();
toast('Удалено');
}
const LIFE_CATS = [
{ id:'win',     label:'Победа',       color:'#9e2a3a' },
{ id:'culture', label:'Культура',     color:'#1e4d8c' },
{ id:'travel',  label:'Путешествие',  color:'#1a7a4a' },
{ id:'body',    label:'Тело',         color:'#c05a20' },
{ id:'connect', label:'Люди',         color:'#6b2d8c' },
{ id:'idea',    label:'Идея',         color:'#2d7a5a' },
{ id:'joy',     label:'Радость',      color:'#c08a10' },
];
let _lifeEntries     = JSON.parse(localStorage.getItem('life_entries') || '[]');
let _lifeWishes      = JSON.parse(localStorage.getItem('life_wishes')  || '[]');
let _lifeMonthlyQ    = localStorage.getItem('life_monthly_q') || '';
let _lifeSelCat      = 'win';
let _lifeSelRating   = 3;
let _lifeFilter      = 'all';
let _lifeSort        = 'new';
function renderLife() {
renderLifeCatBtns();
renderLifeRating();
renderLifeAll();
const mq = document.getElementById('lifeMonthlyQ');
if (mq && _lifeMonthlyQ) mq.textContent = _lifeMonthlyQ;
}
function renderLifeCatBtns() {
const wrap = document.getElementById('lifeCatBtns');
if (!wrap) return;
wrap.innerHTML = '';
LIFE_CATS.forEach(c => {
const btn = document.createElement('button');
btn.style.cssText = `padding:4px 10px;border-radius:20px;font-size:10px;letter-spacing:1px;cursor:pointer;transition:all .15s;font-family:var(--font-m);white-space:nowrap;border:1px solid ${c.id === _lifeSelCat ? c.color : 'var(--border)'};background:${c.id === _lifeSelCat ? c.color : 'transparent'};color:${c.id === _lifeSelCat ? '#fff' : 'var(--muted)'};`;
btn.textContent = c.label;
btn.onclick = () => { _lifeSelCat = c.id; renderLifeCatBtns(); };
wrap.appendChild(btn);
});
}
function renderLifeRating() {
const wrap = document.getElementById('lifeRatingWrap');
if (!wrap) return;
wrap.innerHTML = '';
for (let i = 1; i <= 5; i++) {
const s = document.createElement('div');
s.style.cssText = `width:24px;height:24px;border-radius:50%;border:1px solid ${i <= _lifeSelRating ? 'var(--life-c)' : 'var(--border)'};background:${i <= _lifeSelRating ? 'var(--life-c)' : 'transparent'};color:${i <= _lifeSelRating ? '#fff' : 'var(--muted)'};display:flex;align-items:center;justify-content:center;font-size:10px;cursor:pointer;transition:all .15s;font-family:var(--font-m);`;
s.textContent = i;
s.onclick = () => { _lifeSelRating = i; renderLifeRating(); };
wrap.appendChild(s);
}
}
function addLifeEntry() {
const title = document.getElementById('lifeMainInput').value.trim();
if (!title) return;
const detail = document.getElementById('lifeDetailInput').value.trim();
_lifeEntries.unshift({ id: Date.now(), title, detail, cat: _lifeSelCat, rating: _lifeSelRating, date: new Date().toISOString() });
localStorage.setItem('life_entries', JSON.stringify(_lifeEntries));
document.getElementById('lifeMainInput').value = '';
document.getElementById('lifeDetailInput').value = '';
_lifeSelRating = 3;
renderLifeRating();
renderLifeAll();
}
function deleteLifeEntry(id) {
_lifeEntries = _lifeEntries.filter(e => e.id !== id);
localStorage.setItem('life_entries', JSON.stringify(_lifeEntries));
renderLifeAll();
}
function setLifeFilter(f, el) {
_lifeFilter = f;
document.querySelectorAll('.life-filter').forEach(b => {
b.style.background = 'transparent';
b.style.borderColor = 'var(--border)';
b.style.color = 'var(--muted)';
});
el.style.background = 'var(--life-c)';
el.style.borderColor = 'var(--life-c)';
el.style.color = '#fff';
renderLifeFeed();
}
function setLifeSort(s) {
_lifeSort = s;
document.getElementById('lifeSortNew').style.background   = s==='new'   ? 'var(--surface2)' : 'transparent';
document.getElementById('lifeSortNew').style.color        = s==='new'   ? 'var(--dim)' : 'var(--muted)';
document.getElementById('lifeSortStars').style.background = s==='stars' ? 'var(--surface2)' : 'transparent';
document.getElementById('lifeSortStars').style.color      = s==='stars' ? 'var(--dim)' : 'var(--muted)';
renderLifeFeed();
}
function renderLifeFeed() {
const panel = document.getElementById('lifeFeedPanel');
if (!panel) return;
let list = _lifeFilter === 'all' ? [..._lifeEntries] : _lifeEntries.filter(e => e.cat === _lifeFilter);
if (_lifeSort === 'stars') list.sort((a,b) => b.rating - a.rating);
if (!list.length) {
panel.innerHTML = `<div style="padding:32px;font-size:13px;color:var(--faint);line-height:1.8;font-family:var(--font-s);font-style:italic;font-size:16px;font-weight:300;">Здесь будут жить твои яркие моменты.<br>Победы, спектакли, путешествия, открытия.<br><br>Начни с первой записи.</div>`;
return;
}
panel.innerHTML = '';
list.forEach(e => {
const cat = LIFE_CATS.find(c => c.id === e.cat) || LIFE_CATS[0];
const d = new Date(e.date);
const ds = `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
const stars = Array.from({length:5},(_,i) => `<span style="color:${i<e.rating?cat.color:'var(--faint)'};font-size:12px;">*</span>`).join('');
const card = document.createElement('div');
card.style.cssText = `display:flex;gap:0;margin-bottom:8px;border-radius:var(--r);overflow:hidden;background:var(--surface);transition:background .1s;`;
card.onmouseenter = () => card.style.background = 'var(--surface2)';
card.onmouseleave = () => card.style.background = 'var(--surface)';
card.innerHTML = `
<div style="width:3px;flex-shrink:0;background:${cat.color};"></div>
<div style="flex:1;padding:10px 14px;">
<div style="font-size:14px;color:var(--text);margin-bottom:${e.detail?'4px':'0'};line-height:1.4;">${e.title}</div>
${e.detail?`<div style="font-size:12px;color:var(--muted);line-height:1.5;margin-bottom:6px;">${e.detail}</div>`:''}
<div style="display:flex;align-items:center;gap:10px;margin-top:4px;">
<span style="font-size:10px;color:var(--muted);">${ds}</span>
<span style="font-size:10px;padding:1px 8px;border-radius:20px;background:${cat.color}18;color:${cat.color};">${cat.label}</span>
<span>${stars}</span>
<span onclick="deleteLifeEntry(${e.id})" style="margin-left:auto;color:var(--muted);cursor:pointer;font-size:14px;opacity:0;transition:opacity .15s;" onmouseenter="this.style.opacity=1;this.style.color='var(--red)'" onmouseleave="this.style.opacity=0;">x</span>
</div>
</div>`;
panel.appendChild(card);
});
}
function renderLifeStats() {
const now = new Date();
document.getElementById('lifeTotalCount').textContent = _lifeEntries.length;
const thisMonth = _lifeEntries.filter(e => { const d=new Date(e.date); return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear(); });
document.getElementById('lifeStatMonth').textContent = thisMonth.length;
const avg = _lifeEntries.length ? (_lifeEntries.reduce((s,e)=>s+e.rating,0)/_lifeEntries.length).toFixed(1) : '-';
document.getElementById('lifeStatStars').textContent = avg;
const catCounts = {};
LIFE_CATS.forEach(c => { catCounts[c.id] = _lifeEntries.filter(e=>e.cat===c.id).length; });
const top = Object.entries(catCounts).sort((a,b)=>b[1]-a[1])[0];
document.getElementById('lifeStatTop').textContent = top&&top[1]>0 ? (LIFE_CATS.find(c=>c.id===top[0])||{}).label||'-' : '-';
let streak=0;
for(let i=0;i<52;i++){
const ws=new Date(now); ws.setDate(now.getDate()-now.getDay()-i*7);
const we=new Date(ws); we.setDate(ws.getDate()+7);
if(_lifeEntries.some(e=>{const d=new Date(e.date);return d>=ws&&d<we;})) streak++;
else if(i>0) break;
}
document.getElementById('lifeStatStreak').textContent = streak;
}
function renderLifeCatBreakdown() {
const el = document.getElementById('lifeCatBreakdown');
if (!el) return;
el.innerHTML = '';
LIFE_CATS.forEach(c => {
const count = _lifeEntries.filter(e=>e.cat===c.id).length;
const row = document.createElement('div');
row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border);';
row.innerHTML = `<div style="width:8px;height:8px;border-radius:50%;background:${c.color};flex-shrink:0;"></div><div style="flex:1;font-size:12px;color:var(--dim);">${c.label}</div><div style="font-size:12px;color:var(--muted);">${count}</div>`;
el.appendChild(row);
});
}
function renderLifeHeatmap() {
const el = document.getElementById('lifeHeatmap');
if (!el) return;
el.innerHTML = '';
const now = new Date();
for(let i=89;i>=0;i--){
const d=new Date(now); d.setDate(now.getDate()-i);
const ds=new Date(d.getFullYear(),d.getMonth(),d.getDate());
const de=new Date(ds); de.setDate(ds.getDate()+1);
const count=_lifeEntries.filter(e=>{const ed=new Date(e.date);return ed>=ds&&ed<de;}).length;
const op = count>=3?1:count===2?0.7:count===1?0.4:0.1;
const dot = document.createElement('div');
dot.style.cssText = `width:8px;height:8px;border-radius:2px;background:var(--life-c);opacity:${op};`;
dot.title = `${d.getDate()}.${d.getMonth()+1}: ${count} событий`;
el.appendChild(dot);
}
}
function renderLifeWishes() {
const el = document.getElementById('lifeWishList');
if (!el) return;
el.innerHTML = '';
_lifeWishes.forEach((w,i) => {
const row = document.createElement('div');
row.style.cssText = `display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);${w.done?'opacity:.4;':''}`;
row.innerHTML = `
<div onclick="toggleLifeWish(${i})" style="width:14px;height:14px;border-radius:2px;border:1px solid ${w.done?'var(--green)':'var(--border)'};background:${w.done?'var(--green-dim)':'transparent'};display:flex;align-items:center;justify-content:center;font-size:9px;color:${w.done?'var(--green)':'transparent'};cursor:pointer;flex-shrink:0;">${w.done?'+':''}</div>
<div style="flex:1;font-size:13px;color:var(--dim);${w.done?'text-decoration:line-through;':''}">${w.text}</div>
<span onclick="deleteLifeWish(${i})" style="color:var(--muted);cursor:pointer;font-size:14px;opacity:0;transition:opacity .15s;" onmouseenter="this.style.opacity=1" onmouseleave="this.style.opacity=0">x</span>`;
el.appendChild(row);
});
}
function addLifeWish() {
const inp = document.getElementById('lifeWishInput');
const text = inp.value.trim();
if (!text) return;
_lifeWishes.push({ text, done: false });
inp.value = '';
saveLifeWishes(); renderLifeWishes();
}
function toggleLifeWish(i) { _lifeWishes[i].done=!_lifeWishes[i].done; saveLifeWishes(); renderLifeWishes(); }
function deleteLifeWish(i) { _lifeWishes.splice(i,1); saveLifeWishes(); renderLifeWishes(); }
function saveLifeWishes() {
localStorage.setItem('life_wishes', JSON.stringify(_lifeWishes));
const q = document.getElementById('lifeMonthlyQ');
if (q) { _lifeMonthlyQ = q.textContent; localStorage.setItem('life_monthly_q', _lifeMonthlyQ); }
}
function renderLifeAll() {
renderLifeFeed();
renderLifeStats();
renderLifeCatBreakdown();
renderLifeHeatmap();
renderLifeWishes();
}
let _flyTab = 'today';
let _flyWeekOffset = 0;
let _editZoneId = null;
let _flyTimerInterval = null;
let _flyTimerSeconds = 0;
const FLY_ZONES_DEFAULT = [
{ id:'z1', name:'Коридор / Прихожая', week: 1, tasks:['Разобрать сумки у двери','Протереть зеркало и вешалку','Разобрать обувь (убрать лишнее)','Пол в коридоре (подмести + влажная)','Хот-спот у двери — очистить'] },
{ id:'z2', name:'Кухня',             week: 2, tasks:['Разобрать верхние шкафы','Протереть фасады','Холодильник — ревизия','Разобрать ящик с всяким','Столешница — глубокая чистка','Под мойкой — разобрать'] },
{ id:'z3', name:'Ванная / Туалет',   week: 3, tasks:['Ванна/душ — глубокая чистка','Зеркало и полочки','Под раковиной — разобрать','Смена косметики (убрать просроченное)','Полотенца — постирать и заменить'] },
{ id:'z4', name:'Спальня / Гостиная',week: 4, tasks:['Под кроватью — разобрать','Гардероб — ревизия','Книги и декор — разобрать','Диван — чистить, подушки','Тумбочки — разобрать','Полы — глубокая уборка'] },
{ id:'z5', name:'Рабочее место',     week: 5, tasks:['Стол — разобрать','Документы — разложить по папкам','Кабели — упорядочить','Полки с архивом','Итого — фото после всего'] },
];
const FLY_MORNING_DEFAULT = [
'Умыться, одеться',
'Застелить кровать',
'Кухня — 5 минут',
'Хот-спот — 2 минуты',
'Выпить стакан воды',
];
const FLY_EVENING_DEFAULT = [
'Переход (снять рабочий режим)',
'Кухня — прибрать',
'Зона — 15 минут',
'Подготовить завтра (одежда, сумка)',
'Записать 3 приоритета на завтра',
];
const FLY_WEEKLY_DEFAULT = [
{ day: 1, task: 'Пыль / 3 поверхности + мебель' },
{ day: 1, task: 'Час уборки (основной)' },
{ day: 2, task: 'Полы — метла по коридору + кухне' },
{ day: 3, task: 'Постирать (полотенца + постельное)' },
{ day: 4, task: 'Пылесос по всем комнатам' },
{ day: 5, task: 'Разобрать входящее / хот-споты' },
{ day: 6, task: 'Зона — глубокая уборка 15 мин' },
{ day: 7, task: 'Подготовка к новой неделе' },
];
function getFlyData() {
if (!D.modules.home.data.zones)    D.modules.home.data.zones    = JSON.parse(JSON.stringify(FLY_ZONES_DEFAULT));
if (!D.modules.home.data.morning)  D.modules.home.data.morning  = [...FLY_MORNING_DEFAULT];
if (!D.modules.home.data.evening)  D.modules.home.data.evening  = [...FLY_EVENING_DEFAULT];
if (!D.modules.home.data.weekly)   D.modules.home.data.weekly   = JSON.parse(JSON.stringify(FLY_WEEKLY_DEFAULT));
if (!D.modules.home.data.mission)  D.modules.home.data.mission  = [];
if (!D.modules.home.data.history)  D.modules.home.data.history  = {};
if (!D.modules.home.data.checks)   D.modules.home.data.checks   = {};
return D.modules.home.data;
}
function getFlyChecks(ds) {
const fd = getFlyData();
if (!fd.checks[ds]) fd.checks[ds] = { morning:{}, evening:{}, weekly:{}, zone:{} };
return fd.checks[ds];
}
function getCurrentZone() {
const fd = getFlyData();
const now = today();
const weekOfMonth = Math.ceil(now.getDate() / 7);
const zone = fd.zones.find(z => Number(z.week) === weekOfMonth) || fd.zones[0];
return zone;
}
function setFlyTab(tab, el) {
_flyTab = tab;
document.querySelectorAll('.fly-tab').forEach(t => {
t.style.color = 'var(--muted)'; t.style.borderBottomColor = 'transparent';
});
el.style.color = 'var(--home-c)'; el.style.borderBottomColor = 'var(--home-c)';
['today','week','zones','mission','history'].forEach(t => {
const el2 = document.getElementById('fly-'+t);
if (el2) el2.style.display = t === tab ? '' : 'none';
});
renderFlyTab(tab);
}
function renderHome() {
const zone = getCurrentZone();
if (document.getElementById('flyZoneName'))
document.getElementById('flyZoneName').textContent = zone?.name || '—';
renderFlyTab(_flyTab);
renderFlyProgress();
}
function renderFlyProgress() {
const ds = dateStr(today());
const checks = getFlyChecks(ds);
const fd = getFlyData();
let total = 0, done = 0;
fd.morning.forEach((_, i) => { total++; if (checks.morning[i]) done++; });
fd.evening.forEach((_, i) => { total++; if (checks.evening[i]) done++; });
const zone = getCurrentZone();
(zone?.tasks||[]).forEach((_, i) => { total++; if (checks.zone[i]) done++; });
const pct = total > 0 ? Math.round(done/total*100) : 0;
const el = document.getElementById('flyPct');
if (el) el.textContent = pct + '%';
}
function renderFlyTab(tab) {
if (tab === 'today')   renderFlyToday();
if (tab === 'week')    renderFlyWeek();
if (tab === 'zones')   renderFlyZones();
if (tab === 'mission') renderFlyMission();
if (tab === 'history') renderFlyHistory();
}
function renderFlyToday() {
const ds = dateStr(today());
const checks = getFlyChecks(ds);
const fd = getFlyData();
const mEl = document.getElementById('flyMorning');
if (mEl) {
mEl.innerHTML = '';
fd.morning.forEach((task, i) => {
mEl.appendChild(makeFlyCheck(task, !!checks.morning[i], () => {
checks.morning[i] = !checks.morning[i]; save(); renderFlyProgress();
const row = mEl.children[i]; if (row) row.classList.toggle('done', checks.morning[i]);
row?.querySelector('.cr-box')?.textContent && (row.querySelector('.cr-box').textContent = checks.morning[i] ? '+' : '');
}));
});
}
const eEl = document.getElementById('flyEvening');
if (eEl) {
eEl.innerHTML = '';
fd.evening.forEach((task, i) => {
eEl.appendChild(makeFlyCheck(task, !!checks.evening[i], () => {
checks.evening[i] = !checks.evening[i]; save(); renderFlyProgress();
}));
});
}
const zone = getCurrentZone();
const zEl = document.getElementById('flyTodayZoneTasks');
if (zEl) {
zEl.innerHTML = '';
if (!zone?.tasks?.length) {
zEl.innerHTML = '<div class="empty">Задач в зоне нет — настрой в разделе Зоны</div>';
} else {
zone.tasks.forEach((task, i) => {
zEl.appendChild(makeFlyCheck(task, !!checks.zone[i], () => {
checks.zone[i] = !checks.zone[i];
if (!fd.history[ds]) fd.history[ds] = {};
fd.history[ds][zone.id] = (fd.history[ds][zone.id]||0) + (checks.zone[i] ? 1 : -1);
save(); renderFlyProgress();
}));
});
}
}
}
function makeFlyCheck(text, done, onClick) {
const row = document.createElement('div');
row.className = `cr${done?' done':''}`;
row.style.borderLeftColor = 'var(--home-c)';
row.onclick = () => { onClick(); row.classList.toggle('done'); const box = row.querySelector('.cr-box'); if(box) box.textContent = row.classList.contains('done')?'+':''; };
row.innerHTML = `<div class="cr-box">${done?'+':''}</div><div class="cr-txt">${text}</div>`;
return row;
}
const FLY_TIMER_BLOCKS = [
{num:1, name:'Пыль / поверхности', tasks:'3 поверхности, пыль на 1 мебели', min:15},
{num:2, name:'Полы', tasks:'Метла по коридору+кухне, пылесос', min:15},
{num:3, name:'Текстиль', tasks:'Полотенца кухня+ванная, постельное', min:15},
{num:4, name:'Контроль', tasks:'Пакет мусора, хот-споты, фото после', min:15},
];
let _flyTimerBlock = 0;
function startFlyTimer() {
if (_flyTimerInterval) {
clearInterval(_flyTimerInterval); _flyTimerInterval = null;
document.getElementById('flyTimerBtn').textContent = 'Таймер 15 мин';
document.getElementById('flyTimerDisplay').style.display = 'none';
return;
}
const tb = FLY_TIMER_BLOCKS[_flyTimerBlock];
_flyTimerSeconds = tb.min * 60;
const display = document.getElementById('flyTimerDisplay');
const tb2 = FLY_TIMER_BLOCKS[_flyTimerBlock];
display.style.display = '';
display.innerHTML = `<div style="font-size:10px;color:var(--muted);letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;">Блок ${tb2.num} — ${tb2.name}</div><div id="flyTimerTime" style="font-family:var(--font-s);font-size:38px;font-weight:300;color:var(--home-c);">${tb2.min}:00</div><div style="font-size:11px;color:var(--muted);margin-top:4px;">${tb2.tasks}</div>`;
document.getElementById('flyTimerBtn').textContent = 'Стоп';
_flyTimerInterval = setInterval(() => {
_flyTimerSeconds--;
const m = Math.floor(_flyTimerSeconds / 60);
const s = _flyTimerSeconds % 60;
const tel = document.getElementById('flyTimerTime');
if (tel) tel.textContent = `${m}:${String(s).padStart(2,'0')}`;
if (_flyTimerSeconds <= 0) {
clearInterval(_flyTimerInterval); _flyTimerInterval = null;
if (tel) tel.textContent = 'Готово!';
document.getElementById('flyTimerBtn').textContent = 'Таймер 15 мин';
_flyTimerBlock = Math.min(_flyTimerBlock + 1, FLY_TIMER_BLOCKS.length - 1);
const next = FLY_TIMER_BLOCKS[_flyTimerBlock];
toast('Блок ' + tb2.num + ' — готово! ' + (tb2.num < 4 ? 'Дальше: ' + next.name : 'Все блоки!'));
}
}, 1000);
}
function nextTimerBlock(d) {
_flyTimerBlock = Math.max(0, Math.min(FLY_TIMER_BLOCKS.length-1, _flyTimerBlock + d));
if (!_flyTimerInterval) { _flyTimerSeconds = FLY_TIMER_BLOCKS[_flyTimerBlock].min * 60; }
}
function openZoneTaskForm() {
const task = prompt('Задача для зоны сегодня:');
if (!task?.trim()) return;
const zone = getCurrentZone();
if (!zone) return;
if (!zone.tasks) zone.tasks = [];
zone.tasks.push(task.trim());
save(); renderFlyToday(); toast('Задача добавлена');
}
function navFlyWeek(d) {
_flyWeekOffset += d;
if (_flyWeekOffset > 0) _flyWeekOffset = 0;
renderFlyWeek();
}
function renderFlyWeek() {
const { mon, sun } = getWeekBounds(_flyWeekOffset);
const fd = getFlyData();
if (document.getElementById('flyWeekLabel'))
document.getElementById('flyWeekLabel').textContent = fmtShort(mon) + ' — ' + fmtShort(sun);
if (document.getElementById('btnFlyWeekNext'))
document.getElementById('btnFlyWeekNext').disabled = _flyWeekOffset >= 0;
const grid = document.getElementById('flyWeekGrid');
if (!grid) return;
grid.innerHTML = '';
const DNAMES = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const todayStr = dateStr(today());
for (let i = 0; i < 7; i++) {
const d = new Date(mon); d.setDate(mon.getDate() + i);
const ds = dateStr(d);
const checks = getFlyChecks(ds);
const isToday = ds === todayStr;
const weeklyForDay = fd.weekly.filter(w => Number(w.day) === i+1);
const col = document.createElement('div');
col.style.cssText = `padding:10px 12px;border-bottom:1px solid var(--border);${isToday?'background:var(--gold-bg);':''}`;
col.innerHTML = `<div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:${isToday?'var(--home-c)':'var(--muted)'};margin-bottom:6px;">${DNAMES[i]} ${d.getDate()}</div>`;
if (!weeklyForDay.length) {
const empty = document.createElement('div');
empty.className = 'empty';
empty.textContent = 'Задач нет';
col.appendChild(empty);
} else {
weeklyForDay.forEach((w, wi) => {
const key = `${i}_${wi}`;
const done = !!checks.weekly[key];
const row = makeFlyCheck(w.task, done, () => {
checks.weekly[key] = !checks.weekly[key]; save();
row.classList.toggle('done', checks.weekly[key]);
row.querySelector('.cr-box').textContent = checks.weekly[key] ? '+' : '';
});
col.appendChild(row);
});
}
grid.appendChild(col);
}
}
function openWeeklyTaskForm() {
const fd = getFlyData();
const day = prompt('День недели (1=Пн, 2=Вт, 3=Ср, 4=Чт, 5=Пт, 6=Сб, 7=Вс):');
if (!day || isNaN(day)) return;
const task = prompt('Задача:');
if (!task?.trim()) return;
fd.weekly.push({ day: Number(day), task: task.trim() });
save(); renderFlyWeek(); toast('Задача добавлена');
}
function renderFlyZones() {
const fd = getFlyData();
const el = document.getElementById('flyZonesList');
if (!el) return;
el.innerHTML = '';
fd.zones.forEach(zone => {
const weekOfMonth = Math.ceil(today().getDate() / 7);
const isCurrent = Number(zone.week) === weekOfMonth;
const block = document.createElement('div');
block.style.cssText = `padding:14px 20px;border-bottom:1px solid var(--border);${isCurrent?'background:var(--gold-bg);':''}`;
block.innerHTML = `
<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
<div style="flex:1;">
<div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:${isCurrent?'var(--home-c)':'var(--muted)'};margin-bottom:2px;">Неделя ${zone.week}${isCurrent?' — сейчас':''}</div>
<div style="font-size:15px;color:var(--dim);">${zone.name}</div>
</div>
<button onclick="openZoneForm('${zone.id}')" class="btn btn-sm">Изменить</button>
</div>
<div style="display:flex;flex-direction:column;gap:3px;">
${(zone.tasks||[]).map(t => `<div style="font-size:12px;color:var(--muted);padding:3px 0;border-bottom:1px solid var(--border);">${t}</div>`).join('')}
</div>
`;
el.appendChild(block);
});
}
function openZoneForm(id) {
_editZoneId = id;
const fd = getFlyData();
const z = id ? fd.zones.find(x => x.id === id) : null;
document.getElementById('zoneFormTitle').textContent = id ? 'Редактировать зону' : 'Новая зона';
document.getElementById('zf-name').value  = z?.name  || '';
document.getElementById('zf-week').value  = z?.week  || '1';
document.getElementById('zf-tasks').value = (z?.tasks||[]).join('\n');
document.getElementById('btnDeleteZone').style.display = id ? '' : 'none';
document.getElementById('zoneFormModal').classList.add('open');
setTimeout(() => document.getElementById('zf-name').focus(), 80);
}
function closeZoneForm() {
document.getElementById('zoneFormModal').classList.remove('open');
}
function saveZone() {
const name = document.getElementById('zf-name').value.trim();
if (!name) { toast('Укажи название'); return; }
const fd = getFlyData();
const tasks = document.getElementById('zf-tasks').value.split('\n').map(t=>t.trim()).filter(Boolean);
const zone = { id: _editZoneId||uid(), name, week: Number(document.getElementById('zf-week').value), tasks };
if (_editZoneId) {
const idx = fd.zones.findIndex(x => x.id === _editZoneId);
if (idx >= 0) fd.zones[idx] = zone;
} else {
fd.zones.push(zone);
}
save(); closeZoneForm(); renderFlyZones();
toast('Зона сохранена');
}
function deleteZone() {
if (!_editZoneId || !confirm('Удалить зону?')) return;
const fd = getFlyData();
fd.zones = fd.zones.filter(z => z.id !== _editZoneId);
save(); closeZoneForm(); renderFlyZones();
toast('Удалено');
}
function renderFlyMission() {
const fd = getFlyData();
const now = today();
const el = document.getElementById('flyMissionList');
const mEl = document.getElementById('flyMissionMonth');
if (mEl) mEl.textContent = MONTHS[now.getMonth()].charAt(0).toUpperCase() + MONTHS[now.getMonth()].slice(1) + ' ' + now.getFullYear();
if (!el) return;
if (!fd.mission.length) { el.innerHTML = '<div class="empty" style="padding:12px 0;">Миссий нет — добавь большую уборку или реорганизацию</div>'; return; }
el.innerHTML = '';
fd.mission.forEach((m, i) => {
const row = document.createElement('div');
row.className = `cr${m.done?' done':''}`;
row.style.borderLeftColor = 'var(--home-c)';
row.onclick = () => {
m.done = !m.done; save(); renderFlyMission();
};
row.innerHTML = `
<div class="cr-box">${m.done?'+':''}</div>
<div class="cr-txt">${m.text}</div>
<span class="cr-del" onclick="event.stopPropagation();fd.mission.splice(${i},1);save();renderFlyMission()">x</span>
`;
el.appendChild(row);
});
}
function openMissionTaskForm() {
const text = prompt('Задача миссии (большая уборка/реорганизация):');
if (!text?.trim()) return;
const fd = getFlyData();
fd.mission.push({ id:uid(), text:text.trim(), done:false });
save(); renderFlyMission(); toast('Задача добавлена');
}
function renderFlyHistory() {
const fd = getFlyData();
const el = document.getElementById('flyHistoryGrid');
if (!el) return;
el.innerHTML = '';
const DNAMES = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const now = today();
const dow = now.getDay();
const mon0 = new Date(now);
mon0.setDate(now.getDate() - (dow===0?6:dow-1));
mon0.setHours(0,0,0,0);
for (let w = -3; w <= 0; w++) {
const wStart = new Date(mon0); wStart.setDate(mon0.getDate() + w*7);
const wRow = document.createElement('div');
wRow.style.cssText = 'margin-bottom:16px;';
wRow.innerHTML = `<div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:6px;">${fmtShort(wStart)} — ${fmtShort(new Date(wStart.getTime()+6*86400000))}</div>`;
const daysRow = document.createElement('div');
daysRow.style.cssText = 'display:grid;grid-template-columns:repeat(7,1fr);gap:4px;';
for (let d = 0; d < 7; d++) {
const day = new Date(wStart); day.setDate(wStart.getDate()+d);
const ds = dateStr(day);
const checks = fd.checks[ds];
const isFuture = day > now;
let done = 0, total = 0;
if (checks) {
Object.values(checks.morning||{}).forEach(v => { total++; if(v) done++; });
Object.values(checks.evening||{}).forEach(v => { total++; if(v) done++; });
Object.values(checks.zone||{}).forEach(v => { total++; if(v) done++; });
}
const pct = total > 0 ? done/total : 0;
const opacity = isFuture ? 0 : (total === 0 ? 0.15 : 0.2 + pct*0.8);
const cell = document.createElement('div');
cell.title = `${fmtShort(day)}: ${done}/${total}`;
cell.style.cssText = `height:28px;background:var(--home-c);border-radius:3px;opacity:${opacity.toFixed(2)};`;
const lbl = document.createElement('div');
lbl.style.cssText = 'font-size:9px;color:var(--muted);text-align:center;margin-top:3px;';
lbl.textContent = DNAMES[d][0];
const wrap = document.createElement('div');
wrap.style.cssText = 'text-align:center;';
wrap.appendChild(cell);
wrap.appendChild(lbl);
daysRow.appendChild(wrap);
}
wRow.appendChild(daysRow);
el.appendChild(wRow);
}
}