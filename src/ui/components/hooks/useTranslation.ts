import { useTranslation as useI18nTranslation } from 'react-i18next';

const useTranslation = () => {
    const { t, i18n } = useI18nTranslation();

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    return { t, changeLanguage };
};

export default useTranslation;