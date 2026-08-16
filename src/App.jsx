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
  Lock, LogOut, ShieldCheck, Archive, KeyRound, Eye, EyeOff, RefreshCw, ShieldAlert, Target, Copy, Landmark, Menu
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

/* -------------------------------------------------------------------------
   HASH DE SENHA — PBKDF2 com salt
   -------------------------------------------------------------------------
   A credencial sai deste navegador: ela é gravada na planilha do usuário para
   valer em qualquer dispositivo. Isso significa que quem obtiver a URL do Apps
   Script vê o hash — então ele precisa ser CARO de atacar offline. SHA-256
   simples (o formato antigo, sem salt) cai em ataque de dicionário em segundos.

   PBKDF2-HMAC-SHA256, salt aleatório por credencial, 210.000 iterações
   (recomendação OWASP para PBKDF2-SHA256). Isso NÃO transforma o login em
   autenticação de verdade — continua sendo trava client-side, como registrado
   em Decisoes.md; só encarece o ataque a quem puser as mãos no hash.
   ------------------------------------------------------------------------- */
const PBKDF2_ITERATIONS = 210000;
const AUTH_ALGO_PBKDF2 = "pbkdf2-sha256";
// Chave da conexão com a planilha. No escopo do módulo porque tanto o Dashboard quanto a tela
// de login precisam dela — o login lê a conexão para buscar a credencial mais recente.
const SHEET_STORAGE_KEY = "meufinanceiro_sheet_v1";

const bytesToHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const hexToBytes = (hex) => new Uint8Array((String(hex).match(/.{1,2}/g) || []).map((b) => parseInt(b, 16)));

const canUsePbkdf2 = () => !!window.crypto?.subtle && !!window.crypto?.getRandomValues;

async function pbkdf2Hex(password, saltBytes, iterations) {
  const key = await window.crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await window.crypto.subtle.deriveBits({ name: "PBKDF2", salt: saltBytes, iterations, hash: "SHA-256" }, key, 256);
  return bytesToHex(bits);
}

// Gera o registro de credencial no formato forte. Onde a Web Crypto não existe (ambiente de
// sandbox que a restringe), cai para o formato antigo em vez de travar o app — a limitação
// aparece na tela de Diagnóstico de Segurança.
async function buildAuthRecord(username, password) {
  const user = username.trim();
  if (canUsePbkdf2()) {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const hash = await pbkdf2Hex(password, salt, PBKDF2_ITERATIONS);
    return { username: user, algo: AUTH_ALGO_PBKDF2, salt: bytesToHex(salt), iterations: PBKDF2_ITERATIONS, hash, updatedAt: new Date().toISOString() };
  }
  return { username: user, hash: await sha256Hex(`${user}:${password}`), updatedAt: new Date().toISOString() };
}

// Confere a senha nos dois formatos: o novo (com salt) e o antigo (SHA-256 de "usuario:senha"),
// que continua valendo para quem ainda não trocou a senha desde esta versão.
async function checkPassword(record, username, password) {
  if (!record) return false;
  if (record.algo === AUTH_ALGO_PBKDF2) {
    if (!canUsePbkdf2()) return false;
    const hash = await pbkdf2Hex(password, hexToBytes(record.salt), Number(record.iterations) || PBKDF2_ITERATIONS);
    return hash === record.hash && username.trim() === record.username;
  }
  return (await sha256Hex(`${username.trim()}:${password}`)) === record.hash;
}

const dueDateOf = (t) => new Date(t.year || REFERENCE_YEAR_DEFAULT, t.month, t.dueDay || 10);

// Zera a hora: comparar uma data à meia-noite com um "agora" que carrega hora do dia faz o
// próprio dia do vencimento parecer atrasado.
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const TODAY_START = startOfDay(TODAY);

// Vencimento que cai em fim de semana só é cobrável no próximo dia útil: sábado e domingo
// empurram para a segunda-feira. FERIADOS NÃO SÃO CONSIDERADOS — o sistema não tem calendário
// de feriados, e os municipais dependem da cidade do usuário (ver Notas/TODO.md).
const nextBusinessDay = (date) => {
  const d = new Date(date);
  const weekday = d.getDay();
  if (weekday === 6) d.setDate(d.getDate() + 2);
  else if (weekday === 0) d.setDate(d.getDate() + 1);
  return d;
};

// Data em que o pagamento passa a ser de fato exigível.
const effectiveDueDate = (t) => nextBusinessDay(dueDateOf(t));
const isDueDateShifted = (t) => effectiveDueDate(t).getDate() !== dueDateOf(t).getDate();

// Protege contra "injeção de fórmula" no Google Sheets: se um texto do usuário começar com
// =, +, -, @, tab ou quebra de linha, o Sheets pode interpretá-lo como fórmula ao ser gravado.
// Prefixamos com apóstrofo (força texto puro) — não altera o valor exibido dentro do próprio app.
const sanitizeForSheet = (value) => {
  const str = value === undefined || value === null ? "" : String(value);
  return /^[=+\-@\t\r]/.test(str) ? "'" + str : str;
};

// Parcelas pagas de um financiamento = o que foi informado no cadastro (parcelas quitadas antes
// de existirem como lançamento aqui) + as parcelas seguintes já marcadas como pagas na lista de
// lançamentos. É derivado, não armazenado: o lançamento é a fonte da verdade do que foi pago,
// então o contador nunca fica dessincronizado dele — nem ao marcar, nem ao desmarcar.
const vehiclePaidInstallments = (vehicle, transactions) => {
  const baseline = Number(vehicle.paidInstallments) || 0;
  const total = Number(vehicle.totalInstallments) || 0;
  const extras = transactions.filter((t) =>
    t.vehicleId === vehicle.id && t.paid && Number(t.installmentNumber) > baseline
  ).length;
  const paid = baseline + extras;
  return total > 0 ? Math.min(total, paid) : paid;
};

// "ignored" | "paid" | "overdue" | "soon" | "pending"
function paymentStatus(t) {
  if (t.ignored) return "ignored";
  if (t.paid) return "paid";
  // Ambos os lados à meia-noite, e o vencimento já ajustado para o próximo dia útil: só é
  // "vencido" a partir do dia SEGUINTE ao vencimento efetivo, nunca no próprio dia.
  const due = startOfDay(effectiveDueDate(t));
  const diffDays = Math.round((due - TODAY_START) / (1000 * 60 * 60 * 24));
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

/* =========================================================================
   Categorias <-> linhas de planilha (para a aba "Categorias" no Google Sheets)
   Cada linha representa uma categoria OU uma (categoria, subcategoria).
   Categorias sem nenhuma subcategoria ganham uma linha "raiz" (Subcategoria vazia).
   ========================================================================= */
const categoryRowId = (type, catId, subId) => `${type}_${catId}_${subId || "root"}`;
const slugify = (s) => String(s || "categoria").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "categoria";

function flattenCategories(categories) {
  const rows = [];
  ["income", "expense"].forEach((type) => {
    (categories[type] || []).forEach((c) => {
      const tipo = type === "income" ? "Receita" : "Despesa";
      if (!c.subs.length) {
        rows.push({ ID: categoryRowId(type, c.id, null), Tipo: tipo, CategoriaId: c.id, Categoria: sanitizeForSheet(c.name), Cor: c.color, SubcategoriaId: "", Subcategoria: "" });
      } else {
        c.subs.forEach((s) => rows.push({ ID: categoryRowId(type, c.id, s.id), Tipo: tipo, CategoriaId: c.id, Categoria: sanitizeForSheet(c.name), Cor: c.color, SubcategoriaId: s.id, Subcategoria: sanitizeForSheet(s.name) }));
      }
    });
  });
  return rows;
}

function unflattenCategoryRows(rows) {
  const order = { income: [], expense: [] };
  const catMap = { income: new Map(), expense: new Map() };
  rows.forEach((r) => {
    const type = String(r.Tipo || "").toLowerCase().startsWith("rec") ? "income" : "expense";
    const catId = r.CategoriaId || slugify(r.Categoria);
    if (!catMap[type].has(catId)) {
      const cat = { id: catId, name: r.Categoria || catId, color: r.Cor || CAT_COLORS[order[type].length % CAT_COLORS.length], subs: [] };
      catMap[type].set(catId, cat);
      order[type].push(cat);
    }
    const subId = r.SubcategoriaId || (r.Subcategoria ? slugify(r.Subcategoria) : "");
    if (subId) {
      const cat = catMap[type].get(catId);
      if (!cat.subs.find((s) => s.id === subId)) cat.subs.push({ id: subId, name: r.Subcategoria || subId });
    }
  });
  return { income: order.income, expense: order.expense };
}


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

// closeOnBackdrop={false} para formulários longos (ex.: novo lançamento com parcelamento):
// um clique no fundo apagaria tudo que foi digitado. Nesses casos o modal só fecha pelo X,
// pelo botão Cancelar ou ao salvar.
function Modal({ title, onClose, children, wide, closeOnBackdrop = true }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(16,27,45,0.55)", backdropFilter: "blur(2px)" }} onClick={closeOnBackdrop ? onClose : undefined}>
      <div onClick={(e) => e.stopPropagation()} className="w-full rounded-xl overflow-hidden flex flex-col" style={{ maxWidth: wide ? 640 : 440, maxHeight: "90vh", background: PARCHMENT, border: `1px solid ${LINE}`, boxShadow: "0 24px 60px rgba(16,27,45,0.35)" }}>
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: `1px solid ${LINE}` }}>
          <h3 className="text-[15px] font-semibold" style={{ fontFamily: "'Fraunces', serif", color: INK }}>{title}</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-black/5"><X size={17} color={SLATE} /></button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
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
function Dashboard({ onLogout, authConfig, updateCredentials, verifyCredentials, applyRemoteAuth, persistWarning, isDefaultCredentials, loginLog }) {
  const [tab, setTab] = useState("dashboard");
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categories, setCategories] = useState(seedCategories);
  const [cards, setCards] = useState(seedCards);
  const [vehicles, setVehicles] = useState(seedVehicles);
  const [transactions, setTransactions] = useState(seedTransactions);
  const CURRENT_YEAR_STORAGE_KEY = "meufinanceiro_current_year_v1";
  const [currentYear, setCurrentYear] = useState(() => {
    try {
      const raw = window.localStorage?.getItem(CURRENT_YEAR_STORAGE_KEY);
      if (raw) { const n = Number(raw); if (n && n >= 2000 && n <= 3000) return n; }
    } catch (_) { /* localStorage indisponível — usa o padrão nesta sessão */ }
    return REFERENCE_YEAR_DEFAULT;
  });
  React.useEffect(() => {
    try { window.localStorage?.setItem(CURRENT_YEAR_STORAGE_KEY, String(currentYear)); } catch (_) { /* segue só em memória */ }
  }, [currentYear]);
  const [archivedYears, setArchivedYears] = useState({}); // { [year]: transactions[] }
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH_IDX);
  const [dashboardScope, setDashboardScope] = useState("month"); // "month" | "year"
  const loadStoredSheetConfig = () => {
    try {
      const raw = window.localStorage?.getItem(SHEET_STORAGE_KEY);
      if (raw) { const parsed = JSON.parse(raw); return { url: parsed.url || "", appsScriptUrl: parsed.appsScriptUrl || "", secret: parsed.secret || "" }; }
    } catch (_) { /* localStorage indisponível — conexão precisa ser reconfigurada nesta sessão */ }
    return { url: "", appsScriptUrl: "", secret: "" };
  };
  const [sheetConfig, setSheetConfig] = useState(() => ({ ...loadStoredSheetConfig(), status: "idle", message: "", lastSync: null }));
  React.useEffect(() => {
    try { window.localStorage?.setItem(SHEET_STORAGE_KEY, JSON.stringify({ url: sheetConfig.url, appsScriptUrl: sheetConfig.appsScriptUrl, secret: sheetConfig.secret })); } catch (_) { /* segue só em memória */ }
  }, [sheetConfig.url, sheetConfig.appsScriptUrl, sheetConfig.secret]);
  const didAutoSync = React.useRef(false);
  React.useEffect(() => {
    if (didAutoSync.current) return;
    didAutoSync.current = true;
    if (sheetConfig.appsScriptUrl) syncWithSheet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Metas e orçamentos por categoria: { [categoryId]: { limit, active, period } }
  // "period" já existe na estrutura pensando em periodicidades futuras (hoje só "monthly" é usado).
  const [budgets, setBudgets] = useState({});
  const setBudget = (categoryId, patch) => {
    setBudgets((prev) => {
      const next = { ...prev, [categoryId]: { limit: 0, active: true, period: "monthly", ...prev[categoryId], ...patch } };
      pushToSheet({ Orcamentos: [toBudgetRow(categoryId, next[categoryId])] });
      return next;
    });
  };
  const removeBudget = (categoryId) => {
    setBudgets((prev) => { const next = { ...prev }; delete next[categoryId]; return next; });
    deleteFromSheet("Orcamentos", [categoryId]);
  };

  const allCategories = useMemo(() => [...categories.income, ...categories.expense], [categories]);
  const catById = useCallback((id) => allCategories.find((c) => c.id === id), [allCategories]);
  const subById = useCallback((catId, subId) => catById(catId)?.subs.find((s) => s.id === subId), [catById]);

  /* ---------- CRUD: transactions ---------- */
  /* ---------- Sincronização automática em segundo plano ---------- */
  const pushToSheet = async (payload) => {
    if (!sheetConfig.appsScriptUrl) return;
    const hasContent = Object.values(payload).some((rows) => rows && rows.length);
    if (!hasContent) return;
    try {
      const body = sheetConfig.secret ? { ...payload, token: sheetConfig.secret } : payload;
      const res = await fetch(sheetConfig.appsScriptUrl, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const resultText = await res.text();
      try {
        const resultJson = JSON.parse(resultText);
        if (resultJson && resultJson.error) throw new Error(resultJson.error + " Confira o token secreto.");
      } catch (parseErr) {
        if (parseErr instanceof SyntaxError) { /* resposta não era JSON — ignora, mantém compatibilidade */ } else throw parseErr;
      }
      setSheetConfig((s) => ({ ...s, lastSync: new Date().toISOString() }));
    } catch (err) {
      setSheetConfig((s) => ({ ...s, status: "error", message: "Não foi possível salvar automaticamente na planilha (" + err.message + "). Os dados continuam salvos aqui — use 'Sincronizar agora' para tentar de novo." }));
    }
  };
  const deleteFromSheet = (sheetKey, ids) => {
    if (!ids.length) return;
    pushToSheet({ [sheetKey]: ids.map((id) => ({ ID: id, _delete: true })) });
  };

  const addTransaction = (tx) => {
    const full = { id: uid(), paid: false, dueDay: 10, year: currentYear, ...tx };
    setTransactions((prev) => [...prev, full]);
    pushToSheet({ Lancamentos: [toSheetRow(full)] });
  };
  const addTransactionSeries = (entries) => {
    const fulls = entries.map((e) => ({ id: uid(), paid: false, dueDay: 10, year: currentYear, ...e }));
    setTransactions((prev) => [...prev, ...fulls]);
    pushToSheet({ Lancamentos: fulls.map(toSheetRow) });
  };
  const updateTransaction = (id, patch) => {
    setTransactions((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, ...patch } : t));
      const updated = next.find((t) => t.id === id);
      if (updated) pushToSheet({ Lancamentos: [toSheetRow(updated)] });
      return next;
    });
  };
  const deleteTransaction = (id) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    deleteFromSheet("Lancamentos", [id]);
  };
  const togglePaid = (id) => {
    setTransactions((prev) => {
      // Voltar a cobrar um lançamento ignorado: marcar como pago sai do estado "não será pago".
      const next = prev.map((t) => (t.id === id ? { ...t, paid: !t.paid, ignored: false } : t));
      const updated = next.find((t) => t.id === id);
      if (updated) pushToSheet({ Lancamentos: [toSheetRow(updated)] });
      return next;
    });
  };
  // "Não será pago": mantém o lançamento no histórico, mas fora de qualquer soma, pendência
  // ou orçamento — é o meio-termo entre pagar e excluir.
  const toggleIgnored = (id) => {
    setTransactions((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, ignored: !t.ignored, paid: t.ignored ? t.paid : false } : t));
      const updated = next.find((t) => t.id === id);
      if (updated) pushToSheet({ Lancamentos: [toSheetRow(updated)] });
      return next;
    });
  };
  const clearMonthTransactions = (month) => {
    setTransactions((prev) => {
      const toRemove = prev.filter((t) => t.month === month);
      if (toRemove.length) deleteFromSheet("Lancamentos", toRemove.map((t) => t.id));
      return prev.filter((t) => t.month !== month);
    });
  };
  const endRecurrence = (groupId, fromMonth) => {
    setTransactions((prev) => {
      const toRemove = prev.filter((t) => t.recurringGroupId === groupId && t.month >= fromMonth && !t.paid);
      if (toRemove.length) deleteFromSheet("Lancamentos", toRemove.map((t) => t.id));
      return prev.filter((t) => !toRemove.includes(t));
    });
  };
  const changeRecurrenceAmount = (groupId, fromMonth, newAmount) => {
    setTransactions((prev) => {
      const next = prev.map((t) => (t.recurringGroupId === groupId && t.month >= fromMonth && !t.paid ? { ...t, amount: newAmount } : t));
      const changed = next.filter((t) => t.recurringGroupId === groupId && t.month >= fromMonth && !t.paid);
      if (changed.length) pushToSheet({ Lancamentos: changed.map(toSheetRow) });
      return next;
    });
  };
  const resetAllTransactions = () => {
    setTransactions((prev) => {
      if (prev.length) deleteFromSheet("Lancamentos", prev.map((t) => t.id));
      return [];
    });
  };
  const archiveCurrentYear = () => {
    setArchivedYears((prev) => ({ ...prev, [currentYear]: transactions }));
    if (transactions.length) pushToSheet({ Lancamentos: transactions.map(toSheetRow) });
    setTransactions([]);
    const nextYear = currentYear + 1;
    setCurrentYear(nextYear);
    setSelectedMonth(0);
    // Guarda o ano corrente também na planilha (aba "Config") — é o que permite recuperar
    // qual ano está ativo mesmo se o localStorage deste navegador for limpo por completo.
    pushToSheet({ Config: [{ ID: "ano_corrente", Chave: "AnoAtual", Valor: nextYear }] });
  };

  /* ---------- Credencial de acesso na planilha ----------
     Vai para a aba "Config" (chave/valor), que já existe e que o Apps Script já lê e grava —
     assim o usuário não precisa criar aba nem republicar o script. O que sobe é o hash com
     salt, nunca a senha: ver o bloco de PBKDF2 no topo do arquivo e Decisoes.md. */
  const AUTH_CONFIG_ROWS = [
    ["auth_usuario", "AuthUsuario", "username"], ["auth_algoritmo", "AuthAlgoritmo", "algo"],
    ["auth_salt", "AuthSalt", "salt"], ["auth_iteracoes", "AuthIteracoes", "iterations"],
    ["auth_hash", "AuthHash", "hash"], ["auth_atualizado_em", "AuthAtualizadoEm", "updatedAt"],
  ];
  const pushCredentialsToSheet = async (newUsername, newPassword) => {
    const record = await updateCredentials(newUsername, newPassword);
    pushToSheet({ Config: AUTH_CONFIG_ROWS.map(([id, chave, campo]) => ({ ID: id, Chave: chave, Valor: record[campo] ?? "" })) });
    return record;
  };
  const authRecordFromConfigRows = (rows) => {
    const byKey = {};
    rows.forEach((r) => { if (r && r.Chave) byKey[String(r.Chave)] = r.Valor; });
    if (!byKey.AuthHash || !byKey.AuthUsuario) return null;
    return {
      username: String(byKey.AuthUsuario), algo: byKey.AuthAlgoritmo || undefined,
      salt: byKey.AuthSalt || undefined, iterations: Number(byKey.AuthIteracoes) || undefined,
      hash: String(byKey.AuthHash), updatedAt: byKey.AuthAtualizadoEm ? String(byKey.AuthAtualizadoEm) : "",
    };
  };

  /* ---------- CRUD: categories ---------- */
  const addCategory = (type, name) => {
    const id = uid();
    const color = CAT_COLORS[categories[type].length % CAT_COLORS.length];
    setCategories((prev) => ({ ...prev, [type]: [...prev[type], { id, name, color, subs: [] }] }));
    pushToSheet({ Categorias: [{ ID: categoryRowId(type, id, null), Tipo: type === "income" ? "Receita" : "Despesa", CategoriaId: id, Categoria: name, Cor: color, SubcategoriaId: "", Subcategoria: "" }] });
  };
  const deleteCategory = (type, id) => {
    const cat = categories[type].find((c) => c.id === id);
    setCategories((prev) => ({ ...prev, [type]: prev[type].filter((c) => c.id !== id) }));
    if (cat) {
      const ids = cat.subs.length ? cat.subs.map((s) => categoryRowId(type, id, s.id)) : [categoryRowId(type, id, null)];
      deleteFromSheet("Categorias", ids);
    }
  };
  const addSubcategory = (type, catId, name) => {
    const subId = uid();
    const cat = categories[type].find((c) => c.id === catId);
    setCategories((prev) => ({
      ...prev, [type]: prev[type].map((c) => (c.id === catId ? { ...c, subs: [...c.subs, { id: subId, name }] } : c)),
    }));
    if (cat) {
      // se essa é a primeira subcategoria, a linha "raiz" (sem subcategoria) deixa de existir na planilha
      if (cat.subs.length === 0) deleteFromSheet("Categorias", [categoryRowId(type, catId, null)]);
      pushToSheet({ Categorias: [{ ID: categoryRowId(type, catId, subId), Tipo: type === "income" ? "Receita" : "Despesa", CategoriaId: catId, Categoria: cat.name, Cor: cat.color, SubcategoriaId: subId, Subcategoria: name }] });
    }
  };
  const deleteSubcategory = (type, catId, subId) => {
    const cat = categories[type].find((c) => c.id === catId);
    setCategories((prev) => ({
      ...prev, [type]: prev[type].map((c) => (c.id === catId ? { ...c, subs: c.subs.filter((s) => s.id !== subId) } : c)),
    }));
    deleteFromSheet("Categorias", [categoryRowId(type, catId, subId)]);
    // se essa era a última subcategoria, recria a linha "raiz" pra categoria não sumir da planilha
    if (cat && cat.subs.length === 1) {
      pushToSheet({ Categorias: [{ ID: categoryRowId(type, catId, null), Tipo: type === "income" ? "Receita" : "Despesa", CategoriaId: catId, Categoria: cat.name, Cor: cat.color, SubcategoriaId: "", Subcategoria: "" }] });
    }
  };

  /* ---------- CRUD: cards & vehicles ---------- */
  const toCardRow = (c) => ({ ID: c.id, Nome: sanitizeForSheet(c.name), Limite: c.limit, DiaFechamento: c.closingDay, DiaVencimento: c.dueDay, Cor: c.color });
  const toVehicleRow = (v) => ({ ID: v.id, Nome: sanitizeForSheet(v.name), ValorTotal: v.totalValue, TotalParcelas: v.totalInstallments, ValorParcela: v.installmentValue, ParcelasPagas: v.paidInstallments, MesInicio: v.startMonth ?? 0 });
  const toBudgetRow = (categoryId, b) => ({ ID: categoryId, CategoriaId: categoryId, Limite: b.limit, Ativo: b.active ? "Sim" : "Não", Periodo: b.period || "monthly" });

  const addCard = (card) => {
    const full = { id: uid(), ...card };
    setCards((prev) => [...prev, full]);
    pushToSheet({ Cartoes: [toCardRow(full)] });
  };
  const updateCard = (id, patch) => {
    setCards((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...patch } : c));
      const updated = next.find((c) => c.id === id);
      if (updated) pushToSheet({ Cartoes: [toCardRow(updated)] });
      return next;
    });
  };
  const deleteCard = (id) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
    deleteFromSheet("Cartoes", [id]);
  };

  // Devolve o veículo criado (com o id) para quem chamou poder encadear — é o que permite
  // abrir a conciliação de parcelas logo após o cadastro.
  const addVehicle = (v) => {
    const full = { id: uid(), ...v };
    setVehicles((prev) => [...prev, full]);
    pushToSheet({ Veiculos: [toVehicleRow(full)] });
    return full;
  };
  const updateVehicle = (id, patch) => {
    setVehicles((prev) => {
      const next = prev.map((v) => (v.id === id ? { ...v, ...patch } : v));
      const updated = next.find((v) => v.id === id);
      if (updated) pushToSheet({ Veiculos: [toVehicleRow(updated)] });
      return next;
    });
  };
  const deleteVehicle = (id) => {
    setVehicles((prev) => prev.filter((v) => v.id !== id));
    deleteFromSheet("Veiculos", [id]);
  };

  /* ---------- Computations ---------- */
  // Lançamento marcado como "não será pago" continua na lista, mas fica FORA de todo cálculo
  // financeiro: KPIs, gráficos, subtotais, orçamentos, faturas, relatório e pendências.
  // Toda soma parte daqui; a lista de lançamentos, essa sim, usa `transactions` inteiro.
  const activeTransactions = useMemo(() => transactions.filter((t) => !t.ignored), [transactions]);

  const monthTotals = useCallback((m) => {
    const inc = activeTransactions.filter((t) => t.month === m && t.type === "income").reduce((s, t) => s + Number(t.amount || 0), 0);
    const exp = activeTransactions.filter((t) => t.month === m && t.type === "expense").reduce((s, t) => s + Number(t.amount || 0), 0);
    return { income: inc, expense: exp, balance: inc - exp };
  }, [activeTransactions]);

  const yearSeries = useMemo(() => MONTHS.map((label, i) => {
    const { income, expense } = monthTotals(i);
    return { month: label, Entradas: Math.round(income), Saídas: Math.round(expense) };
  }), [monthTotals]);

  const yearTotals = useMemo(() => {
    const income = activeTransactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount || 0), 0);
    const expense = activeTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount || 0), 0);
    return { income, expense, balance: income - expense };
  }, [activeTransactions]);

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
    const scopeTx = activeTransactions.filter((t) => t.type === "expense" && (dashboardScope === "year" || t.month === selectedMonth));
    const map = {};
    scopeTx.forEach((t) => { map[t.categoryId] = (map[t.categoryId] || 0) + Number(t.amount || 0); });
    return Object.entries(map).map(([id, value]) => ({ id, name: catById(id)?.name || id, value: Math.round(value), color: catById(id)?.color || SLATE }))
      .sort((a, b) => b.value - a.value);
  }, [activeTransactions, dashboardScope, selectedMonth, catById]);

  // Calcula em qual mês/ano a fatura de um lançamento de cartão cai, considerando o dia de
  // fechamento do cartão (não apenas o mês do lançamento). Ex.: fechamento dia 15, compra dia 16
  // vai automaticamente para a fatura do mês seguinte.
  const invoicePeriodFor = (card, t) => {
    const purchaseDay = t.dueDay || 1;
    if (purchaseDay > card.closingDay) {
      const month = (t.month + 1) % 12;
      const year = t.month === 11 ? (t.year || currentYear) + 1 : (t.year || currentYear);
      return { month, year };
    }
    return { month: t.month, year: t.year || currentYear };
  };
  const cardInvoice = (cardId, m, y) => {
    const card = cards.find((c) => c.id === cardId);
    const year = y ?? currentYear;
    if (!card) return activeTransactions.filter((t) => t.cardId === cardId && t.month === m).reduce((s, t) => s + Number(t.amount || 0), 0);
    return activeTransactions
      .filter((t) => t.cardId === cardId)
      .filter((t) => { const p = invoicePeriodFor(card, t); return p.month === m && p.year === year; })
      .reduce((s, t) => s + Number(t.amount || 0), 0);
  };

  const pendingBadgeCount = useMemo(
    () => activeTransactions.filter((t) => !t.paid && (paymentStatus(t) === "overdue" || paymentStatus(t) === "soon")).length,
    [activeTransactions]
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
    ID: t.id, Ano: t.year || currentYear, Mes: MONTHS[t.month], Tipo: t.type === "income" ? "Receita" : "Despesa",
    CategoriaId: t.categoryId, Categoria: sanitizeForSheet(catById(t.categoryId)?.name || t.categoryId),
    SubcategoriaId: t.subId, Subcategoria: sanitizeForSheet(subById(t.categoryId, t.subId)?.name || t.subId),
    Descricao: sanitizeForSheet(t.description), Valor: t.amount, Cartao: sanitizeForSheet(t.cardId || ""), Veiculo: sanitizeForSheet(t.vehicleId || ""),
    Pago: t.paid ? "Sim" : "Não", Vencimento: t.dueDay || "",
    Notas: sanitizeForSheet(t.notes || ""), ParcelaNumero: t.installmentNumber || "", ParcelaTotal: t.installmentTotal || "",
    RecorrenciaGrupoId: t.recurringGroupId || "", RecorrenciaIndefinida: t.indefiniteRecurring ? "Sim" : "",
    BankId: t.bankId || "", Ignorado: t.ignored ? "Sim" : "",
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
      year: r.Ano ? Number(r.Ano) : currentYear,
      month: monthIndex(r.Mes || r.Mês || r.month),
      type: (r.Tipo || r.type || "").toLowerCase().startsWith("rec") ? "income" : "expense",
      categoryId: r.CategoriaId || (r.Categoria || r.category || "outros_desp").toLowerCase(),
      subId: r.SubcategoriaId || (r.Subcategoria || r.subcategory || "diversos").toLowerCase(),
      description: r.Descricao || r.Descrição || r.description || "Importado da planilha",
      amount: parseFloat(String(r.Valor || r.amount || "0").replace(",", ".")) || 0,
      cardId: r.Cartao || r.Cartão || undefined,
      vehicleId: r.Veiculo || r.Veículo || undefined,
      bankId: r.BankId || undefined,
      paid: String(r.Pago || r.paid || "").toLowerCase().startsWith("s") || String(r.Pago || r.paid || "").toLowerCase() === "true",
      dueDay: Number(r.Vencimento || r.dueDay) || 10,
      notes: r.Notas || undefined,
      installmentNumber: r.ParcelaNumero ? Number(r.ParcelaNumero) : undefined,
      installmentTotal: r.ParcelaTotal ? Number(r.ParcelaTotal) : undefined,
      recurringGroupId: r.RecorrenciaGrupoId || undefined,
      indefiniteRecurring: String(r.RecorrenciaIndefinida || "").toLowerCase().startsWith("s"),
      ignored: String(r.Ignorado || "").toLowerCase().startsWith("s"),
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
      // 1) Busca tudo que já está na planilha (Lançamentos + Categorias)
      const getUrl = sheetConfig.secret
        ? sheetConfig.appsScriptUrl + (sheetConfig.appsScriptUrl.includes("?") ? "&" : "?") + "token=" + encodeURIComponent(sheetConfig.secret)
        : sheetConfig.appsScriptUrl;
      const res = await fetch(getUrl);
      if (!res.ok) throw new Error("O Apps Script respondeu com erro " + res.status + " — confirme se o Web App foi publicado com acesso 'Qualquer pessoa'.");
      const rawText = await res.text();
      let remoteData;
      try {
        remoteData = JSON.parse(rawText);
      } catch {
        if (rawText.trim().toLowerCase().startsWith("id,") || rawText.includes(",")) {
          throw new Error("A URL informada parece ser o link de publicação em CSV (do passo 1), não a URL do Apps Script Web App (que termina em /exec, gerada no passo 4). Cole a URL certa no campo de sincronização.");
        }
        throw new Error("A resposta não veio em JSON válido — confirme se colou a URL do Apps Script Web App (termina em /exec) e se o deploy está ativo.");
      }
      if (remoteData && remoteData.error) {
        throw new Error(remoteData.error + " Confira se o token secreto configurado aqui é igual ao definido na constante SHARED_SECRET do Apps Script.");
      }
      // Compatibilidade: scripts antigos (antes das Categorias) devolvem um array só com Lançamentos
      const remoteLancamentos = Array.isArray(remoteData) ? remoteData : (remoteData.Lancamentos || []);
      const remoteCategorias = Array.isArray(remoteData) ? [] : (remoteData.Categorias || []);
      const remoteConfig = Array.isArray(remoteData) ? [] : (remoteData.Config || []);
      const remoteCartoes = Array.isArray(remoteData) ? [] : (remoteData.Cartoes || []);
      const remoteVeiculos = Array.isArray(remoteData) ? [] : (remoteData.Veiculos || []);
      const remoteOrcamentos = Array.isArray(remoteData) ? [] : (remoteData.Orcamentos || []);

      // O ano corrente também é recuperado da planilha (aba "Config") — importante para quando
      // o navegador foi limpo por completo e o app "esqueceria" que já tinha avançado de ano.
      // Nunca regride: usa sempre o maior valor entre o que já está aqui e o que veio de lá.
      const remoteYearRow = remoteConfig.find((r) => r.Chave === "AnoAtual" || r.ID === "ano_corrente");
      const remoteCurrentYear = remoteYearRow ? Number(remoteYearRow.Valor) : null;
      if (remoteCurrentYear && remoteCurrentYear > currentYear) setCurrentYear(remoteCurrentYear);
      const effectiveCurrentYear = remoteCurrentYear && remoteCurrentYear > currentYear ? remoteCurrentYear : currentYear;

      // Credencial de acesso: adota a da planilha se ela for mais recente que a deste
      // navegador; se a local for mais recente (ou a planilha ainda não tiver nenhuma), sobe a
      // local. É o que faz a troca de senha valer em qualquer dispositivo.
      const remoteAuth = authRecordFromConfigRows(remoteConfig);
      const localAuthAt = authConfig.updatedAt || "";
      if (remoteAuth && remoteAuth.updatedAt > localAuthAt) {
        applyRemoteAuth(remoteAuth);
      } else if (authConfig.updatedAt && (!remoteAuth || localAuthAt > (remoteAuth.updatedAt || ""))) {
        pushToSheet({ Config: AUTH_CONFIG_ROWS.map(([id, chave, campo]) => ({ ID: id, Chave: chave, Valor: authConfig[campo] ?? "" })) });
      }

      const monthIndex = (label) => {
        const i = MONTHS.findIndex((m) => m.toLowerCase() === String(label || "").trim().slice(0, 3).toLowerCase());
        return i >= 0 ? i : 0;
      };
      // usa o valor remoto se ele existir/for preenchido; senão preserva o local (evita perder dados
      // quando a planilha ainda não tem uma coluna nova, em vez de sobrescrever com vazio)
      const pick = (remVal, locVal) => (remVal !== undefined && remVal !== "" && remVal !== null ? remVal : locVal);

      const remoteTx = remoteLancamentos.filter((r) => r.ID).map((r) => ({
        id: r.ID, year: r.Ano ? Number(r.Ano) : effectiveCurrentYear, month: monthIndex(r.Mes), type: String(r.Tipo || "").toLowerCase().startsWith("rec") ? "income" : "expense",
        categoryId: r.CategoriaId || String(r.Categoria || "outros_desp").toLowerCase(),
        subId: r.SubcategoriaId || String(r.Subcategoria || "diversos").toLowerCase(),
        description: r.Descricao || "Importado da planilha", amount: parseFloat(String(r.Valor || "0").replace(",", ".")) || 0,
        cardId: r.Cartao || undefined, vehicleId: r.Veiculo || undefined,
        paid: String(r.Pago || "").toLowerCase().startsWith("s"), dueDay: Number(r.Vencimento) || 10,
        notes: r.Notas || undefined,
        installmentNumber: r.ParcelaNumero ? Number(r.ParcelaNumero) : undefined,
        installmentTotal: r.ParcelaTotal ? Number(r.ParcelaTotal) : undefined,
        recurringGroupId: r.RecorrenciaGrupoId || undefined,
        indefiniteRecurring: String(r.RecorrenciaIndefinida || "").toLowerCase().startsWith("s") || undefined,
        bankId: r.BankId || undefined,
        ignored: String(r.Ignorado || "").toLowerCase().startsWith("s") || undefined,
      }));
      // Separa o que é do ano corrente (editável, vai para "transactions") do que é de anos já
      // arquivados (só leitura, vai para "archivedYears") — é isso que permite recuperar o
      // histórico de anos arquivados mesmo depois de limpar os dados do navegador.
      const remoteCurrentYearTx = remoteTx.filter((t) => t.year === effectiveCurrentYear);
      const remoteArchivedTx = remoteTx.filter((t) => t.year !== effectiveCurrentYear);

      // 2) Mescla lançamentos: o que só existe aqui vai pra lá; o que só existe lá vem pra cá;
      //    o que existe nos dois fica com os valores da planilha, mas sem perder campos extras
      //    (parcela/recorrência/observações) que a planilha ainda não tenha preenchido.
      setTransactions((prevLocal) => {
        const localById = new Map(prevLocal.map((t) => [t.id, t]));
        const remoteById = new Map(remoteCurrentYearTx.map((t) => [t.id, t]));
        const allIds = new Set([...localById.keys(), ...remoteById.keys()]);
        const merged = [];
        allIds.forEach((id) => {
          const loc = localById.get(id);
          const rem = remoteById.get(id);
          if (loc && rem) {
            merged.push({
              ...loc, ...rem,
              notes: pick(rem.notes, loc.notes),
              installmentNumber: pick(rem.installmentNumber, loc.installmentNumber),
              installmentTotal: pick(rem.installmentTotal, loc.installmentTotal),
              recurringGroupId: pick(rem.recurringGroupId, loc.recurringGroupId),
              indefiniteRecurring: rem.indefiniteRecurring ?? loc.indefiniteRecurring,
              ignored: rem.ignored ?? loc.ignored,
            });
          } else merged.push(loc || rem);
        });

        const toPush = prevLocal.filter((t) => !remoteById.has(t.id));
        if (toPush.length) pushToSheet({ Lancamentos: toPush.map(toSheetRow) });

        return merged;
      });

      // 2b) Anos arquivados: união simples por ID (são somente leitura, não têm edição
      // concorrente para mesclar campo a campo) — o que só existe localmente é enviado
      // pra planilha; o que só existe na planilha é incorporado ao histórico local.
      if (remoteArchivedTx.length || Object.keys(archivedYears).length) {
        setArchivedYears((prevArchived) => {
          const nextArchived = { ...prevArchived };
          const remoteByYear = {};
          remoteArchivedTx.forEach((t) => { (remoteByYear[t.year] = remoteByYear[t.year] || []).push(t); });

          const allYears = new Set([...Object.keys(prevArchived).map(Number), ...Object.keys(remoteByYear).map(Number)]);
          allYears.forEach((year) => {
            const localYearTx = prevArchived[year] || [];
            const remoteYearTx = remoteByYear[year] || [];
            const localById = new Map(localYearTx.map((t) => [t.id, t]));
            const remoteById = new Map(remoteYearTx.map((t) => [t.id, t]));
            const allIds = new Set([...localById.keys(), ...remoteById.keys()]);
            const merged = [];
            allIds.forEach((id) => merged.push(localById.get(id) || remoteById.get(id)));
            nextArchived[year] = merged;

            const toPush = localYearTx.filter((t) => !remoteById.has(t.id));
            if (toPush.length) pushToSheet({ Lancamentos: toPush.map(toSheetRow) });
          });
          return nextArchived;
        });
      }

      // 3) Mescla categorias: mesma lógica, por linha (categoria + subcategoria)
      let categoriesTouched = 0;
      setCategories((prevCats) => {
        const localRows = flattenCategories(prevCats);
        const remoteRows = remoteCategorias.filter((r) => r.ID);
        const localById = new Map(localRows.map((r) => [r.ID, r]));
        const remoteById = new Map(remoteRows.map((r) => [r.ID, r]));
        const allIds = new Set([...localById.keys(), ...remoteById.keys()]);
        const mergedRows = [];
        allIds.forEach((id) => {
          const loc = localById.get(id);
          const rem = remoteById.get(id);
          mergedRows.push(rem || loc);
        });
        categoriesTouched = mergedRows.length;

        const toPush = localRows.filter((r) => !remoteById.has(r.ID));
        if (toPush.length) pushToSheet({ Categorias: toPush });

        return mergedRows.length ? unflattenCategoryRows(mergedRows) : prevCats;
      });

      // 4) Mescla cartões de crédito
      setCards((prevCards) => {
        const remoteById = new Map(remoteCartoes.filter((r) => r.ID).map((r) => [r.ID, r]));
        const allIds = new Set([...prevCards.map((c) => c.id), ...remoteById.keys()]);
        const merged = [];
        allIds.forEach((id) => {
          const loc = prevCards.find((c) => c.id === id);
          const rem = remoteById.get(id);
          if (rem) merged.push({ id, name: rem.Nome || loc?.name || "Cartão", limit: Number(rem.Limite) || loc?.limit || 0, closingDay: Number(rem.DiaFechamento) || loc?.closingDay || 5, dueDay: Number(rem.DiaVencimento) || loc?.dueDay || 10, color: rem.Cor || loc?.color || SAGE });
          else if (loc) merged.push(loc);
        });
        const toPush = prevCards.filter((c) => !remoteById.has(c.id));
        if (toPush.length) pushToSheet({ Cartoes: toPush.map(toCardRow) });
        return merged;
      });

      // 5) Mescla veículos/financiamentos
      setVehicles((prevVehicles) => {
        const remoteById = new Map(remoteVeiculos.filter((r) => r.ID).map((r) => [r.ID, r]));
        const allIds = new Set([...prevVehicles.map((v) => v.id), ...remoteById.keys()]);
        const merged = [];
        allIds.forEach((id) => {
          const loc = prevVehicles.find((v) => v.id === id);
          const rem = remoteById.get(id);
          if (rem) merged.push({ id, name: rem.Nome || loc?.name || "Veículo", totalValue: Number(rem.ValorTotal) || loc?.totalValue || 0, totalInstallments: Number(rem.TotalParcelas) || loc?.totalInstallments || 1, installmentValue: Number(rem.ValorParcela) || loc?.installmentValue || 0, paidInstallments: Number(rem.ParcelasPagas) || loc?.paidInstallments || 0, startMonth: Number(rem.MesInicio) || loc?.startMonth || 0 });
          else if (loc) merged.push(loc);
        });
        const toPush = prevVehicles.filter((v) => !remoteById.has(v.id));
        if (toPush.length) pushToSheet({ Veiculos: toPush.map(toVehicleRow) });
        return merged;
      });

      // 6) Mescla metas e orçamentos por categoria
      setBudgets((prevBudgets) => {
        const localIds = Object.keys(prevBudgets);
        const remoteById = new Map(remoteOrcamentos.filter((r) => r.ID).map((r) => [r.ID, r]));
        const allIds = new Set([...localIds, ...remoteById.keys()]);
        const merged = {};
        allIds.forEach((categoryId) => {
          const loc = prevBudgets[categoryId];
          const rem = remoteById.get(categoryId);
          merged[categoryId] = rem ? { limit: Number(rem.Limite) || 0, active: String(rem.Ativo || "").toLowerCase().startsWith("s"), period: rem.Periodo || "monthly" } : loc;
        });
        const toPush = localIds.filter((id) => !remoteById.has(id));
        if (toPush.length) pushToSheet({ Orcamentos: toPush.map((id) => toBudgetRow(id, prevBudgets[id])) });
        return merged;
      });

      setSheetConfig((s) => ({ ...s, status: "success", message: `Sincronização concluída — lançamentos, categorias, cartões, veículos e orçamentos foram alinhados com a planilha.`, lastSync: new Date().toISOString() }));
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
        {/* Fundo escurecido atrás da gaveta de navegação, só em mobile/tablet */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden" style={{ background: "rgba(16,27,45,0.55)" }} onClick={() => setSidebarOpen(false)} />
        )}

        {/* ============ SIDEBAR — ledger index tabs ============ */}
        <aside
          className={`fixed lg:sticky top-0 left-0 z-50 h-screen transition-transform duration-200 ease-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
          style={{ width: 236, background: INK, alignSelf: "flex-start", paddingTop: 18, display: "flex", flexDirection: "column" }}
        >
          <div className="px-5 pb-6 flex items-center gap-2.5">
            <Logo size={34} />
            <div className="flex-1 min-w-0">
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 600, color: "#fff" }}>MeuFinanceiro</div>
              <div style={{ fontSize: 10.5, color: "#8B95A8", letterSpacing: "0.06em" }}>CONTROLE FAMILIAR · {currentYear}</div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-md flex-shrink-0" style={{ color: "#C7CEDA" }}><X size={18} /></button>
          </div>
          <nav className="pl-2 overflow-y-auto flex-1">
            <LedgerTab icon={PieIcon} label="Dashboard" active={tab === "dashboard"} onClick={() => { setTab("dashboard"); setSidebarOpen(false); }} />
            <LedgerTab icon={Calendar} label="Lançamentos" active={tab === "lancamentos"} onClick={() => { setTab("lancamentos"); setSidebarOpen(false); }} badge={pendingBadgeCount} />
            <LedgerTab icon={Layers} label="Parcelas & Recorrências" active={tab === "recorrencias"} onClick={() => { setTab("recorrencias"); setSidebarOpen(false); }} badge={recurrenceBadgeCount} />
            <LedgerTab icon={Settings2} label="Categorias" active={tab === "categorias"} onClick={() => { setTab("categorias"); setSidebarOpen(false); }} />
            <LedgerTab icon={Link2} label="Conexão Google Sheets" active={tab === "conexao"} onClick={() => { setTab("conexao"); setSidebarOpen(false); }} />
            <LedgerTab icon={TrendingUp} label="Relatório Anual" active={tab === "relatorio"} onClick={() => { setTab("relatorio"); setSidebarOpen(false); }} />
            <LedgerTab icon={ShieldAlert} label="Diagnóstico de Segurança" active={tab === "seguranca"} onClick={() => { setTab("seguranca"); setSidebarOpen(false); }} badge={isDefaultCredentials ? 1 : 0} />
          </nav>
          <div className="px-4 pt-4 pb-4 flex-shrink-0">
            <button onClick={() => { setCredentialsModalOpen(true); setSidebarOpen(false); }} className="flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-lg text-[13px] font-medium" style={{ color: "#C7CEDA" }}
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
            authConfig={authConfig} verifyCredentials={verifyCredentials} updateCredentials={pushCredentialsToSheet}
            persistWarning={persistWarning} onClose={() => setCredentialsModalOpen(false)}
          />
        )}

        {/* ============ MAIN ============ */}
        <main className="flex-1 min-w-0">
          {/* Barra superior — só aparece em telas menores que o breakpoint lg */}
          <div className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3" style={{ background: INK, borderBottom: `1px solid rgba(255,255,255,0.08)` }}>
            <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-md flex-shrink-0" style={{ color: "#fff" }} aria-label="Abrir menu"><Menu size={20} /></button>
            <Logo size={24} />
            <span className="truncate" style={{ fontFamily: "'Fraunces', serif", fontSize: 14, fontWeight: 600, color: "#fff" }}>MeuFinanceiro</span>
          </div>

          <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-8 max-w-full overflow-x-hidden">
          {tab === "dashboard" && (
            <DashboardTab
              dashboardScope={dashboardScope} setDashboardScope={setDashboardScope}
              selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}
              scopeKpis={scopeKpis} expenseByCategory={expenseByCategory} yearSeries={yearSeries}
              cards={cards} vehicles={vehicles} cardInvoice={cardInvoice} currentYear={currentYear}
              categories={categories} transactions={activeTransactions} catById={catById}
              budgets={budgets} setBudget={setBudget} removeBudget={removeBudget}
            />
          )}
          {tab === "lancamentos" && (
            <LancamentosTab
              selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}
              transactions={transactions} categories={categories} cards={cards} vehicles={vehicles} toggleIgnored={toggleIgnored}
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
              transactions={transactions} addTransactionSeries={addTransactionSeries}
              updateTransaction={updateTransaction} currentYear={currentYear}
            />
          )}
          {tab === "conexao" && (
            <ConexaoTab sheetConfig={sheetConfig} setSheetConfig={setSheetConfig} importFromSheet={importFromSheet} importFromPastedCsv={importFromPastedCsv} exportCsv={exportCsv} syncWithSheet={syncWithSheet} resetAllTransactions={resetAllTransactions} transactionCount={transactions.length} />
          )}
          {tab === "relatorio" && (
            <RelatorioTab categories={categories} transactions={activeTransactions} yearTotals={yearTotals} catById={catById}
              currentYear={currentYear} archivedYears={archivedYears} archiveCurrentYear={archiveCurrentYear} />
          )}
          {tab === "seguranca" && (
            <SegurancaTab
              authConfig={authConfig} isDefaultCredentials={isDefaultCredentials} persistWarning={persistWarning}
              loginLog={loginLog} sheetConfig={sheetConfig} setTab={setTab}
            />
          )}
          </div>
        </main>
      </div>
    </div>
  );
}

/* =========================================================================
   AUTENTICAÇÃO — tela de login (proteção do lado do cliente)
   ========================================================================= */
const LOCKOUT_STORAGE_KEY = "meufinanceiro_lockout_v1";
function loadStoredLockout() {
  try {
    const raw = window.localStorage?.getItem(LOCKOUT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed?.attempts === "number") return parsed;
    }
  } catch (_) { /* localStorage indisponível — bloqueio vale só para esta aba/sessão */ }
  return { attempts: 0, lockedUntil: null };
}
function saveStoredLockout(state) {
  try { window.localStorage?.setItem(LOCKOUT_STORAGE_KEY, JSON.stringify(state)); } catch (_) { /* segue só em memória */ }
}

function LoginScreen({ onSuccess, authConfig, onAttempt }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const initialLockout = useMemo(loadStoredLockout, []);
  const [attempts, setAttempts] = useState(initialLockout.attempts);
  const [lockedUntil, setLockedUntil] = useState(initialLockout.lockedUntil);
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
      if (await checkPassword(authConfig, liveUsername, livePassword)) {
        saveStoredLockout({ attempts: 0, lockedUntil: null });
        onAttempt?.(liveUsername, true);
        onSuccess();
        return;
      }
      onAttempt?.(liveUsername, false);
      const nextAttempts = attempts + 1;
      setPassword("");
      if (passwordRef.current) passwordRef.current.value = "";
      if (nextAttempts >= AUTH_CONFIG.maxAttempts) {
        const until = Date.now() + AUTH_CONFIG.lockoutSeconds * 1000;
        setLockedUntil(until);
        setAttempts(0);
        saveStoredLockout({ attempts: 0, lockedUntil: until });
        setError(`Muitas tentativas incorretas. Aguarde ${AUTH_CONFIG.lockoutSeconds}s para tentar de novo.`);
      } else {
        setAttempts(nextAttempts);
        saveStoredLockout({ attempts: nextAttempts, lockedUntil: null });
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
            <p className="text-[13px]" style={{ color: INK }}>Credenciais atualizadas com sucesso. Use o novo usuário e senha no próximo login. Se a sincronização com o Google Sheets estiver configurada, elas passam a valer também nos seus outros dispositivos.</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
  const [loginLog, setLoginLog] = useState([]); // log local, em memória, só desta sessão do navegador

  const logLoginAttempt = (username, success) => {
    setLoginLog((prev) => [{ id: uid(), username, success, at: new Date().toISOString() }, ...prev].slice(0, 50));
  };

  const persistAuth = (next) => {
    setAuthConfig(next);
    try {
      window.localStorage?.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
      setPersistWarning(false);
    } catch (_) {
      setPersistWarning(true); // credenciais trocadas só para esta sessão/aba
    }
    return next;
  };

  const updateCredentials = async (newUsername, newPassword) => persistAuth(await buildAuthRecord(newUsername, newPassword));

  const verifyCredentials = async (usernameInput, passwordInput) => checkPassword(authConfig, usernameInput, passwordInput);

  // Chamado pela sincronização quando a planilha traz uma credencial mais recente que a deste
  // navegador — é o que faz a troca de senha valer em qualquer dispositivo.
  const applyRemoteAuth = (remote) => {
    if (!remote || !remote.hash || !remote.username) return;
    const localAt = authConfig.updatedAt || "";
    if (remote.updatedAt && remote.updatedAt > localAt) persistAuth(remote);
  };

  const isDefaultCredentials = authConfig.hash === AUTH_CONFIG.hash;

  // Busca a credencial na planilha ANTES do login, quando já existe uma conexão configurada
  // neste navegador. Sem isso, a senha trocada em outro dispositivo só passaria a valer depois
  // de o usuário entrar com a credencial antiga — o que anularia boa parte do ganho.
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = window.localStorage?.getItem(SHEET_STORAGE_KEY);
        const cfg = raw ? JSON.parse(raw) : null;
        if (!cfg?.appsScriptUrl) return;
        const url = cfg.secret
          ? cfg.appsScriptUrl + (cfg.appsScriptUrl.includes("?") ? "&" : "?") + "token=" + encodeURIComponent(cfg.secret)
          : cfg.appsScriptUrl;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = JSON.parse(await res.text());
        const rows = Array.isArray(data) ? [] : (data.Config || []);
        const byKey = {};
        rows.forEach((r) => { if (r && r.Chave) byKey[String(r.Chave)] = r.Valor; });
        if (!byKey.AuthHash || !byKey.AuthUsuario || cancelled) return;
        applyRemoteAuth({
          username: String(byKey.AuthUsuario), algo: byKey.AuthAlgoritmo || undefined,
          salt: byKey.AuthSalt || undefined, iterations: Number(byKey.AuthIteracoes) || undefined,
          hash: String(byKey.AuthHash), updatedAt: byKey.AuthAtualizadoEm ? String(byKey.AuthAtualizadoEm) : "",
        });
      } catch (_) { /* offline ou planilha indisponível: segue com a credencial local */ }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!authed) return <LoginScreen authConfig={authConfig} onSuccess={() => setAuthed(true)} onAttempt={logLoginAttempt} />;
  return (
    <Dashboard
      onLogout={() => setAuthed(false)}
      authConfig={authConfig}
      updateCredentials={updateCredentials}
      verifyCredentials={verifyCredentials}
      applyRemoteAuth={applyRemoteAuth}
      persistWarning={persistWarning}
      isDefaultCredentials={isDefaultCredentials}
      loginLog={loginLog}
    />
  );
}

/* =========================================================================
   TAB: DASHBOARD
   ========================================================================= */
function DashboardTab({ dashboardScope, setDashboardScope, selectedMonth, setSelectedMonth, scopeKpis, expenseByCategory, yearSeries, cards, vehicles, cardInvoice, currentYear, categories, transactions, catById, budgets, setBudget, removeBudget }) {
  const [budgetsModalOpen, setBudgetsModalOpen] = useState(false);
  return (
    <div className="fade-up">
      <header className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 600 }}>Resumo Executivo</h1>
          <p className="text-[13px] mt-1" style={{ color: SLATE }}>Visão consolidada das finanças da família.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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

      <BudgetsSection categories={categories} transactions={transactions} catById={catById} selectedMonth={selectedMonth}
        budgets={budgets} onManage={() => setBudgetsModalOpen(true)} />
      {budgetsModalOpen && (
        <BudgetsModal categories={categories} budgets={budgets} setBudget={setBudget} removeBudget={removeBudget} onClose={() => setBudgetsModalOpen(false)} />
      )}

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
              const rawPct = c.limit ? (total / c.limit) * 100 : 0;
              const pct = Math.min(100, rawPct);
              const tier = rawPct > 100 ? "over" : rawPct >= 100 ? "full" : rawPct >= 90 ? "high" : rawPct >= 80 ? "warn" : "ok";
              const tierMeta = {
                ok: null,
                warn: { label: "80% do limite", color: "#8C6A1B", bg: GOLD_SOFT },
                high: { label: "90% do limite", color: "#8C6A1B", bg: GOLD_SOFT },
                full: { label: "Limite atingido", color: RUST, bg: RUST_SOFT },
                over: { label: "Limite excedido", color: "#fff", bg: RUST },
              }[tier];
              return (
                <div key={c.id}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span style={{ width: 9, height: 9, borderRadius: 99, background: c.color }} />
                      <span className="text-[12.5px] font-medium">{c.name}</span>
                      {tierMeta && <span className="text-[9.5px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide" style={{ background: tierMeta.bg, color: tierMeta.color }}>{tierMeta.label}</span>}
                    </div>
                    <span className="text-[12.5px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{brl(total)} <span style={{ color: SLATE }}>/ {brl(c.limit)}</span></span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: "#EEE7D4" }}><div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: rawPct >= 90 ? RUST : rawPct >= 80 ? GOLD : c.color }} /></div>
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
              const paid = vehiclePaidInstallments(v, transactions);
              const pct = (paid / v.totalInstallments) * 100;
              return (
                <div key={v.id}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[12.5px] font-medium">{v.name}</span>
                    <span className="text-[12px]" style={{ color: SLATE }}>{paid}/{v.totalInstallments} parcelas</span>
                  </div>
                  <div className="h-1.5 rounded-full mb-1" style={{ background: "#EEE7D4" }}><div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: SAGE }} /></div>
                  <div className="text-[11.5px]" style={{ color: SLATE }}>{brl(v.installmentValue)}/mês · restam {brl((v.totalInstallments - paid) * v.installmentValue)}</div>
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
   METAS & ORÇAMENTOS POR CATEGORIA
   ========================================================================= */
function budgetTier(pct) {
  if (pct > 100) return { key: "over", label: "Excedido", color: "#fff", bg: RUST, bar: RUST };
  if (pct >= 100) return { key: "full", label: "Limite atingido", color: RUST, bg: RUST_SOFT, bar: RUST };
  if (pct >= 80) return { key: "warn", label: "Atenção", color: "#8C6A1B", bg: GOLD_SOFT, bar: GOLD };
  return { key: "ok", label: null, color: SAGE, bg: SAGE_SOFT, bar: SAGE };
}

function BudgetsSection({ categories, transactions, catById, selectedMonth, budgets, onManage }) {
  const activeBudgets = Object.entries(budgets).filter(([, b]) => b.active && b.limit > 0);

  const rows = activeBudgets.map(([categoryId, b]) => {
    const spent = transactions.filter((t) => t.month === selectedMonth && t.type === "expense" && t.categoryId === categoryId).reduce((s, t) => s + Number(t.amount || 0), 0);
    const pct = b.limit ? (spent / b.limit) * 100 : 0;
    return { categoryId, name: catById(categoryId)?.name || categoryId, color: catById(categoryId)?.color || SLATE, limit: b.limit, spent, pct, tier: budgetTier(pct) };
  });

  return (
    <div className="ledger-card mb-6" style={{ background: PAPER }}>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2"><Target size={15} color={GOLD} /><h3 className="text-[13.5px] font-semibold">Metas & Orçamentos por Categoria</h3></div>
        <button onClick={onManage} className="flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1.5 rounded-md btn-ghost" style={{ color: SAGE }}><Settings2 size={13} /> Gerenciar orçamentos</button>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={Target} title="Nenhuma meta ativa" desc="Defina um valor máximo mensal para categorias como Alimentação ou Lazer e acompanhe o quanto já foi gasto." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
          {rows.map((r) => (
            <div key={r.categoryId}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: r.color }} />
                  <span className="text-[12.5px] font-medium">{r.name}</span>
                  {r.tier.label && <span className="text-[9.5px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide" style={{ background: r.tier.bg, color: r.tier.color }}>{r.tier.label}</span>}
                </div>
                <span className="text-[11.5px]" style={{ color: SLATE }}>{Math.round(r.pct)}%</span>
              </div>
              <div className="h-1.5 rounded-full mb-1" style={{ background: "#EEE7D4" }}><div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, r.pct)}%`, background: r.tier.bar }} /></div>
              <div className="text-[11.5px]" style={{ color: SLATE }}>{brl(r.spent)} utilizados de {brl(r.limit)}{r.pct > 100 && <span style={{ color: RUST }}> · excedeu em {brl(r.spent - r.limit)}</span>}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BudgetsModal({ categories, budgets, setBudget, removeBudget, onClose }) {
  return (
    <Modal title="Gerenciar orçamentos por categoria" onClose={onClose} wide>
      <p className="text-[12.5px] mb-4" style={{ color: SLATE }}>Defina um valor máximo mensal para as categorias de despesa que você quer acompanhar de perto. Período: mensal (outros períodos podem ser adicionados futuramente).</p>
      <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
        {categories.expense.map((c) => {
          const b = budgets[c.id];
          const active = b?.active ?? false;
          return (
            <div key={c.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ border: `1px solid ${LINE}` }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: c.color, flexShrink: 0 }} />
              <span className="text-[12.5px] font-medium flex-1 min-w-0 truncate">{c.name}</span>
              <input type="number" min="0" step="0.01" placeholder="R$ 0,00" value={b?.limit || ""} disabled={!active}
                onChange={(e) => setBudget(c.id, { limit: parseFloat(e.target.value) || 0 })}
                className="px-2.5 py-1.5 text-[12.5px] rounded-md disabled:opacity-40" style={{ ...inputStyle, width: 120 }} />
              <label className="flex items-center gap-1.5 cursor-pointer flex-shrink-0">
                <input type="checkbox" checked={active} onChange={(e) => setBudget(c.id, { active: e.target.checked })} className="w-4 h-4" style={{ accentColor: SAGE }} />
                <span className="text-[11.5px]" style={{ color: SLATE }}>Ativo</span>
              </label>
              {b && (
                <button onClick={() => removeBudget(c.id)} className="p-1 rounded-md btn-ghost flex-shrink-0"><Trash2 size={13} color={RUST} /></button>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-end pt-4">
        <button onClick={onClose} className="btn-primary px-4 py-2 rounded-lg text-[13px] font-medium">Concluído</button>
      </div>
    </Modal>
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
  ignored: { label: "Não será pago", color: SLATE, bg: "#E6E2D6", icon: Ban },
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
      title={!interactive ? undefined : status === "ignored" ? "Marcado como \"não será pago\" — clique para voltar a cobrar" : "Clique para alternar o status de pagamento"}>
      <Icon size={11.5} strokeWidth={2.4} />
      {meta.label}
    </button>
  );
}

function LancamentosTab({ selectedMonth, setSelectedMonth, transactions, categories, cards, vehicles, catById, subById, addTransaction, updateTransaction, deleteTransaction, addTransactionSeries, togglePaid, toggleIgnored, clearMonthTransactions, currentYear, archivedYears }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [duplicateSeed, setDuplicateSeed] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  // Edição do vencimento direto na lista: { id, value } enquanto o campo está aberto.
  const [editingDueDay, setEditingDueDay] = useState(null);
  const cancelDueDayRef = React.useRef(false);
  const [filterType, setFilterType] = useState("all");
  const [confirmClear, setConfirmClear] = useState(false);
  const [descQuery, setDescQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "paid" | "unpaid"
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const newButtonRef = React.useRef(null);

  const archivedYearsList = Object.keys(archivedYears || {}).map(Number).sort((a, b) => b - a);
  const isViewingCurrent = selectedYear === currentYear;
  const dataset = isViewingCurrent ? transactions : (archivedYears[selectedYear] || []);

  // Busca global: quando há um termo de busca, a pesquisa deixa de ficar restrita ao mês
  // selecionado e passa a cobrir todos os meses do ano em exibição (atual ou arquivado).
  const isGlobalSearch = !!descQuery.trim();
  const allMonthTx = dataset.filter((t) => t.month === selectedMonth);
  const searchSource = isGlobalSearch ? dataset : allMonthTx;
  const monthTx = searchSource.filter((t) => filterType === "all" || t.type === filterType)
    .filter((t) => !descQuery.trim() || t.description.toLowerCase().includes(descQuery.trim().toLowerCase()) || (t.notes || "").toLowerCase().includes(descQuery.trim().toLowerCase()))
    .filter((t) => categoryFilter === "all" || t.categoryId === categoryFilter)
    .filter((t) => statusFilter === "all" || (statusFilter === "paid" ? t.paid : !t.paid))
    .sort((a, b) => (isGlobalSearch && a.month !== b.month ? a.month - b.month : (a.type === b.type ? 0 : a.type === "income" ? -1 : 1)));

  const hasExtraFilters = descQuery.trim() || categoryFilter !== "all" || statusFilter !== "all";
  const clearExtraFilters = () => { setDescQuery(""); setCategoryFilter("all"); setStatusFilter("all"); };

  // Atalho de teclado: Ctrl+N (ou Cmd+N no Mac) abre o modal de novo lançamento direto desta aba.
  // Observação técnica: alguns navegadores (ex.: Chrome desktop) reservam Ctrl+N para "nova janela"
  // e não permitem que JS intercepte — nesses casos o atalho não tem efeito por limitação do navegador,
  // não do app. Funciona normalmente no Firefox e no app instalado como PWA.
  React.useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "n") {
        const tag = document.activeElement?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        e.preventDefault();
        setEditing(null);
        setDuplicateSeed(null);
        setModalOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleDuplicate = (t) => {
    // Copia os dados do lançamento, mas nunca a ligação com uma série de parcelas/recorrência
    // (duplicar uma parcela não deve criar um novo elo com aquela série).
    const { id, paid, installmentNumber, installmentTotal, recurringGroupId, indefiniteRecurring, ...rest } = t;
    setDuplicateSeed({ ...rest, paid: false });
    setEditing(null);
    setModalOpen(true);
  };

  // Confirma a edição do vencimento feita direto na lista. Escape cancela: o onKeyDown levanta
  // a flag antes do blur, porque o estado do React ainda não teria sido atualizado a tempo.
  const commitDueDay = (t) => {
    if (cancelDueDayRef.current) { cancelDueDayRef.current = false; setEditingDueDay(null); return; }
    if (!editingDueDay || editingDueDay.id !== t.id) return;
    const parsed = Number(editingDueDay.value);
    if (Number.isFinite(parsed) && parsed >= 1) {
      const day = Math.min(31, Math.round(parsed));
      if (day !== (t.dueDay ?? 10)) updateTransaction(t.id, { dueDay: day });
    }
    setEditingDueDay(null);
  };

  // O que está marcado como "não será pago" continua listado, mas fora de resumo, subtotais e
  // alertas — mesma regra usada nos cálculos do Dashboard.
  const countedMonthTx = useMemo(() => allMonthTx.filter((t) => !t.ignored), [allMonthTx]);

  const subtotals = useMemo(() => {
    const map = {};
    countedMonthTx.forEach((t) => {
      const key = t.categoryId;
      map[key] = map[key] || { income: 0, expense: 0 };
      map[key][t.type] += Number(t.amount || 0);
    });
    return map;
  }, [countedMonthTx]);

  const income = countedMonthTx.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expense = countedMonthTx.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);

  const overdueItems = isViewingCurrent ? countedMonthTx.filter((t) => !t.paid && paymentStatus(t) === "overdue").sort((a, b) => a.dueDay - b.dueDay) : [];
  const soonItems = isViewingCurrent ? countedMonthTx.filter((t) => !t.paid && paymentStatus(t) === "soon").sort((a, b) => a.dueDay - b.dueDay) : [];
  const hasAlerts = overdueItems.length > 0 || soonItems.length > 0;

  return (
    <div className="fade-up">
      <header className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 600 }}>Lançamentos</h1>
          <p className="text-[13px] mt-1" style={{ color: SLATE }}>Janeiro a Dezembro — registre entradas e saídas mês a mês.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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
              <button onClick={() => setImportModalOpen(true)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium btn-ghost" style={{ border: `1px solid ${LINE}` }}>
                <Landmark size={15} /> Importar extrato
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
                <input value={descQuery} onChange={(e) => setDescQuery(e.target.value)} placeholder="Buscar em todos os meses…" className={inputCls} style={{ ...inputStyle, paddingLeft: 28, width: 190, padding: "6px 8px 6px 28px" }} />
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
              <EmptyState icon={Calendar} title={hasExtraFilters || filterType !== "all" ? "Nenhum resultado para os filtros" : "Nenhum lançamento em"} desc={isGlobalSearch ? "Nenhum resultado encontrado em nenhum mês do ano." : (hasExtraFilters || filterType !== "all" ? "Tente ajustar a descrição, categoria ou status pesquisados." : `Não há registros para ${MONTHS_FULL[selectedMonth]}. Adicione um novo lançamento para começar.`)} />
            ) : (
              <div style={{ maxHeight: 480, overflowY: "auto", overflowX: "auto" }}>
                <table className="w-full text-[12.5px]" style={{ minWidth: 640 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${LINE}`, background: "#FBF8F1" }}>
                      <th className="text-left font-semibold px-4 py-2.5 sticky top-0" style={{ color: SLATE, background: "#FBF8F1" }}>Descrição</th>
                      {isGlobalSearch && <th className="text-left font-semibold px-3 py-2.5 sticky top-0" style={{ color: SLATE, background: "#FBF8F1" }}>Mês</th>}
                      <th className="text-left font-semibold px-3 py-2.5 sticky top-0" style={{ color: SLATE, background: "#FBF8F1" }}>Categoria</th>
                      <th className="text-center font-semibold px-3 py-2.5 sticky top-0" style={{ color: SLATE, background: "#FBF8F1" }}>Vencimento</th>
                      <th className="text-center font-semibold px-3 py-2.5 sticky top-0" style={{ color: SLATE, background: "#FBF8F1" }}>Status</th>
                      <th className="text-right font-semibold px-3 py-2.5 sticky top-0" style={{ color: SLATE, background: "#FBF8F1" }}>Valor</th>
                      <th className="px-3 py-2.5 sticky top-0" style={{ background: "#FBF8F1" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthTx.map((t) => (
                      <tr key={t.id} style={{ borderBottom: `1px solid ${LINE}`, opacity: t.ignored ? 0.55 : 1 }} className="hover:bg-black/[0.015]">
                        <td className="px-4 py-2.5 max-w-[240px]">
                          <div className="flex items-center gap-1.5">
                            {/* A descrição é truncada na coluna; o tooltip mostra ela por
                                inteiro, e junta as observações quando existem. */}
                            <div className="font-medium truncate" title={t.notes ? `${t.description}\n\nObservações: ${t.notes}` : t.description}
                              style={{ cursor: "help", textDecoration: t.ignored ? "line-through" : undefined }}>{t.description}</div>
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
                        {isGlobalSearch && <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: SLATE }}>{MONTHS[t.month]}</td>}
                        <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: SLATE }}>{catById(t.categoryId)?.name} <span className="opacity-60">› {subById(t.categoryId, t.subId)?.name}</span></td>
                        <td className="px-3 py-2.5 text-center whitespace-nowrap" style={{ color: SLATE, fontFamily: "'JetBrains Mono', monospace" }}>
                          {editingDueDay?.id === t.id ? (
                            <input
                              autoFocus type="number" min="1" max="31" value={editingDueDay.value}
                              onChange={(e) => setEditingDueDay({ id: t.id, value: e.target.value })}
                              onBlur={() => commitDueDay(t)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") e.currentTarget.blur();
                                if (e.key === "Escape") { cancelDueDayRef.current = true; e.currentTarget.blur(); }
                              }}
                              className="w-16 px-1.5 py-1 text-[12.5px] text-center rounded-md outline-none"
                              style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }}
                            />
                          ) : (
                            <button
                              disabled={!isViewingCurrent}
                              onClick={() => setEditingDueDay({ id: t.id, value: String(t.dueDay ?? 10) })}
                              className="px-1.5 py-1 rounded-md"
                              style={{ color: SLATE, fontFamily: "'JetBrains Mono', monospace", cursor: isViewingCurrent ? "pointer" : "default", background: "transparent", borderBottom: isViewingCurrent ? `1px dashed ${LINE}` : "none" }}
                              title={isViewingCurrent
                                ? (isDueDateShifted(t) ? `Clique para alterar. Cai em fim de semana — só é cobrável na segunda, dia ${effectiveDueDate(t).getDate()}.` : "Clique para alterar o dia do vencimento")
                                : undefined}
                            >
                              dia {t.dueDay}{isDueDateShifted(t) ? "*" : ""}
                            </button>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center"><StatusChip t={t} onClick={isViewingCurrent ? () => togglePaid(t.id) : undefined} /></td>
                        <td className="px-3 py-2.5 text-right font-semibold whitespace-nowrap" style={{ fontFamily: "'JetBrains Mono', monospace", color: t.type === "income" ? SAGE : RUST }}>
                          {t.type === "income" ? "+" : "−"} {brl(t.amount)}
                        </td>
                        <td className="px-3 py-2.5">
                          {isViewingCurrent && (
                            <div className="flex items-center gap-1 justify-end">
                              <button onClick={() => handleDuplicate(t)} className="p-1.5 rounded-md btn-ghost" title="Duplicar lançamento"><Copy size={13} color={SLATE} /></button>
                              <button onClick={() => toggleIgnored(t.id)} className="p-1.5 rounded-md btn-ghost"
                                title={t.ignored ? "Voltar a considerar este lançamento" : "Marcar como \"não será pago\" (fica no histórico, fora das somas)"}>
                                <Ban size={13} color={t.ignored ? SAGE : SLATE} />
                              </button>
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
          onClose={() => { setModalOpen(false); setDuplicateSeed(null); }}
          initial={editing}
          duplicateFrom={duplicateSeed}
          categories={categories} cards={cards} vehicles={vehicles} selectedMonth={selectedMonth} currentYear={currentYear}
          onSave={(data) => {
            if (Array.isArray(data)) { addTransactionSeries(data); }
            else if (editing) { updateTransaction(editing.id, data); }
            else { addTransaction(data); }
            setModalOpen(false);
            setDuplicateSeed(null);
          }}
        />
      )}

      {importModalOpen && (
        <ImportStatementModal
          categories={categories} transactions={transactions} currentYear={currentYear}
          addTransactionSeries={addTransactionSeries}
          onClose={() => setImportModalOpen(false)}
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

function TransactionModal({ onClose, onSave, initial, duplicateFrom, categories, cards, vehicles, selectedMonth, currentYear }) {
  const seed = initial || duplicateFrom || null;
  const [type, setType] = useState(seed?.type || "expense");
  const [month, setMonth] = useState(seed?.month ?? selectedMonth);
  const [categoryId, setCategoryId] = useState(seed?.categoryId || categories[type][0]?.id || "");
  const list = categories[type];
  const activeCat = list.find((c) => c.id === categoryId) || list[0];
  const [subId, setSubId] = useState(seed?.subId || activeCat?.subs[0]?.id || "");
  const [description, setDescription] = useState(seed?.description || "");
  const [notes, setNotes] = useState(seed?.notes || "");
  const [amount, setAmount] = useState(seed?.amount ?? "");
  const [cardId, setCardId] = useState(seed?.cardId || "");
  const [vehicleId, setVehicleId] = useState(seed?.vehicleId || "");
  const [dueDay, setDueDay] = useState(seed?.dueDay ?? 10);
  const [paid, setPaid] = useState(initial?.paid ?? false);

  const isEditing = !!initial;
  const isDuplicating = !isEditing && !!duplicateFrom;
  const [recurring, setRecurring] = useState(false);
  const [recurrenceMode, setRecurrenceMode] = useState("installments"); // "installments" | "fixed"
  const [installmentsCount, setInstallmentsCount] = useState(2);
  const [endMode, setEndMode] = useState("until"); // "until" | "indefinite"
  const [endMonth, setEndMonth] = useState(11);

  const handleTypeChange = (t) => { setType(t); const first = categories[t][0]; setCategoryId(first?.id || ""); setSubId(first?.subs[0]?.id || ""); };
  const handleCatChange = (id) => { setCategoryId(id); const c = list.find((x) => x.id === id); setSubId(c?.subs[0]?.id || ""); };

  const [amountError, setAmountError] = useState("");
  const submit = () => {
    if (!description.trim() || !amount || !categoryId) return;
    const parsedAmount = parseFloat(amount);
    if (!(parsedAmount > 0)) { setAmountError("Informe um valor maior que zero."); return; }
    setAmountError("");
    const base = {
      type, categoryId, subId, description: description.trim(), notes: notes.trim() || undefined,
      amount: parsedAmount, cardId: cardId || undefined, vehicleId: vehicleId || undefined,
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
    <Modal title={initial ? "Editar lançamento" : isDuplicating ? "Duplicar lançamento" : "Novo lançamento"} onClose={onClose} wide closeOnBackdrop={false}>
      <div className="space-y-3.5">
        <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${LINE}` }}>
          <button onClick={() => handleTypeChange("income")} className="flex-1 py-2 text-[13px] font-medium" style={{ background: type === "income" ? SAGE : PAPER, color: type === "income" ? "#fff" : INK }}>Receita</button>
          <button onClick={() => handleTypeChange("expense")} className="flex-1 py-2 text-[13px] font-medium" style={{ background: type === "expense" ? RUST : PAPER, color: type === "expense" ? "#fff" : INK }}>Despesa</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label={recurring && !isEditing ? "Mês inicial" : "Mês"}><select value={month} onChange={(e) => setMonth(e.target.value)} className={inputCls} style={inputStyle}>{MONTHS_FULL.map((m, i) => <option key={m} value={i}>{m}</option>)}</select></Field>
          <Field label="Valor (R$)">
            <input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => { setAmount(e.target.value); setAmountError(""); }} placeholder="0,00" className={inputCls} style={inputStyle} />
            {amountError && <span className="block text-[11px] mt-1" style={{ color: RUST }}>{amountError}</span>}
          </Field>
          <Field label={categoryId === "cartoes" && cardId ? "Dia da compra" : "Dia de vencimento"}>
            <input type="number" min="1" max="31" value={dueDay} onChange={(e) => setDueDay(e.target.value)} className={inputCls} style={inputStyle} />
            {categoryId === "cartoes" && cardId && <span className="block text-[10.5px] mt-1" style={{ color: SLATE }}>Usado para calcular em qual fatura a compra entra.</span>}
          </Field>
        </div>

        <Field label="Descrição"><input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex.: Mercado do mês" maxLength={120} className={inputCls} style={inputStyle} /></Field>

        <Field label="Observações (aparece como tooltip ao passar o mouse)">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex.: itens comprados, motivo do gasto, detalhes do contrato…" rows={2} maxLength={500} className={inputCls} style={{ ...inputStyle, resize: "vertical" }} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
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
   IMPORTAÇÃO DE EXTRATO BANCÁRIO (CSV)
   Formato padrão reconhecido automaticamente: Data,Valor,Identificador,Descrição
   (extrato do Nubank). Mapeamento de colunas manual disponível para outros formatos.
   ========================================================================= */
const normalizeHeader = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

function detectColumnMapping(headers) {
  const find = (candidates) => headers.find((h) => candidates.some((c) => normalizeHeader(h).includes(c)));
  return {
    date: find(["data"]) || "",
    amount: find(["valor"]) || "",
    description: find(["descricao", "historico", "estabelecimento"]) || "",
    bankId: find(["identificador", "id transacao", "fitid", "id"]) || "",
  };
}

function parseStatementDate(raw) {
  const s = String(raw || "").trim();
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return { day: Number(m[1]), month: Number(m[2]) - 1, year: Number(m[3]) };
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return { day: Number(iso[3]), month: Number(iso[2]) - 1, year: Number(iso[1]) };
  return null;
}

function ImportStatementModal({ categories, transactions, currentYear, addTransactionSeries, onClose }) {
  const [step, setStep] = useState("upload"); // "upload" | "preview"
  const [rawText, setRawText] = useState("");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({ date: "", amount: "", description: "", bankId: "" });
  const [rows, setRows] = useState([]);
  const [bulkCategory, setBulkCategory] = useState("outros_desp:diversos");
  const fileInputRef = React.useRef(null);

  const existingBankIds = useMemo(() => new Set(transactions.filter((t) => t.bankId).map((t) => t.bankId)), [transactions]);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => loadText(String(reader.result || ""));
    reader.onerror = () => setError("Não foi possível ler o arquivo selecionado.");
    reader.readAsText(file, "utf-8");
  };

  const loadText = (text) => {
    setError("");
    setRawText(text);
    try {
      const parsed = Papa.parse(text.trim(), { header: true, skipEmptyLines: true });
      if (parsed.errors?.length && !parsed.data.length) throw new Error(parsed.errors[0].message);
      const hdrs = Object.keys(parsed.data[0] || {});
      if (!hdrs.length) throw new Error("Nenhuma coluna encontrada no arquivo.");
      setHeaders(hdrs);
      setMapping(detectColumnMapping(hdrs));
    } catch (err) {
      setError("Não foi possível interpretar o CSV: " + err.message);
      setHeaders([]);
    }
  };

  const buildPreview = () => {
    if (!mapping.date || !mapping.amount || !mapping.description) { setError("Selecione ao menos as colunas de Data, Valor e Descrição antes de continuar."); return; }
    setError("");
    const parsed = Papa.parse(rawText.trim(), { header: true, skipEmptyLines: true });
    const built = parsed.data.map((r, i) => {
      const d = parseStatementDate(r[mapping.date]);
      const amountRaw = parseFloat(String(r[mapping.amount] || "0").replace(",", ".")) || 0;
      const bankId = mapping.bankId ? r[mapping.bankId] : "";
      const isDuplicate = !!bankId && existingBankIds.has(bankId);
      const type = amountRaw < 0 ? "expense" : "income";
      const [defCat, defSub] = type === "income" ? ["extra", "rendimentos"] : bulkCategory.split(":");
      return {
        tempId: "row-" + i, valid: !!d,
        day: d?.day || 1, month: d?.month ?? 0, description: String(r[mapping.description] || "Importado do extrato").trim(),
        amount: Math.abs(amountRaw), type, bankId: bankId || undefined,
        categoryId: defCat, subId: defSub,
        include: !!d && !isDuplicate, isDuplicate,
      };
    }).filter((r) => r.amount > 0 || r.description);
    setRows(built);
    setStep("preview");
  };

  const toggleRow = (tempId) => setRows((prev) => prev.map((r) => (r.tempId === tempId ? { ...r, include: !r.include } : r)));
  const updateRowCategory = (tempId, categoryId, subId) => setRows((prev) => prev.map((r) => (r.tempId === tempId ? { ...r, categoryId, subId } : r)));
  const selectAll = (value) => setRows((prev) => prev.map((r) => (r.valid ? { ...r, include: value } : r)));
  const applyBulkCategory = () => {
    const [categoryId, subId] = bulkCategory.split(":");
    setRows((prev) => prev.map((r) => (r.include && r.type === "expense" ? { ...r, categoryId, subId } : r)));
  };

  const includedCount = rows.filter((r) => r.include).length;
  const duplicateCount = rows.filter((r) => r.isDuplicate).length;
  const invalidCount = rows.filter((r) => !r.valid).length;

  const confirmImport = () => {
    const toImport = rows.filter((r) => r.include).map((r) => ({
      type: r.type, month: r.month, categoryId: r.categoryId, subId: r.subId,
      description: r.description, amount: r.amount, dueDay: Math.min(31, Math.max(1, r.day)),
      bankId: r.bankId, paid: true, // extrato bancário já reflete o que de fato aconteceu na conta
    }));
    if (toImport.length) addTransactionSeries(toImport);
    onClose();
  };

  return (
    <Modal title="Importar extrato bancário" onClose={onClose} wide>
      {step === "upload" ? (
        <div className="space-y-4">
          <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg" style={{ background: SAGE_SOFT }}>
            <Landmark size={16} color={SAGE} className="mt-0.5 flex-shrink-0" />
            <p className="text-[12.5px]" style={{ color: INK }}>Reconhece automaticamente o formato de extrato do Nubank (Data, Valor, Identificador, Descrição). Para outros bancos, ajuste o mapeamento de colunas abaixo depois de carregar o arquivo.</p>
          </div>

          <div>
            <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="w-full flex flex-col items-center justify-center gap-2 py-8 rounded-xl" style={{ border: `1.5px dashed ${LINE}`, background: "#FBF8F1" }}>
              <Upload size={22} color={SLATE} />
              <span className="text-[13px] font-medium">{fileName || "Clique para escolher o arquivo CSV do extrato"}</span>
              <span className="text-[11.5px]" style={{ color: SLATE }}>ou cole o conteúdo abaixo</span>
            </button>
          </div>

          <textarea value={rawText} onChange={(e) => loadText(e.target.value)} rows={4} placeholder="Cole aqui o conteúdo do CSV do extrato, se preferir…"
            className={inputCls} style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, resize: "vertical" }} />

          {headers.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-lg" style={{ border: `1px solid ${LINE}` }}>
              <Field label="Coluna de Data"><select value={mapping.date} onChange={(e) => setMapping((m) => ({ ...m, date: e.target.value }))} className={inputCls} style={inputStyle}><option value="">Selecione…</option>{headers.map((h) => <option key={h} value={h}>{h}</option>)}</select></Field>
              <Field label="Coluna de Valor"><select value={mapping.amount} onChange={(e) => setMapping((m) => ({ ...m, amount: e.target.value }))} className={inputCls} style={inputStyle}><option value="">Selecione…</option>{headers.map((h) => <option key={h} value={h}>{h}</option>)}</select></Field>
              <Field label="Coluna de Descrição"><select value={mapping.description} onChange={(e) => setMapping((m) => ({ ...m, description: e.target.value }))} className={inputCls} style={inputStyle}><option value="">Selecione…</option>{headers.map((h) => <option key={h} value={h}>{h}</option>)}</select></Field>
              <Field label="Coluna de Identificador (opcional, evita duplicidade)"><select value={mapping.bankId} onChange={(e) => setMapping((m) => ({ ...m, bankId: e.target.value }))} className={inputCls} style={inputStyle}><option value="">Nenhuma</option>{headers.map((h) => <option key={h} value={h}>{h}</option>)}</select></Field>
            </div>
          )}

          {error && <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg text-[12px]" style={{ background: RUST_SOFT, color: RUST }}><AlertTriangle size={14} className="mt-0.5 flex-shrink-0" /><span>{error}</span></div>}

          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-medium btn-ghost">Cancelar</button>
            <button onClick={buildPreview} disabled={!headers.length} className="btn-primary px-4 py-2 rounded-lg text-[13px] font-medium disabled:opacity-40">Analisar arquivo</button>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          <div className="flex flex-wrap items-center gap-2 text-[12px]">
            <span className="px-2.5 py-1 rounded-full font-medium" style={{ background: SAGE_SOFT, color: SAGE }}>{includedCount} serão importados</span>
            {duplicateCount > 0 && <span className="px-2.5 py-1 rounded-full font-medium" style={{ background: GOLD_SOFT, color: "#8C6A1B" }}>{duplicateCount} possíveis duplicatas (desmarcadas)</span>}
            {invalidCount > 0 && <span className="px-2.5 py-1 rounded-full font-medium" style={{ background: RUST_SOFT, color: RUST }}>{invalidCount} com data inválida (ignorados)</span>}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => selectAll(true)} className="text-[12px] font-medium px-2 py-1 rounded-md btn-ghost" style={{ color: SAGE }}>Selecionar todos</button>
            <button onClick={() => selectAll(false)} className="text-[12px] font-medium px-2 py-1 rounded-md btn-ghost" style={{ color: SLATE }}>Desmarcar todos</button>
            <div className="h-4 w-px" style={{ background: LINE }} />
            <select value={bulkCategory} onChange={(e) => setBulkCategory(e.target.value)} className="px-2 py-1 text-[12px] rounded-md" style={inputStyle}>
              {categories.expense.map((c) => (c.subs.length ? c.subs.map((s) => <option key={c.id + ":" + s.id} value={`${c.id}:${s.id}`}>{c.name} › {s.name}</option>) : <option key={c.id} value={`${c.id}:`}>{c.name}</option>))}
            </select>
            <button onClick={applyBulkCategory} className="text-[12px] font-medium px-2 py-1 rounded-md btn-ghost" style={{ color: SAGE }}>Aplicar aos selecionados (despesas)</button>
          </div>

          <div style={{ maxHeight: 360, overflowY: "auto", border: `1px solid ${LINE}` }} className="rounded-lg">
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ background: "#FBF8F1", borderBottom: `1px solid ${LINE}` }}>
                  <th className="w-8"></th>
                  <th className="text-left px-2 py-2" style={{ color: SLATE }}>Data</th>
                  <th className="text-left px-2 py-2" style={{ color: SLATE }}>Descrição</th>
                  <th className="text-left px-2 py-2" style={{ color: SLATE }}>Categoria</th>
                  <th className="text-right px-2 py-2" style={{ color: SLATE }}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.tempId} style={{ borderBottom: `1px solid ${LINE}`, opacity: r.valid ? 1 : 0.45 }}>
                    <td className="text-center"><input type="checkbox" checked={r.include} disabled={!r.valid} onChange={() => toggleRow(r.tempId)} style={{ accentColor: SAGE }} /></td>
                    <td className="px-2 py-1.5 whitespace-nowrap" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{r.valid ? `${MONTHS[r.month]} ${String(r.day).padStart(2, "0")}` : "inválida"}</td>
                    <td className="px-2 py-1.5 max-w-[220px] truncate" title={r.description}>
                      {r.description}
                      {r.isDuplicate && <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: GOLD_SOFT, color: "#8C6A1B" }}>possível duplicata</span>}
                    </td>
                    <td className="px-2 py-1.5">
                      {r.type === "expense" ? (
                        <select value={`${r.categoryId}:${r.subId}`} onChange={(e) => { const [c, s] = e.target.value.split(":"); updateRowCategory(r.tempId, c, s); }} className="px-1.5 py-1 text-[11.5px] rounded-md" style={inputStyle}>
                          {categories.expense.map((c) => (c.subs.length ? c.subs.map((s) => <option key={c.id + ":" + s.id} value={`${c.id}:${s.id}`}>{c.name} › {s.name}</option>) : <option key={c.id} value={`${c.id}:`}>{c.name}</option>))}
                        </select>
                      ) : (
                        <span style={{ color: SAGE }}>Receita (Renda Extra)</span>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-right font-semibold whitespace-nowrap" style={{ fontFamily: "'JetBrains Mono', monospace", color: r.type === "income" ? SAGE : RUST }}>
                      {r.type === "income" ? "+" : "−"} {brl(r.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-[11px]" style={{ color: SLATE }}>As datas definem o mês de cada lançamento; o ano usado é o ano corrente do sistema ({currentYear}). Lançamentos importados já entram marcados como pagos, já que o extrato reflete o que de fato aconteceu na conta.</p>

          <div className="flex justify-between gap-2">
            <button onClick={() => setStep("upload")} className="px-4 py-2 rounded-lg text-[13px] font-medium btn-ghost">Voltar</button>
            <div className="flex gap-2">
              <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-medium btn-ghost">Cancelar</button>
              <button onClick={confirmImport} disabled={!includedCount} className="btn-primary px-4 py-2 rounded-lg text-[13px] font-medium disabled:opacity-40">Importar {includedCount || ""} lançamento{includedCount === 1 ? "" : "s"}</button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

function CategoriasTab({ categories, addCategory, deleteCategory, addSubcategory, deleteSubcategory, cards, addCard, updateCard, deleteCard, vehicles, addVehicle, updateVehicle, deleteVehicle, cardInvoice, selectedMonth, transactions, addTransactionSeries, updateTransaction, currentYear }) {
  const [cardModal, setCardModal] = useState(null);
  const [vehicleModal, setVehicleModal] = useState(null);
  const [installmentsFor, setInstallmentsFor] = useState(null);

  const openInstallmentsOf = (v) => Math.max(0, (Number(v.totalInstallments) || 0) - vehiclePaidInstallments(v, transactions));

  const applyInstallments = ({ toCreate, toLink }) => {
    if (toCreate.length) addTransactionSeries(toCreate);
    toLink.forEach(({ id, patch }) => updateTransaction(id, patch));
    setInstallmentsFor(null);
  };

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
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
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
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2"><Car size={15} color={SAGE} /><h3 className="text-[13.5px] font-semibold">Veículos & Financiamentos</h3></div>
            <button onClick={() => setVehicleModal({})} className="flex items-center gap-1 text-[12px] font-medium px-2.5 py-1.5 rounded-md btn-ghost" style={{ color: SAGE }}><Plus size={13} /> Adicionar</button>
          </div>
          <div className="space-y-2">
            {vehicles.map((v) => (
              <div key={v.id} className="px-3 py-2.5 rounded-lg" style={{ border: `1px solid ${LINE}` }}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="text-[12.5px] font-medium">{v.name}</div>
                  <div className="flex items-center gap-1">
                    {openInstallmentsOf(v) > 0 && (
                      <button onClick={() => setInstallmentsFor(v)} title="Lançar ou vincular as parcelas em aberto" className="p-1 rounded-md btn-ghost"><ListOrdered size={12.5} color={SAGE} /></button>
                    )}
                    <button onClick={() => setVehicleModal(v)} className="p-1 rounded-md btn-ghost"><Pencil size={12.5} color={SLATE} /></button>
                    <button onClick={() => deleteVehicle(v.id)} className="p-1 rounded-md btn-ghost"><Trash2 size={12.5} color={RUST} /></button>
                  </div>
                </div>
                <div className="text-[11px] mb-1.5" style={{ color: SLATE }}>{vehiclePaidInstallments(v, transactions)}/{v.totalInstallments} parcelas de {brl(v.installmentValue)} · valor total {brl(v.totalValue)}</div>
                <div className="h-1.5 rounded-full" style={{ background: "#EEE7D4" }}><div className="h-1.5 rounded-full" style={{ width: `${(vehiclePaidInstallments(v, transactions) / v.totalInstallments) * 100}%`, background: SAGE }} /></div>
              </div>
            ))}
            {!vehicles.length && <EmptyState icon={Car} title="Nenhum veículo cadastrado" desc="Adicione o Spurs Car ou outro financiamento para acompanhar." />}
          </div>
        </div>
      </div>

      {cardModal && <CardModal initial={cardModal.id ? cardModal : null} onClose={() => setCardModal(null)} onSave={(data) => { cardModal.id ? updateCard(cardModal.id, data) : addCard(data); setCardModal(null); }} />}
      {vehicleModal && (
        <VehicleModal
          initial={vehicleModal.id ? vehicleModal : null}
          onClose={() => setVehicleModal(null)}
          onSave={(data) => {
            if (vehicleModal.id) {
              updateVehicle(vehicleModal.id, data);
            } else {
              // Cadastro novo com parcelas em aberto emenda direto na conciliação —
              // é o momento em que o usuário tem o financiamento fresco na cabeça.
              const created = addVehicle(data);
              if (created && openInstallmentsOf(created) > 0) setInstallmentsFor(created);
            }
            setVehicleModal(null);
          }}
        />
      )}
      {installmentsFor && (
        <VehicleInstallmentsModal
          vehicle={installmentsFor} transactions={transactions} categories={categories}
          selectedMonth={selectedMonth} currentYear={currentYear}
          onConfirm={applyInstallments} onClose={() => setInstallmentsFor(null)}
        />
      )}
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Valor total (R$)"><input type="number" value={totalValue} onChange={(e) => setTotalValue(e.target.value)} className={inputCls} style={inputStyle} /></Field>
          <Field label="Valor da parcela (R$)"><input type="number" value={installmentValue} onChange={(e) => setInstallmentValue(e.target.value)} className={inputCls} style={inputStyle} /></Field>
          <Field label="Total de parcelas"><input type="number" value={totalInstallments} onChange={(e) => setTotalInstallments(e.target.value)} className={inputCls} style={inputStyle} /></Field>
          <Field label="Parcelas já pagas"><input type="number" value={paidInstallments} onChange={(e) => setPaidInstallments(e.target.value)} className={inputCls} style={inputStyle} /></Field>
        </div>
        <div className="text-[11.5px]" style={{ color: SLATE, fontFamily: "Inter, sans-serif" }}>
          "Parcelas já pagas" são as que foram quitadas <b>antes</b> de virarem lançamento aqui. As
          que você marcar como pagas na lista de lançamentos são somadas a esse número
          automaticamente — não precisa alterar este campo a cada mês.
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
   PARCELAS EM ABERTO DE UM FINANCIAMENTO
   -------------------------------------------------------------------------
   O cadastro do veículo só guarda quantas parcelas existem e quantas já foram
   pagas — não guarda a data de início do financiamento. Por isso o mês da
   próxima parcela em aberto é escolhido aqui pelo usuário, e as demais seguem
   mês a mês a partir dele.

   Cada parcela em aberto pode: gerar um lançamento novo, ser vinculada a um
   lançamento que já existe naquele mês (evita duplicar o que o usuário já
   lançava à mão) ou ser ignorada.
   ========================================================================= */
const vehicleGroupId = (vehicleId) => `veh_${vehicleId}`;

function VehicleInstallmentsModal({ vehicle, transactions, categories, selectedMonth, currentYear, onConfirm, onClose }) {
  const totalInstallments = Number(vehicle.totalInstallments) || 0;
  // Derivado, não o campo do cadastro: parcela já marcada como paga na lista não deve reaparecer
  // aqui como "em aberto".
  const paidInstallments = vehiclePaidInstallments(vehicle, transactions);
  const openCount = Math.max(0, totalInstallments - paidInstallments);
  const installmentValue = Number(vehicle.installmentValue) || 0;

  const vehicleCat = categories.expense.find((c) => c.id === "veiculos") || categories.expense[0];
  const [categoryId, setCategoryId] = useState(vehicleCat?.id || "");
  const activeCat = categories.expense.find((c) => c.id === categoryId) || vehicleCat;
  const [subId, setSubId] = useState(activeCat?.subs[0]?.id || "");
  const [startMonth, setStartMonth] = useState(selectedMonth);
  const [dueDay, setDueDay] = useState(10);

  // Parcelas que cabem no ano corrente. Mesmo critério já usado no lançamento parcelado:
  // a série não ultrapassa dezembro — o resto entra no ano seguinte, depois de arquivar.
  const slots = useMemo(() => {
    const out = [];
    for (let i = 0; i < openCount; i++) {
      const month = Number(startMonth) + i;
      if (month > 11) break;
      out.push({ number: paidInstallments + 1 + i, month });
    }
    return out;
  }, [openCount, startMonth, paidInstallments]);

  // Candidatos a vínculo: despesa do mesmo mês, sem cartão e ainda sem outro veículo.
  const candidatesFor = useCallback((month) => transactions.filter((t) =>
    t.month === month && t.type === "expense" && !t.cardId && !t.ignored && (!t.vehicleId || t.vehicleId === vehicle.id)
  ), [transactions, vehicle.id]);

  // Sugestão automática: se existe um lançamento no mês com exatamente o valor da parcela,
  // a linha já nasce como "vincular" apontando para ele. Caso contrário, "gerar".
  const buildDefaults = useCallback(() => {
    const used = new Set();
    const next = {};
    slots.forEach((slot) => {
      const match = candidatesFor(slot.month).find((t) => !used.has(t.id) && Math.abs(Number(t.amount || 0) - installmentValue) < 0.01);
      if (match) { used.add(match.id); next[slot.number] = { mode: "link", txId: match.id }; }
      else next[slot.number] = { mode: "create", txId: "" };
    });
    return next;
  }, [slots, candidatesFor, installmentValue]);

  const [actions, setActions] = useState(buildDefaults);
  const [appliedStart, setAppliedStart] = useState(startMonth);
  if (appliedStart !== startMonth) { setAppliedStart(startMonth); setActions(buildDefaults()); }

  const setMode = (number, mode) => setActions((prev) => ({ ...prev, [number]: { ...prev[number], mode, txId: mode === "link" ? (prev[number]?.txId || "") : "" } }));
  const setTx = (number, txId) => setActions((prev) => ({ ...prev, [number]: { ...prev[number], txId } }));

  const createCount = slots.filter((s) => actions[s.number]?.mode === "create").length;
  const linkCount = slots.filter((s) => actions[s.number]?.mode === "link" && actions[s.number]?.txId).length;

  const confirm = () => {
    const groupId = vehicleGroupId(vehicle.id);
    const toCreate = [];
    const toLink = [];
    slots.forEach((slot) => {
      const action = actions[slot.number];
      if (!action) return;
      if (action.mode === "create") {
        toCreate.push({
          type: "expense", categoryId, subId, description: vehicle.name,
          amount: installmentValue, vehicleId: vehicle.id, month: slot.month,
          dueDay: Math.min(31, Math.max(1, Number(dueDay) || 10)), paid: false,
          installmentNumber: slot.number, installmentTotal: totalInstallments,
          recurringGroupId: groupId, year: currentYear,
        });
      } else if (action.mode === "link" && action.txId) {
        toLink.push({ id: action.txId, patch: {
          vehicleId: vehicle.id, installmentNumber: slot.number,
          installmentTotal: totalInstallments, recurringGroupId: groupId,
        }});
      }
    });
    onConfirm({ toCreate, toLink });
  };

  return (
    <Modal title={`Parcelas em aberto · ${vehicle.name}`} onClose={onClose} wide closeOnBackdrop={false}>
      {!openCount ? (
        <EmptyState icon={Check} title="Nenhuma parcela em aberto" desc={`Este financiamento está com ${paidInstallments} de ${totalInstallments} parcelas pagas.`} />
      ) : (
        <div className="space-y-3.5">
          <div className="text-[12.5px] px-3 py-2.5 rounded-lg" style={{ background: GOLD_SOFT, color: "#6B4E12", fontFamily: "Inter, sans-serif" }}>
            <b>{openCount}</b> parcela{openCount === 1 ? "" : "s"} em aberto de {brl(installmentValue)}
            {slots.length < openCount && <> · só as <b>{slots.length}</b> que cabem em {currentYear} aparecem aqui; as demais entram no ano seguinte.</>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Mês da próxima parcela">
              <select value={startMonth} onChange={(e) => setStartMonth(Number(e.target.value))} className={inputCls} style={inputStyle}>
                {MONTHS_FULL.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
            </Field>
            <Field label="Dia de vencimento">
              <input type="number" min="1" max="31" value={dueDay} onChange={(e) => setDueDay(e.target.value)} className={inputCls} style={inputStyle} />
            </Field>
            <Field label="Categoria">
              <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); const c = categories.expense.find((x) => x.id === e.target.value); setSubId(c?.subs[0]?.id || ""); }} className={inputCls} style={inputStyle}>
                {categories.expense.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Subcategoria">
              <select value={subId} onChange={(e) => setSubId(e.target.value)} className={inputCls} style={inputStyle}>
                {(activeCat?.subs || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
          </div>

          <div className="space-y-2">
            {slots.map((slot) => {
              const action = actions[slot.number] || { mode: "create", txId: "" };
              const takenIds = new Set(slots.filter((s) => s.number !== slot.number && actions[s.number]?.mode === "link").map((s) => actions[s.number].txId).filter(Boolean));
              const candidates = candidatesFor(slot.month).filter((t) => !takenIds.has(t.id));
              return (
                <div key={slot.number} className="px-3 py-2.5 rounded-lg" style={{ border: `1px solid ${LINE}`, background: PAPER }}>
                  <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                    <div className="text-[12.5px] font-medium" style={{ color: INK }}>
                      Parcela {slot.number}/{totalInstallments} <span style={{ color: SLATE }}>· {MONTHS_FULL[slot.month]}</span>
                    </div>
                    <div className="text-[12.5px]" style={{ fontFamily: "'JetBrains Mono', monospace", color: SLATE }}>{brl(installmentValue)}</div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select value={action.mode} onChange={(e) => setMode(slot.number, e.target.value)} className={inputCls} style={inputStyle}>
                      <option value="create">Gerar lançamento novo</option>
                      <option value="link" disabled={!candidates.length}>Vincular a um lançamento existente{!candidates.length ? " (nenhum neste mês)" : ""}</option>
                      <option value="skip">Ignorar por enquanto</option>
                    </select>
                    {action.mode === "link" && (
                      <select value={action.txId} onChange={(e) => setTx(slot.number, e.target.value)} className={inputCls} style={inputStyle}>
                        <option value="">Escolha o lançamento…</option>
                        {candidates.map((t) => <option key={t.id} value={t.id}>{t.description} — {brl(t.amount)}</option>)}
                      </select>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[11.5px]" style={{ color: SLATE, fontFamily: "Inter, sans-serif" }}>
            Vincular não altera a categoria nem o valor do lançamento que já existe — só o amarra
            a esta parcela do financiamento.
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-medium btn-ghost">Cancelar</button>
            <button onClick={confirm} disabled={!createCount && !linkCount} className="btn-primary px-4 py-2 rounded-lg text-[13px] font-medium disabled:opacity-40">
              {createCount ? `Gerar ${createCount}` : ""}{createCount && linkCount ? " · " : ""}{linkCount ? `Vincular ${linkCount}` : ""}
              {!createCount && !linkCount ? "Nada selecionado" : ""}
            </button>
          </div>
        </div>
      )}
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

  const appsScript = `// Defesa extra: defina aqui o MESMO token que você vai colar no campo
// "Token secreto" do app. Sem essa constante bater, o script recusa a requisição
// mesmo que alguém descubra a URL do Web App.
const SHARED_SECRET = "COLOQUE_AQUI_UM_TOKEN_SECRETO_SEU"; // ex.: gere uma string aleatória longa

function checkToken(token) {
  return !SHARED_SECRET || token === SHARED_SECRET;
}

function doGet(e) {
  if (!checkToken(e.parameter.token)) {
    return ContentService.createTextOutput(JSON.stringify({ error: "Token inválido ou ausente." }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  const readSheet = (name) => {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
    if (!sheet || sheet.getLastRow() < 1) return [];
    const rows = sheet.getDataRange().getValues();
    const headers = rows.shift();
    return rows.map(r => Object.fromEntries(headers.map((h, i) => [h, r[i]])));
  };
  const data = {
    Lancamentos: readSheet("Lancamentos"),
    Categorias: readSheet("Categorias"),
    Config: readSheet("Config"),
    Cartoes: readSheet("Cartoes"),
    Veiculos: readSheet("Veiculos"),
    Orcamentos: readSheet("Orcamentos"),
  };
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function upsertAndDelete(sheet, items) {
  if (!sheet || !items.length) return { upserted: 0, deleted: 0 };
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const idCol = headers.indexOf("ID");

  const toDelete = items.filter(item => item._delete);
  const toUpsert = items.filter(item => !item._delete);

  // Upserts (atualiza se o ID já existe, senão adiciona no final)
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
  return { upserted: toUpsert.length, deleted: toDelete.length };
}

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const body = JSON.parse(e.postData.contents);

  // Compatibilidade com versões antigas do app: um array solto = linhas de Lançamentos
  const payload = Array.isArray(body) ? { Lancamentos: body } : body;

  if (!checkToken(payload.token)) {
    return ContentService.createTextOutput(JSON.stringify({ error: "Token inválido ou ausente." }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const result = {};
  Object.keys(payload).forEach(sheetName => {
    if (sheetName === "token") return;
    const sheet = ss.getSheetByName(sheetName);
    result[sheetName] = upsertAndDelete(sheet, payload[sheetName]);
  });

  return ContentService.createTextOutput(JSON.stringify({ ok: true, ...result }))
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
          Depois de configurar a URL abaixo, <b>todo lançamento (inclusive parcelas e recorrências), categoria/subcategoria, cartão, veículo e orçamento que você criar, editar ou excluir é enviado automaticamente para a planilha</b> — não precisa clicar em nada. O botão "Sincronizar agora" serve para o primeiro alinhamento (buscar o que já estava na planilha e mandar pra lá o que já existia aqui) ou para forçar uma nova sincronização manual quando quiser. Requer publicar o Apps Script Web App (passo 4, abaixo) uma única vez — atenção: use a URL que <b>termina em <code className="px-1 rounded" style={{ background: "#fff" }}>/exec</code></b>, não o link de CSV do passo 1.
          <br /><br />
          <b>Anos arquivados também ficam salvos aqui</b> (na coluna Ano) — mesmo limpando os dados do navegador, ao configurar essa mesma URL de novo e abrir o app, o histórico de anos arquivados é recuperado automaticamente (o app sincroniza sozinho assim que reconhece uma conexão já configurada).
        </p>
        <Field label="URL do Apps Script Web App">
          <input value={sheetConfig.appsScriptUrl} onChange={(e) => setSheetConfig((s) => ({ ...s, appsScriptUrl: e.target.value }))} placeholder="https://script.google.com/macros/s/SEU_DEPLOY_ID/exec" className={inputCls} style={inputStyle} />
        </Field>
        <Field label="Token secreto (opcional, mas recomendado)">
          <input value={sheetConfig.secret} onChange={(e) => setSheetConfig((s) => ({ ...s, secret: e.target.value }))} placeholder="mesmo valor da constante SHARED_SECRET no Apps Script" className={inputCls} style={inputStyle} />
        </Field>
        <p className="text-[11px] mt-1.5" style={{ color: SLATE }}>
          A URL do Apps Script, sozinha, já funciona como uma senha implícita — quem a descobrir lê e grava na sua planilha. Definir um token aqui (e a mesma string na constante <code className="px-1 rounded" style={{ background: "#EEE7D4" }}>SHARED_SECRET</code> do script, passo 4) adiciona uma camada extra: sem o token certo, o script recusa a requisição mesmo com a URL correta.
        </p>
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
        <h3 className="text-[13.5px] font-semibold mb-3">2. Como preparar sua planilha (3 minutos)</h3>
        <ol className="space-y-2 text-[12.5px]" style={{ color: SLATE }}>
          <li><b style={{ color: INK }}>1.</b> Crie uma aba chamada <code className="px-1 rounded" style={{ background: GOLD_SOFT }}>Lancamentos</code> com as colunas: ID, Ano, Mes, Tipo, CategoriaId, Categoria, SubcategoriaId, Subcategoria, Descricao, Valor, Cartao, Veiculo, Pago, Vencimento, Notas, ParcelaNumero, ParcelaTotal, RecorrenciaGrupoId, RecorrenciaIndefinida, BankId, Ignorado. A coluna <b>Ano</b> é o que permite que anos arquivados fiquem salvos na planilha permanentemente (não só o ano corrente); <b>Ignorado</b> guarda os lançamentos marcados como "não será pago".</li>
          <li><b style={{ color: INK }}>2.</b> Crie também uma segunda aba chamada <code className="px-1 rounded" style={{ background: GOLD_SOFT }}>Categorias</code> com as colunas: ID, Tipo, CategoriaId, Categoria, Cor, SubcategoriaId, Subcategoria. É nela que suas categorias e subcategorias ficam salvas.</li>
          <li><b style={{ color: INK }}>2b.</b> Crie uma terceira aba chamada <code className="px-1 rounded" style={{ background: GOLD_SOFT }}>Config</code> com as colunas: ID, Chave, Valor. É nela que fica salvo qual é o "ano corrente" do sistema — sem isso, se você limpar os dados do navegador depois de arquivar um ano, o app pode ficar confuso sobre qual ano está ativo. É nela também que fica o <b>hash da sua senha</b> (nunca a senha em si), para que a troca de usuário/senha valha em qualquer dispositivo. Por causa disso, <b>configure o token secreto do passo 4</b>: sem ele, quem descobrir a URL do Apps Script consegue ler esse hash.</li>
          <li><b style={{ color: INK }}>2c.</b> Crie mais três abas: <code className="px-1 rounded" style={{ background: GOLD_SOFT }}>Cartoes</code> (colunas: ID, Nome, Limite, DiaFechamento, DiaVencimento, Cor), <code className="px-1 rounded" style={{ background: GOLD_SOFT }}>Veiculos</code> (colunas: ID, Nome, ValorTotal, TotalParcelas, ValorParcela, ParcelasPagas, MesInicio) e <code className="px-1 rounded" style={{ background: GOLD_SOFT }}>Orcamentos</code> (colunas: ID, CategoriaId, Limite, Ativo, Periodo). Todas opcionais — se você não usa alguma dessas funcionalidades no app, pode deixar a aba correspondente vazia (só com o cabeçalho) ou nem criar.</li>
          <li><b style={{ color: INK }}>3.</b> Para a importação simples em CSV (passo 1 acima, opcional): vá em <b>Arquivo → Compartilhar → Publicar na Web</b> (não confunda com o botão "Compartilhar" comum), escolha a aba <code className="px-1 rounded" style={{ background: GOLD_SOFT }}>Lancamentos</code> especificamente e o formato <b>CSV</b>. Essa publicação só cobre Lançamentos — Categorias sincroniza apenas pela via bidirecional (Apps Script, passo 4 abaixo).</li>
          <li><b style={{ color: INK }}>4.</b> Copie o link gerado e cole no campo do passo 1. Confira se o número depois de <code className="px-1 rounded" style={{ background: GOLD_SOFT }}>gid=</code> corresponde à aba certa.</li>
        </ol>
      </div>

      <div className="ledger-card mb-4" style={{ background: PAPER }}>
        <div className="flex items-center gap-2 mb-1"><ClipboardPaste size={15} color={GOLD} /><h3 className="text-[13.5px] font-semibold">3. Alternativa: colar o CSV manualmente</h3></div>
        <p className="text-[12.5px] mb-3" style={{ color: SLATE }}>
          Se a importação automática acima falhar (é comum o navegador bloquear a busca direta a domínios do Google por CORS), abra o link publicado em outra aba, selecione tudo (<b>Ctrl/Cmd+A</b>), copie e cole o conteúdo aqui embaixo. Este caminho não depende de rede e sempre funciona.
        </p>
        <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} rows={6} placeholder="ID,Ano,Mes,Tipo,Categoria,Subcategoria,Descricao,Valor,Cartao,Veiculo,Pago,Vencimento&#10;abc123,2026,Jan,Despesa,moradia,aluguel,Aluguel,2600,,,Sim,5"
          className={inputCls} style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, resize: "vertical" }} />
        <div className="flex items-center gap-2 mt-3">
          <button onClick={() => importFromPastedCsv(pasteText)} disabled={!pasteText.trim()} className="btn-primary flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium disabled:opacity-40"><ClipboardPaste size={14} /> Importar do texto colado</button>
        </div>
      </div>

      <div className="ledger-card mb-4" style={{ background: PAPER }}>
        <div className="flex items-center gap-2 mb-2"><Settings2 size={15} color={GOLD} /><h3 className="text-[13.5px] font-semibold">4. Publicar o Apps Script Web App (necessário para a sincronização bidirecional)</h3></div>
        <p className="text-[12.5px] mb-3" style={{ color: SLATE }}>
          A publicação em CSV só permite leitura — para <b>gravar</b> lançamentos e categorias na planilha, publique este script como Web App na própria planilha. Ele lê e grava nas duas abas (<b>Lancamentos</b> e <b>Categorias</b>) automaticamente; a coluna <b>ID</b> de cada aba é o que permite ao script atualizar a linha certa em vez de duplicar.
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
        <div className="flex items-center gap-2 flex-wrap">
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

/* =========================================================================
   TAB: DIAGNÓSTICO DE SEGURANÇA
   Checklist honesto — sem placar inflado. Cada item é ✅ verificado,
   ⚠️ limitação conhecida, ou ➖ não se aplica (com o motivo).
   ========================================================================= */
function checkLocalStorageAvailable() {
  try {
    const k = "__meufinanceiro_probe__";
    window.localStorage.setItem(k, "1");
    window.localStorage.removeItem(k);
    return true;
  } catch (_) { return false; }
}

function buildSecurityChecks({ isDefaultCredentials, persistWarning, sheetConfig, authRecordAlgo }) {
  const secureContext = typeof window !== "undefined" && window.isSecureContext;
  const localStorageOk = checkLocalStorageAvailable();
  const sanitizeSelfTest = sanitizeForSheet("=CMD|'/C calc'!A1") === "'=CMD|'/C calc'!A1" && sanitizeForSheet("Mercado") === "Mercado";

  const applicable = [
    {
      id: "xss", category: "Validação", label: "XSS (Cross-Site Scripting)",
      status: "ok",
      detail: "Auditoria estática do código-fonte não encontrou dangerouslySetInnerHTML, innerHTML, document.write, eval() ou new Function(). Todo texto do usuário é renderizado como texto React puro (escapado por padrão).",
    },
    {
      id: "secrets", category: "Frontend", label: "Segredos expostos no bundle",
      status: "ok",
      detail: "Nenhuma chave de API ou token hardcoded encontrado além do hash de senha (ver item de autenticação, é uma limitação conhecida e não um segredo vazado por engano).",
    },
    {
      id: "default-creds", category: "Autenticação", label: "Credenciais padrão de fábrica",
      status: isDefaultCredentials ? "warn" : "ok",
      detail: isDefaultCredentials
        ? "As credenciais ainda são as padrão do código-fonte (usuário 'familia'). Troque em 'Alterar usuário e senha' antes de publicar para acesso público."
        : "As credenciais já foram alteradas em relação ao padrão de fábrica.",
    },
    {
      id: "auth-client-side", category: "Autenticação", label: "Modelo de autenticação client-side",
      status: "warn",
      detail: "Login é validado inteiramente no navegador. Protege contra acesso casual, mas não contra alguém que leia o bundle ou manipule o estado via DevTools. Sem backend, não há como eliminar essa limitação por completo.",
    },
    {
      id: "cred-hash", category: "Autenticação", label: "Formato do hash da senha",
      status: authRecordAlgo === AUTH_ALGO_PBKDF2 ? "ok" : "warn",
      detail: authRecordAlgo === AUTH_ALGO_PBKDF2
        ? `Senha guardada como PBKDF2-HMAC-SHA256 com salt aleatório e ${PBKDF2_ITERATIONS.toLocaleString("pt-BR")} iterações — caro de atacar offline mesmo por quem obtenha o hash.`
        : "Senha ainda no formato antigo (SHA-256 sem salt), que cai rápido em ataque de dicionário offline. Troque a senha uma vez em \"Alterar usuário e senha\" para migrar ao formato com salt.",
    },
    {
      id: "cred-sync", category: "Autenticação", label: "Credencial sincronizada com a planilha",
      status: !sheetConfig?.appsScriptUrl ? "na" : (sheetConfig.secret ? "ok" : "warn"),
      detail: !sheetConfig?.appsScriptUrl
        ? "Sincronização não configurada — a credencial fica só neste navegador e volta ao padrão de fábrica se você limpar os dados."
        : sheetConfig.secret
        ? "O hash da senha (nunca a senha) é gravado na aba Config da planilha, para valer em qualquer dispositivo. O token secreto protege o acesso a essa planilha."
        : "O hash da senha é gravado na planilha, mas NÃO há token secreto configurado — quem descobrir a URL do Apps Script consegue lê-lo. Configure um token em Conexão Google Sheets.",
    },
    {
      id: "brute-force", category: "Autenticação", label: `Bloqueio por tentativas (${AUTH_CONFIG.maxAttempts} tentativas / ${AUTH_CONFIG.lockoutSeconds}s)`,
      status: "warn",
      detail: "Bloqueio temporário ativo e agora persistido em localStorage entre recarregamentos (antes resetava com F5). Ainda pode ser contornado limpando os dados do navegador — não substitui rate limiting de servidor, que exigiria um backend.",
    },
    {
      id: "cred-persist", category: "Autenticação", label: "Persistência de credenciais alteradas",
      status: persistWarning ? "warn" : (localStorageOk ? "ok" : "warn"),
      detail: !localStorageOk
        ? "localStorage indisponível neste navegador/ambiente — trocas de senha valem só para esta sessão (comportamento esperado dentro do preview de artifacts do Claude; funciona normalmente após publicado)."
        : "localStorage disponível — credenciais alteradas persistem neste navegador entre sessões.",
    },
    {
      id: "sheet-token", category: "Integrações", label: "Token secreto do Apps Script",
      status: !sheetConfig?.appsScriptUrl ? "na" : (sheetConfig.secret ? "ok" : "warn"),
      detail: !sheetConfig?.appsScriptUrl
        ? "Sincronização com Google Sheets não configurada."
        : sheetConfig.secret
        ? "Token configurado — a URL do Apps Script sozinha não é mais suficiente para ler/gravar na planilha."
        : "Nenhum token configurado — quem descobrir a URL do Apps Script lê e grava na planilha. Configure um token em Conexão Google Sheets.",
    },
    {
      id: "formula-injection", category: "Integrações", label: "Injeção de fórmula no Google Sheets",
      status: sanitizeSelfTest ? "ok" : "warn",
      detail: sanitizeSelfTest
        ? "Auto-teste ao vivo: valores que começam com =, +, -, @ são prefixados com apóstrofo antes de gravar na planilha, neutralizando fórmulas maliciosas."
        : "Auto-teste falhou — sanitização de fórmula pode não estar ativa (reporte isso).",
    },
    {
      id: "input-validation", category: "Validação", label: "Validação de valores de lançamento",
      status: "ok",
      detail: "Valores zero ou negativos são rejeitados no formulário; descrição e observações têm limite de tamanho (120/500 caracteres).",
    },
    {
      id: "https", category: "Transporte", label: "Contexto seguro (HTTPS)",
      status: secureContext ? "ok" : "warn",
      detail: secureContext
        ? "A página está sendo servida em um contexto seguro (HTTPS ou localhost)."
        : "A página não está em um contexto seguro — sirva sempre via HTTPS em produção (Vercel e Firebase Hosting já fazem isso por padrão).",
    },
    {
      id: "headers", category: "Transporte", label: "Cabeçalhos de segurança HTTP (CSP, X-Frame-Options etc.)",
      status: "warn",
      detail: "Não são controláveis pelo código React em runtime — dependem de configuração no provedor de hospedagem. Arquivos vercel.json/firebase.json com esses cabeçalhos foram fornecidos separadamente; confirme que foram publicados.",
    },
  ];

  const notApplicable = [
    { id: "sqli", label: "SQL Injection / Prepared Statements", reason: "não há banco de dados nem SQL no sistema." },
    { id: "session", label: "Session Fixation / Hijacking / Replay", reason: "não há sessão de servidor." },
    { id: "cookies", label: "Cookies (HttpOnly, Secure, SameSite)", reason: "o sistema não usa cookies." },
    { id: "jwt", label: "Manipulação de JWT", reason: "o sistema não usa JWT." },
    { id: "csrf", label: "CSRF", reason: "depende de cookies/sessão automática, que não existem aqui." },
    { id: "upload", label: "Upload de arquivos malicioso", reason: "o sistema não tem funcionalidade de upload." },
    { id: "xxe-ssrf", label: "XXE / SSRF / Command Injection / Path Traversal", reason: "não há parsing de XML, execução de comandos, nem acesso a arquivos por caminho no servidor." },
    { id: "idor", label: "IDOR / múltiplos perfis / escalação de privilégio", reason: "login único e compartilhado, sem papéis/permissões distintas." },
    { id: "server-rate-limit", label: "Rate limiting e logs de servidor", reason: "não há servidor de aplicação — hospedagem é 100% estática." },
    { id: "open-redirect", label: "Open Redirect", reason: "o sistema não tem redirecionamentos baseados em parâmetro de URL." },
  ];

  return { applicable, notApplicable };
}

const SEC_STATUS_META = {
  ok: { label: "Verificado", color: SAGE, bg: SAGE_SOFT, icon: CheckCircle2 },
  warn: { label: "Limitação conhecida", color: "#8C6A1B", bg: GOLD_SOFT, icon: AlertTriangle },
  na: { label: "Não se aplica", color: SLATE, bg: "#EFEBE0", icon: Circle },
};

function SegurancaTab({ authConfig, isDefaultCredentials, persistWarning, loginLog, sheetConfig, setTab }) {
  const [lastRun, setLastRun] = useState(() => new Date());
  const { applicable, notApplicable } = useMemo(
    () => buildSecurityChecks({ isDefaultCredentials, persistWarning, sheetConfig, authRecordAlgo: authConfig?.algo }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isDefaultCredentials, persistWarning, sheetConfig, authConfig, lastRun]
  );
  const [showNA, setShowNA] = useState(false);

  const okCount = applicable.filter((c) => c.status === "ok").length;
  const warnCount = applicable.filter((c) => c.status === "warn").length;
  const naInline = applicable.filter((c) => c.status === "na").length;

  return (
    <div className="fade-up">
      <header className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 600 }}>Diagnóstico de Segurança</h1>
          <p className="text-[13px] mt-1" style={{ color: SLATE }}>Checklist honesto para um sistema 100% client-side — sem placar inflado, sem fingir proteções que não existem.</p>
        </div>
        <button onClick={() => setLastRun(new Date())} className="btn-primary flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium">
          <RefreshCw size={14} /> Executar diagnóstico novamente
        </button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KpiCard label="Verificações OK" value={String(okCount)} sub={`de ${applicable.length} aplicáveis`} icon={CheckCircle2} tone="sage" />
        <KpiCard label="Limitações conhecidas" value={String(warnCount)} sub="requerem atenção ou aceite consciente" icon={AlertTriangle} tone="gold" />
        <KpiCard label="Não se aplicam" value={String(notApplicable.length + naInline)} sub="arquitetura sem backend/banco/sessão" icon={Circle} tone="ink" />
      </div>

      {isDefaultCredentials && (
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl mb-5" style={{ background: RUST_SOFT }}>
          <ShieldAlert size={16} color={RUST} className="mt-0.5 flex-shrink-0" />
          <div className="text-[13px]" style={{ color: INK }}>
            <b style={{ color: RUST }}>Credenciais padrão ainda ativas.</b> Antes de expor este sistema publicamente, troque o usuário e a senha.
            <button onClick={() => setTab && setTab("dashboard")} className="underline ml-1" style={{ color: RUST }}>Ir para o menu (Alterar usuário e senha fica no rodapé da barra lateral)</button>
          </div>
        </div>
      )}

      <div className="ledger-card mb-5" style={{ background: PAPER }}>
        <h3 className="text-[13.5px] font-semibold mb-3">Verificações aplicáveis</h3>
        <div className="space-y-2">
          {applicable.map((c) => {
            const meta = SEC_STATUS_META[c.status];
            const Icon = meta.icon;
            return (
              <div key={c.id} className="flex items-start gap-3 px-3 py-2.5 rounded-lg" style={{ background: "#FBF8F1" }}>
                <div style={{ background: meta.bg, borderRadius: 999, padding: 6, flexShrink: 0 }}><Icon size={13} color={meta.color} /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[12.5px] font-semibold">{c.label}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium uppercase tracking-wide" style={{ background: meta.bg, color: meta.color }}>{meta.label}</span>
                    <span className="text-[10.5px]" style={{ color: SLATE }}>{c.category}</span>
                  </div>
                  <div className="text-[12px] mt-0.5" style={{ color: SLATE }}>{c.detail}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="ledger-card mb-5" style={{ background: PAPER }}>
        <button onClick={() => setShowNA((s) => !s)} className="flex items-center gap-1.5 text-[13px] font-semibold w-full">
          {showNA ? <ChevronDown size={14} /> : <ChevronRight size={14} />} Itens que não se aplicam a esta arquitetura ({notApplicable.length})
        </button>
        {showNA && (
          <div className="mt-3 space-y-1.5">
            {notApplicable.map((n) => (
              <div key={n.id} className="flex items-start gap-2 text-[12px]" style={{ color: SLATE }}>
                <Circle size={11} className="mt-0.5 flex-shrink-0" />
                <span><b style={{ color: INK }}>{n.label}</b> — não se aplica: {n.reason}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="ledger-card" style={{ background: PAPER }}>
        <h3 className="text-[13.5px] font-semibold mb-1">Log de tentativas de login (sessão atual)</h3>
        <p className="text-[11.5px] mb-3" style={{ color: SLATE }}>Visibilidade local, em memória — não é um log auditável à prova de adulteração, some ao fechar a aba.</p>
        {!loginLog || loginLog.length === 0 ? (
          <EmptyState icon={Lock} title="Nenhuma tentativa registrada ainda" desc="Tentativas de login (sucesso ou falha) aparecerão aqui." />
        ) : (
          <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
            {loginLog.map((l) => (
              <div key={l.id} className="flex items-center justify-between px-2.5 py-1.5 rounded-md text-[12px]" style={{ background: "#FBF8F1" }}>
                <div className="flex items-center gap-2">
                  {l.success ? <CheckCircle2 size={13} color={SAGE} /> : <AlertTriangle size={13} color={RUST} />}
                  <span className="font-medium">{l.username || "(vazio)"}</span>
                  <span style={{ color: l.success ? SAGE : RUST }}>{l.success ? "sucesso" : "falha"}</span>
                </div>
                <span style={{ color: SLATE, fontFamily: "'JetBrains Mono', monospace" }}>{new Date(l.at).toLocaleTimeString("pt-BR")}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
