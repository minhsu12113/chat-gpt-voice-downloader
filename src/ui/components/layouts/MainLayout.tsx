import { cn } from "@/ui/components/lib/utils";
import { AudioLines, Sun, Moon } from "lucide-react";
import React, { useContext, useState } from "react"; 
import { Toggle } from "@/ui/components/ui/toggle";
import { ThemeProviderContext } from "@/ui/components/theme-provider";
import LanguageSwitcher from "@/ui/components/LanguageSwitcher"; 

interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function MainLayout({ children, className }: MainLayoutProps) {
  const themContext = useContext(ThemeProviderContext);
  const [theme, setTheme] = useState(themContext.theme); 

  return (
    <div className="flex flex-col min-h-screen bg-background w-full items-center">
      <header className="sticky top-0 z-10 w-full border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/50">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center space-x-2 px-4">
            <AudioLines className="h-6 w-6 text-primary" />
            <span className="font-semibold">Download Voice From Chat GPT</span> 
          </div>
          <div className="flex items-center">
            <LanguageSwitcher />
            <Toggle
              className="mx-4 rounded-full hover:bg-accent transition"
              onClick={() => {
                const themeChange = theme === "dark" ? "light" : "dark"
                setTheme(themeChange) 
                themContext.setTheme(themeChange);
              }}
              aria-label="Toggle theme"
              type="button"
            >
              {theme === "dark" ? (
                <Sun className="size-4 text-white" />
              ) : (
                <Moon className="size-4 text-blue-600" />
              )}
            </Toggle>
          </div>
        </div>
      </header>
      <main className={cn("flex-1 container py-6 w-full", className)}>
        {children}
      </main>
      {/* <footer className="border-t py-3 text-center text-sm text-muted-foreground">
        <div className="container">
          {t('footer.copyright', 'MP3 Downloader © {{year}}', { year: new Date().getFullYear() })}
        </div>
      </footer> */}
    </div>
  );
}