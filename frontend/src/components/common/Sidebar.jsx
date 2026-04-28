import React from "react";
import { useI18n } from "../../context/I18nContext";

const Sidebar = () => {
  const { t } = useI18n();
  const partMasterLabel = t("partMaster");
  return (
    <aside className="fixed top-14 left-0 bottom-0 w-14 app-sidebar flex flex-col items-center pt-4 z-40">
      <button
        title={t("partMaster")}
        className="w-10 h-10 rounded-lg bg-white/14 ring-1 ring-white/20 flex items-center justify-center text-white shadow-sm"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      </button>
      <span className="text-[9px] text-white/75 mt-1 font-medium text-center leading-tight">
        {partMasterLabel.includes(" ") ? (
          <>
            {partMasterLabel.split(" ")[0]}<br />{partMasterLabel.split(" ").slice(1).join(" ")}
          </>
        ) : (
          partMasterLabel
        )}
      </span>
    </aside>
  );
};

export default Sidebar;
