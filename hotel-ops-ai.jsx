import { useState, useEffect, useRef, useCallback } from "react";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const INTENTS = {
  housekeeping: { label: "Housekeeping", dept: "Housekeeping", priority: "medium", sla: 30, color: "#4ade80", icon: "🧹" },
  maintenance: { label: "Maintenance", dept: "Engineering", priority: "high", sla: 15, color: "#f97316", icon: "🔧" },
  late_checkout: { label: "Late Checkout", dept: "Front Desk", priority: "medium", sla: 60, color: "#a78bfa", icon: "🕐" },
  room_service: { label: "Room Service", dept: "F&B", priority: "medium", sla: 20, color: "#f59e0b", icon: "🍽️" },
  wifi: { label: "Wi-Fi Issue", dept: "IT", priority: "high", sla: 10, color: "#60a5fa", icon: "📶" },
  noise: { label: "Noise Complaint", dept: "Security", priority: "urgent", sla: 5, color: "#f43f5e", icon: "🔔" },
  billing: { label: "Billing", dept: "Front Desk", priority: "low", sla: 120, color: "#94a3b8", icon: "💳" },
  recommendation: { label: "Recommendation", dept: "Concierge", priority: "low", sla: 30, color: "#34d399", icon: "📍" },
  emergency: { label: "Emergency", dept: "Security", priority: "urgent", sla: 2, color: "#ef4444", icon: "🚨" },
  general: { label: "General", dept: "Front Desk", priority: "low", sla: 60, color: "#64748b", icon: "💬" },
};

const ROOMS = [
  { id: "101", type: "Standard", guest: "Chen Wei", checkout: false, status: "occupied", cleanStatus: "dirty", attendant: null, lastCleaned: "8:00 AM", priority: 2 },
  { id: "102", type: "Standard", guest: null, checkout: true, status: "vacant", cleanStatus: "pending", attendant: "Maria L.", lastCleaned: "Yesterday", priority: 1 },
  { id: "103", type: "Deluxe", guest: "Sarah M.", checkout: false, status: "occupied", cleanStatus: "clean", attendant: null, lastCleaned: "9:15 AM", priority: 4 },
  { id: "201", type: "Suite", guest: "James R.", checkout: false, status: "occupied", cleanStatus: "dirty", attendant: "Ana G.", lastCleaned: "8:30 AM", priority: 1 },
  { id: "202", type: "Deluxe", guest: null, checkout: true, status: "vacant", cleanStatus: "inspected", attendant: null, lastCleaned: "10:00 AM", priority: 5 },
  { id: "203", type: "Standard", guest: "Yuki T.", checkout: false, status: "occupied", cleanStatus: "dnd", attendant: null, lastCleaned: "Yesterday", priority: 3 },
  { id: "301", type: "Suite", guest: "Alex P.", checkout: true, status: "vacant", cleanStatus: "pending", attendant: null, lastCleaned: "Yesterday", priority: 1 },
  { id: "302", type: "Deluxe", guest: "Emma B.", checkout: false, status: "occupied", cleanStatus: "clean", attendant: null, lastCleaned: "9:45 AM", priority: 4 },
];

const ATTENDANTS = [
  { id: "a1", name: "Maria L.", rooms: ["102"], shift: "Morning", status: "active", completed: 3, assigned: 4 },
  { id: "a2", name: "Ana G.", rooms: ["201"], shift: "Morning", status: "active", completed: 5, assigned: 6 },
  { id: "a3", name: "Carlos M.", rooms: [], shift: "Afternoon", status: "break", completed: 2, assigned: 3 },
];

const PRIORITY_COLORS = { urgent: "#ef4444", high: "#f97316", medium: "#f59e0b", low: "#94a3b8" };
const STATUS_COLORS = {
  dirty: "#ef4444", pending: "#f97316", clean: "#4ade80",
  inspected: "#22d3ee", dnd: "#a78bfa", "in-progress": "#f59e0b"
};

// ─── UTILITY ─────────────────────────────────────────────────────────────────
let taskIdCounter = 100;
const newId = () => ++taskIdCounter;
const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const fmtTime = (d) => d ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";

// ─── STYLES ──────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0a0b0f;
    --surface: #111318;
    --surface2: #1a1d25;
    --surface3: #22263100;
    --border: #2a2d3a;
    --border2: #363a4a;
    --gold: #c9a96e;
    --gold2: #e8c98a;
    --text: #e8e9ef;
    --text2: #8b8fa8;
    --text3: #5a5e75;
    --green: #4ade80;
    --red: #f43f5e;
    --orange: #f97316;
    --blue: #60a5fa;
    --purple: #a78bfa;
    --r: 10px;
    --r2: 14px;
    font-size: 14px;
  }

  body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; overflow: hidden; height: 100vh; }

  .app { display: grid; grid-template-columns: 220px 1fr; grid-template-rows: 56px 1fr; height: 100vh; }

  /* TOPBAR */
  .topbar {
    grid-column: 1 / -1;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center;
    padding: 0 24px;
    gap: 16px;
  }
  .topbar-logo {
    font-family: 'DM Serif Display', serif;
    font-size: 18px;
    color: var(--gold);
    letter-spacing: 0.02em;
    display: flex; align-items: center; gap: 8px;
  }
  .topbar-logo span { color: var(--text2); font-size: 12px; font-family: 'DM Sans', sans-serif; }
  .topbar-right { margin-left: auto; display: flex; align-items: center; gap: 12px; }
  .hotel-badge {
    background: linear-gradient(135deg, #1e1a2e, #2a1e35);
    border: 1px solid #4a2a5a;
    border-radius: 20px;
    padding: 4px 12px;
    font-size: 12px;
    color: var(--purple);
    font-weight: 500;
  }
  .live-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--green); animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.3)} }

  /* SIDEBAR */
  .sidebar {
    background: var(--surface);
    border-right: 1px solid var(--border);
    padding: 20px 12px;
    display: flex; flex-direction: column; gap: 4px;
    overflow-y: auto;
  }
  .sidebar-section { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text3); padding: 12px 8px 6px; }
  .nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 10px; border-radius: 8px; cursor: pointer;
    font-size: 13px; color: var(--text2); transition: all .15s;
    position: relative;
  }
  .nav-item:hover { background: var(--surface2); color: var(--text); }
  .nav-item.active { background: linear-gradient(135deg, #1e2030, #252840); color: var(--gold); border: 1px solid #3a3560; }
  .nav-icon { font-size: 15px; width: 20px; text-align: center; }
  .nav-badge { margin-left: auto; background: var(--red); color: white; border-radius: 10px; padding: 1px 6px; font-size: 10px; font-weight: 600; }
  .nav-badge.green { background: var(--green); color: black; }

  /* MAIN */
  .main { overflow: hidden; display: flex; flex-direction: column; }
  .page { display: none; height: 100%; overflow-y: auto; }
  .page.active { display: flex; flex-direction: column; }

  /* PAGE HEADER */
  .page-header {
    padding: 20px 28px 0;
    display: flex; align-items: flex-start; justify-content: space-between;
    flex-shrink: 0;
  }
  .page-title { font-family: 'DM Serif Display', serif; font-size: 22px; color: var(--text); }
  .page-sub { font-size: 12px; color: var(--text3); margin-top: 2px; }

  /* CARDS / PANELS */
  .panel { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r2); padding: 18px; }
  .panel-title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text3); margin-bottom: 14px; }

  /* METRICS */
  .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; padding: 20px 28px; flex-shrink: 0; }
  .metric-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r2);
    padding: 16px;
    position: relative;
    overflow: hidden;
  }
  .metric-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0;
    height: 2px; background: var(--accent, var(--gold));
  }
  .metric-value { font-family: 'DM Serif Display', serif; font-size: 28px; color: var(--text); }
  .metric-label { font-size: 11px; color: var(--text3); margin-top: 4px; }
  .metric-delta { font-size: 11px; margin-top: 6px; color: var(--green); }
  .metric-delta.bad { color: var(--red); }

  /* BUTTONS */
  .btn {
    padding: 7px 14px; border-radius: 7px; border: none;
    font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500;
    cursor: pointer; transition: all .15s;
  }
  .btn-gold { background: linear-gradient(135deg, var(--gold), var(--gold2)); color: #0a0b0f; }
  .btn-gold:hover { opacity: .9; transform: translateY(-1px); }
  .btn-ghost { background: transparent; border: 1px solid var(--border2); color: var(--text2); }
  .btn-ghost:hover { background: var(--surface2); color: var(--text); }
  .btn-red { background: #3a1a1a; border: 1px solid #6a2020; color: var(--red); }
  .btn-green { background: #0f2a1a; border: 1px solid #1a5a30; color: var(--green); }
  .btn-sm { padding: 4px 10px; font-size: 11px; }

  /* TAGS */
  .tag {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 2px 8px; border-radius: 5px; font-size: 11px; font-weight: 500;
  }

  /* TABLES */
  .table { width: 100%; border-collapse: collapse; }
  .table th { font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: var(--text3); font-weight: 600; padding: 8px 12px; text-align: left; border-bottom: 1px solid var(--border); }
  .table td { padding: 10px 12px; border-bottom: 1px solid var(--border); vertical-align: middle; font-size: 13px; }
  .table tr:last-child td { border-bottom: none; }
  .table tr:hover td { background: var(--surface2); }

  /* SCROLLBAR */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 4px; }

  /* ─── GUEST CHAT ─── */
  .chat-layout { display: grid; grid-template-columns: 320px 1fr 280px; gap: 0; flex: 1; overflow: hidden; }
  
  .chat-list { border-right: 1px solid var(--border); overflow-y: auto; }
  .chat-list-header { padding: 14px 16px; border-bottom: 1px solid var(--border); font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: var(--text3); }
  .chat-item { padding: 12px 16px; border-bottom: 1px solid var(--border); cursor: pointer; transition: background .1s; }
  .chat-item:hover { background: var(--surface2); }
  .chat-item.active { background: #1a1d2e; border-left: 2px solid var(--gold); }
  .chat-room { font-size: 12px; font-weight: 600; color: var(--text); }
  .chat-preview { font-size: 11px; color: var(--text3); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .chat-time { font-size: 10px; color: var(--text3); }
  .chat-unread { width: 6px; height: 6px; border-radius: 50%; background: var(--gold); }

  .chat-window { display: flex; flex-direction: column; overflow: hidden; }
  .chat-header { padding: 14px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
  .chat-messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 12px; }
  
  .msg { display: flex; flex-direction: column; max-width: 80%; }
  .msg.guest { align-self: flex-start; }
  .msg.ai { align-self: flex-end; }
  .msg-bubble {
    padding: 10px 14px; border-radius: 14px; font-size: 13px; line-height: 1.5;
  }
  .msg.guest .msg-bubble { background: var(--surface2); border: 1px solid var(--border); border-bottom-left-radius: 4px; }
  .msg.ai .msg-bubble { background: linear-gradient(135deg, #1e2530, #1a2040); border: 1px solid #3a4060; border-bottom-right-radius: 4px; color: var(--blue); }
  .msg-meta { font-size: 10px; color: var(--text3); margin-top: 4px; padding: 0 4px; }
  .msg.ai .msg-meta { text-align: right; }

  .ai-analysis {
    margin: 4px 0;
    padding: 8px 12px;
    background: #1a1a2a;
    border: 1px solid #2a2a4a;
    border-radius: 8px;
    font-size: 11px;
    color: var(--text2);
    align-self: flex-end;
    max-width: 80%;
  }
  .ai-analysis-row { display: flex; gap: 12px; flex-wrap: wrap; }
  .ai-chip { padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; }

  .chat-input-bar { padding: 14px 20px; border-top: 1px solid var(--border); flex-shrink: 0; }
  .chat-input-row { display: flex; gap: 8px; align-items: center; }
  .chat-input {
    flex: 1; background: var(--surface2); border: 1px solid var(--border2);
    border-radius: 8px; padding: 9px 14px; color: var(--text);
    font-family: 'DM Sans', sans-serif; font-size: 13px; outline: none;
  }
  .chat-input:focus { border-color: var(--gold); }

  .chat-sidebar { border-left: 1px solid var(--border); overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 14px; }

  /* ─── TASKS ─── */
  .tasks-layout { padding: 20px 28px; display: flex; flex-direction: column; gap: 16px; flex: 1; overflow-y: auto; }
  .task-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r2);
    padding: 14px 16px;
    display: flex; align-items: center; gap: 14px;
    transition: border-color .15s;
  }
  .task-card:hover { border-color: var(--border2); }
  .task-card.urgent { border-left: 3px solid var(--red); }
  .task-card.high { border-left: 3px solid var(--orange); }
  .task-card.medium { border-left: 3px solid var(--gold); }
  .task-card.low { border-left: 3px solid var(--text3); }
  .task-icon { font-size: 20px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: var(--surface2); border-radius: 8px; flex-shrink: 0; }
  .task-info { flex: 1; }
  .task-title { font-size: 13px; font-weight: 500; color: var(--text); }
  .task-meta { font-size: 11px; color: var(--text3); margin-top: 3px; }
  .task-sla { font-family: 'JetBrains Mono', monospace; font-size: 11px; }
  .task-sla.ok { color: var(--green); }
  .task-sla.warn { color: var(--orange); }
  .task-sla.breach { color: var(--red); }

  /* ─── HOUSEKEEPING ─── */
  .hk-layout { padding: 20px 28px; display: grid; grid-template-columns: 1fr 280px; gap: 16px; flex: 1; overflow: hidden; }
  .rooms-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; overflow-y: auto; }
  .room-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r);
    padding: 14px;
    cursor: pointer;
    transition: all .15s;
    position: relative;
    overflow: hidden;
  }
  .room-card:hover { border-color: var(--border2); transform: translateY(-1px); }
  .room-card::after {
    content: ''; position: absolute; top: 0; left: 0; right: 0;
    height: 3px; background: var(--status-color, var(--border));
  }
  .room-number { font-family: 'DM Serif Display', serif; font-size: 22px; color: var(--text); }
  .room-type { font-size: 10px; color: var(--text3); }
  .room-guest { font-size: 11px; color: var(--text2); margin-top: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .room-status-badge { margin-top: 8px; }
  .room-attendant { font-size: 10px; color: var(--text3); margin-top: 4px; }
  .room-priority { position: absolute; top: 10px; right: 10px; font-size: 10px; font-weight: 700; }

  /* Loading animation */
  .typing { display: flex; gap: 4px; padding: 8px; }
  .typing span { width: 6px; height: 6px; border-radius: 50%; background: var(--text3); animation: bounce 1.2s infinite; }
  .typing span:nth-child(2) { animation-delay: .2s; }
  .typing span:nth-child(3) { animation-delay: .4s; }
  @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }

  /* ─── ANALYTICS ─── */
  .analytics-layout { padding: 20px 28px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; flex: 1; overflow-y: auto; }
  .chart-bar-group { display: flex; flex-direction: column; gap: 8px; }
  .chart-bar-row { display: flex; align-items: center; gap: 10px; font-size: 12px; }
  .chart-bar-label { width: 90px; color: var(--text2); flex-shrink: 0; font-size: 11px; }
  .chart-bar-track { flex: 1; height: 6px; background: var(--surface2); border-radius: 3px; overflow: hidden; }
  .chart-bar-fill { height: 100%; border-radius: 3px; transition: width .6s ease; }
  .chart-bar-val { width: 32px; text-align: right; color: var(--text3); font-size: 11px; font-family: 'JetBrains Mono', monospace; }

  .sentiment-circle { width: 80px; height: 80px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 3px solid; flex-shrink: 0; }

  /* ─── GUEST PORTAL (QR Web Chat) ─── */
  .portal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,.7); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center; z-index: 100;
  }
  .portal-window {
    background: #f8f5f0;
    border-radius: 16px; overflow: hidden;
    width: 360px; height: 600px;
    display: flex; flex-direction: column;
    box-shadow: 0 40px 80px rgba(0,0,0,.5);
    font-family: 'DM Sans', sans-serif;
  }
  .portal-header {
    background: linear-gradient(135deg, #1a1208, #2d1f0a);
    padding: 20px;
    color: white;
    flex-shrink: 0;
  }
  .portal-hotel { font-family: 'DM Serif Display', serif; font-size: 18px; color: #c9a96e; }
  .portal-subtitle { font-size: 11px; color: rgba(255,255,255,.5); margin-top: 2px; }
  .portal-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px; background: #f0ece6; }
  .portal-msg-guest { align-self: flex-end; background: #1a1208; color: white; padding: 10px 14px; border-radius: 14px 14px 4px 14px; font-size: 13px; max-width: 80%; }
  .portal-msg-ai { align-self: flex-start; background: white; color: #333; padding: 10px 14px; border-radius: 14px 14px 14px 4px; font-size: 13px; max-width: 85%; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
  .portal-input-bar { padding: 12px; background: white; border-top: 1px solid #e0d8cc; display: flex; gap: 8px; flex-shrink: 0; }
  .portal-input { flex: 1; border: 1px solid #e0d8cc; border-radius: 8px; padding: 8px 12px; font-family: 'DM Sans', sans-serif; font-size: 13px; outline: none; background: #f8f5f0; }
  .portal-send { background: #c9a96e; border: none; border-radius: 8px; width: 36px; height: 36px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; }

  /* Quick replies */
  .quick-replies { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
  .qr-chip { background: white; border: 1px solid #c9a96e; color: #8b6a2e; border-radius: 20px; padding: 4px 10px; font-size: 11px; cursor: pointer; transition: all .1s; }
  .qr-chip:hover { background: #c9a96e; color: white; }

  .divider { height: 1px; background: var(--border); }
  .flex { display: flex; }
  .items-center { align-items: center; }
  .gap-2 { gap: 8px; }
  .gap-3 { gap: 12px; }
  .ml-auto { margin-left: auto; }
  .text-sm { font-size: 12px; }
  .text-xs { font-size: 11px; }
  .text-muted { color: var(--text3); }
  .font-mono { font-family: 'JetBrains Mono', monospace; }

  .input-field {
    background: var(--surface2); border: 1px solid var(--border2); border-radius: 7px;
    padding: 8px 12px; color: var(--text); font-family: 'DM Sans', sans-serif; font-size: 12px; outline: none;
  }
  .input-field:focus { border-color: var(--gold); }
  select.input-field { cursor: pointer; }
`;

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function HotelOpsAI() {
  const [page, setPage] = useState("dashboard");
  const [tasks, setTasks] = useState(initTasks());
  const [rooms, setRooms] = useState(ROOMS);
  const [conversations, setConversations] = useState(initConversations());
  const [activeChatId, setActiveChatId] = useState("c1");
  const [showPortal, setShowPortal] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const messagesEndRef = useRef(null);
  const portalEndRef = useRef(null);
  const [portalMessages, setPortalMessages] = useState([
    { role: "ai", text: "Welcome to Grand Meridian Hotel! 🏨 I'm your AI concierge, available 24/7. How can I help you today?" }
  ]);
  const [portalInput, setPortalInput] = useState("");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, activeChatId]);

  useEffect(() => {
    portalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [portalMessages]);

  // SLA countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTasks(prev => prev.map(t => {
        if (t.status === "open" || t.status === "assigned") {
          return { ...t, elapsed: (t.elapsed || 0) + 1 };
        }
        return t;
      }));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const activeChat = conversations.find(c => c.id === activeChatId);
  const openTasks = tasks.filter(t => t.status === "open" || t.status === "assigned");
  const urgentCount = tasks.filter(t => t.priority === "urgent" && t.status !== "closed").length;

  // ── AI CALL ──
  const callAI = useCallback(async (systemPrompt, userMsg) => {
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{ role: "user", content: userMsg }]
        })
      });
      const data = await resp.json();
      return data.content?.[0]?.text || "I'm here to help. Please contact the front desk.";
    } catch (e) {
      return null;
    }
  }, []);

  // ── GUEST CHAT SEND ──
  const handleChatSend = async () => {
    if (!chatInput.trim() || isAiThinking) return;
    const text = chatInput.trim();
    setChatInput("");
    setIsAiThinking(true);

    setConversations(prev => prev.map(c => c.id === activeChatId ? {
      ...c,
      messages: [...c.messages, { role: "guest", text, time: now() }]
    } : c));

    const systemPrompt = `You are a hotel AI concierge for Grand Meridian Hotel. Analyze guest messages and respond in JSON with:
{
  "intent": one of [housekeeping, maintenance, late_checkout, room_service, wifi, noise, billing, recommendation, emergency, general],
  "sentiment": [positive, neutral, negative, urgent],
  "priority": [low, medium, high, urgent],
  "response": "friendly, helpful response to the guest (1-2 sentences)",
  "task_title": "short task description for staff",
  "department": "department name"
}
Be warm, professional, solution-focused. For maintenance/emergency, be extra fast. Only respond with valid JSON.`;

    const result = await callAI(systemPrompt, text);
    let parsed = null;
    try {
      const clean = result.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(clean);
    } catch (_) {
      parsed = {
        intent: "general", sentiment: "neutral", priority: "low",
        response: "Thank you for reaching out! Our team will assist you shortly.",
        task_title: text.slice(0, 50), department: "Front Desk"
      };
    }

    const intentData = INTENTS[parsed.intent] || INTENTS.general;
    const newTask = {
      id: newId(), room: activeChat.room, guest: activeChat.guest,
      intent: parsed.intent, title: parsed.task_title || text.slice(0, 60),
      dept: parsed.department || intentData.dept,
      priority: parsed.priority || intentData.priority,
      sla: intentData.sla, status: "open", elapsed: 0,
      createdAt: new Date(), source: "guest-chat"
    };

    setTasks(prev => [newTask, ...prev]);
    setConversations(prev => prev.map(c => c.id === activeChatId ? {
      ...c,
      messages: [
        ...c.messages,
        {
          role: "ai", text: parsed.response, time: now(),
          analysis: { intent: parsed.intent, sentiment: parsed.sentiment, priority: parsed.priority, dept: parsed.department || intentData.dept }
        }
      ]
    } : c));
    setIsAiThinking(false);
  };

  // ── PORTAL (Guest Web Chat) ──
  const handlePortalSend = async () => {
    if (!portalInput.trim()) return;
    const text = portalInput.trim();
    setPortalInput("");
    setPortalMessages(prev => [...prev, { role: "guest", text }]);

    const systemPrompt = `You are a luxury hotel AI concierge named "Aria" for Grand Meridian Hotel. Be warm, elegant, and helpful. Keep responses brief (2-3 sentences max). If the guest has a request or issue, acknowledge it and let them know the team will handle it immediately.`;

    const resp = await callAI(systemPrompt, text);
    const aiText = resp || "Our team has been notified and will assist you right away. Is there anything else I can help with?";
    setPortalMessages(prev => [...prev, { role: "ai", text: aiText }]);

    // Create task from portal message
    const newTask = {
      id: newId(), room: "Guest Portal", guest: "Portal Guest",
      intent: "general", title: text.slice(0, 60),
      dept: "Front Desk", priority: "medium", sla: 30, status: "open", elapsed: 0,
      createdAt: new Date(), source: "web-portal"
    };
    setTasks(prev => [newTask, ...prev]);
  };

  // ── TASK ACTIONS ──
  const updateTask = (id, updates) => setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  const updateRoom = (id, updates) => setRooms(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));

  // ── FILTER TASKS ──
  const filteredTasks = tasks.filter(t => {
    const statusOk = filterStatus === "all" || t.status === filterStatus;
    const priorityOk = filterPriority === "all" || t.priority === filterPriority;
    return statusOk && priorityOk;
  });

  // ─── RENDER ───
  return (
    <>
      <style>{css}</style>
      <div className="app">
        {/* TOPBAR */}
        <div className="topbar">
          <div className="topbar-logo">
            <span style={{ fontSize: 20 }}>⬡</span>
            Hotel Ops <span style={{ color: "var(--gold)", fontFamily: "DM Serif Display" }}>AI</span>
            <span>/ The Operational Intelligence Layer</span>
          </div>
          <div className="topbar-right">
            <div className="live-dot" title="Live" />
            <span className="text-xs text-muted">Live</span>
            <div className="hotel-badge">Grand Meridian Hotel</div>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowPortal(true)}>
              📱 Guest Portal Demo
            </button>
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="sidebar">
          <div className="sidebar-section">Overview</div>
          <NavItem icon="⬡" label="Dashboard" id="dashboard" page={page} setPage={setPage} />
          <NavItem icon="📊" label="Analytics" id="analytics" page={page} setPage={setPage} />

          <div className="sidebar-section">Operations</div>
          <NavItem icon="💬" label="Guest Messages" id="chat" page={page} setPage={setPage} badge={conversations.filter(c => c.unread).length || null} />
          <NavItem icon="✅" label="Task Queue" id="tasks" page={page} setPage={setPage} badge={urgentCount || null} />
          <NavItem icon="🧹" label="Housekeeping" id="housekeeping" page={page} setPage={setPage} />

          <div className="sidebar-section">Config</div>
          <NavItem icon="⚙️" label="Settings" id="settings" page={page} setPage={setPage} />
          <NavItem icon="🏨" label="Hotel Profile" id="profile" page={page} setPage={setPage} />
        </div>

        {/* MAIN */}
        <div className="main">
          {/* DASHBOARD */}
          <div className={`page ${page === "dashboard" ? "active" : ""}`}>
            <div className="page-header">
              <div>
                <div className="page-title">Operations Dashboard</div>
                <div className="page-sub">Real-time hotel operations overview</div>
              </div>
              <button className="btn btn-gold btn-sm" onClick={() => setShowPortal(true)}>
                Preview Guest Chat
              </button>
            </div>

            <div className="metrics-grid">
              <MetricCard label="Open Tasks" value={openTasks.length} delta={`${tasks.filter(t=>t.status==='closed').length} resolved today`} accent="#f97316" />
              <MetricCard label="Avg Response Time" value="4.2m" delta="↓ 18% vs yesterday" accent="#4ade80" />
              <MetricCard label="Guest Messages" value={conversations.reduce((s,c) => s+c.messages.filter(m=>m.role==='guest').length, 0)} delta="Across all channels" accent="#60a5fa" />
              <MetricCard label="Rooms Ready" value={`${rooms.filter(r=>r.cleanStatus==='inspected'||r.cleanStatus==='clean').length}/${rooms.length}`} delta="Occupancy: 75%" accent="#a78bfa" />
            </div>

            <div style={{ padding: "0 28px 20px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, flex: 1, overflow: "hidden" }}>
              {/* Recent Tasks */}
              <div className="panel" style={{ gridColumn: "1 / 3", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div className="panel-title">Recent Tasks</div>
                <div style={{ overflowY: "auto" }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Room</th><th>Issue</th><th>Dept</th><th>Priority</th><th>Status</th><th>SLA</th><th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.slice(0, 8).map(t => (
                        <tr key={t.id}>
                          <td><span className="font-mono" style={{ color: "var(--gold)" }}>#{t.room}</span></td>
                          <td style={{ maxWidth: 180 }}>
                            <span>{INTENTS[t.intent]?.icon} </span>
                            <span style={{ fontSize: 12 }}>{t.title}</span>
                          </td>
                          <td><span className="text-xs text-muted">{t.dept}</span></td>
                          <td><PriorityTag p={t.priority} /></td>
                          <td><StatusTag s={t.status} /></td>
                          <td><SlaTimer task={t} /></td>
                          <td>
                            {t.status === "open" && (
                              <button className="btn btn-green btn-sm" onClick={() => updateTask(t.id, { status: "assigned" })}>Assign</button>
                            )}
                            {t.status === "assigned" && (
                              <button className="btn btn-gold btn-sm" onClick={() => updateTask(t.id, { status: "closed" })}>Close</button>
                            )}
                            {t.status === "closed" && <span className="text-xs text-muted">Done</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Room Status Summary */}
              <div className="panel" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div className="panel-title">Room Status</div>
                {[
                  { label: "Dirty / Pending", count: rooms.filter(r => r.cleanStatus === "dirty" || r.cleanStatus === "pending").length, color: "#ef4444" },
                  { label: "In Progress", count: rooms.filter(r => r.cleanStatus === "in-progress").length, color: "#f59e0b" },
                  { label: "Clean", count: rooms.filter(r => r.cleanStatus === "clean").length, color: "#4ade80" },
                  { label: "Inspected / Ready", count: rooms.filter(r => r.cleanStatus === "inspected").length, color: "#22d3ee" },
                  { label: "Do Not Disturb", count: rooms.filter(r => r.cleanStatus === "dnd").length, color: "#a78bfa" },
                ].map(({ label, count, color }) => (
                  <div key={label} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: "var(--text2)" }}>{label}</span>
                      <span style={{ color, fontFamily: "JetBrains Mono", fontSize: 11 }}>{count}</span>
                    </div>
                    <div style={{ height: 4, background: "var(--surface2)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(count / rooms.length) * 100}%`, background: color, borderRadius: 2 }} />
                    </div>
                  </div>
                ))}

                <div className="divider" style={{ margin: "14px 0" }} />
                <div className="panel-title">Housekeeping Staff</div>
                {ATTENDANTS.map(a => (
                  <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0 }}>
                      {a.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: "var(--text)" }}>{a.name}</div>
                      <div style={{ fontSize: 10, color: "var(--text3)" }}>{a.completed}/{a.assigned} rooms</div>
                    </div>
                    <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: a.status === "active" ? "#0f2a1a" : "#2a1a0a", color: a.status === "active" ? "var(--green)" : "var(--orange)" }}>
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* GUEST CHAT */}
          <div className={`page ${page === "chat" ? "active" : ""}`}>
            <div className="page-header" style={{ padding: "14px 20px 0", flexShrink: 0 }}>
              <div>
                <div className="page-title">Guest Messaging</div>
                <div className="page-sub">AI-powered guest communication hub</div>
              </div>
            </div>
            <div className="chat-layout" style={{ flex: 1, marginTop: 14, overflow: "hidden" }}>
              {/* Conversation List */}
              <div className="chat-list">
                <div className="chat-list-header">Conversations ({conversations.length})</div>
                {conversations.map(c => (
                  <div key={c.id} className={`chat-item ${activeChatId === c.id ? "active" : ""}`}
                    onClick={() => {
                      setActiveChatId(c.id);
                      setConversations(prev => prev.map(cv => cv.id === c.id ? { ...cv, unread: false } : cv));
                    }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div className="chat-room">Room {c.room} · {c.guest}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {c.unread && <div className="chat-unread" />}
                        <div className="chat-time">{c.lastTime}</div>
                      </div>
                    </div>
                    <div className="chat-preview">{c.messages[c.messages.length - 1]?.text}</div>
                    <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                      <span style={{ fontSize: 10, color: "var(--text3)" }}>{c.channel}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Window */}
              {activeChat && (
                <div className="chat-window">
                  <div className="chat-header">
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#2a2030,#3a3050)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                      {activeChat.guest.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{activeChat.guest}</div>
                      <div style={{ fontSize: 11, color: "var(--text3)" }}>Room {activeChat.room} · {activeChat.channel}</div>
                    </div>
                    <div className="ml-auto" style={{ display: "flex", gap: 8 }}>
                      <span style={{ fontSize: 10, padding: "3px 8px", background: "#0a1a0a", border: "1px solid #1a4a1a", borderRadius: 5, color: "var(--green)" }}>
                        AI Active
                      </span>
                    </div>
                  </div>

                  <div className="chat-messages">
                    {activeChat.messages.map((m, i) => (
                      <div key={i}>
                        <div className={`msg ${m.role}`}>
                          <div className="msg-bubble">{m.text}</div>
                          <div className="msg-meta">{m.role === "ai" ? "AI Concierge" : activeChat.guest} · {m.time}</div>
                        </div>
                        {m.analysis && (
                          <div className="ai-analysis">
                            <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 4 }}>AI Analysis</div>
                            <div className="ai-analysis-row">
                              <span className="ai-chip" style={{ background: "#1a1a3a", color: "var(--blue)" }}>
                                {INTENTS[m.analysis.intent]?.icon} {m.analysis.intent}
                              </span>
                              <span className="ai-chip" style={{ background: "#1a1a1a", color: PRIORITY_COLORS[m.analysis.priority] }}>
                                ↑ {m.analysis.priority}
                              </span>
                              <span className="ai-chip" style={{ background: "#1a1a1a", color: "var(--text2)" }}>
                                🏢 {m.analysis.dept}
                              </span>
                              <span className="ai-chip" style={{ background: "#1a1a1a", color: m.analysis.sentiment === "negative" ? "var(--red)" : m.analysis.sentiment === "positive" ? "var(--green)" : "var(--text3)" }}>
                                {m.analysis.sentiment}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {isAiThinking && (
                      <div className="msg ai">
                        <div className="msg-bubble">
                          <div className="typing"><span /><span /><span /></div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="chat-input-bar">
                    <div className="chat-input-row">
                      <input
                        className="chat-input"
                        placeholder="Type a guest message to test AI response..."
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleChatSend()}
                      />
                      <button className="btn btn-gold" onClick={handleChatSend} disabled={isAiThinking}>
                        {isAiThinking ? "..." : "Send"}
                      </button>
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 6 }}>
                      ✨ AI analyzes intent, creates tasks automatically, and responds in real-time
                    </div>
                  </div>
                </div>
              )}

              {/* Chat Sidebar */}
              <div className="chat-sidebar">
                <div className="panel-title">Guest Info</div>
                {activeChat && (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{activeChat.guest}</div>
                    <div style={{ fontSize: 11, color: "var(--text3)" }}>Room {activeChat.room}</div>
                    <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>Check-out: {activeChat.checkout}</div>
                    <div className="divider" style={{ margin: "10px 0" }} />
                  </>
                )}

                <div className="panel-title">Active Tasks (This Guest)</div>
                {tasks.filter(t => activeChat && t.room === activeChat.room && t.status !== "closed").map(t => (
                  <div key={t.id} style={{ background: "var(--surface2)", borderRadius: 8, padding: "10px", fontSize: 12, marginBottom: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>{INTENTS[t.intent]?.icon} {t.title.slice(0, 35)}</span>
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 6, alignItems: "center" }}>
                      <StatusTag s={t.status} />
                      <SlaTimer task={t} />
                    </div>
                    {t.status === "open" && (
                      <button className="btn btn-green btn-sm" style={{ marginTop: 6, width: "100%" }}
                        onClick={() => updateTask(t.id, { status: "closed" })}>
                        Mark Resolved
                      </button>
                    )}
                  </div>
                ))}

                <div className="panel-title" style={{ marginTop: 8 }}>Quick Templates</div>
                {[
                  "Your request has been noted and our team is on the way.",
                  "We apologize for the inconvenience. This will be resolved within 15 minutes.",
                  "Thank you for letting us know. A staff member will be with you shortly.",
                ].map((tmpl, i) => (
                  <div key={i} style={{ fontSize: 11, color: "var(--text2)", background: "var(--surface2)", borderRadius: 6, padding: "7px 10px", cursor: "pointer", marginBottom: 4 }}
                    onClick={() => setChatInput(tmpl)}>
                    {tmpl.slice(0, 60)}...
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* TASKS */}
          <div className={`page ${page === "tasks" ? "active" : ""}`}>
            <div className="page-header">
              <div>
                <div className="page-title">Task Queue</div>
                <div className="page-sub">{openTasks.length} open · {tasks.filter(t => t.status === "closed").length} resolved</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <select className="input-field" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="assigned">Assigned</option>
                  <option value="closed">Closed</option>
                </select>
                <select className="input-field" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
                  <option value="all">All Priority</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            <div className="tasks-layout">
              {filteredTasks.length === 0 && (
                <div style={{ textAlign: "center", color: "var(--text3)", padding: 40 }}>No tasks match the filter</div>
              )}
              {filteredTasks.map(t => {
                const intentData = INTENTS[t.intent] || INTENTS.general;
                return (
                  <div key={t.id} className={`task-card ${t.priority}`}>
                    <div className="task-icon">{intentData.icon}</div>
                    <div className="task-info">
                      <div className="task-title">{t.title}</div>
                      <div className="task-meta">
                        Room <span style={{ color: "var(--gold)" }}>{t.room}</span> · {t.guest} · {t.dept} · Source: {t.source}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                      <PriorityTag p={t.priority} />
                      <StatusTag s={t.status} />
                      <SlaTimer task={t} />
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      {t.status === "open" && <>
                        <button className="btn btn-green btn-sm" onClick={() => updateTask(t.id, { status: "assigned" })}>Assign</button>
                        <button className="btn btn-red btn-sm" onClick={() => updateTask(t.id, { status: "closed" })}>Close</button>
                      </>}
                      {t.status === "assigned" && <button className="btn btn-gold btn-sm" onClick={() => updateTask(t.id, { status: "closed" })}>Complete</button>}
                      {t.status === "closed" && <span style={{ fontSize: 11, color: "var(--green)" }}>✓ Done</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* HOUSEKEEPING */}
          <div className={`page ${page === "housekeeping" ? "active" : ""}`}>
            <div className="page-header">
              <div>
                <div className="page-title">Housekeeping Automation</div>
                <div className="page-sub">AI-optimized room assignments & status tracking</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-ghost btn-sm">Auto-Assign All</button>
                <button className="btn btn-gold btn-sm">Generate Schedule</button>
              </div>
            </div>

            <div className="hk-layout">
              <div style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
                {/* Legend */}
                <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                  {Object.entries(STATUS_COLORS).map(([s, c]) => (
                    <div key={s} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
                      <span style={{ color: "var(--text2)", textTransform: "capitalize" }}>{s}</span>
                    </div>
                  ))}
                </div>
                <div className="rooms-grid">
                  {rooms.map(room => (
                    <div key={room.id} className="room-card"
                      style={{ "--status-color": STATUS_COLORS[room.cleanStatus] || "var(--border)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div className="room-number">{room.id}</div>
                          <div className="room-type">{room.type}</div>
                        </div>
                        <span className="room-priority" style={{ color: room.checkout ? "var(--orange)" : "var(--text3)" }}>
                          {room.checkout ? "CO" : room.status === "occupied" ? "OCC" : "VAC"}
                        </span>
                      </div>
                      <div className="room-guest">{room.guest || "Vacant"}</div>
                      <div className="room-status-badge">
                        <span className="tag" style={{
                          background: STATUS_COLORS[room.cleanStatus] + "22",
                          color: STATUS_COLORS[room.cleanStatus],
                          border: `1px solid ${STATUS_COLORS[room.cleanStatus]}44`
                        }}>
                          {room.cleanStatus}
                        </span>
                      </div>
                      {room.attendant && <div className="room-attendant">👤 {room.attendant}</div>}
                      <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
                        {room.cleanStatus !== "inspected" && (
                          <button className="btn btn-ghost btn-sm" style={{ fontSize: 10, padding: "2px 6px" }}
                            onClick={() => updateRoom(room.id, { cleanStatus: room.cleanStatus === "dirty" || room.cleanStatus === "pending" ? "in-progress" : room.cleanStatus === "in-progress" ? "clean" : "inspected" })}>
                            {room.cleanStatus === "dirty" || room.cleanStatus === "pending" ? "Start" : room.cleanStatus === "in-progress" ? "Clean ✓" : room.cleanStatus === "clean" ? "Inspect ✓" : ""}
                          </button>
                        )}
                        {room.cleanStatus === "inspected" && <span style={{ fontSize: 10, color: "var(--green)" }}>✓ Ready</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* HK Sidebar */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14, overflow: "hidden" }}>
                {/* AI Insights */}
                <div className="panel">
                  <div className="panel-title">🧠 AI Insights</div>
                  {[
                    { icon: "⚡", text: "Room 301 (Suite checkout) needs priority cleaning — guest arriving 2pm", color: "var(--orange)" },
                    { icon: "📊", text: "Ana G. is running 15min behind schedule. Reallocate Room 302?", color: "var(--blue)" },
                    { icon: "💡", text: "Rooms 203 & 103 marked DND — skip for morning run, schedule for afternoon", color: "var(--purple)" },
                    { icon: "⚠️", text: "3 checkouts today need priority — currently short 1 attendant", color: "var(--red)" },
                  ].map((insight, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10, fontSize: 12 }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{insight.icon}</span>
                      <span style={{ color: "var(--text2)", lineHeight: 1.4 }}>{insight.text}</span>
                    </div>
                  ))}
                </div>

                {/* Staff Workload */}
                <div className="panel" style={{ flex: 1, overflow: "hidden" }}>
                  <div className="panel-title">Staff Workload</div>
                  {ATTENDANTS.map(a => (
                    <div key={a.id} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                        <span style={{ fontWeight: 500 }}>{a.name}</span>
                        <span style={{ color: "var(--text3)", fontSize: 11 }}>{a.shift} · {a.completed}/{a.assigned}</span>
                      </div>
                      <div style={{ height: 6, background: "var(--surface2)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(a.completed / a.assigned) * 100}%`, background: a.completed === a.assigned ? "var(--green)" : "var(--gold)", borderRadius: 3 }} />
                      </div>
                      <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 3 }}>
                        {a.rooms.length > 0 ? `Currently: Room ${a.rooms.join(", ")}` : "Available"}
                      </div>
                    </div>
                  ))}
                  <button className="btn btn-ghost btn-sm" style={{ width: "100%", marginTop: 4 }}>
                    + Add Attendant
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ANALYTICS */}
          <div className={`page ${page === "analytics" ? "active" : ""}`}>
            <div className="page-header">
              <div className="page-title">Analytics & Reporting</div>
            </div>

            <div className="analytics-layout">
              {/* Tasks by Department */}
              <div className="panel">
                <div className="panel-title">Tasks by Department (Today)</div>
                <div className="chart-bar-group">
                  {Object.entries(
                    tasks.reduce((acc, t) => { acc[t.dept] = (acc[t.dept] || 0) + 1; return acc; }, {})
                  ).map(([dept, count]) => (
                    <div key={dept} className="chart-bar-row">
                      <div className="chart-bar-label">{dept}</div>
                      <div className="chart-bar-track">
                        <div className="chart-bar-fill" style={{ width: `${(count / tasks.length) * 100}%`, background: "var(--gold)" }} />
                      </div>
                      <div className="chart-bar-val">{count}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tasks by Intent */}
              <div className="panel">
                <div className="panel-title">Request Types</div>
                <div className="chart-bar-group">
                  {Object.entries(
                    tasks.reduce((acc, t) => { acc[t.intent] = (acc[t.intent] || 0) + 1; return acc; }, {})
                  ).map(([intent, count]) => (
                    <div key={intent} className="chart-bar-row">
                      <div className="chart-bar-label">{INTENTS[intent]?.icon} {intent}</div>
                      <div className="chart-bar-track">
                        <div className="chart-bar-fill" style={{ width: `${(count / tasks.length) * 100}%`, background: INTENTS[intent]?.color || "var(--gold)" }} />
                      </div>
                      <div className="chart-bar-val">{count}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sentiment */}
              <div className="panel">
                <div className="panel-title">Guest Sentiment</div>
                <div style={{ display: "flex", gap: 16, justifyContent: "center", padding: "10px 0" }}>
                  {[
                    { label: "Positive", pct: 62, color: "var(--green)" },
                    { label: "Neutral", pct: 28, color: "var(--gold)" },
                    { label: "Negative", pct: 10, color: "var(--red)" },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: "center" }}>
                      <div className="sentiment-circle" style={{ borderColor: s.color, margin: "0 auto 8px" }}>
                        <div style={{ fontSize: 18, fontFamily: "DM Serif Display", color: s.color }}>{s.pct}%</div>
                        <div style={{ fontSize: 9, color: "var(--text3)" }}></div>
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text2)" }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className="divider" style={{ margin: "10px 0" }} />
                <div style={{ fontSize: 12, color: "var(--text2)", textAlign: "center" }}>
                  🟢 Sentiment improved +8% vs last week
                </div>
              </div>

              {/* SLA Performance */}
              <div className="panel">
                <div className="panel-title">SLA Performance</div>
                {[
                  { dept: "Engineering", met: 85, target: 90 },
                  { dept: "Housekeeping", met: 92, target: 85 },
                  { dept: "Front Desk", met: 78, target: 80 },
                  { dept: "F&B", met: 95, target: 90 },
                  { dept: "Security", met: 100, target: 95 },
                ].map(s => (
                  <div key={s.dept} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                      <span style={{ color: "var(--text2)" }}>{s.dept}</span>
                      <span style={{ color: s.met >= s.target ? "var(--green)" : "var(--orange)", fontFamily: "JetBrains Mono", fontSize: 11 }}>
                        {s.met}% <span style={{ color: "var(--text3)" }}>/ {s.target}%</span>
                      </span>
                    </div>
                    <div style={{ height: 4, background: "var(--surface2)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${s.met}%`, background: s.met >= s.target ? "var(--green)" : "var(--orange)", borderRadius: 2 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SETTINGS */}
          <div className={`page ${page === "settings" ? "active" : ""}`}>
            <div className="page-header">
              <div className="page-title">Settings</div>
            </div>
            <div style={{ padding: "20px 28px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="panel">
                <div className="panel-title">AI Configuration</div>
                {[["AI Model", "Claude Sonnet"], ["Response Language", "Auto-detect"], ["Fallback to Human", "After 2 failed attempts"], ["Max Response Time", "3 seconds"]].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                    <span style={{ color: "var(--text2)" }}>{k}</span>
                    <span style={{ color: "var(--gold)", fontFamily: "JetBrains Mono", fontSize: 12 }}>{v}</span>
                  </div>
                ))}
              </div>
              <div className="panel">
                <div className="panel-title">SLA Timers (minutes)</div>
                {Object.entries(INTENTS).map(([key, val]) => (
                  <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: 12 }}>
                    <span style={{ color: "var(--text2)" }}>{val.icon} {val.label}</span>
                    <span style={{ fontFamily: "JetBrains Mono", color: "var(--gold)", fontSize: 11 }}>{val.sla}m</span>
                  </div>
                ))}
              </div>
              <div className="panel">
                <div className="panel-title">Integrations</div>
                {[
                  { name: "WhatsApp (Twilio)", status: "connected", color: "var(--green)" },
                  { name: "Cloudbeds PMS", status: "connected", color: "var(--green)" },
                  { name: "Mews PMS", status: "not configured", color: "var(--text3)" },
                  { name: "Stripe Billing", status: "connected", color: "var(--green)" },
                  { name: "Google Reviews", status: "beta", color: "var(--orange)" },
                ].map(item => (
                  <div key={item.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                    <span style={{ color: "var(--text)" }}>{item.name}</span>
                    <span style={{ fontSize: 11, color: item.color }}>{item.status}</span>
                  </div>
                ))}
              </div>
              <div className="panel">
                <div className="panel-title">Notification Rules</div>
                {[
                  ["Urgent tasks", "Immediate SMS + App"],
                  ["SLA breach", "Email + App push"],
                  ["Bad sentiment", "Manager alert"],
                  ["Daily digest", "9:00 AM email"],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)", fontSize: 12 }}>
                    <span style={{ color: "var(--text2)" }}>{k}</span>
                    <span style={{ color: "var(--text)", fontSize: 11 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* PROFILE */}
          <div className={`page ${page === "profile" ? "active" : ""}`}>
            <div className="page-header">
              <div className="page-title">Hotel Profile</div>
            </div>
            <div style={{ padding: "20px 28px" }}>
              <div className="panel" style={{ maxWidth: 600 }}>
                <div className="panel-title">Property Information</div>
                {[["Name", "Grand Meridian Hotel"], ["Location", "San Francisco, CA"], ["Rooms", "120"], ["Stars", "4"], ["PMS", "Cloudbeds"], ["Check-in", "3:00 PM"], ["Check-out", "12:00 PM"], ["Default Currency", "USD"]].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                    <span style={{ color: "var(--text2)" }}>{k}</span>
                    <span style={{ color: "var(--text)" }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GUEST PORTAL MODAL */}
      {showPortal && (
        <div className="portal-overlay" onClick={e => e.target === e.currentTarget && setShowPortal(false)}>
          <div className="portal-window">
            <div className="portal-header">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div className="portal-hotel">Grand Meridian</div>
                  <div className="portal-subtitle">Guest Services · Available 24/7</div>
                </div>
                <button onClick={() => setShowPortal(false)} style={{ background: "rgba(255,255,255,.1)", border: "none", color: "white", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>✕</button>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
                {["🛎️ Concierge", "🔧 Maintenance", "🧹 Housekeeping", "🍽️ Room Service"].map(c => (
                  <span key={c} style={{ fontSize: 11, background: "rgba(255,255,255,.1)", borderRadius: 12, padding: "3px 10px", cursor: "pointer" }}
                    onClick={() => setPortalInput(c.split(" ").slice(1).join(" "))}>
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div className="portal-messages">
              {portalMessages.map((m, i) => (
                <div key={i} className={m.role === "guest" ? "portal-msg-guest" : "portal-msg-ai"}>
                  {m.text}
                  {i === 0 && (
                    <div className="quick-replies">
                      {["I need extra towels", "AC not working", "Late checkout request", "Restaurant recommendation"].map(q => (
                        <span key={q} className="qr-chip" onClick={() => {
                          setPortalInput(q);
                          setTimeout(() => {
                            const e = { key: "Enter" };
                            if (q) {
                              setPortalInput(q);
                            }
                          }, 50);
                        }}>{q}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div ref={portalEndRef} />
            </div>

            <div className="portal-input-bar">
              <input
                className="portal-input"
                placeholder="How can we help you?"
                value={portalInput}
                onChange={e => setPortalInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handlePortalSend()}
              />
              <button className="portal-send" onClick={handlePortalSend}>➤</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function NavItem({ icon, label, id, page, setPage, badge }) {
  return (
    <div className={`nav-item ${page === id ? "active" : ""}`} onClick={() => setPage(id)}>
      <span className="nav-icon">{icon}</span>
      {label}
      {badge && <span className="nav-badge">{badge}</span>}
    </div>
  );
}

function MetricCard({ label, value, delta, accent }) {
  return (
    <div className="metric-card" style={{ "--accent": accent }}>
      <div className="metric-value">{value}</div>
      <div className="metric-label">{label}</div>
      <div className={`metric-delta ${delta?.startsWith("↑") ? "bad" : ""}`}>{delta}</div>
    </div>
  );
}

function PriorityTag({ p }) {
  return (
    <span className="tag" style={{ background: PRIORITY_COLORS[p] + "22", color: PRIORITY_COLORS[p], border: `1px solid ${PRIORITY_COLORS[p]}44` }}>
      {p}
    </span>
  );
}

function StatusTag({ s }) {
  const colors = { open: "#f97316", assigned: "#60a5fa", closed: "#4ade80" };
  const c = colors[s] || "var(--text3)";
  return (
    <span className="tag" style={{ background: c + "22", color: c, border: `1px solid ${c}44` }}>{s}</span>
  );
}

function SlaTimer({ task }) {
  const elapsed = task.elapsed || 0;
  const remaining = task.sla - elapsed;
  const cls = remaining <= 0 ? "breach" : remaining <= 5 ? "warn" : "ok";
  if (task.status === "closed") return <span className="task-sla text-xs" style={{ color: "var(--text3)" }}>Done</span>;
  return (
    <span className={`task-sla ${cls}`}>
      {remaining <= 0 ? `+${Math.abs(remaining)}m BREACH` : `${remaining}m left`}
    </span>
  );
}

// ─── INIT DATA ────────────────────────────────────────────────────────────────
function initTasks() {
  return [
    { id: 1, room: "201", guest: "James R.", intent: "maintenance", title: "AC not cooling properly, guest cannot sleep", dept: "Engineering", priority: "high", sla: 15, status: "open", elapsed: 8, createdAt: new Date(), source: "whatsapp" },
    { id: 2, room: "103", guest: "Sarah M.", intent: "housekeeping", title: "Extra towels and toiletries requested", dept: "Housekeeping", priority: "medium", sla: 30, status: "assigned", elapsed: 12, createdAt: new Date(), source: "web-chat" },
    { id: 3, room: "301", guest: "Alex P.", intent: "late_checkout", title: "Late checkout request until 2 PM", dept: "Front Desk", priority: "medium", sla: 60, status: "open", elapsed: 5, createdAt: new Date(), source: "whatsapp" },
    { id: 4, room: "202", guest: null, intent: "noise", title: "Guest in 202 reporting noise from hallway", dept: "Security", priority: "urgent", sla: 5, status: "open", elapsed: 2, createdAt: new Date(), source: "web-chat" },
    { id: 5, room: "101", guest: "Chen Wei", intent: "wifi", title: "WiFi not connecting in room", dept: "IT", priority: "high", sla: 10, status: "closed", elapsed: 10, createdAt: new Date(), source: "whatsapp" },
    { id: 6, room: "302", guest: "Emma B.", intent: "room_service", title: "Breakfast order: eggs benedict, coffee", dept: "F&B", priority: "medium", sla: 20, status: "assigned", elapsed: 7, createdAt: new Date(), source: "web-chat" },
  ];
}

function initConversations() {
  return [
    {
      id: "c1", room: "201", guest: "James R.", channel: "WhatsApp", lastTime: "2m ago", unread: true, checkout: "Tomorrow",
      messages: [
        { role: "guest", text: "Hello, my AC is not cooling at all and I can't sleep. It's very hot.", time: "11:42 PM" },
        { role: "ai", text: "I'm so sorry to hear that, Mr. Roberts! I've immediately flagged this as a high-priority maintenance request. Our engineering team has been notified and will be at your room within 15 minutes. In the meantime, can I send up a portable fan?", time: "11:42 PM", analysis: { intent: "maintenance", sentiment: "negative", priority: "high", dept: "Engineering" } },
        { role: "guest", text: "Yes please, and quickly!", time: "11:43 PM" },
        { role: "ai", text: "Absolutely! A portable fan is on its way now. Our engineer Carlos is heading to your room. I'll follow up in 20 minutes to ensure everything is resolved.", time: "11:43 PM" },
      ]
    },
    {
      id: "c2", room: "103", guest: "Sarah M.", channel: "QR Web Chat", lastTime: "15m ago", unread: false, checkout: "Dec 28",
      messages: [
        { role: "guest", text: "Can I get some extra towels and shampoo?", time: "11:30 PM" },
        { role: "ai", text: "Of course, Ms. Mitchell! I'll have housekeeping bring extra towels and shampoo to your room right away. Is there anything else you need?", time: "11:30 PM", analysis: { intent: "housekeeping", sentiment: "neutral", priority: "medium", dept: "Housekeeping" } },
      ]
    },
    {
      id: "c3", room: "302", guest: "Emma B.", channel: "WhatsApp", lastTime: "1h ago", unread: false, checkout: "Dec 30",
      messages: [
        { role: "guest", text: "I'd like to order breakfast for tomorrow 8am - eggs benedict and a large coffee please", time: "10:15 PM" },
        { role: "ai", text: "Perfect choice! I've placed your breakfast order for tomorrow at 8:00 AM — eggs benedict and a large coffee. You'll receive a confirmation shortly. Is there anything else I can arrange?", time: "10:15 PM", analysis: { intent: "room_service", sentiment: "positive", priority: "medium", dept: "F&B" } },
      ]
    },
  ];
}
