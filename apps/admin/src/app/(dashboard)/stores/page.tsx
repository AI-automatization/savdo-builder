import Link from "next/link";
import { Search, ChevronRight, Globe } from "lucide-react";

// Mock data — заменить на GET /api/v1/admin/stores
const stores = [
  { id: "1", name: "AzizShop", slug: "azizshop", seller: "Азиз К.", status: "PENDING_REVIEW", isPublic: false, createdAt: "25.03.2026" },
  { id: "2", name: "Малика Boutique", slug: "malika-boutique", seller: "Малика У.", status: "APPROVED", isPublic: true, createdAt: "20.03.2026" },
  { id: "3", name: "FashionUz", slug: "fashionuz", seller: "Фарида Н.", status: "SUSPENDED", isPublic: false, createdAt: "15.03.2026" },
  { id: "4", name: "TechShop", slug: "techshop-uz", seller: "Санжар И.", status: "DRAFT", isPublic: false, createdAt: "05.03.2026" },
];

const statusLabels: Record<string, { label: string; cls: string }> = {
  DRAFT:          { label: "Черновик",      cls: "badge-draft" },
  PENDING_REVIEW: { label: "На проверке",   cls: "badge-pending" },
  APPROVED:       { label: "Одобрен",       cls: "badge-approved" },
  REJECTED:       { label: "Отклонён",      cls: "badge-rejected" },
  SUSPENDED:      { label: "Приостановлен", cls: "badge-suspended" },
  ARCHIVED:       { label: "В архиве",      cls: "badge-archived" },
};

export default function StoresPage() {
  return (
    <>
      <div className="p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--color-text)" }}>Магазины</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>Всего: {stores.length}</p>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
            <input type="text" placeholder="Поиск по названию, slug..." className="admin-input"
              style={{ paddingLeft: "34px", width: "260px" }} />
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {["Все", "На проверке", "Одобрены", "Отклонены", "Приостановлены"].map(tab => (
            <button key={tab} className="btn-ghost text-xs" style={{ padding: "5px 12px" }}>{tab}</button>
          ))}
        </div>

        <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Магазин</th>
                <th>Продавец</th>
                <th>Статус</th>
                <th>Публичный</th>
                <th>Создан</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {stores.map(store => {
                const status = statusLabels[store.status];
                return (
                  <tr key={store.id}>
                    <td>
                      <div>
                        <div className="font-medium">{store.name}</div>
                        <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>/{store.slug}</div>
                      </div>
                    </td>
                    <td style={{ color: "var(--color-text-muted)" }}>{store.seller}</td>
                    <td><span className={`badge-status ${status.cls}`}>{status.label}</span></td>
                    <td>
                      {store.isPublic
                        ? <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-success)" }}><Globe size={12} /> Да</span>
                        : <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Нет</span>}
                    </td>
                    <td style={{ color: "var(--color-text-muted)" }}>{store.createdAt}</td>
                    <td>
                      <Link href={`/stores/${store.id}`} className="btn-ghost" style={{ padding: "4px 10px", fontSize: "12px" }}>
                        Подробнее <ChevronRight size={12} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
