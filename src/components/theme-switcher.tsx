"use client";

import { useTheme, Theme } from "@/contexts/theme-context";
import { Button } from "@/components/ui/button";

const themeOptions: { value: Theme; label: string; icon: string }[] = [
  { value: "dark", label: "Dark", icon: "🌙" },
  { value: "light", label: "Light", icon: "☀️" },
  { value: "blue", label: "Blue", icon: "🌊" },
  { value: "green", label: "Green", icon: "🌲" },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="fixed top-4 right-4 z-50 flex gap-1">
      {themeOptions.map((option) => (
        <Button
          key={option.value}
          variant={theme === option.value ? "default" : "outline"}
          size="sm"
          onClick={() => setTheme(option.value)}
          className={`bg-card/80 backdrop-blur-sm border-border/50 hover:bg-card/90 ${
            theme === option.value
              ? "ring-2 ring-primary"
              : ""
          }`}
          title={option.label}
        >
          <span className="text-lg">{option.icon}</span>
        </Button>
      ))}
    </div>
  );
}