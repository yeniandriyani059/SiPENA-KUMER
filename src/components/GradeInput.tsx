import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { calculateStudentGrades } from "../utils/gradeCalculations";
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Filter,
  Database,
  Printer,
  ChevronDown,
  Edit3,
  MessageSquare,
  Sparkles,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from "lucide-react";

const KOKURIKULER_PRESETS = [
  {
    label: "Mandiri & Kritis",
    text: "Menunjukkan kemandirian tinggi, aktif berargumen secara logis, dan mampu bernalar kritis dalam kegiatan kokurikuler."
  },
  {
    label: "Gotong Royong",
    text: "Sangat aktif dalam kerja kelompok, peduli terhadap teman, dan mampu bergotong royong menyelesaikan proyek kokurikuler."
  },
  {
    label: "Kreatif & Inovatif",
    text: "Memiliki daya kreativitas tinggi dalam memecahkan masalah dan berinisiatif baik selama pelaksanaan kokurikuler."
  },
  {
    label: "Perlu Pendampingan",
    text: "Perlu dorongan dan bimbingan aktif untuk meningkatkan rasa percaya diri serta ketuntasan dalam kegiatan kokurikuler."
  }
];

export const GradeInput: React.FC = () => {
  const {
    students,
    subjects,
    selectedSubjectId,
    setSelectedSubjectId,
    selectedSemester,
    setSelectedSemester,
    getGradeRecord,
    updateStudentGradeField,
    refreshGradeRecords,
    setActiveTab
  } = useApp();

  // Auto-fetch real-time grade records from Supabase on mount, semester change, or subject change
  useEffect(() => {
    refreshGradeRecords();
  }, [selectedSemester, selectedSubjectId, refreshGradeRecords]);

  const [activeSectionView, setActiveSectionView] = useState<"all" | "formatif" | "sumatif">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingNoteStudent, setEditingNoteStudent] = useState<{
    id: string;
    nama: string;
    nisn: string;
  } | null>(null);

  const currentSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

  if (!currentSubject) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <p className="text-slate-500">Mata pelajaran tidak ditemukan. Silakan tambahkan di Master Data.</p>
      </div>
    );
  }

  // Collect all TPs and BABs for current subject
  const allTps = currentSubject.babs.flatMap((b) => b.tps);
  const activeTpIds = allTps.map((t) => t.id);
  const activeBabIds = currentSubject.babs.map((b) => b.id);
  const totalFormatifTpCols = currentSubject.babs.reduce(
    (acc, bab) => acc + Math.max(bab.tps.length, 1),
    0
  );
  const totalFormatifCols = totalFormatifTpCols + 3; // + UH, Tugas, Proyek

  // Filter students if search term
  const filteredStudents = students.filter(
    (s) =>
      s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nisn.includes(searchTerm) ||
      s.noInduk.includes(searchTerm)
  );

  // Parse numeric input value safely
  const handleScoreChange = (
    studentId: string,
    section: "formatif" | "sumatif",
    field: string,
    rawVal: string,
    subKey?: string
  ) => {
    let parsed: number | null = null;
    if (rawVal.trim() !== "") {
      const num = Number(rawVal);
      if (!isNaN(num)) {
        parsed = Math.min(100, Math.max(0, num));
      }
    }
    updateStudentGradeField(studentId, currentSubject.id, selectedSemester, section, field, parsed, subKey);
  };

  // Quick stats for current table
  let countTuntas = 0;
  let countBelumTuntas = 0;
  let sumNA = 0;
  let countNA = 0;
  let sumFormatif = 0;
  let countFormatif = 0;

  filteredStudents.forEach((s) => {
    const rec = getGradeRecord(s.id, currentSubject.id, selectedSemester);
    const calc = calculateStudentGrades(rec, currentSubject.kktp, activeTpIds, activeBabIds);
    if (calc.nilaiAkhir !== null) {
      sumNA += calc.nilaiAkhir;
      countNA++;
      if (calc.isTuntas) countTuntas++;
      else countBelumTuntas++;
    }
    if (calc.avgFormatifAll !== null) {
      sumFormatif += calc.avgFormatifAll;
      countFormatif++;
    }
  });

  const countNotesFilled = filteredStudents.filter((s) => {
    const rec = getGradeRecord(s.id, currentSubject.id, selectedSemester);
    return Boolean(rec?.formatif.catatanP5 && rec.formatif.catatanP5.trim() !== "");
  }).length;

  const avgClassNA = countNA > 0 ? Math.round((sumNA / countNA) * 10) / 10 : null;
  const avgClassFormatif = countFormatif > 0 ? Math.round((sumFormatif / countFormatif) * 10) / 10 : null;

  return (
    <div className="space-y-4">
      {/* Top Filter & Subject Selector */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Subject & Semester selection */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-600">Mapel:</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="px-3 py-1.5 text-xs sm:text-sm font-bold border border-indigo-200 bg-indigo-50/50 text-indigo-900 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.kode} - {s.nama} (KKTP: {s.kktp})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-600">Semester:</label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value as "1" | "2")}
                className="px-3 py-1.5 text-xs font-semibold border border-slate-300 bg-white text-slate-800 rounded-lg"
              >
                <option value="1">Semester 1 (Ganjil)</option>
                <option value="2">Semester 2 (Genap)</option>
              </select>
            </div>

            {/* View Mode Filters */}
            <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200 text-xs font-medium">
              <button
                onClick={() => setActiveSectionView("all")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  activeSectionView === "all" ? "bg-white text-indigo-700 shadow-xs font-semibold" : "text-slate-600"
                }`}
              >
                Semua Kolom
              </button>
              <button
                onClick={() => setActiveSectionView("formatif")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  activeSectionView === "formatif" ? "bg-white text-indigo-700 shadow-xs font-semibold" : "text-slate-600"
                }`}
              >
                Formatif (Proses)
              </button>
              <button
                onClick={() => setActiveSectionView("sumatif")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  activeSectionView === "sumatif" ? "bg-white text-indigo-700 shadow-xs font-semibold" : "text-slate-600"
                }`}
              >
                Sumatif (LM & Tes)
              </button>
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Cari siswa / NISN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg w-36 sm:w-48"
            />

            <button
              onClick={() => setActiveTab("cetak-mapel")}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Lembar Mapel</span>
            </button>
          </div>
        </div>

        {/* Real-time Summary Strip */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Database className="w-3 h-3 text-emerald-600" />
              <span>Database: sipena_nilai</span>
            </span>
            <span>•</span>
            <span>
              Target KKTP: <strong className="text-slate-900">{currentSubject.kktp}</strong>
            </span>
            <span>•</span>
            <span>
              Rata-rata Formatif:{" "}
              <strong className="text-sky-700 font-mono">
                {avgClassFormatif !== null ? avgClassFormatif : "-"}
              </strong>
            </span>
            <span>•</span>
            <span>
              Rata-rata N/A:{" "}
              <strong className={avgClassNA && avgClassNA >= currentSubject.kktp ? "text-emerald-700 font-mono" : "text-rose-600 font-mono"}>
                {avgClassNA !== null ? avgClassNA : "-"}
              </strong>
            </span>
            <span>•</span>
            <span>
              Tuntas: <strong className="text-emerald-600">{countTuntas} Siswa</strong>
            </span>
            <span>•</span>
            <span>
              Belum Tuntas: <strong className="text-rose-600">{countBelumTuntas} Siswa</strong>
            </span>
            <span>•</span>
            <span>
              Catatan Kokurikuler:{" "}
              <strong className="text-amber-700 font-mono">
                {countNotesFilled}/{filteredStudents.length} Terisi
              </strong>
            </span>
          </div>
          <span className="text-[11px] text-slate-400 italic">
            * Nilai langsung tersimpan otomatis ke penyimpanan lokal browser.
          </span>
        </div>
      </div>

      {/* Interactive Grade Entry Sheet */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[680px] custom-scrollbar">
          <table className="w-full text-center text-xs border-collapse">
            <thead className="sticky top-0 z-20 bg-slate-100 text-slate-800 font-bold border-b border-slate-300 select-none shadow-xs">
              {/* Header Baris 1 (Level 1: Kategori Utama) */}
              <tr>
                <th rowSpan={3} className="py-2 px-2.5 border border-slate-300 w-10 bg-slate-100">No</th>
                <th rowSpan={3} className="py-2 px-3 border border-slate-300 text-left min-w-[170px] bg-slate-100 sticky left-0 z-30 shadow-xs">
                  Nama Siswa
                </th>

                {/* Formatif Group Level 1 */}
                {(activeSectionView === "all" || activeSectionView === "formatif") && (
                  <th
                    colSpan={totalFormatifCols}
                    className="py-1.5 px-2 border border-slate-300 bg-sky-100 text-sky-900 uppercase text-[11px] font-extrabold tracking-wider"
                  >
                    Asesmen Formatif (Proses Pembelajaran)
                  </th>
                )}

                {/* Sumatif Group Level 1 */}
                {(activeSectionView === "all" || activeSectionView === "sumatif") && (
                  <th
                    colSpan={currentSubject.babs.length + 4}
                    className="py-1.5 px-2 border border-slate-300 bg-amber-100 text-amber-900 uppercase text-[11px] font-extrabold tracking-wider"
                  >
                    Asesmen Sumatif
                  </th>
                )}

                {/* Hasil Akhir */}
                <th rowSpan={3} className="py-2 px-2 border border-slate-300 bg-indigo-50 text-indigo-900 w-16">
                  N/A
                </th>
                <th rowSpan={3} className="py-2 px-2 border border-slate-300 bg-indigo-50 text-indigo-900 min-w-[90px]">
                  Keterangan
                </th>
                <th rowSpan={3} className="py-2 px-2 border border-slate-300 bg-amber-50 text-amber-950 min-w-[160px] max-w-[220px]">
                  Catatan Observasi Kokurikuler
                </th>
              </tr>

              {/* Header Baris 2 (Level 2: Pengelompokan BAB & Sub-Asesmen) */}
              <tr>
                {/* Formatif Level 2: BAB Dinamis & Pendukung */}
                {(activeSectionView === "all" || activeSectionView === "formatif") && (
                  <>
                    {currentSubject.babs.map((bab) => {
                      const span = Math.max(bab.tps.length, 1);
                      return (
                        <th
                          key={`hdr-bab-${bab.id}`}
                          colSpan={span}
                          className="py-1 px-1 border border-slate-300 bg-sky-50 text-sky-950 font-bold text-[10.5px]"
                          title={`${bab.nama}: ${bab.judul}`}
                        >
                          {bab.nama}
                        </th>
                      );
                    })}
                    <th
                      colSpan={3}
                      className="py-1 px-1 border border-slate-300 bg-slate-200 text-slate-800 font-bold text-[10px]"
                      title="Komponen Pendukung Formatif"
                    >
                      Pendukung
                    </th>
                  </>
                )}

                {/* Sumatif Level 2: Lingkup Materi & Tes Semester */}
                {(activeSectionView === "all" || activeSectionView === "sumatif") && (
                  <>
                    <th
                      colSpan={currentSubject.babs.length}
                      className="py-1 px-1 border border-slate-300 bg-amber-50 text-amber-950 font-bold text-[10.5px]"
                    >
                      Sumatif Lingkup Materi (BAB)
                    </th>
                    <th
                      colSpan={2}
                      className="py-1 px-1 border border-slate-300 bg-orange-100 text-orange-950 font-bold text-[10.5px]"
                    >
                      ASTS (Tengah Sem)
                    </th>
                    <th
                      colSpan={2}
                      className="py-1 px-1 border border-slate-300 bg-red-100 text-red-950 font-bold text-[10.5px]"
                    >
                      ASAS (Akhir Sem)
                    </th>
                  </>
                )}
              </tr>

              {/* Header Baris 3 (Level 3: TP per BAB & Kolom Spesifik) */}
              <tr className="bg-slate-50 text-[10px] uppercase tracking-tight">
                {/* Formatif Level 3: TP per BAB dan UH, Tugas, Proyek */}
                {(activeSectionView === "all" || activeSectionView === "formatif") && (
                  <>
                    {currentSubject.babs.map((bab) => {
                      if (bab.tps.length === 0) {
                        return (
                          <th
                            key={`empty-tp-col-${bab.id}`}
                            className="py-1 px-1 border border-slate-300 min-w-[36px] text-slate-400 font-normal"
                          >
                            -
                          </th>
                        );
                      }
                      return bab.tps.map((tp) => (
                        <th
                          key={tp.id}
                          className="py-1 px-1 border border-slate-300 min-w-[48px] max-w-[62px] text-slate-700 bg-white font-bold"
                          title={`${tp.kode}: ${tp.deskripsi}`}
                        >
                          {tp.kode}
                        </th>
                      ));
                    })}
                    <th className="py-1 px-1 border border-slate-300 min-w-[46px] bg-slate-100 font-bold" title="Ulangan Harian">UH</th>
                    <th className="py-1 px-1 border border-slate-300 min-w-[46px] bg-slate-100 font-bold" title="Tugas Rutin">Tugas</th>
                    <th className="py-1 px-1 border border-slate-300 min-w-[50px] bg-slate-100 font-bold" title="Praktik / Proyek">Proyek</th>
                  </>
                )}

                {/* Sumatif Level 3: Kolom BAB dan Tes */}
                {(activeSectionView === "all" || activeSectionView === "sumatif") && (
                  <>
                    {currentSubject.babs.map((bab) => (
                      <th
                        key={bab.id}
                        className="py-1 px-1 border border-slate-300 min-w-[50px] bg-white font-bold"
                        title={bab.judul}
                      >
                        {bab.nama}
                      </th>
                    ))}
                    <th className="py-1 px-1 border border-slate-300 min-w-[46px] bg-orange-50 font-semibold" title="ASTS Non-Tes">Non-Tes</th>
                    <th className="py-1 px-1 border border-slate-300 min-w-[46px] bg-orange-50 font-semibold" title="ASTS Tes Tertulis">Tes</th>
                    <th className="py-1 px-1 border border-slate-300 min-w-[46px] bg-red-50 font-semibold" title="ASAS Non-Tes">Non-Tes</th>
                    <th className="py-1 px-1 border border-slate-300 min-w-[46px] bg-red-50 font-semibold" title="ASAS Tes Tertulis">Tes</th>
                  </>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {filteredStudents.map((student, idx) => {
                const record = getGradeRecord(student.id, currentSubject.id, selectedSemester);
                const calc = calculateStudentGrades(record, currentSubject.kktp, activeTpIds, activeBabIds);

                return (
                  <tr key={student.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="py-1.5 px-2 border border-slate-200 text-slate-500 font-medium">{idx + 1}</td>
                    
                    {/* Sticky Student Name Column */}
                    <td className="py-1.5 px-3 border border-slate-200 text-left font-semibold text-slate-900 sticky left-0 z-10 bg-white shadow-xs">
                      <div className="truncate max-w-[160px]" title={student.nama}>
                        {student.nama}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono font-normal">
                        {student.nisn} ({student.jenisKelamin})
                      </div>
                    </td>

                    {/* FORMATIF CELLS: Dikelompokkan Dinamis Per BAB */}
                    {(activeSectionView === "all" || activeSectionView === "formatif") && (
                      <>
                        {currentSubject.babs.map((bab) => {
                          if (bab.tps.length === 0) {
                            return (
                              <td
                                key={`empty-td-${bab.id}`}
                                className="p-0.5 border border-slate-200 text-slate-300 text-center text-xs"
                              >
                                -
                              </td>
                            );
                          }
                          return bab.tps.map((tp) => {
                            const val = record?.formatif.tpScores[tp.id] ?? "";
                            return (
                              <td key={tp.id} className="p-0.5 border border-slate-200">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={val}
                                  onChange={(e) =>
                                    handleScoreChange(student.id, "formatif", "tpScores", e.target.value, tp.id)
                                  }
                                  className="w-full text-center py-1 text-xs focus:bg-sky-50 focus:outline-hidden font-mono"
                                  placeholder="-"
                                />
                              </td>
                            );
                          });
                        })}

                        {/* UH */}
                        <td className="p-0.5 border border-slate-200 bg-slate-50/50">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={record?.formatif.ulanganHarian ?? ""}
                            onChange={(e) =>
                              handleScoreChange(student.id, "formatif", "ulanganHarian", e.target.value)
                            }
                            className="w-full text-center py-1 text-xs focus:bg-indigo-50 focus:outline-hidden font-mono"
                            placeholder="-"
                          />
                        </td>

                        {/* Tugas */}
                        <td className="p-0.5 border border-slate-200 bg-slate-50/50">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={record?.formatif.tugasRutin ?? ""}
                            onChange={(e) =>
                              handleScoreChange(student.id, "formatif", "tugasRutin", e.target.value)
                            }
                            className="w-full text-center py-1 text-xs focus:bg-indigo-50 focus:outline-hidden font-mono"
                            placeholder="-"
                          />
                        </td>

                        {/* Proyek */}
                        <td className="p-0.5 border border-slate-200 bg-slate-50/50">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={record?.formatif.praktikProyek ?? ""}
                            onChange={(e) =>
                              handleScoreChange(student.id, "formatif", "praktikProyek", e.target.value)
                            }
                            className="w-full text-center py-1 text-xs focus:bg-indigo-50 focus:outline-hidden font-mono"
                            placeholder="-"
                          />
                        </td>
                      </>
                    )}

                    {/* SUMATIF CELLS */}
                    {(activeSectionView === "all" || activeSectionView === "sumatif") && (
                      <>
                        {currentSubject.babs.map((bab) => {
                          const val = record?.sumatif.babScores[bab.id] ?? "";
                          return (
                            <td key={bab.id} className="p-0.5 border border-slate-200">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={val}
                                onChange={(e) =>
                                  handleScoreChange(student.id, "sumatif", "babScores", e.target.value, bab.id)
                                }
                                className="w-full text-center py-1 text-xs focus:bg-amber-50 focus:outline-hidden font-mono font-medium"
                                placeholder="-"
                              />
                            </td>
                          );
                        })}

                        {/* ASTS Non-Tes */}
                        <td className="p-0.5 border border-slate-200">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={record?.sumatif.astsNonTes ?? ""}
                            onChange={(e) =>
                              handleScoreChange(student.id, "sumatif", "astsNonTes", e.target.value)
                            }
                            className="w-full text-center py-1 text-xs focus:bg-orange-50 focus:outline-hidden font-mono"
                            placeholder="-"
                          />
                        </td>

                        {/* ASTS Tes */}
                        <td className="p-0.5 border border-slate-200">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={record?.sumatif.astsTes ?? ""}
                            onChange={(e) =>
                              handleScoreChange(student.id, "sumatif", "astsTes", e.target.value)
                            }
                            className="w-full text-center py-1 text-xs focus:bg-orange-50 focus:outline-hidden font-mono"
                            placeholder="-"
                          />
                        </td>

                        {/* ASAS Non-Tes */}
                        <td className="p-0.5 border border-slate-200">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={record?.sumatif.asasNonTes ?? ""}
                            onChange={(e) =>
                              handleScoreChange(student.id, "sumatif", "asasNonTes", e.target.value)
                            }
                            className="w-full text-center py-1 text-xs focus:bg-red-50 focus:outline-hidden font-mono"
                            placeholder="-"
                          />
                        </td>

                        {/* ASAS Tes */}
                        <td className="p-0.5 border border-slate-200">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={record?.sumatif.asasTes ?? ""}
                            onChange={(e) =>
                              handleScoreChange(student.id, "sumatif", "asasTes", e.target.value)
                            }
                            className="w-full text-center py-1 text-xs focus:bg-red-50 focus:outline-hidden font-mono"
                            placeholder="-"
                          />
                        </td>
                      </>
                    )}

                    {/* Calculated NA */}
                    <td className="py-1.5 px-2 border border-slate-200 bg-slate-50/50 font-mono font-bold text-xs">
                      {calc.nilaiAkhir !== null ? (
                        <span className={calc.isTuntas ? "text-emerald-700" : "text-rose-600"}>
                          {calc.nilaiAkhir}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Status Ketuntasan */}
                    <td className="py-1.5 px-2 border border-slate-200">
                      {calc.nilaiAkhir !== null ? (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-block ${
                            calc.isTuntas
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {calc.ketuntasan}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-[11px]">-</span>
                      )}
                    </td>

                    {/* Catatan Observasi Kokurikuler */}
                    <td className="p-1 border border-slate-200 bg-white text-left">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setEditingNoteStudent({
                              id: student.id,
                              nama: student.nama,
                              nisn: student.nisn
                            })
                          }
                          className="flex-1 text-left px-2 py-1 rounded border border-transparent hover:border-amber-300 hover:bg-amber-50/70 transition-colors group"
                          title="Klik untuk membuka editor Catatan Observasi Kokurikuler"
                        >
                          {record?.formatif.catatanP5 ? (
                            <span className="text-[10.5px] text-slate-700 italic line-clamp-1 group-hover:text-amber-900 block font-normal">
                              "{record.formatif.catatanP5}"
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic block">
                              + Tambah catatan...
                            </span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setEditingNoteStudent({
                              id: student.id,
                              nama: student.nama,
                              nisn: student.nisn
                            })
                          }
                          className="p-1 text-slate-400 hover:text-amber-800 hover:bg-amber-100 rounded transition-colors"
                          title="Edit Catatan Kokurikuler"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog Editor Catatan Observasi Kokurikuler */}
      {editingNoteStudent && (() => {
        const studentIndex = filteredStudents.findIndex((s) => s.id === editingNoteStudent.id);
        const currentRecord = getGradeRecord(editingNoteStudent.id, currentSubject.id, selectedSemester);
        const currentNote = currentRecord?.formatif.catatanP5 ?? "";

        const handlePrevNoteStudent = () => {
          if (studentIndex > 0) {
            const prev = filteredStudents[studentIndex - 1];
            setEditingNoteStudent({ id: prev.id, nama: prev.nama, nisn: prev.nisn });
          }
        };

        const handleNextNoteStudent = () => {
          if (studentIndex < filteredStudents.length - 1) {
            const next = filteredStudents[studentIndex + 1];
            setEditingNoteStudent({ id: next.id, nama: next.nama, nisn: next.nisn });
          }
        };

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="p-4 bg-amber-50/80 border-b border-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Catatan Observasi Kokurikuler
                    </h3>
                    <p className="text-xs text-slate-600">
                      {editingNoteStudent.nama} ({editingNoteStudent.nisn}) • {currentSubject.nama} (Sem. {selectedSemester})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingNoteStudent(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Terhubung ke Analisis KKTP & Rapor
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Siswa {studentIndex + 1} dari {filteredStudents.length}
                  </span>
                </div>

                {/* Textarea */}
                <textarea
                  rows={4}
                  value={currentNote}
                  onChange={(e) =>
                    updateStudentGradeField(
                      editingNoteStudent.id,
                      currentSubject.id,
                      selectedSemester,
                      "formatif",
                      "catatanP5",
                      e.target.value
                    )
                  }
                  placeholder="Tuliskan deskripsi observasi kokurikuler peserta didik di sini..."
                  className="w-full p-3 text-xs sm:text-sm text-slate-800 bg-white border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden leading-relaxed shadow-xs"
                />

                {/* Preset Chips */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Contoh Cepat (Klik untuk Mengisi):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {KOKURIKULER_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          updateStudentGradeField(
                            editingNoteStudent.id,
                            currentSubject.id,
                            selectedSemester,
                            "formatif",
                            "catatanP5",
                            preset.text
                          )
                        }
                        className="px-2.5 py-1 bg-slate-50 hover:bg-amber-100 hover:text-amber-900 border border-slate-200 rounded text-xs transition-colors cursor-pointer"
                        title={preset.text}
                      >
                        {preset.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        updateStudentGradeField(
                          editingNoteStudent.id,
                          currentSubject.id,
                          selectedSemester,
                          "formatif",
                          "catatanP5",
                          "Peserta didik menunjukkan semangat belajar yang baik dan aktif berkolaborasi dalam kegiatan kokurikuler."
                        )
                      }
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300 rounded text-xs flex items-center gap-1 cursor-pointer"
                      title="Kembalikan ke kalimat standar"
                    >
                      <RotateCcw className="w-3 h-3" /> Standar
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Footer with Student Navigation */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handlePrevNoteStudent}
                    disabled={studentIndex <= 0}
                    className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Sebelumnya
                  </button>
                  <button
                    type="button"
                    onClick={handleNextNoteStudent}
                    disabled={studentIndex >= filteredStudents.length - 1}
                    className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                  >
                    Berikutnya <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setEditingNoteStudent(null)}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Selesai & Simpan
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
