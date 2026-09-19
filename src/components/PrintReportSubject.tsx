import React from "react";
import { useApp } from "../context/AppContext";
import { calculateStudentGrades } from "../utils/gradeCalculations";
import { SignatureBlock } from "./SignatureBlock";
import { Printer, ArrowLeft } from "lucide-react";

export const PrintReportSubject: React.FC = () => {
  const {
    students,
    subjects,
    schoolSettings,
    selectedSubjectId,
    setSelectedSubjectId,
    selectedSemester,
    setSelectedSemester,
    getGradeRecord,
    setActiveTab
  } = useApp();

  const currentSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

  if (!currentSubject) {
    return (
      <div className="p-8 text-center bg-white rounded-xl">
        <p className="text-slate-500">Mata pelajaran tidak ditemukan.</p>
      </div>
    );
  }

  // Collect all TPs of current subject
  const allTps = currentSubject.babs.flatMap((b) => b.tps);
  const activeTpIds = allTps.map((t) => t.id);
  const activeBabIds = currentSubject.babs.map((b) => b.id);
  const totalFormatifTpCols = currentSubject.babs.reduce(
    (acc, bab) => acc + Math.max(bab.tps.length, 1),
    0
  );
  const totalFormatifCols = totalFormatifTpCols + 3; // + UH, Tugas, Proyek

  // Calculate summary averages for print footer
  const studentRecords = students.map((student) => {
    const record = getGradeRecord(student.id, currentSubject.id, selectedSemester);
    const calc = calculateStudentGrades(record, currentSubject.kktp, activeTpIds, activeBabIds);
    return { student, record, calc };
  });

  const getColAvg = (getter: (item: (typeof studentRecords)[0]) => number | null | undefined): string => {
    const vals = studentRecords
      .map(getter)
      .filter((v): v is number => typeof v === "number" && !isNaN(v));
    if (vals.length === 0) return "-";
    const sum = vals.reduce((a, b) => a + b, 0);
    return (Math.round((sum / vals.length) * 10) / 10).toString();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Control Bar (Hidden when printing) */}
      <div className="no-print print:hidden bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setActiveTab("input-nilai")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Input Nilai
          </button>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600">Mapel:</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="px-3 py-1.5 text-xs sm:text-sm font-bold border border-slate-300 rounded-lg bg-white"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.kode} - {s.nama}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600">Semester:</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value as "1" | "2")}
              className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg bg-white"
            >
              <option value="1">Semester 1 (Ganjil)</option>
              <option value="2">Semester 2 (Genap)</option>
            </select>
          </div>
        </div>

        <button
          id="btn-print-subject-report"
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
        >
          <Printer className="w-4 h-4" /> Cetak Lembar Mapel (A4/F4)
        </button>
      </div>

      {/* PRINT-READY PAPER CANVAS */}
      <div className="print-sheet bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm mx-auto overflow-x-auto print:border-none print:shadow-none print:p-0 print:m-0 print:overflow-visible print:w-full">
        {/* Formal School Header */}
        <div className="text-center mb-6 border-b-2 border-black pb-4">
          <h1 className="text-base sm:text-lg font-extrabold uppercase tracking-wide text-black">
            DAFTAR NILAI ASESMEN KURIKULUM MERDEKA
          </h1>
          <h2 className="text-sm sm:text-base font-bold uppercase text-black">
            {schoolSettings.namaSekolah}
          </h2>
          <p className="text-xs text-slate-700 mt-1">
            Kecamatan {schoolSettings.kecamatan}, Kabupaten {schoolSettings.kabupaten}, Provinsi {schoolSettings.provinsi}
          </p>

          {/* Metadata Grid */}
          <div className="mt-4 pt-3 border-t border-slate-400 grid grid-cols-2 sm:grid-cols-4 gap-2 text-left text-xs text-slate-900 font-medium">
            <div>
              <span className="text-slate-600">Mata Pelajaran:</span>{" "}
              <strong className="text-black">{currentSubject.nama} ({currentSubject.kode})</strong>
            </div>
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
            <div className="col-span-2 sm:col-span-4 text-slate-700">
              <span className="text-slate-600">Ambang Batas KKTP:</span>{" "}
              <strong className="text-black px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-bold">
                {currentSubject.kktp}
              </strong>
            </div>
          </div>
        </div>

        {/* Dense Table */}
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-center border-collapse border border-black text-[10px]">
            <thead>
              {/* Header Level 1: Kategori Utama */}
              <tr className="bg-slate-100 text-black font-bold">
                <th rowSpan={3} className="border border-black p-1 w-8">No</th>
                <th rowSpan={3} className="border border-black p-1 text-left min-w-[140px]">Nama Peserta Didik</th>
                <th rowSpan={3} className="border border-black p-1 w-7">L/P</th>

                {/* Formatif Header Level 1 */}
                <th colSpan={totalFormatifCols} className="border border-black p-1 uppercase text-[10px] bg-slate-100 font-extrabold tracking-wider">
                  Asesmen Formatif (Proses Pembelajaran)
                </th>

                {/* Sumatif Header Level 1 */}
                <th colSpan={currentSubject.babs.length + 4} className="border border-black p-1 uppercase text-[10px] bg-slate-100 font-extrabold tracking-wider">
                  Asesmen Sumatif
                </th>

                {/* Akhir */}
                <th rowSpan={3} className="border border-black p-1 w-11 bg-slate-100">N/A</th>
                <th rowSpan={3} className="border border-black p-1 min-w-[75px] bg-slate-100">Keterangan</th>
              </tr>

              {/* Header Level 2: Pengelompokan Dinamis per BAB & Jenis Tes */}
              <tr className="bg-slate-50 text-[9.5px] font-bold">
                {/* Formatif Level 2: BAB Dinamis & Pendukung */}
                {currentSubject.babs.map((bab) => {
                  const span = Math.max(bab.tps.length, 1);
                  return (
                    <th
                      key={`prt-hdr-bab-${bab.id}`}
                      colSpan={span}
                      className="border border-black p-0.5 bg-slate-50"
                      title={`${bab.nama}: ${bab.judul}`}
                    >
                      {bab.nama}
                    </th>
                  );
                })}
                <th colSpan={3} className="border border-black p-0.5 bg-slate-100">
                  Pendukung
                </th>

                {/* Sumatif Level 2 */}
                <th colSpan={currentSubject.babs.length} className="border border-black p-0.5 bg-slate-50">
                  Sumatif Lingkup Materi (BAB)
                </th>
                <th colSpan={2} className="border border-black p-0.5">
                  ASTS
                </th>
                <th colSpan={2} className="border border-black p-0.5">
                  ASAS
                </th>
              </tr>

              {/* Header Level 3: TP per BAB & Rincian Kolom */}
              <tr className="bg-slate-50 text-[9px] font-bold">
                {/* Formatif Level 3: TP Spesifik milik masing-masing BAB */}
                {currentSubject.babs.map((bab) => {
                  if (bab.tps.length === 0) {
                    return (
                      <th key={`prt-empty-tp-${bab.id}`} className="border border-black p-0.5 min-w-[26px] text-slate-400 font-normal">
                        -
                      </th>
                    );
                  }
                  return bab.tps.map((tp) => (
                    <th key={tp.id} className="border border-black p-0.5 min-w-[26px]" title={`${tp.kode}: ${tp.deskripsi}`}>
                      {tp.kode}
                    </th>
                  ));
                })}
                <th className="border border-black p-0.5 min-w-[26px]" title="Ulangan Harian">UH</th>
                <th className="border border-black p-0.5 min-w-[26px]" title="Tugas Rutin">TGS</th>
                <th className="border border-black p-0.5 min-w-[26px]" title="Praktik Proyek">PRK</th>

                {/* Sumatif BAB Sub Columns */}
                {currentSubject.babs.map((bab) => (
                  <th key={bab.id} className="border border-black p-0.5 min-w-[26px]" title={bab.judul}>
                    {bab.nama.replace("BAB ", "B.")}
                  </th>
                ))}

                {/* ASTS */}
                <th className="border border-black p-0.5 min-w-[26px]">N-Tes</th>
                <th className="border border-black p-0.5 min-w-[26px]">Tes</th>

                {/* ASAS */}
                <th className="border border-black p-0.5 min-w-[26px]">N-Tes</th>
                <th className="border border-black p-0.5 min-w-[26px]">Tes</th>
              </tr>
            </thead>

            <tbody>
              {studentRecords.map(({ student, record, calc }, idx) => {
                return (
                  <tr key={student.id} className="hover:bg-slate-50">
                    <td className="border border-black p-1 text-center font-medium">{idx + 1}</td>
                    <td className="border border-black p-1 text-left font-medium whitespace-nowrap">
                      {student.nama}
                    </td>
                    <td className="border border-black p-1 text-center">{student.jenisKelamin}</td>

                    {/* FORMATIF VALUES: Dinamis Berdasarkan Pengelompokan BAB */}
                    {currentSubject.babs.map((bab) => {
                      if (bab.tps.length === 0) {
                        return (
                          <td key={`prt-empty-val-${bab.id}`} className="border border-black p-1 text-center text-slate-400">
                            -
                          </td>
                        );
                      }
                      return bab.tps.map((tp) => {
                        const val = record?.formatif.tpScores[tp.id];
                        return (
                          <td key={tp.id} className="border border-black p-1 font-mono">
                            {val !== null && val !== undefined ? val : "-"}
                          </td>
                        );
                      });
                    })}

                    <td className="border border-black p-1 font-mono">
                      {record?.formatif.ulanganHarian ?? "-"}
                    </td>
                    <td className="border border-black p-1 font-mono">
                      {record?.formatif.tugasRutin ?? "-"}
                    </td>
                    <td className="border border-black p-1 font-mono">
                      {record?.formatif.praktikProyek ?? "-"}
                    </td>

                    {/* SUMATIF BAB VALUES */}
                    {currentSubject.babs.map((bab) => {
                      const val = record?.sumatif.babScores[bab.id];
                      return (
                        <td key={bab.id} className="border border-black p-1 font-mono font-medium">
                          {val !== null && val !== undefined ? val : "-"}
                        </td>
                      );
                    })}

                    {/* ASTS */}
                    <td className="border border-black p-1 font-mono">
                      {record?.sumatif.astsNonTes ?? "-"}
                    </td>
                    <td className="border border-black p-1 font-mono">
                      {record?.sumatif.astsTes ?? "-"}
                    </td>

                    {/* ASAS */}
                    <td className="border border-black p-1 font-mono">
                      {record?.sumatif.asasNonTes ?? "-"}
                    </td>
                    <td className="border border-black p-1 font-mono">
                      {record?.sumatif.asasTes ?? "-"}
                    </td>

                    {/* NA */}
                    <td className="border border-black p-1 font-mono font-bold bg-slate-50">
                      {calc.nilaiAkhir !== null ? calc.nilaiAkhir : "-"}
                    </td>

                    {/* KETERANGAN */}
                    <td className="border border-black p-1 font-semibold text-[9.5px]">
                      {calc.nilaiAkhir !== null ? (
                        <span className={calc.isTuntas ? "text-slate-900" : "text-rose-700 font-bold"}>
                          {calc.ketuntasan}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Official Table Footer with Column Averages */}
            <tfoot>
              <tr className="bg-slate-100 font-bold text-black border-t-2 border-black">
                <td colSpan={3} className="border border-black p-1 text-center uppercase tracking-wider text-[9.5px]">
                  Rata-Rata Kelas
                </td>

                {/* Formatif Averages per BAB & TP */}
                {currentSubject.babs.map((bab) => {
                  if (bab.tps.length === 0) {
                    return (
                      <td key={`prt-avg-empty-${bab.id}`} className="border border-black p-1 text-center font-mono">
                        -
                      </td>
                    );
                  }
                  return bab.tps.map((tp) => (
                    <td key={`prt-avg-tp-${tp.id}`} className="border border-black p-1 font-mono text-[9px]">
                      {getColAvg((item) => item.record?.formatif.tpScores[tp.id])}
                    </td>
                  ));
                })}
                <td className="border border-black p-1 font-mono text-[9px]">
                  {getColAvg((item) => item.record?.formatif.ulanganHarian)}
                </td>
                <td className="border border-black p-1 font-mono text-[9px]">
                  {getColAvg((item) => item.record?.formatif.tugasRutin)}
                </td>
                <td className="border border-black p-1 font-mono text-[9px]">
                  {getColAvg((item) => item.record?.formatif.praktikProyek)}
                </td>

                {/* Sumatif BAB Averages */}
                {currentSubject.babs.map((bab) => (
                  <td key={`prt-avg-bab-${bab.id}`} className="border border-black p-1 font-mono text-[9px]">
                    {getColAvg((item) => item.record?.sumatif.babScores[bab.id])}
                  </td>
                ))}

                {/* ASTS Averages */}
                <td className="border border-black p-1 font-mono text-[9px]">
                  {getColAvg((item) => item.record?.sumatif.astsNonTes)}
                </td>
                <td className="border border-black p-1 font-mono text-[9px]">
                  {getColAvg((item) => item.record?.sumatif.astsTes)}
                </td>

                {/* ASAS Averages */}
                <td className="border border-black p-1 font-mono text-[9px]">
                  {getColAvg((item) => item.record?.sumatif.asasNonTes)}
                </td>
                <td className="border border-black p-1 font-mono text-[9px]">
                  {getColAvg((item) => item.record?.sumatif.asasTes)}
                </td>

                {/* NA Average */}
                <td className="border border-black p-1 font-mono font-bold bg-slate-200 text-[10px]">
                  {getColAvg((item) => item.calc.nilaiAkhir)}
                </td>

                {/* Tuntas summary */}
                <td className="border border-black p-1 text-[9px]">
                  {studentRecords.filter((r) => r.calc.isTuntas).length}/{studentRecords.length} Tuntas
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Official Signature Block */}
        <SignatureBlock settings={schoolSettings} />
      </div>
    </div>
  );
};
