import React, { useRef, useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { ActiveTab, RekapMode } from "../types";
import {
  LayoutDashboard,
  Database,
  Edit3,
  Printer,
  Table,
  UserCheck,
  Download,
  Upload,
  RotateCcw,
  GraduationCap,
  ChevronDown,
  Check,
  FileSpreadsheet,
  LogOut,
  User as UserIcon,
  Cloud,
  CloudCheck,
  BadgeCheck
} from "lucide-react";

export const Navbar: React.FC = () => {
  const {
    user,
    isAccountActive,
    logout,
    syncStatus,
    syncWithSupabase,
    activeTab,
    setActiveTab,
    schoolSettings,
    selectedSemester,
    setSelectedSemester,
    resetToDefaultData,
    exportDataJson,
    importDataJson,
    rekapMode,
    setRekapMode
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [rekapDropdownOpen, setRekapDropdownOpen] = useState(false);
  const rekapDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (rekapDropdownRef.current && !rekapDropdownRef.current.contains(event.target as Node)) {
        setRekapDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "master-data", label: "Master Data & Mapel", icon: Database },
    { id: "input-nilai", label: "Input Nilai Terpadu", icon: Edit3 },
    { id: "cetak-mapel", label: "Cetak Laporan Mapel", icon: Printer },
    { id: "rekap-all", label: "Rekap Nilai All-Mapel", icon: Table },
    { id: "analisis-kktp", label: "Analisis KKTP Siswa", icon: UserCheck }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importDataJson(content);
        if (success) {
          alert("Data cadangan berhasil dipulihkan!");
        } else {
          alert("Format file cadangan tidak valid.");
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <header className="no-print print:hidden bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & School Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-sm ring-1 ring-blue-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">SiPENA Kurmer</span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 rounded-full">
                  SD Kurikulum Merdeka
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {schoolSettings.namaSekolah} • Kelas {schoolSettings.kelas} ({schoolSettings.fase})
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-2">
            {/* Semester Switcher */}
            <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200 text-xs font-medium">
              <button
                id="btn-semester-1"
                onClick={() => setSelectedSemester("1")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  selectedSemester === "1"
                    ? "bg-white text-indigo-700 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Sem 1 (Ganjil)
              </button>
              <button
                id="btn-semester-2"
                onClick={() => setSelectedSemester("2")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  selectedSemester === "2"
                    ? "bg-white text-indigo-700 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Sem 2 (Genap)
              </button>
            </div>

            {/* Print button */}
            <button
              id="btn-print-navbar"
              type="button"
              onClick={() => window.print()}
              title="Cetak Halaman / Laporan Aktif (Ctrl+P)"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak / PDF</span>
            </button>

            {/* Data options dropdown / button group */}
            <div className="hidden md:flex items-center gap-1 border-l border-slate-200 pl-2">
              <button
                onClick={exportDataJson}
                title="Cadangkan Data (Export JSON)"
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                title="Pulihkan Data (Import JSON)"
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
              >
                <Upload className="w-4 h-4" />
              </button>

              <button
                onClick={resetToDefaultData}
                title="Reset ke Contoh Bawaan (SDN Karanggintung 06)"
                className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Supabase Cloud Sync Status & User Profile */}
            <div className="flex items-center gap-2 border-l border-slate-200 pl-2">
              <button
                type="button"
                onClick={syncWithSupabase}
                title={`Status Sinkronisasi Cloud: ${syncStatus === 'synced' ? 'Tersinkron (Klik untuk sinkronisasi ulang)' : syncStatus === 'syncing' ? 'Menyinkronkan...' : 'Mode Offline / Lokal'}`}
                className="hidden sm:flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <span className={`w-2 h-2 rounded-full ${syncStatus === 'synced' ? 'bg-emerald-500' : syncStatus === 'syncing' ? 'bg-amber-500 animate-ping' : 'bg-slate-400'}`} />
                <span className="font-mono text-[10px]">
                  {syncStatus === 'synced' ? 'Cloud OK' : syncStatus === 'syncing' ? 'Sync...' : 'Offline'}
                </span>
              </button>

              {/* User Account Info */}
              <div
                className="hidden md:flex flex-col text-right leading-tight max-w-[140px] lg:max-w-[180px]"
                title={`Pengguna: ${user?.email} • Lisensi: ${isAccountActive ? 'Aktif' : 'Belum Aktif'}`}
              >
                <div className="flex items-center justify-end gap-1">
                  <span className="text-[11px] font-bold text-slate-800 truncate">
                    {user?.user_metadata?.full_name || schoolSettings.namaGuru || "Guru Kelas"}
                  </span>
                  {isAccountActive && (
                    <BadgeCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" title="Lisensi Resmi Aktif" />
                  )}
                </div>
                <div className="flex items-center justify-end gap-1">
                  <span className="text-[10px] text-slate-400 font-mono truncate">
                    {user?.email}
                  </span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                id="btn-logout"
                type="button"
                onClick={logout}
                title="Keluar dari Aplikasi (Logout)"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100/90 border border-rose-200/80 transition-all cursor-pointer shadow-xs"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-1 border-t border-slate-100 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            if (item.id === "rekap-all") {
              const isRekapActive = activeTab === "rekap-all";
              return (
                <div key={item.id} ref={rekapDropdownRef} className="relative inline-flex">
                  <div
                    className={`inline-flex items-center rounded-lg border transition-colors ${
                      isRekapActive
                        ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold"
                        : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                    }`}
                  >
                    <button
                      id={`nav-${item.id}`}
                      onClick={() => setActiveTab(item.id)}
                      className="inline-flex items-center gap-2 px-3 py-2 text-xs sm:text-sm whitespace-nowrap cursor-pointer"
                    >
                      <Icon className={`w-4 h-4 ${isRekapActive ? "text-indigo-600" : "text-slate-500"}`} />
                      <span>
                        {isRekapActive
                          ? rekapMode === "rekap-asts"
                            ? "Rekap: Tes ASTS"
                            : rekapMode === "rekap-asas"
                            ? "Rekap: Tes ASAS"
                            : "Rekap Nilai All-Mapel"
                          : item.label}
                      </span>
                    </button>
                    <button
                      id="btn-rekap-dropdown-toggle"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRekapDropdownOpen((prev) => !prev);
                      }}
                      className={`px-1.5 py-2 hover:bg-indigo-100/70 rounded-r-lg border-l transition-colors cursor-pointer ${
                        isRekapActive ? "border-indigo-200 text-indigo-700" : "border-transparent text-slate-500"
                      }`}
                      title="Pilihan Jenis Rekapitulasi"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Dropdown Menu */}
                  {rekapDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="px-3 py-1.5 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        Pilihan Jenis Rekap
                      </div>

                      <button
                        onClick={() => {
                          setActiveTab("rekap-all");
                          setRekapMode("rekap-akhir");
                          setRekapDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-indigo-50/80 transition-colors cursor-pointer ${
                          isRekapActive && rekapMode === "rekap-akhir" ? "bg-indigo-50 font-bold text-indigo-900" : "text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                          <span>Rekap Nilai Akhir Rapor</span>
                        </div>
                        {isRekapActive && rekapMode === "rekap-akhir" && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab("rekap-all");
                          setRekapMode("rekap-asts");
                          setRekapDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-indigo-50/80 transition-colors cursor-pointer ${
                          isRekapActive && rekapMode === "rekap-asts" ? "bg-indigo-50 font-bold text-indigo-900" : "text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-amber-600 font-bold text-xs">🎯</span>
                          <div>
                            <p className="font-semibold text-slate-900">Hasil Tes Murni ASTS</p>
                            <p className="text-[10px] text-slate-500">Tes Murni Sumatif Tengah Semester</p>
                          </div>
                        </div>
                        {isRekapActive && rekapMode === "rekap-asts" && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab("rekap-all");
                          setRekapMode("rekap-asas");
                          setRekapDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-indigo-50/80 transition-colors cursor-pointer ${
                          isRekapActive && rekapMode === "rekap-asas" ? "bg-indigo-50 font-bold text-indigo-900" : "text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-600 font-bold text-xs">🏆</span>
                          <div>
                            <p className="font-semibold text-slate-900">Hasil Tes Murni ASAS</p>
                            <p className="text-[10px] text-slate-500">Tes Murni Sumatif Akhir Semester</p>
                          </div>
                        </div>
                        {isRekapActive && rekapMode === "rekap-asas" && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                      </button>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`inline-flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-200/60 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-indigo-600" : "text-slate-500"}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
