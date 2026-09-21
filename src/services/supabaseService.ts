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

  // 1. SCHOOL CONFIG / SETTINGS (MULTI-TENANT ISOLATED BY user_id)
  async fetchSchoolSettings(userId: string): Promise<SchoolSettings | null> {
    if (!isSupabaseConfigured || !userId) return null;
    try {
      const { data, error } = await supabase
        .from("sipena_config")
        .select("*")
        .eq("user_id", userId)
        .setHeader("Cache-Control", "no-cache, no-store, must-revalidate")
        .setHeader("Pragma", "no-cache")
        .maybeSingle();

      if (!error && data) {
        const jsonb = data.data && typeof data.data === "object" ? data.data : {};

        return {
          namaSekolah: jsonb.namaSekolah || data.namaSekolah || data.nama_sekolah || "",
          npsn: jsonb.npsn || data.npsn || "",
          alamat: jsonb.alamat || data.alamat || "",
          kecamatan: jsonb.kecamatan || data.kecamatan || "",
          kabupaten: jsonb.kabupaten || data.kabupaten || data.kota || "",
          provinsi: jsonb.provinsi || data.provinsi || "",
          kelas: jsonb.kelas ?? data.kelas ?? "",
          fase: jsonb.fase ?? data.fase ?? "",
          semester: (jsonb.semester || data.semester || "1") as "1" | "2",
          tahunPelajaran: jsonb.tahunPelajaran || data.tahunPelajaran || data.tahun_pelajaran || data.tahun_ajaran || "",
          namaGuru: jsonb.namaGuru || data.namaGuru || data.nama_guru || "",
          nipGuru: jsonb.nipGuru || data.nipGuru || data.nip_guru || "",
          namaKepsek: jsonb.namaKepsek || data.namaKepsek || data.nama_kepsek || "",
          nipKepsek: jsonb.nipKepsek || data.nipKepsek || data.nip_kepsek || "",
          titimangsa: jsonb.titimangsa || data.titimangsa || "",
          tanggalCetak: jsonb.tanggalCetak || data.tanggalCetak || data.tanggal_cetak || ""
        };
      }

      return null;
    } catch (err) {
      console.warn("Supabase fetchSchoolSettings error:", err);
      return null;
    }
  },

  async saveSchoolSettings(userId: string, settings: SchoolSettings): Promise<boolean> {
    if (!isSupabaseConfigured || !userId) return false;
    try {
      // 1. Direct upsert with user_id and formData spread with onConflict: 'user_id'
      const payload: Record<string, any> = {
        user_id: userId,
        ...settings,
        data: settings,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from("sipena_config")
        .upsert(payload, { onConflict: "user_id" });

      if (error) {
        console.warn("Supabase saveSchoolSettings primary error:", error.message);

        // Fallback retry 1: Pure formData spread with user_id
        const retry1 = await supabase
          .from("sipena_config")
          .upsert({ user_id: userId, ...settings }, { onConflict: "user_id" });

        if (!retry1.error) return true;

        // Fallback retry 2: JSONB data column format
        const retry2 = await supabase
          .from("sipena_config")
          .upsert(
            {
              user_id: userId,
              data: settings,
              updated_at: new Date().toISOString()
            },
            { onConflict: "user_id" }
          );

        if (!retry2.error) return true;

        // Fallback retry 3: Primary key as id
        const retry3 = await supabase
          .from("sipena_config")
          .upsert(
            {
              id: userId,
              user_id: userId,
              data: settings,
              updated_at: new Date().toISOString()
            },
            { onConflict: "id" }
          );

        if (!retry3.error) return true;

        return false;
      }
      return true;
    } catch (err) {
      console.warn("Supabase saveSchoolSettings exception:", err);
      return false;
    }
  },

  // 2. STUDENTS / SISWA (MULTI-TENANT ISOLATED BY user_id)
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

      if (!data) return [];

      return data.map((d) => ({
        id: String(d.id),
        noInduk: d.no_induk || "",
        nisn: d.nisn || "",
        nama: d.nama_lengkap || d.nama || "",
        jenisKelamin: (d.jenis_kelamin as "L" | "P") || "L"
      }));
    } catch (err) {
      console.warn("Supabase fetchStudents exception:", err);
      return null;
    }
  },

  async insertStudent(
    userId: string,
    student: Student
  ): Promise<{ success: boolean; data?: Student; error?: string }> {
    if (!isSupabaseConfigured || !userId) {
      return { success: false, error: "Database Supabase belum terkonfigurasi atau sesi pengguna tidak aktif" };
    }
    try {
      const payload: Record<string, any> = {
        user_id: userId,
        no_induk: student.noInduk,
        nisn: student.nisn,
        nama_lengkap: student.nama,
        jenis_kelamin: student.jenisKelamin
      };

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (student.id && uuidRegex.test(student.id)) {
        payload.id = student.id;
      }

      const { data, error } = await supabase
        .from("sipena_siswa")
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.warn("Supabase insertStudent error:", error.message);
        return { success: false, error: error.message };
      }

      const savedStudent: Student = {
        id: String(data.id),
        noInduk: data.no_induk || student.noInduk,
        nisn: data.nisn || student.nisn,
        nama: data.nama_lengkap || data.nama || student.nama,
        jenisKelamin: (data.jenis_kelamin as "L" | "P") || student.jenisKelamin
      };

      return { success: true, data: savedStudent };
    } catch (err: any) {
      console.warn("Supabase insertStudent exception:", err);
      return { success: false, error: err?.message || "Gagal menambah data siswa" };
    }
  },

  async updateStudent(
    userId: string,
    studentId: string,
    updates: Partial<Student>
  ): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured || !userId) return { success: false };
    try {
      const payload: Record<string, any> = {
        updated_at: new Date().toISOString()
      };
      if (updates.noInduk !== undefined) payload.no_induk = updates.noInduk;
      if (updates.nisn !== undefined) payload.nisn = updates.nisn;
      if (updates.nama !== undefined) payload.nama_lengkap = updates.nama;
      if (updates.jenisKelamin !== undefined) payload.jenis_kelamin = updates.jenisKelamin;

      const { error } = await supabase
        .from("sipena_siswa")
        .update(payload)
        .eq("id", studentId)
        .eq("user_id", userId);

      if (error) {
        console.warn("Supabase updateStudent error:", error.message);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      console.warn("Supabase updateStudent exception:", err);
      return { success: false, error: err?.message };
    }
  },

  async saveStudents(userId: string, students: Student[]): Promise<boolean> {
    if (!isSupabaseConfigured || !userId) return false;
    try {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const rows = students.map((s) => {
        const row: Record<string, any> = {
          user_id: userId,
          no_induk: s.noInduk,
          nisn: s.nisn,
          nama_lengkap: s.nama,
          jenis_kelamin: s.jenisKelamin,
          updated_at: new Date().toISOString()
        };
        if (s.id && uuidRegex.test(s.id)) {
          row.id = s.id;
        }
        return row;
      });

      if (rows.length === 0) return true;

      const { error } = await supabase
        .from("sipena_siswa")
        .upsert(rows, { onConflict: "id" });

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

      if (error) {
        console.warn("Supabase deleteStudent error:", error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn("Supabase deleteStudent exception:", err);
      return false;
    }
  },

  // 3. SUBJECTS / MAPEL (MULTI-TENANT ISOLATED BY user_id)
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

      if (!data) return [];

      return data.map((d) => ({
        id: String(d.id),
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

  async insertSubject(
    userId: string,
    subject: Subject
  ): Promise<{ success: boolean; data?: Subject; error?: string }> {
    if (!isSupabaseConfigured || !userId) {
      return { success: false, error: "Database Supabase belum terkonfigurasi" };
    }
    try {
      const payload: Record<string, any> = {
        user_id: userId,
        kode: subject.kode,
        nama: subject.nama,
        kktp: subject.kktp,
        babs: subject.babs,
        updated_at: new Date().toISOString()
      };

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (subject.id && uuidRegex.test(subject.id)) {
        payload.id = subject.id;
      }

      const { data, error } = await supabase
        .from("sipena_mapel")
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.warn("Supabase insertSubject error:", error.message);
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: {
          id: String(data.id),
          kode: data.kode,
          nama: data.nama,
          kktp: Number(data.kktp) || 75,
          babs: data.babs || []
        }
      };
    } catch (err: any) {
      console.warn("Supabase insertSubject exception:", err);
      return { success: false, error: err?.message };
    }
  },

  async deleteSubject(userId: string, subjectId: string): Promise<boolean> {
    if (!isSupabaseConfigured || !userId) return false;
    try {
      const { error } = await supabase
        .from("sipena_mapel")
        .delete()
        .eq("id", subjectId)
        .eq("user_id", userId);

      return !error;
    } catch (err) {
      console.warn("Supabase deleteSubject exception:", err);
      return false;
    }
  },

  async saveSubjects(userId: string, subjects: Subject[]): Promise<boolean> {
    if (!isSupabaseConfigured || !userId) return false;
    try {
      const rows = subjects.map((sub) => {
        const row: Record<string, any> = {
          user_id: userId,
          kode: sub.kode,
          nama: sub.nama,
          kktp: sub.kktp,
          babs: sub.babs,
          updated_at: new Date().toISOString()
        };
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (sub.id && uuidRegex.test(sub.id)) {
          row.id = sub.id;
        }
        return row;
      });

      if (rows.length === 0) return true;

      const { error } = await supabase
        .from("sipena_mapel")
        .upsert(rows, { onConflict: "id" });

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

  // 4. GRADE RECORDS (sipena_nilai - Multi-tenant with user_id)
  async fetchGradeRecords(userId: string): Promise<StudentGradeRecord[] | null> {
    if (!isSupabaseConfigured || !userId) return null;
    try {
      // 1. First priority: sipena_nilai
      const { data: nilaiRows, error: nilaiErr } = await supabase
        .from("sipena_nilai")
        .select("*")
        .eq("user_id", userId);

      if (!nilaiErr && Array.isArray(nilaiRows)) {
        if (nilaiRows.length === 0) {
          return [];
        }

        // Map combined records by key: `${siswa_id}_${mapel_id}_${semester}`
        const recordsMap = new Map<string, StudentGradeRecord>();

        nilaiRows.forEach((row: any) => {
          const studentId = row.siswa_id || row.student_id;
          const subjectId = row.mapel_id || row.subject_id;
          const semester = (row.semester as "1" | "2") || "1";
          const babId = row.bab_id || "";
          const tpId = row.tp_id || null;
          const jenis = row.jenis_penilaian || "";
          const rawNilai = row.nilai;
          const val = rawNilai !== null && rawNilai !== undefined && rawNilai !== "" ? Number(rawNilai) : null;
          const catatan = row.catatan || "";

          if (!studentId || !subjectId) return;

          const key = `${studentId}_${subjectId}_${semester}`;
          let rec = recordsMap.get(key);
          if (!rec) {
            rec = {
              studentId,
              subjectId,
              semester,
              formatif: {
                tpScores: {},
                ulanganHarian: null,
                tugasRutin: null,
                praktikProyek: null,
                catatanP5: ""
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
            };
            recordsMap.set(key, rec);
          }

          if (catatan && !rec.formatif.catatanP5) {
            rec.formatif.catatanP5 = catatan;
          }

          if (tpId || jenis === "formatif_tp") {
            rec.formatif.tpScores[tpId || babId] = val;
          } else if (jenis === "formatif_uh" || babId === "formatif_uh") {
            rec.formatif.ulanganHarian = val;
          } else if (jenis === "formatif_tugas" || babId === "formatif_tugas") {
            rec.formatif.tugasRutin = val;
          } else if (jenis === "formatif_proyek" || babId === "formatif_proyek") {
            rec.formatif.praktikProyek = val;
          } else if (jenis === "catatan_p5" || babId === "catatan_p5") {
            if (catatan) rec.formatif.catatanP5 = catatan;
          } else if (jenis === "asts_tes" || babId === "asts_tes") {
            rec.sumatif.astsTes = val;
          } else if (jenis === "asts_non_tes" || babId === "asts_non_tes") {
            rec.sumatif.astsNonTes = val;
          } else if (jenis === "asts_remedial" || babId === "asts_remedial") {
            rec.sumatif.astsTesRemedial = val;
          } else if (jenis === "asas_tes" || babId === "asas_tes") {
            rec.sumatif.asasTes = val;
          } else if (jenis === "asas_non_tes" || babId === "asas_non_tes") {
            rec.sumatif.asasNonTes = val;
          } else if (jenis === "asas_remedial" || babId === "asas_remedial") {
            rec.sumatif.asasTesRemedial = val;
          } else {
            // Standard BAB score
            rec.sumatif.babScores[babId] = val;
          }
        });

        return Array.from(recordsMap.values());
      }

      // 2. Fallback check for sipena_nilai_formatif and sipena_nilai_sumatif
      try {
        const [formatifRes, sumatifRes] = await Promise.all([
          supabase.from("sipena_nilai_formatif").select("*").eq("user_id", userId),
          supabase.from("sipena_nilai_sumatif").select("*").eq("user_id", userId)
        ]);

        if (!formatifRes.error && !sumatifRes.error) {
          const formatifData = formatifRes.data || [];
          const sumatifData = sumatifRes.data || [];

          if (formatifData.length === 0 && sumatifData.length === 0) {
            return [];
          }

          const recordsMap = new Map<string, StudentGradeRecord>();

          formatifData.forEach((f: any) => {
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

          sumatifData.forEach((s: any) => {
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
        }
      } catch (e) {
        console.warn("Fallback fetch exception:", e);
      }

      return [];
    } catch (err) {
      console.warn("Supabase fetchGradeRecords exception:", err);
      return [];
    }
  },

  // Helper to convert StudentGradeRecord array into sipena_nilai rows
  serializeToSipenaNilaiRows(userId: string, records: StudentGradeRecord[]): any[] {
    const rows: any[] = [];

    records.forEach((r) => {
      // 1. Formatif TP scores
      Object.entries(r.formatif.tpScores || {}).forEach(([tpId, score]) => {
        if (score !== null && score !== undefined && !isNaN(score)) {
          rows.push({
            id: `${userId}_${r.studentId}_${r.subjectId}_${tpId}_formatif_${r.semester}`,
            user_id: userId,
            siswa_id: r.studentId,
            mapel_id: r.subjectId,
            bab_id: tpId,
            tp_id: tpId,
            nilai: Number(score),
            semester: r.semester,
            jenis_penilaian: "formatif_tp",
            updated_at: new Date().toISOString()
          });
        }
      });

      // 2. Formatif UH, Tugas, Proyek
      if (r.formatif.ulanganHarian !== null && r.formatif.ulanganHarian !== undefined && !isNaN(r.formatif.ulanganHarian)) {
        rows.push({
          id: `${userId}_${r.studentId}_${r.subjectId}_formatif_uh_${r.semester}`,
          user_id: userId,
          siswa_id: r.studentId,
          mapel_id: r.subjectId,
          bab_id: "formatif_uh",
          nilai: Number(r.formatif.ulanganHarian),
          semester: r.semester,
          jenis_penilaian: "formatif_uh",
          updated_at: new Date().toISOString()
        });
      }

      if (r.formatif.tugasRutin !== null && r.formatif.tugasRutin !== undefined && !isNaN(r.formatif.tugasRutin)) {
        rows.push({
          id: `${userId}_${r.studentId}_${r.subjectId}_formatif_tugas_${r.semester}`,
          user_id: userId,
          siswa_id: r.studentId,
          mapel_id: r.subjectId,
          bab_id: "formatif_tugas",
          nilai: Number(r.formatif.tugasRutin),
          semester: r.semester,
          jenis_penilaian: "formatif_tugas",
          updated_at: new Date().toISOString()
        });
      }

      if (r.formatif.praktikProyek !== null && r.formatif.praktikProyek !== undefined && !isNaN(r.formatif.praktikProyek)) {
        rows.push({
          id: `${userId}_${r.studentId}_${r.subjectId}_formatif_proyek_${r.semester}`,
          user_id: userId,
          siswa_id: r.studentId,
          mapel_id: r.subjectId,
          bab_id: "formatif_proyek",
          nilai: Number(r.formatif.praktikProyek),
          semester: r.semester,
          jenis_penilaian: "formatif_proyek",
          updated_at: new Date().toISOString()
        });
      }

      if (r.formatif.catatanP5 && r.formatif.catatanP5.trim()) {
        rows.push({
          id: `${userId}_${r.studentId}_${r.subjectId}_catatan_p5_${r.semester}`,
          user_id: userId,
          siswa_id: r.studentId,
          mapel_id: r.subjectId,
          bab_id: "catatan_p5",
          nilai: 0,
          catatan: r.formatif.catatanP5,
          semester: r.semester,
          jenis_penilaian: "catatan_p5",
          updated_at: new Date().toISOString()
        });
      }

      // 3. Sumatif BAB
      Object.entries(r.sumatif.babScores || {}).forEach(([babId, score]) => {
        if (score !== null && score !== undefined && !isNaN(score)) {
          rows.push({
            id: `${userId}_${r.studentId}_${r.subjectId}_${babId}_sumatif_${r.semester}`,
            user_id: userId,
            siswa_id: r.studentId,
            mapel_id: r.subjectId,
            bab_id: babId,
            nilai: Number(score),
            semester: r.semester,
            jenis_penilaian: "sumatif_bab",
            updated_at: new Date().toISOString()
          });
        }
      });

      // 4. Sumatif ASTS & ASAS
      if (r.sumatif.astsTes !== null && r.sumatif.astsTes !== undefined && !isNaN(r.sumatif.astsTes)) {
        rows.push({
          id: `${userId}_${r.studentId}_${r.subjectId}_asts_tes_${r.semester}`,
          user_id: userId,
          siswa_id: r.studentId,
          mapel_id: r.subjectId,
          bab_id: "asts_tes",
          nilai: Number(r.sumatif.astsTes),
          semester: r.semester,
          jenis_penilaian: "asts_tes",
          updated_at: new Date().toISOString()
        });
      }

      if (r.sumatif.astsNonTes !== null && r.sumatif.astsNonTes !== undefined && !isNaN(r.sumatif.astsNonTes)) {
        rows.push({
          id: `${userId}_${r.studentId}_${r.subjectId}_asts_non_tes_${r.semester}`,
          user_id: userId,
          siswa_id: r.studentId,
          mapel_id: r.subjectId,
          bab_id: "asts_non_tes",
          nilai: Number(r.sumatif.astsNonTes),
          semester: r.semester,
          jenis_penilaian: "asts_non_tes",
          updated_at: new Date().toISOString()
        });
      }

      if (r.sumatif.astsTesRemedial !== null && r.sumatif.astsTesRemedial !== undefined && !isNaN(r.sumatif.astsTesRemedial)) {
        rows.push({
          id: `${userId}_${r.studentId}_${r.subjectId}_asts_remedial_${r.semester}`,
          user_id: userId,
          siswa_id: r.studentId,
          mapel_id: r.subjectId,
          bab_id: "asts_remedial",
          nilai: Number(r.sumatif.astsTesRemedial),
          semester: r.semester,
          jenis_penilaian: "asts_remedial",
          updated_at: new Date().toISOString()
        });
      }

      if (r.sumatif.asasTes !== null && r.sumatif.asasTes !== undefined && !isNaN(r.sumatif.asasTes)) {
        rows.push({
          id: `${userId}_${r.studentId}_${r.subjectId}_asas_tes_${r.semester}`,
          user_id: userId,
          siswa_id: r.studentId,
          mapel_id: r.subjectId,
          bab_id: "asas_tes",
          nilai: Number(r.sumatif.asasTes),
          semester: r.semester,
          jenis_penilaian: "asas_tes",
          updated_at: new Date().toISOString()
        });
      }

      if (r.sumatif.asasNonTes !== null && r.sumatif.asasNonTes !== undefined && !isNaN(r.sumatif.asasNonTes)) {
        rows.push({
          id: `${userId}_${r.studentId}_${r.subjectId}_asas_non_tes_${r.semester}`,
          user_id: userId,
          siswa_id: r.studentId,
          mapel_id: r.subjectId,
          bab_id: "asas_non_tes",
          nilai: Number(r.sumatif.asasNonTes),
          semester: r.semester,
          jenis_penilaian: "asas_non_tes",
          updated_at: new Date().toISOString()
        });
      }

      if (r.sumatif.asasTesRemedial !== null && r.sumatif.asasTesRemedial !== undefined && !isNaN(r.sumatif.asasTesRemedial)) {
        rows.push({
          id: `${userId}_${r.studentId}_${r.subjectId}_asas_remedial_${r.semester}`,
          user_id: userId,
          siswa_id: r.studentId,
          mapel_id: r.subjectId,
          bab_id: "asas_remedial",
          nilai: Number(r.sumatif.asasTesRemedial),
          semester: r.semester,
          jenis_penilaian: "asas_remedial",
          updated_at: new Date().toISOString()
        });
      }
    });

    return rows;
  },

  // Save multiple grade rows into sipena_nilai with automatic schema resilience
  async upsertToSipenaNilai(userId: string, rows: any[]): Promise<boolean> {
    if (!isSupabaseConfigured || !userId || rows.length === 0) return true;
    try {
      // Attempt 1: Full payload with onConflict on 'id'
      const { error: err1 } = await supabase
        .from("sipena_nilai")
        .upsert(rows, { onConflict: "id" });

      if (!err1) return true;

      // Attempt 2: Minimal columns if extra columns don't exist in Supabase schema
      if (err1.message.includes("Could not find the column") || err1.message.includes("column") || err1.code === "PGRST204") {
        const strippedRows = rows.map((r) => ({
          id: r.id,
          user_id: r.user_id,
          siswa_id: r.siswa_id,
          mapel_id: r.mapel_id,
          bab_id: r.bab_id,
          nilai: r.nilai
        }));
        const { error: err2 } = await supabase
          .from("sipena_nilai")
          .upsert(strippedRows, { onConflict: "id" });

        if (!err2) return true;
      }

      // Attempt 3: If onConflict on 'id' fails, insert without id
      const minimalRows = rows.map((r) => ({
        user_id: r.user_id,
        siswa_id: r.siswa_id,
        mapel_id: r.mapel_id,
        bab_id: r.bab_id,
        nilai: r.nilai
      }));

      // Delete existing records for these students & subjects to avoid duplicates
      const studentIds = Array.from(new Set(rows.map((r) => r.siswa_id)));
      const subjectIds = Array.from(new Set(rows.map((r) => r.mapel_id)));
      for (const sId of studentIds) {
        for (const mId of subjectIds) {
          await supabase
            .from("sipena_nilai")
            .delete()
            .eq("user_id", userId)
            .eq("siswa_id", sId)
            .eq("mapel_id", mId);
        }
      }

      const { error: err3 } = await supabase.from("sipena_nilai").insert(minimalRows);
      if (!err3) return true;

      console.warn("Supabase upsertToSipenaNilai warning:", err3.message);
      return false;
    } catch (err) {
      console.warn("Supabase upsertToSipenaNilai exception:", err);
      return false;
    }
  },

  async saveGradeRecords(userId: string, records: StudentGradeRecord[]): Promise<boolean> {
    if (!isSupabaseConfigured || !userId || records.length === 0) return false;
    try {
      // 1. Primary: Save to sipena_nilai
      const rows = this.serializeToSipenaNilaiRows(userId, records);
      const ok = await this.upsertToSipenaNilai(userId, rows);

      // 2. Secondary: Also save to legacy formatif & sumatif if they exist
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

        await Promise.all([
          supabase.from("sipena_nilai_formatif").upsert(formatifRows, { onConflict: "id,user_id" }),
          supabase.from("sipena_nilai_sumatif").upsert(sumatifRows, { onConflict: "id,user_id" })
        ]);
      } catch (e) {}

      return ok;
    } catch (err) {
      console.warn("Supabase saveGradeRecords exception:", err);
      return false;
    }
  },

  // Save single grade record directly to sipena_nilai
  async saveSingleGradeRecord(userId: string, record: StudentGradeRecord): Promise<boolean> {
    if (!isSupabaseConfigured || !userId) return false;
    try {
      const rows = this.serializeToSipenaNilaiRows(userId, [record]);
      return await this.upsertToSipenaNilai(userId, rows);
    } catch (err) {
      console.warn("Supabase saveSingleGradeRecord exception:", err);
      return false;
    }
  },

  // Direct single score update to sipena_nilai for instant real-time response
  async saveDirectScore(
    userId: string,
    siswaId: string,
    mapelId: string,
    babId: string,
    nilai: number | null,
    extra?: {
      tpId?: string;
      semester?: string;
      jenisPenilaian?: string;
      catatan?: string;
    }
  ): Promise<boolean> {
    if (!isSupabaseConfigured || !userId || !siswaId || !mapelId || !babId) return false;
    try {
      const sem = extra?.semester || "1";
      const jenis = extra?.jenisPenilaian || "sumatif_bab";
      const uniqueId = `${userId}_${siswaId}_${mapelId}_${babId}_${jenis}_${sem}`;

      if (nilai === null || nilai === undefined || isNaN(nilai)) {
        // Delete record from sipena_nilai if value is cleared
        await supabase
          .from("sipena_nilai")
          .delete()
          .eq("user_id", userId)
          .eq("siswa_id", siswaId)
          .eq("mapel_id", mapelId)
          .eq("bab_id", babId);
        return true;
      }

      const row: any = {
        id: uniqueId,
        user_id: userId,
        siswa_id: siswaId,
        mapel_id: mapelId,
        bab_id: babId,
        nilai: Number(nilai),
        tp_id: extra?.tpId || null,
        semester: sem,
        jenis_penilaian: jenis,
        catatan: extra?.catatan || null,
        updated_at: new Date().toISOString()
      };

      return await this.upsertToSipenaNilai(userId, [row]);
    } catch (err) {
      console.warn("Supabase saveDirectScore exception:", err);
      return false;
    }
  }
};
