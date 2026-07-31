"use client";

import { useState, type FormEvent } from "react";
import { Mail } from "lucide-react";
import type { Dict } from "@/lib/i18n";

const EMAIL = "hello@maxsavdo.uz";

// Лендинг статичный, без бэкенда для приёма лидов. Честный путь — собрать
// письмо и открыть его в почтовом клиенте пользователя (mailto:), а не
// рисовать "сообщение получено", когда данные никуда не сохраняются.
export default function ContactForm({ dict }: { dict: Dict["contactsPage"] }) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [topic, setTopic] = useState(0);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ name?: boolean; contact?: boolean; message?: boolean }>({});

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = true;
    if (contact.trim().length < 5) next.contact = true;
    if (message.trim().length < 10) next.message = true;
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const subject = encodeURIComponent(`${dict.formTopics[topic]} — ${name}`);
    const body = encodeURIComponent(`${message}\n\n---\n${dict.formContact}: ${contact}`);
    window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`;
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div>
        <label htmlFor="cf-name" className="block text-xs font-semibold uppercase tracking-wider text-brand-muted mb-1.5">
          {dict.formName}
        </label>
        <input
          id="cf-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={dict.formNamePlaceholder}
          className="w-full rounded-lg border border-brand-border bg-brand-bg px-3.5 py-2.5 text-sm text-brand-text outline-none focus:border-brand-accent"
        />
        {errors.name && <p className="mt-1 text-xs text-red-400">—</p>}
      </div>

      <div>
        <label htmlFor="cf-contact" className="block text-xs font-semibold uppercase tracking-wider text-brand-muted mb-1.5">
          {dict.formContact}
        </label>
        <input
          id="cf-contact"
          type="text"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder={dict.formContactPlaceholder}
          className="w-full rounded-lg border border-brand-border bg-brand-bg px-3.5 py-2.5 text-sm text-brand-text outline-none focus:border-brand-accent"
        />
        {errors.contact && <p className="mt-1 text-xs text-red-400">—</p>}
      </div>

      <div>
        <label htmlFor="cf-topic" className="block text-xs font-semibold uppercase tracking-wider text-brand-muted mb-1.5">
          {dict.formTopic}
        </label>
        <select
          id="cf-topic"
          value={topic}
          onChange={(e) => setTopic(Number(e.target.value))}
          className="w-full rounded-lg border border-brand-border bg-brand-bg px-3.5 py-2.5 text-sm text-brand-text outline-none focus:border-brand-accent"
        >
          {dict.formTopics.map((t, i) => (
            <option key={t} value={i}>{t}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="cf-message" className="block text-xs font-semibold uppercase tracking-wider text-brand-muted mb-1.5">
          {dict.formMessage}
        </label>
        <textarea
          id="cf-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={dict.formMessagePlaceholder}
          rows={5}
          className="w-full rounded-lg border border-brand-border bg-brand-bg px-3.5 py-2.5 text-sm text-brand-text outline-none resize-none focus:border-brand-accent"
        />
        {errors.message && <p className="mt-1 text-xs text-red-400">—</p>}
      </div>

      <button type="submit" className="btn-primary">
        <Mail size={16} /> {dict.formSubmit}
      </button>
    </form>
  );
}
