import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Sidebar from "../components/common/Sidebar";
import { getPlants, getParts } from "../services/api";
import { useI18n } from "../context/I18nContext";

const RicoPartIcon = () => (
  <svg viewBox="0 0 80 80" className="w-full h-full" fill="none">
    <circle cx="40" cy="40" r="38" fill="#8B0000" />
    <circle cx="40" cy="40" r="28" fill="#A00000" />
    <circle cx="40" cy="40" r="10" fill="#600000" />
    <circle cx="40" cy="40" r="5" fill="#3a0000" />
  </svg>
);

const PartCard = ({ part, t }) => {
  const navigate = useNavigate();
  const opCount = part.operation_count || 0;
  return (
    <div
      onClick={() => navigate(`/part/${part.material_code}`)}
      className="bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:border-teal-300 hover:-translate-y-0.5 transition-all duration-200 flex flex-col app-panel"
    >
      <div className="w-full aspect-square rounded-md flex items-center justify-center mb-2 overflow-hidden app-part-visual">
        <div className="w-14 h-14"><RicoPartIcon /></div>
      </div>
      <p className="text-xs font-bold app-part-title leading-tight line-clamp-2 min-h-[2rem]">
        {part.description?.length > 30 ? part.description.slice(0, 30) + '...' : part.description}
      </p>
      <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{part.material_code}</p>
      {part.manufacturing_type && (
        <span className="mt-1 text-[10px] px-1.5 py-0.5 rounded self-start font-medium app-badge">{part.manufacturing_type}</span>
      )}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 text-xs">
        <div className="text-center">
          <p className="font-bold text-gray-800">{opCount}</p>
          <p className="text-gray-400 text-[10px]">{t("operations")}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">{t("traceability")}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${part.traceability_status === "DISABLED" ? "bg-red-50 text-red-600" : "bg-teal-50 text-teal-700"}`}>
              {part.traceability_status === "DISABLED" ? t("disabled") : t("enabled")}
            </span>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${opCount > 0 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
            {opCount > 0 ? t("linked") : t("unlinked")}
          </span>
        </div>
      </div>
    </div>
  );
};

const PartMasterPage = ({ onLogout }) => {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const GROUP_FILTERS = [
    { label: t("all"), value: "" },
    { label: t("finished"), value: "FINISHED" },
    { label: t("semiFinished"), value: "SEMFINISH" },
  ];
  const [plants, setPlants]           = useState([]);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [parts, setParts]             = useState([]);
  const [stats, setStats]             = useState({ part_types: 0, linked: 0, unlinked: 0 });
  const [total, setTotal]             = useState(0);
  const [search, setSearch]           = useState(searchParams.get("search") || "");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);
  const [plantSearch, setPlantSearch] = useState("");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [groupFilter, setGroupFilter] = useState("");

  // Load plants on mount
  useEffect(() => {
    getPlants()
      .then(r => {
        setPlants(r.data.data);
        if (r.data.data.length > 0) setSelectedPlant(r.data.data[0]);
      })
      .catch(() => setError(t("loadPlantsError")));
  }, [t]);

  // Load parts whenever plant/search/group changes
  const fetchParts = useCallback(() => {
    if (!selectedPlant) return;
    setLoading(true);
    setError("");
    getParts({ plant: selectedPlant.code, search, group: groupFilter, limit: 200 })
      .then(r => {
        setParts(r.data.data);
        setStats(r.data.stats || {});
        setTotal(r.data.total || 0);
      })
      .catch(() => setError(t("loadPartsError")))
      .finally(() => setLoading(false));
  }, [selectedPlant, search, groupFilter, t]);

  useEffect(() => {
    const timer = setTimeout(fetchParts, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchParts]);

  useEffect(() => {
    const querySearch = searchParams.get("search") || "";
    setSearch(querySearch);
  }, [searchParams]);

  const handleSearchChange = (value) => {
    setSearch(value);
    if (value) {
      setSearchParams({ search: value });
    } else {
      setSearchParams({});
    }
  };

  const filteredPlants = plants.filter(p => p.name.toLowerCase().includes(plantSearch.toLowerCase()));
  const selectedGroup = GROUP_FILTERS.find(filter => filter.value === groupFilter) || GROUP_FILTERS[0];

  return (
    <div className="min-h-screen bg-gray-50 app-page">
      <Navbar onLogout={onLogout} />
      <Sidebar />

      <main className="pt-14 pl-14">
        <div className="p-4 sm:p-6 max-w-[1920px] mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">{t("organisationMaster")}</h1>
            <span className="text-gray-300">|</span>
            <nav className="flex items-center gap-1 text-sm text-gray-500">
              <span className="app-brand-text font-medium">{t("partOperations")}</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              <span className="font-medium text-gray-600">{t("partMaster")}</span>
            </nav>
          </div>

          {/* Main Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 mb-5 app-panel">
            <div className="flex flex-col gap-1 mb-4">
              <h2 className="text-base font-bold text-gray-900">{t("partMasterTitle")}</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                {t("partMasterDescription")}
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-end gap-4 mb-4">
              {/* Plant selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t("selectPlant")}</label>
                <div className="relative w-56">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-full flex items-center justify-between border rounded-md px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-100 app-field"
                  >
                    <span className="text-gray-700">{selectedPlant?.name || `${t("selectPlant")}...`}</span>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {dropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-30 overflow-hidden">
                      <div className="p-2 border-b">
                        <input className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none" placeholder={t("searchPlant")} value={plantSearch} onChange={e => setPlantSearch(e.target.value)} autoFocus />
                      </div>
                      {filteredPlants.map(plant => (
                        <button key={plant.id} onClick={() => { setSelectedPlant(plant); setDropdownOpen(false); setPlantSearch(""); }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${plant.id === selectedPlant?.id ? "app-selected font-semibold" : "hover:bg-gray-50 text-gray-700"}`}>
                          {plant.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Search */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t("searchPart")}</label>
                <div className="relative w-64">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <input className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-100 app-field" placeholder={t("enterPartName")} value={search} onChange={e => handleSearchChange(e.target.value)} />
                </div>
              </div>

              {/* Part type filter */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t("partType")}</label>
                <div className="relative w-52">
                  <button
                    type="button"
                    onClick={() => setGroupDropdownOpen(!groupDropdownOpen)}
                    className="w-full flex items-center justify-between border rounded-md px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-100 app-field"
                  >
                    <span className="text-gray-700">{selectedGroup.label}</span>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${groupDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {groupDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-30 overflow-hidden py-1">
                      {GROUP_FILTERS.map(filter => (
                        <button
                          key={filter.label}
                          type="button"
                          onClick={() => { setGroupFilter(filter.value); setGroupDropdownOpen(false); }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors ${
                            groupFilter === filter.value ? "app-selected font-semibold" : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <span>{filter.label}</span>
                          {groupFilter === filter.value && (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <p className="text-xs text-gray-400 mb-3">{t("showingPartsForPlant", { shown: parts.length, total, plant: selectedPlant?.name || "" })}</p>
            <div className="flex flex-wrap items-center gap-6">
              <StatBox value={stats.part_types || 0} label={t("partTypes")} color="text-gray-800" Icon={ClipIcon} />
              <StatBox value={stats.linked || 0} label={t("partLinked")} color="text-green-600" Icon={LinkIcon} />
              <StatBox value={stats.unlinked || 0} label={t("partUnlinked")} color="text-red-500" Icon={UnlinkIcon} />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="flex flex-col items-center gap-3">
                <svg className="w-8 h-8 animate-spin app-brand-text" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <p className="text-gray-400 text-sm">{t("loadingParts")}</p>
              </div>
            </div>
          ) : parts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-base font-medium">{t("noPartsFound")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
              {parts.map(part => <PartCard key={part.material_code} part={part} t={t} />)}
            </div>
          )}
        </div>
      </main>

      {(dropdownOpen || groupDropdownOpen) && <div className="fixed inset-0 z-20" onClick={() => { setDropdownOpen(false); setGroupDropdownOpen(false); }} />}
    </div>
  );
};

const StatBox = ({ value, label, color, Icon }) => (
  <div className="flex items-center gap-2">
    <span className={`text-2xl font-bold ${color}`}>{value}</span>
    <Icon />
    <span className="text-sm text-gray-500">{label}</span>
  </div>
);
const ClipIcon = () => <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>;
const LinkIcon = () => <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>;
const UnlinkIcon = () => <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>;

export default PartMasterPage;
