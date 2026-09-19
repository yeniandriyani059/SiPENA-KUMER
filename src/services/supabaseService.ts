import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { SchoolSettings, Student, Subject, StudentGradeRecord, SipenaUserProfile } from "../types";

/**
 * Service for multi-tenant data storage in Supabase.
 * Enforces user_id isolation on all queries and mutations:
 * Tables:
 * - sipena_users (Lisensi & Aktivasi)
 * - sipena_config
 * - sipena_siswa
 * - sipena_mapel
 * - sipena_nilai_formatif
 * - sipena_nilai_sumatif
 */

export const supabaseService = {
  // 0. USER PROFILE & LISENSI AKTIVASI (sipena_users)
  async getUserProfile(userId: string): Promise<SipenaUserProfile | null> {
    if (!isSupabaseConfigured || !userId) return null;
    try {
      const { data, error } = await supabase
        .from("sipena_users")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        // Jika tabel belum dibuat, log peringatan tanpa throw error
        console.warn("Supabase getUserProfile warning:", error.message);
        return null;
      }
      return data as SipenaUserProfile | null;
    } catch (err) {
      console.warn("Supabase getUserProfile exception:", err);
      return null;
    }
  },

  async upsertUserProfile(profile: {
    user_id: string;
    nama_guru: string;
    email?: string;
    is_active?: boolean;
    expired_at?: string | null;
  }): Promise<SipenaUserProfile | null> {
    if (!isSupabaseConfigured || !profile.user_id) return null;
    try {
      const payload: any = {
        user_id: profile.user_id,
        nama_guru: profile.nama_guru,
        email: profile.email,
        updated_at: new Date().toISOString()
      };
      if (profile.is_active !== undefined) {
        payload.is_active = profile.is_active;
      }
      if (profile.expired_at !== undefined) {
        payload.expired_at = profile.expired_at;
      }

      const { data, error } = await supabase
        .from("sipena_users")
        .upsert(payload, { onConflict: "user_id" })
        .select()
        .maybeSingle();

      if (error) {
        console.warn("Supabase upsertUserProfile warning:", error.message);
        return null;
      }
      return data as SipenaUserProfile | null;
    } catch (err) {
      console.warn("Supabase upsertUserProfile exception:", err);
      return null;
    }
  },

  // 1. SCHOOL CONFIG / SETTINGS
  async fetchSchoolSettings(userId: string): Promise<SchoolSettings | null> {
    if (!isSupabaseConfigured || !userId) return null;
    try {
      const { data, error } = await supabase
        .from("sipena_config")
        .select("data")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.warn("Supabase fetchSchoolSettings warning:", error.message);
        return null;
      }
      return data?.data as SchoolSettings || null;
    } catch (err) {
      console.warn("Supabase fetchSchoolSettings error:", err);
      return null;
    }
  },

  async saveSchoolSettings(userId: string, settings: SchoolSettings): Promise<boolean> {
    if (!isSupabaseConfigured || !userId) return false;
    try {
      const { error } = await supabase.from("sipena_config").upsert(
        {
          id: userId,
          user_id: userId,
          data: settings,
          updated_at: new Date().toISOString()
        },
        { onConflict: "id" }
      );

      if (error) {
        console.warn("Supabase saveSchoolSettings error:", error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn("Supabase saveSchoolSettings exception:", err);
      return false;
    }
  },

  // 2. STUDENTS / SISWA
  async fetchStudents(userId: string): Promise<Student[] | null> {
    if (!isSupabaseConfigured || !userId) return null;
    try {
      const { data, error } = await supabase
        .from("sipena_siswa")
        .select("*")
        .eq("user_id", userId)
        .order("no_induk", { ascending: true });

      if (error) {
        console.warn("Supabase fetchStudents error:", error.message);
        return null;
      }

      if (!data || data.length === 0) return null;

      return data.map((d) => ({
        id: d.id,
        noInduk: d.no_induk || "",
        nisn: d.nisn || "",
        nama: d.nama,
        jenisKelamin: (d.jenis_kelamin as "L" | "P") || "L"
      }));
    } catch (err) {
      console.warn("Supabase fetchStudents exception:", err);
      return null;
    }
  },

  async saveStudents(userId: string, students: Student[]): Promise<boolean> {
    if (!isSupabaseConfigured || !userId) return false;
    try {
      const rows = students.map((s) => ({
        id: s.id,
        user_id: userId,
        no_induk: s.noInduk,
        nisn: s.nisn,
        nama: s.nama,
        jenis_kelamin: s.jenisKelamin,
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from("sipena_siswa")
        .upsert(rows, { onConflict: "id,user_id" });

      if (error) {
        console.warn("Supabase saveStudents error:", error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn("Supabase saveStudents exception:", err);
      return false;
    }
  },

  async deleteStudent(userId: string, studentId: string): Promise<boolean> {
    if (!isSupabaseConfigured || !userId) return false;
    try {
      const { error } = await supabase
        .from("sipena_siswa")
        .delete()
        .eq("id", studentId)
        .eq("user_id", userId);

      return !error;
    } catch (err) {
      console.warn("Supabase deleteStudent exception:", err);
      return false;
    }
  },

  // 3. SUBJECTS / MAPEL
  async fetchSubjects(userId: string): Promise<Subject[] | null> {
    if (!isSupabaseConfigured || !userId) return null;
    try {
      const { data, error } = await supabase
        .from("sipena_mapel")
        .select("*")
        .eq("user_id", userId);

      if (error) {
        console.warn("Supabase fetchSubjects error:", error.message);
        return null;
      }

      if (!data || data.length === 0) return null;

      return data.map((d) => ({
        id: d.id,
        kode: d.kode,
        nama: d.nama,
        kktp: Number(d.kktp) || 75,
        babs: d.babs || []
      }));
    } catch (err) {
      console.warn("Supabase fetchSubjects exception:", err);
      return null;
    }
  },

  async saveSubjects(userId: string, subjects: Subject[]): Promise<boolean> {
    if (!isSupabaseConfigured || !userId) return false;
    try {
      const rows = subjects.map((sub) => ({
        id: sub.id,
        user_id: userId,
        kode: sub.kode,
        nama: sub.nama,
        kktp: sub.kktp,
        babs: sub.babs,
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from("sipena_mapel")
        .upsert(rows, { onConflict: "id,user_id" });

      if (error) {
        console.warn("Supabase saveSubjects error:", error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn("Supabase saveSubjects exception:", err);
      return false;
    }
  },

  // 4. GRADE RECORDS (FORMATIF & SUMATIF)
  async fetchGradeRecords(userId: string): Promise<StudentGradeRecord[] | null> {
    if (!isSupabaseConfigured || !userId) return null;
    try {
      const [formatifRes, sumatifRes] = await Promise.all([
        supabase.from("sipena_nilai_formatif").select("*").eq("user_id", userId),
        supabase.from("sipena_nilai_sumatif").select("*").eq("user_id", userId)
      ]);

      if (formatifRes.error || sumatifRes.error) {
        console.warn("Supabase fetchGradeRecords error:", formatifRes.error || sumatifRes.error);
        return null;
      }

      const formatifData = formatifRes.data || [];
      const sumatifData = sumatifRes.data || [];

      if (formatifData.length === 0 && sumatifData.length === 0) {
        return null;
      }

      // Map combined records by key: `${student_id}_${subject_id}_${semester}`
      const recordsMap = new Map<string, StudentGradeRecord>();

      formatifData.forEach((f) => {
        const key = `${f.student_id}_${f.subject_id}_${f.semester}`;
        recordsMap.set(key, {
          studentId: f.student_id,
          subjectId: f.subject_id,
          semester: (f.semester as "1" | "2") || "1",
          formatif: {
            tpScores: f.tp_scores || {},
            ulanganHarian: f.ulangan_harian ?? null,
            tugasRutin: f.tugas_rutin ?? null,
            praktikProyek: f.praktik_proyek ?? null,
            catatanP5: f.catatan_p5 || ""
          },
          sumatif: {
            babScores: {},
            astsNonTes: null,
            astsTes: null,
            astsTesRemedial: null,
            asasNonTes: null,
            asasTes: null,
            asasTesRemedial: null
          }
        });
      });

      sumatifData.forEach((s) => {
        const key = `${s.student_id}_${s.subject_id}_${s.semester}`;
        const existing = recordsMap.get(key);
        if (existing) {
          existing.sumatif = {
            babScores: s.bab_scores || {},
            astsNonTes: s.asts_non_tes ?? null,
            astsTes: s.asts_tes ?? null,
            astsTesRemedial: s.asts_tes_remedial ?? null,
            asasNonTes: s.asas_non_tes ?? null,
            asasTes: s.asas_tes ?? null,
            asasTesRemedial: s.asas_tes_remedial ?? null
          };
        } else {
          recordsMap.set(key, {
            studentId: s.student_id,
            subjectId: s.subject_id,
            semester: (s.semester as "1" | "2") || "1",
            formatif: {
              tpScores: {},
              ulanganHarian: null,
              tugasRutin: null,
              praktikProyek: null,
              catatanP5: ""
            },
            sumatif: {
              babScores: s.bab_scores || {},
              astsNonTes: s.asts_non_tes ?? null,
              astsTes: s.asts_tes ?? null,
              astsTesRemedial: s.asts_tes_remedial ?? null,
              asasNonTes: s.asas_non_tes ?? null,
              asasTes: s.asas_tes ?? null,
              asasTesRemedial: s.asas_tes_remedial ?? null
            }
          });
        }
      });

      return Array.from(recordsMap.values());
    } catch (err) {
      console.warn("Supabase fetchGradeRecords exception:", err);
      return null;
    }
  },

  async saveGradeRecords(userId: string, records: StudentGradeRecord[]): Promise<boolean> {
    if (!isSupabaseConfigured || !userId || records.length === 0) return false;
    try {
      const formatifRows = records.map((r) => ({
        id: `${r.studentId}_${r.subjectId}_${r.semester}`,
        user_id: userId,
        student_id: r.studentId,
        subject_id: r.subjectId,
        semester: r.semester,
        tp_scores: r.formatif.tpScores,
        ulangan_harian: r.formatif.ulanganHarian,
        tugas_rutin: r.formatif.tugasRutin,
        praktik_proyek: r.formatif.praktikProyek,
        catatan_p5: r.formatif.catatanP5,
        updated_at: new Date().toISOString()
      }));

      const sumatifRows = records.map((r) => ({
        id: `${r.studentId}_${r.subjectId}_${r.semester}`,
        user_id: userId,
        student_id: r.studentId,
        subject_id: r.subjectId,
        semester: r.semester,
        bab_scores: r.sumatif.babScores,
        asts_non_tes: r.sumatif.astsNonTes,
        asts_tes: r.sumatif.astsTes,
        asts_tes_remedial: r.sumatif.astsTesRemedial ?? null,
        asas_non_tes: r.sumatif.asasNonTes,
        asas_tes: r.sumatif.asasTes,
        asas_tes_remedial: r.sumatif.asasTesRemedial ?? null,
        updated_at: new Date().toISOString()
      }));

      const [resF, resS] = await Promise.all([
        supabase.from("sipena_nilai_formatif").upsert(formatifRows, { onConflict: "id,user_id" }),
        supabase.from("sipena_nilai_sumatif").upsert(sumatifRows, { onConflict: "id,user_id" })
      ]);

      if (resF.error || resS.error) {
        console.warn("Supabase saveGradeRecords warning:", resF.error || resS.error);
        return false;
      }

      return true;
    } catch (err) {
      console.warn("Supabase saveGradeRecords exception:", err);
      return false;
    }
  },

  // Helper for single grade record field update to prevent large payloads
  async saveSingleGradeRecord(userId: string, record: StudentGradeRecord): Promise<boolean> {
    if (!isSupabaseConfigured || !userId) return false;
    try {
      const formatifRow = {
        id: `${record.studentId}_${record.subjectId}_${record.semester}`,
        user_id: userId,
        student_id: record.studentId,
        subject_id: record.subjectId,
        semester: record.semester,
        tp_scores: record.formatif.tpScores,
        ulangan_harian: record.formatif.ulanganHarian,
        tugas_rutin: record.formatif.tugasRutin,
        praktik_proyek: record.formatif.praktikProyek,
        catatan_p5: record.formatif.catatanP5,
        updated_at: new Date().toISOString()
      };

      const sumatifRow = {
        id: `${record.studentId}_${record.subjectId}_${record.semester}`,
        user_id: userId,
        student_id: record.studentId,
        subject_id: record.subjectId,
        semester: record.semester,
        bab_scores: record.sumatif.babScores,
        asts_non_tes: record.sumatif.astsNonTes,
        asts_tes: record.sumatif.astsTes,
        asts_tes_remedial: record.sumatif.astsTesRemedial ?? null,
        asas_non_tes: record.sumatif.asasNonTes,
        asas_tes: record.sumatif.asasTes,
        asas_tes_remedial: record.sumatif.asasTesRemedial ?? null,
        updated_at: new Date().toISOString()
      };

      await Promise.all([
        supabase.from("sipena_nilai_formatif").upsert(formatifRow, { onConflict: "id,user_id" }),
        supabase.from("sipena_nilai_sumatif").upsert(sumatifRow, { onConflict: "id,user_id" })
      ]);

      return true;
    } catch (err) {
      console.warn("Supabase saveSingleGradeRecord exception:", err);
      return false;
    }
  }
};
