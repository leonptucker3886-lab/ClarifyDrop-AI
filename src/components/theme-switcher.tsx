"use client";

import { useTheme, Theme } from "@/contexts/theme-context";
import { Button } from "@/components/ui/button";

const themeOptions: { value: Theme; label: string; icon: string }[] = [
  { value: "dark", label: "Dark", icon: "🌙" },
  { value: "light", label: "Light", icon: "☀️" },
  { value: "green-white", label: "Green & White", icon: "🌿" },
  { value: "unc-blue", label: "UNC Blue", icon: "🏀" },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (newTheme: Theme) => {
    console.log("Switching to theme:", newTheme);
    setTheme(newTheme);
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex gap-1 bg-black/20 backdrop-blur-sm p-2 rounded-lg border border-white/10">
      {themeOptions.map((option) => (
        <Button
          key={option.value}
          variant={theme === option.value ? "default" : "outline"}
          size="sm"
          onClick={() => handleThemeChange(option.value)}
          className={`transition-all duration-200 ${
            theme === option.value
              ? "ring-2 ring-white scale-110"
              : "hover:scale-105"
          }`}
          title={option.label}
        >
          <span className="text-lg">{option.icon}</span>
        </Button>
      ))}
    </div>
  );
}