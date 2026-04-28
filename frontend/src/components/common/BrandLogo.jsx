import React from "react";
import { useI18n } from "../../context/I18nContext";

const BrandLogo = ({ compact = false, light = false, className = "" }) => {
  const { t } = useI18n();
  const primary = light ? "text-white" : "text-[#214f95]";
  const secondary = light ? "text-white/70" : "text-[#214f95]";

  if (compact) {
    return (
      <div className={`flex flex-col leading-none ${className}`}>
        <span className={`text-[2rem] font-black tracking-[0.22em] ${primary}`}>RICO</span>
        <span className={`text-[0.48rem] font-semibold tracking-[0.28em] uppercase mt-1 ${secondary}`}>
          {t("companyName")}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col leading-none ${className}`}>
      <span className={`text-[3.1rem] sm:text-[3.5rem] font-black tracking-[0.26em] ${primary}`}>RICO</span>
      <span className={`text-[0.72rem] sm:text-[0.82rem] font-semibold tracking-[0.34em] uppercase mt-2 ${secondary}`}>
        {t("companyName")}
      </span>
    </div>
  );
};

export default BrandLogo;
