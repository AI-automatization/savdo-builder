"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, X } from "lucide-react";
import { ThreadType } from "types";
import { useCreateThread } from "@/hooks/use-chat";
import { useAuth } from "@/lib/auth/context";
import { OtpGate } from "@/components/auth/OtpGate";
import { colors } from "@/lib/styles";
import { useTranslation } from "@/lib/i18n";

type Props = {
  contextType: ThreadType;
  contextId: string;
  title: string;
  initialText?: string;
  onClose: () => void;
};

export default function ChatComposerModal({ contextType, contextId, title, initialText, onClose }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
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
      setError(err?.response?.data?.message ?? t('chat.composer.sendError'));
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(15,17,21,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg p-5 flex flex-col gap-4 relative"
        style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
          style={{ background: "transparent", color: colors.textMuted, border: "none" }}
          aria-label={t('chat.composer.closeLabel')}
        >
          <X size={16} />
        </button>

        {!isAuthenticated ? (
          <OtpGate
            icon={<MessageSquare size={22} style={{ color: colors.brand }} />}
            title={t('chat.composer.loginTitle')}
            subtitle={t('chat.composer.loginSubtitle').replace('{title}', title)}
          />
        ) : (
          <ComposerBody
            title={title}
            text={text}
            setText={setText}
            error={error}
            isPending={create.isPending}
            onCancel={onClose}
            onSend={handleSend}
          />
        )}
      </div>
    </div>
  );
}

function ComposerBody({
  title,
  text,
  setText,
  error,
  isPending,
  onCancel,
  onSend,
}: {
  title: string;
  text: string;
  setText: (v: string) => void;
  error: string | null;
  isPending: boolean;
  onCancel: () => void;
  onSend: () => void;
}) {
  const { t } = useTranslation();

  return (
    <>
      <div>
        <h2 className="text-lg font-bold" style={{ color: colors.textStrong }}>{t('chat.composer.title')}</h2>
        <p className="text-xs mt-0.5 truncate" style={{ color: colors.textMuted }}>{title}</p>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t('chat.composer.placeholder')}
        maxLength={2000}
        autoFocus
        className="w-full rounded-md resize-none focus:outline-none placeholder:opacity-50 text-sm"
        style={{
          padding: "10px 12px",
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          color: colors.textBody,
          minHeight: 100,
        }}
      />

      {error && (
        <p className="text-xs" style={{ color: colors.danger }}>{error}</p>
      )}

      <div className="flex gap-2.5 justify-end">
        <button
          onClick={onCancel}
          disabled={isPending}
          className="px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
          style={{ background: "transparent", color: colors.textMuted, border: "none" }}
        >
          {t('common.cancel')}
        </button>
        <button
          onClick={onSend}
          disabled={!text.trim() || isPending}
          className="px-4 py-2 rounded-md text-sm font-semibold disabled:opacity-40"
          style={{ background: colors.brand, color: colors.brandTextOnBg, border: "none" }}
        >
          {isPending ? t('chat.composer.sending') : t('chat.composer.send')}
        </button>
      </div>
    </>
  );
}
