import { Lock, Filter } from "lucide-react";

// Mock data — заменить на GET /api/v1/admin/audit-log
const logs = [
  { id: "1", time: "25.03.2026 14:32", actor: "Admin", action: "STORE_APPROVED", entityType: "store", entity: "Малика Shop", reason: "Все документы в порядке" },
  { id: "2", time: "25.03.2026 12:15", actor: "Admin", action: "SELLER_REJECTED", entityType: "seller", entity: "Ойдин Усманова", reason: "Документ нечёткий" },
  { id: "3", time: "25.03.2026 10:00", actor: "Admin", action: "STORE_SUSPENDED", entityType: "store", entity: "FashionUz", reason: "Нарушение правил" },
  { id: "4", time: "24.03.2026 18:45", actor: "Admin", action: "USER_BLOCKED", entityType: "user", entity: "+998 90 XXX XX XX", reason: "Спам" },
  { id: "5", time: "24.03.2026 15:00", actor: "Admin", action: "SELLER_VERIFIED", entityType: "seller", entity: "Азиз Каримов", reason: null },
  { id: "6", time: "23.03.2026 11:30", actor: "Admin", action: "STORE_UNSUSPENDED", entityType: "store", entity: "TechShop", reason: "Нарушение устранено" },
];

const actionColor: Record<string, string> = {
  STORE_APPROVED:   "var(--color-success)",
  SELLER_VERIFIED:  "var(--color-success)",
  STORE_UNSUSPENDED:"var(--color-success)",
  SELLER_REJECTED:  "var(--color-error)",
  USER_BLOCKED:     "var(--color-error)",
  STORE_SUSPENDED:  "var(--color-warning)",
};

export default function AuditLogsPage() {
  return (
    <>
      <div className="p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--color-text)" }}>Аудит-лог</h2>
            <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: "var(--color-text-muted)" }}>
              <Lock size={11} /> Только чтение. Записи нельзя удалить.
            </p>
          </div>
          <button className="btn-ghost">
            <Filter size={14} /> Фильтры
          </button>
        </div>

        <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Время</th>
                <th>Кто</th>
                <th>Действие</th>
                <th>Тип</th>
                <th>Объект</th>
                <th>Причина</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td className="font-mono text-xs" style={{ color: "var(--color-text-muted)" }}>{log.time}</td>
                  <td className="font-medium">{log.actor}</td>
                  <td>
                    <span className="text-xs font-bold font-mono"
                      style={{ color: actionColor[log.action] ?? "var(--color-text)" }}>
                      {log.action}
                    </span>
                  </td>
                  <td>
                    <span className="text-xs px-2 py-0.5 rounded"
                      style={{ background: "var(--color-primary-dim)", color: "var(--color-primary)" }}>
                      {log.entityType}
                    </span>
                  </td>
                  <td style={{ color: "var(--color-text)" }}>{log.entity}</td>
                  <td className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {log.reason ?? <span style={{ opacity: 0.4 }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination placeholder */}
        <div className="flex items-center justify-between text-xs" style={{ color: "var(--color-text-muted)" }}>
          <span>Показано 6 из 87 записей</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, "...", 10].map((p, i) => (
              <button key={i} className="btn-ghost"
                style={{ padding: "4px 8px", background: p === 1 ? "var(--color-primary)" : undefined, color: p === 1 ? "#fff" : undefined, border: p === 1 ? "none" : undefined }}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
