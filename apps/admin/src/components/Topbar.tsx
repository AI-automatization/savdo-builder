"use client";

import { Bell, LogOut, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";

export default function Topbar({ title }: { title?: string }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const theme = localStorage.getItem("admin-theme") ?? "dark";
    setIsDark(theme === "dark");
    document.documentElement.setAttribute("data-theme", theme);
  }, []);

  const toggleTheme = () => {
    const next = isDark ? "light" : "dark";
    setIsDark(!isDark);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("admin-theme", next);
  };

  return (
    <header className="admin-topbar">
      <h1 className="font-semibold text-sm flex-1" style={{ color: "var(--color-text)" }}>
        {title}
      </h1>

      <div className="flex items-center gap-2">
        <button onClick={toggleTheme} className="btn-ghost" style={{ padding: "6px 8px" }}
          title={isDark ? "Светлая тема" : "Тёмная тема"}>
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <button className="btn-ghost" style={{ padding: "6px 8px" }} title="Уведомления">
          <Bell size={16} />
        </button>

        <button className="btn-ghost" style={{ padding: "6px 10px", gap: "6px" }}>
          <LogOut size={14} />
          <span style={{ fontSize: "12px" }}>Выйти</span>
        </button>
      </div>
    </header>
  );
}
