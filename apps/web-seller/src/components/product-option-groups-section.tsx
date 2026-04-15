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

// ── Styles ────────────────────────────────────────────────────────────────────

const glass = {
  background:           'rgba(255,255,255,0.07)',
  backdropFilter:       'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border:               '1px solid rgba(255,255,255,0.11)',
} as const;

const fieldStyle = {
  background:   'rgba(255,255,255,0.06)',
  border:       '1px solid rgba(255,255,255,0.13)',
  color:        '#fff',
  borderRadius: '0.625rem',
  outline:      'none',
  width:        '100%',
  padding:      '0.45rem 0.7rem',
  fontSize:     '0.8125rem',
} as const;

const confirmBtn = {
  flexShrink: 0,
  width: 26,
  height: 26,
  borderRadius: '0.5rem',
  fontSize: '0.75rem',
  fontWeight: 600,
  background: 'rgba(167,139,250,.18)',
  border: '1px solid rgba(167,139,250,.30)',
  color: '#A78BFA',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
} as const;

const cancelBtn = {
  ...confirmBtn,
  background: 'rgba(255,255,255,.06)',
  border: '1px solid rgba(255,255,255,.12)',
  color: 'rgba(255,255,255,0.45)',
} as const;

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
      <button type="button" style={cancelBtn} onClick={onCancel} title="Отмена">✕</button>
      <button
        type="button"
        style={confirmBtn}
        disabled={saving || !text.trim()}
        onClick={() => onSave(text.trim())}
        title="Сохранить"
      >
        {saving ? '…' : '✓'}
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
  const update = useUpdateOptionValue(productId);
  const remove = useDeleteOptionValue(productId);

  async function handleUpdate(text: string) {
    await update.mutateAsync({ groupId, valueId: value.id, value: text });
    setEditing(false);
  }

  async function handleDelete() {
    if (!confirm(`Удалить значение «${value.value}»? Варианты, использующие его, будут деактивированы.`)) return;
    await remove.mutateAsync({ groupId, valueId: value.id });
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
    <div
      className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-0.5 rounded-full text-xs"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.82)' }}
    >
      <span>{value.value}</span>
      <button
        type="button"
        className="transition-opacity opacity-40 hover:opacity-80"
        style={{ color: '#A78BFA' }}
        onClick={() => setEditing(true)}
        title="Редактировать"
      >
        ✏
      </button>
      <button
        type="button"
        className="transition-opacity opacity-30 hover:opacity-70 disabled:opacity-20"
        style={{ color: '#f87171' }}
        disabled={remove.isPending}
        onClick={handleDelete}
        title="Удалить"
      >
        ✕
      </button>
    </div>
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
  const updateGroup = useUpdateOptionGroup(productId);
  const removeGroup = useDeleteOptionGroup(productId);
  const createValue = useCreateOptionValue(productId);

  async function handleRename(text: string) {
    await updateGroup.mutateAsync({ groupId: group.id, name: text });
    setEditingName(false);
  }

  async function handleRemove() {
    const hasValues = group.values.length > 0;
    const msg = hasValues
      ? `Удалить группу «${group.name}»? Все её значения будут удалены, а связанные варианты деактивированы.`
      : `Удалить группу «${group.name}»?`;
    if (!confirm(msg)) return;
    await removeGroup.mutateAsync(group.id);
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
      style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.08)' }}
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
            <p className="text-sm font-medium text-white flex-1">{group.name}</p>
            <button
              type="button"
              className="text-xs transition-opacity opacity-40 hover:opacity-80"
              style={{ color: '#A78BFA' }}
              onClick={() => setEditingName(true)}
              title="Переименовать"
            >
              ✏
            </button>
            <button
              type="button"
              className="text-xs transition-opacity opacity-30 hover:opacity-70 disabled:opacity-20"
              style={{ color: '#f87171' }}
              disabled={removeGroup.isPending}
              onClick={handleRemove}
              title="Удалить группу"
            >
              🗑
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
            style={{ color: '#A78BFA' }}
            onClick={() => setAddingValue(true)}
          >
            + значение
          </button>
        )}
      </div>
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
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.28)' }}>
          Опции товара
        </p>
        {optionGroups.length > 0 && (
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.30)' }}>
            {optionGroups.length} гр.
          </span>
        )}
      </div>

      {optionGroups.length === 0 && !adding && (
        <p className="text-xs py-1" style={{ color: 'rgba(255,255,255,0.30)' }}>
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
          style={{ color: '#A78BFA' }}
          onClick={() => setAdding(true)}
        >
          + Добавить группу опций
        </button>
      )}
    </div>
  );
}
