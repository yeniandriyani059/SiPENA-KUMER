export interface SchoolSettings {
  namaSekolah: string;
  npsn?: string;
  alamat?: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  kelas: string; // e.g. "IV (Empat)"
  fase: string; // e.g. "Fase B"
  semester: "1" | "2";
  tahunPelajaran: string; // e.g. "2025/2026"
  namaGuru: string;
  nipGuru: string;
  namaKepsek: string;
  nipKepsek: string;
  titimangsa: string; // e.g. "Karanggintung"
  tanggalCetak: string; // e.g. "20 Juni 2026"
}

export interface Student {
  id: string;
  noInduk: string;
  nisn: string;
  nama: string;
  jenisKelamin: "L" | "P";
}

export interface TujuanPembelajaran {
  id: string;
  kode: string; // e.g. "TP 1", "TP 2"
  deskripsi: string;
  babId: string;
}

export interface Bab {
  id: string;
  nama: string; // e.g. "BAB I", "BAB II"
  judul: string; // e.g. "Pancasila Sebagai Nilai Kehidupan"
  tps: TujuanPembelajaran[];
}

export interface Subject {
  id: string;
  kode: string; // e.g. "PABP", "PP", "BI", "MTK"
  nama: string; // e.g. "Pendidikan Agama dan Budi Pekerti"
  kktp: number; // e.g. 75
  babs: Bab[];
}

export interface StudentGradeRecord {
  studentId: string;
  subjectId: string;
  semester: "1" | "2";
  formatif: {
    tpScores: Record<string, number | null>; // key: tpId or tpCode
    ulanganHarian: number | null;
    tugasRutin: number | null;
    praktikProyek: number | null;
    catatanP5: string;
  };
  sumatif: {
    babScores: Record<string, number | null>; // key: babId
    astsNonTes: number | null;
    astsTes: number | null;
    astsTesRemedial?: number | null;
    asasNonTes: number | null;
    asasTes: number | null;
    asasTesRemedial?: number | null;
  };
}

export type RekapMode = "rekap-akhir" | "rekap-asts" | "rekap-asas";
export type RekapTesVariant = "asli" | "remedial";

export interface KktpIntervalEvaluation {
  score: number;
  kriteria: "T" | "BT";
  intervensi: string;
  level: "0-40" | "41-69" | "70-85" | "86-100";
}

export type ActiveTab = 
  | "dashboard" 
  | "master-data" 
  | "input-nilai" 
  | "cetak-mapel" 
  | "rekap-all" 
  | "analisis-kktp";

export interface SipenaUserProfile {
  user_id: string;
  nama_guru: string;
  email?: string;
  is_active: boolean;
  expired_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

