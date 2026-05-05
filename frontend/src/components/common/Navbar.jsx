import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useI18n } from "../../context/I18nContext";

const pageMeta = {
  "/parts":      { title: "Part Master",       subtitle: "Material, traceability and process master data" },
  "/machines":   { title: "Machine Tracking",  subtitle: "Live machine state and active operation view" },
  "/operations": { title: "Operation Master",  subtitle: "Part routing, process steps and logs" },
};

const DAYS   = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

/** Mini inline calendar picker */
const DatePicker = ({ selectedDate, onChange, onClose }) => {
  const today = new Date();
  const [view, setView] = useState({
    year:  selectedDate ? selectedDate.getFullYear()  : today.getFullYear(),
    month: selectedDate ? selectedDate.getMonth()     : today.getMonth(),
  });

  const firstDay = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();

  const prevMonth = () =>
    setView(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 });
  const nextMonth = () =>
    setView(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 });

  const selectDay = (day) => {
    onChange(new Date(view.year, view.month, day));
    onClose();
  };

  const isSelected = (day) =>
    selectedDate &&
    selectedDate.getFullYear() === view.year &&
    selectedDate.getMonth()    === view.month &&
    selectedDate.getDate()     === day;

  const isToday = (day) =>
    today.getFullYear() === view.year &&
    today.getMonth()    === view.month &&
    today.getDate()     === day;

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-white border border-slate-200 rounded-xl shadow-2xl p-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={prevMonth}
          className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-bold text-slate-800">
          {MONTHS[view.month]} {view.year}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <span key={d} className="text-center text-[10px] font-semibold text-slate-400 py-1">{d}</span>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, idx) =>
          day === null ? (
            <span key={`empty-${idx}`} />
          ) : (
            <button
              key={day}
              type="button"
              onClick={() => selectDay(day)}
              className={`
                h-8 w-8 mx-auto flex items-center justify-center rounded-full text-xs font-medium transition-colors
                ${isSelected(day)
                  ? "bg-[#7667ff] text-white font-bold"
                  : isToday(day)
                  ? "border border-[#7667ff] text-[#7667ff] font-bold hover:bg-purple-50"
                  : "text-slate-700 hover:bg-slate-100"
                }
              `}
            >
              {day}
            </button>
          )
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
        <button
          type="button"
          onClick={() => { onChange(new Date()); onClose(); }}
          className="text-xs font-semibold text-[#7667ff] hover:underline"
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => { onChange(null); onClose(); }}
          className="text-xs text-slate-400 hover:text-slate-600"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

const IconButton = ({ title, active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`flex h-10 w-10 items-center justify-center rounded-md border text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100 ${
      active ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-white hover:bg-slate-50"
    }`}
  >
    {children}
  </button>
);

const Navbar = ({ onLogout, currentUser }) => {
  const navigate        = useNavigate();
  const location        = useLocation();
  const { locale, t }   = useI18n();
  const [search, setSearch]             = useState("");
  const [dark, setDark]                 = useState(() => localStorage.getItem("rico-theme") === "dark");
  const [pickerOpen, setPickerOpen]     = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const pickerRef                       = useRef(null);

  const meta = useMemo(() => {
    if (location.pathname.startsWith("/part/")) {
      return { title: "Part Profile", subtitle: "Configuration, operations and document control" };
    }
    return pageMeta[location.pathname] || pageMeta["/parts"];
  }, [location.pathname]);

  const displayDate = useMemo(() => {
    const d = selectedDate || new Date();
    return d.toLocaleDateString(locale, {
      weekday: "short",
      day:     "2-digit",
      month:   "short",
      year:    "numeric",
    });
  }, [selectedDate, locale]);

  const user = currentUser || { name: "Admin", role: "Administrator" };
  const initials = user.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join("") || "AD";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("rico-theme", dark ? "dark" : "light");
  }, [dark]);

  // Close picker on outside click
  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [pickerOpen]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const value = search.trim();
    navigate(value ? `/parts?search=${encodeURIComponent(value)}` : "/parts");
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-50 h-[72px] border-b border-slate-200 bg-white/95 px-4 shadow-sm backdrop-blur lg:left-64">
      <div className="flex h-full items-center justify-between gap-4">
        {/* Left: page title */}
        <div className="min-w-0">
          <div className="mt-0.5 flex min-w-0 items-center gap-3">
            <h1 className="truncate text-xl font-bold text-slate-900">{meta.title}</h1>
            <span className="hidden h-5 w-px bg-slate-200 sm:block" />
            <p className="hidden truncate text-sm text-slate-500 md:block">{meta.subtitle}</p>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
            <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-10 w-64 rounded-md border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white"
              placeholder={t("searchPartPlaceholder")}
            />
          </form>

          {/* Date Picker */}
          <div className="relative hidden sm:block" ref={pickerRef}>
            <button
              type="button"
              onClick={() => setPickerOpen(prev => !prev)}
              title="Pick a date"
              className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-purple-100 ${
                pickerOpen
                  ? "border-[#7667ff] bg-purple-50 text-[#7667ff]"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white hover:border-slate-300"
              }`}
            >
              <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M8 7V3m8 4V3M5 11h14M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{displayDate}</span>
            </button>

            {pickerOpen && (
              <DatePicker
                selectedDate={selectedDate}
                onChange={setSelectedDate}
                onClose={() => setPickerOpen(false)}
              />
            )}
          </div>

          {/* Dark mode toggle */}
          <IconButton title={dark ? t("lightMode") : t("darkMode")} active={dark} onClick={() => setDark(!dark)}>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </IconButton>

          {/* User info */}
          <div className="hidden items-center gap-3 border-l border-slate-200 pl-3 md:flex">
            <div className="text-right leading-tight">
              <p className="text-sm font-bold capitalize text-slate-800">{user.name}</p>
              <p className="text-xs text-slate-500">{user.role}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1f6feb] text-sm font-bold text-white">
              {initials}
            </div>
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={onLogout}
            title={t("logout")}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-100"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M17 16l4-4m0 0l-4-4m4 4H9m4 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;