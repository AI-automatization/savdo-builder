export function Spinner({ size = 24 }: { size?: number }) {
  return (
    <div
      className="rounded-full border-2 animate-spin"
      style={{
        width: size,
        height: size,
        borderColor: 'var(--tg-accent-dim)',
        borderTopColor: 'var(--tg-accent)',
      }}
    />
  );
}
