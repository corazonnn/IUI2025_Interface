// src/components/Header.js
import React from 'react';
import i18next from 'i18next';

const Header = () => {
  const changeLanguage = (lng) => {
    console.log(lng);
    i18next.changeLanguage(lng);
  };

  return (
    <div style={{
      position: 'fixed',
      top: '30px',  // Sidebarと高さを合わせる
      right: '30px',
      width: '150px',  // Sidebarと同じ幅
      backgroundColor: '#ffffff',
      color: 'black',
      borderRadius: '10px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
      zIndex: 1000,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px',
      }}>
        {/* <h3 style={{ marginBottom: '10px' }}>{i18next.t('Language')}</h3> */}
        <select
          onChange={(e) => changeLanguage(e.target.value)}
          defaultValue={i18next.language}
          style={{
            width: '100%',
            padding: '10px',
            // borderRadius: '5px',
            border: 'none',
            boxSizing: 'border-box',
            fontSize: '14px',
          }}
        >
          <option value="en">English</option>
          <option value="ja">日本語</option>
        </select>
      </div>
    </div>
  );
};

export default Header;
