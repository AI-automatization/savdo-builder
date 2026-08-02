const colors: Record<string, { bg: string; text: string; dot: string }> = {
  PENDING:          { bg: 'rgba(234,179,8,0.15)',   text: '#EAB308', dot: '#EAB308' },
  CONFIRMED:        { bg: 'rgba(59,130,246,0.15)',  text: '#3B82F6', dot: '#3B82F6' },
  PROCESSING:       { bg: 'rgba(59,130,246,0.15)',  text: '#3B82F6', dot: '#3B82F6' },
  SHIPPED:          { bg: 'rgba(249,115,22,0.15)',  text: '#F97316', dot: '#F97316' },
  DELIVERED:        { bg: 'rgba(34,197,94,0.15)',   text: '#22C55E', dot: '#22C55E' },
  CANCELLED:        { bg: 'rgba(239,68,68,0.15)',   text: '#EF4444', dot: '#EF4444' },
  ACTIVE:           { bg: 'rgba(34,197,94,0.15)',   text: '#22C55E', dot: '#22C55E' },
  APPROVED:         { bg: 'rgba(34,197,94,0.15)',   text: '#22C55E', dot: '#22C55E' },
  // STORE-STATUS-BADGE-001: PENDING_REVIEW и REJECTED раньше fallback'или на
  // серый DRAFT — продавец не понимал что заявка на модерации/отклонена.
  // DRAFT (legacy) после миграции StoreStatus → @default(PENDING_REVIEW) не
  // должен встречаться, поэтому красим в orange как PENDING_REVIEW.
  DRAFT:            { bg: 'rgba(249,115,22,0.15)',  text: '#F97316', dot: '#F97316' },
  PENDING_REVIEW:   { bg: 'rgba(249,115,22,0.15)',  text: '#F97316', dot: '#F97316' },
  REJECTED:         { bg: 'rgba(239,68,68,0.15)',   text: '#EF4444', dot: '#EF4444' },
  SUSPENDED:        { bg: 'rgba(239,68,68,0.15)',   text: '#EF4444', dot: '#EF4444' },
  ARCHIVED:         { bg: 'rgba(156,163,175,0.12)', text: '#6B7280', dot: '#6B7280' },
  HIDDEN_BY_ADMIN:  { bg: 'rgba(239,68,68,0.15)',   text: '#EF4444', dot: '#EF4444' },
};

const labels: Record<string, string> = {
  PENDING:         'Обрабатывается',
  CONFIRMED:       'Подтверждён',
  PROCESSING:      'В обработке',
  SHIPPED:         'В пути',
  DELIVERED:       'Доставлен',
  CANCELLED:       'Отменён',
  ACTIVE:          'Активен',
  APPROVED:        'Одобрено',
  // DRAFT legacy → показываем как «На проверке» (после миграции не встречается).
  DRAFT:           'На проверке',
  PENDING_REVIEW:  'На проверке',
  REJECTED:        'Отклонено',
  SUSPENDED:       'Заблокирован',
  ARCHIVED:        'Архив',
  HIDDEN_BY_ADMIN: 'Скрыт',
};

export function Badge({ status }: { status: string }) {
  const c = colors[status] ?? colors.DRAFT;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xxs font-bold uppercase"
      style={{ background: c.bg, color: c.text }}
    >
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
      {labels[status] ?? status}
    </span>
  );
}
