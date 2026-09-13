import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ChevronDown, Check, X } from 'lucide-react';

export default function CustomSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Select an option...',
  icon: LeftIcon = null,
  className = '',
  size = 'default',
  disabled = false,
  searchable = true,
  allowCustom = true,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [coords, setCoords] = useState({ fixedTop: 0, fixedBottom: 0, fixedLeft: 0, width: 0, openUpwards: false });
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const normalizedOptions = options.map((opt) =>
    typeof opt === 'object' && opt !== null ? opt : { value: opt, label: opt }
  );

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  // Keep search term in sync with selected value when not actively searching/open
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm(selectedOption ? selectedOption.label : (value || ''));
      setIsSearching(false);
      setSearchQuery('');
    }
  }, [value, isOpen, selectedOption]);

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const approxDropdownHeight = Math.min(options.length * 36 + 20, 260);
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
      const handleScrollOrResize = () => {
        updateCoords();
      };
      window.addEventListener('scroll', handleScrollOrResize, true);
      window.addEventListener('resize', handleScrollOrResize);
      return () => {
        window.removeEventListener('scroll', handleScrollOrResize, true);
        window.removeEventListener('resize', handleScrollOrResize);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setIsSearching(false);
        setSearchQuery('');
        setSearchTerm(selectedOption ? selectedOption.label : (value || ''));
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, selectedOption, value]);

  // Show all options unless user is actively typing a search filter query
  const filteredOptions = normalizedOptions.filter((opt) => {
    if (!isSearching || !searchQuery.trim()) return true;
    return opt.label.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleSelect = (val, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (disabled) return;
    const found = normalizedOptions.find((opt) => opt.value === val);
    const label = found ? found.label : val;
    onChange(val);
    setSearchTerm(label);
    setIsSearching(false);
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    setSearchQuery(val);
    setIsSearching(true);
    if (!isOpen) setIsOpen(true);
    if (allowCustom) {
      onChange(val);
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions.length > 0) {
        handleSelect(filteredOptions[0].value);
      } else if (allowCustom && searchTerm.trim()) {
        handleSelect(searchTerm.trim());
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setIsSearching(false);
      setSearchQuery('');
      setSearchTerm(selectedOption ? selectedOption.label : (value || ''));
    } else if (e.key === 'ArrowDown' && !isOpen) {
      setIsOpen(true);
      setIsSearching(false);
      setSearchQuery('');
    }
  };

  const handleToggleOpen = () => {
    if (disabled) return;
    if (!isOpen) {
      setIsOpen(true);
      setIsSearching(false);
      setSearchQuery('');
      if (inputRef.current) {
        inputRef.current.focus();
        setTimeout(() => inputRef.current?.select(), 20);
      }
    } else {
      setIsOpen(false);
      setIsSearching(false);
      setSearchQuery('');
      setSearchTerm(selectedOption ? selectedOption.label : (value || ''));
    }
  };

  return (
    <div
      ref={triggerRef}
      className={`universal-custom-select-wrapper ${isOpen ? 'is-open' : ''} ${
        size === 'compact' ? 'is-compact' : ''
      } ${className}`}
    >
      <div
        className={`universal-select-trigger ${size === 'compact' ? 'is-compact' : ''} ${isOpen ? 'is-active' : ''} ${
          disabled ? 'is-disabled' : ''
        }`}
        onClick={handleToggleOpen}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
          {LeftIcon && (
            <LeftIcon
              size={size === 'compact' ? 14 : 15}
              className="universal-select-icon shrink-0"
            />
          )}

          {searchable ? (
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              disabled={disabled}
              onChange={handleInputChange}
              onFocus={() => {
                if (!isOpen) {
                  setIsOpen(true);
                  setIsSearching(false);
                  setSearchQuery('');
                }
              }}
              onKeyDown={handleInputKeyDown}
              placeholder={placeholder}
              className="universal-select-type-input"
              onClick={(e) => {
                e.stopPropagation();
                if (!isOpen) {
                  setIsOpen(true);
                  setIsSearching(false);
                  setSearchQuery('');
                }
              }}
            />
          ) : (
            <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden text-left">
              {selectedOption?.color && (
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: selectedOption.color }}
                />
              )}
              <span
                className={`universal-select-value ${
                  !selectedOption ? 'is-placeholder' : ''
                } font-bold text-slate-800 text-xs truncate`}
              >
                {selectedOption ? selectedOption.label : placeholder}
              </span>
              {selectedOption?.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 shrink-0">
                  {selectedOption.badge}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          {searchTerm &&
            searchTerm !== placeholder &&
            !String(searchTerm).startsWith('All ') &&
            searchTerm !== 'All' && (
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchTerm('');
                  setSearchQuery('');
                  setIsSearching(false);
                  onChange('');
                  if (inputRef.current) inputRef.current.focus();
                }}
                className="universal-select-clear-btn"
                title="Clear selection"
              >
                <X size={12} />
              </button>
            )}
          <ChevronDown
            size={size === 'compact' ? 14 : 16}
            className={`universal-select-chevron ${isOpen ? 'rotate-180' : ''}`}
          />
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
              minWidth: `${coords.width}px`,
              zIndex: 999999,
            }}
            className={`universal-select-dropdown ${
              size === 'compact' ? 'is-compact' : ''
            } ${coords.openUpwards ? 'open-upwards' : ''}`}
          >
            <div className="universal-select-options-list">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <div
                      key={opt.value}
                      onClick={(e) => handleSelect(opt.value, e)}
                      className={`universal-select-option ${
                        isSelected ? 'is-selected' : ''
                      } ${opt.desc ? 'py-1.5' : ''}`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {opt.color && (
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: opt.color }}
                          />
                        )}
                        <div className="min-w-0 flex-1 text-left">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {opt.label}
                            </span>
                            {opt.badge && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 shrink-0">
                                {opt.badge}
                              </span>
                            )}
                          </div>
                          {opt.desc && (
                            <span className="text-[11px] text-slate-400 block truncate leading-tight mt-0.5">
                              {opt.desc}
                            </span>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <Check size={14} className="universal-select-check ml-2 shrink-0" />
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="universal-select-no-options">
                  <span>No matches found</span>
                  {allowCustom && searchTerm.trim() && (
                    <button
                      type="button"
                      onClick={(e) => handleSelect(searchTerm.trim(), e)}
                      className="universal-select-custom-btn"
                    >
                      Use "{searchTerm.trim()}"
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
