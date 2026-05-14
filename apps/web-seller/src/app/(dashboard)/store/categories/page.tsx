'use client';

import { useState } from 'react';
import type { StoreCategory } from 'types';
import {
  useStoreCategories,
  useCreateStoreCategory,
  useUpdateStoreCategory,
  useDeleteStoreCategory,
} from '@/hooks/use-seller';
import { Pencil, Trash2, Plus, Check, X, ArrowUp, ArrowDown } from 'lucide-react';
import { card, cardMuted, colors, dangerTint, inputStyle } from '@/lib/styles';
import { ConfirmModal } from '@/components/confirm-modal';

const MAX_NAME_LEN = 60;

export default function StoreCategoriesPage() {
  const { data: categories, isLoading, error } = useStoreCategories();
  const createMut = useCreateStoreCategory();
  const updateMut = useUpdateStoreCategory();
  const deleteMut = useDeleteStoreCategory();

  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const sorted = (categories ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder);
  const deletingItem = sorted.find((c) => c.id === deletingId) ?? null;

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    await createMut.mutateAsync({ name, sortOrder: sorted.length });
    setNewName('');
  }

  function startEdit(c: StoreCategory) {
    setEditingId(c.id);
    setEditName(c.name);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName('');
  }

  async function saveEdit() {
    const name = editName.trim();
    if (!name || !editingId) return;
    await updateMut.mutateAsync({ id: editingId, name });
    cancelEdit();
  }

  async function moveUp(i: number) {
    if (i <= 0) return;
    const a = sorted[i];
    const b = sorted[i - 1];
    await Promise.all([
      updateMut.mutateAsync({ id: a.id, sortOrder: b.sortOrder }),
      updateMut.mutateAsync({ id: b.id, sortOrder: a.sortOrder }),
    ]);
  }

  async function moveDown(i: number) {
    if (i >= sorted.length - 1) return;
    const a = sorted[i];
    const b = sorted[i + 1];
    await Promise.all([
      updateMut.mutateAsync({ id: a.id, sortOrder: b.sortOrder }),
      updateMut.mutateAsync({ id: b.id, sortOrder: a.sortOrder }),
    ]);
  }

  async function confirmDelete() {
    if (!deletingId) return;
    await deleteMut.mutateAsync(deletingId);
    setDeletingId(null);
  }

  const apiError = createMut.error || updateMut.error || deleteMut.error;

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: colors.textPrimary }}>
          Категории магазина
        </h1>
        <p className="text-sm mt-1" style={{ color: colors.textMuted }}>
          Группируйте товары на витрине — покупатели смогут фильтровать по категориям.
        </p>
      </div>

      {/* Add form */}
      <div className="p-4 rounded-xl flex flex-col gap-2.5" style={card}>
        <label className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: colors.textDim }}>
          Добавить категорию
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="Например: Одежда, Электроника"
            maxLength={MAX_NAME_LEN}
            className="flex-1 px-3 h-10 text-sm rounded-md"
            style={inputStyle}
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={createMut.isPending || !newName.trim()}
            className="px-4 h-10 rounded-md text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-40 transition-opacity hover:opacity-90"
            style={{ background: colors.accent, color: colors.accentTextOnBg }}
          >
            <Plus size={14} aria-hidden="true" />
            {createMut.isPending ? 'Добавление…' : 'Добавить'}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {apiError && (
        <p
          className="text-xs px-3 py-2 rounded-md"
          style={{ color: colors.danger, background: dangerTint(0.10), border: `1px solid ${dangerTint(0.25)}` }}
        >
          {(apiError as Error).message ?? 'Не удалось выполнить операцию'}
        </p>
      )}

      {/* List */}
      {isLoading ? (
        <p className="text-sm" style={{ color: colors.textMuted }}>Загрузка…</p>
      ) : error ? (
        <p
          className="text-sm px-3 py-2 rounded-md"
          style={{ color: colors.danger, background: dangerTint(0.10), border: `1px solid ${dangerTint(0.25)}` }}
        >
          Не удалось загрузить категории.
        </p>
      ) : sorted.length === 0 ? (
        <div className="p-6 rounded-xl text-center" style={cardMuted}>
          <p className="text-sm" style={{ color: colors.textMuted }}>
            Пока нет категорий. Добавьте первую — она появится в фильтре магазина.
          </p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={card}>
          {sorted.map((c, i) => {
            const isEditing = editingId === c.id;
            return (
              <div
                key={c.id}
                className="flex items-center gap-2 px-3 py-2.5"
                style={i > 0 ? { borderTop: `1px solid ${colors.divider}` } : undefined}
              >
                {/* Order arrows */}
                <div className="flex flex-col gap-0.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => moveUp(i)}
                    disabled={i === 0 || updateMut.isPending}
                    aria-label="Поднять выше"
                    className="w-6 h-5 flex items-center justify-center rounded transition-opacity hover:opacity-80 disabled:opacity-25"
                    style={{ color: colors.textMuted }}
                  >
                    <ArrowUp size={12} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(i)}
                    disabled={i === sorted.length - 1 || updateMut.isPending}
                    aria-label="Опустить ниже"
                    className="w-6 h-5 flex items-center justify-center rounded transition-opacity hover:opacity-80 disabled:opacity-25"
                    style={{ color: colors.textMuted }}
                  >
                    <ArrowDown size={12} aria-hidden="true" />
                  </button>
                </div>

                {/* Name */}
                {isEditing ? (
                  <input
                    autoFocus
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit();
                      else if (e.key === 'Escape') cancelEdit();
                    }}
                    maxLength={MAX_NAME_LEN}
                    className="flex-1 min-w-0 px-3 h-9 text-sm rounded-md"
                    style={inputStyle}
                  />
                ) : (
                  <span className="flex-1 min-w-0 text-sm truncate" style={{ color: colors.textPrimary }}>
                    {c.name}
                  </span>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={saveEdit}
                        disabled={updateMut.isPending || !editName.trim()}
                        aria-label="Сохранить"
                        title="Сохранить"
                        className="w-8 h-8 rounded-md inline-flex items-center justify-center disabled:opacity-40 transition-opacity hover:opacity-80"
                        style={{ background: colors.accentMuted, color: colors.accent, border: `1px solid ${colors.accentBorder}` }}
                      >
                        <Check size={14} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        aria-label="Отмена"
                        title="Отмена"
                        className="w-8 h-8 rounded-md inline-flex items-center justify-center transition-opacity hover:opacity-80"
                        style={{ background: colors.surfaceMuted, color: colors.textMuted, border: `1px solid ${colors.border}` }}
                      >
                        <X size={14} aria-hidden="true" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => startEdit(c)}
                        aria-label={`Редактировать ${c.name}`}
                        title="Редактировать"
                        className="w-8 h-8 rounded-md inline-flex items-center justify-center transition-opacity hover:opacity-80"
                        style={{ color: colors.textMuted }}
                      >
                        <Pencil size={14} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingId(c.id)}
                        aria-label={`Удалить ${c.name}`}
                        title="Удалить"
                        className="w-8 h-8 rounded-md inline-flex items-center justify-center transition-opacity hover:opacity-80"
                        style={{ color: colors.danger }}
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirm */}
      <ConfirmModal
        open={!!deletingItem}
        title={`Удалить категорию «${deletingItem?.name ?? ''}»?`}
        message="Товары останутся, но потеряют принадлежность к этой категории."
        confirmLabel="Удалить"
        danger
        loading={deleteMut.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeletingId(null)}
      />
    </div>
  );
}
