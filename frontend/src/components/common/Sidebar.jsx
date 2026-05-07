import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import BrandLogo from "./BrandLogo";
import { getMachines, getStats } from "../../services/api";
import { useSidebar } from "../../context/SidebarContext";

const iconClass = "h-5 w-5";

const partOperationItems = [
  { label: "Part Master", to: "/parts", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4", countKey: "parts" },
  { label: "Operation Master", to: "/operations", icon: "M9 5H7a2 2 0 00-2 2v12h14V7a2 2 0 00-2-2h-2m-6 0a3 3 0 016 0m-6 0h6m-7 7h8m-8 4h5", countKey: "operations", exact: true },
  { label: "Operation Logs", to: "/operations?view=logs", icon: "M8 7V3m8 4V3M5 11h14M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2" },
  { label: "Insert Change Logs", to: "/operations?view=changes", icon: "M12 4v16m8-8H4" },
  { label: "Assign Operation", to: "/operations?view=assign", icon: "M9 12l2 2 4-4m5 2a8 8 0 11-16 0 8 8 0 0116 0" },
  { label: "Partwise Production", to: "/parts?view=production", icon: "M4 19V5m5 14V9m5 10V7m5 12v-8" },
];

const organisationItems = [
  { label: "Machines", to: "/organisation-master/machines", icon: "M4 7h16M7 7V5a2 2 0 012-2h6a2 2 0 012 2v2m-9 4h4m-7 8h10a3 3 0 003-3v-5H4v5a3 3 0 003 3z", countKey: "machines" },
];

const splitTarget = (target) => {
  const [pathname, search = ""] = target.split("?");
  return { pathname, search: search ? `?${search}` : "" };
};

const isItemActive = (item, location) => {
  const target = splitTarget(item.to);
  if (target.search) return location.pathname === target.pathname && location.search === target.search;
  if (item.exact) return location.pathname === target.pathname && !location.search;
  return (
    location.pathname === target.pathname ||
    (target.pathname.includes("machines") && location.pathname === "/machines") ||
    (target.pathname === "/parts" && location.pathname.startsWith("/part"))
  );
};

const NavRow = ({ item, count, collapsed }) => {
  const location = useLocation();
  const active = isItemActive(item, location);

  return (
    <NavLink
      to={item.to}
      title={item.label}
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
        collapsed ? "justify-center" : ""
      } ${
        active
          ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
          : "text-slate-400 hover:bg-white/6 hover:text-white"
      }`}
    >
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
        active ? "bg-white/20 text-white" : "text-slate-400 group-hover:text-white"
      }`}>
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d={item.icon} />
        </svg>
      </span>

      {!collapsed && (
        <>
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          {typeof count === "number" && count > 0 && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              active ? "bg-white/20 text-white" : "bg-white/10 text-slate-400"
            }`}>
              {count}
            </span>
          )}
        </>
      )}

      {collapsed && (
        <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100 z-50">
          {item.label}
        </span>
      )}
    </NavLink>
  );
};

const Section = ({ title, items, counts, collapsed }) => (
  <div className={collapsed ? "px-2" : "px-3"}>
    {!collapsed && (
      <p className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
        {title}
      </p>
    )}
    {collapsed && <div className="my-2 border-t border-white/10" />}
    <div className="space-y-1">
      {items.map((item) => (
        <NavRow key={item.label} item={item} count={counts[item.countKey]} collapsed={collapsed} />
      ))}
    </div>
  </div>
);

const Sidebar = () => {
  const { collapsed, setCollapsed } = useSidebar(); // ← from context
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
    <aside className={`app-sidebar fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-white/8 lg:flex transition-all duration-300 ease-in-out ${
      collapsed ? "w-[72px]" : "w-72"
    }`}>

      {/* Header */}
      <div className={`flex items-center border-b border-white/8 ${
        collapsed ? "justify-center px-3 py-4" : "justify-between px-5 py-4"
      }`}>
        {!collapsed && (
          <div className="rounded-lg border border-white/8 bg-white px-3 py-1.5 shadow-lg">
            <BrandLogo compact className="origin-left scale-[0.62]" />
          </div>
        )}
        <button
          type="button"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4">
        <div className="space-y-5">
          <Section title="Organisation Master" items={organisationItems} counts={formattedCounts} collapsed={collapsed} />
          <Section title="Parts & Operations" items={partOperationItems} counts={formattedCounts} collapsed={collapsed} />
        </div>
      </div>

      {/* Footer */}
      <div className={`border-t border-white/8 ${collapsed ? "px-2 py-4" : "px-4 py-4"}`}>
        <div className={`group relative flex items-center gap-3 rounded-xl border border-red-500/20 px-3 py-2.5 text-sm font-medium text-red-400 ${
          collapsed ? "justify-center" : ""
        }`}>
          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!collapsed && <span>Logged in</span>}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;