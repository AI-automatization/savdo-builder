import Link from "next/link";
import { Search, ChevronRight } from "lucide-react";

// Mock data — заменить на реальный endpoint когда появится GET /api/v1/admin/orders
const orders = [
  { id: "order-001", store: "Малика Boutique", buyer: "+998 90 555 11 22", total: "85 000 сум", status: "PENDING", createdAt: "25.03.2026 14:30" },
  { id: "order-002", store: "AzizShop", buyer: "+998 91 333 44 55", total: "13 500 000 сум", status: "CONFIRMED", createdAt: "25.03.2026 12:15" },
  { id: "order-003", store: "TechShop", buyer: "+998 93 777 88 99", total: "450 000 сум", status: "DELIVERED", createdAt: "24.03.2026 09:00" },
  { id: "order-004", store: "FashionUz", buyer: "+998 97 111 22 33", total: "120 000 сум", status: "CANCELLED", createdAt: "23.03.2026 18:45" },
];

const statusLabels: Record<string, { label: string; cls: string }> = {
  PENDING:    { label: "Новый",      cls: "badge-pending" },
  CONFIRMED:  { label: "Подтверждён", cls: "badge-draft" },
  PROCESSING: { label: "В обработке", cls: "badge-draft" },
  SHIPPED:    { label: "Отправлен",  cls: "badge-draft" },
  DELIVERED:  { label: "Доставлен",  cls: "badge-approved" },
  CANCELLED:  { label: "Отменён",    cls: "badge-rejected" },
  REFUNDED:   { label: "Возврат",    cls: "badge-suspended" },
};

export default function OrdersPage() {
  return (
    <>
      <div className="p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--color-text)" }}>Заказы</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>Всего: {orders.length}</p>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
            <input type="text" placeholder="Поиск по ID, телефону..." className="admin-input"
              style={{ paddingLeft: "34px", width: "260px" }} />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {["Все", "Новые", "Подтверждены", "Доставлены", "Отменены"].map(tab => (
            <button key={tab} className="btn-ghost text-xs" style={{ padding: "5px 12px" }}>{tab}</button>
          ))}
        </div>

        <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID заказа</th>
                <th>Магазин</th>
                <th>Покупатель</th>
                <th>Сумма</th>
                <th>Статус</th>
                <th>Создан</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => {
                const status = statusLabels[order.status];
                return (
                  <tr key={order.id}>
                    <td className="font-mono text-xs" style={{ color: "var(--color-primary)" }}>
                      #{order.id.slice(-6)}
                    </td>
                    <td className="font-medium">{order.store}</td>
                    <td style={{ color: "var(--color-text-muted)" }}>{order.buyer}</td>
                    <td className="font-semibold">{order.total}</td>
                    <td><span className={`badge-status ${status.cls}`}>{status.label}</span></td>
                    <td style={{ color: "var(--color-text-muted)", fontSize: "12px" }}>{order.createdAt}</td>
                    <td>
                      <Link href={`/orders/${order.id}`} className="btn-ghost" style={{ padding: "4px 10px", fontSize: "12px" }}>
                        <ChevronRight size={12} />
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
