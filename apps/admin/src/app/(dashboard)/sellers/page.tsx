"use client";

import { useState } from "react";
import { Search, ChevronRight, UserCheck, UserX, Clock, Filter } from "lucide-react";
import Link from "next/link";

const sellers = [
  {
    id: "1",
    businessName: "Азиз Каримов",
    phone: "+998 90 123 45 67",
    verificationStatus: "PENDING",
    storeSlug: "azizshop",
    createdAt: "25.03.2026",
  },
  {
    id: "2",
    businessName: "Малика Усманова",
    phone: "+998 91 987 65 43",
    verificationStatus: "VERIFIED",
    storeSlug: "malika-boutique",
    createdAt: "20.03.2026",
  },
  {
    id: "3",
    businessName: "Фарида Назарова",
    phone: "+998 93 456 78 90",
    verificationStatus: "SUSPENDED",
    storeSlug: "fashionuz",
    createdAt: "15.03.2026",
  },
  {
    id: "4",
    businessName: "Ойдин Рахимова",
    phone: "+998 97 321 65 98",
    verificationStatus: "REJECTED",
    storeSlug: null,
    createdAt: "10.03.2026",
  },
  {
    id: "5",
    businessName: "Санжар Ибрагимов",
    phone: "+998 90 111 22 33",
    verificationStatus: "UNVERIFIED",
    storeSlug: "techshop-uz",
    createdAt: "05.03.2026",
  },
  {
    id: "6",
    businessName: "Нилуфар Рашидова",
    phone: "+998 94 555 44 33",
    verificationStatus: "VERIFIED",
    storeSlug: "nilufar-store",
    createdAt: "01.03.2026",
  },
  {
    id: "7",
    businessName: "Зилола Мирзаева",
    phone: "+998 99 777 88 11",
    verificationStatus: "PENDING",
    storeSlug: null,
    createdAt: "28.02.2026",
  },
];

const statusConfig: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  UNVERIFIED: { label: "Не верифицирован", cls: "badge-draft",    icon: <Clock size={10} /> },
  PENDING:    { label: "На проверке",      cls: "badge-pending",  icon: <Clock size={10} /> },
  VERIFIED:   { label: "Верифицирован",    cls: "badge-active",   icon: <UserCheck size={10} /> },
  REJECTED:   { label: "Отклонён",         cls: "badge-rejected", icon: <UserX size={10} /> },
  SUSPENDED:  { label: "Заблокирован",     cls: "badge-suspended",icon: <UserX size={10} /> },
};

const filterTabs = [
  { key: "ALL",        label: "Все" },
  { key: "PENDING",    label: "На проверке" },
  { key: "VERIFIED",   label: "Верифицированы" },
  { key: "SUSPENDED",  label: "Заблокированы" },
  { key: "REJECTED",   label: "Отклонённые" },
];

const avatarColors = [
  "#818CF8", "#F59E0B", "#10B981", "#EF4444", "#6366F1", "#EC4899", "#14B8A6",
];

export default function SellersPage() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");

  const filtered = sellers.filter(s => {
    const matchFilter = activeFilter === "ALL" || s.verificationStatus === activeFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      s.businessName.toLowerCase().includes(q) ||
      s.phone.includes(q) ||
      (s.storeSlug ?? "").includes(q);
    return matchFilter && matchSearch;
  });

  return (
    <div className="p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-xl font-bold"
            style={{ color: "var(--color-text)", letterSpacing: "-0.01em" }}
          >
            Продавцы
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            Всего: {sellers.length} — показано: {filtered.length}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--color-text-muted)" }}
            />
            <input
              type="text"
              placeholder="Поиск по имени, телефону..."
              className="admin-input"
              style={{ paddingLeft: "34px", width: "280px" }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="btn-ghost" style={{ padding: "8px 12px" }}>
            <Filter size={14} />
            <span style={{ fontSize: "12.5px" }}>Фильтр</span>
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {filterTabs.map(tab => {
          const count =
            tab.key === "ALL"
              ? sellers.length
              : sellers.filter(s => s.verificationStatus === tab.key).length;
          const isActive = activeFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "5px 12px",
                borderRadius: "8px",
                fontSize: "12.5px",
                fontWeight: isActive ? "600" : "500",
                border: "1px solid",
                cursor: "pointer",
                transition: "all 150ms ease",
                background: isActive ? "var(--color-primary)" : "transparent",
                borderColor: isActive ? "var(--color-primary)" : "var(--color-border)",
                color: isActive ? "#fff" : "var(--color-text-muted)",
              }}
            >
              {tab.label}
              <span
                style={{
                  fontSize: "10.5px",
                  fontWeight: "700",
                  background: isActive ? "rgba(255,255,255,0.25)" : "var(--color-primary-dim)",
                  color: isActive ? "#fff" : "var(--color-primary)",
                  borderRadius: "10px",
                  padding: "0 5px",
                  lineHeight: "16px",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-14"
            style={{ color: "var(--color-text-muted)" }}
          >
            <Search size={32} style={{ opacity: 0.3, marginBottom: "10px" }} />
            <p className="text-sm">Ничего не найдено</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Продавец</th>
                <th>Телефон</th>
                <th>Статус</th>
                <th>Магазин</th>
                <th>Зарегистрирован</th>
                <th style={{ width: "1%" }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((seller, idx) => {
                const status = statusConfig[seller.verificationStatus];
                const avatarColor = avatarColors[idx % avatarColors.length];
                return (
                  <tr key={seller.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: avatarColor }}
                        >
                          {seller.businessName[0]}
                        </div>
                        <span className="font-medium">{seller.businessName}</span>
                      </div>
                    </td>
                    <td style={{ color: "var(--color-text-muted)", fontFamily: "monospace" }}>
                      {seller.phone}
                    </td>
                    <td>
                      <span className={`badge-status ${status.cls}`}>
                        {status.icon}
                        {status.label}
                      </span>
                    </td>
                    <td>
                      {seller.storeSlug ? (
                        <span
                          className="font-mono text-xs"
                          style={{ color: "var(--color-primary)" }}
                        >
                          /{seller.storeSlug}
                        </span>
                      ) : (
                        <span style={{ color: "var(--color-border)", fontSize: "16px" }}>—</span>
                      )}
                    </td>
                    <td style={{ color: "var(--color-text-muted)", fontSize: "12.5px" }}>
                      {seller.createdAt}
                    </td>
                    <td>
                      <Link
                        href={`/sellers/${seller.id}`}
                        className="btn-ghost"
                        style={{ padding: "5px 10px", fontSize: "12px", whiteSpace: "nowrap" }}
                      >
                        Подробнее <ChevronRight size={12} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
