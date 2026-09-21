import React from "react";
import { useApp } from "../context/AppContext";
import { calculateStudentGrades } from "../utils/gradeCalculations";
import {
  Users,
  BookOpen,
  Award,
  TrendingUp,
  FileSpreadsheet,
  Printer,
  Table,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  School
} from "lucide-react";

export const Dashboard: React.FC = () => {
  const {
    students,
    subjects,
    schoolSettings,
    selectedSemester,
    gradeRecords,
    setActiveTab,
    setSelectedSubjectId
  } = useApp();

  // Compute overall class statistics
  const totalStudents = students.length;
  const countL = students.filter((s) => s.jenisKelamin === "L").length;
  const countP = students.filter((s) => s.jenisKelamin === "P").length;

  // Compute stats per subject
  const subjectStats = subjects.map((sub) => {
    let sumScore = 0;
    let countScore = 0;
    let countTuntas = 0;

    students.forEach((student) => {
      const rec = gradeRecords.find(
        (r) => r.studentId === student.id && r.subjectId === sub.id && r.semester === selectedSemester
      );
      const res = calculateStudentGrades(rec, sub.kktp);
      if (res.nilaiAkhir !== null) {
        sumScore += res.nilaiAkhir;
        countScore++;
        if (res.isTuntas) countTuntas++;
      }
    });

    const avg = countScore > 0 ? Math.round((sumScore / countScore) * 10) / 10 : null;
    const tuntasPercent = countScore > 0 ? Math.round((countTuntas / countScore) * 100) : 0;

    return {
      subject: sub,
      avg,
      countScore,
      countTuntas,
      tuntasPercent
    };
  });

  const subjectsWithAvg = subjectStats.filter((s) => s.avg !== null);
  const classOverallAvg =
    subjectsWithAvg.length > 0
      ? Math.round(
          (subjectsWithAvg.reduce((acc, s) => acc + (s.avg || 0), 0) / subjectsWithAvg.length) * 10
        ) / 10
      : null;

  const totalFilledAssessments = subjectStats.reduce((acc, s) => acc + s.countScore, 0);
  const totalPossible = totalStudents * subjects.length;
  const progressPercent = totalPossible > 0 ? Math.round((totalFilledAssessments / totalPossible) * 100) : 0;

  const averageKktp =
    subjects.length > 0
      ? Math.round((subjects.reduce((acc, s) => acc + s.kktp, 0) / subjects.length) * 10) / 10
      : 70;

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-semibold backdrop-blur-xs">
              <School className="w-3.5 h-3.5 text-indigo-300" />
              Tahun Ajaran {schoolSettings.tahunPelajaran} • Semester {selectedSemester === "1" ? "1 (Ganjil)" : "2 (Genap)"}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              SiPENA Kurikulum Merdeka SD
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Sistem Administrasi Nilai Terpadu, Evaluasi Interval KKTP, dan Rekapitulasi Siap Cetak (Print-Ready A4/F4 Landscape) untuk {schoolSettings.namaSekolah}.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 min-w-[240px]">
            <p className="text-xs text-indigo-200 font-medium uppercase tracking-wider">Identitas Kelas</p>
            <p className="text-lg font-bold text-white mt-1">
              {schoolSettings.kelas
                ? (schoolSettings.kelas.toLowerCase().startsWith("kelas") ? schoolSettings.kelas : `Kelas ${schoolSettings.kelas}`)
                : "Kelas Belum Diatur"}
              {schoolSettings.fase ? ` (${schoolSettings.fase})` : ""}
            </p>
            <p className="text-xs text-slate-300 mt-0.5">Wali Kelas: {schoolSettings.namaGuru || "-"}</p>
            <p className="text-xs text-slate-400">NIP. {schoolSettings.nipGuru || "-"}</p>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Siswa */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Peserta Didik</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{totalStudents} <span className="text-sm font-normal text-slate-500">Siswa</span></p>
            <div className="flex gap-2 text-xs text-slate-600 mt-1 font-medium">
              <span className="text-blue-600">L: {countL}</span>
              <span>•</span>
              <span className="text-pink-600">P: {countP}</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Mata Pelajaran & KKTP */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Mata Pelajaran</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{subjects.length} <span className="text-sm font-normal text-slate-500">Mapel</span></p>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              Rata-rata Target KKTP: <span className="font-bold text-slate-800">{averageKktp}</span>
            </p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        {/* Rata-Rata Kelas */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Rata-Rata Kelas (Sem {selectedSemester})</p>
            <p className="text-2xl font-extrabold text-indigo-700 mt-1">
              {classOverallAvg !== null ? classOverallAvg : "-"}
            </p>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              Skala 0 - 100 • Akumulasi Mapel
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Progress Nilai */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Kelengkapan Nilai</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{progressPercent}%</p>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              {totalFilledAssessments} dari {totalPossible} entri
            </p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => setActiveTab("input-nilai")}
          className="p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left shadow-xs transition-all hover:border-indigo-300 group"
        >
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform mb-3">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
            1. Input Nilai Terpadu
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Isi asesmen formatif (TP, UH, tugas) dan sumatif (LM, ASTS, ASAS).
          </p>
        </button>

        <button
          onClick={() => setActiveTab("cetak-mapel")}
          className="p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left shadow-xs transition-all hover:border-indigo-300 group"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform mb-3">
            <Printer className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
            2. Cetak Lembar Mapel
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Daftar nilai formatif, sumatif, dan akhir per mapel siap cetak A4/F4.
          </p>
        </button>

        <button
          onClick={() => setActiveTab("rekap-all")}
          className="p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left shadow-xs transition-all hover:border-indigo-300 group"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform mb-3">
            <Table className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
            3. Rekap Nilai All-Mapel
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Matriks semua mapel untuk arsip rapor semester sekolah.
          </p>
        </button>

        <button
          onClick={() => setActiveTab("analisis-kktp")}
          className="p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left shadow-xs transition-all hover:border-indigo-300 group"
        >
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform mb-3">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
            4. Analisis KKTP Siswa
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Lembar interval ketercapaian TP & rekomendasi intervensi per siswa.
          </p>
        </button>
      </div>

      {/* Main Content Layout: Status per Mapel & Standar KKTP */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Status Mata Pelajaran */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Progres Penilaian Mata Pelajaran</h2>
              <p className="text-xs text-slate-500">Semester {selectedSemester === "1" ? "1 (Ganjil)" : "2 (Genap)"}</p>
            </div>
            <button
              onClick={() => setActiveTab("input-nilai")}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Lihat Semua Input →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Kode</th>
                  <th className="py-2.5 px-3">Mata Pelajaran</th>
                  <th className="py-2.5 px-3 text-center">KKTP</th>
                  <th className="py-2.5 px-3 text-center">Rata-Rata</th>
                  <th className="py-2.5 px-3 text-center">Ketuntasan</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjectStats.map((item) => (
                  <tr key={item.subject.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-indigo-700">{item.subject.kode}</td>
                    <td className="py-2.5 px-3 text-slate-800 font-medium">{item.subject.nama}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-700">{item.subject.kktp}</td>
                    <td className="py-2.5 px-3 text-center font-bold">
                      {item.avg !== null ? (
                        <span className={item.avg >= item.subject.kktp ? "text-emerald-700" : "text-rose-600"}>
                          {item.avg}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">Belum ada</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${item.tuntasPercent}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-slate-700">{item.tuntasPercent}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right space-x-1.5">
                      <button
                        onClick={() => {
                          setSelectedSubjectId(item.subject.id);
                          setActiveTab("input-nilai");
                        }}
                        className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded text-[11px] font-medium transition-colors"
                      >
                        Input
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSubjectId(item.subject.id);
                          setActiveTab("cetak-mapel");
                        }}
                        className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[11px] font-medium transition-colors"
                      >
                        Cetak
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Standard Interval KKTP Guide */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center gap-2 mb-3">
              <HelpCircle className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Pedoman Interval KKTP</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Berdasarkan Panduan Pembelajaran & Asesmen Kurikulum Merdeka Kemendikbudristek:
            </p>

            <div className="space-y-2.5">
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs">
                <div className="flex items-center justify-between font-bold text-rose-800">
                  <span>Interval: 0% - 40%</span>
                  <span className="px-1.5 py-0.5 bg-rose-200 rounded text-[10px]">BT</span>
                </div>
                <p className="text-rose-700 mt-1 font-medium text-[11px]">
                  Intervensi: Remedial di seluruh bagian materi.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs">
                <div className="flex items-center justify-between font-bold text-amber-800">
                  <span>Interval: 41% - 69%</span>
                  <span className="px-1.5 py-0.5 bg-amber-200 rounded text-[10px]">BT</span>
                </div>
                <p className="text-amber-700 mt-1 font-medium text-[11px]">
                  Intervensi: Remedial di bagian yang diperlukan.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
                <div className="flex items-center justify-between font-bold text-emerald-800">
                  <span>Interval: 70% - 85%</span>
                  <span className="px-1.5 py-0.5 bg-emerald-200 rounded text-[10px]">T</span>
                </div>
                <p className="text-emerald-700 mt-1 font-medium text-[11px]">
                  Intervensi: Sudah tuntas, tidak perlu remedial.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-xs">
                <div className="flex items-center justify-between font-bold text-blue-800">
                  <span>Interval: 86% - 100%</span>
                  <span className="px-1.5 py-0.5 bg-blue-200 rounded text-[10px]">T</span>
                </div>
                <p className="text-blue-700 mt-1 font-medium text-[11px]">
                  Intervensi: Sudah tuntas, diberikan pengayaan atau tantangan lebih.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Tip Card */}
          <div className="bg-indigo-900 text-white rounded-xl p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-amber-300" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-200">Tips Cetak Rapi</h4>
            </div>
            <p className="text-xs text-indigo-100 leading-relaxed">
              Semua lembar nilai telah dioptimalkan untuk ukuran kertas <strong>A4 / F4 (Landscape)</strong>. Gunakan opsi <em>"Fit to page width"</em> atau skala 90-100% di dialog cetak browser untuk hasil terbaik tanpa potongan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
