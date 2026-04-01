"use client";

import { useState } from "react";
import {
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Store,
  Users,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

type Tab = "sellers" | "stores";

const mockSellers = [
  {
    id: "1",
    name: "Азиз Каримов",
    phone: "+998 90 123 45 67",
    type: "Физ. лицо",
    telegram: "@azizkarimov",
    createdAt: "25.03.2026 14:20",
    hasDoc: true,
    slaHours: 2,
  },
  {
    id: "2",
    name: "Малика Усманова",
    phone: "+998 91 987 65 43",
    type: "ИП",
    telegram: "@malikauz",
    createdAt: "25.03.2026 10:05",
    hasDoc: true,
    slaHours: 6,
  },
  {
    id: "3",
    name: "Санжар Ибрагимов",
    phone: "+998 90 111 22 33",
    type: "Физ. лицо",
    telegram: null,
    createdAt: "24.03.2026 18:30",
    hasDoc: false,
    slaHours: 18,
  },
];

const mockStores = [
  {
    id: "1",
    name: "AzizShop",
    slug: "azizshop",
    seller: "Азиз Каримов",
    category: "Электроника",
    createdAt: "25.03.2026 14:30",
    slaHours: 2,
  },
  {
    id: "2",
    name: "Флора Boutique",
    slug: "flora-boutique",
    seller: "Нилуфар Рашидова",
    category: "Одежда",
    createdAt: "24.03.2026 09:15",
    slaHours: 8,
  },
  {
    id: "3",
    name: "TechGadgets",
    slug: "techgadgets",
    seller: "Санжар Ибрагимов",
    category: "Гаджеты",
    createdAt: "23.03.2026 11:00",
    slaHours: 24,
  },
  {
    id: "4",
    name: "HomeDecor",
    slug: "homedecor",
    seller: "Зилола Мирзаева",
    category: "Дом",
    createdAt: "22.03.2026 16:45",
    slaHours: 36,
  },
  {
    id: "5",
    name: "SportShop",
    slug: "sportshop",
    seller: "Фирдавс Юсупов",
    category: "Спорт",
    createdAt: "21.03.2026 08:00",
    slaHours: 48,
  },
  {
    id: "6",
    name: "KidsWorld",
    slug: "kidsworld",
    seller: "Шахло Каримова",
    category: "Детские",
    createdAt: "20.03.2026 13:20",
    slaHours: 60,
  },
  {
    id: "7",
    name: "BeautyCorner",
    slug: "beautycorner",
    seller: "Ойдин Рахимова",
    category: "Красота",
    createdAt: "19.03.2026 17:00",
    slaHours: 72,
  },
];

function SlaTimer({ hours }: { hours: number }) {
  const isUrgent = hours >= 24;
  const isWarning = hours >= 12 && hours < 24;
  const color = isUrgent ? "#EF4444" : isWarning ? "#F59E0B" : "var(--color-text-muted)";
  const label =
    hours >= 24
      ? `${Math.floor(hours / 24)}д ${hours % 24}ч`
      : `${hours}ч`;

  return (
    <span
      className="flex items-center gap-1"
      style={{ fontSize: "11.5px", color, fontWeight: isUrgent ? "600" : "400" }}
    >
      <Clock size={11} />
      {label} назад
      {isUrgent && (
        <AlertTriangle size={11} style={{ color: "#EF4444", marginLeft: "1px" }} />
      )}
    </span>
  );
}

export default function ModerationPage() {
  const [tab, setTab] = useState<Tab>("sellers");
  const [rejectModal, setRejectModal] = useState<{
    id: string;
    name: string;
    type: Tab;
  } | null>(null);
  const [rejectComment, setRejectComment] = useState("");

  const handleApprove = (id: string, type: Tab) => {
    console.log("APPROVE", type, id);
    // TODO: POST /api/v1/admin/moderation/:id/action { action: "APPROVE" }
  };

  const handleReject = () => {
    if (!rejectModal || !rejectComment.trim()) return;
    console.log("REJECT", rejectModal.type, rejectModal.id, rejectComment);
    // TODO: POST /api/v1/admin/moderation/:id/action { action: "REJECT", comment }
    setRejectModal(null);
    setRejectComment("");
  };

  return (
    <div className="p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-xl font-bold"
            style={{ color: "var(--color-text)", letterSpacing: "-0.01em" }}
          >
            Очередь модерации
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            Всего: {mockSellers.length + mockStores.length} заявок ожидают проверки
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex items-center gap-1 p-1 rounded-xl w-fit"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
        }}
      >
        {([
          ["sellers", "Продавцы", mockSellers.length, Users],
          ["stores",  "Магазины", mockStores.length,  Store],
        ] as const).map(([key, label, count, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: tab === key ? "var(--color-primary)" : "transparent",
              color: tab === key ? "#fff" : "var(--color-text-muted)",
            }}
          >
            <Icon size={14} />
            {label}
            <span
              className="text-xs px-1.5 py-0.5 rounded-full font-bold"
              style={{
                background:
                  tab === key ? "rgba(255,255,255,0.25)" : "var(--color-primary-dim)",
                color: tab === key ? "#fff" : "var(--color-primary)",
              }}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Seller cards */}
      {tab === "sellers" && (
        <div className="flex flex-col gap-3">
          {mockSellers.map(seller => (
            <div key={seller.id} className="admin-card flex items-start gap-4">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ background: "var(--color-primary)" }}
              >
                {seller.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold" style={{ color: "var(--color-text)" }}>
                    {seller.name}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: "var(--color-primary-dim)",
                      color: "var(--color-primary)",
                    }}
                  >
                    {seller.type}
                  </span>
                  {!seller.hasDoc && (
                    <span className="badge-status badge-rejected">
                      <AlertTriangle size={10} /> Нет документа
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                  <span
                    className="text-sm font-mono"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {seller.phone}
                  </span>
                  {seller.telegram && (
                    <span
                      className="text-sm"
                      style={{ color: "var(--color-primary)", fontSize: "12.5px" }}
                    >
                      {seller.telegram}
                    </span>
                  )}
                  <SlaTimer hours={seller.slaHours} />
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href={`/sellers/${seller.id}`}
                  className="btn-ghost"
                  style={{ padding: "6px 10px", fontSize: "12px" }}
                >
                  <Eye size={13} /> Просмотр
                </Link>
                <button
                  className="btn-approve"
                  onClick={() => handleApprove(seller.id, "sellers")}
                >
                  <CheckCircle size={14} /> Одобрить
                </button>
                <button
                  className="btn-reject"
                  onClick={() =>
                    setRejectModal({ id: seller.id, name: seller.name, type: "sellers" })
                  }
                >
                  <XCircle size={14} /> Отклонить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Store cards */}
      {tab === "stores" && (
        <div className="flex flex-col gap-3">
          {mockStores.map(store => (
            <div key={store.id} className="admin-card flex items-start gap-4">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{
                  background: "rgba(129,140,248,0.15)",
                  color: "var(--color-primary)",
                }}
              >
                {store.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold" style={{ color: "var(--color-text)" }}>
                    {store.name}
                  </span>
                  <span
                    className="font-mono text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    /{store.slug}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: "var(--color-primary-dim)",
                      color: "var(--color-primary)",
                    }}
                  >
                    {store.category}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                  <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                    Продавец:{" "}
                    <span style={{ color: "var(--color-text)" }}>{store.seller}</span>
                  </span>
                  <SlaTimer hours={store.slaHours} />
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href={`/stores/${store.id}`}
                  className="btn-ghost"
                  style={{ padding: "6px 10px", fontSize: "12px" }}
                >
                  <Eye size={13} /> Просмотр
                </Link>
                <button
                  className="btn-approve"
                  onClick={() => handleApprove(store.id, "stores")}
                >
                  <CheckCircle size={14} /> Одобрить
                </button>
                <button
                  className="btn-reject"
                  onClick={() =>
                    setRejectModal({ id: store.id, name: store.name, type: "stores" })
                  }
                >
                  <XCircle size={14} /> Отклонить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div
          className="admin-modal-backdrop"
          onClick={() => {
            setRejectModal(null);
            setRejectComment("");
          }}
        >
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div className="flex items-start gap-3 mb-5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(239,68,68,0.12)" }}
              >
                <XCircle size={20} style={{ color: "#EF4444" }} />
              </div>
              <div>
                <h3
                  className="text-base font-bold"
                  style={{ color: "var(--color-text)" }}
                >
                  Отклонить{" "}
                  {rejectModal.type === "sellers" ? "верификацию" : "магазин"}
                </h3>
                <p
                  className="text-sm mt-0.5"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  <span style={{ color: "var(--color-text)", fontWeight: "600" }}>
                    {rejectModal.name}
                  </span>{" "}
                  получит уведомление в Telegram с причиной.
                </p>
              </div>
            </div>

            <label
              className="block text-xs font-semibold uppercase tracking-wide mb-2"
              style={{ color: "var(--color-text-muted)" }}
            >
              Причина отклонения{" "}
              <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <textarea
              value={rejectComment}
              onChange={e => setRejectComment(e.target.value)}
              placeholder="Опишите причину отклонения..."
              rows={4}
              className="admin-input"
              style={{ resize: "none" }}
              autoFocus
              maxLength={500}
            />
            <p
              className="text-xs mt-1.5 mb-5"
              style={{ color: "var(--color-text-muted)" }}
            >
              Обязательное поле.{" "}
              <span
                style={{
                  color:
                    rejectComment.length > 450
                      ? "#EF4444"
                      : "var(--color-text-muted)",
                }}
              >
                {rejectComment.length}/500
              </span>
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                className="btn-ghost"
                onClick={() => {
                  setRejectModal(null);
                  setRejectComment("");
                }}
              >
                Отмена
              </button>
              <button
                className="btn-reject"
                onClick={handleReject}
                disabled={!rejectComment.trim()}
                style={{
                  opacity: rejectComment.trim() ? 1 : 0.5,
                  cursor: rejectComment.trim() ? "pointer" : "not-allowed",
                }}
              >
                <XCircle size={14} /> Отклонить <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
