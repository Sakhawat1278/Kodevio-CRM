import React, { useState, useEffect } from 'react';
import { Minus, Square, Copy, X } from 'lucide-react';
import logoImg from '../../assets/logo';

export default function DesktopTitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isElectron, setIsElectron] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !!window.electronAPI || /electron/i.test(navigator.userAgent);
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isElec = !!window.electronAPI || /electron/i.test(navigator.userAgent);
      if (isElec) setIsElectron(true);

      if (window.electronAPI) {
        window.electronAPI.isMaximized().then(setIsMaximized).catch(() => {});
        const unsubscribe = window.electronAPI.onMaximizeChange(setIsMaximized);
        return () => {
          if (typeof unsubscribe === 'function') unsubscribe();
        };
      }
    }
  }, []);

  // Only render desktop window controls if inside Electron desktop app
  if (!isElectron) return null;

  return (
    <header className="desktop-titlebar">
      {/* Left: Branding (Draggable) */}
      <div className="desktop-titlebar-left">
        <div className="desktop-titlebar-logo">
          <img src={logoImg} alt="Kodevio Logo" className="desktop-logo-img" />
          <span className="desktop-logo-text">Kodevio</span>
          <span className="desktop-logo-badge">AGENCY OS</span>
        </div>
      </div>

      {/* Middle: Draggable window space */}
      <div className="desktop-titlebar-center">
        <span className="desktop-window-title">Kodevio Agency OS — Multi-Channel Enterprise Workspace</span>
      </div>

      {/* Right: Window Controls (No-Drag) */}
      <div className="desktop-titlebar-controls">
        <button
          type="button"
          onClick={() => window.electronAPI?.minimize?.()}
          className="desktop-control-btn minimize"
          title="Minimize"
        >
          <Minus size={13} />
        </button>

        <button
          type="button"
          onClick={() => window.electronAPI?.maximize?.()}
          className="desktop-control-btn maximize"
          title={isMaximized ? "Restore" : "Maximize"}
        >
          {isMaximized ? <Copy size={11} /> : <Square size={11} />}
        </button>

        <button
          type="button"
          onClick={() => window.electronAPI?.close?.()}
          className="desktop-control-btn close"
          title="Close Application"
        >
          <X size={14} />
        </button>
      </div>
    </header>
  );
}
