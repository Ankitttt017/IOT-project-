import React, { useEffect, useState, useCallback } from "react";
import Navbar from "../components/common/Navbar";
import Sidebar from "../components/common/Sidebar";
import { getPlants, getParts, getOperations } from "../services/api";

// ── Stats card ──────────────────────────────────────────────
const StatCard = ({ value, label, icon, color = "text-slate-800" }) => (
  <div className="flex flex-col items-center justify-center gap-1 rounded-md border border-slate-100 bg-slate-50 px-6 py-4 text-center">
    <div className="flex items-center gap-2">
      <span className={`text-3xl font-bold ${color}`}>{value}</span>
      <span className="text-slate-400">{icon}</span>
    </div>
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
  </div>
);

// ── Type badge ───────────────────────────────────────────────
const TypeBadge = ({ type }) => {
  const map = {
    CASTING:    "bg-orange-50 text-orange-700",
    MACHINING:  "bg-blue-50 text-blue-700",
    INSPECTION: "bg-teal-50 text-teal-700",
    ASSEMBLY:   "bg-purple-50 text-purple-700",
    PAINTING:   "bg-pink-50 text-pink-700",
    FG:         "bg-green-50 text-green-700",
  };
  const cls = map[type?.toUpperCase()] || "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
      {type || "—"}
    </span>
  );
};

// ── Linked badge ─────────────────────────────────────────────
const LinkedBadge = ({ linked }) => (
  <span className={`inline-block rounded px-2 py-0.5 text-[11px] font-semibold ${
    linked ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-500"
  }`}>
    {linked ? "Linked" : "Not Linked"}
  </span>
);

// ── Dropdown ─────────────────────────────────────────────────
const Dropdown = ({ label, value, options, onChange, placeholder, searchable = false }) => {
  const [open, setOpen]     = useState(false);
  const [query, setQuery]   = useState("");

  const filtered = searchable
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  const selected = options.find(o => o.value === value);

  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </label>
      <div className="relative w-56">
        <button
          type="button"
          onClick={() => setOpen(p => !p)}
          className="flex w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition focus:outline-none focus:ring-2 focus:ring-[#7667ff]/30"
        >
          <span className="truncate">{selected?.label || placeholder}</span>
          <svg className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="absolute left-0 top-full z-30 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
            {searchable && (
              <div className="border-b p-2">
                <input
                  className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm focus:outline-none"
                  placeholder="Search..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  autoFocus
                />
              </div>
            )}
            <div className="max-h-52 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="py-3 text-center text-xs text-slate-400">No results</p>
              ) : (
                filtered.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { onChange(opt.value); setOpen(false); setQuery(""); }}
                    className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                      opt.value === value
                        ? "bg-[#7667ff]/10 font-semibold text-[#7667ff]"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      {open && <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────
const OperationsMasterPage = ({ onLogout, currentUser }) => {
  const [plants, setPlants]             = useState([]);
  const [selectedPlant, setSelectedPlant] = useState("");
  const [parts, setParts]               = useState([]);
  const [selectedPart, setSelectedPart] = useState("");
  const [operations, setOperations]     = useState([]);
  const [loading, setLoading]           = useState(false);
  const [search, setSearch]             = useState("");
  const [page, setPage]                 = useState(1);
  const rowsPerPage                     = 10;

  // Load plants
  useEffect(() => {
    getPlants()
      .then(r => {
        const list = r.data.data || [];
        setPlants(list);
        if (list.length > 0) setSelectedPlant(list[0].code);
      })
      .catch(() => {});
  }, []);

  // Load parts when plant changes
  useEffect(() => {
    if (!selectedPlant) return;
    getParts({ plant: selectedPlant, limit: 9999 })
      .then(r => {
        setParts(r.data.data || []);
        setSelectedPart("");
      })
      .catch(() => setParts([]));
  }, [selectedPlant]);

  // Load operations
  const fetchOperations = useCallback(() => {
    if (!selectedPlant) return;
    setLoading(true);
    getOperations({ plant: selectedPlant, part: selectedPart || undefined })
      .then(r => setOperations(r.data.data || []))
      .catch(() => setOperations([]))
      .finally(() => setLoading(false));
  }, [selectedPlant, selectedPart]);

  useEffect(() => {
    fetchOperations();
    setPage(1);
  }, [fetchOperations]);

  // Derived stats
  const totalOps    = operations.length;
  const opTypes     = new Set(operations.map(o => o.type)).size;
  const linkedOps   = operations.filter(o => o.part_code).length;
  const unlinkedOps = totalOps - linkedOps;

  // Filter + paginate
  const filtered = operations.filter(op =>
    !search ||
    op.name?.toLowerCase().includes(search.toLowerCase()) ||
    op.label?.toLowerCase().includes(search.toLowerCase()) ||
    op.type?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages  = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paginated   = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // Options for dropdowns
  const plantOptions = plants.map(p => ({ value: p.code, label: p.name }));
  const partOptions  = [
    { value: "", label: "All Parts" },
    ...parts.map(p => ({ value: p.material_code, label: p.description || p.material_code })),
  ];

  const selectedPlantName = plants.find(p => p.code === selectedPlant)?.name || selectedPlant;
  const selectedPartName  = selectedPart
    ? parts.find(p => p.material_code === selectedPart)?.description || selectedPart
    : "All Parts";

  return (
    <div className="min-h-screen bg-[#f7f7fa] app-page">
      <Navbar onLogout={onLogout} currentUser={currentUser} />
      <Sidebar />

      <main className="pt-[88px] lg:pl-64">
        <div className="w-full p-4 sm:p-6">

          {/* Breadcrumb */}
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">Organisation Master</h1>
            <span className="text-gray-300">|</span>
            <nav className="flex items-center gap-1 text-sm text-gray-500">
              <span className="font-medium text-[#7667ff]">Part & Operations</span>
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="font-medium text-gray-600">Operation Master</span>
            </nav>
          </div>

          {/* Main card */}
          <div className="w-full rounded-md border border-gray-100 bg-white p-5 shadow-sm mb-5">
            <h2 className="text-base font-bold text-slate-900">Operation Master</h2>
            <p className="mt-1 text-sm text-slate-500 leading-relaxed max-w-4xl">
              The operation master is a list of all the existing operations registered in the plant.
              The operations can be linked to a particular part. Each operation must have a unique
              reference, a virtual store is automatically created for every operation registered
              which is credited as per policies and rules defined.
            </p>

            {/* Filters */}
            <div className="mt-5 flex flex-wrap items-end gap-4">
              <Dropdown
                label="Select Plant"
                value={selectedPlant}
                options={plantOptions}
                onChange={setSelectedPlant}
                placeholder="Select plant..."
              />
              <Dropdown
                label="Select Part"
                value={selectedPart}
                options={partOptions}
                onChange={setSelectedPart}
                placeholder="All Parts"
                searchable
              />
            </div>

            {/* Stats */}
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                value={totalOps}
                label="Operations Registered"
                color="text-slate-800"
                icon={
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                }
              />
              <StatCard
                value={opTypes}
                label="Operations Types"
                color="text-slate-800"
                icon={
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                }
              />
              <StatCard
                value={linkedOps}
                label="Operations Linked"
                color="text-emerald-600"
                icon={
                  <svg className="h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                }
              />
              <StatCard
                value={unlinkedOps}
                label="Operations Unlinked"
                color="text-red-500"
                icon={
                  <svg className="h-5 w-5 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                }
              />
            </div>

            {/* Breadcrumb trail */}
            <p className="mt-4 text-xs text-[#7667ff] font-medium">
              {selectedPlantName} &gt; {selectedPartName}
            </p>
          </div>

          {/* Table card */}
          <div className="w-full rounded-md border border-gray-100 bg-white shadow-sm">
            {/* Table toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>Show</span>
                <span className="font-semibold text-slate-700">{rowsPerPage}</span>
                <span>entries</span>
              </div>
              <div className="relative">
                <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  className="h-9 w-56 rounded-md border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7667ff]/20"
                  placeholder="Search operations..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3 w-16">SR. NO.</th>
                    <th className="px-4 py-3">Operation ID</th>
                    <th className="px-4 py-3">Operation Name</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Linked Part</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Rework</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <svg className="h-7 w-7 animate-spin text-[#7667ff]" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          <p className="text-xs text-slate-400">Loading operations...</p>
                        </div>
                      </td>
                    </tr>
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-400">
                        <svg className="mx-auto mb-3 h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12h14V7a2 2 0 00-2-2h-2m-6 0a3 3 0 016 0m-6 0h6" />
                        </svg>
                        <p className="text-sm font-medium">No operations found</p>
                        <p className="text-xs mt-1">Try changing the plant or part filter</p>
                      </td>
                    </tr>
                  ) : (
                    paginated.map((op, idx) => (
                      <tr
                        key={op.id}
                        className="border-b border-slate-50 transition-colors hover:bg-slate-50"
                      >
                        <td className="px-5 py-3 text-slate-400 text-xs">
                          {(page - 1) * rowsPerPage + idx + 1}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-semibold text-[#7667ff]">
                            {op.label || op.id}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800 max-w-xs">
                          {op.name}
                        </td>
                        <td className="px-4 py-3">
                          <TypeBadge type={op.type} />
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 font-mono">
                          {op.part_code || <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <LinkedBadge linked={!!op.part_code} />
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {op.rework || <span className="text-slate-300">No rework</span>}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && filtered.length > 0 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
                <span>
                  Showing {Math.min((page - 1) * rowsPerPage + 1, filtered.length)}–
                  {Math.min(page * rowsPerPage, filtered.length)} of {filtered.length} entries
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                    className="rounded px-2 py-1 hover:bg-slate-100 disabled:opacity-30"
                  >«</button>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded px-2 py-1 hover:bg-slate-100 disabled:opacity-30"
                  >‹</button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`rounded px-2.5 py-1 font-medium ${
                          p === page
                            ? "bg-[#7667ff] text-white"
                            : "hover:bg-slate-100 text-slate-600"
                        }`}
                      >{p}</button>
                    );
                  })}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="rounded px-2 py-1 hover:bg-slate-100 disabled:opacity-30"
                  >›</button>
                  <button
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages}
                    className="rounded px-2 py-1 hover:bg-slate-100 disabled:opacity-30"
                  >»</button>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default OperationsMasterPage;