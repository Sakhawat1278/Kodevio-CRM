import React, { useState, useRef, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export default function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  className = '',
  size = 'compact',
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [coords, setCoords] = useState({ fixedTop: 0, fixedBottom: 0, fixedLeft: 0, width: 0, openUpwards: false });
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Normalize options to { value, label }
  const normalizedOptions = useMemo(() => {
    return options.map((opt) =>
      typeof opt === 'object' && opt !== null ? opt : { value: opt, label: String(opt) }
    );
  }, [options]);

  // Current selected label
  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  // Synchronize search query with selected value when closed
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery(selectedOption ? selectedOption.label : '');
    }
  }, [value, selectedOption, isOpen]);

  // Filter options based on typed search query when open
  const filteredOptions = useMemo(() => {
    if (!isOpen || !searchQuery.trim()) {
      return normalizedOptions;
    }
    const q = searchQuery.toLowerCase().trim();
    return normalizedOptions.filter((opt) =>
      opt.label.toLowerCase().includes(q) || String(opt.value).toLowerCase().includes(q)
    );
  }, [normalizedOptions, searchQuery, isOpen]);

  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const approxDropdownHeight = Math.min(filteredOptions.length * 34 + 16, 240);
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const openUpwards = spaceBelow < approxDropdownHeight && spaceAbove > spaceBelow;

      setCoords({
        fixedTop: rect.bottom + 4,
        fixedBottom: window.innerHeight - rect.top + 4,
        fixedLeft: Math.max(8, Math.min(rect.left, window.innerWidth - Math.max(rect.width, 140) - 8)),
        width: Math.max(rect.width, 140),
        openUpwards,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      const handleScrollOrResize = () => updateCoords();
      window.addEventListener('scroll', handleScrollOrResize, true);
      window.addEventListener('resize', handleScrollOrResize);
      return () => {
        window.removeEventListener('scroll', handleScrollOrResize, true);
        window.removeEventListener('resize', handleScrollOrResize);
      };
    }
  }, [isOpen, filteredOptions.length]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        // reset query to current selected label
        setSearchQuery(selectedOption ? selectedOption.label : '');
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, selectedOption]);

  const handleSelect = (val, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (disabled) return;
    onChange(val);
    const chosen = normalizedOptions.find((o) => o.value === val);
    setSearchQuery(chosen ? chosen.label : '');
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleInputFocus = () => {
    if (disabled) return;
    setIsOpen(true);
    // Select all text for easy replacement
    if (inputRef.current) {
      inputRef.current.select();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions.length > 0) {
        handleSelect(filteredOptions[0].value);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchQuery(selectedOption ? selectedOption.label : '');
    }
  };

  return (
    <div
      ref={containerRef}
      className={`searchable-select-wrapper ${isOpen ? 'is-open' : ''} ${
        size === 'compact' ? 'is-compact' : ''
      } ${className}`}
    >
      <div className={`searchable-select-input-box ${isOpen ? 'is-active' : ''} ${disabled ? 'is-disabled' : ''}`}>
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="searchable-select-input"
        />
        <div className="searchable-select-icon-box" onClick={() => { if (!disabled) { setIsOpen(!isOpen); if (!isOpen) inputRef.current?.focus(); } }}>
          <Search size={13} className="text-slate-400" />
        </div>
      </div>

      {isOpen &&
        ReactDOM.createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              top: coords.openUpwards ? 'auto' : `${coords.fixedTop}px`,
              bottom: coords.openUpwards ? `${coords.fixedBottom}px` : 'auto',
              left: `${coords.fixedLeft}px`,
              width: `${coords.width}px`,
              minWidth: `${coords.width}px`,
              zIndex: 999999,
            }}
            className={`searchable-select-dropdown ${
              size === 'compact' ? 'is-compact' : ''
            } ${coords.openUpwards ? 'open-upwards' : ''}`}
          >
            <div className="searchable-select-options-list">
              {filteredOptions.length === 0 ? (
                <div className="searchable-select-no-results">
                  No matching options
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <div
                      key={opt.value}
                      onClick={(e) => handleSelect(opt.value, e)}
                      className={`searchable-select-option ${
                        isSelected ? 'is-selected' : ''
                      }`}
                    >
                      <span className="truncate">{opt.label}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
