import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, updateProfile } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, doc, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, writeBatch, serverTimestamp, arrayUnion, arrayRemove, deleteField } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });

if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = (n) => (Number(n) || 0).toFixed(2);
const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => ymd(new Date());
const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16", "#64748b"];
const DEFAULT_CATS = ["餐饮", "交通", "购物", "娱乐", "居住", "其他"];
const toast = (m) => { const t = $("#toast"); t.textContent = m; t.classList.remove("hidden"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.add("hidden"), 2200); };
const errMsg = (e) => ({ "auth/invalid-email": "邮箱格式不正确", "auth/email-already-in-use": "该邮箱已注册", "auth/weak-password": "密码至少6位", "auth/invalid-credential": "邮箱或密码错误", "auth/wrong-password": "邮箱或密码错误", "auth/user-not-found": "账号不存在", "auth/too-many-requests": "尝试次数过多，请稍后再试", "auth/network-request-failed": "网络错误", "permission-denied": "没有权限" }[e.code] || e.message);

const S = { user: null, wsList: [], invites: [], wsId: null, cats: [], cards: [], expenses: [], funds: [], txns: {}, month: new Date(), mode: "cat", page: "home" };
let unsubWs = [], unsubData = [], unsubTxns = {}, chart = null;
const ws = () => S.wsList.find((w) => w.id === S.wsId);
const wsRef = (...p) => (p.length ? collection(db, "workspaces", S.wsId, ...p) : doc(db, "workspaces", S.wsId));
const memberName = (uid) => { const i = ws()?.memberInfo?.[uid]; return i ? i.name || i.email : "未知成员"; };

/* ---------- Auth ---------- */
let regMode = false;
$("#au-toggle").onclick = () => { regMode = !regMode; $("#au-name").classList.toggle("hidden", !regMode); $("#au-submit").textContent = regMode ? "注册" : "登录"; $("#au-toggle").textContent = regMode ? "已有账号？登录" : "没有账号？注册"; };
$("#au-submit").onclick = async () => {
  const email = $("#au-email").value.trim(), pass = $("#au-pass").value;
  $("#au-msg").textContent = "请稍候…";
  try {
    if (regMode) {
      const c = await createUserWithEmailAndPassword(auth, email, pass);
      const name = $("#au-name").value.trim() || email.split("@")[0];
      await updateProfile(c.user, { displayName: name });
      await createWorkspace("个人账本", c.user);
    } else await signInWithEmailAndPassword(auth, email, pass);
    $("#au-msg").textContent = "";
  } catch (e) { $("#au-msg").textContent = errMsg(e); }
};
$("#au-reset").onclick = async () => {
  const email = $("#au-email").value.trim();
  if (!email) return ($("#au-msg").textContent = "请先输入邮箱");
  try { await sendPasswordResetEmail(auth, email); $("#au-msg").textContent = "重置邮件已发送，请查收邮箱（含垃圾箱）"; } catch (e) { $("#au-msg").textContent = errMsg(e); }
};

onAuthStateChanged(auth, (u) => {
  unsubWs.forEach((f) => f()); unsubWs = []; clearData();
  S.user = u;
  $("#auth").classList.toggle("hidden", !!u); $("#main").classList.toggle("hidden", !u);
  if (!u) return;
  const email = (u.email || "").toLowerCase();
  let firstLoad = true;
  unsubWs.push(onSnapshot(query(collection(db, "workspaces"), where("members", "array-contains", u.uid)), (snap) => {
    S.wsList = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
    if (!S.wsList.length && firstLoad && !snap.metadata.fromCache) { firstLoad = false; createWorkspace("个人账本", u); return; }
    firstLoad = false;
    const saved = localStorage.getItem("ws_" + u.uid);
    if (!ws()) switchWs((S.wsList.find((w) => w.id === saved) || S.wsList[0])?.id);
    else { renderTop(); renderAll(); }
  }, (e) => toast(errMsg(e))));
  unsubWs.push(onSnapshot(query(collection(db, "workspaces"), where("invitedEmails", "array-contains", email)), (snap) => {
    S.invites = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((w) => !(w.members || []).includes(u.uid));
    renderInvites();
  }, () => {}));
});

function createWorkspace(name, u = S.user) {
  const ref = doc(collection(db, "workspaces"));
  const b = writeBatch(db);
  b.set(ref, { name, ownerUid: u.uid, members: [u.uid], memberInfo: { [u.uid]: { email: (u.email || "").toLowerCase(), name: u.displayName || u.email.split("@")[0] } }, invitedEmails: [], createdAt: serverTimestamp() });
  DEFAULT_CATS.forEach((c, i) => b.set(doc(collection(ref, "categories")), { name: c, order: i, createdAt: serverTimestamp() }));
  b.set(doc(collection(ref, "cards")), { name: "默认卡", createdAt: serverTimestamp() });
  b.commit().catch((e) => toast(errMsg(e))); // offline-friendly: don't await server
  return ref.id;
}

function clearData() {
  unsubData.forEach((f) => f()); unsubData = [];
  Object.values(unsubTxns).forEach((f) => f()); unsubTxns = {};
  Object.assign(S, { cats: [], cards: [], expenses: [], funds: [], txns: {} });
}

function switchWs(id) {
  clearData(); S.wsId = id || null;
  if (!id) { renderTop(); renderAll(); return; }
  localStorage.setItem("ws_" + S.user.uid, id);
  const byTime = (a, b) => (a.order ?? 99) - (b.order ?? 99) || (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
  const sub = (name, key, after) => unsubData.push(onSnapshot(wsRef(name), (s) => { S[key] = s.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byTime); after && after(); renderAll(); }, (e) => toast(errMsg(e))));
  sub("categories", "cats"); sub("cards", "cards"); sub("funds", "funds", syncTxns);
  subExpenses(); renderTop(); renderAll();
}
function subExpenses() {
  if (S.expUnsub) S.expUnsub();
  const y = S.month.getFullYear(), m = S.month.getMonth();
  const start = `${y}-${pad(m + 1)}-01`, end = `${y}-${pad(m + 1)}-31`;
  // single-field range query => no composite index needed; sorted client-side
  S.expUnsub = onSnapshot(query(wsRef("expenses"), where("date", ">=", start), where("date", "<=", end)), (s) => { S.expenses = s.docs.map((d) => ({ id: d.id, ...d.data() })); renderHome(); }, (e) => toast(errMsg(e)));
  unsubData.push(() => { S.expUnsub && S.expUnsub(); S.expUnsub = null; });
}
function syncTxns() {
  const ids = S.funds.map((f) => f.id);
  Object.keys(unsubTxns).forEach((id) => { if (!ids.includes(id)) { unsubTxns[id](); delete unsubTxns[id]; delete S.txns[id]; } });
  ids.forEach((id) => { if (!unsubTxns[id]) unsubTxns[id] = onSnapshot(wsRef("funds", id, "txns"), (s) => { S.txns[id] = s.docs.map((d) => ({ id: d.id, ...d.data() })); renderFunds(); }); });
}

/* ---------- Navigation ---------- */
document.querySelectorAll(".tabs button").forEach((b) => (b.onclick = () => {
  S.page = b.dataset.p;
  document.querySelectorAll(".tabs button").forEach((x) => x.classList.toggle("on", x === b));
  ["home", "funds", "settings"].forEach((p) => $("#page-" + p).classList.toggle("hidden", p !== S.page));
  window.scrollTo(0, 0); renderAll();
}));
$("#m-prev").onclick = () => { S.month = new Date(S.month.getFullYear(), S.month.getMonth() - 1, 1); subExpenses(); renderHome(); };
$("#m-next").onclick = () => { S.month = new Date(S.month.getFullYear(), S.month.getMonth() + 1, 1); subExpenses(); renderHome(); };
document.querySelectorAll("#chart-mode button").forEach((b) => (b.onclick = () => { S.mode = b.dataset.m; document.querySelectorAll("#chart-mode button").forEach((x) => x.classList.toggle("on", x === b)); renderHome(); }));
$("#fab").onclick = () => openExpense();
$("#fund-add").onclick = () => openFundForm();
$("#ws-btn").onclick = openWsPicker;
$("#modal").onclick = (e) => { if (e.target.id === "modal") closeModal(); };
function openModal(html) { $("#sheet").innerHTML = html; $("#modal").classList.remove("hidden"); }
function closeModal() { $("#modal").classList.add("hidden"); $("#sheet").innerHTML = ""; }

function renderTop() { $("#ws-btn").textContent = (ws()?.name || "无账本") + " ▾"; }
function renderAll() { renderTop(); if (S.page === "home") renderHome(); if (S.page === "funds") renderFunds(); if (S.page === "settings") renderSettings(); }
function renderInvites() {
  $("#invites").innerHTML = S.invites.map((w) => `<div class="invite"><span>📩 ${esc(memberNameOf(w, w.ownerUid))} 邀请你加入「${esc(w.name)}」</span><span><button class="btn small primary" data-acc="${w.id}">接受</button> <button class="btn small" data-dec="${w.id}">忽略</button></span></div>`).join("");
  $("#invites").querySelectorAll("[data-acc]").forEach((b) => (b.onclick = () => acceptInvite(b.dataset.acc)));
  $("#invites").querySelectorAll("[data-dec]").forEach((b) => (b.onclick = () => declineInvite(b.dataset.dec)));
}
const memberNameOf = (w, uid) => w.memberInfo?.[uid]?.name || w.memberInfo?.[uid]?.email || "有人";
async function acceptInvite(id) {
  const u = S.user, email = u.email.toLowerCase();
  try {
    await updateDoc(doc(db, "workspaces", id), { members: arrayUnion(u.uid), [`memberInfo.${u.uid}`]: { email, name: u.displayName || email.split("@")[0] }, invitedEmails: arrayRemove(email) });
    toast("已加入"); switchWs(id);
  } catch (e) { toast(errMsg(e)); }
}
async function declineInvite(id) {
  try { await updateDoc(doc(db, "workspaces", id), { invitedEmails: arrayRemove(S.user.email.toLowerCase()) }); } catch (e) { toast(errMsg(e)); }
}

/* ---------- Home ---------- */
function renderHome() {
  $("#m-label").textContent = `${S.month.getFullYear()}年${S.month.getMonth() + 1}月`;
  const ex = [...S.expenses].sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  const total = ex.reduce((s, e) => s + Number(e.amount || 0), 0);
  $("#m-total").textContent = "¥" + money(total);
  const catName = (id) => S.cats.find((c) => c.id === id)?.name || "未分类";
  const cardName = (id) => S.cards.find((c) => c.id === id)?.name || "未指定";
  const keyFn = { cat: (e) => catName(e.categoryId), card: (e) => cardName(e.cardId), member: (e) => memberName(e.memberUid) }[S.mode];
  const groups = {};
  ex.forEach((e) => (groups[keyFn(e)] = (groups[keyFn(e)] || 0) + Number(e.amount || 0)));
  const labels = Object.keys(groups).sort((a, b) => groups[b] - groups[a]), data = labels.map((l) => groups[l]);
  const colors = labels.map((_, i) => COLORS[i % COLORS.length]);
  if (window.Chart) {
    if (!chart) chart = new Chart($("#pie"), { type: "doughnut", data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 2 }] }, options: { cutout: "62%", plugins: { legend: { display: false } }, animation: { duration: 300 } } });
    else { chart.data.labels = labels; chart.data.datasets[0].data = data; chart.data.datasets[0].backgroundColor = colors; chart.update(); }
  }
  $("#legend").innerHTML = labels.map((l, i) => `<span><i style="background:${colors[i]}"></i>${esc(l)} ¥${money(data[i])} (${total ? Math.round((data[i] / total) * 100) : 0}%)</span>`).join("");
  const byDay = {};
  ex.forEach((e) => (byDay[e.date] = byDay[e.date] || []).push(e));
  const wk = "日一二三四五六";
  $("#exp-list").innerHTML = ex.length ? Object.keys(byDay).map((d) => {
    const items = byDay[d], sum = items.reduce((s, e) => s + Number(e.amount || 0), 0), dt = new Date(d + "T00:00:00");
    return `<div class="day-h"><span>${dt.getMonth() + 1}月${dt.getDate()}日 周${wk[dt.getDay()]}</span><span>¥${money(sum)}</span></div><div class="card" style="padding:0 14px">` +
      items.map((e) => { const cn = catName(e.categoryId), ci = Math.max(0, S.cats.findIndex((c) => c.id === e.categoryId));
        return `<div class="item" data-id="${e.id}"><div class="ic" style="background:${COLORS[ci % COLORS.length]}">${esc(cn[0])}</div><div class="mid"><div>${esc(cn)}</div><div class="sub">${esc(cardName(e.cardId))} · ${esc(memberName(e.memberUid))}${e.remark ? " · " + esc(e.remark) : ""}</div></div><div class="amt">-${money(e.amount)}</div></div>`; }).join("") + `</div>`;
  }).join("") : `<div class="empty">本月还没有记录，点右下角 ＋ 记一笔</div>`;
  $("#exp-list").querySelectorAll(".item").forEach((el) => (el.onclick = () => openExpense(S.expenses.find((e) => e.id === el.dataset.id))));
}
const opts = (arr, sel, label = (x) => x.name, val = (x) => x.id) => arr.map((x) => `<option value="${esc(val(x))}" ${val(x) === sel ? "selected" : ""}>${esc(label(x))}</option>`).join("");
function memberList() { const w = ws(); return (w?.members || []).map((uid) => ({ id: uid, name: memberName(uid) })); }

function openExpense(e) {
  if (!S.wsId) return toast("请先创建账本");
  openModal(`<h3>${e ? "编辑" : "记一笔"}</h3>
  <label>金额</label><input id="f-amt" type="number" inputmode="decimal" step="0.01" placeholder="0.00" value="${e ? esc(e.amount) : ""}">
  <label>日期</label><input id="f-date" type="date" value="${e?.date || today()}">
  <label>分类</label><select id="f-cat">${opts(S.cats, e?.categoryId)}</select>
  <label>银行卡</label><select id="f-card">${opts(S.cards, e?.cardId)}</select>
  <label>付款人</label><select id="f-mem">${opts(memberList(), e?.memberUid || S.user.uid)}</select>
  <label>备注</label><input id="f-rem" type="text" placeholder="可选" value="${esc(e?.remark || "")}">
  <div class="btns">${e ? `<button class="btn danger" id="f-del">删除</button>` : ""}<button class="btn" id="f-cancel">取消</button><button class="btn primary" id="f-save">保存</button></div>`);
  if (!e) setTimeout(() => $("#f-amt")?.focus(), 100);
  $("#f-cancel").onclick = closeModal;
  $("#f-save").onclick = () => {
    const amount = Math.round(parseFloat($("#f-amt").value) * 100) / 100;
    if (!(amount > 0)) return toast("请输入金额");
    const data = { date: $("#f-date").value || today(), amount, categoryId: $("#f-cat").value, cardId: $("#f-card").value, memberUid: $("#f-mem").value, remark: $("#f-rem").value.trim() };
    const p = e ? updateDoc(doc(wsRef("expenses"), e.id), data) : addDoc(wsRef("expenses"), { ...data, createdBy: S.user.uid, createdAt: serverTimestamp() });
    p.catch((x) => toast(errMsg(x))); closeModal(); toast("已保存");
  };
  if (e) $("#f-del").onclick = () => { if (confirm("确定删除这笔记录？")) { deleteDoc(doc(wsRef("expenses"), e.id)).catch((x) => toast(errMsg(x))); closeModal(); } };
}

/* ---------- Workspaces ---------- */
function openWsPicker() {
  openModal(`<h3>切换账本</h3>${S.wsList.map((w) => `<div class="ws-opt ${w.id === S.wsId ? "on" : ""}" data-id="${w.id}"><span>${esc(w.name)}</span><span class="muted">${(w.members || []).length}人</span></div>`).join("")}
  <div class="inline"><input id="ws-new" placeholder="新账本名称，如 情侣账本"><button class="btn primary" id="ws-create">创建</button></div>`);
  $("#sheet").querySelectorAll(".ws-opt").forEach((el) => (el.onclick = () => { switchWs(el.dataset.id); closeModal(); }));
  $("#ws-create").onclick = () => { const n = $("#ws-new").value.trim(); if (!n) return toast("请输入名称"); const id = createWorkspace(n); closeModal(); localStorage.setItem("ws_" + S.user.uid, id); toast("已创建"); setTimeout(() => { if (S.wsList.find((w) => w.id === id)) switchWs(id); }, 400); };
}

/* ---------- Funds ---------- */
function fundStats(f) {
  const tx = S.txns[f.id] || [];
  let bal = 0; const per = {};
  tx.forEach((t) => { const v = Number(t.amount || 0) * (t.type === "withdraw" ? -1 : 1); bal += v; per[t.memberUid] = (per[t.memberUid] || 0) + v; });
  return { tx, bal, per };
}
function renderFunds() {
  if (S.page !== "funds") return;
  $("#fund-list").innerHTML = S.funds.length ? S.funds.map((f) => {
    const { bal, per } = fundStats(f), pct = f.target > 0 ? Math.min(100, Math.max(0, (bal / f.target) * 100)) : 0;
    const pos = Object.entries(per).filter(([, v]) => v > 0), sum = pos.reduce((s, [, v]) => s + v, 0);
    return `<div class="card fund" data-id="${f.id}"><div class="sec-head"><b>${esc(f.name)}</b><span class="muted">${pct.toFixed(0)}%</span></div>
      <div class="bar"><div style="width:${pct}%"></div></div><div class="muted">已存 ¥${money(bal)} / 目标 ¥${money(f.target)}</div>
      ${pos.map(([uid, v], i) => `<div class="mbar"><span style="width:70px;overflow:hidden">${esc(memberName(uid))}</span><div class="bar"><div style="width:${(v / sum) * 100}%;background:${COLORS[(i + 1) % COLORS.length]}"></div></div><span>${Math.round((v / sum) * 100)}%</span></div>`).join("")}</div>`;
  }).join("") : `<div class="empty">还没有存款目标，点击「新建」开始存钱吧</div>`;
  $("#fund-list").querySelectorAll(".fund").forEach((el) => (el.onclick = () => openFund(el.dataset.id)));
}
function openFundForm(f) {
  openModal(`<h3>${f ? "编辑目标" : "新建存款目标"}</h3><label>名称</label><input id="fd-name" value="${esc(f?.name || "")}" placeholder="如 旅行基金">
  <label>目标金额</label><input id="fd-target" type="number" inputmode="decimal" value="${f ? esc(f.target) : ""}">
  <div class="btns"><button class="btn" id="fd-cancel">取消</button><button class="btn primary" id="fd-save">保存</button></div>`);
  $("#fd-cancel").onclick = closeModal;
  $("#fd-save").onclick = () => {
    const name = $("#fd-name").value.trim(), target = parseFloat($("#fd-target").value) || 0;
    if (!name) return toast("请输入名称");
    (f ? updateDoc(doc(wsRef("funds"), f.id), { name, target }) : addDoc(wsRef("funds"), { name, target, createdAt: serverTimestamp() })).catch((x) => toast(errMsg(x)));
    closeModal();
  };
}
function openFund(id) {
  const f = S.funds.find((x) => x.id === id); if (!f) return;
  const { tx, bal } = fundStats(f);
  const list = [...tx].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  openModal(`<div class="sec-head"><h3>${esc(f.name)}</h3><span><button class="btn small" id="fu-edit">编辑</button> <button class="btn small danger" id="fu-del">删除</button></span></div>
  <div class="muted">余额 ¥${money(bal)} / 目标 ¥${money(f.target)}</div>
  <div class="seg" id="fu-type" style="margin-top:10px"><button data-t="deposit" class="on">存入</button><button data-t="withdraw">取出</button></div>
  <input id="fu-amt" type="number" inputmode="decimal" placeholder="金额"><input id="fu-date" type="date" value="${today()}">
  <select id="fu-mem">${opts(memberList(), S.user.uid)}</select><input id="fu-rem" placeholder="备注（可选）">
  <button class="btn primary block" id="fu-save">确认</button>
  <h3 style="margin-top:16px">记录</h3>${list.length ? list.map((t) => `<div class="list-row"><span>${t.type === "withdraw" ? "取出" : "存入"} · ${esc(memberName(t.memberUid))}<br><span class="muted">${esc(t.date)} ${esc(t.remark || "")}</span></span><span>${t.type === "withdraw" ? "-" : "+"}${money(t.amount)} <a class="del" data-tid="${t.id}">删除</a></span></div>`).join("") : `<div class="muted">暂无记录</div>`}
  <button class="btn block" id="fu-close">关闭</button>`);
  let type = "deposit";
  $("#fu-type").querySelectorAll("button").forEach((b) => (b.onclick = () => { type = b.dataset.t; $("#fu-type").querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b)); }));
  $("#fu-close").onclick = closeModal;
  $("#fu-edit").onclick = () => openFundForm(f);
  $("#fu-del").onclick = async () => {
    if (!confirm("删除该目标及所有记录？")) return;
    const b = writeBatch(db); tx.forEach((t) => b.delete(doc(wsRef("funds", f.id, "txns"), t.id))); b.delete(doc(wsRef("funds"), f.id));
    b.commit().catch((x) => toast(errMsg(x))); closeModal();
  };
  $("#fu-save").onclick = () => {
    const amount = Math.round(parseFloat($("#fu-amt").value) * 100) / 100;
    if (!(amount > 0)) return toast("请输入金额");
    addDoc(wsRef("funds", f.id, "txns"), { type, amount, date: $("#fu-date").value || today(), memberUid: $("#fu-mem").value, remark: $("#fu-rem").value.trim(), createdAt: serverTimestamp() }).catch((x) => toast(errMsg(x)));
    toast("已记录"); setTimeout(() => openFund(f.id), 150);
  };
  $("#sheet").querySelectorAll("[data-tid]").forEach((a) => (a.onclick = () => { if (confirm("删除这条记录？")) { deleteDoc(doc(wsRef("funds", f.id, "txns"), a.dataset.tid)); setTimeout(() => openFund(f.id), 150); } }));
}

/* ---------- Settings ---------- */
function renderSettings() {
  const w = ws(), el = $("#settings");
  if (!w) { el.innerHTML = `<div class="card">暂无账本</div><button class="btn danger block" id="s-logout">退出登录</button>`; $("#s-logout").onclick = () => signOut(auth); return; }
  const isOwner = w.ownerUid === S.user.uid;
  const row = (x, kind) => `<div class="list-row"><span>${esc(x.name)}</span><a class="del" data-k="${kind}" data-id="${x.id}">删除</a></div>`;
  el.innerHTML = `
  <div class="card"><b>账本名称</b><div class="inline"><input id="s-name" value="${esc(w.name)}"><button class="btn primary" id="s-rename">保存</button></div></div>
  <div class="card"><b>分类</b>${S.cats.map((c) => row(c, "categories")).join("")}<div class="inline"><input id="s-cat" placeholder="新分类"><button class="btn primary" id="s-addcat">添加</button></div></div>
  <div class="card"><b>银行卡 / 账户</b>${S.cards.map((c) => row(c, "cards")).join("")}<div class="inline"><input id="s-card" placeholder="如 招商银行信用卡"><button class="btn primary" id="s-addcard">添加</button></div></div>
  <div class="card"><b>成员</b>${(w.members || []).map((uid) => `<div class="list-row"><span>${esc(memberName(uid))}${uid === w.ownerUid ? ' <span class="muted">（创建者）</span>' : ""}<br><span class="muted">${esc(w.memberInfo?.[uid]?.email || "")}</span></span>${isOwner && uid !== w.ownerUid ? `<a class="del" data-rm="${uid}">移除</a>` : ""}</div>`).join("")}
    ${(w.invitedEmails || []).map((e) => `<div class="list-row"><span class="muted">⏳ ${esc(e)}（待接受）</span><a class="del" data-unv="${esc(e)}">撤销</a></div>`).join("")}
    <div class="inline"><input id="s-inv" type="email" placeholder="对方注册用的邮箱"><button class="btn primary" id="s-invite">邀请</button></div>
    <div class="muted">对方用该邮箱登录后，会在顶部看到邀请并可接受。</div></div>
  <div class="card"><b>我的账号</b><div class="muted">${esc(S.user.displayName || "")} ${esc(S.user.email)}</div>
    ${!isOwner ? `<button class="btn danger block" id="s-leave">退出此账本</button>` : ""}<button class="btn block" id="s-logout">退出登录</button></div>`;
  $("#s-rename").onclick = () => { const n = $("#s-name").value.trim(); if (n) updateDoc(wsRef(), { name: n }).then(() => toast("已保存")).catch((x) => toast(errMsg(x))); };
  $("#s-addcat").onclick = () => { const n = $("#s-cat").value.trim(); if (n) addDoc(wsRef("categories"), { name: n, order: S.cats.length, createdAt: serverTimestamp() }); };
  $("#s-addcard").onclick = () => { const n = $("#s-card").value.trim(); if (n) addDoc(wsRef("cards"), { name: n, createdAt: serverTimestamp() }); };
  el.querySelectorAll("[data-k]").forEach((a) => (a.onclick = () => { if (confirm("确定删除？已有记录将显示为未分类/未指定。")) deleteDoc(doc(wsRef(a.dataset.k), a.dataset.id)); }));
  $("#s-invite").onclick = () => {
    const e = $("#s-inv").value.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(e)) return toast("邮箱格式不正确");
    if (Object.values(w.memberInfo || {}).some((m) => m.email === e)) return toast("已是成员");
    updateDoc(wsRef(), { invitedEmails: arrayUnion(e) }).then(() => toast("已发送邀请")).catch((x) => toast(errMsg(x)));
  };
  el.querySelectorAll("[data-unv]").forEach((a) => (a.onclick = () => updateDoc(wsRef(), { invitedEmails: arrayRemove(a.dataset.unv) })));
  el.querySelectorAll("[data-rm]").forEach((a) => (a.onclick = () => { if (confirm("移除该成员？")) updateDoc(wsRef(), { members: arrayRemove(a.dataset.rm), [`memberInfo.${a.dataset.rm}`]: deleteField() }); }));
  if ($("#s-leave")) $("#s-leave").onclick = () => { if (confirm("退出后将看不到此账本数据，确定？")) { const id = S.wsId; updateDoc(doc(db, "workspaces", id), { members: arrayRemove(S.user.uid) }).catch((x) => toast(errMsg(x))); localStorage.removeItem("ws_" + S.user.uid); switchWs(S.wsList.find((x) => x.id !== id)?.id); } };
  $("#s-logout").onclick = () => { if (confirm("确定退出登录？")) signOut(auth); };
}
