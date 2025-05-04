import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/ui/components/ui/button";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/ui/components/ui/dropdown-menu";

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation(); 
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage && i18n.language !== savedLanguage) {
      i18n.changeLanguage(savedLanguage);
    }
  }, [i18n]);
  
  const handleLanguageChange = (language: string) => { 
    i18n.changeLanguage(language);
    localStorage.setItem('preferredLanguage', language);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost"   
          className="rounded-full  transition  dark:text-accent hover:dark:text-accent-foreground"
          aria-label="Select language"
        >
          <Globe className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => handleLanguageChange('en')}
          className={i18n.language === 'en' ? "font-bold" : ""}
        >
          English
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleLanguageChange('vi')}
          className={i18n.language === 'vi' ? "font-bold" : ""}
        >
          Tiếng Việt
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;