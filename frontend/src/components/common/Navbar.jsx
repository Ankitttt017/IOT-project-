import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../../context/I18nContext";
import BrandLogo from "./BrandLogo";

const languages = [
  { code: "EN", label: "English" },
  { code: "HI", label: "Hindi" },
];

const orgItems = [
  { key: "plants", fallback: "Plants" },
  { key: "departments", fallback: "Departments" },
  { key: "machines", fallback: "Machines" },
  { key: "users", fallback: "Users" },
  { key: "roles", fallback: "Roles" },
];
const legacyOrgMap = {
  "Organisation Setup": "organisationSetup",
  Plants: "plants",
  Departments: "departments",
  Machines: "machines",
  Users: "users",
  Roles: "roles",
};

const IconButton = ({ title, active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`h-9 w-9 rounded-md flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-teal-100 ${
      active ? "app-selected" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
    }`}
  >
    {children}
  </button>
);

const Navbar = ({ onLogout }) => {
  const navigate = useNavigate();
  const { language, setLanguage, locale, t } = useI18n();
  const [openMenu, setOpenMenu] = useState(null);
  const [search, setSearch] = useState("");
  const [org, setOrg] = useState(() => legacyOrgMap[localStorage.getItem("rico-org-module")] || localStorage.getItem("rico-org-module") || "organisationSetup");
  const [dark, setDark] = useState(() => localStorage.getItem("rico-theme") === "dark");
  const [calendarDate, setCalendarDate] = useState(() => new Date());

  const today = useMemo(() => new Date().toLocaleDateString(locale, {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }), [locale]);

  const monthLabel = useMemo(() => calendarDate.toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  }), [calendarDate, locale]);

  const dayLabels = useMemo(() => {
    const base = new Date(2026, 3, 5);
    return Array.from({ length: 7 }, (_, index) =>
      new Date(base.getFullYear(), base.getMonth(), base.getDate() + index).toLocaleDateString(locale, { weekday: "short" })
    );
  }, [locale]);

  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const gridStart = new Date(year, month, 1 - startOffset);
    const todayDate = new Date();

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      return {
        key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
        day: date.getDate(),
        currentMonth: date.getMonth() === month,
        isToday:
          date.getFullYear() === todayDate.getFullYear() &&
          date.getMonth() === todayDate.getMonth() &&
          date.getDate() === todayDate.getDate(),
      };
    });
  }, [calendarDate]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("rico-theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    localStorage.setItem("rico-org-module", org);
  }, [org]);

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const value = search.trim();
    navigate(value ? `/?search=${encodeURIComponent(value)}` : "/");
    setOpenMenu(null);
  };

  const currentOrgLabel = t(org) || t("organisationSetup");

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 app-topbar">
      <button onClick={() => navigate("/")} className="flex flex-col leading-none text-left focus:outline-none">
        <BrandLogo compact className="scale-[0.72] origin-left" />
      </button>

      <div className="flex items-center gap-1.5">
        <div className="relative">
          <IconButton title={t("language")} active={openMenu === "language"} onClick={() => toggleMenu("language")}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
          </IconButton>
          {openMenu === "language" && (
            <div className="absolute right-0 mt-2 w-44 rounded-lg border border-gray-200 bg-white shadow-xl py-1 z-50 app-popover">
              {languages.map(item => (
                <button
                  key={item.code}
                  onClick={() => { setLanguage(item.code); setOpenMenu(null); }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm ${language === item.code ? "app-selected font-semibold" : "text-gray-700 hover:bg-gray-50"}`}
                >
                  <span>{item.label}</span>
                  <span className="text-xs text-gray-400">{item.code}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <IconButton title={t("calendar")} active={openMenu === "calendar"} onClick={() => toggleMenu("calendar")}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </IconButton>
          {openMenu === "calendar" && (
            <div className="absolute right-0 mt-2 w-72 rounded-lg border border-gray-200 bg-white shadow-xl p-3 z-50 app-popover">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
                  className="h-8 w-8 rounded-md text-gray-500 hover:bg-gray-100"
                >
                  <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <p className="text-sm font-semibold text-gray-800">{monthLabel}</p>
                <button
                  type="button"
                  onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
                  className="h-8 w-8 rounded-md text-gray-500 hover:bg-gray-100"
                >
                  <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <div className="mt-3 grid grid-cols-7 gap-1 text-center">
                {dayLabels.map((day) => (
                  <span key={day} className="text-[11px] font-semibold uppercase text-gray-400 py-1">{day}</span>
                ))}
                {calendarDays.map((day) => (
                  <div
                    key={day.key}
                    className={`h-8 w-8 mx-auto rounded-md flex items-center justify-center text-sm ${
                      day.isToday
                        ? "bg-teal-700 text-white font-semibold"
                        : day.currentMonth
                          ? "text-gray-700"
                          : "text-gray-300"
                    }`}
                  >
                    {day.day}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t("today")}</p>
              <p className="mt-1 text-sm font-semibold text-gray-800">{today}</p>
              <p className="mt-2 text-xs text-gray-500">{t("datesUseSystemCalendar")}</p>
            </div>
          )}
        </div>

        <IconButton title={dark ? t("lightMode") : t("darkMode")} active={dark} onClick={() => setDark(!dark)}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        </IconButton>

        <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-1">
          {openMenu === "search" && (
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-44 sm:w-56 border border-gray-200 rounded-md py-2 pl-3 pr-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-100 app-input"
              placeholder={t("searchPartPlaceholder")}
              autoFocus
            />
          )}
          <button
            type={openMenu === "search" ? "submit" : "button"}
            onClick={() => openMenu !== "search" && toggleMenu("search")}
            title={t("search")}
            className={`h-9 w-9 rounded-md flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-teal-100 ${
              openMenu === "search" ? "app-selected" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </form>

        <div className="relative hidden sm:block">
          <button
            type="button"
            onClick={() => toggleMenu("org")}
            className={`h-9 flex items-center gap-1.5 px-3 text-sm rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-teal-100 ${
              openMenu === "org" ? "border-teal-200 app-selected" : "border-gray-200 text-gray-600 hover:bg-gray-100"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="font-medium whitespace-nowrap">{currentOrgLabel}</span>
            <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${openMenu === "org" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openMenu === "org" && (
            <div className="absolute right-0 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-xl py-1 z-50 app-popover">
              {orgItems.map(item => (
                <button
                  key={item.key}
                  onClick={() => { setOrg(item.key); setOpenMenu(null); }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm ${org === item.key ? "app-selected font-semibold" : "text-gray-700 hover:bg-gray-50"}`}
                >
                  <span>{t(item.key) || item.fallback}</span>
                  {org === item.key && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <IconButton title={t("logout")} onClick={onLogout}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </IconButton>
      </div>

      {openMenu && openMenu !== "search" && (
        <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
      )}
    </header>
  );
};

export default Navbar;
