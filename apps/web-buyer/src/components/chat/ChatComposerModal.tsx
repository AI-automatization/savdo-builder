"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ThreadType } from "types";
import { useCreateThread } from "@/hooks/use-chat";
import { glass } from "@/lib/styles";

type Props = {
  contextType: ThreadType;
  contextId: string;
  title: string;
  initialText?: string;
  onClose: () => void;
};

export default function ChatComposerModal({ contextType, contextId, title, initialText, onClose }: Props) {
  const router = useRouter();
  const create = useCreateThread();
  const [text, setText] = useState(initialText ?? "");
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || create.isPending) return;
    setError(null);
    try {
      await create.mutateAsync({ contextType, contextId, firstMessage: trimmed });
      onClose();
      router.push("/chats");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err?.response?.data?.message ?? "Не удалось отправить сообщение. Попробуйте ещё раз.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-5 flex flex-col gap-4"
        style={glass}
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h2 className="text-base font-bold text-white">Написать продавцу</h2>
          <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.45)" }}>{title}</p>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Здравствуйте! Есть вопрос..."
          maxLength={2000}
          autoFocus
          className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/30 resize-none focus:outline-none"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.13)",
            minHeight: 100,
          }}
        />

        {error && (
          <p className="text-xs" style={{ color: "rgba(248,113,113,.85)" }}>{error}</p>
        )}

        <div className="flex gap-2.5 justify-end">
          <button
            onClick={onClose}
            disabled={create.isPending}
            className="px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
            style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.65)" }}
          >
            Отмена
          </button>
          <button
            onClick={handleSend}
            disabled={!text.trim() || create.isPending}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)" }}
          >
            {create.isPending ? "Отправка..." : "Отправить"}
          </button>
        </div>
      </div>
    </div>
  );
}
