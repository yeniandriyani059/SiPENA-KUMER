import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { evaluateKktpInterval, safeAverage } from "../utils/gradeCalculations";
import { SignatureBlock } from "./SignatureBlock";
import {
  Printer,
  ChevronLeft,
  ChevronRight,
  User,
  BookOpen,
  Info,
  CheckCircle,
  AlertCircle,
  Edit3,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  Database
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

export const StudentKktpAnalysis: React.FC = () => {
  const {
    students,
    subjects,
    schoolSettings,
    selectedSemester,
    setSelectedSemester,
    selectedSubjectId,
    setSelectedSubjectId,
    selectedStudentId,
    setSelectedStudentId,
    getGradeRecord,
    updateStudentGradeField,
    refreshGradeRecords
  } = useApp();

  // Auto-fetch real-time grade records from Supabase on mount, semester, student, or subject change
  useEffect(() => {
    refreshGradeRecords();
  }, [selectedSemester, selectedStudentId, selectedSubjectId, refreshGradeRecords]);

  const [isEditingNote, setIsEditingNote] = useState(false);

  const currentStudent = students.find((s) => s.id === selectedStudentId) || students[0];
  const currentSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

  const currentStudentIndex = students.findIndex((s) => s.id === (currentStudent?.id || ""));

  const handlePrevStudent = () => {
    if (currentStudentIndex > 0) {
      setSelectedStudentId(students[currentStudentIndex - 1].id);
    }
  };

  const handleNextStudent = () => {
    if (currentStudentIndex < students.length - 1) {
      setSelectedStudentId(students[currentStudentIndex + 1].id);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!currentStudent || !currentSubject) {
    return (
      <div className="p-8 text-center bg-white rounded-xl">
        <p className="text-slate-500">Silakan pilih siswa dan mata pelajaran terlebih dahulu.</p>
      </div>
    );
  }

  // Get current record
  const record = getGradeRecord(currentStudent.id, currentSubject.id, selectedSemester);

  // Flatten all TPs for this subject with their BAB information
  const analysisRows: {
    no: number;
    babName: string;
    babJudul: string;
    tpKode: string;
    tpDeskripsi: string;
    score: number | null;
    kriteria: "T" | "BT" | "-";
    intervensi: string;
  }[] = [];

  let tpCounter = 1;
  currentSubject.babs.forEach((bab) => {
    bab.tps.forEach((tp) => {
      const score = record?.formatif.tpScores[tp.id] ?? null;
      const evalResult = evaluateKktpInterval(score);

      analysisRows.push({
        no: tpCounter++,
        babName: bab.nama,
        babJudul: bab.judul,
        tpKode: tp.kode,
        tpDeskripsi: tp.deskripsi,
        score,
        kriteria: evalResult ? evalResult.kriteria : "-",
        intervensi: evalResult ? evalResult.intervensi : "Belum dinilai"
      });
    });
  });

  const scoresOnly = analysisRows.map((r) => r.score).filter((s): s is number => s !== null);
  const avgTpScore = safeAverage(scoresOnly);
  const countTuntasTP = analysisRows.filter((r) => r.kriteria === "T").length;
  const totalTP = analysisRows.length;
  const percentTuntas = totalTP > 0 ? Math.round((countTuntasTP / totalTP) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Control Bar (Hidden when printing) */}
      <div className="no-print print:hidden bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-wrap items-center justify-between gap-3">
        {/* Student & Subject Selection */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Previous / Next buttons */}
          <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden">
            <button
              onClick={handlePrevStudent}
              disabled={currentStudentIndex <= 0}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed border-r border-slate-200 text-slate-700"
              title="Siswa Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextStudent}
              disabled={currentStudentIndex >= students.length - 1}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700"
              title="Siswa Selanjutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Student Selector */}
          <div className="flex items-center gap-1.5">
            <User className="w-4 h-4 text-indigo-600" />
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="px-3 py-1.5 text-xs sm:text-sm font-bold border border-slate-300 rounded-lg bg-white"
            >
              {students.map((s, idx) => (
                <option key={s.id} value={s.id}>
                  {idx + 1}. {s.nama} ({s.nisn})
                </option>
              ))}
            </select>
          </div>

          {/* Subject Selector */}
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="px-3 py-1.5 text-xs sm:text-sm font-semibold border border-slate-300 rounded-lg bg-white"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.kode} - {s.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Semester */}
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value as "1" | "2")}
            className="px-3 py-1.5 text-xs sm:text-sm font-semibold border border-slate-300 rounded-lg bg-white"
          >
            <option value="1">Semester 1 (Ganjil)</option>
            <option value="2">Semester 2 (Genap)</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Cetak Analisis KKTP Siswa
          </button>
        </div>
      </div>

      {/* PRINT-READY ANALISIS KKTP SHEET (A4 Landscape or Portrait) */}
      <div className="print-sheet bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm mx-auto max-w-5xl">
        {/* Header Kop */}
        <div className="text-center mb-6 border-b-2 border-black pb-4">
          <h1 className="text-base sm:text-lg font-extrabold uppercase tracking-wide text-black">
            LEMBAR ANALISIS KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)
          </h1>
          <h2 className="text-sm sm:text-base font-bold uppercase text-black">
            {schoolSettings.namaSekolah}
          </h2>
          <p className="text-xs text-slate-700 mt-1">
            Kecamatan {schoolSettings.kecamatan}, Kabupaten {schoolSettings.kabupaten}, Provinsi {schoolSettings.provinsi}
          </p>

          {/* Student Profile Info Grid */}
          <div className="mt-4 pt-3 border-t border-slate-400 grid grid-cols-2 sm:grid-cols-4 gap-2 text-left text-xs text-slate-900 font-medium">
            <div>
              <span className="text-slate-600">Nama Siswa:</span>{" "}
              <strong className="text-black uppercase">{currentStudent.nama}</strong>
            </div>
            <div>
              <span className="text-slate-600">NISN / No. Induk:</span>{" "}
              <strong className="text-black font-mono">{currentStudent.nisn} / {currentStudent.noInduk}</strong>
            </div>
            <div>
              <span className="text-slate-600">Kelas / Fase:</span>{" "}
              <strong className="text-black">{schoolSettings.kelas} / {schoolSettings.fase}</strong>
            </div>
            <div>
              <span className="text-slate-600">Semester / TP:</span>{" "}
              <strong className="text-black">{selectedSemester === "1" ? "1 (Ganjil)" : "2 (Genap)"} / {schoolSettings.tahunPelajaran}</strong>
            </div>

            <div>
              <span className="text-slate-600">Mata Pelajaran:</span>{" "}
              <strong className="text-black">{currentSubject.nama} ({currentSubject.kode})</strong>
            </div>
            <div>
              <span className="text-slate-600">Ambang KKTP Mapel:</span>{" "}
              <strong className="text-black px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-bold">
                {currentSubject.kktp}
              </strong>
            </div>
            <div>
              <span className="text-slate-600">Rata-Rata Formatif:</span>{" "}
              <strong className="text-indigo-900 font-bold">{avgTpScore !== null ? avgTpScore : "-"}</strong>
            </div>
            <div>
              <span className="text-slate-600">Ketuntasan TP:</span>{" "}
              <strong className="text-emerald-700 font-bold">
                {countTuntasTP} dari {totalTP} TP ({percentTuntas}%)
              </strong>
            </div>
          </div>
        </div>

        {/* Tabel Analisis TP Siswa */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-left border-collapse border border-black text-xs">
            <thead>
              <tr className="bg-slate-100 text-black font-bold">
                <th className="border border-black p-2 w-10 text-center">No</th>
                <th className="border border-black p-2 w-32">Lingkup Materi (BAB)</th>
                <th className="border border-black p-2 w-16 text-center">Kode</th>
                <th className="border border-black p-2">Tujuan Pembelajaran (TP)</th>
                <th className="border border-black p-2 w-16 text-center">Nilai</th>
                <th className="border border-black p-2 w-20 text-center">Kriteria</th>
                <th className="border border-black p-2 min-w-[200px]">Keterangan Intervensi</th>
              </tr>
            </thead>
            <tbody>
              {analysisRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="border border-black p-4 text-center text-slate-500 italic">
                    Belum ada Tujuan Pembelajaran yang dikonfigurasikan pada mata pelajaran ini.
                  </td>
                </tr>
              ) : (
                analysisRows.map((row) => (
                  <tr key={row.no} className="hover:bg-slate-50">
                    <td className="border border-black p-2 text-center font-medium">{row.no}</td>
                    <td className="border border-black p-2 font-medium text-slate-900">
                      <div className="font-bold text-[11px]">{row.babName}</div>
                      <div className="text-[10px] text-slate-600 leading-tight">{row.babJudul}</div>
                    </td>
                    <td className="border border-black p-2 text-center font-mono font-bold text-indigo-900">
                      {row.tpKode}
                    </td>
                    <td className="border border-black p-2 text-slate-800 leading-relaxed">
                      {row.tpDeskripsi}
                    </td>
                    <td className="border border-black p-2 text-center font-mono font-bold">
                      {row.score !== null ? row.score : "-"}
                    </td>
                    <td className="border border-black p-2 text-center font-bold">
                      {row.kriteria === "T" ? (
                        <span className="text-emerald-800 font-extrabold">T (Tuntas)</span>
                      ) : row.kriteria === "BT" ? (
                        <span className="text-rose-700 font-extrabold">BT (Belum)</span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="border border-black p-2 text-slate-800 font-medium">
                      {row.intervensi}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Tabel Matriks Referensi Interval KKTP (Sesuai Gambar 3 & 4) */}
        <div className="border border-black rounded-lg p-4 bg-slate-50/70 mb-6 text-xs text-slate-900">
          <div className="flex items-center gap-2 mb-2 font-bold uppercase text-[11px] text-slate-950">
            <Info className="w-3.5 h-3.5 text-indigo-700" />
            Matriks Pedoman Interval Kriteria Ketercapaian Tujuan Pembelajaran (KKTP)
          </div>
          <table className="w-full text-left border-collapse border border-black text-[11px] bg-white">
            <thead className="bg-slate-100 font-bold">
              <tr>
                <th className="border border-black p-1.5 text-center w-28">Interval Nilai</th>
                <th className="border border-black p-1.5 text-center w-24">Kriteria</th>
                <th className="border border-black p-1.5">Tindak Lanjut & Intervensi Guru</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-1.5 text-center font-mono font-semibold">0% - 40%</td>
                <td className="border border-black p-1.5 text-center font-bold text-rose-700">BT (Belum Tuntas)</td>
                <td className="border border-black p-1.5">Remedial di seluruh bagian materi Tujuan Pembelajaran.</td>
              </tr>
              <tr>
                <td className="border border-black p-1.5 text-center font-mono font-semibold">41% - 69%</td>
                <td className="border border-black p-1.5 text-center font-bold text-amber-700">BT (Belum Tuntas)</td>
                <td className="border border-black p-1.5">Remedial di bagian materi atau indikator yang diperlukan saja.</td>
              </tr>
              <tr>
                <td className="border border-black p-1.5 text-center font-mono font-semibold">70% - 85%</td>
                <td className="border border-black p-1.5 text-center font-bold text-emerald-700">T (Sudah Tuntas)</td>
                <td className="border border-black p-1.5">Sudah mencapai ketuntasan minimum, tidak perlu remedial.</td>
              </tr>
              <tr>
                <td className="border border-black p-1.5 text-center font-mono font-semibold">86% - 100%</td>
                <td className="border border-black p-1.5 text-center font-bold text-blue-700">T (Sudah Tuntas)</td>
                <td className="border border-black p-1.5">Sangat menguasai, diberikan program pengayaan atau tantangan lebih.</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Catatan Guru & Perkembangan Karakter Kokurikuler */}
        <div className="border border-black p-3.5 rounded-lg mb-6 text-xs bg-amber-50/20 print:bg-transparent">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5 print:mb-1">
            <span className="font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              CATATAN GURU / OBSERVASI KOKURIKULER:
            </span>

            {/* Screen-only Controls (Hidden during print) */}
            <div className="no-print flex items-center gap-2 text-[11px]">
              <span className="text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> Terhubung ke Form Nilai
              </span>
              <button
                type="button"
                onClick={() => setIsEditingNote(!isEditingNote)}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded font-medium shadow-2xs flex items-center gap-1 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                {isEditingNote ? "Tutup Editor" : "Edit Catatan"}
              </button>
            </div>
          </div>

          {/* Screen View: Interactive Editor (if toggled on) or Direct Preview */}
          <div className="no-print">
            {isEditingNote ? (
              <div className="space-y-2 mt-2 pt-2 border-t border-amber-200/60">
                <textarea
                  rows={3}
                  value={record?.formatif.catatanP5 ?? ""}
                  onChange={(e) =>
                    updateStudentGradeField(
                      currentStudent.id,
                      currentSubject.id,
                      selectedSemester,
                      "formatif",
                      "catatanP5",
                      e.target.value
                    )
                  }
                  placeholder="Tulis catatan observasi kokurikuler di sini (otomatis tersimpan ke Form Input Nilai)..."
                  className="w-full p-2.5 text-xs text-slate-800 bg-white border border-amber-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden leading-relaxed shadow-inner"
                />

                {/* Preset Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                  <span className="font-semibold text-slate-600 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Contoh Cepat:
                  </span>
                  {KOKURIKULER_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        updateStudentGradeField(
                          currentStudent.id,
                          currentSubject.id,
                          selectedSemester,
                          "formatif",
                          "catatanP5",
                          preset.text
                        )
                      }
                      className="px-2 py-0.5 bg-white hover:bg-amber-100 hover:text-amber-900 border border-slate-300 rounded text-[10.5px] transition-colors"
                      title={preset.text}
                    >
                      {preset.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      updateStudentGradeField(
                        currentStudent.id,
                        currentSubject.id,
                        selectedSemester,
                        "formatif",
                        "catatanP5",
                        "Peserta didik menunjukkan semangat belajar yang baik dan aktif berkolaborasi dalam kegiatan kokurikuler."
                      )
                    }
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300 rounded text-[10.5px] flex items-center gap-1"
                    title="Kembalikan ke kalimat standar"
                  >
                    <RotateCcw className="w-3 h-3" /> Standar
                  </button>
                </div>
              </div>
            ) : (
              <p
                onClick={() => setIsEditingNote(true)}
                className="mt-1 text-slate-800 italic leading-relaxed cursor-pointer hover:bg-amber-100/50 p-1.5 rounded transition-colors"
                title="Klik untuk langsung mengedit catatan"
              >
                {record?.formatif.catatanP5 ||
                  "Peserta didik menunjukkan semangat belajar yang baik dan aktif berkolaborasi dalam kegiatan kokurikuler."}
              </p>
            )}
          </div>

          {/* Print View: Official Clean Paragraph (Strictly shown on paper print) */}
          <div className="hidden print:block mt-1">
            <p className="text-black italic leading-relaxed text-[10.5px] whitespace-pre-wrap">
              {record?.formatif.catatanP5 ||
                "Peserta didik menunjukkan semangat belajar yang baik dan aktif berkolaborasi dalam kegiatan kokurikuler."}
            </p>
          </div>
        </div>

        {/* Official Signature with Orang Tua / Wali Siswa */}
        <SignatureBlock settings={schoolSettings} includeParent={true} />
      </div>
    </div>
  );
};
