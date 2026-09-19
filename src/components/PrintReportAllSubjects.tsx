import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { calculateStudentGrades, safeAverage } from "../utils/gradeCalculations";
import { SignatureBlock } from "./SignatureBlock";
import { RekapMode, RekapTesVariant } from "../types";
import {
  Printer,
  Download,
  FileSpreadsheet,
  Award,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Users,
  Info,
  Layers
} from "lucide-react";

export const PrintReportAllSubjects: React.FC = () => {
  const {
    students,
    subjects,
    schoolSettings,
    selectedSemester,
    setSelectedSemester,
    getGradeRecord,
    rekapMode,
    setRekapMode,
    rekapTesVariant,
    setRekapTesVariant
  } = useApp();

  const [includeParentSignature, setIncludeParentSignature] = useState<boolean>(true);

  const handlePrint = () => {
    window.print();
  };

  const isPureTestMode = rekapMode === "rekap-asts" || rekapMode === "rekap-asas";

  // Precompute matrices of scores for all students and subjects based on active rekapMode and rekapTesVariant
  const rawStudentRows = students.map((student, sIdx) => {
    const mapelScores: Record<string, number | null> = {};
    const originalScores: Record<string, number | null> = {};
    let sum = 0;
    let count = 0;

    subjects.forEach((sub) => {
      const rec = getGradeRecord(student.id, sub.id, selectedSemester);
      let score: number | null = null;
      let origScore: number | null = null;

      if (rekapMode === "rekap-asts") {
        origScore = rec?.sumatif.astsTes ?? null;
        if (rekapTesVariant === "remedial" && origScore !== null && origScore < sub.kktp) {
          score = rec?.sumatif.astsTesRemedial ?? sub.kktp;
        } else {
          score = origScore;
        }
      } else if (rekapMode === "rekap-asas") {
        origScore = rec?.sumatif.asasTes ?? null;
        if (rekapTesVariant === "remedial" && origScore !== null && origScore < sub.kktp) {
          score = rec?.sumatif.asasTesRemedial ?? sub.kktp;
        } else {
          score = origScore;
        }
      } else {
        // rekap-akhir: Nilai Akhir Gabungan Formatif + Sumatif
        const subTpIds = sub.babs.flatMap((b) => b.tps).map((t) => t.id);
        const subBabIds = sub.babs.map((b) => b.id);
        const calc = calculateStudentGrades(rec, sub.kktp, subTpIds, subBabIds);
        score = calc.nilaiAkhir;
        origScore = score;
      }

      mapelScores[sub.id] = score;
      originalScores[sub.id] = origScore;
      if (score !== null && score !== undefined) {
        sum += score;
        count++;
      }
    });

    const average = count > 0 ? Math.round((sum / count) * 10) / 10 : null;
    const roundedSum = count > 0 ? Math.round(sum * 10) / 10 : null;

    // Check overall tuntas: tuntas if all subjects with scores meet their kktp
    let hasFailure = false;
    subjects.forEach((sub) => {
      const s = mapelScores[sub.id];
      if (s !== null && s !== undefined && s < sub.kktp) {
        hasFailure = true;
      }
    });
    const statusKetuntasan = count > 0 ? (hasFailure ? "BELUM TUNTAS" : "TUNTAS") : "-";

    return {
      index: sIdx + 1,
      student,
      mapelScores,
      originalScores,
      sum: roundedSum,
      average,
      statusKetuntasan,
      count
    };
  });

  // Calculate Ranking (Peringkat) for each student based on Average & Sum descending
  const studentRows = rawStudentRows.map((row) => {
    if (row.average === null) {
      return { ...row, rank: null };
    }
    const higherCount = rawStudentRows.filter(
      (other) =>
        other.average !== null &&
        (other.average > row.average! ||
          (other.average === row.average! && (other.sum ?? 0) > (row.sum ?? 0)))
    ).length;
    return {
      ...row,
      rank: higherCount + 1
    };
  });

  // Calculate subject-level class statistics (Bottom rows)
  const subjectSums: Record<string, number | null> = {};
  const subjectAvgs: Record<string, number | null> = {};
  const subjectMaxs: Record<string, number | null> = {};
  const subjectMins: Record<string, number | null> = {};

  subjects.forEach((sub) => {
    const scores = studentRows
      .map((r) => r.mapelScores[sub.id])
      .filter((s): s is number => s !== null && s !== undefined);

    if (scores.length > 0) {
      const sum = Math.round(scores.reduce((a, b) => a + b, 0) * 10) / 10;
      subjectSums[sub.id] = sum;
      subjectAvgs[sub.id] = safeAverage(scores);
      subjectMaxs[sub.id] = Math.max(...scores);
      subjectMins[sub.id] = Math.min(...scores);
    } else {
      subjectSums[sub.id] = null;
      subjectAvgs[sub.id] = null;
      subjectMaxs[sub.id] = null;
      subjectMins[sub.id] = null;
    }
  });

  // Dynamic Titles & Subtitles based on user requirements
  const getHeaderTitle = () => {
    if (rekapMode === "rekap-asts") {
      return "REKAPITULASI HASIL TES MURNI ASTS (ASESMEN SUMATIF TENGAH SEMESTER)";
    }
    if (rekapMode === "rekap-asas") {
      return "REKAPITULASI HASIL TES MURNI ASAS (ASESMEN SUMATIF AKHIR SEMESTER)";
    }
    return "REKAPITULASI NILAI AKHIR SEMESTER";
  };

  const getSubHeaderTitle = () => {
    if (isPureTestMode) {
      if (rekapTesVariant === "remedial") {
        return "(Daftar Hasil Ujian/Tes Tertulis Peserta Didik Setelah Remedial)";
      }
      return "(Daftar Nilai Murni Hasil Ujian/Tes Tertulis Peserta Didik)";
    }
    return "(Daftar Nilai Akhir Rapor Peserta Didik - Gabungan Formatif & Sumatif)";
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      "No",
      "No. Induk",
      "NISN",
      "Nama Siswa",
      "L/P",
      ...subjects.map((s) => `${s.kode} (KKTP ${s.kktp})`),
      isPureTestMode ? "Jumlah Tes" : "Jumlah",
      isPureTestMode ? "Rata-Rata Tes" : "Rata-Rata",
      "Peringkat",
      "Keterangan"
    ];

    const rows = studentRows.map((r) => [
      r.index,
      `"${r.student.noInduk}"`,
      `"${r.student.nisn}"`,
      `"${r.student.nama}"`,
      r.student.jenisKelamin,
      ...subjects.map((s) => r.mapelScores[s.id] ?? ""),
      r.sum ?? "",
      r.average ?? "",
      r.rank ?? "",
      r.statusKetuntasan
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);

    const modePrefix =
      rekapMode === "rekap-asts"
        ? `Rekap_Hasil_Tes_Murni_ASTS_${rekapTesVariant === "remedial" ? "Setelah_Remedial" : "Asli"}`
        : rekapMode === "rekap-asas"
        ? `Rekap_Hasil_Tes_Murni_ASAS_${rekapTesVariant === "remedial" ? "Setelah_Remedial" : "Asli"}`
        : "Rekap_Nilai_All_Mapel";

    link.setAttribute(
      "download",
      `${modePrefix}_${schoolSettings.namaSekolah.replace(/\s+/g, "_")}_Sem${selectedSemester}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const countTuntas = studentRows.filter((r) => r.statusKetuntasan === "TUNTAS").length;
  const countBelumTuntas = studentRows.filter((r) => r.statusKetuntasan === "BELUM TUNTAS").length;

  return (
    <div className="space-y-4">
      {/* Action Toolbar (no-print) */}
      <div className="no-print print:hidden bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
        {/* Row 1: Selectors (Dropdown Rekap, Semester, & Variant) */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Main Mode Dropdown */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="select-rekap-mode" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                Pilihan Jenis Rekap:
              </label>
              <select
                id="select-rekap-mode"
                value={rekapMode}
                onChange={(e) => setRekapMode(e.target.value as RekapMode)}
                className="px-3 py-1.5 text-xs sm:text-sm font-bold border-2 border-indigo-500 rounded-lg bg-indigo-50/60 text-indigo-950 focus:ring-2 focus:ring-indigo-500 outline-hidden shadow-2xs"
              >
                <option value="rekap-akhir">📋 Rekap Nilai Akhir Rapor (Semua Komponen)</option>
                <option value="rekap-asts">🎯 Hasil Tes Murni ASTS</option>
                <option value="rekap-asas">🏆 Hasil Tes Murni ASAS</option>
              </select>
            </div>

            {/* Semester Switcher */}
            <div className="flex items-center gap-2">
              <label htmlFor="select-rekap-semester" className="text-xs font-semibold text-slate-600">Semester:</label>
              <select
                id="select-rekap-semester"
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value as "1" | "2")}
                className="px-3 py-1.5 text-xs sm:text-sm font-semibold border border-slate-300 rounded-lg bg-white text-slate-800"
              >
                <option value="1">Semester 1 (Ganjil)</option>
                <option value="2">Semester 2 (Genap)</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs sm:text-sm font-medium transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-600" /> Ekspor Excel/CSV
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              {isPureTestMode ? "Cetak Rekap Hasil Tes" : "Cetak Rekap All-Mapel"}
            </button>
          </div>
        </div>

        {/* Row 2: Sub-controls for Pure Test Mode (ASTS / ASAS) */}
        {isPureTestMode && (
          <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold text-amber-950 flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-amber-700" /> Opsi Tampilan Hasil Tes:
              </span>

              {/* Toggle Switch / Dropdown for Nilai Tes Asli vs Setelah Remedial */}
              <div className="inline-flex rounded-lg p-1 bg-white border border-amber-300 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setRekapTesVariant("asli")}
                  className={`px-3 py-1.5 rounded-md font-bold transition-all text-xs flex items-center gap-1.5 cursor-pointer ${
                    rekapTesVariant === "asli"
                      ? "bg-amber-600 text-white shadow-xs"
                      : "text-slate-700 hover:text-amber-900 hover:bg-amber-100/50"
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Tampilkan Nilai Tes Asli (Sebelum Remedial)
                </button>
                <button
                  type="button"
                  onClick={() => setRekapTesVariant("remedial")}
                  className={`px-3 py-1.5 rounded-md font-bold transition-all text-xs flex items-center gap-1.5 cursor-pointer ${
                    rekapTesVariant === "remedial"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-700 hover:text-emerald-900 hover:bg-emerald-100/50"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Tampilkan Nilai Tes Akhir (Setelah Remedial)
                </button>
              </div>
            </div>

            {/* Signature option toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={includeParentSignature}
                onChange={(e) => setIncludeParentSignature(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              <span>Sertakan Kolom Tanda Tangan Orang Tua / Wali</span>
            </label>
          </div>
        )}

        {/* Info Banner for Test Mode */}
        {isPureTestMode ? (
          <div className="flex items-start gap-2 text-[11.5px] text-amber-900/90 bg-amber-50/40 p-2 rounded-md border border-amber-200/50">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              {rekapTesVariant === "asli" ? (
                <span>
                  <strong>Mode Nilai Tes Asli:</strong> Menarik angka murni dari kolom{" "}
                  <strong>"Tes" (Tes Tertulis)</strong> bagian {rekapMode === "rekap-asts" ? "ASTS" : "ASAS"} dari Form
                  Input Nilai tiap mapel sebelum remedial. Nilai di bawah KKTP ditandai warna merah agar Orang Tua dapat
                  melihat capaian riil ujian pertama anak secara transparan.
                </span>
              ) : (
                <span>
                  <strong>Mode Nilai Tes Akhir:</strong> Menampilkan hasil evaluasi setelah pendampingan program remedial.
                  Bagi siswa yang semula di bawah KKTP, nilai disesuaikan dengan standar ketuntasan KKTP mapel.
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 text-xs text-slate-600 pt-1">
            <span>
              Total Siswa: <strong>{students.length}</strong>
            </span>
            <span>•</span>
            <span>
              Tuntas Seluruh Mapel: <strong className="text-emerald-600">{countTuntas} Siswa</strong>
            </span>
            <span>•</span>
            <span>
              Perlu Bimbingan: <strong className="text-rose-600">{countBelumTuntas} Siswa</strong>
            </span>
          </div>
        )}
      </div>

      {/* PRINT-READY ALL-SUBJECT MATRIX SHEET */}
      <div className="print-sheet bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm mx-auto overflow-x-auto">
        {/* Header Kop Rekapitulasi */}
        <div className="text-center mb-5 border-b-2 border-black pb-4">
          <h1 className="text-base sm:text-lg font-extrabold uppercase tracking-wider text-black">
            {getHeaderTitle()}
          </h1>
          <p className="text-xs sm:text-sm font-semibold italic text-slate-800 mt-0.5">
            {getSubHeaderTitle()}
          </p>
          <h2 className="text-sm sm:text-base font-bold uppercase text-black mt-1">
            {schoolSettings.namaSekolah}
          </h2>
          <p className="text-xs text-slate-700 mt-0.5">
            Kecamatan {schoolSettings.kecamatan}, Kabupaten {schoolSettings.kabupaten}, Provinsi {schoolSettings.provinsi}
          </p>

          <div className="mt-3.5 pt-2.5 border-t border-slate-400 grid grid-cols-2 sm:grid-cols-4 gap-2 text-left text-xs text-slate-900 font-medium">
            <div>
              <span className="text-slate-600">Kelas / Fase:</span>{" "}
              <strong className="text-black">{schoolSettings.kelas} / {schoolSettings.fase}</strong>
            </div>
            <div>
              <span className="text-slate-600">Semester:</span>{" "}
              <strong className="text-black">{selectedSemester === "1" ? "1 (Ganjil)" : "2 (Genap)"}</strong>
            </div>
            <div>
              <span className="text-slate-600">Tahun Pelajaran:</span>{" "}
              <strong className="text-black">{schoolSettings.tahunPelajaran}</strong>
            </div>
            <div>
              <span className="text-slate-600">
                {isPureTestMode ? "Status Asesmen:" : "Jumlah Siswa:"}
              </span>{" "}
              <strong className="text-black">
                {isPureTestMode
                  ? rekapTesVariant === "asli"
                    ? "Tes Murni Asli (Pra-Remedial)"
                    : "Tes Akhir (Pasca-Remedial)"
                  : `${students.length} Peserta Didik`}
              </strong>
            </div>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse border border-black text-[11px]">
            <thead>
              {/* Row 1: Subject Names */}
              <tr className="bg-slate-100 text-black font-bold">
                <th rowSpan={2} className="border border-black p-1.5 w-8">No</th>
                <th rowSpan={2} className="border border-black p-1.5 w-16">No. Induk</th>
                <th rowSpan={2} className="border border-black p-1.5 w-24">NISN</th>
                <th rowSpan={2} className="border border-black p-1.5 text-left min-w-[150px]">
                  Nama Peserta Didik
                </th>
                <th rowSpan={2} className="border border-black p-1.5 w-8">L/P</th>

                {/* All Subjects Columns */}
                {subjects.map((sub) => (
                  <th
                    key={sub.id}
                    className="border border-black p-1 min-w-[42px] max-w-[55px] uppercase font-bold"
                    title={sub.nama}
                  >
                    {sub.kode}
                  </th>
                ))}

                {/* Summaries & Rankings */}
                <th rowSpan={2} className="border border-black p-1.5 w-14 bg-slate-100 font-bold" title={isPureTestMode ? "Jumlah Nilai Tes Murni" : "Jumlah Nilai Akhir"}>
                  {isPureTestMode ? "JML TES" : "JML"}
                </th>
                <th rowSpan={2} className="border border-black p-1.5 w-14 bg-slate-100 font-bold" title={isPureTestMode ? "Rata-Rata Nilai Tes Murni" : "Rata-Rata Nilai Akhir"}>
                  RATA²
                </th>
                <th rowSpan={2} className="border border-black p-1.5 w-14 bg-indigo-50/80 text-indigo-950 font-extrabold" title="Peringkat Berdasarkan Capaian Nilai">
                  {isPureTestMode ? "PRGKT" : "PRGKT"}
                </th>
                <th rowSpan={2} className="border border-black p-1.5 min-w-[75px] bg-slate-100 font-bold">
                  KET.
                </th>
              </tr>

              {/* Row 2: KKTP per Subject */}
              <tr className="bg-slate-50 text-[10px] text-slate-800 font-semibold">
                {subjects.map((sub) => (
                  <th key={`kktp-${sub.id}`} className="border border-black p-0.5 text-slate-700 bg-amber-50/70 font-bold">
                    [{sub.kktp}]
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {studentRows.map((row) => (
                <tr key={row.student.id} className="hover:bg-slate-50">
                  <td className="border border-black p-1 text-center font-medium">{row.index}</td>
                  <td className="border border-black p-1 font-mono">{row.student.noInduk}</td>
                  <td className="border border-black p-1 font-mono">{row.student.nisn}</td>
                  <td className="border border-black p-1 text-left font-medium whitespace-nowrap">
                    {row.student.nama}
                  </td>
                  <td className="border border-black p-1 text-center">{row.student.jenisKelamin}</td>

                  {/* Subject Scores */}
                  {subjects.map((sub) => {
                    const score = row.mapelScores[sub.id];
                    const origScore = row.originalScores[sub.id];
                    const isBelowKktp = score !== null && score !== undefined && score < sub.kktp;
                    const wasRemediated =
                      isPureTestMode &&
                      rekapTesVariant === "remedial" &&
                      origScore !== null &&
                      origScore < sub.kktp;

                    return (
                      <td
                        key={sub.id}
                        className={`border border-black p-1 font-mono ${
                          isBelowKktp
                            ? "text-rose-700 font-bold bg-rose-50/80"
                            : wasRemediated
                            ? "text-emerald-800 font-bold bg-emerald-50/70"
                            : ""
                        }`}
                        title={
                          wasRemediated
                            ? `Nilai tes asli: ${origScore} (Tuntas setelah remedial mencapai KKTP ${sub.kktp})`
                            : isBelowKktp
                            ? `Belum tuntas KKTP (${sub.kktp})`
                            : undefined
                        }
                      >
                        {score !== null && score !== undefined ? score : "-"}
                      </td>
                    );
                  })}

                  {/* Total & Average */}
                  <td className="border border-black p-1 font-mono font-semibold bg-slate-50">
                    {row.sum !== null ? row.sum : "-"}
                  </td>
                  <td className="border border-black p-1 font-mono font-bold bg-slate-50">
                    {row.average !== null ? row.average : "-"}
                  </td>

                  {/* Peringkat (Ranking) */}
                  <td className="border border-black p-1 font-mono font-bold text-center bg-indigo-50/40 text-indigo-950">
                    {row.rank !== null ? (
                      <span className="inline-flex items-center justify-center">
                        {row.rank === 1 && <span className="no-print mr-0.5">🥇</span>}
                        {row.rank === 2 && <span className="no-print mr-0.5">🥈</span>}
                        {row.rank === 3 && <span className="no-print mr-0.5">🥉</span>}
                        <span>{row.rank}</span>
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>

                  {/* Keterangan Ketuntasan */}
                  <td className="border border-black p-1 text-[10px] font-semibold">
                    <span className={row.statusKetuntasan === "TUNTAS" ? "text-slate-900" : "text-rose-700 font-bold"}>
                      {row.statusKetuntasan}
                    </span>
                  </td>
                </tr>
              ))}

              {/* Bottom Summary Rows */}
              <tr className="bg-slate-100 font-bold text-slate-900">
                <td colSpan={5} className="border border-black p-1.5 text-right font-bold uppercase">
                  Jumlah Nilai
                </td>
                {subjects.map((sub) => (
                  <td key={`sum-${sub.id}`} className="border border-black p-1 font-mono">
                    {subjectSums[sub.id] ?? "-"}
                  </td>
                ))}
                <td colSpan={4} className="border border-black p-1 bg-slate-200"></td>
              </tr>

              <tr className="bg-slate-100 font-bold text-slate-900">
                <td colSpan={5} className="border border-black p-1.5 text-right font-bold uppercase">
                  Rata-Rata Kelas
                </td>
                {subjects.map((sub) => (
                  <td key={`avg-${sub.id}`} className="border border-black p-1 font-mono font-bold text-indigo-900">
                    {subjectAvgs[sub.id] ?? "-"}
                  </td>
                ))}
                <td colSpan={4} className="border border-black p-1 bg-slate-200"></td>
              </tr>

              <tr className="bg-slate-50 text-slate-800">
                <td colSpan={5} className="border border-black p-1 text-right font-semibold uppercase">
                  Nilai Tertinggi
                </td>
                {subjects.map((sub) => (
                  <td key={`max-${sub.id}`} className="border border-black p-1 font-mono">
                    {subjectMaxs[sub.id] ?? "-"}
                  </td>
                ))}
                <td colSpan={4} className="border border-black p-1 bg-slate-100"></td>
              </tr>

              <tr className="bg-slate-50 text-slate-800">
                <td colSpan={5} className="border border-black p-1 text-right font-semibold uppercase">
                  Nilai Terendah
                </td>
                {subjects.map((sub) => (
                  <td key={`min-${sub.id}`} className="border border-black p-1 font-mono">
                    {subjectMins[sub.id] ?? "-"}
                  </td>
                ))}
                <td colSpan={4} className="border border-black p-1 bg-slate-100"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footnotes as explicitly requested by user */}
        <div className="mt-3.5 space-y-1 text-[10px] text-slate-700">
          {isPureTestMode ? (
            rekapTesVariant === "asli" ? (
              <p className="italic font-medium text-slate-900">
                * Nilai yang tercantum merupakan hasil asesmen tes murni peserta didik.
              </p>
            ) : (
              <p className="italic font-medium text-slate-900">
                * Nilai yang tercantum merupakan hasil evaluasi tes setelah pelaksanaan program pendampingan remedial bagi peserta didik yang belum mencapai KKTP.
              </p>
            )
          ) : (
            <p className="italic font-medium text-slate-900">
              * Nilai yang tercantum merupakan Nilai Akhir (NA) Rapor perpaduan asesmen formatif dan asesmen sumatif Kurikulum Merdeka.
            </p>
          )}
          <div className="flex flex-wrap justify-between gap-2 text-slate-600">
            <p>* Angka dalam tanda kurung siku [ ... ] adalah ambang batas target Kriteria Ketercapaian Tujuan Pembelajaran (KKTP) mata pelajaran.</p>
            <p>
              {isPureTestMode
                ? "Format Rekapitulasi Resmi Hasil Ujian Tertulis untuk Penyampaian kepada Orang Tua / Wali Murid."
                : "Format standar Rekapitulasi Rapor Siswa Kurikulum Merdeka Sekolah Dasar."}
            </p>
          </div>
        </div>

        {/* Official Signature */}
        <SignatureBlock
          settings={schoolSettings}
          includeParent={isPureTestMode ? includeParentSignature : false}
        />
      </div>
    </div>
  );
};
