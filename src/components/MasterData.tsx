import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { Student, Subject, Bab, TujuanPembelajaran } from "../types";
import {
  School,
  Users,
  BookOpen,
  ListTree,
  Plus,
  Trash2,
  Edit2,
  Save,
  Check,
  X,
  AlertTriangle,
  Loader2
} from "lucide-react";

export const MasterData: React.FC = () => {
  const {
    schoolSettings,
    updateSchoolSettings,
    students,
    addStudent,
    updateStudent,
    deleteStudent,
    subjects,
    addSubject,
    updateSubject,
    deleteSubject,
    addBab,
    updateBab,
    deleteBab,
    addTp,
    updateTp,
    deleteTp
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<"sekolah" | "siswa" | "mapel" | "bab-tp">("sekolah");

  // Form states for School Settings
  const [schoolForm, setSchoolForm] = useState(schoolSettings);
  const [schoolSavedNotice, setSchoolSavedNotice] = useState(false);
  const [isSavingSchool, setIsSavingSchool] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Synchronize schoolForm whenever schoolSettings is fetched from Supabase on load
  useEffect(() => {
    setSchoolForm(schoolSettings);
  }, [schoolSettings]);

  // Student CRUD states
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [studentForm, setStudentForm] = useState<{ noInduk: string; nisn: string; nama: string; jenisKelamin: "L" | "P" }>({
    noInduk: "",
    nisn: "",
    nama: "",
    jenisKelamin: "L"
  });

  // Subject CRUD states
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [subjectForm, setSubjectForm] = useState<{ kode: string; nama: string; kktp: number }>({
    kode: "",
    nama: "",
    kktp: 70
  });

  // BAB & TP states
  const [selectedSubjectForBab, setSelectedSubjectForBab] = useState<string>(subjects[0]?.id || "");
  const [newBabName, setNewBabName] = useState("");
  const [newBabJudul, setNewBabJudul] = useState("");
  const [isAddingBab, setIsAddingBab] = useState(false);

  useEffect(() => {
    if (subjects.length > 0 && (!selectedSubjectForBab || !subjects.some((s) => s.id === selectedSubjectForBab))) {
      setSelectedSubjectForBab(subjects[0].id);
    }
  }, [subjects, selectedSubjectForBab]);

  // TP Form states
  const [activeBabForTp, setActiveBabForTp] = useState<string | null>(null);
  const [tpKode, setTpKode] = useState("TP 1");
  const [tpDeskripsi, setTpDeskripsi] = useState("");

  const handleSaveSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSchool(true);
    try {
      await updateSchoolSettings(schoolForm);
      setToastMessage("Pengaturan Identitas Sekolah Berhasil Disimpan!");
      setSchoolSavedNotice(true);
      setTimeout(() => {
        setSchoolSavedNotice(false);
        setToastMessage(null);
      }, 4000);
    } catch (err) {
      console.warn("Save school settings error:", err);
      setToastMessage("Pengaturan tersimpan di memori lokal.");
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsSavingSchool(false);
    }
  };

  // Student Handlers
  const handleSaveNewStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.nama.trim()) return;
    addStudent({
      noInduk: studentForm.noInduk.trim() || `${2100 + students.length + 1}`,
      nisn: studentForm.nisn.trim() || `013${Date.now().toString().slice(-7)}`,
      nama: studentForm.nama.trim(),
      jenisKelamin: studentForm.jenisKelamin
    });
    setStudentForm({ noInduk: "", nisn: "", nama: "", jenisKelamin: "L" });
    setIsAddingStudent(false);
  };

  const handleUpdateStudent = (id: string) => {
    updateStudent(id, studentForm);
    setEditingStudentId(null);
  };

  // Subject Handlers
  const handleSaveNewSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectForm.nama.trim()) return;
    addSubject({
      kode: subjectForm.kode.trim().toUpperCase() || "MPL",
      nama: subjectForm.nama.trim(),
      kktp: Number(subjectForm.kktp) || 70,
      babs: []
    });
    setSubjectForm({ kode: "", nama: "", kktp: 70 });
    setIsAddingSubject(false);
  };

  // Selected subject for BAB
  const activeSubjectObj = subjects.find((s) => s.id === selectedSubjectForBab) || subjects[0];

  return (
    <div className="space-y-6">
      {/* Sub-Tab Navigation Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveSubTab("sekolah")}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeSubTab === "sekolah"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <School className="w-4 h-4" />
            1. Data Sekolah & Guru
          </button>

          <button
            onClick={() => setActiveSubTab("siswa")}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeSubTab === "siswa"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Users className="w-4 h-4" />
            2. Master Siswa ({students.length})
          </button>

          <button
            onClick={() => setActiveSubTab("mapel")}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeSubTab === "mapel"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            3. Mata Pelajaran & KKTP ({subjects.length})
          </button>

          <button
            onClick={() => setActiveSubTab("bab-tp")}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeSubTab === "bab-tp"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <ListTree className="w-4 h-4" />
            4. Master BAB & TP
          </button>
        </div>
      </div>

      {/* TAB 1: DATA SEKOLAH & KELAS */}
      {activeSubTab === "sekolah" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Identitas Sekolah, Kelas & Pejabat Penandatangan</h2>
              <p className="text-xs text-slate-500">Data ini akan dicetak otomatis pada setiap kop laporan dan lembar penilaian.</p>
            </div>
            {schoolSavedNotice && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200">
                <Check className="w-3.5 h-3.5" /> Pengaturan Tersimpan!
              </span>
            )}
          </div>

          <form onSubmit={handleSaveSchool} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Nama Sekolah */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Sekolah</label>
                <input
                  type="text"
                  value={schoolForm.namaSekolah}
                  onChange={(e) => setSchoolForm({ ...schoolForm, namaSekolah: e.target.value })}
                  placeholder="SDN KARANGGINTUNG 06"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                />
              </div>

              {/* NPSN */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">NPSN</label>
                <input
                  type="text"
                  value={schoolForm.npsn || ""}
                  onChange={(e) => setSchoolForm({ ...schoolForm, npsn: e.target.value })}
                  placeholder="20302145"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Alamat */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Sekolah</label>
                <input
                  type="text"
                  value={schoolForm.alamat || ""}
                  onChange={(e) => setSchoolForm({ ...schoolForm, alamat: e.target.value })}
                  placeholder="Jl. Pendidikan No. 6"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Kecamatan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kecamatan</label>
                <input
                  type="text"
                  value={schoolForm.kecamatan}
                  onChange={(e) => setSchoolForm({ ...schoolForm, kecamatan: e.target.value })}
                  placeholder="Sumbang"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                />
              </div>

              {/* Kabupaten */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kabupaten / Kota</label>
                <input
                  type="text"
                  value={schoolForm.kabupaten}
                  onChange={(e) => setSchoolForm({ ...schoolForm, kabupaten: e.target.value })}
                  placeholder="Banyumas"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                />
              </div>

              {/* Provinsi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Provinsi</label>
                <input
                  type="text"
                  value={schoolForm.provinsi}
                  onChange={(e) => setSchoolForm({ ...schoolForm, provinsi: e.target.value })}
                  placeholder="Jawa Tengah"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                />
              </div>

              {/* Kelas */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tingkat Kelas</label>
                <input
                  type="text"
                  value={schoolForm.kelas}
                  onChange={(e) => setSchoolForm({ ...schoolForm, kelas: e.target.value })}
                  placeholder="IV (Empat)"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                />
              </div>

              {/* Fase */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fase Kurikulum</label>
                <select
                  value={schoolForm.fase}
                  onChange={(e) => setSchoolForm({ ...schoolForm, fase: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="Fase A">Fase A (Kelas 1 - 2)</option>
                  <option value="Fase B">Fase B (Kelas 3 - 4)</option>
                  <option value="Fase C">Fase C (Kelas 5 - 6)</option>
                </select>
              </div>

              {/* Tahun Pelajaran */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tahun Pelajaran</label>
                <input
                  type="text"
                  value={schoolForm.tahunPelajaran}
                  onChange={(e) => setSchoolForm({ ...schoolForm, tahunPelajaran: e.target.value })}
                  placeholder="2025/2026"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                />
              </div>

              {/* Nama Guru */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Guru Kelas / Penilai</label>
                <input
                  type="text"
                  value={schoolForm.namaGuru}
                  onChange={(e) => setSchoolForm({ ...schoolForm, namaGuru: e.target.value })}
                  placeholder="Siti Rahmawati, S.Pd.SD"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                />
              </div>

              {/* NIP Guru */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">NIP Guru Kelas</label>
                <input
                  type="text"
                  value={schoolForm.nipGuru}
                  onChange={(e) => setSchoolForm({ ...schoolForm, nipGuru: e.target.value })}
                  placeholder="19880412 201101 2 015"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Nama Kepala Sekolah */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Kepala Sekolah</label>
                <input
                  type="text"
                  value={schoolForm.namaKepsek}
                  onChange={(e) => setSchoolForm({ ...schoolForm, namaKepsek: e.target.value })}
                  placeholder="Drs. H. Bambang Subagyo, M.Pd."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                />
              </div>

              {/* NIP Kepsek */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">NIP Kepala Sekolah</label>
                <input
                  type="text"
                  value={schoolForm.nipKepsek}
                  onChange={(e) => setSchoolForm({ ...schoolForm, nipKepsek: e.target.value })}
                  placeholder="19720315 199703 1 004"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Titimangsa Tempat */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tempat Titimangsa Tanda Tangan</label>
                <input
                  type="text"
                  value={schoolForm.titimangsa}
                  onChange={(e) => setSchoolForm({ ...schoolForm, titimangsa: e.target.value })}
                  placeholder="Karanggintung"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                />
              </div>

              {/* Tanggal Cetak */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Cetak Rapor / Laporan</label>
                <input
                  type="text"
                  value={schoolForm.tanggalCetak}
                  onChange={(e) => setSchoolForm({ ...schoolForm, tanggalCetak: e.target.value })}
                  placeholder="20 Desember 2025"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isSavingSchool}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {isSavingSchool ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan Pengaturan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Simpan Pengaturan Sekolah
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: MASTER SISWA */}
      {activeSubTab === "siswa" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Daftar Master Peserta Didik</h2>
              <p className="text-xs text-slate-500">
                Total {students.length} Siswa • Laki-laki: {students.filter((s) => s.jenisKelamin === "L").length} • Perempuan: {students.filter((s) => s.jenisKelamin === "P").length}
              </p>
            </div>
            <button
              onClick={() => {
                setStudentForm({ noInduk: `${2100 + students.length + 1}`, nisn: `013${Date.now().toString().slice(-7)}`, nama: "", jenisKelamin: "L" });
                setIsAddingStudent(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" /> Tambah Siswa Baru
            </button>
          </div>

          {/* Form Tambah Siswa */}
          {isAddingStudent && (
            <form onSubmit={handleSaveNewStudent} className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Tambah Data Siswa Baru</h4>
                <button
                  type="button"
                  onClick={() => setIsAddingStudent(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">No. Induk</label>
                  <input
                    type="text"
                    value={studentForm.noInduk}
                    onChange={(e) => setStudentForm({ ...studentForm, noInduk: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                    placeholder="2116"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">NISN (10 Digit)</label>
                  <input
                    type="text"
                    value={studentForm.nisn}
                    onChange={(e) => setStudentForm({ ...studentForm, nisn: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                    placeholder="0134567816"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nama Lengkap Siswa</label>
                  <input
                    type="text"
                    value={studentForm.nama}
                    onChange={(e) => setStudentForm({ ...studentForm, nama: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                    placeholder="Nama Lengkap"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Jenis Kelamin</label>
                  <select
                    value={studentForm.jenisKelamin}
                    onChange={(e) => setStudentForm({ ...studentForm, jenisKelamin: e.target.value as "L" | "P" })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="L">L (Laki-laki)</option>
                    <option value="P">P (Perempuan)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingStudent(false)}
                  className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded-md font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-semibold"
                >
                  Simpan Siswa
                </button>
              </div>
            </form>
          )}

          {/* Tabel Siswa */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">No</th>
                  <th className="py-2.5 px-3">No. Induk</th>
                  <th className="py-2.5 px-3">NISN</th>
                  <th className="py-2.5 px-3">Nama Lengkap Siswa</th>
                  <th className="py-2.5 px-3 text-center w-16">L/P</th>
                  <th className="py-2.5 px-3 text-right w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 px-4 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-500 space-y-3">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <Users className="w-6 h-6" />
                        </div>
                        <div className="text-sm font-semibold text-slate-700">
                          Belum ada data siswa. Silakan klik Tambah Siswa Baru
                        </div>
                        <p className="text-xs text-slate-400 max-w-sm">
                          Data siswa yang Anda input akan tersimpan secara otomatis ke database Supabase terisolasi khusus di akun Anda.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setStudentForm({
                              noInduk: `${2100 + students.length + 1}`,
                              nisn: `013${Date.now().toString().slice(-7)}`,
                              nama: "",
                              jenisKelamin: "L"
                            });
                            setIsAddingStudent(true);
                          }}
                          className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Tambah Siswa Baru
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  students.map((student, idx) => {
                    const isEditing = editingStudentId === student.id;

                    if (isEditing) {
                      return (
                        <tr key={student.id} className="bg-indigo-50/50">
                          <td className="py-2 px-3 text-center font-bold">{idx + 1}</td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={studentForm.noInduk}
                              onChange={(e) => setStudentForm({ ...studentForm, noInduk: e.target.value })}
                              className="px-2 py-1 text-xs border border-indigo-300 rounded w-24 bg-white"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={studentForm.nisn}
                              onChange={(e) => setStudentForm({ ...studentForm, nisn: e.target.value })}
                              className="px-2 py-1 text-xs border border-indigo-300 rounded w-28 bg-white"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={studentForm.nama}
                              onChange={(e) => setStudentForm({ ...studentForm, nama: e.target.value })}
                              className="px-2 py-1 text-xs border border-indigo-300 rounded w-full bg-white"
                            />
                          </td>
                          <td className="py-2 px-3 text-center">
                            <select
                              value={studentForm.jenisKelamin}
                              onChange={(e) => setStudentForm({ ...studentForm, jenisKelamin: e.target.value as "L" | "P" })}
                              className="px-1 py-1 text-xs border border-indigo-300 rounded bg-white"
                            >
                              <option value="L">L</option>
                              <option value="P">P</option>
                            </select>
                          </td>
                          <td className="py-2 px-3 text-right space-x-1">
                            <button
                              onClick={() => handleUpdateStudent(student.id)}
                              className="p-1 text-emerald-600 hover:bg-emerald-100 rounded"
                              title="Simpan"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingStudentId(null)}
                              className="p-1 text-slate-400 hover:bg-slate-200 rounded"
                              title="Batal"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 text-center text-slate-500 font-medium">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">{student.noInduk}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">{student.nisn}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{student.nama}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              student.jenisKelamin === "L" ? "bg-blue-100 text-blue-800" : "bg-pink-100 text-pink-800"
                            }`}
                          >
                            {student.jenisKelamin}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right space-x-1">
                          <button
                            onClick={() => {
                              setEditingStudentId(student.id);
                              setStudentForm({
                                noInduk: student.noInduk,
                                nisn: student.nisn,
                                nama: student.nama,
                                jenisKelamin: student.jenisKelamin
                              });
                            }}
                            className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded"
                            title="Edit Siswa"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Hapus data siswa: ${student.nama}?`)) {
                                deleteStudent(student.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded"
                            title="Hapus Siswa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MASTER MATA PELAJARAN & KKTP */}
      {activeSubTab === "mapel" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Master Mata Pelajaran & Standar KKTP</h2>
              <p className="text-xs text-slate-500">
                Atur kode singkat, nama resmi mata pelajaran, dan nilai ambang batas Kriteria Ketercapaian Tujuan Pembelajaran.
              </p>
            </div>
            <button
              onClick={() => {
                setSubjectForm({ kode: "", nama: "", kktp: 70 });
                setIsAddingSubject(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" /> Tambah Mata Pelajaran
            </button>
          </div>

          {isAddingSubject && (
            <form onSubmit={handleSaveNewSubject} className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Tambah Mata Pelajaran Baru</h4>
                <button type="button" onClick={() => setIsAddingSubject(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Kode Singkat</label>
                  <input
                    type="text"
                    value={subjectForm.kode}
                    onChange={(e) => setSubjectForm({ ...subjectForm, kode: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md"
                    placeholder="Contoh: KODING"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nama Mata Pelajaran</label>
                  <input
                    type="text"
                    value={subjectForm.nama}
                    onChange={(e) => setSubjectForm({ ...subjectForm, nama: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md"
                    placeholder="Contoh: Coding & Kecerdasan Artifisial"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Target KKTP (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={subjectForm.kktp}
                    onChange={(e) => setSubjectForm({ ...subjectForm, kktp: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingSubject(false)}
                  className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded-md font-medium"
                >
                  Batal
                </button>
                <button type="submit" className="px-4 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-semibold">
                  Simpan Mapel
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">No</th>
                  <th className="py-2.5 px-3 w-28">Kode Mapel</th>
                  <th className="py-2.5 px-3">Nama Lengkap Mata Pelajaran</th>
                  <th className="py-2.5 px-3 text-center w-28">Ambang KKTP</th>
                  <th className="py-2.5 px-3 text-center w-24">Jumlah BAB</th>
                  <th className="py-2.5 px-3 text-right w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjects.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 px-4 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-500 space-y-3">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <div className="text-sm font-semibold text-slate-700">
                          Belum ada data mata pelajaran. Silakan klik Tambah Mata Pelajaran
                        </div>
                        <p className="text-xs text-slate-400 max-w-sm">
                          Tambahkan mata pelajaran untuk kelas Anda (contoh: PAI, BIN, MAT, IPAS, dsb) beserta standar ambang batas KKTP.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setSubjectForm({ kode: "", nama: "", kktp: 70 });
                            setIsAddingSubject(true);
                          }}
                          className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Tambah Mata Pelajaran
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  subjects.map((sub, idx) => {
                    const isEditing = editingSubjectId === sub.id;

                    if (isEditing) {
                      return (
                        <tr key={sub.id} className="bg-indigo-50/50">
                          <td className="py-2 px-3 text-center font-bold">{idx + 1}</td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={subjectForm.kode}
                              onChange={(e) => setSubjectForm({ ...subjectForm, kode: e.target.value })}
                              className="px-2 py-1 text-xs border border-indigo-300 rounded w-20 bg-white"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={subjectForm.nama}
                              onChange={(e) => setSubjectForm({ ...subjectForm, nama: e.target.value })}
                              className="px-2 py-1 text-xs border border-indigo-300 rounded w-full bg-white"
                            />
                          </td>
                          <td className="py-2 px-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={subjectForm.kktp}
                              onChange={(e) => setSubjectForm({ ...subjectForm, kktp: Number(e.target.value) })}
                              className="px-2 py-1 text-xs border border-indigo-300 rounded w-16 text-center bg-white"
                            />
                          </td>
                          <td className="py-2 px-3 text-center text-slate-500">{sub.babs.length}</td>
                          <td className="py-2 px-3 text-right space-x-1">
                            <button
                              onClick={() => {
                                updateSubject(sub.id, subjectForm);
                                setEditingSubjectId(null);
                              }}
                              className="p-1 text-emerald-600 hover:bg-emerald-100 rounded"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setEditingSubjectId(null)} className="p-1 text-slate-400 hover:bg-slate-200 rounded">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 text-center text-slate-500 font-medium">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-bold text-indigo-700">{sub.kode}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-900">{sub.nama}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                            {sub.kktp}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-600 font-medium">{sub.babs.length} BAB</td>
                        <td className="py-2.5 px-3 text-right space-x-1">
                          <button
                            onClick={() => {
                              setEditingSubjectId(sub.id);
                              setSubjectForm({ kode: sub.kode, nama: sub.nama, kktp: sub.kktp });
                            }}
                            className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded"
                            title="Edit Mapel"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Hapus mata pelajaran ${sub.nama}? Semua nilai terkait akan ikut terhapus.`)) {
                                deleteSubject(sub.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded"
                            title="Hapus Mapel"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: MASTER BAB & TP */}
      {activeSubTab === "bab-tp" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Pengaturan BAB & Tujuan Pembelajaran (TP)</h2>
              <p className="text-xs text-slate-500">
                Pilih mata pelajaran untuk mengatur daftar BAB dan butir-butir Tujuan Pembelajaran (TP) yang dinilai.
              </p>
            </div>

            {/* Subject Dropdown Selector */}
            {subjects.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Pilih Mapel:</label>
                <select
                  value={selectedSubjectForBab}
                  onChange={(e) => setSelectedSubjectForBab(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg bg-slate-50 text-indigo-900 focus:ring-2 focus:ring-indigo-500"
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.kode} - {sub.nama}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {subjects.length === 0 ? (
            <div className="py-16 px-4 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-700 mb-1">Belum Ada Mata Pelajaran</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                Silakan tambahkan data mata pelajaran terlebih dahulu pada tab "Mata Pelajaran" untuk mulai mengatur BAB dan butir Tujuan Pembelajaran (TP).
              </p>
              <button
                type="button"
                onClick={() => setActiveSubTab("mapel")}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
              >
                Buka Tab Mata Pelajaran
              </button>
            </div>
          ) : activeSubjectObj ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-indigo-50/70 p-3 rounded-lg border border-indigo-100">
                <div>
                  <span className="text-xs font-bold text-indigo-900">Mata Pelajaran Aktif:</span>
                  <span className="text-xs font-semibold text-indigo-700 ml-2">{activeSubjectObj.nama} ({activeSubjectObj.kode})</span>
                  <span className="ml-3 px-2 py-0.5 bg-indigo-200/70 text-indigo-900 text-[10px] font-bold rounded">
                    KKTP: {activeSubjectObj.kktp}
                  </span>
                </div>
                <button
                  onClick={() => setIsAddingBab(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah BAB Baru
                </button>
              </div>

              {/* Add BAB Form Modal/Section */}
              {isAddingBab && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-800 uppercase">Tambah BAB untuk {activeSubjectObj.kode}</h4>
                    <button onClick={() => setIsAddingBab(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nama BAB</label>
                      <input
                        type="text"
                        value={newBabName}
                        onChange={(e) => setNewBabName(e.target.value)}
                        placeholder="Contoh: BAB V"
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Judul / Lingkup Materi</label>
                      <input
                        type="text"
                        value={newBabJudul}
                        onChange={(e) => setNewBabJudul(e.target.value)}
                        placeholder="Contoh: Cerita Rakyat Daerah Nusantara"
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsAddingBab(false)}
                      className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded-md"
                    >
                      Batal
                    </button>
                    <button
                      onClick={() => {
                        if (!newBabName.trim()) return;
                        addBab(activeSubjectObj.id, {
                          nama: newBabName.trim(),
                          judul: newBabJudul.trim() || "Lingkup Materi"
                        });
                        setNewBabName("");
                        setNewBabJudul("");
                        setIsAddingBab(false);
                      }}
                      className="px-4 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-semibold"
                    >
                      Simpan BAB
                    </button>
                  </div>
                </div>
              )}

              {/* List of BABs */}
              <div className="space-y-4">
                {activeSubjectObj.babs.length === 0 ? (
                  <div className="py-12 px-4 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-2">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-semibold text-slate-700 mb-1">
                      Belum ada BAB untuk mata pelajaran {activeSubjectObj.nama}
                    </p>
                    <p className="text-[11px] text-slate-400 mb-3 max-w-sm mx-auto">
                      Tambahkan BAB baru untuk mulai memasukkan butir-butir Tujuan Pembelajaran (TP).
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsAddingBab(true)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah BAB Pertama
                    </button>
                  </div>
                ) : (
                  activeSubjectObj.babs.map((bab, bIdx) => (
                  <div key={bab.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    {/* BAB Header */}
                    <div className="bg-slate-100/90 px-4 py-3 flex items-center justify-between border-b border-slate-200">
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 bg-indigo-600 text-white text-xs font-bold rounded-md">
                          {bab.nama}
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-slate-800">{bab.judul}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setActiveBabForTp(bab.id);
                            setTpKode(`TP ${bab.tps.length + 1}`);
                            setTpDeskripsi("");
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-indigo-700 rounded-md text-xs font-semibold shadow-xs"
                        >
                          <Plus className="w-3 h-3" /> Tambah TP
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Hapus ${bab.nama}? Semua TP di dalamnya akan ikut terhapus.`)) {
                              deleteBab(activeSubjectObj.id, bab.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Hapus BAB"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Add TP form inside BAB */}
                    {activeBabForTp === bab.id && (
                      <div className="p-3 bg-indigo-50/40 border-b border-indigo-100 flex flex-col sm:flex-row gap-2 items-center">
                        <input
                          type="text"
                          value={tpKode}
                          onChange={(e) => setTpKode(e.target.value)}
                          placeholder="Kode (mis: TP 1)"
                          className="w-24 px-2.5 py-1 text-xs border border-indigo-300 rounded bg-white"
                        />
                        <input
                          type="text"
                          value={tpDeskripsi}
                          onChange={(e) => setTpDeskripsi(e.target.value)}
                          placeholder="Deskripsi Tujuan Pembelajaran (Contoh: Menyimak informasi teks...)"
                          className="flex-1 px-3 py-1 text-xs border border-indigo-300 rounded bg-white w-full"
                        />
                        <div className="flex gap-1.5 self-end sm:self-center">
                          <button
                            onClick={() => {
                              if (!tpDeskripsi.trim()) return;
                              addTp(activeSubjectObj.id, bab.id, {
                                kode: tpKode.trim() || `TP ${bab.tps.length + 1}`,
                                deskripsi: tpDeskripsi.trim()
                              });
                              setActiveBabForTp(null);
                            }}
                            className="px-3 py-1 text-xs bg-indigo-600 text-white rounded font-semibold hover:bg-indigo-700"
                          >
                            Simpan TP
                          </button>
                          <button
                            onClick={() => setActiveBabForTp(null)}
                            className="px-2 py-1 text-xs text-slate-500 hover:bg-slate-200 rounded"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    )}

                    {/* List of TPs in BAB */}
                    <div className="divide-y divide-slate-100 bg-white">
                      {bab.tps.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-400 italic">
                          Belum ada Tujuan Pembelajaran (TP) untuk {bab.nama}. Klik "+ Tambah TP".
                        </div>
                      ) : (
                        bab.tps.map((tp, tpIdx) => (
                          <div key={tp.id} className="p-3 flex items-start justify-between gap-3 hover:bg-slate-50/70">
                            <div className="flex items-start gap-3">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-mono text-[11px] font-bold rounded">
                                {tp.kode}
                              </span>
                              <p className="text-xs text-slate-700 leading-relaxed">{tp.deskripsi}</p>
                            </div>
                            <button
                              onClick={() => {
                                if (window.confirm(`Hapus ${tp.kode}?`)) {
                                  deleteTp(activeSubjectObj.id, bab.id, tp.id);
                                }
                              }}
                              className="text-slate-400 hover:text-rose-600 p-1"
                              title="Hapus TP"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-emerald-700 text-white px-5 py-3.5 rounded-xl shadow-xl border border-emerald-500 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Check className="w-5 h-5 flex-shrink-0 text-emerald-200" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
