export function Spinner({ size = 24 }: { size?: number }) {
  return (
    <div
      className="rounded-full border-2 animate-spin"
      style={{
        width: size,
        height: size,
        borderColor: 'rgba(167,139,250,0.30)',
        borderTopColor: '#A855F7',
      }}
    />
  );
}
