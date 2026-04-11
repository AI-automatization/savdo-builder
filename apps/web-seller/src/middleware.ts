import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Маршруты доступны без аутентификации
const PUBLIC_PATHS = ['/login', '/onboarding'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Статика и API — не трогаем
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Публичные маршруты — пропускаем всех
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Защищённые маршруты (dashboard, products, orders, etc.)
  // Реальная проверка роли — в layout.tsx (токен в localStorage, не в cookie)
  // Middleware только задаёт заголовки безопасности
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
