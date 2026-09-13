import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function CustomDatePicker({
  value = '',
  onChange,
  placeholder = 'Select date',
  label = '',
  size = 'default',
  disabled = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ fixedTop: 0, fixedBottom: 0, fixedLeft: 0, openUpwards: false });
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  // Parsed current value or default today
  const selectedDate = value ? new Date(value) : null;
  const [currentMonth, setCurrentMonth] = useState(
    selectedDate || new Date()
  );

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const pickerHeight = 310;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const openUpwards = spaceBelow < pickerHeight && spaceAbove > spaceBelow;

      setCoords({
        fixedTop: rect.bottom + 4,
        fixedBottom: window.innerHeight - rect.top + 4,
        fixedLeft: Math.max(8, Math.min(rect.left, window.innerWidth - 260)),
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
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleSelectDay = (day) => {
    if (disabled) return;
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const formatted = `${year}-${month}-${dayStr}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  // Calendar math
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const formattedDisplay = selectedDate && !isNaN(selectedDate.getTime())
    ? selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <div
      className={`universal-date-picker-wrapper ${isOpen ? 'is-open' : ''} ${size === 'compact' ? 'is-compact' : ''} ${className}`}
    >
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`universal-date-trigger ${size === 'compact' ? 'is-compact' : ''} ${isOpen ? 'is-active' : ''} ${disabled ? 'is-disabled' : ''}`}
      >
        <div className="flex items-center gap-1.5 overflow-hidden truncate">
          <Calendar size={size === 'compact' ? 13 : 15} className="universal-date-icon text-slate-400 shrink-0" />
          {label && <span className="font-extrabold text-slate-500 text-[11px] shrink-0">{label}:</span>}
          <span className={`universal-date-value ${!formattedDisplay ? 'is-placeholder' : ''}`}>
            {formattedDisplay || placeholder}
          </span>
        </div>

        {value ? (
          <span
            onClick={handleClear}
            className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer shrink-0"
            title="Clear Date"
          >
            <X size={12} />
          </span>
        ) : (
          <ChevronRight
            size={size === 'compact' ? 12 : 14}
            className={`universal-date-chevron ${isOpen ? 'rotate-90' : ''} shrink-0`}
          />
        )}
      </button>

      {isOpen &&
        ReactDOM.createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              top: coords.openUpwards ? 'auto' : `${coords.fixedTop}px`,
              bottom: coords.openUpwards ? `${coords.fixedBottom}px` : 'auto',
              left: `${coords.fixedLeft}px`,
              zIndex: 999999,
            }}
            className={`universal-date-dropdown ${coords.openUpwards ? 'open-upwards' : ''}`}
          >
            {/* Header Navigation */}
            <div className="universal-date-header">
              <button type="button" onClick={handlePrevMonth} className="universal-date-nav-btn">
                <ChevronLeft size={14} />
              </button>
              <span className="universal-date-month-title">
                {monthNames[month]} {year}
              </span>
              <button type="button" onClick={handleNextMonth} className="universal-date-nav-btn">
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Days of Week */}
            <div className="universal-date-weekdays">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                <span key={d} className="universal-date-weekday">{d}</span>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="universal-date-days-grid">
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <span key={`empty-${i}`} className="universal-date-day empty" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isToday =
                  new Date().getDate() === day &&
                  new Date().getMonth() === month &&
                  new Date().getFullYear() === year;

                const isSelected =
                  selectedDate &&
                  selectedDate.getDate() === day &&
                  selectedDate.getMonth() === month &&
                  selectedDate.getFullYear() === year;

                return (
                  <button
                    key={`day-${day}`}
                    type="button"
                    onClick={() => handleSelectDay(day)}
                    className={`universal-date-day ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Quick Actions Footer */}
            <div className="universal-date-footer">
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  const year = today.getFullYear();
                  const month = String(today.getMonth() + 1).padStart(2, '0');
                  const day = String(today.getDate()).padStart(2, '0');
                  onChange(`${year}-${month}-${day}`);
                  setIsOpen(false);
                }}
                className="universal-date-footer-btn"
              >
                Today
              </button>
              {value && (
                <button type="button" onClick={handleClear} className="universal-date-footer-btn text-red-500">
                  Clear
                </button>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
