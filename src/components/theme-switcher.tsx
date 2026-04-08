"use client";

import { useTheme, Theme } from "@/contexts/theme-context";
import { Button } from "@/components/ui/button";
import { Palette } from "lucide-react";

const themeOptions: { value: Theme; label: string; description: string }[] = [
  { value: "dark", label: "Dark", description: "Professional dark theme" },
  { value: "light", label: "Light", description: "Clean light theme" },
  { value: "blue", label: "Blue", description: "Ocean blue accents" },
  { value: "green", label: "Green", description: "Forest green accents" },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="relative group">
        <Button
          variant="outline"
          size="sm"
          className="bg-card/80 backdrop-blur-sm border-border/50 hover:bg-card/90"
        >
          <Palette className="w-4 h-4 mr-2" />
          Theme
        </Button>

        <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
          <div className="p-2">
            <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
              Choose Theme
            </div>
            <div className="space-y-1">
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    theme === option.value
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50 text-foreground"
                  }`}
                >
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-muted-foreground">{option.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}