'use client';

import { useState } from 'react';
import type { OptionGroup, OptionValue } from 'types';
import {
  useCreateOptionGroup,
  useUpdateOptionGroup,
  useDeleteOptionGroup,
  useCreateOptionValue,
  useUpdateOptionValue,
  useDeleteOptionValue,
} from '../hooks/use-product-options';
import { X, Check, Pencil, Trash2 } from 'lucide-react';
import { card, colors, inputStyle as inputBase } from '@/lib/styles';
import { ConfirmModal } from './confirm-modal';

const glass = card;

const fieldStyle: React.CSSProperties = {
  ...inputBase,
  borderRadius: '0.5rem',
  width:        '100%',
  padding:      '0.45rem 0.7rem',
  fontSize:     '0.8125rem',
};

const confirmBtn: React.CSSProperties = {
  flexShrink: 0,
  width: 26,
  height: 26,
  borderRadius: '0.375rem',
  fontSize: '0.75rem',
  fontWeight: 600,
  background: colors.accentMuted,
  border: `1px solid ${colors.accentBorder}`,
  color: colors.accent,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const cancelBtn: React.CSSProperties = {
  ...confirmBtn,
  background: colors.surfaceMuted,
  border: `1px solid ${colors.border}`,
  color: colors.textMuted,
};

// ── Code generation (transliterate + slugify) ─────────────────────────────────

const CYR_MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh',
  з: 'z', и: 'i', й: 'j', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c',
  ч: 'ch', ш: 'sh', щ: 'shh', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  ў: 'u', қ: 'q', ғ: 'g', ҳ: 'h',
};

function slugify(input: string): string {
  const lower = input.trim().toLowerCase();
  let out = '';
  for (const ch of lower) {
    if (CYR_MAP[ch] !== undefined) out += CYR_MAP[ch];
    else if (/[a-z0-9]/.test(ch)) out += ch;
    else if (/\s|-|_|\/|\./.test(ch)) out += '-';
  }
  return out.replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
}

function codeOr(input: string, fallbackPrefix: string): string {
  const slug = slugify(input);
  return slug || `${fallbackPrefix}-${Date.now().toString(36).slice(-5)}`;
}

// ── Inline row for editing a value/group ──────────────────────────────────────

interface InlineTextFormProps {
  initial: string;
  placeholder: string;
  saving: boolean;
  onSave: (text: string) => void | Promise<void>;
  onCancel: () => void;
}

function InlineTextForm({ initial, placeholder, saving, onSave, onCancel }: InlineTextFormProps) {
  const [text, setText] = useState(initial);

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && text.trim()) onSave(text.trim());
    else if (e.key === 'Escape') onCancel();
  }

  return (
    <div className="flex items-center gap-2">
      <input
        autoFocus
        style={fieldStyle}
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKey}
      />
      <button type="button" style={cancelBtn} onClick={onCancel} title="Отмена"><X size={14} /></button>
      <button
        type="button"
        style={confirmBtn}
        disabled={saving || !text.trim()}
        onClick={() => onSave(text.trim())}
        title="Сохранить"
      >
        {saving ? '…' : <Check size={14} />}
      </button>
    </div>
  );
}

// ── Value row ─────────────────────────────────────────────────────────────────

interface ValueRowProps {
  productId: string;
  groupId: string;
  value: OptionValue;
}

function ValueRow({ productId, groupId, value }: ValueRowProps) {
  const [editing, setEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const update = useUpdateOptionValue(productId);
  const remove = useDeleteOptionValue(productId);

  async function handleUpdate(text: string) {
    await update.mutateAsync({ groupId, valueId: value.id, value: text });
    setEditing(false);
  }

  async function performDelete() {
    await remove.mutateAsync({ groupId, valueId: value.id });
    setConfirmOpen(false);
  }

  if (editing) {
    return (
      <InlineTextForm
        initial={value.value}
        placeholder="Например: XL"
        saving={update.isPending}
        onSave={handleUpdate}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <>
      <div
        className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-0.5 rounded-full text-xs"
        style={{ background: colors.surfaceMuted, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
      >
        <span>{value.value}</span>
        <button
          type="button"
          className="transition-opacity opacity-40 hover:opacity-80"
          style={{ color: colors.accent }}
          onClick={() => setEditing(true)}
          title="Редактировать"
        >
          <Pencil size={12} />
        </button>
        <button
          type="button"
          className="transition-opacity opacity-30 hover:opacity-70 disabled:opacity-20"
          style={{ color: colors.danger }}
          disabled={remove.isPending}
          onClick={() => setConfirmOpen(true)}
          title="Удалить"
        >
          <X size={12} />
        </button>
      </div>
      <ConfirmModal
        open={confirmOpen}
        title={`Удалить значение «${value.value}»?`}
        message="Варианты, использующие его, будут деактивированы."
        confirmLabel="Удалить"
        danger
        loading={remove.isPending}
        onConfirm={performDelete}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  );
}

// ── Group row ─────────────────────────────────────────────────────────────────

interface GroupRowProps {
  productId: string;
  group: OptionGroup;
}

function GroupRow({ productId, group }: GroupRowProps) {
  const [editingName, setEditingName] = useState(false);
  const [addingValue, setAddingValue] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const updateGroup = useUpdateOptionGroup(productId);
  const removeGroup = useDeleteOptionGroup(productId);
  const createValue = useCreateOptionValue(productId);

  const hasValues = group.values.length > 0;

  async function handleRename(text: string) {
    await updateGroup.mutateAsync({ groupId: group.id, name: text });
    setEditingName(false);
  }

  async function performRemove() {
    await removeGroup.mutateAsync(group.id);
    setConfirmOpen(false);
  }

  async function handleAddValue(text: string) {
    await createValue.mutateAsync({
      groupId: group.id,
      value: text,
      code: codeOr(text, 'v'),
      sortOrder: group.values.length,
    });
    setAddingValue(false);
  }

  return (
    <div
      className="rounded-xl p-3 flex flex-col gap-2"
      style={{ background: colors.surfaceSunken, border: `1px solid ${colors.divider}` }}
    >
      <div className="flex items-center gap-2">
        {editingName ? (
          <InlineTextForm
            initial={group.name}
            placeholder="Например: Размер"
            saving={updateGroup.isPending}
            onSave={handleRename}
            onCancel={() => setEditingName(false)}
          />
        ) : (
          <>
            <p className="text-sm font-medium flex-1" style={{ color: colors.textPrimary }}>{group.name}</p>
            <button
              type="button"
              className="text-xs transition-opacity opacity-40 hover:opacity-80"
              style={{ color: colors.accent }}
              onClick={() => setEditingName(true)}
              title="Переименовать"
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              className="text-xs transition-opacity opacity-30 hover:opacity-70 disabled:opacity-20"
              style={{ color: colors.danger }}
              disabled={removeGroup.isPending}
              onClick={() => setConfirmOpen(true)}
              title="Удалить группу"
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {group.values.map((v) => (
          <ValueRow key={v.id} productId={productId} groupId={group.id} value={v} />
        ))}

        {addingValue ? (
          <div className="w-full">
            <InlineTextForm
              initial=""
              placeholder="Новое значение"
              saving={createValue.isPending}
              onSave={handleAddValue}
              onCancel={() => setAddingValue(false)}
            />
          </div>
        ) : (
          <button
            type="button"
            className="text-xs font-semibold transition-opacity hover:opacity-80"
            style={{ color: colors.accent }}
            onClick={() => setAddingValue(true)}
          >
            + значение
          </button>
        )}
      </div>
      <ConfirmModal
        open={confirmOpen}
        title={`Удалить группу «${group.name}»?`}
        message={hasValues ? 'Все её значения будут удалены, а связанные варианты деактивированы.' : undefined}
        confirmLabel="Удалить"
        danger
        loading={removeGroup.isPending}
        onConfirm={performRemove}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
}

// ── Main section ──────────────────────────────────────────────────────────────

interface Props {
  productId: string;
  optionGroups: OptionGroup[];
}

export function ProductOptionGroupsSection({ productId, optionGroups }: Props) {
  const [adding, setAdding] = useState(false);
  const create = useCreateOptionGroup(productId);

  async function handleAddGroup(text: string) {
    await create.mutateAsync({
      name: text,
      code: codeOr(text, 'g'),
      sortOrder: optionGroups.length,
    });
    setAdding(false);
  }

  return (
    <div className="rounded-2xl p-5 flex flex-col gap-3 mt-4" style={glass}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: colors.textDim }}>
          Опции товара
        </p>
        {optionGroups.length > 0 && (
          <span className="text-xs" style={{ color: colors.textDim }}>
            {optionGroups.length} гр.
          </span>
        )}
      </div>

      {optionGroups.length === 0 && !adding && (
        <p className="text-xs py-1" style={{ color: colors.textDim }}>
          Добавьте группы опций (например «Размер», «Цвет»), чтобы товар продавался в нескольких вариантах.
        </p>
      )}

      {optionGroups.map((g) => (
        <GroupRow key={g.id} productId={productId} group={g} />
      ))}

      {adding ? (
        <InlineTextForm
          initial=""
          placeholder="Название группы (например: Размер)"
          saving={create.isPending}
          onSave={handleAddGroup}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <button
          type="button"
          className="text-xs font-semibold transition-opacity hover:opacity-80 text-left mt-1"
          style={{ color: colors.accent }}
          onClick={() => setAdding(true)}
        >
          + Добавить группу опций
        </button>
      )}
    </div>
  );
}
