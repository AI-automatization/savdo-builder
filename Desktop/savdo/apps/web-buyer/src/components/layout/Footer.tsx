import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer footer-center bg-base-200 text-base-content p-6 mt-auto">
      <nav className="grid grid-flow-col gap-4">
        <Link href="/about" className="link link-hover">О нас</Link>
        <Link href="/contact" className="link link-hover">Контакты</Link>
        <Link href="/orders" className="link link-hover">Заказы</Link>
      </nav>
      <aside>
        <p>© {new Date().getFullYear()} Savdo — все права защищены</p>
      </aside>
    </footer>
  );
}
