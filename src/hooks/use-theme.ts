import { useEffect, useState } from "react";

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = (localStorage.getItem("arreniux:theme") as "light" | "dark" | null) ?? "light";
    setTheme(saved);
    document.documentElement.classList.toggle("dark", saved === "dark");
  }, []);
  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("arreniux:theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };
  return { theme, toggle };
}
