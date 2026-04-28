import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Sidebar from "../components/common/Sidebar";
import OperationsTab from "../components/partprofile/OperationsTab";
import ConfigurationTab from "../components/partprofile/ConfigurationTab";
import { ProductionOrdersTab, ProductionLogTab } from "../components/partprofile/LockedTabs";
import { getPartById, getOperations, getConfig, getSheets, updatePart } from "../services/api";
import { useI18n } from "../context/I18nContext";

const RicoIcon = () => (
  <svg viewBox="0 0 80 80" className="w-full h-full" fill="none">
    <circle cx="40" cy="40" r="38" fill="#8B0000" />
    <circle cx="40" cy="40" r="28" fill="#A00000" />
    <circle cx="40" cy="40" r="10" fill="#600000" />
    <circle cx="40" cy="40" r="5" fill="#3a0000" />
  </svg>
);

const EditableInfoRow = ({ label, value, editable, onSave, saveLabel, cancelLabel }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => setDraft(value || ""), [value]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draft.trim());
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{label}</span>
        {editable && (
          <button onClick={() => setEditing(true)} className="p-0.5 hover:bg-gray-100 rounded text-teal-600 hover:text-teal-700 transition-colors">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
      </div>
      {editing ? (
        <div className="mt-1 flex items-center gap-1.5">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="min-w-0 flex-1 border rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-teal-100 app-field"
            autoFocus
          />
          <button onClick={handleSave} disabled={saving} className="text-[10px] bg-teal-700 text-white px-2 py-1 rounded disabled:opacity-60">
            {saving ? "..." : saveLabel}
          </button>
          <button onClick={() => { setDraft(value || ""); setEditing(false); }} className="text-[10px] text-gray-500 hover:text-gray-700">{cancelLabel}</button>
        </div>
      ) : (
        <p className={`text-sm mt-0.5 font-medium ${value ? "app-part-title" : "text-gray-300 italic"}`}>{value || "-"}</p>
      )}
    </div>
  );
};

const TraceabilityInfoRow = ({ value, onSave, label, enabledLabel, disabledLabel }) => {
  const [saving, setSaving] = useState(false);
  const status = value === "DISABLED" ? "DISABLED" : "ENABLED";

  const handleChange = async (nextStatus) => {
    if (nextStatus === status) return;
    setSaving(true);
    try {
      await onSave(nextStatus);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-1 inline-flex rounded-md border border-gray-200 overflow-hidden">
        <button
          type="button"
          disabled={saving}
          onClick={() => handleChange("ENABLED")}
          className={`px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
            status === "ENABLED" ? "app-selected" : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          {enabledLabel}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => handleChange("DISABLED")}
          className={`px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
            status === "DISABLED" ? "bg-red-50 text-red-600" : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          {disabledLabel}
        </button>
      </div>
    </div>
  );
};

const PartProfilePage = ({ onLogout }) => {
  const { t } = useI18n();
  const { id } = useParams();
  const navigate = useNavigate();
  const tabs = [
    { key: "operations", label: t("operations") },
    { key: "configuration", label: t("configuration") },
    { key: "production-orders", label: t("productionOrders") },
    { key: "production-log", label: t("productionLog") },
  ];

  const [activeTab, setActiveTab] = useState("operations");
  const [part, setPart] = useState(null);
  const [operations, setOperations] = useState([]);
  const [config, setConfig] = useState(null);
  const [sheets, setSheets] = useState({ processFlow: [], inspection: [], controlPlan: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([getPartById(id), getOperations(id), getConfig(id), getSheets(id)])
      .then(([pRes, oRes, cRes, sRes]) => {
        setPart(pRes.data.data);
        setOperations(oRes.data.data);
        setConfig(cRes.data.data);
        setSheets(sRes.data.data);
      })
      .catch(() => setError(t("loadPartError")))
      .finally(() => setLoading(false));
  }, [id, t]);

  const savePartField = async (field, value) => {
    const res = await updatePart(id, { [field]: value });
    setPart(res.data.data);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="w-10 h-10 animate-spin app-brand-text" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-gray-400 text-sm">{t("loadingPartDetails")}</p>
        </div>
      </div>
    );
  }

  if (error || !part) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-600 mb-2">{error || t("partNotFound")}</h2>
          <button onClick={() => navigate("/")} className="app-brand-text hover:underline text-sm">&larr; {t("backToPartMaster")}</button>
        </div>
      </div>
    );
  }

  const partData = {
    ...part,
    operations,
    processFlowDiagram: sheets.processFlow || [],
    finalInspectionSheet: sheets.inspection || [],
    controlPlanChart: sheets.controlPlan || [],
    configuration: config || { hourlyTarget: 0, cycletime: 0, boxQuantity: 0, manufacturingType: "" },
  };

  return (
    <div className="min-h-screen bg-gray-50 app-page">
      <Navbar onLogout={onLogout} />
      <Sidebar />

      <main className="pt-14 pl-14">
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-1.5 mb-4 text-sm text-gray-500">
            <button onClick={() => navigate("/")} className="app-brand-text font-semibold hover:underline">{t("partMaster")}</button>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-500 font-mono truncate max-w-xs">{id}</span>
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            <div className="w-full lg:w-72 xl:w-80 flex-shrink-0">
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20"><RicoIcon /></div>
                </div>
                <div className="text-center mb-4">
                  <h2 className="text-sm font-bold text-gray-800 leading-tight mb-2">{part.description}</h2>
                  {part.material_group && (
                    <span className="inline-block app-badge text-[10px] font-bold px-2 py-1 rounded-full tracking-wide">
                      {part.material_group}
                    </span>
                  )}
                </div>
                <div className="border-t border-gray-100 pt-4 space-y-0.5">
                  <EditableInfoRow label={t("materialCode")} value={part.material_code} editable={false} saveLabel={t("save")} cancelLabel={t("cancel")} />
                  <EditableInfoRow label={t("finalOpnCode")} value={part.final_opn_code} editable onSave={(v) => savePartField("final_opn_code", v)} saveLabel={t("save")} cancelLabel={t("cancel")} />
                  <EditableInfoRow label={t("opnNumber")} value={part.opn_number} editable onSave={(v) => savePartField("opn_number", v)} saveLabel={t("save")} cancelLabel={t("cancel")} />
                  <EditableInfoRow label={t("customer")} value={part.customer} editable onSave={(v) => savePartField("customer", v)} saveLabel={t("save")} cancelLabel={t("cancel")} />
                  <EditableInfoRow label={t("plant")} value={part.plant_code} editable onSave={(v) => savePartField("plant_code", v)} saveLabel={t("save")} cancelLabel={t("cancel")} />
                  <TraceabilityInfoRow
                    label={t("traceability")}
                    enabledLabel={t("enabled")}
                    disabledLabel={t("disabled")}
                    value={part.traceability_status}
                    onSave={(v) => savePartField("traceability_status", v)}
                  />
                  <EditableInfoRow label={t("unitOfMeasure")} value={part.unit_of_measure} saveLabel={t("save")} cancelLabel={t("cancel")} />
                  <EditableInfoRow label={t("cycleTimeSec")} value={part.cycle_time_sec ? `${part.cycle_time_sec}s` : null} saveLabel={t("save")} cancelLabel={t("cancel")} />
                  <EditableInfoRow label={t("manufacturingType")} value={part.manufacturing_type} editable onSave={(v) => savePartField("manufacturing_type", v)} saveLabel={t("save")} cancelLabel={t("cancel")} />
                  <EditableInfoRow label={t("totalProduced")} value={String(part.total_produced || 0)} saveLabel={t("save")} cancelLabel={t("cancel")} />
                  <EditableInfoRow label={t("registeredOn")} value={part.registered_on} saveLabel={t("save")} cancelLabel={t("cancel")} />
                  <EditableInfoRow label={t("revisionDate")} value={part.revision_date} saveLabel={t("save")} cancelLabel={t("cancel")} />
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="border-b border-gray-200 overflow-x-auto">
                  <div className="flex min-w-max">
                    {tabs.map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-1.5 px-5 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                          activeTab === tab.key ? "border-b-2 border-teal-600 text-teal-700" : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 sm:p-6">
                  {activeTab === "operations" && <OperationsTab part={partData} partId={id} onSheetsChange={setSheets} />}
                  {activeTab === "configuration" && <ConfigurationTab part={partData} partId={id} onConfigChange={setConfig} onPartChange={setPart} />}
                  {activeTab === "production-orders" && <ProductionOrdersTab />}
                  {activeTab === "production-log" && <ProductionLogTab />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PartProfilePage;
