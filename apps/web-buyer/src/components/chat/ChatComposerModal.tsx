"use client";

import { useEffect, useRef, useState } from "react";
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
  const dialogRef = useRef<HTMLDivElement>(null);

  // onClose/isPending read via refs so this effect runs once on mount — keeping it
  // keyed to `onClose` (a fresh arrow fn on every parent re-render) tore the
  // listener down and rebuilt it constantly, which is also what let Esc/backdrop
  // fire mid-send below (isPending wasn't checked at all before).
  const onCloseRef = useRef(onClose);
  const isPendingRef = useRef(create.isPending);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => { isPendingRef.current = create.isPending; }, [create.isPending]);

  // A11y: Esc закрывает, focus заперт внутри (Tab/Shift+Tab циклятся)
  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (isPendingRef.current) return; // don't drop an in-flight send / its error
        onCloseRef.current();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const nodes = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]),[href],input,textarea,[tabindex]:not([tabindex="-1"])',
        );
        if (nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prevFocus?.focus?.();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      onClick={() => { if (!create.isPending) onClose(); }}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md rounded-lg p-5 flex flex-col gap-4 relative"
        style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t('chat.composer.title')}
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
            subtitle={t('chat.composer.loginSubtitle', { title })}
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
