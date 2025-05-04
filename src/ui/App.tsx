import { ThemeProvider } from '@/ui/components/theme-provider';
import { Toaster } from '@/ui/components/ui/toaster';
import MainLayout from '@/ui/components/layouts/MainLayout';
import HomePage from '@/ui/components/pages/HomePage';
import i18n from '@/ui/components/i18n';
import { I18nextProvider } from 'react-i18next';
function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider defaultTheme="dark" storageKey="mp3-downloader-theme">
        <MainLayout>
          <HomePage />
        </MainLayout>
        <Toaster />
      </ThemeProvider>
    </I18nextProvider>
  );
}

export default App;