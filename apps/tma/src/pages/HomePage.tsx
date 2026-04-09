import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { LoadingScreen } from '@/components/layout/LoadingScreen';

export default function HomePage() {
  const { user, loading, authenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (!authenticated || !user) {
      navigate('/buyer', { replace: true });
      return;
    }

    if (user.role === 'SELLER') {
      navigate('/seller', { replace: true });
    } else {
      navigate('/buyer', { replace: true });
    }
  }, [loading, authenticated, user, navigate]);

  return <LoadingScreen />;
}
