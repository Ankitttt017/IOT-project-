import React from "react";

const safeText = (value, fallback) => String(value || "").trim() || fallback;

const MachineSVG = () => (
  <svg viewBox="0 0 200 140" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="20" y="100" width="160" height="20" rx="3" fill="#2d3748" />
    <rect x="35" y="45" width="130" height="58" rx="4" fill="#4a5568" />
    <rect x="45" y="52" width="55" height="45" rx="3" fill="#2d3748" />
    <rect x="110" y="55" width="45" height="38" rx="3" fill="#1a202c" />
    <rect x="114" y="59" width="37" height="20" rx="2" fill="#2b6cb0" />
    <rect x="116" y="61" width="33" height="16" rx="1" fill="#3182ce" opacity="0.7"/>
    <circle cx="120" cy="85" r="3" fill="#68d391" />
    <circle cx="130" cy="85" r="3" fill="#fc8181" />
    <circle cx="140" cy="85" r="3" fill="#f6e05e" />
    <rect x="55" y="20" width="12" height="35" rx="2" fill="#718096" />
    <rect x="52" y="15" width="18" height="10" rx="2" fill="#4a5568" />
    <rect x="90" y="58" width="20" height="8" rx="1" fill="#e2e8f0" />
    <rect x="107" y="60" width="8" height="4" rx="1" fill="#cbd5e0" />
    <rect x="36" y="65" width="8" height="25" rx="1" fill="#2d3748" />
    <rect x="156" y="65" width="8" height="25" rx="1" fill="#2d3748" />
    <rect x="35" y="43" width="130" height="5" rx="2" fill="#f6ad55" opacity="0.8" />
    <rect x="45" y="118" width="15" height="8" rx="1" fill="#1a202c" />
    <rect x="140" y="118" width="15" height="8" rx="1" fill="#1a202c" />
  </svg>
);

const getStatusBar = (status) => {
  if (status === "RUNNING") return "bg-green-500";
  if (status === "STOPPED") return "bg-red-500";
  return "bg-red-400";
};

const getStatusBadge = (status) => {
  if (status === "RUNNING") return { bg: "bg-green-100 text-green-700", label: "Active" };
  if (status === "STOPPED") return { bg: "bg-red-100 text-red-700", label: "Stopped" };
  return { bg: "bg-orange-100 text-orange-700", label: "Management Loss" };
};

const MachineCard = ({ machine, division, line }) => {
  const status = safeText(machine?.status, "IDLE").toUpperCase();
  const badge = getStatusBadge(status);

  return (
    <article className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden cursor-pointer">
      <div className="bg-gray-50 h-44 flex items-center justify-center px-4 pt-4">
        <MachineSVG />
      </div>
      <div className={`h-1.5 w-full ${getStatusBar(status)}`} />
      <div className="p-4">
        <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 min-h-[2.5rem]">
          {safeText(machine?.name, "Unknown Machine")}
        </h3>
        <p className="text-xs text-gray-500 mt-1 font-medium">
          {division || safeText(machine?.category, "Uncategorized")}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{line || "—"}</p>
        <div className="mt-3">
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${badge.bg}`}>
            {badge.label}
          </span>
        </div>
      </div>
    </article>
  );
};

export default MachineCard;