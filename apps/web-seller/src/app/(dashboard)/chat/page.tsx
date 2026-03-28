const glass    = { background: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.13)" } as const;
const glassDim = { background: "rgba(255,255,255,0.04)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.08)" } as const;

const CHATS = [
  { id: "1", name: "Азиз Каримов",     last: "Когда будет доставка?",       time: "14:23", unread: 2 },
  { id: "2", name: "Санжар Рашидов",   last: "Спасибо, получил!",           time: "11:05", unread: 0 },
  { id: "3", name: "Дилноза Мирзаева", last: "Есть размер 42?",             time: "вчера",  unread: 1 },
  { id: "4", name: "Камол Турсунов",   last: "Ок, жду",                     time: "вчера",  unread: 0 },
];

export default function ChatPage() {
  return (
    <div className="flex gap-5 max-w-4xl h-[calc(100vh-10rem)]">

      {/* Chat list */}
      <div className="w-72 flex-shrink-0 rounded-2xl overflow-hidden flex flex-col" style={glass}>
        <div className="px-4 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-sm font-semibold text-white">Чаты</p>
        </div>
        <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          {CHATS.map((c, i) => (
            <div key={c.id} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors" style={i === 0 ? { background: "rgba(167,139,250,.10)" } : {}}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: "rgba(167,139,250,.25)", color: "#A78BFA" }}>
                {c.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{c.name}</p>
                <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.38)" }}>{c.last}</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.28)" }}>{c.time}</span>
                {c.unread > 0 && (
                  <span className="w-4.5 h-4.5 flex items-center justify-center rounded-full text-[10px] font-bold" style={{ background: "#A78BFA", color: "#0d0d1f", width: 18, height: 18 }}>
                    {c.unread}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat window */}
      <div className="flex-1 rounded-2xl flex flex-col overflow-hidden" style={glass}>
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "rgba(167,139,250,.25)", color: "#A78BFA" }}>А</div>
          <div>
            <p className="text-sm font-semibold text-white">Азиз Каримов</p>
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>Заказ #2401</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
          {[
            { from: "buyer",  text: "Здравствуйте! Мой заказ #2401 — когда будет доставка?", time: "14:20" },
            { from: "seller", text: "Добрый день! Ваш заказ уже в пути, курьер доставит сегодня до 18:00.", time: "14:22" },
            { from: "buyer",  text: "Когда будет доставка?", time: "14:23" },
          ].map((m, i) => (
            <div key={i} className={`flex ${m.from === "seller" ? "justify-end" : "justify-start"}`}>
              <div
                className="max-w-[70%] px-3.5 py-2.5 rounded-2xl text-sm text-white"
                style={m.from === "seller"
                  ? { background: "rgba(167,139,250,.28)", borderBottomRightRadius: 4 }
                  : { ...glassDim, borderBottomLeftRadius: 4 }
                }
              >
                <p>{m.text}</p>
                <p className="text-[10px] mt-1 text-right" style={{ color: "rgba(255,255,255,0.35)" }}>{m.time}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <input
            type="text"
            placeholder="Написать сообщение..."
            className="flex-1 h-10 px-4 rounded-xl text-sm text-white placeholder-white/25 outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.11)" }}
          />
          <button
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
