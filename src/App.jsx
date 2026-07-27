import React, { useState, useMemo, useCallback } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, LineChart, Line
} from "recharts";
import Papa from "papaparse";
import {
  Plus, Trash2, Pencil, X, Settings2, TrendingUp, TrendingDown, Wallet,
  CreditCard, Car, PieChart as PieIcon, Calendar, Link2, Check,
  AlertCircle, ChevronDown, ChevronRight, Download, Upload, PiggyBank,
  ArrowUpRight, ArrowDownRight, BookOpen, CheckCircle2, Circle, Clock,
  AlertTriangle, Eraser, Info, Repeat, ListOrdered, Infinity as InfinityIcon, Ban, Layers, Search, ClipboardPaste,
  Lock, LogOut, ShieldCheck, Archive, KeyRound, Eye, EyeOff, RefreshCw, ShieldAlert
} from "lucide-react";

/* =========================================================================
   TOKENS — "Livro-Caixa" (ledger book) design language
   Ink navy + parchment + sage/gold/rust, Fraunces + Inter + JetBrains Mono
   ========================================================================= */
const INK = "#101B2D";
const INK_SOFT = "#1B2A42";
const PARCHMENT = "#F7F2E6";
const PAPER = "#FFFFFF";
const LINE = "#DED5BE";
const SAGE = "#3D6B5C";
const SAGE_SOFT = "#E7EFEA";
const GOLD = "#C0932A";
const GOLD_SOFT = "#F5E9CC";
const RUST = "#B3472F";
const RUST_SOFT = "#F5E3DD";
const SLATE = "#5B6472";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MONTHS_FULL = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const CURRENT_MONTH_IDX = 6; // Julho — ponto de referência da planilha legada

const CAT_COLORS = ["#3D6B5C", "#B3472F", "#C0932A", "#5C7C99", "#8A6BAE", "#4E8B7C", "#9C6B4E", "#6B7A8F"];

const uid = () => Math.random().toString(36).slice(2, 10);
const brl = (n) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0);
const brlCompact = (n) => new Intl.NumberFormat("pt-BR", { notation: "compact", compactDisplay: "short", maximumFractionDigits: 1 }).format(n || 0);

const REFERENCE_YEAR_DEFAULT = 2026;
const TODAY = new Date();
const SOON_WINDOW_DAYS = 5;

/* =========================================================================
   AUTENTICAÇÃO
   -------------------------------------------------------------------------
   Isso é uma trava de acesso simples do lado do cliente (sem backend).
   Ela impede acesso casual, mas — como todo o código roda no navegador —
   NÃO é uma barreira de segurança real contra um atacante determinado
   (o hash abaixo pode ser lido e atacado offline, e o estado "autenticado"
   pode ser forçado via DevTools). Para segurança de verdade, proteja o
   domínio no provedor de hospedagem (ex.: Vercel Password Protection) ou
   implemente autenticação em um backend próprio.

   Para trocar o usuário/senha padrão, gere um novo hash rodando isto no
   console do navegador (com a senha desejada) e cole o resultado abaixo:

   crypto.subtle.digest("SHA-256", new TextEncoder().encode("usuario:senha"))
     .then(b => console.log([...new Uint8Array(b)].map(x => x.toString(16).padStart(2,"0")).join("")))

   Credenciais padrão: usuário "familia" · senha "meufinanceiro"
   ========================================================================= */
const AUTH_CONFIG = {
  username: "familia",
  hash: "a2c59262517a54d9428bd45ee36bd8a74ae6cabba2ac6a02edf2408dccd74f3e", // sha256("familia:meufinanceiro")
  maxAttempts: 5,
  lockoutSeconds: 30,
};

// SHA-256 puro em JS — usado como reserva caso window.crypto.subtle não esteja disponível
// (alguns ambientes de sandbox restringem a Web Crypto API mesmo em contexto seguro).
function sha256HexFallback(text) {
  function rrot(n, x) { return (x >>> n) | (x << (32 - n)); }
  const K = [
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2,
  ];
  let H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const bytes = new TextEncoder().encode(text);
  const bitLen = bytes.length * 8;
  const withOne = new Uint8Array(((bytes.length + 9 + 63) >> 6) << 6);
  withOne.set(bytes);
  withOne[bytes.length] = 0x80;
  const dv = new DataView(withOne.buffer);
  dv.setUint32(withOne.length - 4, bitLen >>> 0);
  dv.setUint32(withOne.length - 8, Math.floor(bitLen / 4294967296));

  for (let offset = 0; offset < withOne.length; offset += 64) {
    const w = new Array(64);
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(offset + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = rrot(7, w[i - 15]) ^ rrot(18, w[i - 15]) ^ (w[i - 15] >>> 3);
      const s1 = rrot(17, w[i - 2]) ^ rrot(19, w[i - 2]) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const S1 = rrot(6, e) ^ rrot(11, e) ^ rrot(25, e);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K[i] + w[i]) | 0;
      const S0 = rrot(2, a) ^ rrot(13, a) ^ rrot(22, a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    H = [H[0]+a|0, H[1]+b|0, H[2]+c|0, H[3]+d|0, H[4]+e|0, H[5]+f|0, H[6]+g|0, H[7]+h|0];
  }
  return H.map((x) => (x >>> 0).toString(16).padStart(8, "0")).join("");
}

async function sha256Hex(text) {
  try {
    if (window.crypto?.subtle) {
      const buf = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
      return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
    }
  } catch (_) { /* cai para a versão em JS puro abaixo */ }
  return sha256HexFallback(text);
}

const dueDateOf = (t) => new Date(t.year || REFERENCE_YEAR_DEFAULT, t.month, t.dueDay || 10);

// "paid" | "overdue" | "soon" | "pending"
function paymentStatus(t) {
  if (t.paid) return "paid";
  const due = dueDateOf(t);
  const diffDays = Math.floor((due - TODAY) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "overdue";
  if (diffDays <= SOON_WINDOW_DAYS) return "soon";
  return "pending";
}

/* =========================================================================
   SEED DATA — reconstrução da planilha legada
   ========================================================================= */
const seedCategories = () => ({
  expense: [
    { id: "moradia", name: "Moradia", color: CAT_COLORS[0], subs: [
      { id: "aluguel", name: "Aluguel / Financiamento" }, { id: "condominio", name: "Condomínio" },
      { id: "agua_luz", name: "Água e Luz" }, { id: "internet", name: "Internet e TV" },
    ]},
    { id: "veiculos", name: "Veículos", color: CAT_COLORS[1], subs: [
      { id: "spurs_car", name: "Spurs Car (parcela)" }, { id: "combustivel", name: "Combustível" }, { id: "manutencao", name: "Manutenção" },
    ]},
    { id: "cartoes", name: "Cartões de Crédito", color: CAT_COLORS[2], subs: [
      { id: "fatura_nubank", name: "Fatura Nubank" }, { id: "fatura_itau", name: "Fatura Itaú" },
    ]},
    { id: "alimentacao", name: "Alimentação", color: CAT_COLORS[3], subs: [
      { id: "mercado", name: "Mercado" }, { id: "restaurante", name: "Restaurante / Delivery" },
    ]},
    { id: "saude", name: "Saúde", color: CAT_COLORS[4], subs: [
      { id: "plano_saude", name: "Plano de Saúde" }, { id: "farmacia", name: "Farmácia" },
    ]},
    { id: "lazer", name: "Lazer", color: CAT_COLORS[5], subs: [
      { id: "streaming", name: "Streaming" }, { id: "passeios", name: "Passeios" },
    ]},
    { id: "educacao", name: "Educação", color: CAT_COLORS[6], subs: [{ id: "escola", name: "Escola / Curso" }] },
    { id: "outros_desp", name: "Outros", color: CAT_COLORS[7], subs: [{ id: "diversos", name: "Diversos" }] },
  ],
  income: [
    { id: "salario", name: "Salário", color: CAT_COLORS[0], subs: [
      { id: "salario_principal", name: "Salário Principal" }, { id: "salario_conjuge", name: "Salário Cônjuge" },
    ]},
    { id: "extra", name: "Renda Extra", color: CAT_COLORS[2], subs: [
      { id: "freelance", name: "Freelance" }, { id: "rendimentos", name: "Rendimentos" },
    ]},
  ],
});

const seedCards = () => ([]);

const seedVehicles = () => ([]);

function seedTransactions() {
  return [];
}

/* =========================================================================
   SMALL UI PRIMITIVES
   ========================================================================= */
/* =========================================================================
   LOGOTIPO — monograma "M" em formato de gráfico ascendente sobre moeda,
   nas cores do sistema (tinta + dourado)
   ========================================================================= */
function Logo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="MeuFinanceiro">
      <circle cx="20" cy="20" r="19" fill={GOLD} stroke="#8C6A1B" strokeWidth="1" />
      <circle cx="20" cy="20" r="14.5" fill="none" stroke="#8C6A1B" strokeWidth="1" opacity="0.35" />
      <path d="M10 26 L10 15 L15 22 L20 13 L25 22 L30 15 L30 26" stroke={INK} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function LedgerTab({ icon: Icon, label, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className="group relative flex items-center gap-2.5 w-full text-left transition-all duration-200"
      style={{
        padding: "13px 16px 13px 18px",
        marginBottom: 4,
        background: active ? PARCHMENT : "transparent",
        color: active ? INK : "#C7CEDA",
        borderTopLeftRadius: 8, borderBottomLeftRadius: 8,
        marginRight: active ? 0 : 10,
        boxShadow: active ? "inset 0 1px 0 rgba(0,0,0,0.04)" : "none",
      }}
    >
      <Icon size={16} strokeWidth={2} style={{ opacity: active ? 1 : 0.75 }} />
      <span className="text-[13px] font-medium tracking-wide flex-1" style={{ fontFamily: "Inter, sans-serif" }}>{label}</span>
      {!!badge && (
        <span className="text-[10.5px] font-semibold rounded-full flex items-center justify-center" style={{ minWidth: 18, height: 18, padding: "0 5px", background: active ? RUST : "#E7684F", color: "#fff" }}>{badge}</span>
      )}
      {active && <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: GOLD }} />}
    </button>
  );
}

function KpiCard({ label, value, sub, icon: Icon, tone = "ink" }) {
  const tones = {
    ink: { bg: PAPER, fg: INK, iconBg: "#EEF1F5" },
    sage: { bg: SAGE_SOFT, fg: SAGE, iconBg: "#D7E5DE" },
    rust: { bg: RUST_SOFT, fg: RUST, iconBg: "#EFD6CC" },
    gold: { bg: GOLD_SOFT, fg: "#8C6A1B", iconBg: "#ECD9A5" },
  };
  const t = tones[tone];
  return (
    <div className="ledger-card" style={{ background: t.bg }}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-[11px] uppercase tracking-[0.12em] font-semibold" style={{ color: SLATE, fontFamily: "Inter, sans-serif" }}>{label}</span>
        <div style={{ background: t.iconBg, borderRadius: 8, padding: 6 }}>
          <Icon size={15} color={t.fg} strokeWidth={2.2} />
        </div>
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 25, fontWeight: 600, color: t.fg, letterSpacing: "-0.02em" }}>{value}</div>
      {sub && <div className="text-[12px] mt-1.5" style={{ color: SLATE, fontFamily: "Inter, sans-serif" }}>{sub}</div>}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-[0.08em] font-semibold mb-1.5" style={{ color: SLATE, fontFamily: "Inter, sans-serif" }}>{label}</span>
      {children}
    </label>
  );
}
const inputCls = "w-full px-3 py-2 text-[13px] rounded-md outline-none transition-colors";
const inputStyle = { background: PAPER, border: `1px solid ${LINE}`, color: INK, fontFamily: "Inter, sans-serif" };

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(16,27,45,0.55)", backdropFilter: "blur(2px)" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full rounded-xl overflow-hidden" style={{ maxWidth: wide ? 640 : 440, background: PARCHMENT, border: `1px solid ${LINE}`, boxShadow: "0 24px 60px rgba(16,27,45,0.35)" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${LINE}` }}>
          <h3 className="text-[15px] font-semibold" style={{ fontFamily: "'Fraunces', serif", color: INK }}>{title}</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-black/5"><X size={17} color={SLATE} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div style={{ background: GOLD_SOFT, borderRadius: 999, padding: 14, marginBottom: 14 }}><Icon size={22} color="#8C6A1B" /></div>
      <div className="text-[14px] font-semibold mb-1" style={{ color: INK, fontFamily: "Inter, sans-serif" }}>{title}</div>
      <div className="text-[13px] max-w-xs" style={{ color: SLATE, fontFamily: "Inter, sans-serif" }}>{desc}</div>
    </div>
  );
}

/* =========================================================================
   MAIN APP
   ========================================================================= */
function Dashboard({ onLogout, authConfig, updateCredentials, verifyCredentials, persistWarning }) {
  const [tab, setTab] = useState("dashboard");
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
  const [categories, setCategories] = useState(seedCategories);
  const [cards, setCards] = useState(seedCards);
  const [vehicles, setVehicles] = useState(seedVehicles);
  const [transactions, setTransactions] = useState(seedTransactions);
  const [currentYear, setCurrentYear] = useState(REFERENCE_YEAR_DEFAULT);
  const [archivedYears, setArchivedYears] = useState({}); // { [year]: transactions[] }
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH_IDX);
  const [dashboardScope, setDashboardScope] = useState("month"); // "month" | "year"
  const [sheetConfig, setSheetConfig] = useState({ url: "", appsScriptUrl: "", status: "idle", message: "", lastSync: null });

  const allCategories = useMemo(() => [...categories.income, ...categories.expense], [categories]);
  const catById = useCallback((id) => allCategories.find((c) => c.id === id), [allCategories]);
  const subById = useCallback((catId, subId) => catById(catId)?.subs.find((s) => s.id === subId), [catById]);

  /* ---------- CRUD: transactions ---------- */
  /* ---------- Sincronização automática em segundo plano ---------- */
  const pushRowsToSheet = async (rows) => {
    if (!sheetConfig.appsScriptUrl || !rows.length) return;
    try {
      const res = await fetch(sheetConfig.appsScriptUrl, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(rows) });
      if (!res.ok) throw new Error("HTTP " + res.status);
      setSheetConfig((s) => ({ ...s, lastSync: new Date().toISOString() }));
    } catch (err) {
      setSheetConfig((s) => ({ ...s, status: "error", message: "Não foi possível salvar automaticamente na planilha (" + err.message + "). O lançamento continua salvo aqui — use 'Sincronizar agora' para tentar de novo." }));
    }
  };
  const deleteRowsFromSheet = async (ids) => {
    if (!sheetConfig.appsScriptUrl || !ids.length) return;
    try {
      const res = await fetch(sheetConfig.appsScriptUrl, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(ids.map((id) => ({ ID: id, _delete: true }))) });
      if (!res.ok) throw new Error("HTTP " + res.status);
      setSheetConfig((s) => ({ ...s, lastSync: new Date().toISOString() }));
    } catch (err) {
      setSheetConfig((s) => ({ ...s, status: "error", message: "Não foi possível remover automaticamente da planilha (" + err.message + "). Use 'Sincronizar agora' para tentar de novo." }));
    }
  };

  const addTransaction = (tx) => {
    const full = { id: uid(), paid: false, dueDay: 10, year: currentYear, ...tx };
    setTransactions((prev) => [...prev, full]);
    pushRowsToSheet([toSheetRow(full)]);
  };
  const addTransactionSeries = (entries) => {
    const fulls = entries.map((e) => ({ id: uid(), paid: false, dueDay: 10, year: currentYear, ...e }));
    setTransactions((prev) => [...prev, ...fulls]);
    pushRowsToSheet(fulls.map(toSheetRow));
  };
  const updateTransaction = (id, patch) => {
    setTransactions((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, ...patch } : t));
      const updated = next.find((t) => t.id === id);
      if (updated) pushRowsToSheet([toSheetRow(updated)]);
      return next;
    });
  };
  const deleteTransaction = (id) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    deleteRowsFromSheet([id]);
  };
  const togglePaid = (id) => {
    setTransactions((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, paid: !t.paid } : t));
      const updated = next.find((t) => t.id === id);
      if (updated) pushRowsToSheet([toSheetRow(updated)]);
      return next;
    });
  };
  const clearMonthTransactions = (month) => {
    setTransactions((prev) => {
      const toRemove = prev.filter((t) => t.month === month);
      if (toRemove.length) deleteRowsFromSheet(toRemove.map((t) => t.id));
      return prev.filter((t) => t.month !== month);
    });
  };
  const endRecurrence = (groupId, fromMonth) => {
    setTransactions((prev) => {
      const toRemove = prev.filter((t) => t.recurringGroupId === groupId && t.month >= fromMonth && !t.paid);
      if (toRemove.length) deleteRowsFromSheet(toRemove.map((t) => t.id));
      return prev.filter((t) => !toRemove.includes(t));
    });
  };
  const changeRecurrenceAmount = (groupId, fromMonth, newAmount) => {
    setTransactions((prev) => {
      const next = prev.map((t) => (t.recurringGroupId === groupId && t.month >= fromMonth && !t.paid ? { ...t, amount: newAmount } : t));
      const changed = next.filter((t) => t.recurringGroupId === groupId && t.month >= fromMonth && !t.paid);
      if (changed.length) pushRowsToSheet(changed.map(toSheetRow));
      return next;
    });
  };
  const resetAllTransactions = () => {
    setTransactions((prev) => {
      if (prev.length) deleteRowsFromSheet(prev.map((t) => t.id));
      return [];
    });
  };
  const archiveCurrentYear = () => {
    setArchivedYears((prev) => ({ ...prev, [currentYear]: transactions }));
    setTransactions([]);
    setCurrentYear((y) => y + 1);
    setSelectedMonth(0);
  };

  /* ---------- CRUD: categories ---------- */
  const addCategory = (type, name) => {
    const id = uid();
    setCategories((prev) => ({ ...prev, [type]: [...prev[type], { id, name, color: CAT_COLORS[prev[type].length % CAT_COLORS.length], subs: [] }] }));
  };
  const deleteCategory = (type, id) => setCategories((prev) => ({ ...prev, [type]: prev[type].filter((c) => c.id !== id) }));
  const addSubcategory = (type, catId, name) => setCategories((prev) => ({
    ...prev, [type]: prev[type].map((c) => (c.id === catId ? { ...c, subs: [...c.subs, { id: uid(), name }] } : c)),
  }));
  const deleteSubcategory = (type, catId, subId) => setCategories((prev) => ({
    ...prev, [type]: prev[type].map((c) => (c.id === catId ? { ...c, subs: c.subs.filter((s) => s.id !== subId) } : c)) ,
  }));

  /* ---------- CRUD: cards & vehicles ---------- */
  const addCard = (card) => setCards((prev) => [...prev, { id: uid(), ...card }]);
  const updateCard = (id, patch) => setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const deleteCard = (id) => setCards((prev) => prev.filter((c) => c.id !== id));

  const addVehicle = (v) => setVehicles((prev) => [...prev, { id: uid(), ...v }]);
  const updateVehicle = (id, patch) => setVehicles((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  const deleteVehicle = (id) => setVehicles((prev) => prev.filter((v) => v.id !== id));

  /* ---------- Computations ---------- */
  const monthTotals = useCallback((m) => {
    const inc = transactions.filter((t) => t.month === m && t.type === "income").reduce((s, t) => s + Number(t.amount || 0), 0);
    const exp = transactions.filter((t) => t.month === m && t.type === "expense").reduce((s, t) => s + Number(t.amount || 0), 0);
    return { income: inc, expense: exp, balance: inc - exp };
  }, [transactions]);

  const yearSeries = useMemo(() => MONTHS.map((label, i) => {
    const { income, expense } = monthTotals(i);
    return { month: label, Entradas: Math.round(income), Saídas: Math.round(expense) };
  }), [monthTotals]);

  const yearTotals = useMemo(() => {
    const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount || 0), 0);
    const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount || 0), 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const runningBalanceThrough = (m) => {
    let bal = 0;
    for (let i = 0; i <= m; i++) bal += monthTotals(i).balance;
    return bal;
  };

  const scopeKpis = useMemo(() => {
    if (dashboardScope === "year") {
      const savings = yearTotals.income > 0 ? (yearTotals.balance / yearTotals.income) * 100 : 0;
      return { ...yearTotals, saldoAtual: yearTotals.balance, savings };
    }
    const t = monthTotals(selectedMonth);
    const savings = t.income > 0 ? (t.balance / t.income) * 100 : 0;
    return { ...t, saldoAtual: runningBalanceThrough(selectedMonth), savings };
  }, [dashboardScope, selectedMonth, monthTotals, yearTotals]);

  const expenseByCategory = useMemo(() => {
    const scopeTx = transactions.filter((t) => t.type === "expense" && (dashboardScope === "year" || t.month === selectedMonth));
    const map = {};
    scopeTx.forEach((t) => { map[t.categoryId] = (map[t.categoryId] || 0) + Number(t.amount || 0); });
    return Object.entries(map).map(([id, value]) => ({ id, name: catById(id)?.name || id, value: Math.round(value), color: catById(id)?.color || SLATE }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, dashboardScope, selectedMonth, catById]);

  const cardInvoice = (cardId, m) => transactions.filter((t) => t.cardId === cardId && t.month === m).reduce((s, t) => s + Number(t.amount || 0), 0);

  const pendingBadgeCount = useMemo(
    () => transactions.filter((t) => !t.paid && (paymentStatus(t) === "overdue" || paymentStatus(t) === "soon")).length,
    [transactions]
  );

  const recurrenceBadgeCount = useMemo(() => {
    const groups = {};
    transactions.filter((t) => t.recurringGroupId).forEach((t) => {
      groups[t.recurringGroupId] = groups[t.recurringGroupId] || [];
      groups[t.recurringGroupId].push(t);
    });
    let count = 0;
    Object.values(groups).forEach((entries) => {
      const isInstallment = entries[0].installmentTotal;
      if (isInstallment) {
        const paidCount = entries.filter((e) => e.paid).length;
        if (paidCount < entries[0].installmentTotal) count++;
      } else {
        const lastMonth = Math.max(...entries.map((e) => e.month));
        if (lastMonth === 11) count++;
      }
    });
    return count;
  }, [transactions]);

  /* ---------- Google Sheets import/export ---------- */
  const toSheetRow = (t) => ({
    ID: t.id, Mes: MONTHS[t.month], Tipo: t.type === "income" ? "Receita" : "Despesa",
    Categoria: catById(t.categoryId)?.name || t.categoryId, Subcategoria: subById(t.categoryId, t.subId)?.name || t.subId,
    Descricao: t.description, Valor: t.amount, Cartao: t.cardId || "", Veiculo: t.vehicleId || "",
    Pago: t.paid ? "Sim" : "Não", Vencimento: t.dueDay || "",
  });

  const parseCsvIntoTransactions = (text) => {
    const trimmed = text.trim();
    if (!trimmed) throw new Error("O conteúdo está vazio.");
    if (trimmed.startsWith("<")) throw new Error("O link retornou uma página HTML, não um CSV — normalmente isso acontece quando a planilha não foi publicada (use 'Publicar na Web', não 'Compartilhar') ou o gid da aba está errado.");

    const parsed = Papa.parse(trimmed, { header: true, skipEmptyLines: true });
    if (parsed.errors?.length) throw new Error("Não foi possível interpretar o CSV recebido: " + parsed.errors[0].message);
    const rows = parsed.data;
    if (!rows.length) throw new Error("O CSV foi lido, mas nenhuma linha foi encontrada.");

    const headers = Object.keys(rows[0] || {}).map((h) => h.toLowerCase());
    const expected = ["mes", "tipo", "descricao", "valor"];
    const missing = expected.filter((h) => !headers.some((x) => x.startsWith(h.slice(0, 3))));
    if (missing.length === expected.length) {
      throw new Error("As colunas esperadas (Mes, Tipo, Categoria, Subcategoria, Descricao, Valor, Cartao, Veiculo) não foram encontradas — confira se publicou a aba 'Lancamentos' e não outra aba da planilha.");
    }

    const monthIndex = (label) => {
      const i = MONTHS.findIndex((m) => m.toLowerCase() === String(label || "").trim().slice(0, 3).toLowerCase());
      return i >= 0 ? i : 0;
    };
    return rows.map((r) => ({
      id: r.ID || r.Id || r.id || uid(),
      year: currentYear,
      month: monthIndex(r.Mes || r.Mês || r.month),
      type: (r.Tipo || r.type || "").toLowerCase().startsWith("rec") ? "income" : "expense",
      categoryId: (r.Categoria || r.category || "outros_desp").toLowerCase(),
      subId: (r.Subcategoria || r.subcategory || "diversos").toLowerCase(),
      description: r.Descricao || r.Descrição || r.description || "Importado da planilha",
      amount: parseFloat(String(r.Valor || r.amount || "0").replace(",", ".")) || 0,
      cardId: r.Cartao || r.Cartão || undefined,
      vehicleId: r.Veiculo || r.Veículo || undefined,
      paid: String(r.Pago || r.paid || "").toLowerCase().startsWith("s") || String(r.Pago || r.paid || "").toLowerCase() === "true",
      dueDay: Number(r.Vencimento || r.dueDay) || 10,
    }));
  };

  const importFromSheet = async () => {
    if (!sheetConfig.url) { setSheetConfig((s) => ({ ...s, status: "error", message: "Informe a URL de publicação CSV antes de importar." })); return; }
    setSheetConfig((s) => ({ ...s, status: "loading", message: "Buscando dados na planilha…" }));
    try {
      const res = await fetch(sheetConfig.url);
      if (!res.ok) throw new Error("A planilha respondeu com erro " + res.status + " — confirme se o link está publicado e acessível para qualquer pessoa.");
      const text = await res.text();
      const imported = parseCsvIntoTransactions(text);
      setTransactions(imported);
      setSheetConfig((s) => ({ ...s, status: "success", message: `${imported.length} lançamentos importados com sucesso (substituindo os dados locais). Para manter os dois lados sincronizados dali em diante, use a sincronização bidirecional abaixo.` }));
    } catch (err) {
      const isNetworkError = err instanceof TypeError;
      const suffix = isNetworkError
        ? " — o navegador bloqueou a requisição (CORS/rede). Use a opção 'Colar CSV manualmente' abaixo, que sempre funciona."
        : "";
      setSheetConfig((s) => ({ ...s, status: "error", message: (isNetworkError ? "Não foi possível buscar a planilha automaticamente" : "Falha ao importar: " + err.message) + suffix }));
    }
  };

  const importFromPastedCsv = (text) => {
    setSheetConfig((s) => ({ ...s, status: "loading", message: "Lendo o CSV colado…" }));
    try {
      const imported = parseCsvIntoTransactions(text);
      setTransactions(imported);
      setSheetConfig((s) => ({ ...s, status: "success", message: `${imported.length} lançamentos importados com sucesso a partir do texto colado.` }));
    } catch (err) {
      setSheetConfig((s) => ({ ...s, status: "error", message: "Falha ao importar: " + err.message }));
    }
  };

  /* ---------- Sincronização bidirecional via Apps Script Web App ---------- */
  const syncWithSheet = async () => {
    if (!sheetConfig.appsScriptUrl) { setSheetConfig((s) => ({ ...s, status: "error", message: "Informe a URL do Apps Script Web App antes de sincronizar." })); return; }
    setSheetConfig((s) => ({ ...s, status: "loading", message: "Buscando o que está na planilha…" }));
    try {
      // 1) Busca tudo que já está na planilha
      const res = await fetch(sheetConfig.appsScriptUrl);
      if (!res.ok) throw new Error("O Apps Script respondeu com erro " + res.status + " — confirme se o Web App foi publicado com acesso 'Qualquer pessoa'.");
      const rawText = await res.text();
      let remoteRows;
      try {
        remoteRows = JSON.parse(rawText);
      } catch {
        if (rawText.trim().toLowerCase().startsWith("id,") || rawText.includes(",")) {
          throw new Error("A URL informada parece ser o link de publicação em CSV (do passo 1), não a URL do Apps Script Web App (que termina em /exec, gerada no passo 4). Cole a URL certa no campo de sincronização.");
        }
        throw new Error("A resposta não veio em JSON válido — confirme se colou a URL do Apps Script Web App (termina em /exec) e se o deploy está ativo.");
      }
      if (!Array.isArray(remoteRows)) throw new Error("A resposta do Apps Script não veio no formato esperado (lista de linhas).");

      const monthIndex = (label) => {
        const i = MONTHS.findIndex((m) => m.toLowerCase() === String(label || "").trim().slice(0, 3).toLowerCase());
        return i >= 0 ? i : 0;
      };
      const remoteTx = remoteRows.filter((r) => r.ID).map((r) => ({
        id: r.ID, year: currentYear, month: monthIndex(r.Mes), type: String(r.Tipo || "").toLowerCase().startsWith("rec") ? "income" : "expense",
        categoryId: String(r.Categoria || "outros_desp").toLowerCase(), subId: String(r.Subcategoria || "diversos").toLowerCase(),
        description: r.Descricao || "Importado da planilha", amount: parseFloat(String(r.Valor || "0").replace(",", ".")) || 0,
        cardId: r.Cartao || undefined, vehicleId: r.Veiculo || undefined,
        paid: String(r.Pago || "").toLowerCase().startsWith("s"), dueDay: Number(r.Vencimento) || 10,
      }));

      // 2) Mescla: o que só existe aqui vai pra lá; o que só existe lá vem pra cá; o que existe nos dois mantém os dados extras daqui (parcelas, recorrência, observações) e os valores atualizados de lá.
      setTransactions((prevLocal) => {
        const localById = new Map(prevLocal.map((t) => [t.id, t]));
        const remoteById = new Map(remoteTx.map((t) => [t.id, t]));
        const allIds = new Set([...localById.keys(), ...remoteById.keys()]);
        const merged = [];
        allIds.forEach((id) => {
          const loc = localById.get(id);
          const rem = remoteById.get(id);
          if (loc && rem) merged.push({ ...loc, ...rem, notes: loc.notes, installmentNumber: loc.installmentNumber, installmentTotal: loc.installmentTotal, recurringGroupId: loc.recurringGroupId, indefiniteRecurring: loc.indefiniteRecurring });
          else merged.push(loc || rem);
        });

        // 3) Envia pra planilha o que só existia aqui (upsert em lote)
        const toPush = prevLocal.filter((t) => !remoteById.has(t.id)).map(toSheetRow);
        if (toPush.length) {
          fetch(sheetConfig.appsScriptUrl, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(toPush) }).catch(() => {});
        }

        return merged;
      });

      setSheetConfig((s) => ({ ...s, status: "success", message: `Sincronização concluída — ${remoteTx.length} lançamentos vieram da planilha e os que só existiam aqui foram enviados para lá.`, lastSync: new Date().toISOString() }));
    } catch (err) {
      const isNetworkError = err instanceof TypeError;
      setSheetConfig((s) => ({ ...s, status: "error", message: (isNetworkError ? "Não foi possível conectar ao Apps Script — verifique a URL e se o deploy está com acesso 'Qualquer pessoa'." : "Falha ao sincronizar: " + err.message) }));
    }
  };

  const exportCsv = () => {
    const csv = Papa.unparse(transactions.map(toSheetRow));
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "lancamentos_financas_familiares.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  /* ---------- Render ---------- */
  return (
    <div style={{ fontFamily: "Inter, sans-serif", background: PARCHMENT, minHeight: "100vh", color: INK }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .ledger-card { border-radius: 12px; padding: 18px 18px; border: 1px solid ${LINE}; }
        .stitch-top { position: relative; }
        .stitch-top::before {
          content: ""; position: absolute; top: 0; left: 16px; right: 16px; height: 1px;
          background-image: linear-gradient(90deg, ${LINE} 55%, transparent 45%);
          background-size: 8px 1px; opacity: 0.9;
        }
        input:focus, select:focus, textarea:focus { border-color: ${SAGE} !important; box-shadow: 0 0 0 3px rgba(61,107,92,0.12); }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: #C9BFA2; border-radius: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        .btn-primary { background: ${INK}; color: #fff; }
        .btn-primary:hover { background: ${INK_SOFT}; }
        .btn-ghost:hover { background: rgba(16,27,45,0.05); }
        .chip { transition: all .15s ease; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(6px);} to { opacity: 1; transform: translateY(0);} }
        .fade-up { animation: fadeUp .35s ease both; }
      `}</style>

      <div className="flex">
        {/* ============ SIDEBAR — ledger index tabs ============ */}
        <aside style={{ width: 236, background: INK, height: "100vh", position: "sticky", top: 0, alignSelf: "flex-start", paddingTop: 22, display: "flex", flexDirection: "column" }}>
          <div className="px-5 pb-6 flex items-center gap-2.5">
            <Logo size={34} />
            <div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 600, color: "#fff" }}>MeuFinanceiro</div>
              <div style={{ fontSize: 10.5, color: "#8B95A8", letterSpacing: "0.06em" }}>CONTROLE FAMILIAR · {currentYear}</div>
            </div>
          </div>
          <nav className="pl-2">
            <LedgerTab icon={PieIcon} label="Dashboard" active={tab === "dashboard"} onClick={() => setTab("dashboard")} />
            <LedgerTab icon={Calendar} label="Lançamentos" active={tab === "lancamentos"} onClick={() => setTab("lancamentos")} badge={pendingBadgeCount} />
            <LedgerTab icon={Layers} label="Parcelas & Recorrências" active={tab === "recorrencias"} onClick={() => setTab("recorrencias")} badge={recurrenceBadgeCount} />
            <LedgerTab icon={Settings2} label="Categorias" active={tab === "categorias"} onClick={() => setTab("categorias")} />
            <LedgerTab icon={Link2} label="Conexão Google Sheets" active={tab === "conexao"} onClick={() => setTab("conexao")} />
            <LedgerTab icon={TrendingUp} label="Relatório Anual" active={tab === "relatorio"} onClick={() => setTab("relatorio")} />
          </nav>
          <div className="px-4 mt-auto pt-8">
            <button onClick={() => setCredentialsModalOpen(true)} className="flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-lg text-[13px] font-medium" style={{ color: "#C7CEDA" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              <KeyRound size={15} /> Alterar usuário e senha
            </button>
            <button onClick={onLogout} className="flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-lg text-[13px] font-medium" style={{ color: "#C7CEDA" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              <LogOut size={15} /> Sair
            </button>
          </div>
        </aside>

        {credentialsModalOpen && (
          <ChangeCredentialsModal
            authConfig={authConfig} verifyCredentials={verifyCredentials} updateCredentials={updateCredentials}
            persistWarning={persistWarning} onClose={() => setCredentialsModalOpen(false)}
          />
        )}

        {/* ============ MAIN ============ */}
        <main className="flex-1 min-w-0 px-8 py-8">
          {tab === "dashboard" && (
            <DashboardTab
              dashboardScope={dashboardScope} setDashboardScope={setDashboardScope}
              selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}
              scopeKpis={scopeKpis} expenseByCategory={expenseByCategory} yearSeries={yearSeries}
              cards={cards} vehicles={vehicles} cardInvoice={cardInvoice} currentYear={currentYear}
            />
          )}
          {tab === "lancamentos" && (
            <LancamentosTab
              selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}
              transactions={transactions} categories={categories} cards={cards} vehicles={vehicles}
              catById={catById} subById={subById}
              addTransaction={addTransaction} updateTransaction={updateTransaction} deleteTransaction={deleteTransaction}
              addTransactionSeries={addTransactionSeries}
              togglePaid={togglePaid} clearMonthTransactions={clearMonthTransactions} currentYear={currentYear}
              archivedYears={archivedYears}
            />
          )}
          {tab === "recorrencias" && (
            <RecorrenciasTab
              transactions={transactions} catById={catById} subById={subById} cards={cards} vehicles={vehicles}
              togglePaid={togglePaid} endRecurrence={endRecurrence} changeRecurrenceAmount={changeRecurrenceAmount}
              setTab={setTab} setSelectedMonth={setSelectedMonth} currentYear={currentYear}
            />
          )}
          {tab === "categorias" && (
            <CategoriasTab
              categories={categories} addCategory={addCategory} deleteCategory={deleteCategory}
              addSubcategory={addSubcategory} deleteSubcategory={deleteSubcategory}
              cards={cards} addCard={addCard} updateCard={updateCard} deleteCard={deleteCard}
              vehicles={vehicles} addVehicle={addVehicle} updateVehicle={updateVehicle} deleteVehicle={deleteVehicle}
              cardInvoice={cardInvoice} selectedMonth={selectedMonth}
            />
          )}
          {tab === "conexao" && (
            <ConexaoTab sheetConfig={sheetConfig} setSheetConfig={setSheetConfig} importFromSheet={importFromSheet} importFromPastedCsv={importFromPastedCsv} exportCsv={exportCsv} syncWithSheet={syncWithSheet} resetAllTransactions={resetAllTransactions} transactionCount={transactions.length} />
          )}
          {tab === "relatorio" && (
            <RelatorioTab categories={categories} transactions={transactions} yearTotals={yearTotals} catById={catById}
              currentYear={currentYear} archivedYears={archivedYears} archiveCurrentYear={archiveCurrentYear} />
          )}
        </main>
      </div>
    </div>
  );
}

/* =========================================================================
   AUTENTICAÇÃO — tela de login (proteção do lado do cliente)
   ========================================================================= */
function LoginScreen({ onSuccess, authConfig }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [checking, setChecking] = useState(false);
  const [btnHover, setBtnHover] = useState(false);
  const usernameRef = React.useRef(null);
  const passwordRef = React.useRef(null);

  React.useEffect(() => {
    if (!lockedUntil) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [lockedUntil]);

  const secondsLeft = lockedUntil ? Math.max(0, Math.ceil((lockedUntil - now) / 1000)) : 0;
  const isLocked = secondsLeft > 0;

  const submit = async (e) => {
    e.preventDefault();
    if (isLocked || checking) return;
    // Lê o valor direto do campo (não só do state) para não falhar quando o
    // autofill/gerenciador de senhas preenche o campo sem disparar onChange.
    const liveUsername = (usernameRef.current?.value ?? username).trim();
    const livePassword = passwordRef.current?.value ?? password;

    if (!liveUsername || !livePassword) {
      setError("Preencha usuário e senha antes de entrar.");
      return;
    }

    setChecking(true);
    setError("");
    try {
      const hash = await sha256Hex(`${liveUsername}:${livePassword}`);
      if (hash === authConfig.hash) {
        onSuccess();
        return;
      }
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      setPassword("");
      if (passwordRef.current) passwordRef.current.value = "";
      if (nextAttempts >= AUTH_CONFIG.maxAttempts) {
        setLockedUntil(Date.now() + AUTH_CONFIG.lockoutSeconds * 1000);
        setAttempts(0);
        setError(`Muitas tentativas incorretas. Aguarde ${AUTH_CONFIG.lockoutSeconds}s para tentar de novo.`);
      } else {
        setError(`Usuário ou senha incorretos (tentativa ${nextAttempts} de ${AUTH_CONFIG.maxAttempts}).`);
      }
    } catch (err) {
      setError("Não foi possível verificar suas credenciais neste navegador (" + err.message + "). Tente atualizar a página ou usar outro navegador.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif", background: INK, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap');
        input:focus { border-color: ${SAGE} !important; box-shadow: 0 0 0 3px rgba(61,107,92,0.18); }
      `}</style>
      <div className="w-full" style={{ maxWidth: 380 }}>
        <div className="flex flex-col items-center mb-6">
          <Logo size={48} />
          <div className="mt-3 text-[19px] font-semibold" style={{ fontFamily: "'Fraunces', serif", color: "#fff" }}>MeuFinanceiro</div>
          <div className="text-[12px] mt-1" style={{ color: "#8B95A8" }}>Controle financeiro familiar</div>
        </div>

        <form onSubmit={submit} className="rounded-xl p-6" style={{ background: PARCHMENT, border: `1px solid ${LINE}` }}>
          <div className="flex items-center gap-2 mb-4">
            <Lock size={15} color={SLATE} />
            <span className="text-[13px] font-medium" style={{ color: INK }}>Acesso restrito</span>
          </div>

          <div className="space-y-3">
            <Field label="Usuário">
              <input ref={usernameRef} value={username} onChange={(e) => setUsername(e.target.value)} disabled={isLocked} autoFocus
                autoCapitalize="off" autoCorrect="off" spellCheck="false" autoComplete="username"
                className={inputCls} style={inputStyle} placeholder="Digite seu usuário" />
            </Field>
            <Field label="Senha">
              <div className="relative">
                <input ref={passwordRef} type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLocked}
                  autoCapitalize="off" autoCorrect="off" spellCheck="false" autoComplete="current-password"
                  className={inputCls} style={{ ...inputStyle, paddingRight: 36 }} placeholder="Digite sua senha" />
                <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-2.5 top-1/2 -translate-y-1/2" tabIndex={-1}>
                  {showPassword ? <EyeOff size={15} color={SLATE} /> : <Eye size={15} color={SLATE} />}
                </button>
              </div>
            </Field>
          </div>

          {error && (
            <div className="flex items-start gap-2 mt-3 px-3 py-2.5 rounded-lg text-[12px]" style={{ background: RUST_SOFT, color: RUST }}>
              <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" /> <span>{isLocked ? `Muitas tentativas incorretas. Aguarde ${secondsLeft}s.` : error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLocked || checking}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
            className="w-full mt-4 py-3 rounded-lg text-[14px] font-semibold flex items-center justify-center gap-2"
            style={{
              background: isLocked || checking ? "#8A93A6" : btnHover ? GOLD : INK,
              color: "#fff",
              border: "none",
              cursor: isLocked || checking ? "not-allowed" : "pointer",
              boxShadow: isLocked || checking ? "none" : "0 4px 14px rgba(16,27,45,0.25)",
              transition: "background 0.15s ease",
            }}
          >
            <KeyRound size={16} /> {isLocked ? `Aguarde ${secondsLeft}s` : checking ? "Verificando…" : "Entrar"}
          </button>
        </form>

        <p className="text-[11px] text-center mt-4" style={{ color: "#6E7893" }}>
          Acesso protegido por senha local. Para segurança adicional, configure também a proteção por senha do seu provedor de hospedagem.
        </p>
      </div>
    </div>
  );
}

/* =========================================================================
   MODAL — Alterar usuário e senha
   ========================================================================= */
function ChangeCredentialsModal({ authConfig, verifyCredentials, updateCredentials, persistWarning, onClose }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newUsername, setNewUsername] = useState(authConfig.username);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!currentPassword) { setError("Informe sua senha atual para confirmar a alteração."); return; }
    if (!newUsername.trim() || !newPassword) { setError("Preencha o novo usuário e a nova senha."); return; }
    if (newPassword.length < 6) { setError("A nova senha deve ter pelo menos 6 caracteres."); return; }
    if (newPassword !== confirmPassword) { setError("A confirmação não é igual à nova senha."); return; }

    setSaving(true);
    try {
      const ok = await verifyCredentials(authConfig.username, currentPassword);
      if (!ok) { setError("Senha atual incorreta."); return; }
      await updateCredentials(newUsername, newPassword);
      setSuccess(true);
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err) {
      setError("Não foi possível salvar as novas credenciais neste navegador (" + err.message + ").");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Alterar usuário e senha" onClose={onClose}>
      {success ? (
        <div>
          <div className="flex items-start gap-3 mb-4 px-3.5 py-3 rounded-lg" style={{ background: SAGE_SOFT }}>
            <CheckCircle2 size={18} color={SAGE} className="flex-shrink-0 mt-0.5" />
            <p className="text-[13px]" style={{ color: INK }}>Credenciais atualizadas com sucesso. Use o novo usuário e senha no próximo login.</p>
          </div>
          {persistWarning && (
            <div className="flex items-start gap-2 mb-4 px-3.5 py-3 rounded-lg text-[12px]" style={{ background: GOLD_SOFT, color: "#8C6A1B" }}>
              <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
              <span>Este navegador não permitiu salvar de forma permanente — a alteração vale só para esta aba/sessão. Ao recarregar a página, as credenciais anteriores voltam a valer.</span>
            </div>
          )}
          <div className="flex justify-end"><button onClick={onClose} className="btn-primary px-4 py-2 rounded-lg text-[13px] font-medium">Fechar</button></div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3.5">
          <Field label="Senha atual (para confirmar sua identidade)">
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputCls} style={inputStyle} autoComplete="current-password" />
          </Field>
          <Field label="Novo usuário">
            <input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className={inputCls} style={inputStyle} autoComplete="username" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nova senha"><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputCls} style={inputStyle} autoComplete="new-password" /></Field>
            <Field label="Confirmar nova senha"><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputCls} style={inputStyle} autoComplete="new-password" /></Field>
          </div>

          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg text-[12px]" style={{ background: RUST_SOFT, color: RUST }}>
              <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" /> <span>{error}</span>
            </div>
          )}

          <p className="text-[11.5px]" style={{ color: SLATE }}>
            Isso é salvo neste navegador (armazenamento local). Se você limpar os dados do navegador, usar uma aba anônima, ou acessar de outro dispositivo, as credenciais voltam a ser as definidas no código-fonte (constante <code className="px-1 rounded" style={{ background: "#EEE7D4" }}>AUTH_CONFIG</code>).
          </p>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-medium btn-ghost">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary px-4 py-2 rounded-lg text-[13px] font-medium disabled:opacity-50">{saving ? "Salvando…" : "Salvar novas credenciais"}</button>
          </div>
        </form>
      )}
    </Modal>
  );
}

const AUTH_STORAGE_KEY = "meufinanceiro_auth_v1";

function loadStoredAuthConfig() {
  try {
    const raw = window.localStorage?.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.username && parsed?.hash) return parsed;
    }
  } catch (_) { /* localStorage indisponível neste ambiente — usa o padrão do código */ }
  return { username: AUTH_CONFIG.username, hash: AUTH_CONFIG.hash };
}

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [authConfig, setAuthConfig] = useState(loadStoredAuthConfig);
  const [persistWarning, setPersistWarning] = useState(false);

  const updateCredentials = async (newUsername, newPassword) => {
    const hash = await sha256Hex(`${newUsername.trim()}:${newPassword}`);
    const next = { username: newUsername.trim(), hash };
    setAuthConfig(next);
    try {
      window.localStorage?.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
      setPersistWarning(false);
    } catch (_) {
      setPersistWarning(true); // credenciais trocadas só para esta sessão/aba
    }
    return next;
  };

  const verifyCredentials = async (usernameInput, passwordInput) => {
    const hash = await sha256Hex(`${usernameInput.trim()}:${passwordInput}`);
    return hash === authConfig.hash;
  };

  if (!authed) return <LoginScreen authConfig={authConfig} onSuccess={() => setAuthed(true)} />;
  return (
    <Dashboard
      onLogout={() => setAuthed(false)}
      authConfig={authConfig}
      updateCredentials={updateCredentials}
      verifyCredentials={verifyCredentials}
      persistWarning={persistWarning}
    />
  );
}

/* =========================================================================
   TAB: DASHBOARD
   ========================================================================= */
function DashboardTab({ dashboardScope, setDashboardScope, selectedMonth, setSelectedMonth, scopeKpis, expenseByCategory, yearSeries, cards, vehicles, cardInvoice, currentYear }) {
  return (
    <div className="fade-up">
      <header className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 600 }}>Resumo Executivo</h1>
          <p className="text-[13px] mt-1" style={{ color: SLATE }}>Visão consolidada das finanças da família.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${LINE}` }}>
            <button onClick={() => setDashboardScope("month")} className="px-3 py-1.5 text-[12.5px] font-medium" style={{ background: dashboardScope === "month" ? INK : PAPER, color: dashboardScope === "month" ? "#fff" : INK }}>Mês</button>
            <button onClick={() => setDashboardScope("year")} className="px-3 py-1.5 text-[12.5px] font-medium" style={{ background: dashboardScope === "year" ? INK : PAPER, color: dashboardScope === "year" ? "#fff" : INK }}>Ano completo</button>
          </div>
          {dashboardScope === "month" && (
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className={inputCls} style={{ ...inputStyle, width: 130 }}>
              {MONTHS_FULL.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Saldo Atual" value={brl(scopeKpis.saldoAtual)} sub={dashboardScope === "month" ? "Acumulado até o mês" : "Fechamento do ano"} icon={Wallet} tone="ink" />
        <KpiCard label="Receita Total" value={brl(scopeKpis.income)} sub={dashboardScope === "month" ? MONTHS_FULL[selectedMonth] : `Ano de ${currentYear}`} icon={ArrowUpRight} tone="sage" />
        <KpiCard label="Despesa Total" value={brl(scopeKpis.expense)} sub={dashboardScope === "month" ? MONTHS_FULL[selectedMonth] : `Ano de ${currentYear}`} icon={ArrowDownRight} tone="rust" />
        <KpiCard label="Taxa de Poupança" value={`${scopeKpis.savings.toFixed(1)}%`} sub="da receita foi poupada" icon={PiggyBank} tone="gold" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
        <div className="lg:col-span-2 ledger-card stitch-top" style={{ background: PAPER }}>
          <div className="flex items-center gap-2 mb-1"><PieIcon size={15} color={SAGE} /><h3 className="text-[13.5px] font-semibold">Despesas por Categoria</h3></div>
          <p className="text-[11.5px] mb-3" style={{ color: SLATE }}>{dashboardScope === "month" ? MONTHS_FULL[selectedMonth] : "Ano completo"}</p>
          {expenseByCategory.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={expenseByCategory} dataKey="value" nameKey="name" innerRadius={55} outerRadius={88} paddingAngle={2}>
                  {expenseByCategory.map((e, i) => <Cell key={i} fill={e.color} stroke={PAPER} strokeWidth={2} />)}
                </Pie>
                <Tooltip formatter={(v) => brl(v)} contentStyle={{ fontFamily: "Inter, sans-serif", fontSize: 12, borderRadius: 8, border: `1px solid ${LINE}` }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyState icon={PieIcon} title="Sem despesas no período" desc="Cadastre lançamentos para ver a distribuição por categoria." />}
          {expenseByCategory.length > 0 && (
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2">
              {expenseByCategory.slice(0, 8).map((e) => (
                <div key={e.id} className="flex items-center gap-1.5 text-[11px]" style={{ color: SLATE }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: e.color, flexShrink: 0 }} />
                  <span className="truncate">{e.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-3 ledger-card stitch-top" style={{ background: PAPER }}>
          <div className="flex items-center gap-2 mb-1"><TrendingUp size={15} color={SAGE} /><h3 className="text-[13.5px] font-semibold">Entradas vs. Saídas — Ano completo</h3></div>
          <p className="text-[11.5px] mb-3" style={{ color: SLATE }}>Comparativo mensal de receitas e despesas</p>
          <ResponsiveContainer width="100%" height={252}>
            <BarChart data={yearSeries} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke={LINE} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: SLATE, fontFamily: "Inter" }} axisLine={{ stroke: LINE }} tickLine={false} />
              <YAxis tickFormatter={brlCompact} tick={{ fontSize: 11, fill: SLATE, fontFamily: "Inter" }} axisLine={false} tickLine={false} width={44} />
              <Tooltip formatter={(v) => brl(v)} contentStyle={{ fontFamily: "Inter, sans-serif", fontSize: 12, borderRadius: 8, border: `1px solid ${LINE}` }} />
              <Legend wrapperStyle={{ fontSize: 12, fontFamily: "Inter" }} />
              <Bar dataKey="Entradas" fill={SAGE} radius={[3, 3, 0, 0]} />
              <Bar dataKey="Saídas" fill={RUST} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="ledger-card stitch-top" style={{ background: PAPER }}>
          <div className="flex items-center gap-2 mb-3"><CreditCard size={15} color={GOLD} /><h3 className="text-[13.5px] font-semibold">Faturas de Cartão — {MONTHS_FULL[selectedMonth]}</h3></div>
          <div className="space-y-2.5">
            {cards.map((c) => {
              const total = cardInvoice(c.id, selectedMonth);
              const pct = Math.min(100, (total / c.limit) * 100);
              return (
                <div key={c.id}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2"><span style={{ width: 9, height: 9, borderRadius: 99, background: c.color }} /><span className="text-[12.5px] font-medium">{c.name}</span></div>
                    <span className="text-[12.5px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{brl(total)} <span style={{ color: SLATE }}>/ {brl(c.limit)}</span></span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: "#EEE7D4" }}><div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: pct > 85 ? RUST : c.color }} /></div>
                </div>
              );
            })}
            {!cards.length && <EmptyState icon={CreditCard} title="Nenhum cartão cadastrado" desc="Adicione seus cartões na aba Categorias para acompanhar faturas aqui." />}
          </div>
        </div>
        <div className="ledger-card stitch-top" style={{ background: PAPER }}>
          <div className="flex items-center gap-2 mb-3"><Car size={15} color={SAGE} /><h3 className="text-[13.5px] font-semibold">Financiamentos de Veículos</h3></div>
          <div className="space-y-3">
            {vehicles.map((v) => {
              const pct = (v.paidInstallments / v.totalInstallments) * 100;
              return (
                <div key={v.id}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[12.5px] font-medium">{v.name}</span>
                    <span className="text-[12px]" style={{ color: SLATE }}>{v.paidInstallments}/{v.totalInstallments} parcelas</span>
                  </div>
                  <div className="h-1.5 rounded-full mb-1" style={{ background: "#EEE7D4" }}><div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: SAGE }} /></div>
                  <div className="text-[11.5px]" style={{ color: SLATE }}>{brl(v.installmentValue)}/mês · restam {brl((v.totalInstallments - v.paidInstallments) * v.installmentValue)}</div>
                </div>
              );
            })}
            {!vehicles.length && <EmptyState icon={Car} title="Nenhum financiamento" desc="Cadastre veículos na aba Categorias." />}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   TAB: LANÇAMENTOS
   ========================================================================= */
const STATUS_META = {
  paid: { label: "Pago", color: SAGE, bg: SAGE_SOFT, icon: CheckCircle2 },
  overdue: { label: "Vencido", color: RUST, bg: RUST_SOFT, icon: AlertTriangle },
  soon: { label: "Vence em breve", color: "#8C6A1B", bg: GOLD_SOFT, icon: Clock },
  pending: { label: "Pendente", color: SLATE, bg: "#EFEBE0", icon: Circle },
};
const STATUS_META_INCOME = { ...STATUS_META, paid: { ...STATUS_META.paid, label: "Recebido" }, pending: { ...STATUS_META.pending, label: "A receber" } };

function StatusChip({ t, onClick }) {
  const status = paymentStatus(t);
  const meta = (t.type === "income" ? STATUS_META_INCOME : STATUS_META)[status];
  const Icon = meta.icon;
  const interactive = !!onClick;
  return (
    <button onClick={onClick} disabled={!interactive} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium whitespace-nowrap"
      style={{ background: meta.bg, color: meta.color, cursor: interactive ? "pointer" : "default" }}
      title={interactive ? "Clique para alternar o status de pagamento" : undefined}>
      <Icon size={11.5} strokeWidth={2.4} />
      {meta.label}
    </button>
  );
}

function LancamentosTab({ selectedMonth, setSelectedMonth, transactions, categories, cards, vehicles, catById, subById, addTransaction, updateTransaction, deleteTransaction, addTransactionSeries, togglePaid, clearMonthTransactions, currentYear, archivedYears }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [confirmClear, setConfirmClear] = useState(false);
  const [descQuery, setDescQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "paid" | "unpaid"
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const archivedYearsList = Object.keys(archivedYears || {}).map(Number).sort((a, b) => b - a);
  const isViewingCurrent = selectedYear === currentYear;
  const dataset = isViewingCurrent ? transactions : (archivedYears[selectedYear] || []);

  const allMonthTx = dataset.filter((t) => t.month === selectedMonth);
  const monthTx = allMonthTx.filter((t) => filterType === "all" || t.type === filterType)
    .filter((t) => !descQuery.trim() || t.description.toLowerCase().includes(descQuery.trim().toLowerCase()))
    .filter((t) => categoryFilter === "all" || t.categoryId === categoryFilter)
    .filter((t) => statusFilter === "all" || (statusFilter === "paid" ? t.paid : !t.paid))
    .sort((a, b) => (a.type === b.type ? 0 : a.type === "income" ? -1 : 1));

  const hasExtraFilters = descQuery.trim() || categoryFilter !== "all" || statusFilter !== "all";
  const clearExtraFilters = () => { setDescQuery(""); setCategoryFilter("all"); setStatusFilter("all"); };

  const subtotals = useMemo(() => {
    const map = {};
    allMonthTx.forEach((t) => {
      const key = t.categoryId;
      map[key] = map[key] || { income: 0, expense: 0 };
      map[key][t.type] += Number(t.amount || 0);
    });
    return map;
  }, [allMonthTx]);

  const income = allMonthTx.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expense = allMonthTx.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);

  const overdueItems = isViewingCurrent ? allMonthTx.filter((t) => !t.paid && paymentStatus(t) === "overdue").sort((a, b) => a.dueDay - b.dueDay) : [];
  const soonItems = isViewingCurrent ? allMonthTx.filter((t) => !t.paid && paymentStatus(t) === "soon").sort((a, b) => a.dueDay - b.dueDay) : [];
  const hasAlerts = overdueItems.length > 0 || soonItems.length > 0;

  return (
    <div className="fade-up">
      <header className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 600 }}>Lançamentos</h1>
          <p className="text-[13px] mt-1" style={{ color: SLATE }}>Janeiro a Dezembro — registre entradas e saídas mês a mês.</p>
        </div>
        <div className="flex items-center gap-2">
          {archivedYearsList.length > 0 && (
            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className={inputCls} style={{ ...inputStyle, width: 160 }}>
              <option value={currentYear}>{currentYear} (ano atual)</option>
              {archivedYearsList.map((y) => <option key={y} value={y}>{y} (arquivado)</option>)}
            </select>
          )}
          {isViewingCurrent && (
            <>
              <button onClick={() => setConfirmClear(true)} disabled={!allMonthTx.length}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium btn-ghost disabled:opacity-40"
                style={{ border: `1px solid ${LINE}`, color: RUST }}>
                <Eraser size={15} /> Zerar mês
              </button>
              <button onClick={() => { setEditing(null); setModalOpen(true); }} className="btn-primary flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium">
                <Plus size={15} /> Novo lançamento
              </button>
            </>
          )}
        </div>
      </header>

      {!isViewingCurrent && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg mb-4 text-[12.5px]" style={{ background: GOLD_SOFT, color: "#8C6A1B" }}>
          <Archive size={14} /> Você está vendo o histórico arquivado de {selectedYear} — somente leitura, sem opção de adicionar, editar ou excluir.
        </div>
      )}

      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
        {MONTHS.map((m, i) => (
          <button key={m} onClick={() => setSelectedMonth(i)} className="chip px-3 py-1.5 rounded-full text-[12.5px] font-medium whitespace-nowrap"
            style={{ background: selectedMonth === i ? INK : PAPER, color: selectedMonth === i ? "#fff" : INK, border: `1px solid ${selectedMonth === i ? INK : LINE}` }}>
            {m}
          </button>
        ))}
      </div>

      {hasAlerts && (
        <div className="rounded-xl px-4 py-3.5 mb-4" style={{ background: overdueItems.length ? RUST_SOFT : GOLD_SOFT, border: `1px solid ${overdueItems.length ? "#E3B6A6" : "#E4CE93"}` }}>
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={16} color={overdueItems.length ? RUST : "#8C6A1B"} className="mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold mb-1.5" style={{ color: overdueItems.length ? RUST : "#8C6A1B" }}>
                {overdueItems.length > 0 && `${overdueItems.length} pagamento${overdueItems.length > 1 ? "s" : ""} vencido${overdueItems.length > 1 ? "s" : ""}`}
                {overdueItems.length > 0 && soonItems.length > 0 && " · "}
                {soonItems.length > 0 && `${soonItems.length} vence${soonItems.length > 1 ? "m" : ""} nos próximos ${SOON_WINDOW_DAYS} dias`}
                {" "}em {MONTHS_FULL[selectedMonth]}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[...overdueItems, ...soonItems].map((t) => (
                  <button key={t.id} onClick={() => togglePaid(t.id)} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11.5px] bg-white/60 hover:bg-white transition-colors">
                    <span className="font-medium">{t.description}</span>
                    <span style={{ color: SLATE }}>· vence dia {t.dueDay}</span>
                    <span style={{ color: SAGE, fontWeight: 600 }}>marcar como pago</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-full min-w-0">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex gap-1.5">
              {[["all", "Todos"], ["income", "Receitas"], ["expense", "Despesas"]].map(([k, l]) => (
                <button key={k} onClick={() => setFilterType(k)} className="px-2.5 py-1 rounded-md text-[12px] font-medium" style={{ background: filterType === k ? SAGE_SOFT : "transparent", color: filterType === k ? SAGE : SLATE }}>{l}</button>
              ))}
            </div>
            <div className="flex items-end gap-2 flex-wrap">
              <div className="relative">
                <Search size={13} color={SLATE} className="absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input value={descQuery} onChange={(e) => setDescQuery(e.target.value)} placeholder="Buscar por descrição…" className={inputCls} style={{ ...inputStyle, paddingLeft: 28, width: 190, padding: "6px 8px 6px 28px" }} />
              </div>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={inputCls} style={{ ...inputStyle, width: 170, padding: "6px 8px" }}>
                <option value="all">Todas as categorias</option>
                <optgroup label="Receitas">{categories.income.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</optgroup>
                <optgroup label="Despesas">{categories.expense.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</optgroup>
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputCls} style={{ ...inputStyle, width: 140, padding: "6px 8px" }}>
                <option value="all">Pago e não pago</option>
                <option value="paid">Só pagos</option>
                <option value="unpaid">Só não pagos</option>
              </select>
              {hasExtraFilters && (
                <button onClick={clearExtraFilters} className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[12px] font-medium btn-ghost" style={{ color: RUST }}><X size={12.5} /> Limpar</button>
              )}
            </div>
          </div>

          <div className="ledger-card p-0 overflow-hidden" style={{ background: PAPER }}>
            {monthTx.length === 0 ? (
              <EmptyState icon={Calendar} title={hasExtraFilters || filterType !== "all" ? "Nenhum resultado para os filtros" : "Nenhum lançamento em"} desc={hasExtraFilters || filterType !== "all" ? "Tente ajustar a descrição, categoria ou status pesquisados." : `Não há registros para ${MONTHS_FULL[selectedMonth]}. Adicione um novo lançamento para começar.`} />
            ) : (
              <div style={{ maxHeight: 480, overflowY: "auto", overflowX: "auto" }}>
                <table className="w-full text-[12.5px]" style={{ minWidth: 640 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${LINE}`, background: "#FBF8F1" }}>
                      <th className="text-left font-semibold px-4 py-2.5 sticky top-0" style={{ color: SLATE, background: "#FBF8F1" }}>Descrição</th>
                      <th className="text-left font-semibold px-3 py-2.5 sticky top-0" style={{ color: SLATE, background: "#FBF8F1" }}>Categoria</th>
                      <th className="text-center font-semibold px-3 py-2.5 sticky top-0" style={{ color: SLATE, background: "#FBF8F1" }}>Vencimento</th>
                      <th className="text-center font-semibold px-3 py-2.5 sticky top-0" style={{ color: SLATE, background: "#FBF8F1" }}>Status</th>
                      <th className="text-right font-semibold px-3 py-2.5 sticky top-0" style={{ color: SLATE, background: "#FBF8F1" }}>Valor</th>
                      <th className="px-3 py-2.5 sticky top-0" style={{ background: "#FBF8F1" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthTx.map((t) => (
                      <tr key={t.id} style={{ borderBottom: `1px solid ${LINE}` }} className="hover:bg-black/[0.015]">
                        <td className="px-4 py-2.5 max-w-[240px]">
                          <div className="flex items-center gap-1.5">
                            <div className="font-medium truncate" title={t.notes || undefined} style={t.notes ? { cursor: "help" } : undefined}>{t.description}</div>
                            {t.notes && <Info size={12.5} color={SLATE} className="flex-shrink-0" title={t.notes} style={{ cursor: "help" }} />}
                          </div>
                          {(t.cardId || t.vehicleId) && <div className="text-[11px] mt-0.5" style={{ color: SLATE }}>{t.cardId ? cards.find((c) => c.id === t.cardId)?.name : vehicles.find((v) => v.id === t.vehicleId)?.name}</div>}
                          {t.installmentTotal ? (
                            <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ background: GOLD_SOFT, color: "#8C6A1B" }}>
                              <ListOrdered size={10} /> Parcela {t.installmentNumber}/{t.installmentTotal}
                            </span>
                          ) : t.recurringGroupId ? (
                            <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ background: SAGE_SOFT, color: SAGE }}>
                              {t.indefiniteRecurring ? <InfinityIcon size={10} /> : <Repeat size={10} />} {t.indefiniteRecurring ? "Recorrente indefinido" : "Recorrente"}
                            </span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: SLATE }}>{catById(t.categoryId)?.name} <span className="opacity-60">› {subById(t.categoryId, t.subId)?.name}</span></td>
                        <td className="px-3 py-2.5 text-center whitespace-nowrap" style={{ color: SLATE, fontFamily: "'JetBrains Mono', monospace" }}>dia {t.dueDay}</td>
                        <td className="px-3 py-2.5 text-center"><StatusChip t={t} onClick={isViewingCurrent ? () => togglePaid(t.id) : undefined} /></td>
                        <td className="px-3 py-2.5 text-right font-semibold whitespace-nowrap" style={{ fontFamily: "'JetBrains Mono', monospace", color: t.type === "income" ? SAGE : RUST }}>
                          {t.type === "income" ? "+" : "−"} {brl(t.amount)}
                        </td>
                        <td className="px-3 py-2.5">
                          {isViewingCurrent && (
                            <div className="flex items-center gap-1 justify-end">
                              <button onClick={() => { setEditing(t); setModalOpen(true); }} className="p-1.5 rounded-md btn-ghost"><Pencil size={13} color={SLATE} /></button>
                              <button onClick={() => deleteTransaction(t.id)} className="p-1.5 rounded-md btn-ghost"><Trash2 size={13} color={RUST} /></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="ledger-card" style={{ background: INK, color: "#fff" }}>
            <div className="text-[11px] uppercase tracking-wide mb-3" style={{ color: "#93A0B4" }}>Resumo de {MONTHS_FULL[selectedMonth]}</div>
            <div className="flex justify-between text-[13px] mb-2"><span style={{ color: "#93A0B4" }}>Entradas</span><span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{brl(income)}</span></div>
            <div className="flex justify-between text-[13px] mb-2"><span style={{ color: "#93A0B4" }}>Saídas</span><span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{brl(expense)}</span></div>
            <div className="h-px my-2" style={{ background: "#2A3B57" }} />
            <div className="flex justify-between text-[14px] font-semibold"><span>Saldo do mês</span><span style={{ fontFamily: "'JetBrains Mono', monospace", color: income - expense >= 0 ? "#7FCB9F" : "#F0A08C" }}>{brl(income - expense)}</span></div>
          </div>

          <div className="ledger-card" style={{ background: PAPER }}>
            <div className="text-[11px] uppercase tracking-wide mb-3" style={{ color: SLATE }}>Subtotais por Categoria</div>
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {[...categories.income, ...categories.expense].map((c) => {
                const st = subtotals[c.id];
                if (!st || (st.income === 0 && st.expense === 0)) return null;
                const val = st.income - st.expense;
                return (
                  <div key={c.id} className="flex items-center justify-between text-[12.5px]">
                    <div className="flex items-center gap-1.5 truncate"><span style={{ width: 7, height: 7, borderRadius: 2, background: c.color }} /><span className="truncate">{c.name}</span></div>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", color: val >= 0 && st.income > 0 ? SAGE : RUST }}>{brl(Math.abs(val))}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      {modalOpen && (
        <TransactionModal
          onClose={() => setModalOpen(false)}
          initial={editing}
          categories={categories} cards={cards} vehicles={vehicles} selectedMonth={selectedMonth} currentYear={currentYear}
          onSave={(data) => {
            if (Array.isArray(data)) { addTransactionSeries(data); }
            else if (editing) { updateTransaction(editing.id, data); }
            else { addTransaction(data); }
            setModalOpen(false);
          }}
        />
      )}

      {confirmClear && (
        <Modal title="Zerar lançamentos do mês" onClose={() => setConfirmClear(false)}>
          <div className="flex items-start gap-3 mb-4">
            <div style={{ background: RUST_SOFT, borderRadius: 999, padding: 10, flexShrink: 0 }}><AlertTriangle size={18} color={RUST} /></div>
            <p className="text-[13px]" style={{ color: INK }}>
              Isso vai excluir permanentemente os <b>{allMonthTx.length} lançamentos</b> de <b>{MONTHS_FULL[selectedMonth]}</b>. Essa ação não pode ser desfeita. Deseja continuar?
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setConfirmClear(false)} className="px-4 py-2 rounded-lg text-[13px] font-medium btn-ghost">Cancelar</button>
            <button onClick={() => { clearMonthTransactions(selectedMonth); setConfirmClear(false); }} className="px-4 py-2 rounded-lg text-[13px] font-medium text-white" style={{ background: RUST }}>Zerar mês</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function TransactionModal({ onClose, onSave, initial, categories, cards, vehicles, selectedMonth, currentYear }) {
  const [type, setType] = useState(initial?.type || "expense");
  const [month, setMonth] = useState(initial?.month ?? selectedMonth);
  const [categoryId, setCategoryId] = useState(initial?.categoryId || categories[type][0]?.id || "");
  const list = categories[type];
  const activeCat = list.find((c) => c.id === categoryId) || list[0];
  const [subId, setSubId] = useState(initial?.subId || activeCat?.subs[0]?.id || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [amount, setAmount] = useState(initial?.amount ?? "");
  const [cardId, setCardId] = useState(initial?.cardId || "");
  const [vehicleId, setVehicleId] = useState(initial?.vehicleId || "");
  const [dueDay, setDueDay] = useState(initial?.dueDay ?? 10);
  const [paid, setPaid] = useState(initial?.paid ?? false);

  const isEditing = !!initial;
  const [recurring, setRecurring] = useState(false);
  const [recurrenceMode, setRecurrenceMode] = useState("installments"); // "installments" | "fixed"
  const [installmentsCount, setInstallmentsCount] = useState(2);
  const [endMode, setEndMode] = useState("until"); // "until" | "indefinite"
  const [endMonth, setEndMonth] = useState(11);

  const handleTypeChange = (t) => { setType(t); const first = categories[t][0]; setCategoryId(first?.id || ""); setSubId(first?.subs[0]?.id || ""); };
  const handleCatChange = (id) => { setCategoryId(id); const c = list.find((x) => x.id === id); setSubId(c?.subs[0]?.id || ""); };

  const submit = () => {
    if (!description.trim() || !amount || !categoryId) return;
    const base = {
      type, categoryId, subId, description: description.trim(), notes: notes.trim() || undefined,
      amount: parseFloat(amount), cardId: cardId || undefined, vehicleId: vehicleId || undefined,
      dueDay: Math.min(31, Math.max(1, Number(dueDay) || 10)), paid,
    };

    if (!isEditing && recurring) {
      const groupId = uid();
      const startMonth = Number(month);
      const entries = [];
      if (recurrenceMode === "installments") {
        const total = Math.max(2, Math.min(48, Number(installmentsCount) || 2));
        for (let i = 0; i < total; i++) {
          const m = startMonth + i;
          if (m > 11) break; // não ultrapassa dezembro de 2026
          entries.push({ ...base, month: m, installmentNumber: i + 1, installmentTotal: total, recurringGroupId: groupId, paid: i === 0 ? paid : false });
        }
      } else {
        const end = endMode === "indefinite" ? 11 : Math.max(startMonth, Number(endMonth));
        for (let m = startMonth; m <= end; m++) {
          entries.push({ ...base, month: m, recurringGroupId: groupId, indefiniteRecurring: endMode === "indefinite", paid: m === startMonth ? paid : false });
        }
      }
      onSave(entries);
      return;
    }

    onSave({
      ...base, month: Number(month),
      installmentNumber: initial?.installmentNumber, installmentTotal: initial?.installmentTotal,
      recurringGroupId: initial?.recurringGroupId,
    });
  };

  return (
    <Modal title={initial ? "Editar lançamento" : "Novo lançamento"} onClose={onClose} wide>
      <div className="space-y-3.5">
        <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${LINE}` }}>
          <button onClick={() => handleTypeChange("income")} className="flex-1 py-2 text-[13px] font-medium" style={{ background: type === "income" ? SAGE : PAPER, color: type === "income" ? "#fff" : INK }}>Receita</button>
          <button onClick={() => handleTypeChange("expense")} className="flex-1 py-2 text-[13px] font-medium" style={{ background: type === "expense" ? RUST : PAPER, color: type === "expense" ? "#fff" : INK }}>Despesa</button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Field label={recurring && !isEditing ? "Mês inicial" : "Mês"}><select value={month} onChange={(e) => setMonth(e.target.value)} className={inputCls} style={inputStyle}>{MONTHS_FULL.map((m, i) => <option key={m} value={i}>{m}</option>)}</select></Field>
          <Field label="Valor (R$)"><input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" className={inputCls} style={inputStyle} /></Field>
          <Field label="Dia de vencimento"><input type="number" min="1" max="31" value={dueDay} onChange={(e) => setDueDay(e.target.value)} className={inputCls} style={inputStyle} /></Field>
        </div>

        <Field label="Descrição"><input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex.: Mercado do mês" className={inputCls} style={inputStyle} /></Field>

        <Field label="Observações (aparece como tooltip ao passar o mouse)">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex.: itens comprados, motivo do gasto, detalhes do contrato…" rows={2} className={inputCls} style={{ ...inputStyle, resize: "vertical" }} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Categoria"><select value={categoryId} onChange={(e) => handleCatChange(e.target.value)} className={inputCls} style={inputStyle}>{list.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
          <Field label="Subcategoria"><select value={subId} onChange={(e) => setSubId(e.target.value)} className={inputCls} style={inputStyle}>{activeCat?.subs.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
        </div>

        {type === "expense" && categoryId === "cartoes" && (
          <Field label="Cartão vinculado"><select value={cardId} onChange={(e) => setCardId(e.target.value)} className={inputCls} style={inputStyle}><option value="">Nenhum</option>{cards.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        )}
        {type === "expense" && categoryId === "veiculos" && (
          <Field label="Veículo / financiamento vinculado"><select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className={inputCls} style={inputStyle}><option value="">Nenhum</option>{vehicles.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select></Field>
        )}

        <label className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer" style={{ background: paid ? SAGE_SOFT : "#F1EDE1" }}>
          <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} className="w-4 h-4 accent-current" style={{ color: SAGE }} />
          <span className="text-[13px] font-medium" style={{ color: paid ? SAGE : SLATE }}>{type === "income" ? (recurring ? "Já recebi a 1ª ocorrência" : "Já foi recebido") : (recurring ? "Já paguei a 1ª ocorrência" : "Já foi pago")}</span>
        </label>

        {!isEditing ? (
          <div className="rounded-lg" style={{ border: `1px solid ${LINE}`, background: "#FBF8F1" }}>
            <label className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer">
              <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} className="w-4 h-4 accent-current" style={{ color: GOLD }} />
              <Repeat size={14} color={recurring ? "#8C6A1B" : SLATE} />
              <span className="text-[13px] font-medium" style={{ color: recurring ? "#8C6A1B" : INK }}>Lançamento recorrente ou parcelado</span>
            </label>

            {recurring && (
              <div className="px-3 pb-3.5 pt-1 space-y-3">
                <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${LINE}` }}>
                  <button onClick={() => setRecurrenceMode("installments")} className="flex-1 py-1.5 text-[12px] font-medium" style={{ background: recurrenceMode === "installments" ? INK : PAPER, color: recurrenceMode === "installments" ? "#fff" : INK }}>Parcelado (nº fixo)</button>
                  <button onClick={() => setRecurrenceMode("fixed")} className="flex-1 py-1.5 text-[12px] font-medium" style={{ background: recurrenceMode === "fixed" ? INK : PAPER, color: recurrenceMode === "fixed" ? "#fff" : INK }}>Fixo mensal</button>
                </div>

                {recurrenceMode === "installments" ? (
                  <div className="grid grid-cols-2 gap-3 items-end">
                    <Field label="Número de parcelas"><input type="number" min="2" max="48" value={installmentsCount} onChange={(e) => setInstallmentsCount(e.target.value)} className={inputCls} style={inputStyle} /></Field>
                    <div className="text-[11.5px] pb-2" style={{ color: SLATE }}>
                      Serão criados lançamentos de <b>{MONTHS_FULL[Number(month)]}</b> até{" "}
                      <b>{MONTHS_FULL[Math.min(11, Number(month) + Math.max(2, Number(installmentsCount) || 2) - 1)]}</b>, cada um marcado com a parcela atual (ex.: 1/{installmentsCount || 2}).
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${LINE}` }}>
                      <button onClick={() => setEndMode("until")} className="flex-1 py-1.5 text-[12px] font-medium" style={{ background: endMode === "until" ? SAGE : PAPER, color: endMode === "until" ? "#fff" : INK }}>Até um mês específico</button>
                      <button onClick={() => setEndMode("indefinite")} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[12px] font-medium" style={{ background: endMode === "indefinite" ? SAGE : PAPER, color: endMode === "indefinite" ? "#fff" : INK }}><InfinityIcon size={13} /> Sem data de término</button>
                    </div>
                    {endMode === "until" ? (
                      <div className="grid grid-cols-2 gap-3 items-end">
                        <Field label="Repetir até o mês"><select value={endMonth} onChange={(e) => setEndMonth(e.target.value)} className={inputCls} style={inputStyle}>{MONTHS_FULL.map((m, i) => <option key={m} value={i} disabled={i < Number(month)}>{m}</option>)}</select></Field>
                        <div className="text-[11.5px] pb-2" style={{ color: SLATE }}>Mesmo valor lançado todo mês, sem contagem de parcelas — ideal para assinaturas e mensalidades fixas.</div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 text-[11.5px] px-3 py-2.5 rounded-lg" style={{ background: GOLD_SOFT, color: "#8C6A1B" }}>
                        <InfinityIcon size={14} className="mt-0.5 flex-shrink-0" />
                        <span>Repete todo mês <b>indefinidamente</b>, sem data para parar — serão criados lançamentos de {MONTHS_FULL[Number(month)]} até Dezembro/{currentYear} e o lançamento fica marcado como recorrente contínuo para os próximos anos.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : initial?.installmentTotal ? (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-[12px]" style={{ background: GOLD_SOFT, color: "#8C6A1B" }}>
            <ListOrdered size={14} /> Parcela {initial.installmentNumber} de {initial.installmentTotal} — as demais parcelas não são alteradas por esta edição.
          </div>
        ) : initial?.recurringGroupId ? (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-[12px]" style={{ background: GOLD_SOFT, color: "#8C6A1B" }}>
            {initial.indefiniteRecurring ? <InfinityIcon size={14} /> : <Repeat size={14} />}
            {initial.indefiniteRecurring ? "Faz parte de um lançamento recorrente indefinido" : "Faz parte de um lançamento recorrente"} — as demais ocorrências não são alteradas por esta edição.
          </div>
        ) : null}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-medium btn-ghost">Cancelar</button>
          <button onClick={submit} className="btn-primary px-4 py-2 rounded-lg text-[13px] font-medium">{recurring && !isEditing ? "Criar lançamentos" : "Salvar lançamento"}</button>
        </div>
      </div>
    </Modal>
  );
}

/* =========================================================================
   TAB: PARCELAS & RECORRÊNCIAS
   ========================================================================= */
function EndRecurrenceModal({ group, onClose, onConfirm }) {
  const nextOpenMonth = group.entries.find((e) => !e.paid)?.month ?? group.entries[group.entries.length - 1].month;
  const [fromMonth, setFromMonth] = useState(nextOpenMonth);
  return (
    <Modal title="Encerrar recorrência" onClose={onClose}>
      <div className="space-y-3.5">
        <div className="flex items-start gap-2.5">
          <div style={{ background: RUST_SOFT, borderRadius: 999, padding: 10, flexShrink: 0 }}><Ban size={16} color={RUST} /></div>
          <p className="text-[13px]" style={{ color: INK }}>
            Isso remove as ocorrências futuras e ainda não pagas de <b>{group.description}</b> a partir do mês escolhido. Lançamentos já pagos são mantidos no histórico.
          </p>
        </div>
        <Field label="Encerrar a partir de">
          <select value={fromMonth} onChange={(e) => setFromMonth(Number(e.target.value))} className={inputCls} style={inputStyle}>
            {MONTHS_FULL.map((m, i) => <option key={m} value={i} disabled={i < nextOpenMonth}>{m}</option>)}
          </select>
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-medium btn-ghost">Cancelar</button>
          <button onClick={() => { onConfirm(fromMonth); onClose(); }} className="px-4 py-2 rounded-lg text-[13px] font-medium text-white" style={{ background: RUST }}>Encerrar recorrência</button>
        </div>
      </div>
    </Modal>
  );
}

function ChangeAmountModal({ group, onClose, onConfirm }) {
  const nextOpenMonth = group.entries.find((e) => !e.paid)?.month ?? group.entries[group.entries.length - 1].month;
  const [fromMonth, setFromMonth] = useState(nextOpenMonth);
  const [amount, setAmount] = useState(group.entries[group.entries.length - 1]?.amount ?? "");
  return (
    <Modal title="Alterar valor da recorrência" onClose={onClose}>
      <div className="space-y-3.5">
        <p className="text-[13px]" style={{ color: SLATE }}>Aplica um novo valor a <b style={{ color: INK }}>{group.description}</b> em diante, sem alterar ocorrências já pagas.</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="A partir de">
            <select value={fromMonth} onChange={(e) => setFromMonth(Number(e.target.value))} className={inputCls} style={inputStyle}>
              {MONTHS_FULL.map((m, i) => <option key={m} value={i} disabled={i < nextOpenMonth}>{m}</option>)}
            </select>
          </Field>
          <Field label="Novo valor (R$)"><input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} style={inputStyle} /></Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-medium btn-ghost">Cancelar</button>
          <button onClick={() => { if (amount) { onConfirm(fromMonth, parseFloat(amount)); onClose(); } }} className="btn-primary px-4 py-2 rounded-lg text-[13px] font-medium">Aplicar novo valor</button>
        </div>
      </div>
    </Modal>
  );
}

function InstallmentGroupCard({ group, catById, subById, togglePaid, expanded, onToggleExpand, setTab, setSelectedMonth }) {
  const pct = Math.min(100, (group.paidCount / group.installmentTotal) * 100);
  return (
    <div className="ledger-card" style={{ background: PAPER }}>
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13.5px] font-semibold truncate">{group.description}</span>
            <span className="text-[10.5px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: group.completed ? SAGE_SOFT : GOLD_SOFT, color: group.completed ? SAGE : "#8C6A1B" }}>
              {group.completed ? "Concluído" : "Ativo"}
            </span>
          </div>
          <div className="text-[11.5px] mt-0.5" style={{ color: SLATE }}>
            {catById(group.categoryId)?.name} › {subById(group.categoryId, group.subId)?.name}
            {(group.cardId || group.vehicleId) && ` · ${group.cardId ? "cartão vinculado" : "veículo vinculado"}`}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-[15px] font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace", color: group.type === "income" ? SAGE : RUST }}>{brl(group.unitAmount)}<span className="text-[11px] font-normal" style={{ color: SLATE }}>/mês</span></div>
          <div className="text-[11px]" style={{ color: SLATE }}>total {brl(group.totalValue)}</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11.5px] mb-1" style={{ color: SLATE }}>
        <span>{group.paidCount} de {group.installmentTotal} parcelas pagas</span>
        <span>restam {brl(group.remaining * group.unitAmount)}</span>
      </div>
      <div className="h-1.5 rounded-full mb-3" style={{ background: "#EEE7D4" }}><div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: group.completed ? SAGE : GOLD }} /></div>

      <button onClick={onToggleExpand} className="flex items-center gap-1 text-[12px] font-medium" style={{ color: SAGE }}>
        {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />} {expanded ? "Ocultar parcelas" : "Ver todas as parcelas"}
      </button>

      {expanded && (
        <div className="mt-2.5 space-y-1 max-h-56 overflow-y-auto pr-1">
          {group.entries.map((e) => {
            const status = paymentStatus(e);
            const meta = (e.type === "income" ? STATUS_META_INCOME : STATUS_META)[status];
            return (
              <div key={e.id} className="flex items-center justify-between px-2.5 py-1.5 rounded-md text-[12px]" style={{ background: "#FBF8F1" }}>
                <div className="flex items-center gap-2">
                  <span className="font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{e.installmentNumber}/{e.installmentTotal}</span>
                  <span style={{ color: SLATE }}>{MONTHS_FULL[e.month]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{brl(e.amount)}</span>
                  <StatusChip t={e} onClick={() => togglePaid(e.id)} />
                  <button onClick={() => { setTab("lancamentos"); setSelectedMonth(e.month); }} className="p-1 rounded-md btn-ghost" title="Ver no mês"><Calendar size={12} color={SLATE} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function IndefiniteGroupCard({ group, catById, subById, togglePaid, onEnd, onChangeAmount, setTab, setSelectedMonth }) {
  const active = group.lastMonth === 11;
  return (
    <div className="ledger-card" style={{ background: PAPER }}>
      <div className="flex items-start justify-between gap-3 mb-2.5 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <InfinityIcon size={14} color={active ? SAGE : SLATE} />
            <span className="text-[13.5px] font-semibold truncate">{group.description}</span>
            <span className="text-[10.5px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: active ? SAGE_SOFT : "#EFEBE0", color: active ? SAGE : SLATE }}>
              {active ? "Ativa" : `Encerrada em ${MONTHS_FULL[group.lastMonth]}`}
            </span>
          </div>
          <div className="text-[11.5px] mt-0.5" style={{ color: SLATE }}>
            {catById(group.categoryId)?.name} › {subById(group.categoryId, group.subId)?.name} · desde {MONTHS_FULL[group.startMonth]}
            {(group.cardId || group.vehicleId) && ` · ${group.cardId ? "cartão vinculado" : "veículo vinculado"}`}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-[15px] font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace", color: group.type === "income" ? SAGE : RUST }}>{brl(group.currentAmount)}<span className="text-[11px] font-normal" style={{ color: SLATE }}>/mês</span></div>
          <div className="text-[11px]" style={{ color: SLATE }}>{group.paidCount} ocorrências já {group.type === "income" ? "recebidas" : "pagas"}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {group.entries.map((e) => (
          <button key={e.id} onClick={() => togglePaid(e.id)} title={`${MONTHS[e.month]} · ${brl(e.amount)}`}
            className="w-8 h-8 rounded-md flex items-center justify-center text-[10px] font-semibold"
            style={{ background: (e.type === "income" ? STATUS_META_INCOME : STATUS_META)[paymentStatus(e)].bg, color: (e.type === "income" ? STATUS_META_INCOME : STATUS_META)[paymentStatus(e)].color }}>
            {MONTHS[e.month]}
          </button>
        ))}
      </div>

      {active ? (
        <div className="flex flex-wrap gap-2">
          <button onClick={onChangeAmount} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium btn-ghost" style={{ border: `1px solid ${LINE}`, color: SAGE }}><Pencil size={12.5} /> Alterar valor dali pra frente</button>
          <button onClick={onEnd} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium btn-ghost" style={{ border: `1px solid ${LINE}`, color: RUST }}><Ban size={12.5} /> Encerrar recorrência</button>
        </div>
      ) : (
        <div className="text-[11.5px]" style={{ color: SLATE }}>Recorrência encerrada — nenhuma ação disponível.</div>
      )}
    </div>
  );
}

function RecorrenciasTab({ transactions, catById, subById, cards, vehicles, togglePaid, endRecurrence, changeRecurrenceAmount, setTab, setSelectedMonth, currentYear }) {
  const [section, setSection] = useState("parcelamentos");
  const [installmentFilter, setInstallmentFilter] = useState("active");
  const [expandedGroups, setExpandedGroups] = useState({});
  const [endModalGroup, setEndModalGroup] = useState(null);
  const [amountModalGroup, setAmountModalGroup] = useState(null);

  const [nameQuery, setNameQuery] = useState("");
  const [monthFilter, setMonthFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const availableYears = [currentYear];
  const hasActiveFilters = nameQuery.trim() || monthFilter !== "all" || yearFilter !== "all";
  const clearFilters = () => { setNameQuery(""); setMonthFilter("all"); setYearFilter("all"); };

  const matchesFilters = useCallback((g) => {
    if (nameQuery.trim() && !g.description.toLowerCase().includes(nameQuery.trim().toLowerCase())) return false;
    if (monthFilter !== "all" && !g.entries.some((e) => e.month === Number(monthFilter))) return false;
    if (yearFilter !== "all" && Number(yearFilter) !== currentYear) return false;
    return true;
  }, [nameQuery, monthFilter, yearFilter]);

  const installmentGroups = useMemo(() => {
    const map = {};
    transactions.filter((t) => t.installmentTotal).forEach((t) => {
      const key = t.recurringGroupId || t.id;
      if (!map[key]) map[key] = { groupId: key, description: t.description, categoryId: t.categoryId, subId: t.subId, type: t.type, installmentTotal: t.installmentTotal, cardId: t.cardId, vehicleId: t.vehicleId, entries: [] };
      map[key].entries.push(t);
    });
    return Object.values(map).map((g) => {
      g.entries.sort((a, b) => a.installmentNumber - b.installmentNumber);
      g.paidCount = g.entries.filter((e) => e.paid).length;
      g.unitAmount = g.entries[0]?.amount || 0;
      g.totalValue = g.installmentTotal * g.unitAmount;
      g.remaining = g.installmentTotal - g.paidCount;
      g.completed = g.paidCount >= g.installmentTotal;
      return g;
    }).sort((a, b) => (a.completed === b.completed ? a.description.localeCompare(b.description) : a.completed - b.completed));
  }, [transactions]);

  const indefiniteGroups = useMemo(() => {
    const map = {};
    transactions.filter((t) => t.recurringGroupId && t.indefiniteRecurring).forEach((t) => {
      const key = t.recurringGroupId;
      if (!map[key]) map[key] = { groupId: key, description: t.description, categoryId: t.categoryId, subId: t.subId, type: t.type, cardId: t.cardId, vehicleId: t.vehicleId, entries: [] };
      map[key].entries.push(t);
    });
    return Object.values(map).map((g) => {
      g.entries.sort((a, b) => a.month - b.month);
      g.currentAmount = g.entries[g.entries.length - 1]?.amount;
      g.startMonth = g.entries[0]?.month;
      g.lastMonth = g.entries[g.entries.length - 1]?.month;
      g.paidCount = g.entries.filter((e) => e.paid).length;
      return g;
    }).sort((a, b) => (a.lastMonth === 11) === (b.lastMonth === 11) ? 0 : a.lastMonth === 11 ? -1 : 1);
  }, [transactions]);

  const visibleInstallments = installmentGroups
    .filter((g) => installmentFilter === "all" || (installmentFilter === "active" ? !g.completed : g.completed))
    .filter(matchesFilters);
  const visibleIndefinite = indefiniteGroups.filter(matchesFilters);

  return (
    <div className="fade-up">
      <header className="mb-5">
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 600 }}>Parcelas & Recorrências</h1>
        <p className="text-[13px] mt-1" style={{ color: SLATE }}>Acompanhe parcelamentos em andamento e gerencie assinaturas ou mensalidades recorrentes.</p>
      </header>

      <div className="flex rounded-lg overflow-hidden mb-4 w-fit" style={{ border: `1px solid ${LINE}` }}>
        <button onClick={() => setSection("parcelamentos")} className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium" style={{ background: section === "parcelamentos" ? INK : PAPER, color: section === "parcelamentos" ? "#fff" : INK }}><ListOrdered size={14} /> Parcelamentos</button>
        <button onClick={() => setSection("indefinidas")} className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium" style={{ background: section === "indefinidas" ? INK : PAPER, color: section === "indefinidas" ? "#fff" : INK }}><InfinityIcon size={14} /> Recorrências indefinidas</button>
      </div>

      <div className="ledger-card mb-5 flex flex-wrap items-end gap-3" style={{ background: PAPER, padding: 14 }}>
        <Field label="Buscar por nome">
          <div className="relative">
            <Search size={13.5} color={SLATE} className="absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input value={nameQuery} onChange={(e) => setNameQuery(e.target.value)} placeholder="Ex.: Spurs Car, Plano de Saúde…" className={inputCls} style={{ ...inputStyle, paddingLeft: 30, width: 220 }} />
          </div>
        </Field>
        <Field label="Mês">
          <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className={inputCls} style={{ ...inputStyle, width: 140 }}>
            <option value="all">Todos os meses</option>
            {MONTHS_FULL.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
        </Field>
        <Field label="Ano">
          <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className={inputCls} style={{ ...inputStyle, width: 110 }}>
            <option value="all">Todos</option>
            {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </Field>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 px-2.5 py-2 rounded-md text-[12.5px] font-medium btn-ghost" style={{ color: RUST }}><X size={13} /> Limpar filtros</button>
        )}
      </div>

      {section === "parcelamentos" ? (
        <>
          <div className="flex gap-1.5 mb-4">
            {[["active", "Ativos"], ["completed", "Concluídos"], ["all", "Todos"]].map(([k, l]) => (
              <button key={k} onClick={() => setInstallmentFilter(k)} className="px-2.5 py-1 rounded-md text-[12px] font-medium" style={{ background: installmentFilter === k ? SAGE_SOFT : "transparent", color: installmentFilter === k ? SAGE : SLATE }}>{l}</button>
            ))}
          </div>
          {visibleInstallments.length === 0 ? (
            <EmptyState icon={ListOrdered} title={hasActiveFilters ? "Nenhum resultado para os filtros" : "Nenhum parcelamento aqui"} desc={hasActiveFilters ? "Tente ajustar o nome, mês ou ano pesquisados." : "Crie um lançamento marcado como recorrente e escolha 'Parcelado' para vê-lo aqui."} />
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {visibleInstallments.map((g) => (
                <InstallmentGroupCard key={g.groupId} group={g} catById={catById} subById={subById} togglePaid={togglePaid}
                  expanded={!!expandedGroups[g.groupId]} onToggleExpand={() => setExpandedGroups((s) => ({ ...s, [g.groupId]: !s[g.groupId] }))}
                  setTab={setTab} setSelectedMonth={setSelectedMonth} />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {visibleIndefinite.length === 0 ? (
            <EmptyState icon={InfinityIcon} title={hasActiveFilters ? "Nenhum resultado para os filtros" : "Nenhuma recorrência indefinida"} desc={hasActiveFilters ? "Tente ajustar o nome, mês ou ano pesquisados." : "Crie um lançamento fixo mensal com 'Sem data de término' para gerenciá-lo aqui."} />
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {visibleIndefinite.map((g) => (
                <IndefiniteGroupCard key={g.groupId} group={g} catById={catById} subById={subById} togglePaid={togglePaid}
                  onEnd={() => setEndModalGroup(g)} onChangeAmount={() => setAmountModalGroup(g)}
                  setTab={setTab} setSelectedMonth={setSelectedMonth} />
              ))}
            </div>
          )}
        </>
      )}

      {endModalGroup && <EndRecurrenceModal group={endModalGroup} onClose={() => setEndModalGroup(null)} onConfirm={(fromMonth) => endRecurrence(endModalGroup.groupId, fromMonth)} />}
      {amountModalGroup && <ChangeAmountModal group={amountModalGroup} onClose={() => setAmountModalGroup(null)} onConfirm={(fromMonth, amount) => changeRecurrenceAmount(amountModalGroup.groupId, fromMonth, amount)} />}
    </div>
  );
}
function CategoryColumn({ title, type, list, addCategory, deleteCategory, addSubcategory, deleteSubcategory }) {
  const [newCat, setNewCat] = useState("");
  const [expanded, setExpanded] = useState({});
  const [newSub, setNewSub] = useState({});

  return (
    <div className="ledger-card" style={{ background: PAPER }}>
      <h3 className="text-[13.5px] font-semibold mb-3">{title}</h3>
      <div className="space-y-1.5 mb-3">
        {list.map((c) => (
          <div key={c.id} className="rounded-lg" style={{ border: `1px solid ${LINE}` }}>
            <div className="flex items-center justify-between px-3 py-2 cursor-pointer" onClick={() => setExpanded((e) => ({ ...e, [c.id]: !e[c.id] }))}>
              <div className="flex items-center gap-2">
                {expanded[c.id] ? <ChevronDown size={14} color={SLATE} /> : <ChevronRight size={14} color={SLATE} />}
                <span style={{ width: 9, height: 9, borderRadius: 3, background: c.color }} />
                <span className="text-[12.5px] font-medium">{c.name}</span>
                <span className="text-[10.5px] px-1.5 py-0.5 rounded-full" style={{ background: "#EEE7D4", color: SLATE }}>{c.subs.length}</span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); deleteCategory(type, c.id); }} className="p-1 rounded-md btn-ghost"><Trash2 size={12.5} color={RUST} /></button>
            </div>
            {expanded[c.id] && (
              <div className="px-3 pb-2.5 pt-0.5" style={{ borderTop: `1px solid ${LINE}` }}>
                {c.subs.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-1 text-[12px]" style={{ color: SLATE }}>
                    <span>{s.name}</span>
                    <button onClick={() => deleteSubcategory(type, c.id, s.id)}><X size={12} color={SLATE} /></button>
                  </div>
                ))}
                <div className="flex gap-1.5 mt-1.5">
                  <input value={newSub[c.id] || ""} onChange={(e) => setNewSub((s) => ({ ...s, [c.id]: e.target.value }))} placeholder="Nova subcategoria" className="flex-1 px-2 py-1 text-[12px] rounded-md" style={inputStyle}
                    onKeyDown={(e) => { if (e.key === "Enter" && newSub[c.id]?.trim()) { addSubcategory(type, c.id, newSub[c.id].trim()); setNewSub((s) => ({ ...s, [c.id]: "" })); } }} />
                  <button onClick={() => { if (newSub[c.id]?.trim()) { addSubcategory(type, c.id, newSub[c.id].trim()); setNewSub((s) => ({ ...s, [c.id]: "" })); } }} className="px-2 rounded-md btn-ghost"><Plus size={13} color={SAGE} /></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-1.5">
        <input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder={`Nova categoria de ${type === "income" ? "receita" : "despesa"}`} className={inputCls} style={inputStyle}
          onKeyDown={(e) => { if (e.key === "Enter" && newCat.trim()) { addCategory(type, newCat.trim()); setNewCat(""); } }} />
        <button onClick={() => { if (newCat.trim()) { addCategory(type, newCat.trim()); setNewCat(""); } }} className="btn-primary px-3 rounded-md"><Plus size={14} /></button>
      </div>
    </div>
  );
}

function CategoriasTab({ categories, addCategory, deleteCategory, addSubcategory, deleteSubcategory, cards, addCard, updateCard, deleteCard, vehicles, addVehicle, updateVehicle, deleteVehicle, cardInvoice, selectedMonth }) {
  const [cardModal, setCardModal] = useState(null);
  const [vehicleModal, setVehicleModal] = useState(null);

  return (
    <div className="fade-up">
      <header className="mb-6">
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 600 }}>Categorias & Módulos</h1>
        <p className="text-[13px] mt-1" style={{ color: SLATE }}>Organize categorias, subcategorias, cartões de crédito e financiamentos de veículos.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <CategoryColumn title="Despesas" type="expense" list={categories.expense} addCategory={addCategory} deleteCategory={deleteCategory} addSubcategory={addSubcategory} deleteSubcategory={deleteSubcategory} />
        <CategoryColumn title="Receitas" type="income" list={categories.income} addCategory={addCategory} deleteCategory={deleteCategory} addSubcategory={addSubcategory} deleteSubcategory={deleteSubcategory} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="ledger-card" style={{ background: PAPER }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><CreditCard size={15} color={GOLD} /><h3 className="text-[13.5px] font-semibold">Cartões de Crédito</h3></div>
            <button onClick={() => setCardModal({})} className="flex items-center gap-1 text-[12px] font-medium px-2.5 py-1.5 rounded-md btn-ghost" style={{ color: SAGE }}><Plus size={13} /> Adicionar</button>
          </div>
          <div className="space-y-2">
            {cards.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg" style={{ border: `1px solid ${LINE}` }}>
                <div className="flex items-center gap-2.5">
                  <span style={{ width: 10, height: 10, borderRadius: 99, background: c.color }} />
                  <div>
                    <div className="text-[12.5px] font-medium">{c.name}</div>
                    <div className="text-[11px]" style={{ color: SLATE }}>Fecha dia {c.closingDay} · vence dia {c.dueDay} · limite {brl(c.limit)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[12px]" style={{ fontFamily: "'JetBrains Mono', monospace", color: RUST }}>{brl(cardInvoice(c.id, selectedMonth))}</span>
                  <button onClick={() => setCardModal(c)} className="p-1 rounded-md btn-ghost"><Pencil size={12.5} color={SLATE} /></button>
                  <button onClick={() => deleteCard(c.id)} className="p-1 rounded-md btn-ghost"><Trash2 size={12.5} color={RUST} /></button>
                </div>
              </div>
            ))}
            {!cards.length && <EmptyState icon={CreditCard} title="Nenhum cartão cadastrado" desc="Adicione um cartão para acompanhar faturas mensais." />}
          </div>
        </div>

        <div className="ledger-card" style={{ background: PAPER }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><Car size={15} color={SAGE} /><h3 className="text-[13.5px] font-semibold">Veículos & Financiamentos</h3></div>
            <button onClick={() => setVehicleModal({})} className="flex items-center gap-1 text-[12px] font-medium px-2.5 py-1.5 rounded-md btn-ghost" style={{ color: SAGE }}><Plus size={13} /> Adicionar</button>
          </div>
          <div className="space-y-2">
            {vehicles.map((v) => (
              <div key={v.id} className="px-3 py-2.5 rounded-lg" style={{ border: `1px solid ${LINE}` }}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="text-[12.5px] font-medium">{v.name}</div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setVehicleModal(v)} className="p-1 rounded-md btn-ghost"><Pencil size={12.5} color={SLATE} /></button>
                    <button onClick={() => deleteVehicle(v.id)} className="p-1 rounded-md btn-ghost"><Trash2 size={12.5} color={RUST} /></button>
                  </div>
                </div>
                <div className="text-[11px] mb-1.5" style={{ color: SLATE }}>{v.paidInstallments}/{v.totalInstallments} parcelas de {brl(v.installmentValue)} · valor total {brl(v.totalValue)}</div>
                <div className="h-1.5 rounded-full" style={{ background: "#EEE7D4" }}><div className="h-1.5 rounded-full" style={{ width: `${(v.paidInstallments / v.totalInstallments) * 100}%`, background: SAGE }} /></div>
              </div>
            ))}
            {!vehicles.length && <EmptyState icon={Car} title="Nenhum veículo cadastrado" desc="Adicione o Spurs Car ou outro financiamento para acompanhar." />}
          </div>
        </div>
      </div>

      {cardModal && <CardModal initial={cardModal.id ? cardModal : null} onClose={() => setCardModal(null)} onSave={(data) => { cardModal.id ? updateCard(cardModal.id, data) : addCard(data); setCardModal(null); }} />}
      {vehicleModal && <VehicleModal initial={vehicleModal.id ? vehicleModal : null} onClose={() => setVehicleModal(null)} onSave={(data) => { vehicleModal.id ? updateVehicle(vehicleModal.id, data) : addVehicle(data); setVehicleModal(null); }} />}
    </div>
  );
}

function CardModal({ initial, onClose, onSave }) {
  const [name, setName] = useState(initial?.name || "");
  const [limit, setLimit] = useState(initial?.limit ?? "");
  const [closingDay, setClosingDay] = useState(initial?.closingDay ?? 5);
  const [dueDay, setDueDay] = useState(initial?.dueDay ?? 12);
  const [color, setColor] = useState(initial?.color || "#3D6B5C");
  return (
    <Modal title={initial ? "Editar cartão" : "Novo cartão"} onClose={onClose}>
      <div className="space-y-3.5">
        <Field label="Nome do cartão"><input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} style={inputStyle} placeholder="Ex.: Nubank" /></Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Limite (R$)"><input type="number" value={limit} onChange={(e) => setLimit(e.target.value)} className={inputCls} style={inputStyle} /></Field>
          <Field label="Fechamento"><input type="number" min="1" max="31" value={closingDay} onChange={(e) => setClosingDay(e.target.value)} className={inputCls} style={inputStyle} /></Field>
          <Field label="Vencimento"><input type="number" min="1" max="31" value={dueDay} onChange={(e) => setDueDay(e.target.value)} className={inputCls} style={inputStyle} /></Field>
        </div>
        <Field label="Cor"><input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-16 h-9 rounded-md" style={{ border: `1px solid ${LINE}` }} /></Field>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-medium btn-ghost">Cancelar</button>
          <button onClick={() => name.trim() && onSave({ name: name.trim(), limit: parseFloat(limit) || 0, closingDay: Number(closingDay), dueDay: Number(dueDay), color })} className="btn-primary px-4 py-2 rounded-lg text-[13px] font-medium">Salvar cartão</button>
        </div>
      </div>
    </Modal>
  );
}

function VehicleModal({ initial, onClose, onSave }) {
  const [name, setName] = useState(initial?.name || "");
  const [totalValue, setTotalValue] = useState(initial?.totalValue ?? "");
  const [totalInstallments, setTotalInstallments] = useState(initial?.totalInstallments ?? 48);
  const [installmentValue, setInstallmentValue] = useState(initial?.installmentValue ?? "");
  const [paidInstallments, setPaidInstallments] = useState(initial?.paidInstallments ?? 0);
  return (
    <Modal title={initial ? "Editar financiamento" : "Novo financiamento"} onClose={onClose}>
      <div className="space-y-3.5">
        <Field label="Nome do veículo"><input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} style={inputStyle} placeholder="Ex.: Spurs Car" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Valor total (R$)"><input type="number" value={totalValue} onChange={(e) => setTotalValue(e.target.value)} className={inputCls} style={inputStyle} /></Field>
          <Field label="Valor da parcela (R$)"><input type="number" value={installmentValue} onChange={(e) => setInstallmentValue(e.target.value)} className={inputCls} style={inputStyle} /></Field>
          <Field label="Total de parcelas"><input type="number" value={totalInstallments} onChange={(e) => setTotalInstallments(e.target.value)} className={inputCls} style={inputStyle} /></Field>
          <Field label="Parcelas já pagas"><input type="number" value={paidInstallments} onChange={(e) => setPaidInstallments(e.target.value)} className={inputCls} style={inputStyle} /></Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-medium btn-ghost">Cancelar</button>
          <button onClick={() => name.trim() && onSave({ name: name.trim(), totalValue: parseFloat(totalValue) || 0, totalInstallments: Number(totalInstallments), installmentValue: parseFloat(installmentValue) || 0, paidInstallments: Number(paidInstallments), startMonth: 0 })} className="btn-primary px-4 py-2 rounded-lg text-[13px] font-medium">Salvar</button>
        </div>
      </div>
    </Modal>
  );
}

/* =========================================================================
   TAB: CONEXÃO GOOGLE SHEETS
   ========================================================================= */
function ConexaoTab({ sheetConfig, setSheetConfig, importFromSheet, importFromPastedCsv, exportCsv, syncWithSheet, resetAllTransactions, transactionCount }) {
  const [pasteText, setPasteText] = useState("");
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [syncing, setSyncing] = useState(false);

  const appsScript = `function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Lancamentos");
  const rows = sheet.getDataRange().getValues();
  const headers = rows.shift();
  const data = rows.map(r => Object.fromEntries(headers.map((h, i) => [h, r[i]])));
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Lancamentos");
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const idCol = headers.indexOf("ID");
  const body = JSON.parse(e.postData.contents);
  const items = Array.isArray(body) ? body : [body];

  const toDelete = items.filter(item => item._delete);
  const toUpsert = items.filter(item => !item._delete);

  // Upserts primeiro (atualiza se o ID já existe, senão adiciona no final)
  toUpsert.forEach(item => {
    const rowValues = headers.map(h => item[h] ?? "");
    const data = sheet.getDataRange().getValues();
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][idCol] === item.ID) { rowIndex = i; break; }
    }
    if (rowIndex >= 0) sheet.getRange(rowIndex + 1, 1, 1, headers.length).setValues([rowValues]);
    else sheet.appendRow(rowValues);
  });

  // Exclusões — de baixo para cima, para não bagunçar os índices das linhas
  if (toDelete.length) {
    const idsToDelete = toDelete.map(item => item.ID);
    const data = sheet.getDataRange().getValues();
    for (let i = data.length - 1; i >= 1; i--) {
      if (idsToDelete.includes(data[i][idCol])) sheet.deleteRow(i + 1);
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ ok: true, upserted: toUpsert.length, deleted: toDelete.length }))
    .setMimeType(ContentService.MimeType.JSON);
}`;

  const handleSync = async () => {
    setSyncing(true);
    try { await syncWithSheet(); } finally { setSyncing(false); }
  };

  return (
    <div className="fade-up max-w-3xl">
      <header className="mb-6">
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 600 }}>Conexão com Google Sheets</h1>
        <p className="text-[13px] mt-1" style={{ color: SLATE }}>Use sua planilha como base de dados — importe, exporte ou mantenha os dois lados sincronizados.</p>
      </header>

      <div className="ledger-card mb-4" style={{ background: SAGE_SOFT, border: `1px solid #C7DBD0` }}>
        <div className="flex items-center gap-2 mb-2"><RefreshCw size={15} color={SAGE} /><h3 className="text-[13.5px] font-semibold" style={{ color: SAGE }}>Sincronização bidirecional (recomendado)</h3></div>
        <p className="text-[12.5px] mb-3" style={{ color: INK }}>
          Depois de configurar a URL abaixo, <b>todo lançamento que você criar, editar, marcar como pago ou excluir é enviado automaticamente para a planilha</b> — não precisa clicar em nada. O botão "Sincronizar agora" serve para o primeiro alinhamento (buscar o que já estava na planilha e mandar pra lá o que já existia aqui) ou para forçar uma nova sincronização manual quando quiser. Requer publicar o Apps Script Web App (passo 4, abaixo) uma única vez — atenção: use a URL que <b>termina em <code className="px-1 rounded" style={{ background: "#fff" }}>/exec</code></b>, não o link de CSV do passo 1.
        </p>
        <Field label="URL do Apps Script Web App">
          <input value={sheetConfig.appsScriptUrl} onChange={(e) => setSheetConfig((s) => ({ ...s, appsScriptUrl: e.target.value }))} placeholder="https://script.google.com/macros/s/SEU_DEPLOY_ID/exec" className={inputCls} style={inputStyle} />
        </Field>
        <div className="flex items-center gap-2 mt-3">
          <button onClick={handleSync} disabled={syncing} className="btn-primary flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium disabled:opacity-50">
            <RefreshCw size={14} className={syncing ? "animate-spin" : ""} /> {syncing ? "Sincronizando…" : "Sincronizar agora"}
          </button>
          {sheetConfig.lastSync && <span className="text-[11.5px]" style={{ color: SLATE }}>Última sincronização: {new Date(sheetConfig.lastSync).toLocaleString("pt-BR")}</span>}
        </div>
      </div>

      <div className="ledger-card mb-4" style={{ background: PAPER }}>
        <div className="flex items-center gap-2 mb-3"><Link2 size={15} color={SAGE} /><h3 className="text-[13.5px] font-semibold">1. Importação simples via CSV publicado (só leitura)</h3></div>
        <Field label="URL de publicação CSV (Arquivo → Compartilhar → Publicar na Web → formato CSV)">
          <input value={sheetConfig.url} onChange={(e) => setSheetConfig((s) => ({ ...s, url: e.target.value }))} placeholder="https://docs.google.com/spreadsheets/d/SEU_ID/pub?gid=0&single=true&output=csv" className={inputCls} style={inputStyle} />
        </Field>
        <p className="text-[11.5px] mt-1.5" style={{ color: SLATE }}>Isso <b>substitui</b> os lançamentos daqui pelo conteúdo da planilha — bom para a primeira carga de dados. Não envia nada de volta (use a sincronização bidirecional acima para isso).</p>
        <div className="flex items-center gap-2 mt-3">
          <button onClick={importFromSheet} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium btn-ghost" style={{ border: `1px solid ${LINE}` }}><Upload size={14} /> Importar (substituir)</button>
          <button onClick={exportCsv} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium btn-ghost" style={{ border: `1px solid ${LINE}` }}><Download size={14} /> Exportar lançamentos (.csv)</button>
        </div>
        {sheetConfig.status !== "idle" && (
          <div className="flex items-start gap-2 mt-3 px-3 py-2.5 rounded-lg text-[12.5px]" style={{
            background: sheetConfig.status === "error" ? RUST_SOFT : sheetConfig.status === "success" ? SAGE_SOFT : GOLD_SOFT,
            color: sheetConfig.status === "error" ? RUST : sheetConfig.status === "success" ? SAGE : "#8C6A1B",
          }}>
            {sheetConfig.status === "success" ? <Check size={14} className="mt-0.5" /> : <AlertCircle size={14} className="mt-0.5" />}
            <span>{sheetConfig.message}</span>
          </div>
        )}
      </div>

      <div className="ledger-card mb-4" style={{ background: PAPER }}>
        <h3 className="text-[13.5px] font-semibold mb-3">2. Como publicar sua planilha (2 minutos)</h3>
        <ol className="space-y-2 text-[12.5px]" style={{ color: SLATE }}>
          <li><b style={{ color: INK }}>1.</b> Na sua planilha, crie uma aba chamada <code className="px-1 rounded" style={{ background: GOLD_SOFT }}>Lancamentos</code> com colunas: ID, Mes, Tipo, Categoria, Subcategoria, Descricao, Valor, Cartao, Veiculo, Pago, Vencimento.</li>
          <li><b style={{ color: INK }}>2.</b> Vá em <b>Arquivo → Compartilhar → Publicar na Web</b> (não confunda com o botão "Compartilhar" comum — são telas diferentes).</li>
          <li><b style={{ color: INK }}>3.</b> No menu do meio, troque "Documento inteiro" pela aba <code className="px-1 rounded" style={{ background: GOLD_SOFT }}>Lancamentos</code> especificamente, e no menu da direita escolha o formato <b>CSV</b>, depois clique em Publicar.</li>
          <li><b style={{ color: INK }}>4.</b> Copie o link gerado e cole no campo do passo 1. Confira se o número depois de <code className="px-1 rounded" style={{ background: GOLD_SOFT }}>gid=</code> corresponde à aba certa.</li>
        </ol>
      </div>

      <div className="ledger-card mb-4" style={{ background: PAPER }}>
        <div className="flex items-center gap-2 mb-1"><ClipboardPaste size={15} color={GOLD} /><h3 className="text-[13.5px] font-semibold">3. Alternativa: colar o CSV manualmente</h3></div>
        <p className="text-[12.5px] mb-3" style={{ color: SLATE }}>
          Se a importação automática acima falhar (é comum o navegador bloquear a busca direta a domínios do Google por CORS), abra o link publicado em outra aba, selecione tudo (<b>Ctrl/Cmd+A</b>), copie e cole o conteúdo aqui embaixo. Este caminho não depende de rede e sempre funciona.
        </p>
        <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} rows={6} placeholder="ID,Mes,Tipo,Categoria,Subcategoria,Descricao,Valor,Cartao,Veiculo,Pago,Vencimento&#10;abc123,Jan,Despesa,moradia,aluguel,Aluguel,2600,,,Sim,5"
          className={inputCls} style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, resize: "vertical" }} />
        <div className="flex items-center gap-2 mt-3">
          <button onClick={() => importFromPastedCsv(pasteText)} disabled={!pasteText.trim()} className="btn-primary flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium disabled:opacity-40"><ClipboardPaste size={14} /> Importar do texto colado</button>
        </div>
      </div>

      <div className="ledger-card mb-4" style={{ background: PAPER }}>
        <div className="flex items-center gap-2 mb-2"><Settings2 size={15} color={GOLD} /><h3 className="text-[13.5px] font-semibold">4. Publicar o Apps Script Web App (necessário para a sincronização bidirecional)</h3></div>
        <p className="text-[12.5px] mb-3" style={{ color: SLATE }}>
          A publicação em CSV só permite leitura — para <b>gravar</b> lançamentos na planilha, publique este script como Web App na própria planilha. A coluna <b>ID</b> é o que permite ao script atualizar a linha certa em vez de duplicar.
        </p>
        <pre className="text-[11.5px] p-3.5 rounded-lg overflow-x-auto" style={{ background: INK, color: "#D9E4F5", fontFamily: "'JetBrains Mono', monospace" }}>{appsScript}</pre>
        <p className="text-[11.5px] mt-2" style={{ color: SLATE }}>Em <b>Extensões → Apps Script</b>, cole o código, publique como Web App ("Executar como: eu", "Quem pode acessar: qualquer pessoa") e cole a URL gerada no campo de sincronização bidirecional no topo desta página.</p>
      </div>

      <div className="ledger-card" style={{ background: RUST_SOFT, border: "1px solid #E3B6A6" }}>
        <div className="flex items-center gap-2 mb-2"><ShieldAlert size={15} color={RUST} /><h3 className="text-[13.5px] font-semibold" style={{ color: RUST }}>Zona de risco</h3></div>
        <p className="text-[12.5px] mb-3" style={{ color: INK }}>Apaga permanentemente <b>todos os {transactionCount} lançamentos</b> do ano atual (não afeta categorias, cartões, veículos nem anos já arquivados).</p>
        <button onClick={() => { setResetModalOpen(true); setConfirmText(""); }} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium text-white" style={{ background: RUST }}>
          <Eraser size={14} /> Resetar todos os lançamentos
        </button>
      </div>

      {resetModalOpen && (
        <Modal title="Resetar todos os lançamentos" onClose={() => setResetModalOpen(false)}>
          <div className="flex items-start gap-3 mb-4">
            <div style={{ background: RUST_SOFT, borderRadius: 999, padding: 10, flexShrink: 0 }}><ShieldAlert size={18} color={RUST} /></div>
            <p className="text-[13px]" style={{ color: INK }}>
              Isso vai excluir permanentemente <b>todos os {transactionCount} lançamentos</b> do ano atual, em todos os meses. Essa ação não pode ser desfeita.
              Para confirmar, digite <b>RESETAR</b> no campo abaixo.
            </p>
          </div>
          <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="Digite RESETAR para confirmar" className={inputCls} style={inputStyle} />
          <div className="flex justify-end gap-2 pt-4">
            <button onClick={() => setResetModalOpen(false)} className="px-4 py-2 rounded-lg text-[13px] font-medium btn-ghost">Cancelar</button>
            <button onClick={() => { resetAllTransactions(); setResetModalOpen(false); }} disabled={confirmText.trim().toUpperCase() !== "RESETAR"}
              className="px-4 py-2 rounded-lg text-[13px] font-medium text-white disabled:opacity-40" style={{ background: RUST }}>
              Resetar tudo
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* =========================================================================
   TAB: RELATÓRIO ANUAL
   ========================================================================= */
function RelatorioTab({ categories, transactions, yearTotals, catById, currentYear, archivedYears, archiveCurrentYear }) {
  const archivedYearsList = Object.keys(archivedYears).map(Number).sort((a, b) => b - a);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const isViewingCurrent = selectedYear === currentYear;
  const dataset = isViewingCurrent ? transactions : (archivedYears[selectedYear] || []);

  const rows = useMemo(() => {
    const build = (list, type) => list.map((c) => {
      const values = MONTHS.map((_, m) => dataset.filter((t) => t.month === m && t.categoryId === c.id && t.type === type).reduce((s, t) => s + Number(t.amount || 0), 0));
      return { id: c.id, name: c.name, color: c.color, values, total: values.reduce((a, b) => a + b, 0) };
    });
    return { income: build(categories.income, "income"), expense: build(categories.expense, "expense") };
  }, [categories, dataset]);

  const monthlyIncome = MONTHS.map((_, m) => dataset.filter((t) => t.month === m && t.type === "income").reduce((s, t) => s + Number(t.amount || 0), 0));
  const monthlyExpense = MONTHS.map((_, m) => dataset.filter((t) => t.month === m && t.type === "expense").reduce((s, t) => s + Number(t.amount || 0), 0));
  const monthlyBalance = monthlyIncome.map((v, i) => v - monthlyExpense[i]);
  const totals = isViewingCurrent ? yearTotals : {
    income: monthlyIncome.reduce((a, b) => a + b, 0),
    expense: monthlyExpense.reduce((a, b) => a + b, 0),
    balance: monthlyIncome.reduce((a, b) => a + b, 0) - monthlyExpense.reduce((a, b) => a + b, 0),
  };
  const avgSavings = (totals.balance / 12);

  const Row = ({ label, values, total, bold, color }) => (
    <tr style={{ borderBottom: `1px solid ${LINE}` }}>
      <td className="px-3 py-2 sticky left-0" style={{ background: bold ? "#FBF8F1" : PAPER, fontWeight: bold ? 700 : 500, color: color || INK, minWidth: 170 }}>{label}</td>
      {values.map((v, i) => <td key={i} className="px-2.5 py-2 text-right" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: bold ? 700 : 400, color: color || INK }}>{v ? brl(v).replace("R$", "") : "—"}</td>)}
      <td className="px-3 py-2 text-right font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace", background: "#FBF8F1" }}>{brl(total)}</td>
    </tr>
  );

  return (
    <div className="fade-up">
      <header className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 600 }}>Relatório Anual — {selectedYear}</h1>
          <p className="text-[13px] mt-1" style={{ color: SLATE }}>Consolidação mês a mês de todas as categorias, de Janeiro a Dezembro.</p>
        </div>
        <div className="flex items-center gap-2">
          {archivedYearsList.length > 0 && (
            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className={inputCls} style={{ ...inputStyle, width: 160 }}>
              <option value={currentYear}>{currentYear} (ano atual)</option>
              {archivedYearsList.map((y) => <option key={y} value={y}>{y} (arquivado)</option>)}
            </select>
          )}
          {isViewingCurrent && (
            <button onClick={() => { setArchiveModalOpen(true); setConfirmText(""); }} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium btn-ghost" style={{ border: `1px solid ${LINE}`, color: "#8C6A1B" }}>
              <Archive size={14} /> Arquivar {currentYear} e iniciar {currentYear + 1}
            </button>
          )}
        </div>
      </header>

      {!isViewingCurrent && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg mb-5 text-[12.5px]" style={{ background: GOLD_SOFT, color: "#8C6A1B" }}>
          <Archive size={14} /> Você está vendo o histórico arquivado de {selectedYear} — somente leitura.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Receita Anual" value={brl(totals.income)} icon={ArrowUpRight} tone="sage" />
        <KpiCard label="Despesa Anual" value={brl(totals.expense)} icon={ArrowDownRight} tone="rust" />
        <KpiCard label="Saldo Anual" value={brl(totals.balance)} icon={Wallet} tone="ink" />
        <KpiCard label="Economia Média Mensal" value={brl(avgSavings)} icon={PiggyBank} tone="gold" />
      </div>

      <div className="ledger-card mb-6" style={{ background: PAPER }}>
        <div className="flex items-center gap-2 mb-1"><TrendingUp size={15} color={SAGE} /><h3 className="text-[13.5px] font-semibold">Saldo mensal ao longo do ano</h3></div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={MONTHS.map((m, i) => ({ month: m, Saldo: Math.round(monthlyBalance[i]) }))}>
            <CartesianGrid strokeDasharray="3 3" stroke={LINE} vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: SLATE, fontFamily: "Inter" }} axisLine={{ stroke: LINE }} tickLine={false} />
            <YAxis tickFormatter={brlCompact} tick={{ fontSize: 11, fill: SLATE, fontFamily: "Inter" }} axisLine={false} tickLine={false} width={44} />
            <Tooltip formatter={(v) => brl(v)} contentStyle={{ fontFamily: "Inter, sans-serif", fontSize: 12, borderRadius: 8, border: `1px solid ${LINE}` }} />
            <Line type="monotone" dataKey="Saldo" stroke={GOLD} strokeWidth={2.5} dot={{ r: 3, fill: GOLD }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="ledger-card p-0 overflow-hidden" style={{ background: PAPER }}>
        <div className="overflow-x-auto">
          <table className="text-[12px] w-full">
            <thead>
              <tr style={{ borderBottom: `1px solid ${LINE}`, background: "#FBF8F1" }}>
                <th className="text-left px-3 py-2.5 sticky left-0" style={{ background: "#FBF8F1", color: SLATE, minWidth: 170 }}>Categoria</th>
                {MONTHS.map((m) => <th key={m} className="text-right px-2.5 py-2.5 font-semibold" style={{ color: SLATE }}>{m}</th>)}
                <th className="text-right px-3 py-2.5 font-semibold" style={{ color: SLATE }}>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr><td colSpan={14} className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: SAGE, background: SAGE_SOFT }}>Receitas</td></tr>
              {rows.income.map((r) => <Row key={r.id} label={r.name} values={r.values} total={r.total} color={SAGE} />)}
              <Row label="Total de Entradas" values={monthlyIncome} total={totals.income} bold color={SAGE} />

              <tr><td colSpan={14} className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: RUST, background: RUST_SOFT }}>Despesas</td></tr>
              {rows.expense.map((r) => <Row key={r.id} label={r.name} values={r.values} total={r.total} color={RUST} />)}
              <Row label="Total de Saídas" values={monthlyExpense} total={totals.expense} bold color={RUST} />

              <Row label="Saldo Final" values={monthlyBalance} total={totals.balance} bold />
            </tbody>
          </table>
        </div>
      </div>

      {archiveModalOpen && (
        <Modal title={`Arquivar ${currentYear}`} onClose={() => setArchiveModalOpen(false)}>
          <div className="flex items-start gap-3 mb-4">
            <div style={{ background: GOLD_SOFT, borderRadius: 999, padding: 10, flexShrink: 0 }}><Archive size={18} color="#8C6A1B" /></div>
            <p className="text-[13px]" style={{ color: INK }}>
              Isso move todos os lançamentos de <b>{currentYear}</b> para o histórico (você poderá consultá-los depois, só leitura) e libera os 12 meses em branco para <b>{currentYear + 1}</b>. Categorias, cartões e veículos cadastrados continuam os mesmos.
              Para confirmar, digite <b>ARQUIVAR</b> no campo abaixo.
            </p>
          </div>
          <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="Digite ARQUIVAR para confirmar" className={inputCls} style={inputStyle} />
          <div className="flex justify-end gap-2 pt-4">
            <button onClick={() => setArchiveModalOpen(false)} className="px-4 py-2 rounded-lg text-[13px] font-medium btn-ghost">Cancelar</button>
            <button onClick={() => { archiveCurrentYear(); setArchiveModalOpen(false); setSelectedYear(currentYear + 1); }} disabled={confirmText.trim().toUpperCase() !== "ARQUIVAR"}
              className="btn-primary px-4 py-2 rounded-lg text-[13px] font-medium disabled:opacity-40">
              Arquivar {currentYear}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
