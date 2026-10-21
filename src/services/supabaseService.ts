import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { SchoolSettings, Student, Subject, StudentGradeRecord, SipenaUserProfile, SipenaNilaiRow } from "../types";

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

  // Helper to convert any string ID deterministically into a valid UUID v4 format
  ensureValidUuid(id: string): string {
    if (!id) return "00000000-0000-0000-0000-000000000000";
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(id)) return id;
    let hex = "";
    for (let i = 0; i < id.length; i++) {
      hex += id.charCodeAt(i).toString(16);
    }
    const padded = (hex + "00000000000000000000000000000000").slice(0, 32);
    return `${padded.slice(0, 8)}-${padded.slice(8, 12)}-4${padded.slice(13, 16)}-a${padded.slice(17, 20)}-${padded.slice(20, 32)}`;
  },

  // Helper to parse sipena_nilai rows into StudentGradeRecord array
  parseSipenaNilaiRows(
    rows: any[],
    subjectsList?: Subject[],
    studentsList?: Student[]
  ): StudentGradeRecord[] {
    if (!Array.isArray(rows) || rows.length === 0) return [];

    const recordsMap = new Map<string, StudentGradeRecord>();

    rows.forEach((row: any) => {
      let studentId = row.siswa_id || row.student_id;
      if (studentsList && studentId) {
        const matched = studentsList.find(
          (s) => s.id === studentId || this.ensureValidUuid(s.id) === studentId
        );
        if (matched) {
          studentId = matched.id;
        }
      }

      const subjectId = row.mapel_id || row.subject_id;
      const semester = (row.semester as "1" | "2") || "1";
      const bab = row.bab || row.bab_id || "";
      const kategori = (row.kategori || row.jenis_penilaian || "").toLowerCase();

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

      // Parse JSONB data_nilai
      let dataNilai: Record<string, any> = {};
      if (typeof row.data_nilai === "string") {
        try {
          dataNilai = JSON.parse(row.data_nilai);
        } catch {
          dataNilai = {};
        }
      } else if (typeof row.data_nilai === "object" && row.data_nilai !== null) {
        dataNilai = row.data_nilai;
      }

      // 1. Process nested objects in data_nilai if present
      if (dataNilai.tpScores && typeof dataNilai.tpScores === "object") {
        Object.entries(dataNilai.tpScores).forEach(([k, v]) => {
          if (v !== null && v !== undefined && !isNaN(Number(v))) {
            const num = Number(v);
            rec.formatif.tpScores[k] = num;
            rec.formatif.tpScores[k.toLowerCase().replace(/[^a-z0-9_]/g, "")] = num;
          }
        });
      }

      if (dataNilai.babScores && typeof dataNilai.babScores === "object") {
        Object.entries(dataNilai.babScores).forEach(([k, v]) => {
          if (v !== null && v !== undefined && !isNaN(Number(v))) {
            const num = Number(v);
            rec.sumatif.babScores[k] = num;
            rec.sumatif.babScores[k.toLowerCase().replace(/[^a-z0-9_]/g, "")] = num;
          }
        });
      }

      // 2. Process all entries in data_nilai JSONB
      Object.entries(dataNilai).forEach(([k, rawVal]) => {
        if (k === "tpScores" || k === "babScores") return;
        if (rawVal === null || rawVal === undefined || rawVal === "") return;

        if (k.toLowerCase() === "catatanp5" || k === "catatan_p5") {
          rec.formatif.catatanP5 = String(rawVal);
          return;
        }

        const numVal = Number(rawVal);
        if (isNaN(numVal)) return;

        const lk = k.toLowerCase().replace(/[^a-z0-9_]/g, "");

        if (lk.startsWith("tp")) {
          rec.formatif.tpScores[k] = numVal;
          rec.formatif.tpScores[lk] = numVal;
        } else if (lk === "uh" || lk === "ulanganharian" || lk === "formatif_uh") {
          rec.formatif.ulanganHarian = numVal;
        } else if (lk === "tugas" || lk === "tugasrutin" || lk === "formatif_tugas") {
          rec.formatif.tugasRutin = numVal;
        } else if (lk === "proyek" || lk === "praktikproyek" || lk === "formatif_proyek") {
          rec.formatif.praktikProyek = numVal;
        } else if (lk === "aststes" || lk === "asts_tes") {
          rec.sumatif.astsTes = numVal;
        } else if (lk === "astsnontes" || lk === "asts_non_tes") {
          rec.sumatif.astsNonTes = numVal;
        } else if (lk === "aststesremedial" || lk === "asts_remedial" || lk === "aststes_remedial") {
          rec.sumatif.astsTesRemedial = numVal;
        } else if (lk === "asastes" || lk === "asas_tes") {
          rec.sumatif.asasTes = numVal;
        } else if (lk === "asasnontes" || lk === "asas_non_tes") {
          rec.sumatif.asasNonTes = numVal;
        } else if (lk === "asastesremedial" || lk === "asas_remedial" || lk === "asastes_remedial") {
          rec.sumatif.asasTesRemedial = numVal;
        } else if (lk.startsWith("bab")) {
          rec.sumatif.babScores[k] = numVal;
          rec.sumatif.babScores[lk] = numVal;
        } else if (kategori === "formatif") {
          rec.formatif.tpScores[k] = numVal;
          rec.formatif.tpScores[lk] = numVal;
        } else if (kategori === "sumatif") {
          rec.sumatif.babScores[k] = numVal;
          rec.sumatif.babScores[lk] = numVal;
        }
      });

      // 3. Fallback: Also inspect flat columns on row (for backward compatibility)
      const rawNilai = row.nilai;
      if (rawNilai !== null && rawNilai !== undefined && rawNilai !== "") {
        const val = Number(rawNilai);
        const kolom = (row.kolom_penilaian || bab || "").toLowerCase().trim();
        if (kolom.startsWith("tp")) {
          rec.formatif.tpScores[kolom] = val;
        } else if (kolom === "uh") {
          rec.formatif.ulanganHarian = val;
        } else if (kolom === "tugas") {
          rec.formatif.tugasRutin = val;
        } else if (kolom === "proyek") {
          rec.formatif.praktikProyek = val;
        } else if (kolom.startsWith("bab")) {
          rec.sumatif.babScores[kolom] = val;
        } else if (kolom === "asts_tes") {
          rec.sumatif.astsTes = val;
        } else if (kolom === "asas_tes") {
          rec.sumatif.asasTes = val;
        }
      }

      if (row.catatan && !rec.formatif.catatanP5) {
        rec.formatif.catatanP5 = row.catatan;
      }

      // 4. Link TP & BAB codes to their IDs if subject metadata is provided
      if (subjectsList && subjectId) {
        const matchedSubject = subjectsList.find((s) => s.id === subjectId);
        if (matchedSubject) {
          matchedSubject.babs.forEach((b) => {
            const cleanBabNama = b.nama.toLowerCase().replace(/[^a-z0-9_]/g, "");
            if (rec.sumatif.babScores[cleanBabNama] !== undefined && rec.sumatif.babScores[b.id] === undefined) {
              rec.sumatif.babScores[b.id] = rec.sumatif.babScores[cleanBabNama];
            } else if (rec.sumatif.babScores[b.id] !== undefined && rec.sumatif.babScores[cleanBabNama] === undefined) {
              rec.sumatif.babScores[cleanBabNama] = rec.sumatif.babScores[b.id];
            }

            b.tps.forEach((tp) => {
              const cleanKode = tp.kode.toLowerCase().replace(/[^a-z0-9_]/g, "");
              if (rec.formatif.tpScores[cleanKode] !== undefined && rec.formatif.tpScores[tp.id] === undefined) {
                rec.formatif.tpScores[tp.id] = rec.formatif.tpScores[cleanKode];
              } else if (rec.formatif.tpScores[tp.id] !== undefined && rec.formatif.tpScores[cleanKode] === undefined) {
                rec.formatif.tpScores[cleanKode] = rec.formatif.tpScores[tp.id];
              }
            });
          });
        }
      }
    });

    return Array.from(recordsMap.values());
  },

  // 4. GRADE RECORDS (sipena_nilai - Multi-tenant with user_id)
  async fetchGradeRecords(
    userId: string,
    subjectsList?: Subject[],
    studentsList?: Student[]
  ): Promise<StudentGradeRecord[] | null> {
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
        return this.parseSipenaNilaiRows(nilaiRows, subjectsList, studentsList);
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

  // Helper to convert StudentGradeRecord array into sipena_nilai rows with JSONB format
  serializeToSipenaNilaiRows(userId: string, records: StudentGradeRecord[]): SipenaNilaiRow[] {
    const rows: SipenaNilaiRow[] = [];

    records.forEach((r) => {
      const validSiswaId = this.ensureValidUuid(r.studentId);
      const sem = r.semester || "1";

      // 1. Formatif row (JSONB)
      const formatifData: Record<string, any> = {
        ...r.formatif.tpScores,
        tpScores: r.formatif.tpScores,
        uh: r.formatif.ulanganHarian,
        ulanganHarian: r.formatif.ulanganHarian,
        tugas: r.formatif.tugasRutin,
        tugasRutin: r.formatif.tugasRutin,
        proyek: r.formatif.praktikProyek,
        praktikProyek: r.formatif.praktikProyek,
        catatanP5: r.formatif.catatanP5 || ""
      };

      rows.push({
        user_id: userId,
        siswa_id: validSiswaId,
        mapel_id: r.subjectId,
        semester: sem,
        kategori: "formatif",
        bab: "formatif_umum",
        data_nilai: formatifData,
        updated_at: new Date().toISOString()
      });

      // 2. Sumatif row (JSONB)
      const sumatifData: Record<string, any> = {
        ...r.sumatif.babScores,
        babScores: r.sumatif.babScores,
        astsTes: r.sumatif.astsTes,
        asts_tes: r.sumatif.astsTes,
        astsNonTes: r.sumatif.astsNonTes,
        asts_non_tes: r.sumatif.astsNonTes,
        astsTesRemedial: r.sumatif.astsTesRemedial ?? null,
        asts_remedial: r.sumatif.astsTesRemedial ?? null,
        asasTes: r.sumatif.asasTes,
        asas_tes: r.sumatif.asasTes,
        asasNonTes: r.sumatif.asasNonTes,
        asas_non_tes: r.sumatif.asasNonTes,
        asasTesRemedial: r.sumatif.asasTesRemedial ?? null,
        asas_remedial: r.sumatif.asasTesRemedial ?? null
      };

      rows.push({
        user_id: userId,
        siswa_id: validSiswaId,
        mapel_id: r.subjectId,
        semester: sem,
        kategori: "sumatif",
        bab: "sumatif_umum",
        data_nilai: sumatifData,
        updated_at: new Date().toISOString()
      });
    });

    return rows;
  },

  // Save multiple grade rows into sipena_nilai with onConflict composite key
  async upsertToSipenaNilai(userId: string, rows: any[]): Promise<boolean> {
    if (!isSupabaseConfigured || !userId || rows.length === 0) return true;
    try {
      const { error } = await supabase
        .from("sipena_nilai")
        .upsert(rows, { onConflict: "user_id,siswa_id,mapel_id,semester,kategori,bab" });

      if (error) {
        console.error("Supabase upsertToSipenaNilai error:", error);
        return false;
      }
      return true;
    } catch (err) {
      console.error("Supabase upsertToSipenaNilai exception:", err);
      return false;
    }
  },

  async saveGradeRecords(userId: string, records: StudentGradeRecord[]): Promise<boolean> {
    if (!isSupabaseConfigured || !userId || records.length === 0) return false;
    try {
      const rows = this.serializeToSipenaNilaiRows(userId, records);
      return await this.upsertToSipenaNilai(userId, rows);
    } catch (err) {
      console.error("Supabase saveGradeRecords exception:", err);
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
      console.error("Supabase saveSingleGradeRecord exception:", err);
      return false;
    }
  },

  // Fetch grade records filtered by specific subject & semester
  async fetchGradeRecordsBySubject(
    userId: string,
    mapelId: string,
    semester: string,
    subjectsList?: Subject[],
    studentsList?: Student[]
  ): Promise<StudentGradeRecord[] | null> {
    if (!isSupabaseConfigured || !userId || !mapelId) return null;
    try {
      const { data: rows, error } = await supabase
        .from("sipena_nilai")
        .select("*")
        .eq("user_id", userId)
        .eq("mapel_id", mapelId)
        .eq("semester", semester);

      if (error) {
        console.error("Supabase fetchGradeRecordsBySubject error:", error.message);
        return null;
      }

      if (!Array.isArray(rows) || rows.length === 0) {
        return [];
      }

      return this.parseSipenaNilaiRows(rows, subjectsList, studentsList);
    } catch (err) {
      console.error("Supabase fetchGradeRecordsBySubject exception:", err);
      return null;
    }
  },

  // Direct single score update to sipena_nilai with JSONB format:
  // user_id, siswa_id, mapel_id, semester, kategori, bab, data_nilai
  async saveDirectGradeScore(
    userId: string,
    params: {
      siswaId: string;
      mapelId: string;
      semester: string;
      kolomPenilaian: string;
      nilai: number | null;
      babId?: string;
      tpId?: string;
      jenisPenilaian?: string;
      catatan?: string;
      currentRecord?: StudentGradeRecord;
    }
  ): Promise<{ success: boolean; error?: any }> {
    if (!isSupabaseConfigured || !userId || !params.siswaId || !params.mapelId) {
      const err = new Error("Supabase belum dikonfigurasi atau parameter tidak lengkap");
      console.error(err);
      return { success: false, error: err };
    }
    try {
      const {
        siswaId,
        mapelId,
        semester,
        kolomPenilaian,
        nilai,
        babId,
        tpId,
        jenisPenilaian,
        catatan,
        currentRecord
      } = params;
      const cleanKolom = (kolomPenilaian || "").toLowerCase().replace(/[^a-z0-9_]/g, "");
      const sem = semester || "1";
      const validSiswaId = this.ensureValidUuid(siswaId);

      // 1. Determine category: formatif vs sumatif
      const isFormatif =
        cleanKolom.startsWith("tp") ||
        cleanKolom === "uh" ||
        cleanKolom === "tugas" ||
        cleanKolom === "proyek" ||
        cleanKolom === "catatan_p5" ||
        cleanKolom === "catatanp5" ||
        (jenisPenilaian && jenisPenilaian.includes("formatif"));

      const kategori: "formatif" | "sumatif" = isFormatif ? "formatif" : "sumatif";

      // 2. Determine bab string
      let bab = babId || "umum";
      if (isFormatif) {
        if (cleanKolom.startsWith("tp")) {
          bab = babId || cleanKolom;
        } else {
          bab = "formatif_umum";
        }
      } else {
        if (cleanKolom.startsWith("asts")) {
          bab = "asts";
        } else if (cleanKolom.startsWith("asas")) {
          bab = "asas";
        } else {
          bab = babId || cleanKolom;
        }
      }

      // 3. Build data_nilai JSONB structure
      const dataNilai: Record<string, any> = {};

      if (currentRecord) {
        if (kategori === "formatif") {
          Object.entries(currentRecord.formatif.tpScores || {}).forEach(([k, v]) => {
            if (v !== null && v !== undefined) {
              dataNilai[k] = v;
              dataNilai[k.toLowerCase().replace(/[^a-z0-9_]/g, "")] = v;
            }
          });
          if (currentRecord.formatif.ulanganHarian !== null) {
            dataNilai.uh = currentRecord.formatif.ulanganHarian;
            dataNilai.ulanganHarian = currentRecord.formatif.ulanganHarian;
          }
          if (currentRecord.formatif.tugasRutin !== null) {
            dataNilai.tugas = currentRecord.formatif.tugasRutin;
            dataNilai.tugasRutin = currentRecord.formatif.tugasRutin;
          }
          if (currentRecord.formatif.praktikProyek !== null) {
            dataNilai.proyek = currentRecord.formatif.praktikProyek;
            dataNilai.praktikProyek = currentRecord.formatif.praktikProyek;
          }
          if (currentRecord.formatif.catatanP5) {
            dataNilai.catatanP5 = currentRecord.formatif.catatanP5;
          }
        } else {
          Object.entries(currentRecord.sumatif.babScores || {}).forEach(([k, v]) => {
            if (v !== null && v !== undefined) {
              dataNilai[k] = v;
              dataNilai[k.toLowerCase().replace(/[^a-z0-9_]/g, "")] = v;
            }
          });
          if (currentRecord.sumatif.astsTes !== null) {
            dataNilai.astsTes = currentRecord.sumatif.astsTes;
            dataNilai.asts_tes = currentRecord.sumatif.astsTes;
          }
          if (currentRecord.sumatif.astsNonTes !== null) {
            dataNilai.astsNonTes = currentRecord.sumatif.astsNonTes;
            dataNilai.asts_non_tes = currentRecord.sumatif.astsNonTes;
          }
          if (currentRecord.sumatif.astsTesRemedial !== null) {
            dataNilai.astsTesRemedial = currentRecord.sumatif.astsTesRemedial;
            dataNilai.asts_remedial = currentRecord.sumatif.astsTesRemedial;
          }
          if (currentRecord.sumatif.asasTes !== null) {
            dataNilai.asasTes = currentRecord.sumatif.asasTes;
            dataNilai.asas_tes = currentRecord.sumatif.asasTes;
          }
          if (currentRecord.sumatif.asasNonTes !== null) {
            dataNilai.asasNonTes = currentRecord.sumatif.asasNonTes;
            dataNilai.asas_non_tes = currentRecord.sumatif.asasNonTes;
          }
          if (currentRecord.sumatif.asasTesRemedial !== null) {
            dataNilai.asasTesRemedial = currentRecord.sumatif.asasTesRemedial;
            dataNilai.asas_remedial = currentRecord.sumatif.asasTesRemedial;
          }
        }
      }

      // Write or overwrite with the new value
      dataNilai[cleanKolom] = nilai;
      if (kolomPenilaian && kolomPenilaian !== cleanKolom) {
        dataNilai[kolomPenilaian] = nilai;
      }
      if (tpId) {
        dataNilai[tpId] = nilai;
      }
      if (catatan) {
        dataNilai.catatanP5 = catatan;
      }

      const row: any = {
        user_id: userId,
        siswa_id: validSiswaId,
        mapel_id: mapelId,
        semester: sem,
        kategori,
        bab,
        data_nilai: dataNilai,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from("sipena_nilai")
        .upsert(row, { onConflict: "user_id,siswa_id,mapel_id,semester,kategori,bab" });

      if (error) {
        console.error("Gagal menyimpan nilai ke Supabase sipena_nilai:", error);
        return { success: false, error };
      }

      return { success: true };
    } catch (err: any) {
      console.error("Exception saveDirectGradeScore:", err);
      return { success: false, error: err };
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
      currentRecord?: StudentGradeRecord;
    }
  ): Promise<{ success: boolean; error?: any }> {
    return this.saveDirectGradeScore(userId, {
      siswaId,
      mapelId,
      semester: extra?.semester || "1",
      kolomPenilaian: babId,
      nilai,
      babId,
      tpId: extra?.tpId,
      jenisPenilaian: extra?.jenisPenilaian,
      catatan: extra?.catatan,
      currentRecord: extra?.currentRecord
    });
  }
};
