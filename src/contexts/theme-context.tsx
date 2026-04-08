"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "dark" | "light" | "unc-blue" | "green-white";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    // Load theme from localStorage on mount
    const savedTheme = localStorage.getItem("claritydrop-theme") as Theme;
    if (savedTheme && ["dark", "light", "unc-blue", "green-white"].includes(savedTheme)) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    // Apply theme directly to body
    const body = document.body;

    // Remove all existing theme classes
    body.classList.remove("theme-dark", "theme-light", "theme-unc-blue", "theme-green-white");

    // Add current theme class
    body.classList.add(`theme-${theme}`);

    // Apply immediate visual changes based on theme
    switch (theme) {
      case "light":
        body.style.background = "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)";
        body.style.color = "#0f172a";
        break;
      case "green-white":
        body.style.background = "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)";
        body.style.color = "#14532d";
        break;
      case "unc-blue":
        body.style.background = "linear-gradient(135deg, #13294b 0%, #1e3a8a 100%)";
        body.style.color = "#f1f5f9";
        break;
      default: // dark
        body.style.background = "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)";
        body.style.color = "#f1f5f9";
        break;
    }

    // Save to localStorage
    localStorage.setItem("claritydrop-theme", theme);

    console.log("Theme changed to:", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}