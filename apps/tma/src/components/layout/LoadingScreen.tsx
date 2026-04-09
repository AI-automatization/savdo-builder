import { Spinner } from '@/components/ui/Spinner';
import { gradientBg } from '@/lib/styles';

export function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: gradientBg }}>
      <Spinner size={32} />
    </div>
  );
}
