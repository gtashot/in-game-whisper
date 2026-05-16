import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Smile, Sticker, Image as ImageIcon, Hash, Settings, CornerDownLeft, ArrowDown, UserPlus, EyeOff, Ban, Flag, Reply, Crown, Briefcase, Phone, ShieldAlert, Car, DollarSign, Radio, type LucideIcon } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

type ChatMessage = {
  id: number;
  type: "chat" | "server" | "action" | "info";
  author?: string;
  color?: string;
  text: string;
};

const PLAYER_COLORS = [
  "#ff6464", "#64ff64", "#64c8ff", "#ffd24a",
  "#ff7ad9", "#9b6bff", "#ffa64a", "#5ce1e6",
];

const FAKE_PLAYERS = ["CJ_Johnson", "Big_Smoke", "Ryder", "Sweet", "Tenpenny"];

const INITIAL_MESSAGES: ChatMessage[] = [
  { id: 1, type: "server", text: "Connected to ls-rp.sa-mp.com:7777" },
  { id: 2, type: "info", text: "* Welcome to Los Santos Roleplay" },
  { id: 3, type: "chat", author: "CJ_Johnson", color: PLAYER_COLORS[0], text: "Ah shit, here we go again." },
  { id: 4, type: "chat", author: "Big_Smoke", color: PLAYER_COLORS[1], text: "I'll have two number 9s, a number 9 large..." },
  { id: 5, type: "action", text: "* Ryder lights a cigarette" },
  { id: 6, type: "chat", author: "Sweet", color: PLAYER_COLORS[3], text: "Grove Street, home." },
];

function Index() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const counter = useRef(INITIAL_MESSAGES.length);
  const atBottomRef = useRef(true);
  const [unread, setUnread] = useState(0);

  const scrollToBottom = () => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    atBottomRef.current = true;
    setUnread(0);
  };

  const pushMessage = (msg: Omit<ChatMessage, "id">) => {
    counter.current += 1;
    setMessages((prev) => [...prev.slice(-50), { ...msg, id: counter.current }]);
  };

  // T key opens chat (like SA-MP)
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (typing) return;
      if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        setTyping(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [typing]);

  // Sync scroll to bottom + focus the moment typing opens, before paint
  useLayoutEffect(() => {
    if (typing) {
      const el = listRef.current;
      if (el) el.scrollTop = el.scrollHeight;
      atBottomRef.current = true;
      setUnread(0);
      inputRef.current?.focus();
    }
  }, [typing]);

  // Auto-scroll only if user is already at the bottom; otherwise count unread
  useEffect(() => {
    if (atBottomRef.current) {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    } else {
      setUnread((u) => u + 1);
    }
  }, [messages]);

  const onListScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const isBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 8;
    atBottomRef.current = isBottom;
    if (isBottom) setUnread(0);
  };


  // Ambient fake traffic
  useEffect(() => {
    const lines = [
      "yo anyone selling a sultan?",
      "lol",
      "/me waves",
      "meet me at unity station",
      "afk 5",
      "wtb sprunk",
    ];
    const id = setInterval(() => {
      const player = FAKE_PLAYERS[Math.floor(Math.random() * FAKE_PLAYERS.length)];
      const color = PLAYER_COLORS[FAKE_PLAYERS.indexOf(player) % PLAYER_COLORS.length];
      const line = lines[Math.floor(Math.random() * lines.length)];
      if (line.startsWith("/me")) {
        pushMessage({ type: "action", text: `* ${player} ${line.slice(4)}` });
      } else {
        pushMessage({ type: "chat", author: player, color, text: line });
      }
    }, 5500);
    return () => clearInterval(id);
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (text) {
      if (text.startsWith("/me ")) {
        pushMessage({ type: "action", text: `* You ${text.slice(4)}` });
      } else if (text.startsWith("/")) {
        pushMessage({ type: "server", text: `SERVER: Unknown command (${text}).` });
      } else {
        pushMessage({ type: "chat", author: "You", color: "#ffffff", text });
      }
    }
    setInput("");
    setTyping(false);
  };

  const onInputKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setInput("");
      setTyping(false);
    }
  };

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-samp-bg">
      <div className="absolute inset-0 bg-samp-scene" aria-hidden />
      <div className="absolute inset-0 bg-samp-vignette" aria-hidden />

      {/* HUD hint */}
      <div className="samp-text pointer-events-none absolute right-5 top-5 select-none text-right text-[12px] font-semibold leading-tight text-white">
        <div className="flex items-center justify-end gap-1.5">
          <span>Press</span>
          <kbd className="rounded border border-white/20 bg-neutral-950 px-1.5 py-0.5 font-mono text-[11px] text-white shadow">T</kbd>
          <span>to chat</span>
        </div>
        <div className="mt-1 text-white/80">Try /me waves</div>
      </div>

      {/* GTA V style notifications */}
      <Notifications />

      {/* Chat overlay */}
      <div className="absolute left-5 top-5 w-[min(520px,70vw)]">
        <div className="relative">
          <div
            ref={listRef}
            onScroll={onListScroll}
            className={`samp-text flex flex-col gap-1 overflow-y-auto samp-scroll pr-1 text-[14px] leading-[1.45] ${
              typing ? "pointer-events-auto" : "pointer-events-none"
            }`}
            style={{ height: "calc(16 * 1.45 * 14px + 15 * 4px)" }}
          >
            <AnimatePresence initial={false}>
              {messages.slice(-16).map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 6, filter: "blur(2px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, filter: "blur(2px)" }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                >
                  <ChatLine m={m} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {typing && unread > 0 && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={scrollToBottom}
              className="pointer-events-auto absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/10 bg-black/70 px-3 py-1 text-[11px] font-medium text-white/80 backdrop-blur-md transition hover:bg-black/85 hover:text-white"
            >
              <ArrowDown className="size-3" />
              {unread} nuevo{unread > 1 ? "s" : ""}
            </button>
          )}
        </div>

        <AnimatePresence initial={false}>
          {typing && (
            <motion.div
              key="chat-input"
              initial={{ opacity: 0, y: -8, scale: 0.98, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, scale: 0.98, filter: "blur(4px)" }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto mt-3 origin-top overflow-hidden rounded-lg border border-white/15 bg-neutral-950 shadow-2xl"
            >
              <form onSubmit={submit}>
                <div className="flex items-center gap-2 px-3 py-2">
                  <span className="select-none text-[12px] font-medium uppercase tracking-wider text-white/40">Say</span>
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onInputKey}
                    onBlur={() => !input && setTyping(false)}
                    maxLength={144}
                    className="flex-1 bg-transparent text-[14px] font-normal text-white outline-none placeholder:text-white/30"
                    placeholder="Message…"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button
                    type="submit"
                    onMouseDown={(e) => e.preventDefault()}
                    title="Enviar (Enter)"
                    className="flex shrink-0 items-center gap-1 rounded-md border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-white/70 transition hover:border-white/20 hover:bg-white/[0.12] hover:text-white"
                  >
                    Enter
                    <CornerDownLeft className="size-3" />
                  </button>
                </div>
                <div className="flex items-center gap-0.5 border-t border-white/[0.06] px-2 py-1.5">
                  <ToolBtn title="Emojis"><Smile className="size-3.5" /></ToolBtn>
                  <ToolBtn title="Stickers"><Sticker className="size-3.5" /></ToolBtn>
                  <ToolBtn title="GIF"><ImageIcon className="size-3.5" /></ToolBtn>
                  <Divider />
                  <ToolBtn title="Último comando"><span className="font-mono text-[11px]">/me waves</span></ToolBtn>
                  <ToolBtn title="Penúltimo comando"><span className="font-mono text-[11px]">/help</span></ToolBtn>
                  <Divider />
                  <ToolBtn title="Canales"><Hash className="size-3.5" /></ToolBtn>
                  <ToolBtn title="Configuración"><Settings className="size-3.5" /></ToolBtn>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

function ChatLine({ m }: { m: ChatMessage }) {
  const [openMenu, setOpenMenu] = useState<null | "name" | "msg">(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMenu) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpenMenu(null);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [openMenu]);

  if (m.type === "chat") {
    const isOther = m.author && m.author !== "You";
    return (
      <div ref={ref} className="relative text-white/90">
        <button
          type="button"
          disabled={!isOther}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => isOther && setOpenMenu(openMenu === "name" ? null : "name")}
          className="font-semibold text-white hover:underline disabled:no-underline disabled:cursor-default"
        >
          {m.author}
        </button>
        <span className="text-white/40"> · </span>
        <button
          type="button"
          disabled={!isOther}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => isOther && setOpenMenu(openMenu === "msg" ? null : "msg")}
          className="text-left text-white/85 hover:text-white disabled:hover:text-white/85 disabled:cursor-default"
        >
          {m.text}
        </button>
        {openMenu === "name" && isOther && (
          <div className="absolute left-0 top-full z-20 mt-1 min-w-[180px] overflow-hidden rounded-md border border-white/15 bg-neutral-950 shadow-2xl">
            <div className="border-b border-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: m.color ?? "#fff" }}>
              {m.author}
            </div>
            <MenuItem icon={<UserPlus className="size-3.5" />}>Agregar como amigo</MenuItem>
            <MenuItem icon={<EyeOff className="size-3.5" />}>Ocultar</MenuItem>
            <MenuItem icon={<Ban className="size-3.5" />}>Ignorar</MenuItem>
          </div>
        )}
        {openMenu === "msg" && isOther && (
          <div className="absolute left-0 top-full z-20 mt-1 min-w-[160px] overflow-hidden rounded-md border border-white/15 bg-neutral-950 shadow-2xl">
            <MenuItem icon={<Reply className="size-3.5" />}>Responder</MenuItem>
            <MenuItem icon={<Flag className="size-3.5" />}>Reportar</MenuItem>
          </div>
        )}
      </div>
    );
  }
  if (m.type === "action") return <div className="italic text-white/55">{m.text}</div>;
  if (m.type === "server") return <div className="text-white/45">{m.text}</div>;
  return <div className="text-white/60">{m.text}</div>;
}

function MenuItem({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] text-white/75 transition hover:bg-white/[0.06] hover:text-white"
    >
      {icon}
      {children}
    </button>
  );
}

function ToolBtn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      className="flex h-7 items-center justify-center rounded-md px-2 text-white/50 transition hover:bg-white/[0.06] hover:text-white/90"
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-4 w-px bg-white/10" />;
}

// ====================== GTA V Notifications ======================

type NotifSize = "sm" | "md" | "lg";

type Notif = {
  id: number;
  icon: LucideIcon;
  accent: string; // tailwind text color class for icon tile
  title: string;
  body?: string;
  size: NotifSize;
};

const NOTIF_POOL: Omit<Notif, "id">[] = [
  {
    icon: Crown,
    accent: "text-amber-400",
    title: "Haviland",
    body: "I am happy to report that your security team have prevented a police raid on one of your businesses. Excellent news. Production continues as normal.",
    size: "lg",
  },
  {
    icon: DollarSign,
    accent: "text-emerald-400",
    title: "Bank of Los Santos",
    body: "Deposit received: $24,500",
    size: "sm",
  },
  {
    icon: Phone,
    accent: "text-sky-400",
    title: "Lamar",
    body: "Yo homie, meet me at the Vespucci pier in 5.",
    size: "md",
  },
  {
    icon: ShieldAlert,
    accent: "text-rose-400",
    title: "LSPD Alert",
    body: "Wanted level increased. Lose the cops to evade.",
    size: "md",
  },
  {
    icon: Briefcase,
    accent: "text-amber-400",
    title: "Mission Available",
    body: "Heist setup ready at the planning board.",
    size: "md",
  },
  {
    icon: Car,
    accent: "text-sky-400",
    title: "Vehicle Delivered",
    body: "Your Pegassi Zentorno is at the garage.",
    size: "sm",
  },
  {
    icon: Radio,
    accent: "text-violet-400",
    title: "Weazel News",
    body: "Breaking: stock market spikes after CEO scandal.",
    size: "md",
  },
  {
    icon: DollarSign,
    accent: "text-emerald-400",
    title: "Maze Bank",
    body: "Loan approved",
    size: "sm",
  },
];

function Notifications() {
  const [items, setItems] = useState<Notif[]>([]);
  const counter = useRef(0);

  useEffect(() => {
    let cancelled = false;

    const push = () => {
      if (cancelled) return;
      const tpl = NOTIF_POOL[Math.floor(Math.random() * NOTIF_POOL.length)];
      counter.current += 1;
      const id = counter.current;
      setItems((prev) => [...prev.slice(-4), { ...tpl, id }]);
      const lifetime = tpl.size === "lg" ? 8000 : tpl.size === "md" ? 6000 : 4500;
      setTimeout(() => {
        if (cancelled) return;
        setItems((prev) => prev.filter((n) => n.id !== id));
      }, lifetime);
    };

    const first = setTimeout(push, 1500);
    const interval = setInterval(push, 6500);
    return () => {
      cancelled = true;
      clearTimeout(first);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute right-6 top-20 z-30 flex w-[360px] flex-col items-end gap-2.5">
      <AnimatePresence initial={false}>
        {items.map((n) => (
          <motion.div
            key={n.id}
            layout
            initial={{ opacity: 0, x: 60, filter: "blur(6px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: 30, filter: "blur(4px)", transition: { duration: 0.25 } }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="w-full"
          >
            <NotificationCard n={n} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Map text-color accent → solid bg + glow color
const ACCENT_MAP: Record<string, { bg: string; glow: string; bar: string }> = {
  "text-amber-400":  { bg: "bg-amber-500",  glow: "rgba(245,158,11,0.55)",  bar: "bg-amber-400" },
  "text-emerald-400":{ bg: "bg-emerald-500",glow: "rgba(16,185,129,0.55)",  bar: "bg-emerald-400" },
  "text-sky-400":    { bg: "bg-sky-500",    glow: "rgba(56,189,248,0.55)",  bar: "bg-sky-400" },
  "text-rose-400":   { bg: "bg-rose-500",   glow: "rgba(244,63,94,0.55)",   bar: "bg-rose-400" },
  "text-violet-400": { bg: "bg-violet-500", glow: "rgba(139,92,246,0.55)",  bar: "bg-violet-400" },
};

function NotificationCard({ n }: { n: Notif }) {
  const Icon = n.icon;
  const accent = ACCENT_MAP[n.accent] ?? ACCENT_MAP["text-amber-400"];

  const padY = n.size === "sm" ? "py-2.5" : n.size === "lg" ? "py-4" : "py-3";
  const titleSize = n.size === "lg" ? "text-[15px]" : "text-[13px]";
  const bodySize = n.size === "lg" ? "text-[13px]" : "text-[12px]";
  const iconBox = n.size === "lg" ? "h-14 w-14" : n.size === "md" ? "h-12 w-12" : "h-11 w-11";
  const iconSize = n.size === "lg" ? "size-7" : n.size === "md" ? "size-6" : "size-5";

  return (
    <div
      className={`relative flex w-full items-stretch gap-0 overflow-hidden bg-black ${padY} pl-0 pr-3.5`}
      style={{
        clipPath: "polygon(0 0, 100% 0, 100% 100%, 14px 100%, 0 calc(100% - 14px))",
        boxShadow: `0 12px 28px -10px rgba(0,0,0,0.95), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}
    >
      {/* left accent bar */}
      <span className={`relative w-[5px] shrink-0 ${accent.bar}`} style={{ boxShadow: `0 0 14px ${accent.glow}` }} />

      {/* icon tile */}
      <div className="flex shrink-0 items-center justify-center pl-3 pr-3">
        <div
          className={`flex ${iconBox} items-center justify-center text-white`}
          style={{
            background: `linear-gradient(160deg, rgba(255,255,255,0.06), rgba(255,255,255,0) 60%), #111`,
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className={`flex h-[78%] w-[78%] items-center justify-center ${accent.bg}`} style={{ boxShadow: `inset 0 -8px 14px rgba(0,0,0,0.35)` }}>
            <Icon className={iconSize} strokeWidth={2.4} />
          </div>
        </div>
      </div>

      {/* content */}
      <div className="flex min-w-0 flex-1 flex-col justify-center py-0.5">
        <div className="mb-0.5 flex items-center gap-2">
          <span className={`text-[10px] font-bold uppercase tracking-[0.18em] text-white/45`}>
            {n.size === "lg" ? "Incoming Message" : n.size === "md" ? "Notification" : "Alert"}
          </span>
          <span className="h-px flex-1 bg-white/10" />
        </div>
        <div className={`font-bold uppercase tracking-wide text-white ${titleSize} leading-tight`} style={{ textShadow: "0 1px 0 rgba(0,0,0,0.6)" }}>
          {n.title}
        </div>
        {n.body && (
          <div className={`mt-1 ${bodySize} font-normal leading-snug text-white/75`} style={{ textShadow: "none" }}>
            {n.body}
          </div>
        )}
      </div>

      {/* right hairline */}
      <span className="pointer-events-none absolute inset-y-0 right-0 w-px bg-white/[0.04]" />
    </div>
  );
}

