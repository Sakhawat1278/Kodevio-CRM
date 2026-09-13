import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Clock, ChevronRight, X, Check } from 'lucide-react';

export default function CustomTimePicker({
  value = '',
  onChange,
  placeholder = 'Select time',
  label = '',
  size = 'default',
  disabled = false,
  className = '',
  use12Hours = true
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ fixedTop: 0, fixedBottom: 0, fixedLeft: 0, openUpwards: false });
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  // Parse value ('HH:mm') to 12-hour format parts
  const parseTime = (val) => {
    if (!val || typeof val !== 'string' || !val.includes(':')) {
      return { hour12: 12, minute: 0, period: 'PM' };
    }
    const [hStr, mStr] = val.split(':');
    let h = parseInt(hStr, 10);
    let m = parseInt(mStr, 10);
    if (isNaN(h)) h = 12;
    if (isNaN(m)) m = 0;

    const period = h >= 12 ? 'PM' : 'AM';
    let hour12 = h % 12;
    if (hour12 === 0) hour12 = 12;

    return { hour12, minute: m, period };
  };

  const parsed = parseTime(value);
  const [tempHour, setTempHour] = useState(parsed.hour12);
  const [tempMinute, setTempMinute] = useState(parsed.minute);
  const [tempPeriod, setTempPeriod] = useState(parsed.period);

  useEffect(() => {
    if (value) {
      const p = parseTime(value);
      setTempHour(p.hour12);
      setTempMinute(p.minute);
      setTempPeriod(p.period);
    }
  }, [value]);

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const pickerHeight = 280;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const openUpwards = spaceBelow < pickerHeight && spaceAbove > spaceBelow;

      setCoords({
        fixedTop: rect.bottom + 4,
        fixedBottom: window.innerHeight - rect.top + 4,
        fixedLeft: Math.max(8, Math.min(rect.left, window.innerWidth - 270)),
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

  const convertTo24Hour = (h12, min, period) => {
    let h24 = h12;
    if (period === 'AM') {
      if (h12 === 12) h24 = 0;
    } else {
      if (h12 !== 12) h24 = h12 + 12;
    }
    const hh = String(h24).padStart(2, '0');
    const mm = String(min).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const handleApply = (h12 = tempHour, min = tempMinute, per = tempPeriod) => {
    if (disabled) return;
    const time24 = convertTo24Hour(h12, min, per);
    if (onChange) onChange(time24);
    setIsOpen(false);
  };

  const handleSelectHour = (h) => {
    setTempHour(h);
    const time24 = convertTo24Hour(h, tempMinute, tempPeriod);
    if (onChange) onChange(time24);
  };

  const handleSelectMinute = (m) => {
    setTempMinute(m);
    const time24 = convertTo24Hour(tempHour, m, tempPeriod);
    if (onChange) onChange(time24);
  };

  const handleSelectPeriod = (per) => {
    setTempPeriod(per);
    const time24 = convertTo24Hour(tempHour, tempMinute, per);
    if (onChange) onChange(time24);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (onChange) onChange('');
    setIsOpen(false);
  };

  const handleSetNow = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const time24 = `${hh}:${mm}`;
    if (onChange) onChange(time24);
    setIsOpen(false);
  };

  const formattedDisplay = value ? (() => {
    const p = parseTime(value);
    if (use12Hours) {
      const hh = String(p.hour12).padStart(2, '0');
      const mm = String(p.minute).padStart(2, '0');
      return `${hh}:${mm} ${p.period}`;
    }
    return value;
  })() : '';

  const hoursList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const minutesList = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  const presetSlots = [
    { label: '09:00 AM', value: '09:00' },
    { label: '11:00 AM', value: '11:00' },
    { label: '02:30 PM', value: '14:30' },
    { label: '04:00 PM', value: '16:00' },
    { label: '06:00 PM', value: '18:00' },
    { label: '08:00 PM', value: '20:00' }
  ];

  return (
    <div
      className={`universal-time-picker-wrapper ${isOpen ? 'is-open' : ''} ${size === 'compact' ? 'is-compact' : ''} ${className}`}
    >
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`universal-time-trigger ${size === 'compact' ? 'is-compact' : ''} ${isOpen ? 'is-active' : ''} ${disabled ? 'is-disabled' : ''}`}
      >
        <div className="flex items-center gap-1.5 overflow-hidden truncate">
          <Clock size={size === 'compact' ? 13 : 15} className="universal-time-icon text-slate-400 shrink-0" />
          {label && <span className="font-extrabold text-slate-500 text-[11px] shrink-0">{label}:</span>}
          <span className={`universal-time-value ${!formattedDisplay ? 'is-placeholder' : ''}`}>
            {formattedDisplay || placeholder}
          </span>
        </div>

        {value ? (
          <span
            onClick={handleClear}
            className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer shrink-0"
            title="Clear Time"
          >
            <X size={12} />
          </span>
        ) : (
          <ChevronRight
            size={size === 'compact' ? 12 : 14}
            className={`universal-time-chevron ${isOpen ? 'rotate-90' : ''} shrink-0`}
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
            className={`universal-time-dropdown ${coords.openUpwards ? 'open-upwards' : ''}`}
          >
            {/* Quick Preset Slots */}
            <div className="universal-time-presets">
              {presetSlots.map((slot) => {
                const isSelected = value === slot.value;
                return (
                  <button
                    key={slot.value}
                    type="button"
                    onClick={() => {
                      if (onChange) onChange(slot.value);
                      setIsOpen(false);
                    }}
                    className={`universal-time-preset-btn ${isSelected ? 'is-selected' : ''}`}
                  >
                    {slot.label}
                  </button>
                );
              })}
            </div>

            {/* Time Columns Selector */}
            <div className="universal-time-columns-container">
              {/* Hours Column */}
              <div className="universal-time-col">
                <span className="universal-time-col-header">Hour</span>
                <div className="universal-time-col-list">
                  {hoursList.map((h) => {
                    const isSelected = tempHour === h;
                    return (
                      <button
                        key={`h-${h}`}
                        type="button"
                        onClick={() => handleSelectHour(h)}
                        className={`universal-time-item ${isSelected ? 'is-selected' : ''}`}
                      >
                        {String(h).padStart(2, '0')}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="universal-time-col-divider">:</div>

              {/* Minutes Column */}
              <div className="universal-time-col">
                <span className="universal-time-col-header">Min</span>
                <div className="universal-time-col-list">
                  {minutesList.map((m) => {
                    const isSelected = tempMinute === m;
                    return (
                      <button
                        key={`m-${m}`}
                        type="button"
                        onClick={() => handleSelectMinute(m)}
                        className={`universal-time-item ${isSelected ? 'is-selected' : ''}`}
                      >
                        {String(m).padStart(2, '0')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* AM / PM Column */}
              <div className="universal-time-col period-col">
                <span className="universal-time-col-header">Period</span>
                <div className="universal-time-period-toggle">
                  <button
                    type="button"
                    onClick={() => handleSelectPeriod('AM')}
                    className={`universal-time-period-btn ${tempPeriod === 'AM' ? 'is-selected' : ''}`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPeriod('PM')}
                    className={`universal-time-period-btn ${tempPeriod === 'PM' ? 'is-selected' : ''}`}
                  >
                    PM
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="universal-time-footer">
              <button
                type="button"
                onClick={handleSetNow}
                className="universal-time-footer-btn"
              >
                Now
              </button>

              <div className="flex items-center gap-2">
                {value && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="universal-time-footer-btn text-red-500"
                  >
                    Clear
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="universal-time-footer-done-btn"
                >
                  <Check size={11} />
                  <span>Done</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
