import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, updateProfile } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, doc, addDoc, setDoc, getDoc, updateDoc, deleteDoc, onSnapshot, query, where, writeBatch, serverTimestamp, arrayUnion, arrayRemove, deleteField } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });

if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => ymd(new Date());
const firstChar = (s) => Array.from(String(s || "?").trim())[0] || "?";

const CURRENCIES = [
  { code: "MYR", symbol: "RM", space: true, zh: "马来西亚林吉特", en: "Malaysian Ringgit" },
  { code: "CNY", symbol: "¥", space: false, zh: "人民币", en: "Chinese Yuan" },
  { code: "USD", symbol: "$", space: false, zh: "美元", en: "US Dollar" },
  { code: "SGD", symbol: "S$", space: false, zh: "新加坡元", en: "Singapore Dollar" },
  { code: "EUR", symbol: "€", space: false, zh: "欧元", en: "Euro" },
  { code: "MXN", symbol: "MX$", space: false, zh: "墨西哥比索", en: "Mexican Peso" },
  { code: "BRL", symbol: "R$", space: true, zh: "巴西雷亚尔", en: "Brazilian Real" }
];
const PALETTES = {
  fresh: ["#10b981", "#3b82f6", "#f59e0b", "#f43f5e", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16", "#0ea5e9"],
  warm: ["#fb7185", "#fb923c", "#f59e0b", "#e879f9", "#a78bfa", "#34d399", "#f97316", "#f43f5e", "#22d3ee", "#facc15", "#c084fc"],
  dark: ["#34d399", "#60a5fa", "#fbbf24", "#fb7185", "#a78bfa", "#f472b6", "#2dd4bf", "#fb923c", "#818cf8", "#a3e635", "#38bdf8"]
};
const DEFAULT_CATS = [
  { zh: "餐饮", en: "Food", icon: "🍜" },
  { zh: "交通", en: "Transport", icon: "🚌" },
  { zh: "购物", en: "Shopping", icon: "🛍️" },
  { zh: "娱乐", en: "Fun", icon: "🎮" },
  { zh: "居住", en: "Home", icon: "🏠" },
  { zh: "其他", en: "Other", icon: "📦" }
];
const PRESET_AVATARS = ["🦊", "🐼", "🐯", "🦁", "🐨", "🐸", "🦄", "🐙", "🐶", "🐱", "🐻", "🐰", "🐧", "🦋", "🌸", "🍀", "⭐", "🌙", "🔥", "💎", "🌈", "☀️", "🎧", "🚀", "🍕", "⚽"];
const EMOJI_VER = "1.29.1";
const WK = { zh: ["日", "一", "二", "三", "四", "五", "六"], en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] };
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const I18N_ROWS = [
  ["appName", "记账本", "Expenses"],
  ["tagline", "一起记账，清清楚楚", "Shared spending, kept simple"],
  ["email", "邮箱", "Email"],
  ["nickname", "昵称（注册时填写）", "Name (for sign up)"],
  ["password", "密码（至少 6 位）", "Password (6+ characters)"],
  ["login", "登录", "Log in"],
  ["register", "注册", "Sign up"],
  ["noAccount", "没有账号？注册", "New here? Sign up"],
  ["hasAccount", "已有账号？登录", "Have an account? Log in"],
  ["forgot", "忘记密码", "Forgot password"],
  ["wait", "请稍候…", "Please wait…"],
  ["resetSent", "重置邮件已发送，请查看收件箱和垃圾箱", "Reset email sent. Check inbox and spam."],
  ["needEmail", "请先输入邮箱", "Enter your email first"],
  ["tabHome", "首页", "Home"],
  ["tabFunds", "存款", "Savings"],
  ["tabSettings", "设置", "Settings"],
  ["prevMonth", "上个月", "Previous month"],
  ["nextMonth", "下个月", "Next month"],
  ["monthSpend", "本月支出", "Spent this month"],
  ["chartCat", "分类", "Category"],
  ["chartCard", "银行卡", "Card"],
  ["chartMember", "成员", "Member"],
  ["emptyChart", "这个月还没有支出", "No spending this month"],
  ["emptyMonth", "本月还没有记录，点右下角 ＋ 记一笔", "Nothing this month yet. Tap ＋ to add one."],
  ["fundsTitle", "存款目标", "Savings goals"],
  ["emptyFunds", "还没有存款目标，点右下角 ＋ 新建或记一笔", "No savings goals yet. Tap ＋ to create one or add money."],
  ["fundMenu", "存款", "Savings"],
  ["addTxn", "记一笔存取", "Add a transaction"],
  ["chooseFund", "选择目标", "Choose a goal"],
  ["needFund", "请先新建一个存款目标", "Create a savings goal first"],
  ["searchRemark", "搜索备注", "Search notes"],
  ["filter", "筛选", "Filter"],
  ["clearFilters", "清除", "Clear"],
  ["allCategories", "全部分类", "All categories"],
  ["allCards", "全部账户", "All cards"],
  ["allMembers", "全部成员", "All members"],
  ["fromDate", "开始日期", "From"],
  ["toDate", "结束日期", "To"],
  ["showing", "显示 {n} / {total}", "Showing {n} of {total}"],
  ["noMatch", "没有符合筛选的记录", "No expenses match these filters"],
  ["editCategory", "编辑分类", "Edit category"],
  ["catName", "分类名称", "Category name"],
  ["receipt", "小票", "Receipt"],
  ["takePhoto", "拍照", "Camera"],
  ["choosePhoto", "相册", "Gallery"],
  ["scanReceipt", "识别小票并填入", "Scan receipt to fill"],
  ["scanning", "正在识别小票…第一次会下载语言包，请稍等", "Reading the receipt… the first time downloads language files"],
  ["scanDone", "已填入识别结果，请核对", "Filled in from the receipt. Please check it."],
  ["scanFail", "识别失败，请换一张更清晰的照片", "Couldn't read that photo. Try a clearer one."],
  ["scanEmpty", "没有识别出金额、日期或店名，请手动填写", "No amount, date, or shop name found. Fill them in yourself."],
  ["removeReceipt", "移除小票", "Remove receipt"],
  ["receiptHint", "照片会缩小后存在账本里，不需要开通云存储。", "The photo is shrunk and saved in the workspace. No cloud storage setup."],
  ["emojiFail", "表情加载失败，请检查网络", "Couldn't load emojis. Check your connection."],
  ["noWs", "无账本", "No workspace"],
  ["profile", "个人资料", "Profile"],
  ["displayName", "昵称", "Display name"],
  ["language", "语言", "Language"],
  ["theme", "主题", "Theme"],
  ["theme_fresh", "清新", "Fresh"],
  ["theme_warm", "暖色", "Warm"],
  ["theme_dark", "深色", "Dark"],
  ["currency", "货币", "Currency"],
  ["currencyHint", "这个账本里的金额都会按这个货币显示，所有成员看到的一样。", "Everyone in this workspace sees amounts in this currency."],
  ["wsName", "账本名称", "Workspace name"],
  ["categories", "分类", "Categories"],
  ["newCat", "新分类", "New category"],
  ["cards", "银行卡 / 账户", "Cards & accounts"],
  ["newCardPh", "如 工资卡", "e.g. Salary card"],
  ["members", "成员", "Members"],
  ["owner", "创建者", "Owner"],
  ["pending", "待接受", "Pending"],
  ["revoke", "撤销", "Revoke"],
  ["invitePh", "对方注册用的邮箱", "Their email"],
  ["invite", "邀请", "Invite"],
  ["inviteHint", "对方用这个邮箱登录后，顶部会出现邀请，点接受就能一起记账。", "When they sign in with this email, the invite shows at the top."],
  ["inviteSent", "邀请已发送", "Invite sent"],
  ["badEmail", "邮箱格式不正确", "That email doesn't look right"],
  ["alreadyMember", "已经是成员了", "They're already a member"],
  ["leaveWs", "退出此账本", "Leave workspace"],
  ["logout", "退出登录", "Log out"],
  ["add", "添加", "Add"],
  ["create", "创建", "Create"],
  ["save", "保存", "Save"],
  ["saved", "已保存", "Saved"],
  ["cancel", "取消", "Cancel"],
  ["delete", "删除", "Delete"],
  ["remove", "移除", "Remove"],
  ["close", "关闭", "Close"],
  ["confirm", "确认", "Confirm"],
  ["edit", "编辑", "Edit"],
  ["amount", "金额", "Amount"],
  ["date", "日期", "Date"],
  ["category", "分类", "Category"],
  ["card", "银行卡", "Card"],
  ["payer", "付款人", "Paid by"],
  ["remark", "备注", "Note"],
  ["optional", "可选", "Optional"],
  ["addExpense", "记一笔", "Add expense"],
  ["editExpense", "编辑记录", "Edit expense"],
  ["needAmount", "请输入金额", "Enter an amount"],
  ["needName", "请输入名称", "Enter a name"],
  ["needWs", "请先创建账本", "Create a workspace first"],
  ["created", "已创建", "Created"],
  ["joined", "已加入", "Joined"],
  ["switchWs", "切换账本", "Workspaces"],
  ["newWsPh", "新账本名称，如 旅行", "New workspace, e.g. Trip"],
  ["people", "{n} 人", "{n} people"],
  ["editGoal", "编辑目标", "Edit goal"],
  ["newGoal", "新建存款目标", "New savings goal"],
  ["goalName", "名称", "Name"],
  ["goalPh", "如 旅行基金", "e.g. Holiday fund"],
  ["goalAmount", "目标金额", "Target amount"],
  ["savedSoFar", "已存 {bal} / 目标 {target}", "Saved {bal} / goal {target}"],
  ["balanceLine", "余额 {bal} / 目标 {target}", "Balance {bal} / goal {target}"],
  ["deposit", "存入", "Deposit"],
  ["withdraw", "取出", "Withdraw"],
  ["records", "记录", "History"],
  ["noRecords", "暂无记录", "No records yet"],
  ["confirmDeleteExpense", "确定删除这笔记录？", "Delete this expense?"],
  ["confirmDelete", "确定删除？已有记录会显示为未分类或未指定。", "Delete it? Older records will show as uncategorized."],
  ["confirmDeleteFund", "删除该目标及全部记录？", "Delete this goal and all of its records?"],
  ["confirmDeleteTxn", "删除这条记录？", "Delete this record?"],
  ["confirmLeave", "退出后将看不到此账本，确定吗？", "You'll lose access to this workspace. Leave?"],
  ["confirmLogout", "确定退出登录？", "Log out?"],
  ["confirmRemove", "移除该成员？", "Remove this member?"],
  ["personalWs", "个人账本", "Personal"],
  ["defaultCard", "默认卡", "Default card"],
  ["uncategorized", "未分类", "Uncategorized"],
  ["unspecified", "未指定", "Unspecified"],
  ["unknownMember", "未知成员", "Unknown"],
  ["someone", "有人", "Someone"],
  ["nameRequired", "请填写昵称", "Please enter a name"],
  ["profileSaved", "资料已更新", "Profile saved"],
  ["photoTooBig", "这张图太大了，请换一张小一点的", "That photo is too large. Try a smaller one."],
  ["photoFail", "无法读取这张照片，请换一张", "Couldn't read that photo. Try another."],
  ["changeAvatar", "选择头像", "Choose avatar"],
  ["uploadPhoto", "上传照片", "Upload photo"],
  ["removePhoto", "使用字母头像", "Use initial"],
  ["pickIcon", "选择图标", "Choose icon"],
  ["accept", "接受", "Accept"],
  ["decline", "忽略", "Decline"],
  ["inviteLine", "{name} 邀请你加入「{ws}」", "{name} invited you to “{ws}”"],
  ["recorded", "已记录", "Recorded"],
  ["errEmail", "邮箱格式不正确", "That email doesn't look right"],
  ["errInUse", "该邮箱已注册", "That email is already registered"],
  ["errWeak", "密码至少 6 位", "Use at least 6 characters"],
  ["errCred", "邮箱或密码错误", "Email or password is incorrect"],
  ["errNoUser", "账号不存在", "No account found"],
  ["errMany", "尝试次数过多，请稍后再试", "Too many attempts. Try again later."],
  ["errNet", "网络错误", "Network error"],
  ["errPerm", "没有权限", "You don't have permission"],
  ["errGeneric", "出错了，请重试", "Something went wrong. Try again."]
];
const DICT = { zh: {}, en: {} };
I18N_ROWS.forEach(([k, zh, en]) => { DICT.zh[k] = zh; DICT.en[k] = en; });
const ERR = {
  "auth/invalid-email": "errEmail",
  "auth/email-already-in-use": "errInUse",
  "auth/weak-password": "errWeak",
  "auth/invalid-credential": "errCred",
  "auth/wrong-password": "errCred",
  "auth/user-not-found": "errNoUser",
  "auth/too-many-requests": "errMany",
  "auth/network-request-failed": "errNet",
  "permission-denied": "errPerm"
};

function storedTheme() {
  try { const th = localStorage.getItem("pref_theme"); if (th === "warm" || th === "dark" || th === "fresh") return th; } catch (e) {}
  return "fresh";
}
function storedLang() {
  try { if (localStorage.getItem("pref_lang") === "en") return "en"; } catch (e) {}
  return "zh";
}

const S = {
  user: null, profile: { name: "", avatar: "" }, profileReady: false, userDocExists: false,
  theme: storedTheme(), lang: storedLang(),
  wsList: [], invites: [], wsId: null, cats: [], cards: [], expenses: [], funds: [], txns: {},
  month: new Date(), mode: "cat", page: "home",
  filters: { cat: "", card: "", member: "", q: "", from: "", to: "", open: false }
};
let unsubWs = [], unsubData = [], unsubTxns = {}, chart = null;
let localProfileTouched = false, localThemeTouched = false, localLangTouched = false;
let regMode = false, registerCreate = false, pendingName = "";
let receiptDraft = null, ocrWorkerPromise = null, emojiReady = null, emojiZh = null;

const ws = () => S.wsList.find((w) => w.id === S.wsId);
const wsRef = (...p) => (p.length ? collection(db, "workspaces", S.wsId, ...p) : doc(db, "workspaces", S.wsId));
const t = (key, vars) => {
  let s = (DICT[S.lang] && DICT[S.lang][key]) || DICT.zh[key] || key;
  if (vars) Object.keys(vars).forEach((k) => { s = s.split("{" + k + "}").join(String(vars[k])); });
  return s;
};
const errMsg = (e) => (e && ERR[e.code] ? t(ERR[e.code]) : (e && e.message) || t("errGeneric"));
const toast = (m) => { const el = $("#toast"); el.textContent = m; el.classList.remove("hidden"); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.add("hidden"), 2200); };
const palette = () => PALETTES[S.theme] || PALETTES.fresh;
const currencyOf = (w) => CURRENCIES.find((c) => c.code === w?.currency) || CURRENCIES[1];
const money = (n) => {
  const v = (Math.round((Number(n) || 0) * 100) / 100).toFixed(2);
  const parts = v.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
};
const fmt = (n) => { const c = currencyOf(ws()); return c.space ? c.symbol + " " + money(n) : c.symbol + money(n); };
const memberName = (uid) => { const i = ws()?.memberInfo?.[uid]; return (i && (i.name || i.email)) || t("unknownMember"); };
const memberNameOf = (w, uid) => { const i = w?.memberInfo?.[uid]; return (i && (i.name || i.email)) || t("someone"); };
const fallbackName = (u = S.user) => (u?.displayName || (u?.email || "").split("@")[0] || t("someone")).slice(0, 40);
function safeAvatar(a) {
  if (typeof a !== "string" || a.length > 80000) return "";
  if (/^emoji:\S{1,24}$/.test(a) && !/[<>&"']/.test(a)) return a;
  if (/^data:image\/(jpeg|png);base64,[A-Za-z0-9+/]+={0,2}$/.test(a)) return a;
  return "";
}
function safeIcon(s) {
  if (typeof s !== "string") return "";
  const v = s.trim();
  if (!v || v.length > 32 || /[<>&"']/.test(v)) return "";
  return v;
}
function safeReceipt(a) {
  if (typeof a !== "string" || a.length < 32 || a.length > 750000) return "";
  if (/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(a)) return a;
  return "";
}
function monthRange(d) {
  const y = d.getFullYear(), m = d.getMonth();
  const last = new Date(y, m + 1, 0).getDate();
  return { start: `${y}-${pad(m + 1)}-01`, end: `${y}-${pad(m + 1)}-${pad(last)}` };
}
function validYmd(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}
function parseMoneyToken(raw) {
  let t = String(raw || "").trim();
  if (!t) return 0;
  const commaDec = /,\d{1,2}$/.test(t);
  if (commaDec && t.includes(".")) t = t.replace(/\./g, "").replace(",", ".");
  else if (commaDec) t = t.replace(",", ".");
  else t = t.replace(/,/g, "");
  const n = Number(t);
  if (!isFinite(n) || n <= 0 || n >= 10000000) return 0;
  return Math.round(n * 100) / 100;
}
function parseReceiptText(text) {
  const lines = String(text || "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  const joined = lines.join("\n");
  let date = "";
  const ymdMatch = joined.match(/(20\d{2})\s*[.\-/年]\s*(\d{1,2})\s*[.\-/月]\s*(\d{1,2})/);
  const dmy = joined.match(/\b(\d{1,2})[.\-/](\d{1,2})[.\-/](20\d{2})\b/);
  if (ymdMatch) date = `${ymdMatch[1]}-${pad(+ymdMatch[2])}-${pad(+ymdMatch[3])}`;
  else if (dmy) {
    const a = +dmy[1], b = +dmy[2];
    let day = a, month = b;
    if (a > 12) { day = a; month = b; }
    else if (b > 12) { month = a; day = b; }
    date = `${dmy[3]}-${pad(month)}-${pad(day)}`;
  }
  if (!validYmd(date)) date = "";
  const moneyRe = /(?:RM|MYR|CNY|RMB|USD|SGD|EUR|MXN|BRL|S\$|MX\$|R\$|¥|￥|\$|€)\s*(\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{2})|\d+(?:[.,]\d{2})?)|(\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{2})|\d+[.,]\d{2})/gi;
  const amountsIn = (line) => {
    const out = [];
    const re = new RegExp(moneyRe.source, "gi");
    let m;
    while ((m = re.exec(line))) {
      const n = parseMoneyToken(m[1] || m[2]);
      if (n) out.push(n);
    }
    return out;
  };
  const totalRe = /(合计|总计|总金额|应付|实付|实收|总额|total|amount due|grand total|balance due)/i;
  let amount = 0;
  for (let i = 0; i < lines.length; i++) {
    if (!totalRe.test(lines[i])) continue;
    let found = amountsIn(lines[i]);
    if (!found.length && lines[i + 1]) found = amountsIn(lines[i + 1]);
    if (!found.length) {
      const bare = lines[i].match(/(\d{1,6}(?:[.,]\d{1,2})?)\s*$/);
      if (bare) { const n = parseMoneyToken(bare[1]); if (n) found = [n]; }
    }
    if (found.length) { amount = found[found.length - 1]; break; }
  }
  if (!amount) {
    const all = amountsIn(joined);
    if (all.length) amount = Math.max.apply(null, all);
  }
  const skip = /^(tel|fax|tax|gst|sst|www\.|http|电话|地址)/i;
  let merchant = "";
  for (const line of lines) {
    if (line.length < 2 || line.length > 40) continue;
    if (totalRe.test(line) || skip.test(line)) continue;
    if (!/[A-Za-z\u4e00-\u9fff]/.test(line)) continue;
    if (/^\d/.test(line) && !/[\u4e00-\u9fff]/.test(line) && !/[A-Za-z]{3,}/.test(line)) continue;
    merchant = line.replace(/\s{2,}/g, " ").slice(0, 40);
    break;
  }
  return { amount, date, merchant };
}
function avatarEl(avatar, name, cls = "av") {
  const a = safeAvatar(avatar);
  if (a.startsWith("data:image/")) return `<span class="${cls} photo"><img alt="" src="${esc(a)}"></span>`;
  if (a.startsWith("emoji:")) return `<span class="${cls} emo">${esc(a.slice(6))}</span>`;
  return `<span class="${cls} letter">${esc(firstChar(name))}</span>`;
}
function cacheProfile() {
  if (!S.user) return;
  try { localStorage.setItem("pref_profile", JSON.stringify({ uid: S.user.uid, name: S.profile.name || "", avatar: S.profile.avatar || "" })); } catch (e) {}
}
function readProfileCache(uid) {
  try {
    const p = JSON.parse(localStorage.getItem("pref_profile") || "null");
    if (p && p.uid === uid) return { name: String(p.name || "").slice(0, 40), avatar: safeAvatar(p.avatar) };
  } catch (e) {}
  return null;
}
function monthLabel(d) { return S.lang === "en" ? `${MON[d.getMonth()]} ${d.getFullYear()}` : `${d.getFullYear()}年${d.getMonth() + 1}月`; }
function dayLabel(dStr) {
  const dt = new Date(dStr + "T00:00:00");
  return S.lang === "en" ? `${MON[dt.getMonth()]} ${dt.getDate()}, ${WK.en[dt.getDay()]}` : `${dt.getMonth() + 1}月${dt.getDate()}日 周${WK.zh[dt.getDay()]}`;
}

function updateThemeButtons() {
  document.querySelectorAll("[data-theme-pick]").forEach((b) => {
    b.classList.toggle("on", b.dataset.themePick === S.theme);
    b.setAttribute("aria-label", t("theme_" + b.dataset.themePick));
  });
}
function updateLangButtons() {
  document.querySelectorAll("#auth-lang [data-lang]").forEach((b) => b.classList.toggle("on", b.dataset.lang === S.lang));
}
function refreshAuthTexts() {
  $("#au-submit").textContent = regMode ? t("register") : t("login");
  $("#au-toggle").textContent = regMode ? t("hasAccount") : t("noAccount");
  $("#au-reset").textContent = t("forgot");
}
function applyI18n() {
  document.documentElement.lang = S.lang === "en" ? "en" : "zh-CN";
  document.title = t("appName");
  document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  refreshAuthTexts();
  updateLangButtons();
  updateThemeButtons();
  const me = $("#me-btn"); if (me) me.setAttribute("aria-label", t("profile"));
  syncFab();
  const prev = $("#m-prev"); if (prev) prev.setAttribute("aria-label", t("prevMonth"));
  const next = $("#m-next"); if (next) next.setAttribute("aria-label", t("nextMonth"));
}
function chartBorder() {
  return getComputedStyle(document.documentElement).getPropertyValue("--card").trim() || "#fff";
}
function setTheme(theme, persist) {
  const next = theme === "warm" || theme === "dark" ? theme : "fresh";
  const changed = S.theme !== next;
  S.theme = next;
  document.documentElement.setAttribute("data-theme", S.theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  const c = getComputedStyle(document.documentElement).getPropertyValue("--theme-color").trim();
  if (meta && c) meta.setAttribute("content", c);
  const bar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  if (bar) bar.setAttribute("content", S.theme === "dark" ? "black" : "default");
  updateThemeButtons();
  if (persist) {
    try { localStorage.setItem("pref_theme", S.theme); } catch (e) {}
    if (S.user) { localThemeTouched = true; pushUserDoc(); }
  }
  if ((changed || persist) && S.user && S.page === "home") renderHome();
}
function setLang(lang, persist) {
  const next = lang === "en" ? "en" : "zh";
  const changed = S.lang !== next;
  S.lang = next;
  document.documentElement.lang = S.lang === "en" ? "en" : "zh-CN";
  if (persist) {
    try { localStorage.setItem("pref_lang", S.lang); } catch (e) {}
    if (S.user) { localLangTouched = true; pushUserDoc(); }
  }
  applyI18n();
  if (changed || persist) renderAll();
}
function pushUserDoc() {
  if (!S.user || !S.profileReady || !S.profile.name) return;
  const name = S.profile.name.trim().slice(0, 40);
  if (!name) return;
  setDoc(doc(db, "users", S.user.uid), {
    name,
    avatar: S.profile.avatar || "",
    theme: S.theme,
    lang: S.lang
  }, { merge: true }).catch(() => {});
}
function pushMemberInfo(announce) {
  if (!S.user || !S.profile.name) return;
  const info = { email: (S.user.email || "").toLowerCase(), name: S.profile.name.trim().slice(0, 40), avatar: S.profile.avatar || "" };
  S.wsList.forEach((w) => {
    const cur = w.memberInfo?.[S.user.uid] || {};
    if ((cur.email || "") === info.email && (cur.name || "") === info.name && safeAvatar(cur.avatar) === info.avatar) return;
    updateDoc(doc(db, "workspaces", w.id), { [`memberInfo.${S.user.uid}`]: info }).catch((e) => { if (announce) toast(errMsg(e)); });
  });
}
function maybeMirror() {
  if (!S.user || !S.profileReady || !S.profile.name) return;
  if (!S.userDocExists && !localProfileTouched) return;
  pushMemberInfo(false);
}
function adoptWorkspaceProfile() {
  if (!S.user || localProfileTouched || S.userDocExists) return;
  const infos = S.wsList.map((w) => w.memberInfo?.[S.user.uid]).filter(Boolean);
  const named = infos.find((i) => i.name);
  const withAv = infos.find((i) => safeAvatar(i.avatar));
  if (named) S.profile.name = String(named.name).slice(0, 40);
  if (withAv && !S.profile.avatar) S.profile.avatar = safeAvatar(withAv.avatar);
  if (!S.profile.name) S.profile.name = fallbackName();
  cacheProfile();
}
function saveProfile(patch) {
  if (!S.user) return;
  const name = String(patch.name != null ? patch.name : (S.profile.name || fallbackName())).trim().slice(0, 40);
  if (!name) return toast(t("nameRequired"));
  const avatar = patch.avatar !== undefined ? safeAvatar(patch.avatar) : (S.profile.avatar || "");
  const nameChanged = (S.user.displayName || "") !== name;
  S.profile = { name, avatar };
  localProfileTouched = true;
  cacheProfile();
  if (nameChanged) updateProfile(S.user, { displayName: name }).catch(() => {});
  pushUserDoc();
  pushMemberInfo(true);
  toast(t("profileSaved"));
  renderTop();
  if (S.page === "settings") renderSettings();
}
function compressImage(file) {
  return new Promise((resolve, reject) => {
    if (!file || !/^image\//.test(file.type || "")) return reject(new Error("fail"));
    if (file.size > 12 * 1024 * 1024) return reject(new Error("big"));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const size = 160;
      const canvas = document.createElement("canvas");
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext("2d");
      const side = Math.max(1, Math.min(img.width, img.height));
      const sx = (img.width - side) / 2, sy = (img.height - side) / 2;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
      let q = 0.72, data = canvas.toDataURL("image/jpeg", q);
      while (data.length > 22000 && q > 0.42) { q = Math.round((q - 0.08) * 100) / 100; data = canvas.toDataURL("image/jpeg", q); }
      URL.revokeObjectURL(url);
      if (!safeAvatar(data)) reject(new Error("big")); else resolve(data);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("fail")); };
    img.src = url;
  });
}
function handleUserDoc(snap) {
  const prev = S.profile.name + "|" + S.profile.avatar + "|" + S.lang + "|" + S.theme;
  S.profileReady = true;
  S.userDocExists = snap.exists();
  if (snap.exists()) {
    const d = snap.data() || {};
    if (!localProfileTouched) {
      if (typeof d.name === "string" && d.name.trim()) S.profile.name = d.name.trim().slice(0, 40);
      if (typeof d.avatar === "string") S.profile.avatar = safeAvatar(d.avatar);
      cacheProfile();
    }
    if (!localThemeTouched && (d.theme === "fresh" || d.theme === "warm" || d.theme === "dark")) setTheme(d.theme, false);
    if (!localLangTouched && (d.lang === "zh" || d.lang === "en")) setLang(d.lang, false);
  } else if (!localProfileTouched) adoptWorkspaceProfile();
  if (localThemeTouched || localLangTouched || localProfileTouched) pushUserDoc();
  maybeMirror();
  renderTop();
  const next = S.profile.name + "|" + S.profile.avatar + "|" + S.lang + "|" + S.theme;
  if (prev !== next || S.page === "home") renderAll();
}

/* ---------- Auth ---------- */
$("#au-toggle").onclick = (e) => {
  e.preventDefault();
  regMode = !regMode;
  $("#au-name").classList.toggle("hidden", !regMode);
  $("#au-pass").setAttribute("autocomplete", regMode ? "new-password" : "current-password");
  refreshAuthTexts();
};
$("#au-submit").onclick = async () => {
  const email = $("#au-email").value.trim(), pass = $("#au-pass").value;
  $("#au-msg").textContent = t("wait");
  try {
    if (regMode) {
      const name = ($("#au-name").value.trim() || email.split("@")[0]).slice(0, 40);
      registerCreate = true;
      pendingName = name;
      const c = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(c.user, { displayName: name });
      S.profile.name = name;
      createWorkspace(t("personalWs"), c.user);
      registerCreate = false;
    } else await signInWithEmailAndPassword(auth, email, pass);
    $("#au-msg").textContent = "";
  } catch (e) { registerCreate = false; pendingName = ""; $("#au-msg").textContent = errMsg(e); }
};
$("#au-reset").onclick = async (e) => {
  e.preventDefault();
  const email = $("#au-email").value.trim();
  if (!email) return ($("#au-msg").textContent = t("needEmail"));
  try { await sendPasswordResetEmail(auth, email); $("#au-msg").textContent = t("resetSent"); } catch (err) { $("#au-msg").textContent = errMsg(err); }
};
document.querySelectorAll("#auth-lang [data-lang]").forEach((b) => (b.onclick = () => setLang(b.dataset.lang, true)));
document.querySelectorAll("#auth-theme [data-theme-pick]").forEach((b) => (b.onclick = () => setTheme(b.dataset.themePick, true)));

onAuthStateChanged(auth, (u) => {
  if (u && S.user && u.uid === S.user.uid) { S.user = u; return; }
  unsubWs.forEach((f) => f()); unsubWs = []; clearData();
  localProfileTouched = false; localThemeTouched = false; localLangTouched = false;
  S.user = u; S.userDocExists = false; S.profileReady = false; S.wsId = null;
  $("#boot").classList.add("hidden");
  $("#auth").classList.toggle("hidden", !!u);
  $("#main").classList.toggle("hidden", !u);
  if (!u) { S.profile = { name: "", avatar: "" }; closeModal(); return; }
  const cached = readProfileCache(u.uid);
  S.profile = {
    name: (pendingName || cached?.name || u.displayName || (u.email || "").split("@")[0] || "").slice(0, 40),
    avatar: cached?.avatar || ""
  };
  pendingName = "";
  const email = (u.email || "").toLowerCase();
  let firstLoad = true;
  unsubWs.push(onSnapshot(query(collection(db, "workspaces"), where("members", "array-contains", u.uid)), (snap) => {
    S.wsList = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
    if (!S.userDocExists && !localProfileTouched) adoptWorkspaceProfile();
    if (!S.wsList.length && firstLoad && !snap.metadata.fromCache) {
      if (registerCreate) return;
      firstLoad = false;
      createWorkspace(t("personalWs"), u);
      return;
    }
    firstLoad = false;
    const saved = localStorage.getItem("ws_" + u.uid);
    if (!ws()) switchWs((S.wsList.find((w) => w.id === saved) || S.wsList[0])?.id);
    else { maybeMirror(); renderTop(); renderAll(); }
  }, (e) => toast(errMsg(e))));
  unsubWs.push(onSnapshot(query(collection(db, "workspaces"), where("invitedEmails", "array-contains", email)), (snap) => {
    S.invites = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((w) => !(w.members || []).includes(u.uid));
    renderInvites();
  }, () => {}));
  unsubWs.push(onSnapshot(doc(db, "users", u.uid), handleUserDoc, () => {
    S.profileReady = true; S.userDocExists = false; adoptWorkspaceProfile(); renderTop(); renderAll();
  }));
});

function createWorkspace(name, u = S.user) {
  const ref = doc(collection(db, "workspaces"));
  const b = writeBatch(db);
  const display = (u.uid === S.user?.uid && S.profile.name) ? S.profile.name : (u.displayName || (u.email || "").split("@")[0]);
  const avatar = u.uid === S.user?.uid ? (S.profile.avatar || "") : "";
  b.set(ref, {
    name, ownerUid: u.uid, members: [u.uid], currency: "CNY", invitedEmails: [], createdAt: serverTimestamp(),
    memberInfo: { [u.uid]: { email: (u.email || "").toLowerCase(), name: display, avatar } }
  });
  const lang = S.lang === "en" ? "en" : "zh";
  DEFAULT_CATS.forEach((c, i) => b.set(doc(collection(ref, "categories")), { name: c[lang], icon: c.icon, order: i, createdAt: serverTimestamp() }));
  b.set(doc(collection(ref, "cards")), { name: t("defaultCard"), createdAt: serverTimestamp() });
  b.commit().catch((e) => toast(errMsg(e)));
  return ref.id;
}
function clearData() {
  unsubData.forEach((f) => f()); unsubData = [];
  Object.values(unsubTxns).forEach((f) => f()); unsubTxns = {};
  Object.assign(S, { cats: [], cards: [], expenses: [], funds: [], txns: {} });
}
function switchWs(id) {
  clearData(); S.wsId = id || null;
  S.filters = { cat: "", card: "", member: "", q: "", from: "", to: "", open: false };
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
$("#fab").onclick = () => { if (S.page === "funds") openFundMenu(); else openExpense(); };
$("#filter-toggle").onclick = () => { S.filters.open = !S.filters.open; renderHome(); };
$("#filter-clear").onclick = () => { S.filters = { cat: "", card: "", member: "", q: "", from: "", to: "", open: S.filters.open }; renderHome(); };
["flt-cat", "flt-card", "flt-mem", "flt-from", "flt-to"].forEach((id) => { const el = $("#" + id); if (el) el.onchange = () => { readFilters(); renderHome(); }; });
const fltQ = $("#flt-q");
if (fltQ) fltQ.oninput = () => { readFilters(); renderHome(); };
$("#ws-btn").onclick = openWsPicker;
$("#me-btn").onclick = () => openProfile();
$("#modal").onclick = (e) => { if (e.target.id === "modal") closeModal(); };
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
function openModal(html) { $("#sheet").innerHTML = `<div class="grab"></div>${html}`; $("#modal").classList.remove("hidden"); document.body.classList.add("modal-open"); }
function closeModal() { $("#modal").classList.add("hidden"); $("#sheet").innerHTML = ""; document.body.classList.remove("modal-open"); }
function onEnter(input, fn) { if (input) input.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); fn(); } }; }

function renderTop() {
  if (!S.user) return;
  $("#ws-btn").textContent = (ws()?.name || t("noWs")) + " ▾";
  const name = S.profile.name || fallbackName();
  $("#me-btn").innerHTML = avatarEl(S.profile.avatar, name, "av sm");
}
function syncFab() {
  const fab = $("#fab");
  if (!fab) return;
  const show = !!S.user && (S.page === "home" || S.page === "funds");
  fab.classList.toggle("hidden", !show);
  fab.setAttribute("aria-label", S.page === "funds" ? t("fundMenu") : t("addExpense"));
}
function renderAll() { renderTop(); syncFab(); if (!S.user) return; if (S.page === "home") renderHome(); if (S.page === "funds") renderFunds(); if (S.page === "settings") renderSettings(); }
function readFilters() {
  const f = S.filters;
  f.cat = $("#flt-cat") ? $("#flt-cat").value : f.cat;
  f.card = $("#flt-card") ? $("#flt-card").value : f.card;
  f.member = $("#flt-mem") ? $("#flt-mem").value : f.member;
  f.q = $("#flt-q") ? $("#flt-q").value : f.q;
  f.from = $("#flt-from") ? $("#flt-from").value : f.from;
  f.to = $("#flt-to") ? $("#flt-to").value : f.to;
}
function activeFilterCount() {
  const f = S.filters;
  return [f.cat, f.card, f.member, (f.q || "").trim(), f.from, f.to].filter(Boolean).length;
}
function applyExpenseFilters(list) {
  const f = S.filters;
  const q = (f.q || "").trim().toLowerCase();
  return list.filter((e) => {
    if (f.cat && e.categoryId !== f.cat) return false;
    if (f.card && e.cardId !== f.card) return false;
    if (f.member && e.memberUid !== f.member) return false;
    if (q && !String(e.remark || "").toLowerCase().includes(q)) return false;
    if (f.from && (e.date || "") < f.from) return false;
    if (f.to && (e.date || "") > f.to) return false;
    return true;
  });
}
function setSelectHtml(el, html, value) {
  if (!el) return;
  if (el.dataset.sig !== html) { el.innerHTML = html; el.dataset.sig = html; }
  if (el.value !== value) el.value = value;
}
function renderInvites() {
  $("#invites").innerHTML = S.invites.map((w) => {
    const owner = w.memberInfo?.[w.ownerUid];
    return `<div class="invite"><span class="txt">${avatarEl(owner?.avatar, memberNameOf(w, w.ownerUid), "av xs")}<span>${t("inviteLine", { name: esc(memberNameOf(w, w.ownerUid)), ws: esc(w.name) })}</span></span><span class="actions"><button class="btn small primary" type="button" data-acc="${w.id}">${t("accept")}</button><button class="btn small" type="button" data-dec="${w.id}">${t("decline")}</button></span></div>`;
  }).join("");
  $("#invites").querySelectorAll("[data-acc]").forEach((b) => (b.onclick = () => acceptInvite(b.dataset.acc)));
  $("#invites").querySelectorAll("[data-dec]").forEach((b) => (b.onclick = () => declineInvite(b.dataset.dec)));
}
async function acceptInvite(id) {
  const u = S.user, email = u.email.toLowerCase();
  const name = S.profile.name || u.displayName || email.split("@")[0];
  try {
    await updateDoc(doc(db, "workspaces", id), { members: arrayUnion(u.uid), [`memberInfo.${u.uid}`]: { email, name, avatar: S.profile.avatar || "" }, invitedEmails: arrayRemove(email) });
    toast(t("joined")); switchWs(id);
  } catch (e) { toast(errMsg(e)); }
}
async function declineInvite(id) {
  try { await updateDoc(doc(db, "workspaces", id), { invitedEmails: arrayRemove(S.user.email.toLowerCase()) }); } catch (e) { toast(errMsg(e)); }
}

/* ---------- Home ---------- */
function catOf(id) { return S.cats.find((c) => c.id === id); }
function cardOf(id) { return S.cards.find((c) => c.id === id); }
function renderHome() {
  if (!$("#m-label")) return;
  $("#m-label").textContent = monthLabel(S.month);
  const range = monthRange(S.month);
  if (S.filters.from && (S.filters.from < range.start || S.filters.from > range.end)) S.filters.from = "";
  if (S.filters.to && (S.filters.to < range.start || S.filters.to > range.end)) S.filters.to = "";
  const catOpts = `<option value="">${esc(t("allCategories"))}</option>` + S.cats.map((c) => `<option value="${esc(c.id)}">${esc(catLabel(c))}</option>`).join("");
  const cardOpts = `<option value="">${esc(t("allCards"))}</option>` + S.cards.map((c) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join("");
  const memOpts = `<option value="">${esc(t("allMembers"))}</option>` + memberList().map((m) => `<option value="${esc(m.id)}">${esc(m.name)}</option>`).join("");
  setSelectHtml($("#flt-cat"), catOpts, S.filters.cat);
  setSelectHtml($("#flt-card"), cardOpts, S.filters.card);
  setSelectHtml($("#flt-mem"), memOpts, S.filters.member);
  ["flt-from", "flt-to"].forEach((id) => { const el = $("#" + id); if (!el) return; el.min = range.start; el.max = range.end; if (document.activeElement !== el) el.value = id === "flt-from" ? S.filters.from : S.filters.to; });
  const qEl = $("#flt-q");
  if (qEl && document.activeElement !== qEl && qEl.value !== S.filters.q) qEl.value = S.filters.q;
  const filtersEl = $("#filters");
  if (filtersEl) filtersEl.classList.toggle("hidden", !S.filters.open);
  const n = activeFilterCount();
  const nEl = $("#filter-n");
  if (nEl) nEl.textContent = n ? String(n) : "";
  const clearBtn = $("#filter-clear");
  if (clearBtn) clearBtn.classList.toggle("hidden", !n);
  const ex = [...S.expenses].sort((a, b) => (b.date || "").localeCompare(a.date || "") || (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  const shown = applyExpenseFilters(ex);
  const total = ex.reduce((s, e) => s + Number(e.amount || 0), 0);
  $("#m-total").textContent = fmt(total);
  $("#m-code").textContent = currencyOf(ws()).code;
  const colors = palette();
  const groups = new Map();
  ex.forEach((e) => {
    let label, icon = "", photo = "";
    if (S.mode === "cat") {
      const c = catOf(e.categoryId);
      label = c?.name || t("uncategorized");
      icon = safeIcon(c?.icon);
    } else if (S.mode === "card") {
      label = cardOf(e.cardId)?.name || t("unspecified");
      icon = "💳";
    } else {
      const info = ws()?.memberInfo?.[e.memberUid];
      label = memberName(e.memberUid);
      const av = safeAvatar(info?.avatar);
      if (av.startsWith("emoji:")) icon = av.slice(6);
      else if (av.startsWith("data:image/")) photo = av;
    }
    const g = groups.get(label) || { label, icon, photo, value: 0 };
    g.value += Number(e.amount || 0);
    groups.set(label, g);
  });
  const rows = [...groups.values()].sort((a, b) => b.value - a.value);
  const labels = rows.map((r) => r.label);
  const data = rows.map((r) => r.value);
  const sliceColors = labels.map((_, i) => colors[i % colors.length]);
  const chartSig = S.theme + "|" + labels.join("\n") + "|" + data.join(",");
  const canvas = $("#pie"), empty = $("#chart-empty");
  empty.textContent = t("emptyChart");
  if (!labels.length) {
    if (chart) { chart.destroy(); chart = null; }
    renderHome.chartSig = "";
    canvas.classList.add("hidden"); empty.classList.remove("hidden");
  } else if (window.Chart && renderHome.chartSig !== chartSig) {
    renderHome.chartSig = chartSig;
    canvas.classList.remove("hidden"); empty.classList.add("hidden");
    const border = chartBorder();
    if (!chart) chart = new Chart(canvas, { type: "doughnut", data: { labels, datasets: [{ data, backgroundColor: sliceColors, borderColor: border, borderWidth: 3, hoverOffset: 6 }] }, options: { cutout: "64%", plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => " " + c.label + ": " + fmt(c.parsed) } } }, animation: { duration: 350 } } });
    else { chart.data.labels = labels; chart.data.datasets[0].data = data; chart.data.datasets[0].backgroundColor = sliceColors; chart.data.datasets[0].borderColor = border; chart.update(); }
    requestAnimationFrame(() => { if (chart) chart.resize(); });
  }
  $("#legend").innerHTML = rows.map((r, i) => {
    const ico = r.photo ? `<img class="lg-av" alt="" src="${esc(r.photo)}">` : (r.icon ? `<span class="lg-em">${esc(r.icon)}</span>` : "");
    return `<span class="lg"><i style="background:${sliceColors[i]}"></i>${ico}${esc(r.label)} <b>${fmt(r.value)}</b> <small>${total ? Math.round((r.value / total) * 100) : 0}%</small></span>`;
  }).join("");
  const sumEl = $("#filter-sum");
  if (sumEl) {
    const filtering = n > 0;
    sumEl.classList.toggle("hidden", !filtering);
    sumEl.textContent = filtering ? t("showing", { n: shown.length, total: ex.length }) : "";
  }
  const byDay = {};
  shown.forEach((e) => (byDay[e.date] = byDay[e.date] || []).push(e));
  $("#exp-list").innerHTML = shown.length ? Object.keys(byDay).map((d) => {
    const items = byDay[d], sum = items.reduce((s, e) => s + Number(e.amount || 0), 0);
    return `<div class="day-h"><span>${dayLabel(d)}</span><span>${fmt(sum)}</span></div><div class="card" style="padding:4px 14px">` + items.map((e) => {
      const cat = catOf(e.categoryId), cn = cat?.name || t("uncategorized");
      const ci = Math.max(0, S.cats.findIndex((c) => c.id === e.categoryId));
      const color = colors[ci % colors.length];
      const icon = safeIcon(cat?.icon);
      const bubble = icon ? `<div class="ic emo" style="--c:${color}">${esc(icon)}</div>` : `<div class="ic letter" style="--c:${color};background:${color}">${esc(firstChar(cn))}</div>`;
      const info = ws()?.memberInfo?.[e.memberUid];
      const remark = e.remark ? `<div class="remark">${esc(e.remark)}</div>` : "";
      const badge = e.receiptId ? `<span class="receipt-tag" title="${esc(t("receipt"))}">🧾</span>` : "";
      return `<div class="item" data-id="${esc(e.id)}">${bubble}<div class="mid"><div class="ttl">${esc(cn)}${badge}</div><div class="sub">${avatarEl(info?.avatar, memberName(e.memberUid), "av xs")}<span class="txt">${esc(cardOf(e.cardId)?.name || t("unspecified"))} · ${esc(memberName(e.memberUid))}</span></div>${remark}</div><div class="amt">-${fmt(e.amount)}</div></div>`;
    }).join("") + `</div>`;
  }).join("") : `<div class="empty">${ex.length ? t("noMatch") : t("emptyMonth")}</div>`;
  $("#exp-list").querySelectorAll(".item").forEach((el) => (el.onclick = () => openExpense(S.expenses.find((e) => e.id === el.dataset.id))));
}
const opts = (arr, sel, label = (x) => x.name, val = (x) => x.id) => arr.map((x) => `<option value="${esc(val(x))}"${val(x) === sel ? " selected" : ""}>${esc(label(x))}</option>`).join("");
const catLabel = (c) => { const ic = safeIcon(c.icon); return ic ? ic + " " + c.name : c.name; };
function memberList() { return (ws()?.members || []).map((uid) => ({ id: uid, name: memberName(uid) })); }

function paintReceipt() {
  const box = $("#receipt-box");
  if (!box || !receiptDraft) return;
  const img = safeReceipt(receiptDraft.image);
  box.innerHTML = img
    ? `<img class="receipt-preview" alt="" src="${img}"><button class="btn block" id="r-remove" type="button">${t("removeReceipt")}</button>`
    : (receiptDraft.loading ? `<p class="muted">${t("wait")}</p>` : "");
  const rm = $("#r-remove");
  if (rm) rm.onclick = () => { receiptDraft.image = ""; receiptDraft.removed = true; receiptDraft.dirty = true; paintReceipt(); };
}
function compressReceipt(file) {
  return new Promise((resolve, reject) => {
    if (!file || !/^image\//.test(file.type || "")) return reject(new Error("fail"));
    if (file.size > 20 * 1024 * 1024) return reject(new Error("big"));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const paint = (width, height, quality) => {
        canvas.width = width; canvas.height = height;
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        return canvas.toDataURL("image/jpeg", quality);
      };
      const fit = (edge) => {
        const scale = Math.min(1, edge / Math.max(img.width, img.height, 1));
        return [Math.max(1, Math.round(img.width * scale)), Math.max(1, Math.round(img.height * scale))];
      };
      let [w, h] = fit(1280);
      let q = 0.72;
      let data = paint(w, h, q);
      while (data.length > 700000 && q > 0.45) { q = Math.round((q - 0.08) * 100) / 100; data = paint(w, h, q); }
      let edge = Math.max(w, h);
      while (data.length > 700000 && edge > 640) {
        edge = Math.round(edge * 0.8);
        [w, h] = fit(edge);
        data = paint(w, h, 0.5);
      }
      URL.revokeObjectURL(url);
      if (!safeReceipt(data)) reject(new Error("big")); else resolve(data);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("fail")); };
    img.src = url;
  });
}
async function recognizeReceipt(dataUrl) {
  if (!ocrWorkerPromise) {
    ocrWorkerPromise = (async () => {
      const mod = await import("https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.esm.min.js");
      const lib = mod.default || mod;
      const createWorker = lib.createWorker;
      if (typeof createWorker !== "function") throw new Error("ocr");
      return createWorker("eng+chi_sim");
    })().catch((err) => { ocrWorkerPromise = null; throw err; });
  }
  const worker = await ocrWorkerPromise;
  const res = await worker.recognize(dataUrl);
  return (res && res.data && res.data.text) || "";
}
async function scanReceiptImage(dataUrl) {
  if (!$("#f-amt")) return;
  toast(t("scanning"));
  try {
    const parsed = parseReceiptText(await recognizeReceipt(dataUrl));
    if (parsed.amount && $("#f-amt")) $("#f-amt").value = parsed.amount.toFixed(2);
    if (parsed.date && $("#f-date")) $("#f-date").value = parsed.date;
    if (parsed.merchant && $("#f-rem") && !$("#f-rem").value.trim()) $("#f-rem").value = parsed.merchant;
    toast(parsed.amount || parsed.date || parsed.merchant ? t("scanDone") : t("scanEmpty"));
  } catch (err) { toast(t("scanFail")); }
}
function openExpense(e) {
  if (!S.wsId) return toast(t("needWs"));
  const sym = currencyOf(ws()).symbol;
  receiptDraft = { image: "", loading: !!(e && e.receiptId), removed: false, dirty: false, id: e?.receiptId || "" };
  openModal(`<h3>${e ? t("editExpense") : t("addExpense")}</h3>
  <label>${t("amount")} (${esc(sym)})</label><input id="f-amt" type="number" inputmode="decimal" step="0.01" placeholder="0.00" value="${e ? esc(e.amount) : ""}">
  <label>${t("date")}</label><input id="f-date" type="date" value="${e?.date || today()}">
  <label>${t("category")}</label><select id="f-cat">${opts(S.cats, e?.categoryId, catLabel)}</select>
  <label>${t("card")}</label><select id="f-card">${opts(S.cards, e?.cardId)}</select>
  <label>${t("payer")}</label><select id="f-mem">${opts(memberList(), e?.memberUid || S.user.uid)}</select>
  <label>${t("remark")}</label><textarea id="f-rem" rows="3" placeholder="${esc(t("optional"))}">${esc(e?.remark || "")}</textarea>
  <label>${t("receipt")}</label><div id="receipt-box"></div>
  <div class="btns"><button class="btn" id="r-cam" type="button">${t("takePhoto")}</button><button class="btn" id="r-gal" type="button">${t("choosePhoto")}</button></div>
  <button class="btn block" id="r-scan" type="button">${t("scanReceipt")}</button>
  <p class="muted">${t("receiptHint")}</p>
  <input id="r-file" type="file" accept="image/*" class="hidden">
  <div class="btns">${e ? `<button class="btn danger" id="f-del" type="button">${t("delete")}</button>` : ""}<button class="btn" id="f-cancel" type="button">${t("cancel")}</button><button class="btn primary" id="f-save" type="button">${t("save")}</button></div>`);
  if (!e) setTimeout(() => $("#f-amt")?.focus(), 100);
  const file = $("#r-file");
  const pick = (capture, scan) => { file.dataset.scan = scan ? "1" : ""; if (capture) file.setAttribute("capture", "environment"); else file.removeAttribute("capture"); file.click(); };
  $("#r-cam").onclick = () => pick(true, false);
  $("#r-gal").onclick = () => pick(false, false);
  file.onchange = async () => {
    const f = file.files && file.files[0];
    file.value = "";
    if (!f) return;
    try {
      const data = await compressReceipt(f);
      receiptDraft.image = data; receiptDraft.removed = false; receiptDraft.dirty = true; receiptDraft.loading = false;
      paintReceipt();
      if (file.dataset.scan === "1") { file.dataset.scan = ""; scanReceiptImage(data); }
    } catch (err) { toast(err && err.message === "big" ? t("photoTooBig") : t("photoFail")); }
  };
  $("#r-scan").onclick = () => {
    const img = safeReceipt(receiptDraft.image);
    if (img) scanReceiptImage(img);
    else pick(false, true);
  };
  if (e && e.receiptId) {
    getDoc(doc(wsRef("receipts"), e.receiptId)).then((snap) => {
      if (!receiptDraft || receiptDraft.id !== e.receiptId || receiptDraft.dirty) return;
      receiptDraft.loading = false;
      receiptDraft.image = snap.exists() ? safeReceipt(snap.data().image) : "";
      paintReceipt();
    }).catch(() => { if (receiptDraft) { receiptDraft.loading = false; paintReceipt(); } });
  }
  $("#f-cancel").onclick = closeModal;
  $("#f-save").onclick = () => {
    const amount = Math.round(parseFloat($("#f-amt").value) * 100) / 100;
    if (!(amount > 0)) return toast(t("needAmount"));
    const data = { date: $("#f-date").value || today(), amount, categoryId: $("#f-cat").value, cardId: $("#f-card").value, memberUid: $("#f-mem").value, remark: $("#f-rem").value.trim() };
    const expRef = e ? doc(wsRef("expenses"), e.id) : doc(wsRef("expenses"));
    const image = safeReceipt(receiptDraft && receiptDraft.image);
    if (receiptDraft && receiptDraft.removed && e && e.receiptId) {
      deleteDoc(doc(wsRef("receipts"), e.receiptId)).catch((x) => toast(errMsg(x)));
      data.receiptId = deleteField();
    } else if (receiptDraft && receiptDraft.dirty && image) {
      const rref = e && e.receiptId ? doc(wsRef("receipts"), e.receiptId) : doc(wsRef("receipts"));
      setDoc(rref, { expenseId: expRef.id, image, createdAt: serverTimestamp() }, { merge: true }).catch((x) => toast(errMsg(x)));
      data.receiptId = rref.id;
    }
    const op = e ? updateDoc(expRef, data) : setDoc(expRef, { ...data, createdBy: S.user.uid, createdAt: serverTimestamp() });
    op.catch((x) => toast(errMsg(x))); closeModal(); toast(t("saved"));
  };
  if (e) $("#f-del").onclick = () => {
    if (!confirm(t("confirmDeleteExpense"))) return;
    if (e.receiptId) deleteDoc(doc(wsRef("receipts"), e.receiptId)).catch((x) => toast(errMsg(x)));
    deleteDoc(doc(wsRef("expenses"), e.id)).catch((x) => toast(errMsg(x)));
    closeModal();
  };
}

/* ---------- Workspaces ---------- */
function openWsPicker() {
  openModal(`<h3>${t("switchWs")}</h3>${S.wsList.map((w) => `<div class="ws-opt ${w.id === S.wsId ? "on" : ""}" data-id="${w.id}"><span>${esc(w.name)}</span><span class="muted">${t("people", { n: (w.members || []).length })} · ${esc(currencyOf(w).code)}</span></div>`).join("")}
  <div class="inline"><input id="ws-new" placeholder="${esc(t("newWsPh"))}"><button class="btn primary" id="ws-create" type="button">${t("create")}</button></div>`);
  $("#sheet").querySelectorAll(".ws-opt").forEach((el) => (el.onclick = () => { switchWs(el.dataset.id); closeModal(); }));
  const make = () => { const n = $("#ws-new").value.trim(); if (!n) return toast(t("needName")); const id = createWorkspace(n); closeModal(); localStorage.setItem("ws_" + S.user.uid, id); toast(t("created")); setTimeout(() => { if (S.wsList.find((w) => w.id === id)) switchWs(id); }, 400); };
  $("#ws-create").onclick = make;
  onEnter($("#ws-new"), make);
}

/* ---------- Funds ---------- */
function fundStats(f) {
  const tx = S.txns[f.id] || [];
  let bal = 0; const per = {};
  tx.forEach((txn) => { const v = Number(txn.amount || 0) * (txn.type === "withdraw" ? -1 : 1); bal += v; per[txn.memberUid] = (per[txn.memberUid] || 0) + v; });
  return { tx, bal, per };
}
function renderFunds() {
  if (S.page !== "funds" || !$("#fund-list")) return;
  const colors = palette();
  $("#fund-list").innerHTML = S.funds.length ? S.funds.map((f) => {
    const { bal, per } = fundStats(f), pct = f.target > 0 ? Math.min(100, Math.max(0, (bal / f.target) * 100)) : 0;
    const pos = Object.entries(per).filter(([, v]) => v > 0), sum = pos.reduce((s, [, v]) => s + v, 0);
    return `<div class="card fund" data-id="${f.id}"><div class="sec-head"><b>${esc(f.name)}</b><span class="muted">${pct.toFixed(0)}%</span></div>
      <div class="bar"><div style="width:${pct}%"></div></div>
      <div class="muted">${t("savedSoFar", { bal: fmt(bal), target: fmt(f.target) })}</div>
      ${pos.map(([uid, v], i) => `<div class="mbar">${avatarEl(ws()?.memberInfo?.[uid]?.avatar, memberName(uid), "av xs")}<span class="nm">${esc(memberName(uid))}</span><div class="bar"><div style="width:${sum ? (v / sum) * 100 : 0}%;background:${colors[(i + 1) % colors.length]}"></div></div><span>${sum ? Math.round((v / sum) * 100) : 0}%</span></div>`).join("")}</div>`;
  }).join("") : `<div class="empty">${t("emptyFunds")}</div>`;
  $("#fund-list").querySelectorAll(".fund").forEach((el) => (el.onclick = () => openFund(el.dataset.id)));
}
function openFundMenu() {
  if (!S.wsId) return toast(t("needWs"));
  openModal(`<h3>${t("fundMenu")}</h3><div class="choice-list"><button class="btn primary block" id="fm-new" type="button">${t("newGoal")}</button><button class="btn block" id="fm-txn" type="button">${t("addTxn")}</button></div>`);
  $("#fm-new").onclick = () => openFundForm();
  $("#fm-txn").onclick = () => { if (!S.funds.length) { toast(t("needFund")); openFundForm(); } else openQuickTxn(); };
}
function openQuickTxn() {
  if (!S.funds.length) return toast(t("needFund"));
  openModal(`<h3>${t("addTxn")}</h3>
  <label>${t("chooseFund")}</label><select id="qt-fund">${opts(S.funds, S.funds[0].id)}</select>
  <div class="seg" id="qt-type"><button type="button" data-t="deposit" class="on">${t("deposit")}</button><button type="button" data-t="withdraw">${t("withdraw")}</button></div>
  <label>${t("amount")} (${esc(currencyOf(ws()).symbol)})</label><input id="qt-amt" type="number" inputmode="decimal" placeholder="0.00">
  <label>${t("date")}</label><input id="qt-date" type="date" value="${today()}">
  <label>${t("payer")}</label><select id="qt-mem">${opts(memberList(), S.user.uid)}</select>
  <label>${t("remark")}</label><input id="qt-rem" placeholder="${esc(t("optional"))}">
  <div class="btns"><button class="btn" id="qt-cancel" type="button">${t("cancel")}</button><button class="btn primary" id="qt-save" type="button">${t("confirm")}</button></div>`);
  let type = "deposit";
  $("#qt-type").querySelectorAll("button").forEach((b) => (b.onclick = () => { type = b.dataset.t; $("#qt-type").querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b)); }));
  $("#qt-cancel").onclick = closeModal;
  $("#qt-save").onclick = () => {
    const amount = Math.round(parseFloat($("#qt-amt").value) * 100) / 100;
    const fundId = $("#qt-fund").value;
    if (!fundId) return toast(t("needFund"));
    if (!(amount > 0)) return toast(t("needAmount"));
    addDoc(wsRef("funds", fundId, "txns"), { type, amount, date: $("#qt-date").value || today(), memberUid: $("#qt-mem").value, remark: $("#qt-rem").value.trim(), createdAt: serverTimestamp() }).catch((x) => toast(errMsg(x)));
    toast(t("recorded")); closeModal();
  };
}
function openFundForm(f) {
  openModal(`<h3>${f ? t("editGoal") : t("newGoal")}</h3><label>${t("goalName")}</label><input id="fd-name" value="${esc(f?.name || "")}" placeholder="${esc(t("goalPh"))}">
  <label>${t("goalAmount")} (${esc(currencyOf(ws()).symbol)})</label><input id="fd-target" type="number" inputmode="decimal" value="${f ? esc(f.target) : ""}">
  <div class="btns"><button class="btn" id="fd-cancel" type="button">${t("cancel")}</button><button class="btn primary" id="fd-save" type="button">${t("save")}</button></div>`);
  $("#fd-cancel").onclick = closeModal;
  $("#fd-save").onclick = () => {
    const name = $("#fd-name").value.trim(), target = parseFloat($("#fd-target").value) || 0;
    if (!name) return toast(t("needName"));
    (f ? updateDoc(doc(wsRef("funds"), f.id), { name, target }) : addDoc(wsRef("funds"), { name, target, createdAt: serverTimestamp() })).catch((x) => toast(errMsg(x)));
    closeModal();
  };
}
function openFund(id) {
  const f = S.funds.find((x) => x.id === id); if (!f) return;
  const { tx, bal } = fundStats(f);
  const list = [...tx].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  openModal(`<div class="sec-head"><h3>${esc(f.name)}</h3><span><button class="btn small" id="fu-edit" type="button">${t("edit")}</button> <button class="btn small danger" id="fu-del" type="button">${t("delete")}</button></span></div>
  <div class="muted">${t("balanceLine", { bal: fmt(bal), target: fmt(f.target) })}</div>
  <div class="seg" id="fu-type" style="margin-top:10px"><button type="button" data-t="deposit" class="on">${t("deposit")}</button><button type="button" data-t="withdraw">${t("withdraw")}</button></div>
  <label>${t("amount")} (${esc(currencyOf(ws()).symbol)})</label><input id="fu-amt" type="number" inputmode="decimal" placeholder="0.00"><input id="fu-date" type="date" value="${today()}">
  <select id="fu-mem">${opts(memberList(), S.user.uid)}</select><input id="fu-rem" placeholder="${esc(t("optional"))}">
  <button class="btn primary block" id="fu-save" type="button">${t("confirm")}</button>
  <h3 style="margin-top:16px">${t("records")}</h3>${list.length ? list.map((txn) => `<div class="list-row"><span>${txn.type === "withdraw" ? t("withdraw") : t("deposit")} · ${esc(memberName(txn.memberUid))}<br><span class="muted">${esc(txn.date || "")} ${esc(txn.remark || "")}</span></span><span>${txn.type === "withdraw" ? "-" : "+"}${fmt(txn.amount)} <button class="del" type="button" data-tid="${txn.id}">${t("delete")}</button></span></div>`).join("") : `<div class="muted">${t("noRecords")}</div>`}
  <button class="btn block" id="fu-close" type="button">${t("close")}</button>`);
  let type = "deposit";
  $("#fu-type").querySelectorAll("button").forEach((b) => (b.onclick = () => { type = b.dataset.t; $("#fu-type").querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b)); }));
  $("#fu-close").onclick = closeModal;
  $("#fu-edit").onclick = () => openFundForm(f);
  $("#fu-del").onclick = async () => {
    if (!confirm(t("confirmDeleteFund"))) return;
    const b = writeBatch(db); tx.forEach((txn) => b.delete(doc(wsRef("funds", f.id, "txns"), txn.id))); b.delete(doc(wsRef("funds"), f.id));
    b.commit().catch((x) => toast(errMsg(x))); closeModal();
  };
  $("#fu-save").onclick = () => {
    const amount = Math.round(parseFloat($("#fu-amt").value) * 100) / 100;
    if (!(amount > 0)) return toast(t("needAmount"));
    addDoc(wsRef("funds", f.id, "txns"), { type, amount, date: $("#fu-date").value || today(), memberUid: $("#fu-mem").value, remark: $("#fu-rem").value.trim(), createdAt: serverTimestamp() }).catch((x) => toast(errMsg(x)));
    toast(t("recorded")); setTimeout(() => openFund(f.id), 150);
  };
  $("#sheet").querySelectorAll("[data-tid]").forEach((a) => (a.onclick = () => { if (confirm(t("confirmDeleteTxn"))) { deleteDoc(doc(wsRef("funds", f.id, "txns"), a.dataset.tid)); setTimeout(() => openFund(f.id), 150); } }));
}

/* ---------- Profile, icons, settings ---------- */
function ensureEmojiPicker() {
  if (customElements.get("emoji-picker")) return Promise.resolve();
  if (!emojiReady) emojiReady = import("https://cdn.jsdelivr.net/npm/emoji-picker-element@" + EMOJI_VER + "/index.js");
  return emojiReady;
}
async function openFullEmojiPicker(current, onPick, onCancel) {
  try {
    await ensureEmojiPicker();
    const zh = S.lang !== "en";
    if (zh && !emojiZh) emojiZh = import("https://cdn.jsdelivr.net/npm/emoji-picker-element@" + EMOJI_VER + "/i18n/zh_CN.js").then((m) => m.default);
    const i18n = zh ? await emojiZh : null;
    const src = "https://cdn.jsdelivr.net/npm/emoji-picker-element-data@1/" + (zh ? "zh" : "en") + "/emojibase/data.json";
    openModal(`<h3>${t("pickIcon")}</h3><emoji-picker class="${S.theme === "dark" ? "dark" : "light"}" locale="${zh ? "zh" : "en"}" data-source="${src}"></emoji-picker><button class="btn block" id="em-close" type="button">${t("cancel")}</button>`);
    const picker = $("#sheet").querySelector("emoji-picker");
    if (i18n && picker) picker.i18n = i18n;
    if (picker) picker.addEventListener("emoji-click", (ev) => {
      const emoji = ev.detail && (ev.detail.unicode || (ev.detail.emoji && ev.detail.emoji.unicode));
      const safe = safeIcon(emoji);
      if (!safe) return;
      closeModal();
      onPick(safe);
    });
    $("#em-close").onclick = () => { closeModal(); if (onCancel) onCancel(); };
  } catch (err) { toast(t("emojiFail")); if (onCancel) onCancel(); }
}
function openCatForm(cat, draft) {
  const icon = (draft && draft.icon) || safeIcon(cat && cat.icon) || "🏷️";
  const name = draft && draft.name != null ? draft.name : ((cat && cat.name) || "");
  openModal(`<h3>${cat ? t("editCategory") : t("newCat")}</h3>
    <label>${t("catName")}</label><input id="c-name" maxlength="40" value="${esc(name)}">
    <label>${t("pickIcon")}</label><button class="ic-pick" id="c-icon" type="button">${esc(icon)}</button>
    <div class="btns">${cat ? `<button class="btn danger" id="c-del" type="button">${t("delete")}</button>` : ""}<button class="btn" id="c-cancel" type="button">${t("cancel")}</button><button class="btn primary" id="c-save" type="button">${t("save")}</button></div>`);
  $("#c-cancel").onclick = closeModal;
  $("#c-icon").onclick = () => {
    const typed = $("#c-name") ? $("#c-name").value : name;
    openFullEmojiPicker(icon, (emoji) => openCatForm(cat, { name: typed, icon: emoji }), () => openCatForm(cat, { name: typed, icon }));
  };
  $("#c-save").onclick = () => {
    const n = $("#c-name").value.trim();
    if (!n) return toast(t("needName"));
    const op = cat
      ? updateDoc(doc(wsRef("categories"), cat.id), { name: n, icon })
      : addDoc(wsRef("categories"), { name: n, icon, order: S.cats.length, createdAt: serverTimestamp() });
    op.catch((x) => toast(errMsg(x)));
    closeModal();
    toast(t("saved"));
  };
  if (cat && $("#c-del")) $("#c-del").onclick = () => {
    if (!confirm(t("confirmDelete"))) return;
    deleteDoc(doc(wsRef("categories"), cat.id)).catch((x) => toast(errMsg(x)));
    closeModal();
  };
  onEnter($("#c-name"), () => $("#c-save").click());
}
function openAvatarPicker(nameOverride) {
  const useName = String(nameOverride || S.profile.name || fallbackName()).trim();
  const cur = safeAvatar(S.profile.avatar);
  const curEmoji = cur.startsWith("emoji:") ? cur.slice(6) : "";
  openModal(`<h3>${t("changeAvatar")}</h3><div class="emoji-grid">${PRESET_AVATARS.map((e, i) => `<button type="button" class="emoji-btn${e === curEmoji ? " on" : ""}" data-i="${i}">${e}</button>`).join("")}</div>
    <div class="btns"><button class="btn" id="av-up" type="button">${t("uploadPhoto")}</button><button class="btn" id="av-clear" type="button">${t("removePhoto")}</button></div>
    <input id="av-file" type="file" accept="image/*" class="hidden">
    <button class="btn block" id="av-close" type="button">${t("cancel")}</button>`);
  const pick = (avatar) => saveProfile({ name: useName, avatar });
  $("#sheet").querySelectorAll(".emoji-btn").forEach((b) => (b.onclick = () => { const emoji = PRESET_AVATARS[Number(b.dataset.i)]; closeModal(); pick("emoji:" + emoji); }));
  $("#av-clear").onclick = () => { closeModal(); pick(""); };
  $("#av-close").onclick = closeModal;
  $("#av-up").onclick = () => $("#av-file").click();
  $("#av-file").onchange = async () => {
    const file = $("#av-file").files && $("#av-file").files[0];
    if (!file) return;
    toast(t("wait"));
    try { const data = await compressImage(file); closeModal(); pick(data); }
    catch (err) { toast(err && err.message === "big" ? t("photoTooBig") : t("photoFail")); }
  };
}
function openProfile() {
  if (!S.user) return;
  const name = S.profile.name || fallbackName();
  openModal(`<h3>${t("profile")}</h3><div class="profile-modal">${avatarEl(S.profile.avatar, name, "av lg")}</div>
    <button class="btn block" id="p-av" type="button">${t("changeAvatar")}</button>
    <label>${t("displayName")}</label><input id="p-name" maxlength="40" value="${esc(name)}">
    <p class="muted">${esc(S.user.email || "")}</p>
    <div class="btns"><button class="btn" id="p-cancel" type="button">${t("cancel")}</button><button class="btn primary" id="p-save" type="button">${t("save")}</button></div>`);
  $("#p-cancel").onclick = closeModal;
  $("#p-av").onclick = () => openAvatarPicker($("#p-name").value);
  $("#p-save").onclick = () => { saveProfile({ name: $("#p-name").value }); closeModal(); };
  onEnter($("#p-name"), () => { saveProfile({ name: $("#p-name").value }); closeModal(); });
}
function currencyOptions(sel) {
  return CURRENCIES.map((c) => `<option value="${c.code}"${c.code === sel ? " selected" : ""}>${c.code} · ${esc(c.symbol)} ${esc(S.lang === "en" ? c.en : c.zh)}</option>`).join("");
}
function renderSettings() {
  const w = ws(), el = $("#settings");
  if (!el || !S.user) return;
  const name = S.profile.name || fallbackName();
  const parts = [];
  parts.push(`<div class="card profile-card"><button id="s-avatar" class="avatar-btn" type="button">${avatarEl(S.profile.avatar, name, "av lg")}</button><div class="profile-fields"><label class="sec-title">${t("displayName")}</label><div class="inline"><input id="s-dname" maxlength="40" value="${esc(name)}"><button class="btn primary" id="s-savename" type="button">${t("save")}</button></div><div class="muted">${esc(S.user.email || "")}</div></div></div>`);
  parts.push(`<div class="card"><b class="sec-title">${t("language")}</b><div class="seg" id="s-lang"><button type="button" data-lang="zh" class="${S.lang === "zh" ? "on" : ""}">简体中文</button><button type="button" data-lang="en" class="${S.lang === "en" ? "on" : ""}">English</button></div><b class="sec-title blk">${t("theme")}</b><div class="themes">${["fresh", "warm", "dark"].map((id) => `<button type="button" class="theme-opt${S.theme === id ? " on" : ""}" data-theme-pick="${id}"><i class="swatch ${id}"></i><span>${t("theme_" + id)}</span></button>`).join("")}</div></div>`);
  if (!w) parts.push(`<div class="card empty">${t("noWs")}</div>`);
  else {
    const isOwner = w.ownerUid === S.user.uid;
    const catRow = (c) => {
      const icon = safeIcon(c.icon);
      const face = icon ? esc(icon) : esc(firstChar(c.name));
      return `<div class="list-row"><button class="ic-pick${icon ? "" : " letter"}" type="button" data-edit="${c.id}">${face}</button><button class="grow cat-name" type="button" data-edit="${c.id}">${esc(c.name)}</button><button class="del" type="button" data-k="categories" data-id="${c.id}">${t("delete")}</button></div>`;
    };
    const cardRow = (c) => `<div class="list-row"><span class="grow">${esc(c.name)}</span><button class="del" type="button" data-k="cards" data-id="${c.id}">${t("delete")}</button></div>`;
    parts.push(`<div class="card"><b class="sec-title">${t("wsName")}</b><div class="inline"><input id="s-name" value="${esc(w.name)}"><button class="btn primary" id="s-rename" type="button">${t("save")}</button></div><label class="sec-title">${t("currency")}</label><select id="s-cur">${currencyOptions(currencyOf(w).code)}</select><div class="muted">${t("currencyHint")}</div></div>`);
    parts.push(`<div class="card"><b class="sec-title">${t("categories")}</b>${S.cats.map(catRow).join("")}<button class="btn block" id="s-addcat" type="button">${t("add")}</button></div>`);
    parts.push(`<div class="card"><b class="sec-title">${t("cards")}</b>${S.cards.map(cardRow).join("")}<div class="inline"><input id="s-card" placeholder="${esc(t("newCardPh"))}"><button class="btn primary" id="s-addcard" type="button">${t("add")}</button></div></div>`);
    parts.push(`<div class="card"><b class="sec-title">${t("members")}</b>${(w.members || []).map((uid) => `<div class="list-row"><span class="who">${avatarEl(w.memberInfo?.[uid]?.avatar, memberName(uid), "av")}<span class="meta">${esc(memberName(uid))}${uid === w.ownerUid ? ` <span class="muted">（${t("owner")}）</span>` : ""}<span class="muted em">${esc(w.memberInfo?.[uid]?.email || "")}</span></span></span>${isOwner && uid !== w.ownerUid ? `<button class="del" type="button" data-rm="${uid}">${t("remove")}</button>` : ""}</div>`).join("")}
      ${(w.invitedEmails || []).map((em) => `<div class="list-row"><span class="muted grow">⏳ ${esc(em)}（${t("pending")}）</span><button class="del" type="button" data-unv="${esc(em)}">${t("revoke")}</button></div>`).join("")}
      <div class="inline"><input id="s-inv" type="email" placeholder="${esc(t("invitePh"))}"><button class="btn primary" id="s-invite" type="button">${t("invite")}</button></div>
      <div class="muted">${t("inviteHint")}</div></div>`);
    if (!isOwner) parts.push(`<button class="btn danger block" id="s-leave" type="button">${t("leaveWs")}</button>`);
  }
  parts.push(`<button class="btn block" id="s-logout" type="button">${t("logout")}</button>`);
  el.innerHTML = parts.join("");
  $("#s-avatar").onclick = () => openAvatarPicker();
  const saveName = () => saveProfile({ name: $("#s-dname").value });
  $("#s-savename").onclick = saveName;
  onEnter($("#s-dname"), saveName);
  el.querySelectorAll("#s-lang [data-lang]").forEach((b) => (b.onclick = () => setLang(b.dataset.lang, true)));
  el.querySelectorAll("[data-theme-pick]").forEach((b) => (b.onclick = () => setTheme(b.dataset.themePick, true)));
  if (w) {
    $("#s-rename").onclick = () => {
      const n = $("#s-name").value.trim();
      if (!n) return;
      w.name = n;
      updateDoc(wsRef(), { name: n }).then(() => toast(t("saved"))).catch((x) => toast(errMsg(x)));
      renderTop();
    };
    onEnter($("#s-name"), () => $("#s-rename").click());
    $("#s-cur").onchange = () => {
      const code = $("#s-cur").value;
      if (!CURRENCIES.some((c) => c.code === code)) return;
      w.currency = code;
      updateDoc(wsRef(), { currency: code }).then(() => toast(t("saved"))).catch((x) => toast(errMsg(x)));
    };
    $("#s-addcat").onclick = () => openCatForm(null);
    el.querySelectorAll("[data-edit]").forEach((b) => (b.onclick = () => openCatForm(S.cats.find((c) => c.id === b.dataset.edit))));
    const addCard = () => { const n = $("#s-card").value.trim(); if (n) addDoc(wsRef("cards"), { name: n, createdAt: serverTimestamp() }).catch((x) => toast(errMsg(x))); };
    $("#s-addcard").onclick = addCard;
    onEnter($("#s-card"), addCard);
    el.querySelectorAll("[data-k]").forEach((a) => (a.onclick = () => { if (confirm(t("confirmDelete"))) deleteDoc(doc(wsRef(a.dataset.k), a.dataset.id)).catch((x) => toast(errMsg(x))); }));
    const invite = () => {
      const email = $("#s-inv").value.trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(email)) return toast(t("badEmail"));
      if (Object.values(w.memberInfo || {}).some((m) => m.email === email)) return toast(t("alreadyMember"));
      updateDoc(wsRef(), { invitedEmails: arrayUnion(email) }).then(() => toast(t("inviteSent"))).catch((x) => toast(errMsg(x)));
    };
    $("#s-invite").onclick = invite;
    onEnter($("#s-inv"), invite);
    el.querySelectorAll("[data-unv]").forEach((a) => (a.onclick = () => updateDoc(wsRef(), { invitedEmails: arrayRemove(a.dataset.unv) }).catch((x) => toast(errMsg(x)))));
    el.querySelectorAll("[data-rm]").forEach((a) => (a.onclick = () => { if (confirm(t("confirmRemove"))) updateDoc(wsRef(), { members: arrayRemove(a.dataset.rm), [`memberInfo.${a.dataset.rm}`]: deleteField() }).catch((x) => toast(errMsg(x))); }));
    if ($("#s-leave")) $("#s-leave").onclick = () => { if (confirm(t("confirmLeave"))) { const id = S.wsId; updateDoc(doc(db, "workspaces", id), { members: arrayRemove(S.user.uid) }).catch((x) => toast(errMsg(x))); localStorage.removeItem("ws_" + S.user.uid); switchWs(S.wsList.find((x) => x.id !== id)?.id); } };
  }
  $("#s-logout").onclick = () => { if (confirm(t("confirmLogout"))) signOut(auth); };
}

setTheme(S.theme, false);
setLang(S.lang, false);
