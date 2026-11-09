import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, updateProfile } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, doc, addDoc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, onSnapshot, query, where, writeBatch, runTransaction, serverTimestamp, arrayUnion, arrayRemove, deleteField } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
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
const THEMES = ["fresh", "warm", "forest", "dark"];
const PALETTES = {
  fresh: ["#10b981", "#3b82f6", "#f59e0b", "#f43f5e", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16", "#0ea5e9"],
  warm: ["#fb7185", "#fb923c", "#f59e0b", "#e879f9", "#a78bfa", "#34d399", "#f97316", "#f43f5e", "#22d3ee", "#facc15", "#c084fc"],
  forest: ["#2d6a4f", "#b7791f", "#52b788", "#9c4221", "#40916c", "#c05621", "#74c69d", "#744210", "#1b4332", "#d69e2e", "#95d5b2"],
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
const DEFAULT_INCOME_CATS = [
  { zh: "工资", en: "Salary", icon: "💼" },
  { zh: "奖金", en: "Bonus", icon: "🎁" },
  { zh: "其他收入", en: "Other income", icon: "💰" }
];
const PRESET_AVATARS = ["🦊", "🐼", "🐯", "🦁", "🐨", "🐸", "🦄", "🐙", "🐶", "🐱", "🐻", "🐰", "🐧", "🦋", "🌸", "🍀", "⭐", "🌙", "🔥", "💎", "🌈", "☀️", "🎧", "🚀", "🍕", "⚽"];
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
  ["monthSpend", "本月支出", "Spent this month"],
  ["chartCat", "分类", "Category"],
  ["chartCard", "银行卡", "Card"],
  ["chartMember", "成员", "Member"],
  ["emptyChart", "这个月还没有支出", "No spending this month"],
  ["emptyMonth", "本月还没有记录，点下方中间的 ＋ 记一笔", "Nothing this month yet. Tap the ＋ below to add one."],
  ["fundsTitle", "存款 · Tabung", "Savings · Tabung"],
  ["emptyFunds", "还没有存款目标。点下方中间的 ＋，再选「存款」，就可以开一个和成员一起存钱的目标。", "No savings goals yet. Tap ＋ below, then Savings, to start one with your members."],
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
  ["removeReceipt", "移除小票", "Remove receipt"],
  ["emojiFail", "表情加载失败，请检查网络", "Couldn't load emojis. Check your connection."],
  ["emojiAll", "全部", "All"],
  ["emojiSmile", "表情", "Smileys"],
  ["emojiPeople", "人物", "People"],
  ["emojiNature", "动物", "Nature"],
  ["emojiFood", "食物", "Food"],
  ["emojiTravel", "旅行", "Travel"],
  ["emojiActivity", "活动", "Activity"],
  ["emojiObjects", "物品", "Objects"],
  ["emojiSymbols", "符号", "Symbols"],
  ["emojiFlags", "旗帜", "Flags"],
  ["emojiSearch", "搜索表情", "Search emojis"],
  ["emojiEmpty", "没有匹配的表情", "No matching emojis"],
  ["deleteWs", "删除账本", "Delete workspace"],
  ["deleteWsWarn", "会删除这个账本里的全部分类、账户、账单、小票和存款，而且无法恢复。", "This deletes every category, card, expense, receipt, and savings goal in this workspace. It cannot be undone."],
  ["typeWsName", "输入 {name} 以确认", "Type {name} to confirm"],
  ["wsDeleted", "账本已删除", "Workspace deleted"],
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
  ["inviteHint", "对方用这个邮箱注册或登录后，打开应用就能看到邀请。把下面的文字发给对方即可。", "After they register or sign in with this email, the invite is waiting in the app. Send them the message below."],
  ["inviteShare", "我想邀请你一起记账「{ws}」。请用这个邮箱注册或登录：{email}\n打开：{url}", "Join my expense workspace “{ws}”. Register or sign in with this email: {email}\nOpen: {url}"],
  ["copyInvite", "复制邀请", "Copy invite"],
  ["shareInvite", "发送", "Share"],
  ["copied", "已复制，可以发给对方了", "Copied. You can send it now."],
  ["copyFail", "请长按文字手动复制", "Select the text and copy it."],
  ["invitesTitle", "你收到的邀请", "Invitations"],
  ["noWsYet", "还没有自己的账本", "You don't have a workspace yet"],
  ["noWsHint", "可以新建一个，或接受上面的邀请。", "Create one, or accept an invite above."],
  ["createOwn", "创建我的账本", "Create my workspace"],
  ["reportTitle", "报表", "Reports"],
  ["tabReport", "报表", "Reports"],
  ["trendTitle", "近 6 个月", "Last 6 months"],
  ["change", "变化", "Change"],
  ["higher", "↑ {n}%", "↑ {n}%"],
  ["lower", "↓ {n}%", "↓ {n}%"],
  ["flat", "持平", "No change"],
  ["newSpend", "新增", "New"],
  ["goneSpend", "没有了", "None"],
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
  ["errGeneric", "出错了，请重试", "Something went wrong. Try again."],
  ["prevMonth", "上个月", "Previous month"],
  ["nextMonth", "下个月", "Next month"],
  ["fanExpense", "消费", "Expense"],
  ["fanExpenseSub", "支出或收入", "Spending or income"],
  ["fanFund", "存款", "Savings"],
  ["fanFundSub", "Tabung 存入或新目标", "Tabung deposit or new goal"],
  ["theme_forest", "森林", "Forest"],
  ["catTrend", "分类变化", "Category changes"],
  ["catTrendHint", "最近 6 个月每个分类花了多少", "How much each category cost over the last 6 months"],
  ["top5", "前 5 名", "Top 5"],
  ["vsLastMonth", "对比上月", "vs last month"],
  ["breakdown", "这个月花在哪里", "Where this month went"],
  ["monthlyShort", "每月", "Monthly"],
  ["monthlyOn", "每月 {day} 日", "Day {day} monthly"],
  ["dragHint", "按住 ⋮⋮ 拖动排序", "Drag ⋮⋮ to reorder"],
  ["typeLabel", "收支", "Type"],
  ["typeExpense", "支出", "Expense"],
  ["typeIncome", "收入", "Income"],
  ["allTypes", "收入和支出", "Income & expenses"],
  ["monthIncome", "收入", "Income"],
  ["monthNet", "结余", "Net"],
  ["addIncome", "记收入", "Add income"],
  ["editIncome", "编辑收入", "Edit income"],
  ["expenseCats", "支出分类", "Expense categories"],
  ["incomeCats", "收入分类", "Income categories"],
  ["budget", "预算", "Budget"],
  ["monthlyBudget", "每月总预算", "Monthly budget"],
  ["budgetHint", "填 0 表示不设预算。所有成员看到的一样。", "Enter 0 for no budget. Everyone in this workspace sees it."],
  ["catBudget", "这个分类的每月预算", "Monthly budget for this category"],
  ["catBudgetHint", "填 0 表示不设。首页会显示花了多少。", "Enter 0 for none. Home shows how much is used."],
  ["budgetUsed", "已花 {spent} / 预算 {budget}", "{spent} of {budget}"],
  ["budgetLeft", "还剩 {amount}", "{amount} left"],
  ["budgetOver", "超支 {amount}", "{amount} over"],
  ["budgetTotal", "本月总预算", "This month's budget"],
  ["recurring", "固定账单", "Recurring"],
  ["repeatHint", "已保存。以后每月 {day} 日自动记上", "Saved. Added again on day {day} every month"],
  ["recurringEmpty", "还没有固定账单。房租、订阅、工资都可以设成每月自动记。", "No recurring items yet. Rent, subscriptions, and salary can be added every month."],
  ["recurDay", "每月几号", "Day of month"],
  ["recurDayHint", "29–31 号在短月份会记在当月最后一天。", "Days 29–31 fall on the last day in shorter months."],
  ["recurNext", "下一次：{date}", "Next: {date}"],
  ["newRecurring", "新建固定账单", "New recurring item"],
  ["editRecurring", "编辑固定账单", "Edit recurring item"],
  ["paused", "已暂停", "Paused"],
  ["pause", "暂停", "Pause"],
  ["resume", "恢复", "Resume"],
  ["everyMonthDay", "每月 {day} 日", "Monthly on day {day}"],
  ["recurAdded", "已自动记上 {n} 笔固定账单", "Added {n} recurring entries"],
  ["confirmDeleteRecurring", "删除这个固定账单？已经记上的账单会保留。", "Delete this recurring item? Entries already added stay."],
  ["needDay", "请填 1 到 31 之间的日期", "Enter a day from 1 to 31"]
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
  try { const th = localStorage.getItem("pref_theme"); if (THEMES.includes(th)) return th; } catch (e) {}
  return "fresh";
}
function storedLang() {
  try { if (localStorage.getItem("pref_lang") === "en") return "en"; } catch (e) {}
  return "zh";
}

function emptyFilters(open) { return { type: "", cat: "", card: "", member: "", q: "", from: "", to: "", open: !!open }; }
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }
const isIncome = (e) => e && e.type === "income";
const catKind = (c) => (c && c.kind === "income" ? "income" : "expense");

const S = {
  user: null, profile: { name: "", avatar: "" }, profileReady: false, userDocExists: false,
  theme: storedTheme(), lang: storedLang(),
  wsList: [], invites: [], wsId: null, cats: [], cards: [], expenses: [], funds: [], txns: {}, recurring: [],
  month: new Date(), page: "home",
  repMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1), repMode: "cat", repCats: null, repCatsOpen: false,
  reportRows: [], reportKey: "", dragging: false,
  filters: emptyFilters(false)
};
let unsubWs = [], unsubData = [], unsubTxns = {}, chart = null;
let localProfileTouched = false, localThemeTouched = false, localLangTouched = false;
let regMode = false, registerCreate = false, pendingName = "", creatingWs = false;
const APP_URL = "https://kenny193.github.io/expense-app/";
let receiptDraft = null;
const emojiCache = {};
const EMOJI_GROUPS = [["all", "emojiAll"], [0, "emojiSmile"], [1, "emojiPeople"], [3, "emojiNature"], [4, "emojiFood"], [5, "emojiTravel"], [6, "emojiActivity"], [7, "emojiObjects"], [8, "emojiSymbols"], [9, "emojiFlags"]];

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
const fmt = (n) => { const c = currencyOf(ws()); const neg = Number(n) < -0.004; const v = money(Math.abs(Number(n) || 0)); return (neg ? "-" : "") + (c.space ? c.symbol + " " + v : c.symbol + v); };
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
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => el.setAttribute("aria-label", t(el.dataset.i18nAria)));
}
function chartBorder() {
  return getComputedStyle(document.documentElement).getPropertyValue("--card").trim() || "#fff";
}
function setTheme(theme, persist) {
  const next = THEMES.includes(theme) ? theme : "fresh";
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
  if ((changed || persist) && S.user && S.page === "report") renderReport();
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
    if (!localThemeTouched && THEMES.includes(d.theme)) setTheme(d.theme, false);
    if (!localLangTouched && (d.lang === "zh" || d.lang === "en")) setLang(d.lang, false);
  } else if (!localProfileTouched) {
    adoptWorkspaceProfile();
    if (!S.profile.name) S.profile.name = fallbackName();
    pushUserDoc();
  }
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
  const email = (u.email || "").trim().toLowerCase();
  let firstLoad = true;
  // includeMetadataChanges: we also hear when a new workspace is confirmed by the server.
  // Its data can only be read after that, so switching to it earlier gives "no permission".
  unsubWs.push(onSnapshot(query(collection(db, "workspaces"), where("members", "array-contains", u.uid)), { includeMetadataChanges: true }, (snap) => {
    S.wsList = snap.docs.map((d) => ({ id: d.id, ...d.data(), _pending: d.metadata.hasPendingWrites && !d.data().createdAt })).sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
    if (!S.userDocExists && !localProfileTouched) adoptWorkspaceProfile();
    if (!S.wsList.length) {
      renderNoWs();
      if (firstLoad && !snap.metadata.fromCache && !registerCreate && !creatingWs) {
        firstLoad = false;
        const id = createWorkspace(t("personalWs"), u);
        lsSet("ws_" + u.uid, id);
      }
      return;
    }
    firstLoad = false;
    const saved = lsGet("ws_" + u.uid);
    const ready = S.wsList.filter((w) => !w._pending);
    const want = S.pendingSwitch && ready.find((w) => w.id === S.pendingSwitch);
    if (want) { S.pendingSwitch = ""; switchWs(want.id); }
    else if (!ws()) {
      const target = ready.find((w) => w.id === saved) || (S.wsList.some((w) => w.id === saved && w._pending) ? null : ready[0]);
      if (target) switchWs(target.id); else { renderTop(); renderNoWs(); }
    } else { maybeMirror(); renderTop(); renderAll(); }
  }, (e) => { toast(errMsg(e)); renderNoWs(); }));
  if (email) unsubWs.push(onSnapshot(query(collection(db, "workspaces"), where("invitedEmails", "array-contains", email)), (snap) => {
    S.invites = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((w) => !(w.members || []).includes(u.uid));
    renderInvites();
  }, () => {}));
  unsubWs.push(onSnapshot(doc(db, "users", u.uid), handleUserDoc, () => {
    S.profileReady = true; S.userDocExists = false; adoptWorkspaceProfile(); renderTop(); renderAll();
  }));
});

function createWorkspace(name, u = S.user) {
  const ref = doc(collection(db, "workspaces"));
  const display = (u.uid === S.user?.uid && S.profile.name) ? S.profile.name : (u.displayName || (u.email || "").split("@")[0] || "User");
  const avatar = u.uid === S.user?.uid ? (S.profile.avatar || "") : "";
  const lang = S.lang === "en" ? "en" : "zh";
  creatingWs = true;
  // Save the workspace by itself first. Rules can only see a member after this
  // write exists, so categories and the default card go in a second write.
  setDoc(ref, {
    name, ownerUid: u.uid, members: [u.uid], currency: "CNY", invitedEmails: [], incomeSeeded: true, createdAt: serverTimestamp(),
    memberInfo: { [u.uid]: { email: (u.email || "").trim().toLowerCase(), name: display, avatar } }
  }).then(() => {
    const b = writeBatch(db);
    DEFAULT_CATS.forEach((c, i) => b.set(doc(collection(ref, "categories")), { name: c[lang], icon: c.icon, order: i, createdAt: serverTimestamp() }));
    DEFAULT_INCOME_CATS.forEach((c, i) => b.set(doc(collection(ref, "categories")), { name: c[lang], icon: c.icon, kind: "income", order: 50 + i, createdAt: serverTimestamp() }));
    b.set(doc(collection(ref, "cards")), { name: lang === "en" ? "Default card" : "默认卡", createdAt: serverTimestamp() });
    return b.commit();
  }).catch((e) => toast(errMsg(e))).finally(() => { creatingWs = false; });
  return ref.id;
}
function clearData() {
  unsubData.forEach((f) => f()); unsubData = [];
  Object.values(unsubTxns).forEach((f) => f()); unsubTxns = {};
  Object.assign(S, { cats: [], cards: [], expenses: [], funds: [], txns: {}, recurring: [], reportRows: [], reportKey: "", repCats: null });
}
function switchWs(id) {
  clearData(); S.wsId = id || null;
  S.filters = emptyFilters(false);
  S.inviteText = "";
  if (!id) { renderTop(); renderAll(); return; }
  lsSet("ws_" + S.user.uid, id);
  const byTime = (a, b) => (a.order ?? 99) - (b.order ?? 99) || (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
  const sub = (name, key, after) => unsubData.push(onSnapshot(wsRef(name), (s) => { S[key] = s.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byTime); after && after(s); renderAll(); }, (e) => toast(errMsg(e))));
  sub("categories", "cats", refreshOpenCatSelects); sub("cards", "cards"); sub("funds", "funds", syncTxns);
  sub("recurring", "recurring", (snap) => { if (!snap.metadata.fromCache) runRecurring(); });
  unsubData.push(() => { if (S.expUnsub) { S.expUnsub(); S.expUnsub = null; } if (S.reportUnsub) { S.reportUnsub(); S.reportUnsub = null; } S.reportKey = ""; });
  subReport();
  subExpenses(); renderTop(); renderAll();
}
function subExpenses() {
  if (S.expUnsub) S.expUnsub();
  const { start, end } = monthRange(S.month);
  S.expUnsub = onSnapshot(query(wsRef("expenses"), where("date", ">=", start), where("date", "<=", end)), (s) => { S.expenses = s.docs.map((d) => ({ id: d.id, ...d.data() })); renderHome(); }, (e) => toast(errMsg(e)));
}
function syncTxns() {
  const ids = S.funds.map((f) => f.id);
  Object.keys(unsubTxns).forEach((id) => { if (!ids.includes(id)) { unsubTxns[id](); delete unsubTxns[id]; delete S.txns[id]; } });
  ids.forEach((id) => { if (!unsubTxns[id]) unsubTxns[id] = onSnapshot(wsRef("funds", id, "txns"), (s) => { S.txns[id] = s.docs.map((d) => ({ id: d.id, ...d.data() })); renderFunds(); }); });
}

/* ---------- Recurring ---------- */
const monthShift = (m, n) => { const [y, mo] = m.split("-").map(Number); const d = new Date(y, mo - 1 + n, 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; };
const dayInMonth = (m, day) => { const [y, mo] = m.split("-").map(Number); return Math.min(Math.max(1, Math.floor(Number(day) || 1)), new Date(y, mo, 0).getDate()); };
// Months whose entry is due but not added yet: after lastMonth, up to today.
function dueMonths(r, now = new Date()) {
  if (!r || r.active === false || !(Number(r.amount) > 0)) return [];
  if (!(Number(r.day) >= 1 && Number(r.day) <= 31) || !/^\d{4}-\d{2}$/.test(r.lastMonth || "")) return [];
  const cur = monthValue(now), out = [];
  let m = monthShift(r.lastMonth, 1);
  while (m <= cur && out.length < 24) {
    if (m === cur && now.getDate() < dayInMonth(m, r.day)) break;
    out.push(m); m = monthShift(m, 1);
  }
  return out;
}
// lastMonth for a rule that should start at its next occurrence (new or resumed),
// so nothing from the past gets back-filled.
function startLastMonth(day, now = new Date()) {
  const cur = monthValue(now);
  return now.getDate() <= dayInMonth(cur, day) ? monthShift(cur, -1) : cur;
}
function nextRecurDate(r) {
  const m = monthShift(r.lastMonth || monthValue(new Date()), 1);
  return `${m}-${pad(dayInMonth(m, r.day))}`;
}
const recurBusy = new Set();
function runRecurring() {
  const wsId = S.wsId;
  if (!wsId || !S.user) return;
  S.recurring.forEach((r) => {
    if (!dueMonths(r).length) return;
    const key = wsId + "/" + r.id;
    if (recurBusy.has(key)) return;
    recurBusy.add(key);
    const rref = doc(db, "workspaces", wsId, "recurring", r.id);
    runTransaction(db, async (tx) => {
      const snap = await tx.get(rref);
      if (!snap.exists()) return 0;
      const d = snap.data();
      const months = dueMonths(d);
      if (!months.length) return 0;
      months.forEach((m) => {
        const row = { date: `${m}-${pad(dayInMonth(m, d.day))}`, amount: round2(d.amount), categoryId: d.categoryId || "", cardId: d.cardId || "", memberUid: d.memberUid || "", remark: d.remark || "", recurringId: r.id, createdBy: S.user.uid, createdAt: serverTimestamp() };
        if (d.type === "income") row.type = "income";
        // Fixed id per rule and month: even if two phones run this, there is only one entry.
        tx.set(doc(db, "workspaces", wsId, "expenses", `rec_${r.id}_${m}`), row);
      });
      tx.update(rref, { lastMonth: months[months.length - 1] });
      return months.length;
    }).then((n) => { if (n && S.wsId === wsId) toast(t("recurAdded", { n })); }).catch(() => {}).finally(() => recurBusy.delete(key));
  });
}
document.addEventListener("visibilitychange", () => { if (!document.hidden) runRecurring(); });
function openRecurringForm(r) {
  if (!S.wsId) return toast(t("needWs"));
  let ty = r && r.type === "income" ? "income" : "expense";
  const sym = currencyOf(ws()).symbol;
  openModal(`<h3>${r ? t("editRecurring") : t("newRecurring")}</h3>
    ${typeSeg("rc-type", ty)}
    <label>${t("amount")} (${esc(sym)})</label><input id="rc-amt" class="big" type="text" inputmode="numeric" autocomplete="off">
    <label>${t("recurDay")}</label><input id="rc-day" type="number" inputmode="numeric" min="1" max="31" value="${r ? Number(r.day) || 1 : new Date().getDate()}">
    <p class="muted">${t("recurDayHint")}</p>
    <label>${t("category")}</label><select id="rc-cat">${catOptions(ty, r?.categoryId)}</select>
    <label>${t("card")}</label><select id="rc-card">${cardOptions(r?.cardId)}</select>
    <label id="rc-mem-l">${ty === "income" ? t("chartMember") : t("payer")}</label><select id="rc-mem">${opts(memberList(), r?.memberUid || S.user.uid)}</select>
    <label>${t("remark")}</label><input id="rc-rem" maxlength="200" value="${esc(r?.remark || "")}" placeholder="${esc(t("optional"))}">
    <p id="rc-next" class="muted"></p>
    <div class="btns">${r ? `<button class="btn danger" id="rc-del" type="button">${t("delete")}</button><button class="btn" id="rc-pause" type="button">${r.active === false ? t("resume") : t("pause")}</button>` : `<button class="btn" id="rc-cancel" type="button">${t("cancel")}</button>`}<button class="btn primary" id="rc-save" type="button">${t("save")}</button></div>`);
  bindMoneyInput($("#rc-amt"), r ? r.amount : 0);
  if (ty === "income") ensureIncomeCats();
  const readDay = () => { const d = Math.floor(Number($("#rc-day").value)); return d >= 1 && d <= 31 ? d : 0; };
  const showNext = () => {
    const d = readDay();
    const lm = r && r.active !== false && d === Number(r.day) ? r.lastMonth : (d ? startLastMonth(d) : "");
    $("#rc-next").textContent = r && r.active === false ? t("paused") : (d && lm ? t("recurNext", { date: nextRecurDate({ lastMonth: lm, day: d }) }) : "");
  };
  $("#rc-day").oninput = showNext;
  showNext();
  $("#rc-type").querySelectorAll("button").forEach((b) => (b.onclick = () => {
    if (b.dataset.ty === ty) return;
    ty = b.dataset.ty;
    $("#rc-type").querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
    $("#rc-cat").innerHTML = catOptions(ty);
    $("#rc-mem-l").textContent = ty === "income" ? t("chartMember") : t("payer");
    if (ty === "income") ensureIncomeCats();
  }));
  if ($("#rc-cancel")) $("#rc-cancel").onclick = closeModal;
  $("#rc-save").onclick = () => {
    const amount = readMoneyInput($("#rc-amt")), day = readDay();
    if (!(amount > 0)) return toast(t("needAmount"));
    if (!day) return toast(t("needDay"));
    const data = { amount, day, categoryId: $("#rc-cat").value, cardId: $("#rc-card").value, memberUid: $("#rc-mem").value, remark: $("#rc-rem").value.trim() };
    data.type = ty === "income" ? "income" : deleteField();
    if (r) {
      if (r.split) data.split = deleteField();
      if (day !== Number(r.day) && r.active !== false) data.lastMonth = startLastMonth(day);
      updateDoc(doc(wsRef("recurring"), r.id), data).catch((x) => toast(errMsg(x)));
    } else {
      if (ty !== "income") delete data.type;
      addDoc(wsRef("recurring"), { ...data, lastMonth: startLastMonth(day), active: true, createdBy: S.user.uid, createdAt: serverTimestamp() }).catch((x) => toast(errMsg(x)));
    }
    closeModal(); toast(t("saved"));
  };
  if (r) {
    $("#rc-pause").onclick = () => {
      const resume = r.active === false;
      // Resuming starts from the next date, so paused months are not back-filled.
      const patch = resume ? { active: true, lastMonth: startLastMonth(r.day) } : { active: false };
      updateDoc(doc(wsRef("recurring"), r.id), patch).catch((x) => toast(errMsg(x)));
      closeModal(); toast(t("saved"));
    };
    $("#rc-del").onclick = () => {
      if (!confirm(t("confirmDeleteRecurring"))) return;
      deleteDoc(doc(wsRef("recurring"), r.id)).catch((x) => toast(errMsg(x)));
      closeModal();
    };
  }
}

/* ---------- Navigation ---------- */
function showPage(p) {
  S.page = p;
  document.querySelectorAll(".tabs [data-p]").forEach((x) => x.classList.toggle("on", x.dataset.p === p));
  ["home", "funds", "report", "settings"].forEach((id) => $("#page-" + id).classList.toggle("hidden", id !== p));
  moveSpot(true);
  window.scrollTo(0, 0); renderAll();
}
// Spotlight: a beam of light that slides to the tab you tapped.
function moveSpot(flash) {
  const spot = $("#tab-spot"), on = document.querySelector(".tabs [data-p].on"), bar = $("#tabs");
  if (!spot || !on || !bar) return;
  const x = on.offsetLeft + on.offsetWidth / 2 - spot.offsetWidth / 2;
  spot.style.transform = `translateX(${x}px)`;
  if (flash) { on.classList.remove("lit"); void on.offsetWidth; on.classList.add("lit"); }
}
window.addEventListener("resize", () => moveSpot(false));
document.querySelectorAll(".tabs [data-p]").forEach((b) => (b.onclick = () => showPage(b.dataset.p)));
function setFan(open) {
  document.body.classList.toggle("fan-open", open);
  $("#fab").setAttribute("aria-expanded", open ? "true" : "false");
  $("#fab").setAttribute("aria-label", open ? t("close") : t("addExpense"));
  $("#fan").setAttribute("aria-hidden", open ? "false" : "true");
}
$("#fab").onclick = () => setFan(!document.body.classList.contains("fan-open"));
$("#fan").onclick = (e) => { if (e.target.id === "fan") setFan(false); };
$("#fan-expense").onclick = () => { setFan(false); openExpense(); };
$("#fan-fund").onclick = () => { setFan(false); openFundMenu(); };
$("#m-prev").onclick = () => { S.month = new Date(S.month.getFullYear(), S.month.getMonth() - 1, 1); subExpenses(); renderHome(); };
$("#m-next").onclick = () => { S.month = new Date(S.month.getFullYear(), S.month.getMonth() + 1, 1); subExpenses(); renderHome(); };
$("#r-prev").onclick = () => { S.repMonth = new Date(S.repMonth.getFullYear(), S.repMonth.getMonth() - 1, 1); subReport(); renderReport(); };
$("#r-next").onclick = () => { S.repMonth = new Date(S.repMonth.getFullYear(), S.repMonth.getMonth() + 1, 1); subReport(); renderReport(); };
document.querySelectorAll("#chart-mode button").forEach((b) => (b.onclick = () => { S.repMode = b.dataset.m; document.querySelectorAll("#chart-mode button").forEach((x) => x.classList.toggle("on", x === b)); renderReport(); }));
$("#rep-cat-filter").onclick = () => { S.repCatsOpen = !S.repCatsOpen; renderReport(); };
$("#filter-toggle").onclick = () => { S.filters.open = !S.filters.open; renderHome(); };
$("#filter-clear").onclick = () => { S.filters = emptyFilters(S.filters.open); renderHome(); };
["flt-type", "flt-cat", "flt-card", "flt-mem", "flt-from", "flt-to"].forEach((id) => { const el = $("#" + id); if (el) el.onchange = () => { readFilters(); renderHome(); }; });
const fltQ = $("#flt-q");
if (fltQ) fltQ.oninput = () => { readFilters(); renderHome(); };
const createOwn = $("#create-own");
if (createOwn) createOwn.onclick = () => {
  if (!S.user || creatingWs) return;
  const id = createWorkspace(t("personalWs"));
  lsSet("ws_" + S.user.uid, id);
};
$("#ws-btn").onclick = openWsPicker;
$("#me-btn").onclick = () => openProfile();
$("#modal").onclick = (e) => { if (e.target.id === "modal") closeModal(); };
document.addEventListener("keydown", (e) => { if (e.key === "Escape") { if (document.body.classList.contains("fan-open")) setFan(false); else closeModal(); } });
function openModal(html, cls = "") { $("#sheet").className = "sheet" + (cls ? " " + cls : ""); $("#sheet").innerHTML = `<div class="grab"></div>${html}`; $("#modal").classList.remove("hidden"); document.body.classList.add("modal-open"); }
function closeModal() { $("#modal").classList.add("hidden"); $("#sheet").innerHTML = ""; $("#sheet").className = "sheet"; document.body.classList.remove("modal-open"); calcKeys = null; }
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
  fab.setAttribute("aria-label", document.body.classList.contains("fan-open") ? t("close") : t("addExpense"));
  requestAnimationFrame(() => moveSpot(false));
}
function renderNoWs() {
  const el = $("#no-ws");
  if (el) el.classList.toggle("hidden", !S.user || !!S.wsId || S.wsList.length > 0);
}
function renderAll() {
  renderTop(); syncFab(); renderNoWs();
  if (!S.user) return;
  if (S.page === "home") renderHome();
  if (S.page === "funds") renderFunds();
  if (S.page === "report") { subReport(); renderReport(); }
  if (S.page === "settings") renderSettings();
}
function readFilters() {
  const f = S.filters;
  f.type = $("#flt-type") ? $("#flt-type").value : f.type;
  f.cat = $("#flt-cat") ? $("#flt-cat").value : f.cat;
  f.card = $("#flt-card") ? $("#flt-card").value : f.card;
  f.member = $("#flt-mem") ? $("#flt-mem").value : f.member;
  f.q = $("#flt-q") ? $("#flt-q").value : f.q;
  f.from = $("#flt-from") ? $("#flt-from").value : f.from;
  f.to = $("#flt-to") ? $("#flt-to").value : f.to;
}
function activeFilterCount() {
  const f = S.filters;
  return [f.type, f.cat, f.card, f.member, (f.q || "").trim(), f.from, f.to].filter(Boolean).length;
}
function applyExpenseFilters(list) {
  const f = S.filters;
  const q = (f.q || "").trim().toLowerCase();
  return list.filter((e) => {
    if (f.type === "income" && !isIncome(e)) return false;
    if (f.type === "expense" && isIncome(e)) return false;
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
  const box = $("#invites");
  if (!box) return;
  if (!S.invites.length) { box.innerHTML = ""; return; }
  box.innerHTML = `<p class="invite-title">${t("invitesTitle")}</p>` + S.invites.map((w) => {
    const owner = w.memberInfo?.[w.ownerUid];
    return `<div class="invite"><span class="txt">${avatarEl(owner?.avatar, memberNameOf(w, w.ownerUid), "av xs")}<span>${t("inviteLine", { name: esc(memberNameOf(w, w.ownerUid)), ws: esc(w.name) })}</span></span><span class="actions"><button class="btn small primary" type="button" data-acc="${w.id}">${t("accept")}</button><button class="btn small" type="button" data-dec="${w.id}">${t("decline")}</button></span></div>`;
  }).join("");
  box.querySelectorAll("[data-acc]").forEach((b) => (b.onclick = () => acceptInvite(b.dataset.acc)));
  box.querySelectorAll("[data-dec]").forEach((b) => (b.onclick = () => declineInvite(b.dataset.dec)));
}
async function acceptInvite(id) {
  const u = S.user, email = (u.email || "").trim().toLowerCase();
  const name = S.profile.name || u.displayName || email.split("@")[0];
  try {
    await updateDoc(doc(db, "workspaces", id), { members: arrayUnion(u.uid), [`memberInfo.${u.uid}`]: { email, name, avatar: S.profile.avatar || "" }, invitedEmails: arrayRemove(email) });
    toast(t("joined")); switchWs(id);
  } catch (e) { toast(errMsg(e)); }
}
async function declineInvite(id) {
  try { await updateDoc(doc(db, "workspaces", id), { invitedEmails: arrayRemove((S.user.email || "").trim().toLowerCase()) }); } catch (e) { toast(errMsg(e)); }
}

function inviteMessage(email, wsName) {
  return t("inviteShare", { email, ws: wsName, url: APP_URL });
}
async function copyText(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(text);
    else throw new Error("copy");
    toast(t("copied"));
  } catch (e) { toast(t("copyFail")); }
}
function shareInvite(text) {
  if (navigator.share) navigator.share({ text }).catch(() => copyText(text));
  else copyText(text);
}
function monthValue(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; }
const TREND_MONTHS = 6;
function reportMonths() {
  const out = [];
  for (let i = TREND_MONTHS - 1; i >= 0; i--) out.push(new Date(S.repMonth.getFullYear(), S.repMonth.getMonth() - i, 1));
  return out;
}
function subReport() {
  if (!S.wsId) return;
  const months = reportMonths();
  const start = monthRange(months[0]).start, end = monthRange(months[months.length - 1]).end;
  const key = S.wsId + "|" + start + "|" + end;
  if (S.reportKey === key && S.reportUnsub) return;
  if (S.reportUnsub) { S.reportUnsub(); S.reportUnsub = null; }
  S.reportKey = key;
  S.reportUnsub = onSnapshot(query(wsRef("expenses"), where("date", ">=", start), where("date", "<=", end)), (s) => {
    S.reportRows = s.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (S.page === "report") renderReport();
  }, (e) => toast(errMsg(e)));
}
function rowsInMonth(d, kind = "expense") {
  const prefix = monthValue(d);
  return (S.reportRows || []).filter((e) => (e.date || "").startsWith(prefix) && (kind === "income" ? isIncome(e) : !isIncome(e)));
}
const sumAmount = (rows) => rows.reduce((s, e) => s + Number(e.amount || 0), 0);
// Totals are keyed by id (not by display name) so two members or categories
// with the same name are not merged together.
function groupTotals(rows, mode) {
  const map = {};
  const add = (key, g, v) => { const x = map[key] || (map[key] = { ...g, value: 0 }); x.value += Number(v) || 0; };
  rows.forEach((e) => {
    if (mode === "member") {
      const av = safeAvatar(ws()?.memberInfo?.[e.memberUid]?.avatar);
      add("m:" + (e.memberUid || ""), { label: memberName(e.memberUid), icon: av.startsWith("emoji:") ? av.slice(6) : "", photo: av.startsWith("data:image/") ? av : "" }, e.amount);
    } else if (mode === "card") { const c = cardOf(e.cardId); add("c:" + (c ? c.id : ""), { label: c?.name || t("unspecified"), icon: "💳" }, e.amount); }
    else { const c = catOf(e.categoryId); add(c ? c.id : "", { label: c?.name || t("uncategorized"), icon: safeIcon(c?.icon) }, e.amount); }
  });
  return map;
}
// "up" is shown in red because more spending is bad. For income, pass goodUp so more is green.
function changeHtml(a, b, goodUp) {
  const upCls = goodUp ? "down" : "up", downCls = goodUp ? "up" : "down";
  if (a <= 0 && b <= 0) return `<span class="flat">${t("flat")}</span>`;
  if (b <= 0 && a > 0) return `<span class="${upCls}">${t("newSpend")}</span>`;
  if (a <= 0 && b > 0) return `<span class="${downCls}">${t("goneSpend")}</span>`;
  const p = Math.round(((a - b) / b) * 100);
  if (!p) return `<span class="flat">${t("flat")}</span>`;
  return p > 0 ? `<span class="${upCls}">${t("higher", { n: p })}</span>` : `<span class="${downCls}">${t("lower", { n: Math.abs(p) })}</span>`;
}
function chartColors() {
  const css = getComputedStyle(document.documentElement);
  return {
    text: css.getPropertyValue("--t").trim() || "#111",
    muted: css.getPropertyValue("--m").trim() || "#666",
    line: css.getPropertyValue("--line").trim() || "#ddd",
    spend: css.getPropertyValue("--amt").trim() || palette()[3],
    earn: css.getPropertyValue("--g").trim() || palette()[0]
  };
}
function budgetBar(spent, budget) {
  const pct = budget > 0 ? (spent / budget) * 100 : 0;
  const cls = pct > 100 ? "over" : pct >= 80 ? "warn" : "";
  return `<div class="bar ${cls}"><div style="width:${Math.min(100, Math.max(0, pct)).toFixed(1)}%"></div></div>`;
}
function renderBudget(spend) {
  const box = $("#rep-budget");
  if (!box) return;
  const w = ws();
  const total = Number(w?.budget) || 0;
  const catBudgets = S.cats.filter((c) => catKind(c) === "expense" && Number(c.budget) > 0);
  if (!w || (!total && !catBudgets.length)) { box.classList.add("hidden"); box.innerHTML = ""; return; }
  box.classList.remove("hidden");
  const spent = sumAmount(spend);
  const left = (b, s) => (s > b ? `<span class="up">${t("budgetOver", { amount: fmt(s - b) })}</span>` : `<span class="muted">${t("budgetLeft", { amount: fmt(b - s) })}</span>`);
  let html = "";
  if (total) html += `<div class="sec-head"><b>${t("budgetTotal")}</b>${left(total, spent)}</div>${budgetBar(spent, total)}<div class="muted">${t("budgetUsed", { spent: fmt(spent), budget: fmt(total) })}</div>`;
  html += catBudgets.map((c) => {
    const s = sumAmount(spend.filter((e) => e.categoryId === c.id));
    const b = Number(c.budget);
    return `<div class="bud-row"><div class="sec-head"><span>${esc(catLabel(c))}</span><small>${fmt(s)} / ${fmt(b)}</small></div>${budgetBar(s, b)}</div>`;
  }).join("");
  box.innerHTML = html;
}
let pieChart = null, catTrendChart = null, trendChart = null;
function upsertChart(ref, canvas, config) {
  if (!canvas || !window.Chart) return ref;
  if (!ref) return new Chart(canvas, config);
  ref.data = config.data; ref.options = config.options; ref.update();
  return ref;
}
function renderPie(spend, total) {
  const rows = Object.values(groupTotals(spend, S.repMode)).sort((a, b) => b.value - a.value);
  const colors = palette();
  const sliceColors = rows.map((_, i) => colors[i % colors.length]);
  const canvas = $("#pie"), empty = $("#chart-empty");
  empty.textContent = t("emptyChart");
  if (!rows.length) {
    if (pieChart) { pieChart.destroy(); pieChart = null; }
    canvas.classList.add("hidden"); empty.classList.remove("hidden");
  } else {
    canvas.classList.remove("hidden"); empty.classList.add("hidden");
    pieChart = upsertChart(pieChart, canvas, { type: "doughnut", data: { labels: rows.map((r) => r.label), datasets: [{ data: rows.map((r) => r.value), backgroundColor: sliceColors, borderColor: chartBorder(), borderWidth: 3, hoverOffset: 6 }] }, options: { cutout: "64%", plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => " " + c.label + ": " + fmt(c.parsed) } } }, animation: { duration: 350 } } });
  }
  $("#legend").innerHTML = rows.map((r, i) => {
    const ico = r.photo ? `<img class="lg-av" alt="" src="${esc(r.photo)}">` : (r.icon ? `<span class="lg-em">${esc(r.icon)}</span>` : "");
    return `<span class="lg"><i style="background:${sliceColors[i]}"></i>${ico}${esc(r.label)} <b>${fmt(r.value)}</b> <small>${total ? Math.round((r.value / total) * 100) : 0}%</small></span>`;
  }).join("");
}
// Category change over the last months. With many categories, the top 5 are
// shown first and the filter chips pick exactly which ones to compare.
function renderCatTrend(months) {
  const per = months.map((d) => groupTotals(rowsInMonth(d), "cat"));
  const keys = {};
  per.forEach((m) => Object.entries(m).forEach(([k, g]) => { const x = keys[k] || (keys[k] = { key: k, label: g.label, icon: g.icon, total: 0 }); x.total += g.value; }));
  const all = Object.values(keys).sort((a, b) => b.total - a.total);
  const valid = S.repCats ? S.repCats.filter((k) => keys[k]) : null;
  const chosen = valid && valid.length ? valid : all.slice(0, 5).map((x) => x.key);
  const btn = $("#rep-cat-filter");
  btn.classList.toggle("hidden", all.length <= 1);
  btn.querySelector("b").textContent = valid && valid.length ? String(valid.length) : "";
  const chips = $("#rep-cat-chips");
  chips.classList.toggle("hidden", !S.repCatsOpen);
  if (S.repCatsOpen) {
    chips.innerHTML = `<button type="button" class="chip" data-all="top">${t("top5")}</button><button type="button" class="chip" data-all="all">${t("emojiAll")}</button>`
      + all.map((x) => `<button type="button" class="chip${chosen.includes(x.key) ? " on" : ""}" data-ck="${esc(x.key)}">${x.icon ? esc(x.icon) + " " : ""}${esc(x.label)}</button>`).join("");
    chips.querySelectorAll("[data-ck]").forEach((b) => (b.onclick = () => {
      const k = b.dataset.ck;
      const cur = new Set(chosen);
      if (cur.has(k)) cur.delete(k); else cur.add(k);
      S.repCats = [...cur]; if (!S.repCats.length) S.repCats = null;
      renderReport();
    }));
    chips.querySelector('[data-all="top"]').onclick = () => { S.repCats = null; renderReport(); };
    chips.querySelector('[data-all="all"]').onclick = () => { S.repCats = all.map((x) => x.key); renderReport(); };
  }
  const colors = palette(), c = chartColors();
  const colorOf = (k) => colors[Math.max(0, all.findIndex((x) => x.key === k)) % colors.length];
  const canvas = $("#cat-trend"), empty = $("#cat-trend-empty");
  empty.classList.toggle("hidden", all.length > 0);
  canvas.classList.toggle("hidden", !all.length);
  if (all.length) {
    catTrendChart = upsertChart(catTrendChart, canvas, { type: "line", data: { labels: months.map(monthShort), datasets: chosen.map((k) => ({ label: keys[k].label, data: per.map((m) => round2(m[k]?.value || 0)), borderColor: colorOf(k), backgroundColor: colorOf(k), cubicInterpolationMode: "monotone", pointRadius: 3, borderWidth: 2 })) }, options: { responsive: true, maintainAspectRatio: false, interaction: { mode: "index", intersect: false }, plugins: { legend: { labels: { color: c.text, boxWidth: 10 } }, tooltip: { callbacks: { label: (x) => " " + x.dataset.label + ": " + fmt(x.parsed.y) } } }, scales: { x: { ticks: { color: c.muted }, grid: { display: false } }, y: { ticks: { color: c.muted }, grid: { color: c.line }, beginAtZero: true } } } });
  } else if (catTrendChart) { catTrendChart.destroy(); catTrendChart = null; }
  const last = per.length - 1;
  $("#rep-cat-table").innerHTML = chosen.map((k) => {
    const vals = per.map((m) => m[k]?.value || 0), max = Math.max(...vals, 0.01);
    const spark = vals.map((v, i) => `<i style="height:${Math.max(6, (v / max) * 100)}%;background:${i === last ? colorOf(k) : "var(--chip-strong)"}"></i>`).join("");
    return `<div class="ct-row"><span class="ct-name"><i class="dot" style="background:${colorOf(k)}"></i>${keys[k].icon ? esc(keys[k].icon) + " " : ""}${esc(keys[k].label)}</span><span class="spark">${spark}</span><span class="ct-val"><b>${fmt(vals[last])}</b>${changeHtml(vals[last], vals[last - 1] || 0)}</span></div>`;
  }).join("");
}
function monthShort(d) { return S.lang === "en" ? MON[d.getMonth()] : `${d.getMonth() + 1}月`; }
function renderReport() {
  const sum = $("#rep-summary");
  if (!sum) return;
  $("#r-label").textContent = monthLabel(S.repMonth);
  if (!S.wsId) { sum.innerHTML = `<p>${t("noWsYet")}</p>`; return; }
  const spend = rowsInMonth(S.repMonth), total = sumAmount(spend);
  const income = sumAmount(rowsInMonth(S.repMonth, "income"));
  const prev = new Date(S.repMonth.getFullYear(), S.repMonth.getMonth() - 1, 1);
  const prevTotal = sumAmount(rowsInMonth(prev));
  sum.innerHTML = `<div class="total"><span>${t("monthSpend")}</span><b>${fmt(total)}</b><em>${changeHtml(total, prevTotal)} ${t("vsLastMonth")}</em></div>
    <div class="hero-stats"><div><span>${t("monthIncome")}</span><b>${fmt(income)}</b></div><div><span>${t("monthNet")}</span><b>${fmt(income - total)}</b></div></div>`;
  renderBudget(spend);
  renderPie(spend, total);
  const months = reportMonths();
  renderCatTrend(months);
  const c = chartColors();
  const incomes = months.map((d) => sumAmount(rowsInMonth(d, "income")));
  const hasIncome = incomes.some((v) => v > 0);
  const datasets = [{ label: t("typeExpense"), data: months.map((d) => sumAmount(rowsInMonth(d))), backgroundColor: c.spend, borderRadius: 8 }];
  if (hasIncome) datasets.push({ label: t("typeIncome"), data: incomes, backgroundColor: c.earn, borderRadius: 8 });
  trendChart = upsertChart(trendChart, $("#trend-chart"), { type: "bar", data: { labels: months.map(monthShort), datasets }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: hasIncome, labels: { color: c.text, boxWidth: 10 } } }, scales: { x: { ticks: { color: c.muted }, grid: { display: false } }, y: { ticks: { color: c.muted }, grid: { color: c.line }, beginAtZero: true } } } });
}

/* ---------- Home ---------- */
function catOf(id) { return S.cats.find((c) => c.id === id); }
function cardOf(id) { return S.cards.find((c) => c.id === id); }
function round2(n) { return Math.round((Number(n) || 0) * 100) / 100; }
function moneyDigits(cents) {
  const n = Math.max(0, Math.floor(Number(cents) || 0));
  const whole = Math.floor(n / 100);
  const frac = String(n % 100).padStart(2, "0");
  return String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "." + frac;
}
function centsFromAmount(amount) {
  const n = Number(amount);
  if (!isFinite(n) || n <= 0) return 0;
  return Math.round(n * 100);
}
function setMoneyInput(input, amount) {
  if (!input) return;
  const cents = centsFromAmount(amount);
  input.dataset.cents = String(cents);
  input.value = moneyDigits(cents);
}
function readMoneyInput(input) {
  if (!input) return 0;
  if (input.dataset && input.dataset.cents != null && input.dataset.cents !== "") return Number(input.dataset.cents) / 100;
  const digits = String(input.value || "").replace(/\D/g, "");
  return (Number(digits) || 0) / 100;
}
function bindMoneyInput(input, amount, onChange) {
  if (!input) return;
  input.type = "text";
  input.setAttribute("inputmode", "numeric");
  input.setAttribute("autocomplete", "off");
  input.setAttribute("enterkeyhint", "done");
  input.classList.add("money");
  const apply = (cents, notify) => {
    cents = Math.max(0, Math.min(99999999999, Math.floor(Number(cents) || 0)));
    const prev = input.dataset.cents;
    input.dataset.cents = String(cents);
    const next = moneyDigits(cents);
    if (input.value !== next) input.value = next;
    try { input.setSelectionRange(next.length, next.length); } catch (e) {}
    if (notify && prev !== input.dataset.cents && onChange) onChange(cents / 100);
  };
  const fromText = (text, replace) => {
    const digits = String(text || "").replace(/\D/g, "").slice(0, 11);
    if (replace) return digits ? Number(digits) : 0;
    let cents = Number(input.dataset.cents || 0);
    for (const ch of digits) cents = cents * 10 + Number(ch);
    return cents;
  };
  apply(centsFromAmount(amount), false);
  if (input.dataset.moneyBound) return;
  input.dataset.moneyBound = "1";
  input.addEventListener("beforeinput", (e) => {
    if (e.inputType === "insertText") {
      e.preventDefault();
      const all = input.selectionStart === 0 && input.selectionEnd === input.value.length;
      apply(fromText(e.data, all), true);
    } else if (e.inputType === "deleteContentBackward" || e.inputType === "deleteContentForward") {
      e.preventDefault();
      const all = input.selectionStart === 0 && input.selectionEnd === input.value.length && input.value.length;
      apply(all ? 0 : Math.floor(Number(input.dataset.cents || 0) / 10), true);
    } else if (e.inputType === "insertFromPaste") {
      e.preventDefault();
    }
  });
  input.addEventListener("paste", (e) => {
    e.preventDefault();
    const text = (e.clipboardData && e.clipboardData.getData("text")) || "";
    apply(fromText(text, true), true);
  });
  input.addEventListener("input", () => {
    const digits = input.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
    const cents = digits ? Number(digits.slice(0, 11)) : 0;
    if (String(cents) === input.dataset.cents && input.value === moneyDigits(cents)) return;
    apply(cents, true);
  });
  input.addEventListener("focus", () => { try { input.setSelectionRange(input.value.length, input.value.length); } catch (e) {} });
}
function renderHome() {
  if (!$("#m-label")) return;
  $("#m-label").textContent = monthLabel(S.month);
  const range = monthRange(S.month);
  if (S.filters.from && (S.filters.from < range.start || S.filters.from > range.end)) S.filters.from = "";
  if (S.filters.to && (S.filters.to < range.start || S.filters.to > range.end)) S.filters.to = "";
  const typeOpts = `<option value="">${esc(t("allTypes"))}</option><option value="expense">${esc(t("typeExpense"))}</option><option value="income">${esc(t("typeIncome"))}</option>`;
  const catsForFilter = S.filters.type ? S.cats.filter((c) => catKind(c) === S.filters.type) : S.cats;
  if (S.filters.cat && !catsForFilter.some((c) => c.id === S.filters.cat)) S.filters.cat = "";
  const catOpts = `<option value="">${esc(t("allCategories"))}</option>` + catsForFilter.map((c) => `<option value="${esc(c.id)}">${esc(catLabel(c))}</option>`).join("");
  const cardOpts = `<option value="">${esc(t("allCards"))}</option>` + S.cards.map((c) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join("");
  const memOpts = `<option value="">${esc(t("allMembers"))}</option>` + memberList().map((m) => `<option value="${esc(m.id)}">${esc(m.name)}</option>`).join("");
  setSelectHtml($("#flt-type"), typeOpts, S.filters.type);
  setSelectHtml($("#flt-cat"), catOpts, S.filters.cat);
  setSelectHtml($("#flt-card"), cardOpts, S.filters.card);
  setSelectHtml($("#flt-mem"), memOpts, S.filters.member);
  ["flt-from", "flt-to"].forEach((id) => { const el = $("#" + id); if (!el) return; el.min = range.start; el.max = range.end; if (document.activeElement !== el) el.value = id === "flt-from" ? S.filters.from : S.filters.to; });
  const qEl = $("#flt-q");
  if (qEl && document.activeElement !== qEl && qEl.value !== S.filters.q) qEl.value = S.filters.q;
  $("#filters").classList.toggle("hidden", !S.filters.open);
  const n = activeFilterCount();
  $("#filter-n").textContent = n ? String(n) : "";
  $("#filter-clear").classList.toggle("hidden", !n);
  const ex = [...S.expenses].sort((a, b) => (b.date || "").localeCompare(a.date || "") || (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  const shown = applyExpenseFilters(ex);
  const total = sumAmount(ex.filter((e) => !isIncome(e)));
  $("#m-total").textContent = fmt(total);
  $("#m-code").textContent = currencyOf(ws()).code;
  const sumEl = $("#filter-sum");
  sumEl.classList.toggle("hidden", !n);
  if (n) {
    const out = sumAmount(shown.filter((e) => !isIncome(e))), inn = sumAmount(shown.filter(isIncome));
    sumEl.innerHTML = esc(t("showing", { n: shown.length, total: ex.length })) + (out ? ` · <b class="neg">-${fmt(out)}</b>` : "") + (inn ? ` · <b class="pos">+${fmt(inn)}</b>` : "");
  }
  const colors = palette();
  const byDay = {};
  shown.forEach((e) => (byDay[e.date] = byDay[e.date] || []).push(e));
  $("#exp-list").innerHTML = shown.length ? Object.keys(byDay).map((d) => {
    const items = byDay[d];
    const out = sumAmount(items.filter((e) => !isIncome(e))), inn = sumAmount(items.filter(isIncome));
    const daySum = (out ? `<span>-${fmt(out)}</span>` : "") + (inn ? `<span class="in">+${fmt(inn)}</span>` : "");
    return `<div class="day-h"><span>${dayLabel(d)}</span><span class="day-sum">${daySum}</span></div><div class="card list-card">` + items.map((e) => {
      const cat = catOf(e.categoryId), cn = cat?.name || t("uncategorized");
      const ci = Math.max(0, S.cats.findIndex((c) => c.id === e.categoryId));
      const color = colors[ci % colors.length];
      const icon = safeIcon(cat?.icon);
      const bubble = icon ? `<div class="ic emo" style="--c:${color}">${esc(icon)}</div>` : `<div class="ic letter" style="--c:${color};background:${color}">${esc(firstChar(cn))}</div>`;
      const info = ws()?.memberInfo?.[e.memberUid];
      const remark = e.remark ? `<div class="remark">${esc(e.remark)}</div>` : "";
      const badge = (e.receiptId ? `<span class="receipt-tag" title="${esc(t("receipt"))}">🧾</span>` : "")
        + (e.recurringId ? `<span class="pill" title="${esc(t("recurring"))}">🔁</span>` : "");
      const inc = isIncome(e);
      return `<div class="item" data-id="${esc(e.id)}">${bubble}<div class="mid"><div class="ttl">${esc(cn)}${badge}</div><div class="sub">${avatarEl(info?.avatar, memberName(e.memberUid), "av xs")}<span class="txt">${esc(cardOf(e.cardId)?.name || t("unspecified"))} · ${esc(memberName(e.memberUid))}</span></div>${remark}</div><div class="amt${inc ? " in" : ""}">${inc ? "+" : "-"}${fmt(e.amount)}</div></div>`;
    }).join("") + `</div>`;
  }).join("") : `<div class="empty">${ex.length ? t("noMatch") : t("emptyMonth")}</div>`;
  $("#exp-list").querySelectorAll(".item").forEach((el) => (el.onclick = () => openExpense(S.expenses.find((e) => e.id === el.dataset.id))));
}
const opts = (arr, sel, label = (x) => x.name, val = (x) => x.id) => arr.map((x) => `<option value="${esc(val(x))}"${val(x) === sel ? " selected" : ""}>${esc(label(x))}</option>`).join("");
const catLabel = (c) => { const ic = safeIcon(c.icon); return ic ? ic + " " + c.name : c.name; };
function memberList() { return (ws()?.members || []).map((uid) => ({ id: uid, name: memberName(uid) })); }
// Category / card options. A deleted category or card shows as "Uncategorized" instead of
// silently switching to the first one when an old record is edited.
function catOptions(kind, sel) {
  const list = S.cats.filter((c) => catKind(c) === kind);
  const known = list.some((c) => c.id === sel);
  const pick = known ? sel : (sel ? "" : list[0]?.id || "");
  return opts(list, pick, catLabel) + `<option value=""${pick === "" ? " selected" : ""}>${esc(t("uncategorized"))}</option>`;
}
function cardOptions(sel) {
  const known = S.cards.some((c) => c.id === sel);
  const pick = known ? sel : (sel ? "" : S.cards[0]?.id || "");
  return opts(S.cards, pick) + `<option value=""${pick === "" ? " selected" : ""}>${esc(t("unspecified"))}</option>`;
}
// Keep an open form's category list current when categories arrive or change
// (for example the starter income categories created a moment after tapping "Income").
function refreshOpenCatSelects() {
  [["#f-cat", "#f-type"], ["#rc-cat", "#rc-type"]].forEach(([selId, segId]) => {
    const sel = $(selId), seg = $(segId);
    if (!sel || !seg) return;
    const kind = seg.querySelector(".on")?.dataset.ty === "income" ? "income" : "expense";
    const cur = sel.value;
    const valid = S.cats.some((c) => c.id === cur && catKind(c) === kind);
    const html = catOptions(kind, valid ? cur : undefined);
    if (sel.dataset.sig !== html) { sel.innerHTML = html; sel.dataset.sig = html; }
  });
}
function typeSeg(id, type) {
  return `<div class="seg type-seg" id="${id}"><button type="button" data-ty="expense" class="${type === "expense" ? "on" : ""}">${t("typeExpense")}</button><button type="button" data-ty="income" class="${type === "income" ? "on" : ""}">${t("typeIncome")}</button></div>`;
}
// Starter income categories for workspaces made before income existed. Done once per
// workspace, inside a transaction so two phones opening at once don't both add them.
function ensureIncomeCats() {
  const w = ws();
  if (!w || w.incomeSeeded || S.cats.some((c) => catKind(c) === "income")) return Promise.resolve();
  const wsId = w.id, lang = S.lang === "en" ? "en" : "zh";
  const wref = doc(db, "workspaces", wsId);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(wref);
    if (!snap.exists() || snap.data().incomeSeeded) return;
    DEFAULT_INCOME_CATS.forEach((c, i) => tx.set(doc(collection(wref, "categories")), { name: c[lang], icon: c.icon, kind: "income", order: 50 + i, createdAt: serverTimestamp() }));
    tx.update(wref, { incomeSeeded: true });
  }).catch(() => {});
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
/* ---------- Calculator ----------
   Amounts keep the app's "just press digits" entry: 1 8 8 7 7 → 188.77.
   After + or −, the next number is money too. After × or ÷ it is a plain number,
   so "120.00 × 3" means three times, not × 0.03. */
let calcKeys = null;
function calcNew(amount) {
  const cents = centsFromAmount(amount);
  return { toks: cents ? [{ n: true, money: true, d: String(cents) }] : [] };
}
const CALC_OPS = { "+": "+", "-": "−", "*": "×", "/": "÷" };
function calcValue(st) {
  const toks = st.toks.slice();
  while (toks.length && !toks[toks.length - 1].n) toks.pop();
  if (!toks.length) return 0;
  const num = (tk) => (tk.money ? Number(tk.d || 0) / 100 : Number(tk.d || 0));
  // × and ÷ first, then + and −.
  const terms = [num(toks[0])], ops = [];
  for (let i = 1; i < toks.length; i += 2) {
    const op = toks[i].v, v = num(toks[i + 1]);
    if (op === "*") terms[terms.length - 1] *= v;
    else if (op === "/") terms[terms.length - 1] = v ? terms[terms.length - 1] / v : NaN;
    else { ops.push(op); terms.push(v); }
  }
  let r = terms[0];
  ops.forEach((op, i) => { r = op === "+" ? r + terms[i + 1] : r - terms[i + 1]; });
  return isFinite(r) ? round2(r) : NaN;
}
function calcPress(st, k) {
  const last = st.toks[st.toks.length - 1];
  if (/^\d+$/.test(k)) {
    if (last && last.n) { if (last.d.length < 11) last.d = (last.d + k).replace(/^0+(?=\d)/, "").slice(0, 11); }
    else st.toks.push({ n: true, money: !last || last.v === "+" || last.v === "-", d: k.replace(/^0+(?=\d)/, "") });
  } else if (CALC_OPS[k]) {
    if (!st.toks.length) return;
    if (last && !last.n) last.v = k; else st.toks.push({ n: false, v: k });
  } else if (k === "back") {
    if (!last) return;
    if (last.n && last.d.length > 1) last.d = last.d.slice(0, -1); else st.toks.pop();
  } else if (k === "clear") st.toks = [];
  else if (k === "=") {
    const v = calcValue(st);
    st.toks = v > 0 ? [{ n: true, money: true, d: String(Math.round(v * 100)) }] : [];
  }
}
function calcText(st) {
  return st.toks.map((tk) => (tk.n ? (tk.money ? moneyDigits(Number(tk.d || 0)) : tk.d || "0") : CALC_OPS[tk.v])).join(" ");
}
function calcHtml() {
  const k = (v, label, cls = "") => `<button type="button" class="ck${cls ? " " + cls : ""}" data-k="${v}">${label}</button>`;
  return `<div class="calc">${k("7", "7")}${k("8", "8")}${k("9", "9")}${k("/", "÷", "op")}${k("4", "4")}${k("5", "5")}${k("6", "6")}${k("*", "×", "op")}${k("1", "1")}${k("2", "2")}${k("3", "3")}${k("-", "−", "op")}${k("00", "00")}${k("0", "0")}${k("back", "⌫", "op")}${k("+", "+", "op")}${k("clear", "C", "op")}${k("=", "=", "op")}<button type="button" class="ck save" id="f-save">${t("save")}</button></div>`;
}
document.addEventListener("keydown", (e) => {
  if (!calcKeys || e.ctrlKey || e.metaKey || e.altKey) return;
  const tag = (document.activeElement?.tagName || "").toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return;
  const map = { Backspace: "back", Delete: "clear", Escape: null, "=": "=", Enter: "save" };
  let k = /^\d$/.test(e.key) ? e.key : CALC_OPS[e.key] ? e.key : map[e.key];
  if (e.key === "x" || e.key === "X") k = "*";
  if (!k) return;
  e.preventDefault();
  calcKeys(k);
});

function paintReceipt() {
  const box = $("#receipt-box");
  if (!box || !receiptDraft) return;
  const img = safeReceipt(receiptDraft.image);
  box.innerHTML = img
    ? `<button type="button" class="rc-thumb" id="r-view"><img alt="" src="${img}"></button><button type="button" class="rc-x" id="r-remove" aria-label="${esc(t("removeReceipt"))}">✕</button>`
    : (receiptDraft.loading ? `<span class="rc-load">…</span>` : "");
  box.classList.toggle("hidden", !img && !receiptDraft.loading);
  const rm = $("#r-remove");
  if (rm) rm.onclick = () => { receiptDraft.image = ""; receiptDraft.removed = true; receiptDraft.dirty = true; paintReceipt(); };
  const view = $("#r-view");
  if (view) view.onclick = () => {
    const lb = document.createElement("div");
    lb.className = "lightbox";
    lb.innerHTML = `<img alt="" src="${img}">`;
    lb.onclick = () => lb.remove();
    $("#sheet").appendChild(lb);
  };
}
function openExpense(e, presetType) {
  if (!S.wsId) return toast(t("needWs"));
  const sym = currencyOf(ws()).symbol;
  let formType = e ? (isIncome(e) ? "income" : "expense") : (presetType === "income" ? "income" : "expense");
  let repeat = false;
  const calc = calcNew(e ? e.amount : 0);
  receiptDraft = { image: "", loading: !!(e && e.receiptId), removed: false, dirty: false, id: e?.receiptId || "" };
  openModal(`<div class="xf">
    <div class="xf-head">
      <button type="button" class="icon-btn" id="f-cancel" aria-label="${esc(t("close"))}">✕</button>
      ${typeSeg("f-type", formType)}
      ${e ? `<button type="button" class="icon-btn danger" id="f-del" aria-label="${esc(t("delete"))}">🗑</button>` : `<span class="icon-btn ghost"></span>`}
    </div>
    <div class="xf-amt" id="f-amt-box"><span class="xf-sym">${esc(sym)}</span><div class="xf-nums"><div class="xf-expr" id="f-expr"></div><div class="xf-val" id="f-val">0.00</div></div></div>
    <div class="xf-grid">
      <label class="xf-field"><span>${t("date")}</span><input id="f-date" type="date" value="${e?.date || today()}"></label>
      <label class="xf-field"><span>${t("category")}</span><select id="f-cat">${catOptions(formType, e?.categoryId)}</select></label>
      <label class="xf-field"><span>${t("card")}</span><select id="f-card">${cardOptions(e?.cardId)}</select></label>
      <label class="xf-field"><span id="f-mem-l">${formType === "income" ? t("chartMember") : t("payer")}</span><select id="f-mem">${opts(memberList(), e?.memberUid || S.user.uid)}</select></label>
    </div>
    <div class="xf-row">
      <textarea id="f-rem" rows="1" maxlength="500" placeholder="${esc(t("remark"))} · ${esc(t("optional"))}">${esc(e?.remark || "")}</textarea>
      <div id="receipt-box" class="xf-receipt hidden"></div>
      <button type="button" class="icon-btn" id="r-pick" aria-label="${esc(t("receipt"))}" title="${esc(t("receipt"))}">📷</button>
      ${e ? "" : `<button type="button" class="chip-toggle" id="f-repeat" aria-pressed="false">🔁 <span id="f-repeat-l">${t("monthlyShort")}</span></button>`}
    </div>
    <input id="r-file" type="file" accept="image/*" class="hidden">
    ${calcHtml()}
  </div>`, "sheet-fit");
  const paintAmt = () => {
    const v = calcValue(calc);
    const hasOp = calc.toks.some((tk) => !tk.n);
    $("#f-expr").textContent = hasOp ? calcText(calc) : "";
    $("#f-val").textContent = isNaN(v) ? "—" : moneyDigits(Math.round(Math.max(0, v) * 100));
    $("#f-val").classList.toggle("bad", isNaN(v) || v < 0);
    $("#f-amt-box").classList.toggle("in", formType === "income");
    document.querySelector('.ck[data-k="="]').classList.toggle("live", hasOp);
  };
  const save = () => {
    const amount = calcValue(calc);
    if (!(amount > 0)) return toast(t("needAmount"));
    const data = { date: validYmd($("#f-date").value) ? $("#f-date").value : today(), amount, categoryId: $("#f-cat").value, cardId: $("#f-card").value, memberUid: $("#f-mem").value, remark: $("#f-rem").value.trim() };
    if (formType === "income") data.type = "income";
    else if (e && e.type) data.type = deleteField();
    if (e && e.split) data.split = deleteField();
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
    if (!e && repeat) {
      const rref = doc(wsRef("recurring"));
      const rule = { amount, categoryId: data.categoryId, cardId: data.cardId, memberUid: data.memberUid, remark: data.remark, day: Number(data.date.slice(8, 10)), lastMonth: data.date.slice(0, 7), active: true, createdBy: S.user.uid, createdAt: serverTimestamp() };
      if (data.type === "income") rule.type = "income";
      setDoc(rref, rule).catch((x) => toast(errMsg(x)));
      data.recurringId = rref.id;
    }
    const op = e ? updateDoc(expRef, data) : setDoc(expRef, { ...data, createdBy: S.user.uid, createdAt: serverTimestamp() });
    op.catch((x) => toast(errMsg(x)));
    closeModal(); toast(repeat ? t("repeatHint", { day: Number(data.date.slice(8, 10)) }) : t("saved"));
  };
  calcKeys = (k) => {
    if (k === "save") return save();
    calcPress(calc, k);
    paintAmt();
  };
  $("#sheet").querySelectorAll(".calc [data-k]").forEach((b) => (b.onclick = () => { calcKeys(b.dataset.k); if (navigator.vibrate) try { navigator.vibrate(5); } catch (x) {} }));
  $("#f-save").onclick = save;
  paintAmt();
  // Long notes grow up to three lines instead of pushing the keypad off screen.
  const rem = $("#f-rem");
  const grow = () => { rem.style.height = "auto"; rem.style.height = Math.min(rem.scrollHeight, 72) + "px"; };
  rem.addEventListener("input", grow); requestAnimationFrame(grow);
  const setType = (ty) => {
    if (ty === formType) return;
    formType = ty;
    $("#f-type").querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.ty === ty));
    const keep = $("#f-cat").value;
    $("#f-cat").innerHTML = catOptions(ty, S.cats.some((c) => c.id === keep && catKind(c) === ty) ? keep : undefined);
    $("#f-mem-l").textContent = ty === "income" ? t("chartMember") : t("payer");
    if (ty === "income") ensureIncomeCats();
    paintAmt();
  };
  $("#f-type").querySelectorAll("button").forEach((b) => (b.onclick = () => setType(b.dataset.ty)));
  if (formType === "income") ensureIncomeCats();
  const rp = $("#f-repeat");
  const paintRepeat = () => {
    if (!rp) return;
    rp.classList.toggle("on", repeat);
    rp.setAttribute("aria-pressed", repeat ? "true" : "false");
    const d = validYmd($("#f-date").value) ? Number($("#f-date").value.slice(8, 10)) : new Date().getDate();
    $("#f-repeat-l").textContent = repeat ? t("monthlyOn", { day: d }) : t("monthlyShort");
  };
  if (rp) { rp.onclick = () => { repeat = !repeat; paintRepeat(); }; $("#f-date").addEventListener("change", paintRepeat); }
  const file = $("#r-file");
  $("#r-pick").onclick = () => file.click();
  file.onchange = async () => {
    const f = file.files && file.files[0];
    file.value = "";
    if (!f) return;
    try {
      const data = await compressReceipt(f);
      receiptDraft.image = data; receiptDraft.removed = false; receiptDraft.dirty = true; receiptDraft.loading = false;
      paintReceipt();
    } catch (err) { toast(err && err.message === "big" ? t("photoTooBig") : t("photoFail")); }
  };
  paintReceipt();
  if (e && e.receiptId) {
    getDoc(doc(wsRef("receipts"), e.receiptId)).then((snap) => {
      if (!receiptDraft || receiptDraft.id !== e.receiptId || receiptDraft.dirty) return;
      receiptDraft.loading = false;
      receiptDraft.image = snap.exists() ? safeReceipt(snap.data().image) : "";
      paintReceipt();
    }).catch(() => { if (receiptDraft) { receiptDraft.loading = false; paintReceipt(); } });
  }
  $("#f-cancel").onclick = closeModal;
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
  const make = () => { const n = $("#ws-new").value.trim(); if (!n) return toast(t("needName")); const id = createWorkspace(n); closeModal(); lsSet("ws_" + S.user.uid, id); toast(t("created")); S.pendingSwitch = id; };
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
  <label>${t("amount")} (${esc(currencyOf(ws()).symbol)})</label><input id="qt-amt" type="text" inputmode="numeric" autocomplete="off">
  <label>${t("date")}</label><input id="qt-date" type="date" value="${today()}">
  <label>${t("payer")}</label><select id="qt-mem">${opts(memberList(), S.user.uid)}</select>
  <label>${t("remark")}</label><input id="qt-rem" placeholder="${esc(t("optional"))}">
  <div class="btns"><button class="btn" id="qt-cancel" type="button">${t("cancel")}</button><button class="btn primary" id="qt-save" type="button">${t("confirm")}</button></div>`);
  bindMoneyInput($("#qt-amt"), 0);
  let type = "deposit";
  $("#qt-type").querySelectorAll("button").forEach((b) => (b.onclick = () => { type = b.dataset.t; $("#qt-type").querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b)); }));
  $("#qt-cancel").onclick = closeModal;
  $("#qt-save").onclick = () => {
    const amount = readMoneyInput($("#qt-amt"));
    const fundId = $("#qt-fund").value;
    if (!fundId) return toast(t("needFund"));
    if (!(amount > 0)) return toast(t("needAmount"));
    addDoc(wsRef("funds", fundId, "txns"), { type, amount, date: $("#qt-date").value || today(), memberUid: $("#qt-mem").value, remark: $("#qt-rem").value.trim(), createdAt: serverTimestamp() }).catch((x) => toast(errMsg(x)));
    toast(t("recorded")); closeModal();
  };
}
function openFundForm(f) {
  openModal(`<h3>${f ? t("editGoal") : t("newGoal")}</h3><label>${t("goalName")}</label><input id="fd-name" value="${esc(f?.name || "")}" placeholder="${esc(t("goalPh"))}">
  <label>${t("goalAmount")} (${esc(currencyOf(ws()).symbol)})</label><input id="fd-target" type="text" inputmode="numeric" autocomplete="off">
  <div class="btns"><button class="btn" id="fd-cancel" type="button">${t("cancel")}</button><button class="btn primary" id="fd-save" type="button">${t("save")}</button></div>`);
  bindMoneyInput($("#fd-target"), f ? f.target : 0);
  $("#fd-cancel").onclick = closeModal;
  $("#fd-save").onclick = () => {
    const name = $("#fd-name").value.trim(), target = readMoneyInput($("#fd-target"));
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
  <label>${t("amount")} (${esc(currencyOf(ws()).symbol)})</label><input id="fu-amt" type="text" inputmode="numeric" autocomplete="off"><input id="fu-date" type="date" value="${today()}">
  <select id="fu-mem">${opts(memberList(), S.user.uid)}</select><input id="fu-rem" placeholder="${esc(t("optional"))}">
  <button class="btn primary block" id="fu-save" type="button">${t("confirm")}</button>
  <h3 style="margin-top:16px">${t("records")}</h3>${list.length ? list.map((txn) => `<div class="list-row"><span>${txn.type === "withdraw" ? t("withdraw") : t("deposit")} · ${esc(memberName(txn.memberUid))}<br><span class="muted">${esc(txn.date || "")} ${esc(txn.remark || "")}</span></span><span>${txn.type === "withdraw" ? "-" : "+"}${fmt(txn.amount)} <button class="del" type="button" data-tid="${txn.id}">${t("delete")}</button></span></div>`).join("") : `<div class="muted">${t("noRecords")}</div>`}
  <button class="btn block" id="fu-close" type="button">${t("close")}</button>`);
  bindMoneyInput($("#fu-amt"), 0);
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
    const amount = readMoneyInput($("#fu-amt"));
    if (!(amount > 0)) return toast(t("needAmount"));
    addDoc(wsRef("funds", f.id, "txns"), { type, amount, date: $("#fu-date").value || today(), memberUid: $("#fu-mem").value, remark: $("#fu-rem").value.trim(), createdAt: serverTimestamp() }).catch((x) => toast(errMsg(x)));
    toast(t("recorded")); setTimeout(() => openFund(f.id), 150);
  };
  $("#sheet").querySelectorAll("[data-tid]").forEach((a) => (a.onclick = () => { if (confirm(t("confirmDeleteTxn"))) { deleteDoc(doc(wsRef("funds", f.id, "txns"), a.dataset.tid)).catch((x) => toast(errMsg(x))); setTimeout(() => openFund(f.id), 150); } }));
}

/* ---------- Profile, icons, settings ---------- */
function loadEmojiData() {
  const key = S.lang === "en" ? "en" : "zh";
  if (!emojiCache[key]) {
    emojiCache[key] = fetch("https://cdn.jsdelivr.net/npm/emoji-picker-element-data@1/" + key + "/emojibase/data.json").then((r) => {
      if (!r.ok) throw new Error("emoji");
      return r.json();
    }).catch((err) => { delete emojiCache[key]; throw err; });
  }
  return emojiCache[key];
}
async function openFullEmojiPicker(current, onPick, onCancel) {
  openModal(`<h3>${t("pickIcon")}</h3><div class="epick"><input id="emoji-q" type="search" placeholder="${esc(t("emojiSearch"))}" enterkeyhint="search"><div class="epick-tabs" id="emoji-tabs"></div><div class="epick-grid" id="emoji-grid"><p class="muted">${t("wait")}</p></div></div><button class="btn block" id="em-close" type="button">${t("cancel")}</button>`);
  $("#em-close").onclick = () => { closeModal(); if (onCancel) onCancel(); };
  let items = [];
  let group = "all";
  let query = "";
  const drawTabs = () => {
    $("#emoji-tabs").innerHTML = EMOJI_GROUPS.map(([id, key]) => `<button type="button" data-g="${id}" class="${(query && id === "all") || (!query && String(id) === String(group)) ? "on" : ""}">${esc(t(key))}</button>`).join("");
    $("#emoji-tabs").querySelectorAll("button").forEach((b) => (b.onclick = () => { group = b.dataset.g === "all" ? "all" : Number(b.dataset.g); query = ""; const q = $("#emoji-q"); if (q) q.value = ""; draw(); }));
  };
  const draw = () => {
    drawTabs();
    const q = query.trim().toLowerCase();
    const list = items.filter((it) => it.group !== 2 && (q || group === "all" || it.group === group) && (!q || ((it.annotation || "") + " " + (it.tags || []).join(" ") + " " + (it.shortcodes || []).join(" ") + " " + it.emoji).toLowerCase().includes(q)));
    const grid = $("#emoji-grid");
    if (!grid) return;
    if (!list.length) { grid.innerHTML = `<p class="muted">${t("emojiEmpty")}</p>`; return; }
    const frag = document.createDocumentFragment();
    list.forEach((it) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = it.emoji;
      btn.title = it.annotation || "";
      btn.onclick = () => { const safe = safeIcon(it.emoji); if (!safe) return; closeModal(); onPick(safe); };
      frag.appendChild(btn);
    });
    grid.replaceChildren(frag);
  };
  try {
    items = await loadEmojiData();
    if (!$("#emoji-grid")) return;
    draw();
    $("#emoji-q").oninput = () => { query = $("#emoji-q").value || ""; draw(); };
  } catch (err) {
    toast(t("emojiFail"));
    if (onCancel) onCancel();
  }
}
async function deleteWorkspaceFully(w) {
  if (!w || !S.user || w.ownerUid !== S.user.uid) return;
  const wsId = w.id;
  const queue = [];
  const addSnap = (snap) => snap.docs.forEach((d) => queue.push(d.ref));
  try {
    for (const name of ["categories", "cards", "expenses", "receipts", "settlements"]) addSnap(await getDocs(collection(db, "workspaces", wsId, name)));
    const funds = await getDocs(collection(db, "workspaces", wsId, "funds"));
    for (const f of funds.docs) {
      addSnap(await getDocs(collection(db, "workspaces", wsId, "funds", f.id, "txns")));
      queue.push(f.ref);
    }
  } catch (err) { toast(errMsg(err)); return; }
  let batch = writeBatch(db), n = 0;
  const commits = [];
  const flush = () => { if (!n) return; commits.push(batch.commit().catch((err) => toast(errMsg(err)))); batch = writeBatch(db); n = 0; };
  queue.forEach((ref) => { batch.delete(ref); n += 1; if (n >= 400) flush(); });
  flush();
  commits.push(deleteDoc(doc(db, "workspaces", wsId)).catch((err) => toast(errMsg(err))));
  const rest = S.wsList.filter((x) => x.id !== wsId);
  lsDel("ws_" + S.user.uid);
  if (rest[0]) switchWs(rest[0].id);
  else {
    switchWs(null);
    const id = createWorkspace(t("personalWs"));
    lsSet("ws_" + S.user.uid, id);
  }
  toast(t("wsDeleted"));
}
function openDeleteWorkspace(w) {
  openModal(`<h3>${t("deleteWs")}</h3><p class="muted">${t("deleteWsWarn")}</p><label>${t("typeWsName", { name: esc(w.name) })}</label><input id="del-name" autocomplete="off">
    <div class="btns"><button class="btn" id="del-cancel" type="button">${t("cancel")}</button><button class="btn danger" id="del-go" type="button" disabled>${t("deleteWs")}</button></div>`);
  const sync = () => { $("#del-go").disabled = $("#del-name").value !== w.name; };
  $("#del-name").oninput = sync;
  $("#del-cancel").onclick = closeModal;
  $("#del-go").onclick = () => { if ($("#del-name").value !== w.name) return; closeModal(); deleteWorkspaceFully(w); };
}
function openCatForm(cat, draft, kindArg) {
  const kind = cat ? catKind(cat) : ((draft && draft.kind) || kindArg || "expense");
  const icon = (draft && draft.icon) || safeIcon(cat && cat.icon) || (kind === "income" ? "💰" : "🏷️");
  const name = draft && draft.name != null ? draft.name : ((cat && cat.name) || "");
  const budget = draft && draft.budget != null ? draft.budget : (Number(cat && cat.budget) || 0);
  const sym = currencyOf(ws()).symbol;
  openModal(`<h3>${cat ? t("editCategory") : t("newCat")} · ${kind === "income" ? t("typeIncome") : t("typeExpense")}</h3>
    <label>${t("catName")}</label><input id="c-name" maxlength="40" value="${esc(name)}">
    <label>${t("pickIcon")}</label><button class="ic-pick" id="c-icon" type="button">${esc(icon)}</button>
    ${kind === "expense" ? `<label>${t("catBudget")} (${esc(sym)})</label><input id="c-budget" type="text" inputmode="numeric" autocomplete="off"><p class="muted">${t("catBudgetHint")}</p>` : ""}
    <div class="btns">${cat ? `<button class="btn danger" id="c-del" type="button">${t("delete")}</button>` : ""}<button class="btn" id="c-cancel" type="button">${t("cancel")}</button><button class="btn primary" id="c-save" type="button">${t("save")}</button></div>`);
  if ($("#c-budget")) bindMoneyInput($("#c-budget"), budget);
  const readBudget = () => ($("#c-budget") ? readMoneyInput($("#c-budget")) : 0);
  $("#c-cancel").onclick = closeModal;
  $("#c-icon").onclick = () => {
    const d = { name: $("#c-name") ? $("#c-name").value : name, budget: readBudget(), kind };
    openFullEmojiPicker(icon, (emoji) => openCatForm(cat, { ...d, icon: emoji }), () => openCatForm(cat, { ...d, icon }));
  };
  $("#c-save").onclick = () => {
    const n = $("#c-name").value.trim();
    if (!n) return toast(t("needName"));
    const data = { name: n, icon };
    if (kind === "expense") data.budget = readBudget();
    const op = cat
      ? updateDoc(doc(wsRef("categories"), cat.id), data)
      : addDoc(wsRef("categories"), { ...data, ...(kind === "income" ? { kind: "income" } : {}), order: S.cats.length + (kind === "income" ? 50 : 0), createdAt: serverTimestamp() });
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
// Drag the ⋮⋮ handle to reorder categories. Works with mouse and touch.
function makeSortable(box) {
  box.querySelectorAll("[data-drag]").forEach((h) => h.addEventListener("pointerdown", (ev) => {
    const row = h.closest(".cat-row");
    if (!row || (ev.pointerType === "mouse" && ev.button !== 0)) return;
    ev.preventDefault();
    S.dragging = true;
    const before = [...box.querySelectorAll(".cat-row")].map((r) => r.dataset.cid).join(",");
    let startY = ev.clientY;
    row.classList.add("dragging");
    try { h.setPointerCapture(ev.pointerId); } catch (x) {}
    const move = (e) => {
      let dy = e.clientY - startY;
      const next = row.nextElementSibling, prev = row.previousElementSibling;
      if (next && dy > next.offsetHeight / 2) { box.insertBefore(next, row); startY += next.offsetHeight; dy -= next.offsetHeight; }
      else if (prev && dy < -prev.offsetHeight / 2) { box.insertBefore(row, prev); startY -= prev.offsetHeight; dy += prev.offsetHeight; }
      row.style.transform = `translateY(${dy}px)`;
    };
    const end = () => {
      h.removeEventListener("pointermove", move); h.removeEventListener("pointerup", end); h.removeEventListener("pointercancel", end);
      row.classList.remove("dragging"); row.style.transform = "";
      S.dragging = false;
      const ids = [...box.querySelectorAll(".cat-row")].map((r) => r.dataset.cid);
      if (ids.join(",") !== before) {
        const base = box.dataset.kind === "income" ? 50 : 0;
        const b = writeBatch(db);
        ids.forEach((id, i) => { const c = catOf(id); if (c) c.order = base + i; b.update(doc(wsRef("categories"), id), { order: base + i }); });
        S.cats.sort((a, z) => (a.order ?? 99) - (z.order ?? 99));
        b.commit().catch((x) => toast(errMsg(x)));
      }
      if (S.settingsStale) { S.settingsStale = false; renderSettings(); }
    };
    h.addEventListener("pointermove", move); h.addEventListener("pointerup", end); h.addEventListener("pointercancel", end);
  }));
}
function renderSettings() {
  const w = ws(), el = $("#settings");
  if (!el || !S.user) return;
  if (S.dragging) { S.settingsStale = true; return; }
  const name = S.profile.name || fallbackName();
  const parts = [];
  parts.push(`<div class="card profile-card"><button id="s-avatar" class="avatar-btn" type="button">${avatarEl(S.profile.avatar, name, "av lg")}</button><div class="profile-fields"><label class="sec-title">${t("displayName")}</label><div class="inline"><input id="s-dname" maxlength="40" value="${esc(name)}"><button class="btn primary" id="s-savename" type="button">${t("save")}</button></div><div class="muted">${esc(S.user.email || "")}</div></div></div>`);
  parts.push(`<div class="card"><b class="sec-title">${t("language")}</b><div class="seg" id="s-lang"><button type="button" data-lang="zh" class="${S.lang === "zh" ? "on" : ""}">简体中文</button><button type="button" data-lang="en" class="${S.lang === "en" ? "on" : ""}">English</button></div><b class="sec-title blk">${t("theme")}</b><div class="themes">${THEMES.map((id) => `<button type="button" class="theme-opt${S.theme === id ? " on" : ""}" data-theme-pick="${id}"><i class="swatch ${id}"></i><span>${t("theme_" + id)}</span></button>`).join("")}</div></div>`);
  if (!w) parts.push(`<div class="card empty">${t("noWs")}</div>`);
  else {
    const isOwner = w.ownerUid === S.user.uid;
    const catRow = (c) => {
      const icon = safeIcon(c.icon);
      const face = icon ? esc(icon) : esc(firstChar(c.name));
      return `<div class="list-row cat-row" data-cid="${esc(c.id)}"><span class="drag" data-drag aria-label="${esc(t("dragHint"))}" title="${esc(t("dragHint"))}">⋮⋮</span><button class="ic-pick${icon ? "" : " letter"}" type="button" data-edit="${c.id}">${face}</button><button class="grow cat-name" type="button" data-edit="${c.id}">${esc(c.name)}</button><button class="del" type="button" data-k="categories" data-id="${c.id}">${t("delete")}</button></div>`;
    };
    const cardRow = (c) => `<div class="list-row"><span class="grow">${esc(c.name)}</span><button class="del" type="button" data-k="cards" data-id="${c.id}">${t("delete")}</button></div>`;
    parts.push(`<div class="card"><b class="sec-title">${t("wsName")}</b><div class="inline"><input id="s-name" value="${esc(w.name)}"><button class="btn primary" id="s-rename" type="button">${t("save")}</button></div><label class="sec-title">${t("currency")}</label><select id="s-cur">${currencyOptions(currencyOf(w).code)}</select><div class="muted">${t("currencyHint")}</div><label class="sec-title blk" for="s-budget">${t("monthlyBudget")} (${esc(currencyOf(w).symbol)})</label><div class="inline"><input id="s-budget" type="text" inputmode="numeric" autocomplete="off"><button class="btn primary" id="s-savebudget" type="button">${t("save")}</button></div><div class="muted">${t("budgetHint")}</div></div>`);
    const expCats = S.cats.filter((c) => catKind(c) === "expense"), incCats = S.cats.filter((c) => catKind(c) === "income");
    parts.push(`<div class="card"><div class="sec-head"><b class="sec-title">${t("expenseCats")}</b><small class="muted">${t("dragHint")}</small></div><div class="sortable" data-kind="expense">${expCats.map(catRow).join("")}</div><button class="btn block" id="s-addcat" type="button">${t("add")}</button></div>`);
    parts.push(`<div class="card"><div class="sec-head"><b class="sec-title">${t("incomeCats")}</b><small class="muted">${t("dragHint")}</small></div><div class="sortable" data-kind="income">${incCats.map(catRow).join("")}</div><button class="btn block" id="s-addinc" type="button">${t("add")}</button></div>`);
    const recRow = (r) => {
      const c = catOf(r.categoryId);
      const label = r.remark || (c ? c.name : t("uncategorized"));
      const inc = r.type === "income";
      return `<div class="list-row rec-row" data-rec="${esc(r.id)}"><span class="ic-pick">${esc(safeIcon(c?.icon) || "🔁")}</span><span class="grow"><b class="rec-name">${esc(label)}</b><span class="muted">${r.active === false ? `<span class="pill">${t("paused")}</span> ` : ""}${t("everyMonthDay", { day: Number(r.day) || 1 })}${r.active === false ? "" : " · " + t("recurNext", { date: esc(nextRecurDate(r)) })}</span></span><span class="amt-s${inc ? " in" : ""}">${inc ? "+" : "-"}${fmt(r.amount)}</span></div>`;
    };
    parts.push(`<div class="card"><b class="sec-title">🔁 ${t("recurring")}</b>${S.recurring.length ? S.recurring.map(recRow).join("") : `<p class="muted">${t("recurringEmpty")}</p>`}<button class="btn block" id="s-addrec" type="button">${t("add")}</button></div>`);
    parts.push(`<div class="card"><b class="sec-title">${t("cards")}</b>${S.cards.map(cardRow).join("")}<div class="inline"><input id="s-card" placeholder="${esc(t("newCardPh"))}"><button class="btn primary" id="s-addcard" type="button">${t("add")}</button></div></div>`);
    parts.push(`<div class="card"><b class="sec-title">${t("members")}</b>${(w.members || []).map((uid) => `<div class="list-row"><span class="who">${avatarEl(w.memberInfo?.[uid]?.avatar, memberName(uid), "av")}<span class="meta">${esc(memberName(uid))}${uid === w.ownerUid ? ` <span class="muted">（${t("owner")}）</span>` : ""}<span class="muted em">${esc(w.memberInfo?.[uid]?.email || "")}</span></span></span>${isOwner && uid !== w.ownerUid ? `<button class="del" type="button" data-rm="${uid}">${t("remove")}</button>` : ""}</div>`).join("")}
      ${(w.invitedEmails || []).map((em) => `<div class="list-row"><span class="muted grow">⏳ ${esc(em)}（${t("pending")}）</span><button class="btn small" type="button" data-share="${esc(em)}">${t("copyInvite")}</button> <button class="del" type="button" data-unv="${esc(em)}">${t("revoke")}</button></div>`).join("")}
      <div class="inline"><input id="s-inv" type="email" placeholder="${esc(t("invitePh"))}"><button class="btn primary" id="s-invite" type="button">${t("invite")}</button></div>
      <div class="muted">${t("inviteHint")}</div>
      <textarea id="s-share" rows="4" readonly>${esc(S.inviteText || "")}</textarea>
      <div class="btns"><button class="btn" id="s-copy" type="button">${t("copyInvite")}</button><button class="btn primary" id="s-send" type="button">${t("shareInvite")}</button></div></div>`);
    if (isOwner) parts.push(`<button class="btn danger block" id="s-delete-ws" type="button">${t("deleteWs")}</button>`);
    else parts.push(`<button class="btn danger block" id="s-leave" type="button">${t("leaveWs")}</button>`);
  }
  parts.push(`<button class="btn block" id="s-logout" type="button">${t("logout")}</button>`);
  // Data from other members re-renders this page. Keep whatever the user is typing.
  const typed = {};
  el.querySelectorAll("input[id][data-dirty]").forEach((x) => { typed[x.id] = { value: x.value, cents: x.dataset.cents }; });
  const focusId = el.contains(document.activeElement) ? document.activeElement.id : "";
  el.innerHTML = parts.join("");
  $("#s-avatar").onclick = () => openAvatarPicker();
  const saveName = () => { delete $("#s-dname").dataset.dirty; saveProfile({ name: $("#s-dname").value }); };
  $("#s-savename").onclick = saveName;
  onEnter($("#s-dname"), saveName);
  el.querySelectorAll("#s-lang [data-lang]").forEach((b) => (b.onclick = () => setLang(b.dataset.lang, true)));
  el.querySelectorAll("[data-theme-pick]").forEach((b) => (b.onclick = () => setTheme(b.dataset.themePick, true)));
  if (w) {
    $("#s-rename").onclick = () => {
      const n = $("#s-name").value.trim();
      if (!n) return;
      delete $("#s-name").dataset.dirty;
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
    el.querySelectorAll(".sortable").forEach(makeSortable);
    $("#s-addcat").onclick = () => openCatForm(null, null, "expense");
    $("#s-addinc").onclick = () => openCatForm(null, null, "income");
    $("#s-addrec").onclick = () => openRecurringForm(null);
    el.querySelectorAll("[data-rec]").forEach((row) => (row.onclick = () => openRecurringForm(S.recurring.find((r) => r.id === row.dataset.rec))));
    bindMoneyInput($("#s-budget"), Number(w.budget) || 0);
    $("#s-savebudget").onclick = () => {
      const b = readMoneyInput($("#s-budget"));
      w.budget = b;
      delete $("#s-budget").dataset.dirty;
      updateDoc(wsRef(), { budget: b }).then(() => toast(t("saved"))).catch((x) => toast(errMsg(x)));
    };
    onEnter($("#s-budget"), () => $("#s-savebudget").click());
    el.querySelectorAll("[data-edit]").forEach((b) => (b.onclick = () => openCatForm(S.cats.find((c) => c.id === b.dataset.edit))));
    const addCard = () => {
      const box = $("#s-card"), n = box.value.trim();
      if (!n) return;
      box.value = ""; delete box.dataset.dirty;
      addDoc(wsRef("cards"), { name: n, createdAt: serverTimestamp() }).catch((x) => toast(errMsg(x)));
    };
    $("#s-addcard").onclick = addCard;
    onEnter($("#s-card"), addCard);
    el.querySelectorAll("[data-k]").forEach((a) => (a.onclick = () => { if (confirm(t("confirmDelete"))) deleteDoc(doc(wsRef(a.dataset.k), a.dataset.id)).catch((x) => toast(errMsg(x))); }));
    const showInvite = (email) => { S.inviteText = inviteMessage(email, w.name); const box = $("#s-share"); if (box) box.value = S.inviteText; };
    const invite = () => {
      const email = $("#s-inv").value.trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(email)) return toast(t("badEmail"));
      if ((w.members || []).some((uid) => (w.memberInfo?.[uid]?.email || "") === email)) return toast(t("alreadyMember"));
      if ((w.invitedEmails || []).includes(email)) { showInvite(email); shareInvite(S.inviteText); return; }
      updateDoc(wsRef(), { invitedEmails: arrayUnion(email) }).then(() => { const box = $("#s-inv"); if (box) { box.value = ""; delete box.dataset.dirty; } showInvite(email); toast(t("inviteSent")); shareInvite(S.inviteText); }).catch((x) => toast(errMsg(x)));
    };
    $("#s-invite").onclick = invite;
    onEnter($("#s-inv"), invite);
    if ($("#s-copy")) $("#s-copy").onclick = () => copyText($("#s-share").value || inviteMessage($("#s-inv").value.trim().toLowerCase() || t("email"), w.name));
    if ($("#s-send")) $("#s-send").onclick = () => shareInvite($("#s-share").value || inviteMessage($("#s-inv").value.trim().toLowerCase() || t("email"), w.name));
    el.querySelectorAll("[data-share]").forEach((b) => (b.onclick = () => { showInvite(b.dataset.share); copyText(S.inviteText); }));
    el.querySelectorAll("[data-unv]").forEach((a) => (a.onclick = () => updateDoc(wsRef(), { invitedEmails: arrayRemove(a.dataset.unv) }).catch((x) => toast(errMsg(x)))));
    el.querySelectorAll("[data-rm]").forEach((a) => (a.onclick = () => { if (confirm(t("confirmRemove"))) updateDoc(wsRef(), { members: arrayRemove(a.dataset.rm), [`memberInfo.${a.dataset.rm}`]: deleteField() }).catch((x) => toast(errMsg(x))); }));
    if ($("#s-leave")) $("#s-leave").onclick = () => { if (confirm(t("confirmLeave"))) { const id = S.wsId; updateDoc(doc(db, "workspaces", id), { members: arrayRemove(S.user.uid) }).catch((x) => toast(errMsg(x))); lsDel("ws_" + S.user.uid); switchWs(S.wsList.find((x) => x.id !== id)?.id); } };
    if ($("#s-delete-ws")) $("#s-delete-ws").onclick = () => openDeleteWorkspace(w);
  }
  $("#s-logout").onclick = () => { if (confirm(t("confirmLogout"))) signOut(auth); };
  el.querySelectorAll("input[id]").forEach((x) => {
    const keep = typed[x.id];
    if (keep) {
      if (keep.cents != null && x.dataset.moneyBound) setMoneyInput(x, Number(keep.cents) / 100);
      else x.value = keep.value;
      x.dataset.dirty = "1";
    }
    x.addEventListener("input", () => { x.dataset.dirty = "1"; });
  });
  if (focusId && $("#" + focusId)) { try { $("#" + focusId).focus({ preventScroll: true }); } catch (e) {} }
}

setTheme(S.theme, false);
setLang(S.lang, false);
