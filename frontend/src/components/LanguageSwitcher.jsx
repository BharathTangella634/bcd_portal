import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css'; // We will create this file

const languages = [
  { code: 'english', name: 'English' },
  { code: 'hindi', name: 'हिन्दी' },
  { code: 'telugu', name: 'తెలుగు' },
  { code: 'kannada', name: 'ಕನ್ನಡ' },
  { code: 'tamil', name: 'தமிழ்' },
  { code: 'malayalam', name: 'മലയാളം' },
  { code: 'bengali', name: 'বাংলা' },
  { code: 'marathi', name: 'मराठी' },
  { code: 'gujarati', name: 'ગુજરાતી' },
  { code: 'punjabi', name: 'ਪੰਜਾਬੀ' },
];

function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <div className="language-switcher">
      <label htmlFor="language-select">Language:</label>
      <select 
        id="language-select"
        value={i18n.language} 
        onChange={changeLanguage}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default LanguageSwitcher;
