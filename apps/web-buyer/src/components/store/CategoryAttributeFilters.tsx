"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronDown, Filter as FilterIcon, X } from "lucide-react";
import type { GlobalCategory } from "types";
import type { StorefrontCategoryFilter } from "@/lib/api/storefront.api";
import { glass, glassDim } from "@/lib/styles";

type Props = {
  /** All global categories (Sprint 31). User picks one to enable attribute filters. */
  globalCategories: GlobalCategory[];
  /** Active global category slug parsed from URL ?gcat=. */
  activeGlobalSlug: string | null;
  /** Filter metadata for the active global category (empty if none selected). */
  attributeFilters: StorefrontCategoryFilter[];
  /** Active attribute values from URL ?f.<key>=<value>. */
  activeAttributes: Record<string, string>;
};

export default function CategoryAttributeFilters({
  globalCategories,
  activeGlobalSlug,
  attributeFilters,
  activeAttributes,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const activeCount =
    (activeGlobalSlug ? 1 : 0) + Object.values(activeAttributes).filter(Boolean).length;

  function pushParams(updater: (params: URLSearchParams) => void) {
    const next = new URLSearchParams(searchParams.toString());
    updater(next);
    const qs = next.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  function handlePickGlobalCategory(slug: string | null) {
    pushParams((p) => {
      // Clear all attribute filters when category changes — they belong to the previous category
      Array.from(p.keys())
        .filter((k) => k.startsWith("f."))
        .forEach((k) => p.delete(k));
      if (slug) p.set("gcat", slug);
      else p.delete("gcat");
    });
  }

  function handleSetAttribute(key: string, value: string | null) {
    pushParams((p) => {
      if (value) p.set(`f.${key}`, value);
      else p.delete(`f.${key}`);
    });
  }

  function handleClearAll() {
    pushParams((p) => {
      Array.from(p.keys())
        .filter((k) => k === "gcat" || k.startsWith("f."))
        .forEach((k) => p.delete(k));
    });
  }

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex-shrink-0 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors"
          style={
            open || activeCount > 0
              ? { background: "rgba(167,139,250,.22)", color: "#A78BFA", border: "1px solid rgba(167,139,250,.40)" }
              : { ...glassDim, color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.10)" }
          }
        >
          <FilterIcon size={14} />
          Фильтры
          {activeCount > 0 && (
            <span
              className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold"
              style={{ background: "#A78BFA", color: "#1a0533" }}
            >
              {activeCount}
            </span>
          )}
        </button>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            disabled={isPending}
            className="text-xs transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ color: "rgba(255,255,255,0.40)" }}
          >
            Сбросить
          </button>
        )}
      </div>

      {open && (
        <div className="mt-3 p-4 rounded-2xl flex flex-col gap-4" style={glass}>
          {/* Global category select */}
          <div>
            <p className="text-[11px] uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.40)" }}>
              Категория
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => handlePickGlobalCategory(null)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                style={
                  !activeGlobalSlug
                    ? { background: "rgba(167,139,250,.28)", color: "#A78BFA", border: "1px solid rgba(167,139,250,.45)" }
                    : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.10)" }
                }
              >
                Все
              </button>
              {globalCategories.map((cat) => {
                const isActive = activeGlobalSlug === cat.slug;
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => handlePickGlobalCategory(cat.slug)}
                    className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                    style={
                      isActive
                        ? { background: "rgba(167,139,250,.28)", color: "#A78BFA", border: "1px solid rgba(167,139,250,.45)" }
                        : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.10)" }
                    }
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Attribute filters — only shown when a category is picked */}
          {activeGlobalSlug && attributeFilters.length === 0 && (
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              У этой категории нет дополнительных фильтров
            </p>
          )}
          {activeGlobalSlug && attributeFilters.length > 0 && (
            <div className="flex flex-col gap-3">
              {attributeFilters.map((f) => (
                <AttributeControl
                  key={f.key}
                  filter={f}
                  value={activeAttributes[f.key] ?? ""}
                  onChange={(v) => handleSetAttribute(f.key, v)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AttributeControl({
  filter,
  value,
  onChange,
}: {
  filter: StorefrontCategoryFilter;
  value: string;
  onChange: (v: string | null) => void;
}) {
  const label = filter.unit ? `${filter.nameRu} (${filter.unit})` : filter.nameRu;

  if (filter.fieldType === "select" && filter.options && filter.options.length > 0) {
    return (
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.40)" }}>
          {label}
        </span>
        <div className="relative">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value || null)}
            className="w-full appearance-none px-3 pr-9 py-2 rounded-xl text-sm text-white outline-none"
            style={{ ...glassDim, border: "1px solid rgba(255,255,255,0.10)" }}
          >
            <option value="" style={{ background: "#1a0533" }}>
              Любой
            </option>
            {filter.options.map((opt) => (
              <option key={opt} value={opt} style={{ background: "#1a0533" }}>
                {opt}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: "rgba(255,255,255,0.40)" }}
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute right-8 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-white/10"
              aria-label="Очистить"
            >
              <X size={12} style={{ color: "rgba(255,255,255,0.55)" }} />
            </button>
          )}
        </div>
      </label>
    );
  }

  // boolean → toggle pill
  if (filter.fieldType === "boolean") {
    const isActive = value === "true";
    return (
      <label className="flex items-center justify-between gap-3">
        <span className="text-sm text-white">{label}</span>
        <button
          type="button"
          onClick={() => onChange(isActive ? null : "true")}
          className="relative w-10 h-6 rounded-full transition-colors"
          style={{
            background: isActive ? "rgba(167,139,250,.45)" : "rgba(255,255,255,0.10)",
          }}
        >
          <span
            className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform"
            style={{ transform: isActive ? "translateX(18px)" : "translateX(2px)" }}
          />
        </button>
      </label>
    );
  }

  // number / text → free input
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.40)" }}>
        {label}
      </span>
      <input
        type={filter.fieldType === "number" ? "number" : "text"}
        value={value}
        onChange={(e) => onChange(e.target.value || null)}
        placeholder="Любое"
        className="w-full px-3 py-2 rounded-xl text-sm text-white placeholder:text-white/30 outline-none"
        style={{ ...glassDim, border: "1px solid rgba(255,255,255,0.10)" }}
      />
    </label>
  );
}
