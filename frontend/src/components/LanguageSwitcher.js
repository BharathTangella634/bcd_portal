import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [languages, setLanguages] = useState([]);

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/v1/languages/`);
        if (response.ok) {
          const data = await response.json();
          setLanguages(data);
        } else {
          console.error('Failed to fetch languages');
        }
      } catch (error) {
        console.error('Error fetching languages:', error);
      }
    };

    fetchLanguages();
  }, []);

  const languageMap = {
    'en': 'english',
    'hi': 'hindi',
    'te': 'telugu',
    'kn': 'kannada',
    'ta': 'tamil',
    'ml': 'malayalam',
    'bn': 'bengali',
    'mr': 'marathi',
    'gu': 'gujarati',
    'pa': 'punjabi',
    'or': 'odia'
  };

  const changeLanguage = (e) => {
    const code = e.target.value;
    const mappedLang = languageMap[code];
    if (mappedLang) {
      i18n.changeLanguage(mappedLang);
    } else {
      i18n.changeLanguage(code);
    }
  };

  return (
    <div className="language-switcher">
      <label htmlFor="language-select">Language:</label>
      <select
        id="language-select"
        value={Object.keys(languageMap).find(code => languageMap[code] === i18n.language) || i18n.language}
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
