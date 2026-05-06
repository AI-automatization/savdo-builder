import { useEffect, useRef, useState, useCallback } from 'react';
import { getSocket } from './socket';

type Role = 'BUYER' | 'SELLER';

interface TypingPayload {
  threadId: string;
  role: Role;
  isTyping: boolean;
}

/**
 * FEAT-005-FE: typing indicator hook.
 *
 * - emitTyping(true) — пушит `chat:typing { isTyping: true }` максимум 1 раз в 1.5 сек
 *   (throttle), плюс ставит auto-stop таймер на 2.5 сек если юзер перестал печатать.
 * - isOtherTyping — true когда другая сторона печатает; auto-fade 3 сек если новый
 *   typing event не пришёл (сервер не шлёт isTyping=false на каждый stop).
 */
export function useChatTyping(
  threadId: string | null,
  myRole: Role,
): { isOtherTyping: boolean; emitTyping: (isTyping: boolean) => void } {
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastEmitAt = useRef(0);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!threadId) return;
    const socket = getSocket();
    const onTyping = (p: TypingPayload) => {
      if (p.threadId !== threadId) return;
      if (p.role === myRole) return;
      if (p.isTyping) {
        setIsOtherTyping(true);
        if (fadeTimer.current) clearTimeout(fadeTimer.current);
        fadeTimer.current = setTimeout(() => setIsOtherTyping(false), 3000);
      } else {
        setIsOtherTyping(false);
        if (fadeTimer.current) clearTimeout(fadeTimer.current);
      }
    };
    socket.on('chat:typing', onTyping);
    return () => {
      socket.off('chat:typing', onTyping);
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
    };
  }, [threadId, myRole]);

  const emitTyping = useCallback((isTyping: boolean) => {
    if (!threadId) return;
    const socket = getSocket();
    if (isTyping) {
      const now = Date.now();
      if (now - lastEmitAt.current >= 1500) {
        socket.emit('chat:typing', { threadId, isTyping: true });
        lastEmitAt.current = now;
      }
      if (stopTimer.current) clearTimeout(stopTimer.current);
      stopTimer.current = setTimeout(() => {
        socket.emit('chat:typing', { threadId, isTyping: false });
        lastEmitAt.current = 0;
      }, 2500);
    } else {
      if (stopTimer.current) {
        clearTimeout(stopTimer.current);
        stopTimer.current = null;
      }
      socket.emit('chat:typing', { threadId, isTyping: false });
      lastEmitAt.current = 0;
    }
  }, [threadId]);

  return { isOtherTyping, emitTyping };
}
