const glass    = { background: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.13)" } as const;
const inputStyle = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", outline: "none" } as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={glass}>
      <div className="px-5 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <p className="text-sm font-semibold text-white">{title}</p>
      </div>
      <div className="px-5 py-4 flex flex-col gap-4">{children}</div>
    </div>
  );
}

function Field({ label, placeholder, value, type = "text" }: { label: string; placeholder: string; value?: string; type?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold text-white/38 uppercase tracking-widest">{label}</label>
      <input
        type={type}
        defaultValue={value}
        placeholder={placeholder}
        className="h-10 px-3.5 rounded-xl text-sm placeholder-white/22"
        style={inputStyle}
      />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-5 max-w-xl">
      <h1 className="text-xl font-bold text-white">Настройки магазина</h1>

      <Section title="Основная информация">
        <Field label="Название магазина" placeholder="Nike Uzbekistan" value="Nike Uzbekistan" />
        <Field label="Slug (ссылка)" placeholder="nike" value="nike" />
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-white/38 uppercase tracking-widest">Описание</label>
          <textarea
            rows={3}
            defaultValue="Официальный магазин Nike. Оригинальная спортивная одежда и обувь с доставкой по Ташкенту."
            className="px-3.5 py-2.5 rounded-xl text-sm placeholder-white/22 resize-none"
            style={inputStyle}
          />
        </div>
      </Section>

      <Section title="Контакты">
        <Field label="Telegram" placeholder="@nike_uz" value="@nike_uz" />
        <Field label="Телефон" placeholder="+998 90 000 00 00" value="+998 90 123 45 67" type="tel" />
      </Section>

      <Section title="Доставка">
        <Field label="Стоимость доставки (сум)" placeholder="25 000" value="25 000" />
        <Field label="Адрес самовывоза" placeholder="г. Ташкент, ул. Амира Темура 5" value="г. Ташкент, ул. Амира Темура 5" />
      </Section>

      <button
        className="self-start px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
        style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)", boxShadow: "0 4px 16px rgba(167,139,250,.35)" }}
      >
        Сохранить изменения
      </button>
    </div>
  );
}
