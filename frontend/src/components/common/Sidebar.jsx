import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import BrandLogo from "./BrandLogo";
import { getMachines, getStats } from "../../services/api";

const iconClass = "h-4 w-4";



const partOperationItems = [
  { label: "Part Master", to: "/parts", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4", countKey: "parts" },
  { label: "Machine Master", to: "/machines", icon: "M4 7h16M7 7V5a2 2 0 012-2h6a2 2 0 012 2v2m-9 4h4m-7 8h10a3 3 0 003-3v-5H4v5a3 3 0 003 3z", countKey: "machines" },
  { label: "Operation Master", to: "/operations", icon: "M9 5H7a2 2 0 00-2 2v12h14V7a2 2 0 00-2-2h-2m-6 0a3 3 0 016 0m-6 0h6m-7 7h8m-8 4h5", countKey: "operations" },
  { label: "Operation Logs", to: "/operations", icon: "M8 7V3m8 4V3M5 11h14M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2" },
  { label: "Insert Change Logs", to: "/operations", icon: "M12 4v16m8-8H4" },
  { label: "Assign Operation", to: "/operations", icon: "M9 12l2 2 4-4m5 2a8 8 0 11-16 0 8 8 0 0116 0" },
  { label: "Partwise Production", to: "/parts", icon: "M4 19V5m5 14V9m5 10V7m5 12v-8" },
  { label: "Cycle Time Analysis", to: "/parts", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0" },
];

const organisationItems = [
  { label: "Machines", to: "/organisation-master/machines", icon: "M4 7h16M7 7V5a2 2 0 012-2h6a2 2 0 012 2v2m-9 4h4m-7 8h10a3 3 0 003-3v-5H4v5a3 3 0 003 3z", countKey: "machines" },
];

const NavRow = ({ item, count }) => {
  const location = useLocation();
  const active =
    location.pathname === item.to ||
    (item.to.includes("machines") && location.pathname === "/machines") ||
    (item.to === "/parts" && location.pathname.startsWith("/part"));

  return (
  <NavLink
    to={item.to}
    title={item.label}
    className={`group flex min-h-[40px] items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
      active
        ? "bg-slate-100 text-[#7667ff]"
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
    }`}
  >
    <svg className={`${iconClass} shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d={item.icon} />
    </svg>
    <span className="min-w-0 flex-1 truncate">{item.label}</span>
    {typeof count === "number" && (
      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
        {count}
      </span>
    )}
    {item.locked && (
      <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    )}
  </NavLink>
  );
};

const Section = ({ title, items, counts, openDefault = false }) => {
  const location = useLocation();
  const activeInside = items.some((item) => item.to === location.pathname || (item.to === "/machines" && location.pathname.includes("machines")));
  const [open, setOpen] = useState(openDefault || activeInside);

  useEffect(() => {
    if (activeInside) setOpen(true);
  }, [activeInside]);

  return (
    <div className="px-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-[12px] font-bold uppercase tracking-wide text-[#7667ff] hover:bg-slate-50"
      >
        <span>{title}</span>
        <svg className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="mt-1 space-y-1">
          {items.map((item) => (
            <NavRow key={`${title}-${item.label}`} item={item} count={counts[item.countKey]} />
          ))}
        </div>
      )}
    </div>
  );
};

const Sidebar = () => {
  const [counts, setCounts] = useState({ parts: 0, machines: 0, operations: 0 });

  useEffect(() => {
    let active = true;
    Promise.allSettled([getStats(), getMachines()]).then(([statsResult, machinesResult]) => {
      if (!active) return;
      const stats = statsResult.status === "fulfilled" ? statsResult.value.data?.data : {};
      const machines = machinesResult.status === "fulfilled" ? machinesResult.value.data : [];
      setCounts({
        parts: Number(stats?.total_parts || 0),
        machines: Array.isArray(machines) ? machines.length : 0,
        operations: 0,
      });
    });
    return () => { active = false; };
  }, []);

  const formattedCounts = useMemo(() => counts, [counts]);

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-slate-200 bg-white shadow-sm lg:flex">
      <div className="border-b border-slate-100 px-5 py-4">
        <BrandLogo compact className="scale-[0.76] origin-left" />
      </div>

      <div className="flex-1 overflow-y-auto py-3">
        <Section title="Organisation Master" items={organisationItems} counts={formattedCounts} openDefault />
        <div className="my-3 border-t border-slate-100" />
        <Section title="Parts & Operations" items={partOperationItems} counts={formattedCounts} openDefault />
      </div>

      <div className="border-t border-slate-100 px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Data Source</p>
        <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-600">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Rico_DB PostgreSQL
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;