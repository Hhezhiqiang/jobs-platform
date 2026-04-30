"use client";

import { useState, useEffect } from "react";
import { Moon, Sun, Monitor } from "lucide-react";

type ThemeMode = "light" | "dark" | "system";

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme") as ThemeMode | null;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  const applyTheme = (mode: ThemeMode) => {
    const root = document.documentElement;
    root.classList.remove("dark");
    
    if (mode === "dark") {
      root.classList.add("dark");
    } else if (mode === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        root.classList.add("dark");
      }
    }
  };

  const handleThemeChange = (mode: ThemeMode) => {
    setTheme(mode);
    localStorage.setItem("theme", mode);
    applyTheme(mode);
  };

  if (!mounted) return null;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleThemeChange("light")}
        className={`p-2 rounded-lg transition-all ${
          theme === "light"
            ? "bg-[#eef2ff] text-[#6366f1]"
            : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        }`}
        title="浅色模式"
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleThemeChange("dark")}
        className={`p-2 rounded-lg transition-all ${
          theme === "dark"
            ? "bg-[#eef2ff] text-[#6366f1]"
            : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        }`}
        title="暗色模式"
      >
        <Moon className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleThemeChange("system")}
        className={`p-2 rounded-lg transition-all ${
          theme === "system"
            ? "bg-[#eef2ff] text-[#6366f1]"
            : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        }`}
        title="跟随系统"
      >
        <Monitor className="w-4 h-4" />
      </button>
    </div>
  );
}
