import React from 'react';
import { Sun, Moon, Zap } from 'lucide-react';

export default function Navbar({ isDarkMode, toggleTheme }) {
  return (
    <nav className="app-navbar">
      <a href="#" className="brand-logo">
        <span className="flex items-center gap-2">
          fiverr<span className="dot">.</span>
        </span>
        <span className="brand-badge">Agency OS</span>
      </a>

      <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle Theme">
        {isDarkMode ? (
          <>
            <Sun size={16} className="text-amber-400" />
            <span>Light Mode</span>
          </>
        ) : (
          <>
            <Moon size={16} className="text-indigo-600" />
            <span>Dark Mode</span>
          </>
        )}
      </button>
    </nav>
  );
}
