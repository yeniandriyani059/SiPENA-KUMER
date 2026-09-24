import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import {
  SchoolSettings,
  Student,
  Subject,
  StudentGradeRecord,
  ActiveTab,
  Bab,
  TujuanPembelajaran,
  RekapMode,
  RekapTesVariant,
  SipenaUserProfile
} from "../types";
import {
  emptySchoolSettings,
  initialSchoolSettings,
  initialStudents,
  initialSubjects,
  generateInitialGradeRecords
} from "../data/initialData";
import {
  supabase,
  isSupabaseConfigured,
  formatAuthErrorMessage,
  User,
  Session
} from "../lib/supabase";
import { supabaseService } from "../services/supabaseService";

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface AppContextType {
  // Supabase Auth & Multi-tenant User
  user: User | null;
  session: Session | null;
  userProfile: any | null;
  isAccountActive: boolean;
  setIsAccountActive: (active: boolean) => void;
  authLoading: boolean;
  isCheckingActivation: boolean;
  checkActivationStatus: () => Promise<boolean>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, namaGuru?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  demoLogin: () => Promise<void>;
  syncStatus: "synced" | "syncing" | "offline" | "error";
  syncWithSupabase: () => Promise<void>;

  // School Settings
  schoolSettings: SchoolSettings;
  updateSchoolSettings: (settings: Partial<SchoolSettings>) => Promise<boolean>;

  // Students
  students: Student[];
  addStudent: (student: Omit<Student, "id">) => void;
  updateStudent: (id: string, data: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  setStudents: (students: Student[]) => void;

  // Subjects & BAB/TP
  subjects: Subject[];
  addSubject: (subject: Omit<Subject, "id">) => void;
  updateSubject: (id: string, data: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  addBab: (subjectId: string, bab: Omit<Bab, "id" | "tps">) => void;
  updateBab: (subjectId: string, babId: string, data: Partial<Bab>) => void;
  deleteBab: (subjectId: string, babId: string) => void;
  addTp: (subjectId: string, babId: string, tp: Omit<TujuanPembelajaran, "id" | "babId">) => void;
  updateTp: (subjectId: string, babId: string, tpId: string, data: Partial<TujuanPembelajaran>) => void;
  deleteTp: (subjectId: string, babId: string, tpId: string) => void;

  // Grades
  gradeRecords: StudentGradeRecord[];
  getGradeRecord: (studentId: string, subjectId: string, semester: "1" | "2") => StudentGradeRecord | undefined;
  updateGradeRecord: (record: StudentGradeRecord) => void;
  mergeGradeRecords: (records: StudentGradeRecord[]) => void;
  updateStudentGradeField: (
    studentId: string,
    subjectId: string,
    semester: "1" | "2",
    section: "formatif" | "sumatif",
    field: string,
    value: any,
    subKey?: string
  ) => void;
  isRefreshingGrades: boolean;
  refreshGradeRecords: () => Promise<void>;

  // Navigation & View Filters
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedSubjectId: string;
  setSelectedSubjectId: (id: string) => void;
  selectedSemester: "1" | "2";
  setSelectedSemester: (sem: "1" | "2") => void;
  selectedStudentId: string;
  setSelectedStudentId: (id: string) => void;
  rekapMode: RekapMode;
  setRekapMode: (mode: RekapMode) => void;
  rekapTesVariant: RekapTesVariant;
  setRekapTesVariant: (variant: RekapTesVariant) => void;

  // Reset & Backup
  resetToDefaultData: () => void;
  exportDataJson: () => void;
  importDataJson: (jsonString: string) => boolean;
}

const STORAGE_KEY = "SIPENA_KURMER_STORAGE_V2";
const DEMO_USER_KEY = "SIPENA_DEMO_USER_SESSION";

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<SipenaUserProfile | null>(null);
  const [isAccountActive, setIsAccountActive] = useState<boolean>(false);
  const [isCheckingActivation, setIsCheckingActivation] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "offline" | "error">("synced");

  // Core app state - Real Multi-Tenant data from Supabase (Clean Empty State)
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(emptySchoolSettings);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [gradeRecords, setGradeRecords] = useState<StudentGradeRecord[]>([]);
  const [isRefreshingGrades, setIsRefreshingGrades] = useState<boolean>(false);

  // UI state
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<"1" | "2">("1");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [rekapMode, setRekapMode] = useState<RekapMode>("rekap-akhir");
  const [rekapTesVariant, setRekapTesVariant] = useState<RekapTesVariant>("asli");

  const isDataInitializedRef = useRef(false);

  // Helper to load user-isolated data
  const loadUserData = useCallback(async (activeUser: User) => {
    const userId = activeUser.id;
    setSyncStatus("syncing");

    // 1. First check local user-scoped cache for instant render, purging any stale dummy data
    const cachedSchool = localStorage.getItem(`${STORAGE_KEY}_${userId}_school`);
    const cachedStudents = localStorage.getItem(`${STORAGE_KEY}_${userId}_students`);
    const cachedSubjects = localStorage.getItem(`${STORAGE_KEY}_${userId}_subjects`);
    const cachedProfile = localStorage.getItem(`${STORAGE_KEY}_${userId}_profile`);
    // NOTE: Grades are intentionally never loaded from localStorage (Cloud Supabase is single source of truth)
    setGradeRecords([]);
    localStorage.removeItem(`${STORAGE_KEY}_${userId}_grades`);

    if (cachedSchool) {
      try {
        const parsed = JSON.parse(cachedSchool);
        if (parsed?.alamat?.includes("Sumbang") || parsed?.namaGuru?.includes("Siti Rahmawati")) {
          localStorage.removeItem(`${STORAGE_KEY}_${userId}_school`);
          setSchoolSettings({
            ...emptySchoolSettings,
            namaGuru: activeUser.user_metadata?.full_name || activeUser.email?.split("@")[0] || ""
          });
        } else {
          setSchoolSettings(parsed);
        }
      } catch (e) {
        setSchoolSettings(emptySchoolSettings);
      }
    } else {
      setSchoolSettings({
        ...emptySchoolSettings,
        namaGuru: activeUser.user_metadata?.full_name || activeUser.email?.split("@")[0] || ""
      });
    }

    if (cachedStudents) {
      try {
        const parsed = JSON.parse(cachedStudents);
        if (Array.isArray(parsed) && parsed.some((s: any) => s.id === "std-1" || s.nama === "Ahmad Rizky Pratama")) {
          localStorage.removeItem(`${STORAGE_KEY}_${userId}_students`);
          setStudents([]);
        } else {
          setStudents(Array.isArray(parsed) ? parsed : []);
        }
      } catch (e) {
        setStudents([]);
      }
    } else {
      setStudents([]);
    }

    if (cachedSubjects) {
      try {
        const parsed = JSON.parse(cachedSubjects);
        if (Array.isArray(parsed) && parsed.some((s: any) => s.id === "sub-pabp" || s.kode === "PABP")) {
          localStorage.removeItem(`${STORAGE_KEY}_${userId}_subjects`);
          setSubjects([]);
        } else {
          setSubjects(Array.isArray(parsed) ? parsed : []);
        }
      } catch (e) {
        setSubjects([]);
      }
    } else {
      setSubjects([]);
    }

    // Check cached activation status
    let activeState = false;
    if (cachedProfile) {
      try {
        const parsedProfile = JSON.parse(cachedProfile);
        setUserProfile(parsedProfile);
        activeState = !!parsedProfile.is_active;
        setIsAccountActive(activeState);
      } catch (e) {}
    } else if (activeUser.user_metadata?.is_active !== undefined) {
      activeState = !!activeUser.user_metadata.is_active;
      setIsAccountActive(activeState);
    }

    // 2. Fetch from Supabase Cloud (Multi-Tenant Real Data)
    if (isSupabaseConfigured) {
      try {
        const [cloudProfileRaw, cloudConfig, cloudStudents, cloudSubjects, cloudGrades] = await Promise.all([
          supabaseService.getUserProfile(userId),
          supabaseService.fetchSchoolSettings(userId),
          supabaseService.fetchStudents(userId),
          supabaseService.fetchSubjects(userId),
          supabaseService.fetchGradeRecords(userId)
        ]);

        let cloudProfile = cloudProfileRaw;
        // Pengecekan berbasis email jika profil belum aktif atau belum tercatat berdasarkan user_id
        if ((!cloudProfile || !cloudProfile.is_active) && activeUser.email) {
          try {
            const { data: emailProfile } = await supabase
              .from("sipena_users")
              .select("*")
              .eq("email", activeUser.email)
              .setHeader("Cache-Control", "no-cache, no-store, must-revalidate")
              .setHeader("Pragma", "no-cache")
              .maybeSingle();
            if (emailProfile) {
              cloudProfile = emailProfile as SipenaUserProfile;
            }
          } catch (e) {
            console.warn("Email profile check warning:", e);
          }
        }

        if (cloudProfile) {
          setUserProfile(cloudProfile);
          setIsAccountActive(!!cloudProfile.is_active);
          localStorage.setItem(`${STORAGE_KEY}_${userId}_profile`, JSON.stringify(cloudProfile));
        } else {
          const isMetadataActive = !!activeUser.user_metadata?.is_active;
          const newProfile = {
            user_id: userId,
            nama_guru: activeUser.user_metadata?.full_name || activeUser.email?.split("@")[0] || "Guru Kelas",
            email: activeUser.email || undefined,
            is_active: isMetadataActive
          };
          setUserProfile(newProfile);
          setIsAccountActive(isMetadataActive);
          localStorage.setItem(`${STORAGE_KEY}_${userId}_profile`, JSON.stringify(newProfile));
          supabaseService.upsertUserProfile(newProfile);
        }

        if (cloudConfig) {
          setSchoolSettings(cloudConfig);
          localStorage.setItem(`${STORAGE_KEY}_${userId}_school`, JSON.stringify(cloudConfig));
        }

        // Real data multi-tenant: accept cloud data directly (even when empty array)
        if (cloudStudents !== null) {
          setStudents(cloudStudents);
          localStorage.setItem(`${STORAGE_KEY}_${userId}_students`, JSON.stringify(cloudStudents));
        }

        if (cloudSubjects !== null) {
          setSubjects(cloudSubjects);
          localStorage.setItem(`${STORAGE_KEY}_${userId}_subjects`, JSON.stringify(cloudSubjects));
        }

        if (cloudGrades !== null) {
          setGradeRecords(cloudGrades);
          // Do not write grades to localStorage - Supabase is single source of truth
        }

        setSyncStatus("synced");
      } catch (err) {
        console.warn("Error fetching user data from Supabase:", err);
        setSyncStatus("offline");
      }
    } else {
      setSyncStatus("offline");
    }

    isDataInitializedRef.current = true;
  }, []);

  // Listen to Supabase Auth State changes & initial session
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // Check for active demo user session first
        const demoUserJson = localStorage.getItem(DEMO_USER_KEY);
        if (demoUserJson) {
          try {
            const demoUser = JSON.parse(demoUserJson);
            if (demoUser && demoUser.id) {
              if (mounted) {
                setUser(demoUser);
                await loadUserData(demoUser);
                setAuthLoading(false);
                return;
              }
            }
          } catch (e) {
            localStorage.removeItem(DEMO_USER_KEY);
          }
        }

        // Get session from Supabase
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          if (session?.user) {
            setSession(session);
            setUser(session.user);
            await loadUserData(session.user);
          } else {
            setUser(null);
            setSession(null);
          }
          setAuthLoading(false);
        }
      } catch (err) {
        console.warn("Auth initialization warning:", err);
        if (mounted) {
          setUser(null);
          setSession(null);
          setAuthLoading(false);
        }
      }
    };

    initAuth();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      if (newSession?.user) {
        setSession(newSession);
        setUser(newSession.user);
        await loadUserData(newSession.user);
      } else {
        const demoUserJson = localStorage.getItem(DEMO_USER_KEY);
        if (!demoUserJson) {
          setUser(null);
          setSession(null);
        }
      }
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserData]);

  // Sync to local storage & Supabase whenever user data changes
  useEffect(() => {
    if (!user || !isDataInitializedRef.current) return;
    const userId = user.id;

    try {
      localStorage.setItem(`${STORAGE_KEY}_${userId}_school`, JSON.stringify(schoolSettings));
    } catch (e) {
      console.error("Local storage error:", e);
    }

    if (isSupabaseConfigured) {
      const timer = setTimeout(() => {
        supabaseService.saveSchoolSettings(userId, schoolSettings);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [schoolSettings, user]);

  useEffect(() => {
    if (!user || !isDataInitializedRef.current) return;
    const userId = user.id;

    try {
      localStorage.setItem(`${STORAGE_KEY}_${userId}_students`, JSON.stringify(students));
    } catch (e) {
      console.error("Local storage error:", e);
    }

    if (isSupabaseConfigured) {
      const timer = setTimeout(() => {
        supabaseService.saveStudents(userId, students);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [students, user]);

  useEffect(() => {
    if (!user || !isDataInitializedRef.current) return;
    const userId = user.id;

    try {
      localStorage.setItem(`${STORAGE_KEY}_${userId}_subjects`, JSON.stringify(subjects));
    } catch (e) {
      console.error("Local storage error:", e);
    }

    if (isSupabaseConfigured) {
      const timer = setTimeout(() => {
        supabaseService.saveSubjects(userId, subjects);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [subjects, user]);

  useEffect(() => {
    if (!user || !isDataInitializedRef.current) return;
    const userId = user.id;

    // NOTE: Sesuai instruksi, grades TIDAK disimpan ke localStorage (hanya Cloud Supabase & state)
    if (isSupabaseConfigured) {
      const timer = setTimeout(() => {
        supabaseService.saveGradeRecords(userId, gradeRecords);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [gradeRecords, user]);

  // Auth Functions
  const checkActivationStatus = async (): Promise<boolean> => {
    if (!user) return false;
    setIsCheckingActivation(true);
    try {
      if (user.id === "demo-guru-sdn06") {
        setIsAccountActive(true);
        setActiveTab("dashboard");
        setIsCheckingActivation(false);
        return true;
      }

      if (isSupabaseConfigured && user.email) {
        // Query Supabase mencari berdasarkan email (bukan ID) tanpa cache (force fetch)
        const { data, error } = await supabase
          .from("sipena_users")
          .select("is_active")
          .eq("email", user.email)
          .setHeader("Cache-Control", "no-cache, no-store, must-revalidate")
          .setHeader("Pragma", "no-cache")
          .single();

        if (error) {
          console.warn("Supabase checkActivationStatus by email warning:", error.message);
        }

        if (data && data.is_active) {
          setIsAccountActive(true);
          setActiveTab("dashboard");
          try {
            const cached = localStorage.getItem(`${STORAGE_KEY}_${user.id}_profile`);
            const p = cached ? JSON.parse(cached) : {};
            p.is_active = true;
            localStorage.setItem(`${STORAGE_KEY}_${user.id}_profile`, JSON.stringify(p));
            setUserProfile((prev: any) => ({ ...(prev || {}), is_active: true }));
          } catch (e) {}
          setIsCheckingActivation(false);
          return true;
        } else {
          setIsAccountActive(false);
          setIsCheckingActivation(false);
          return false;
        }
      }

      setIsCheckingActivation(false);
      return isAccountActive;
    } catch (err) {
      console.warn("checkActivationStatus error:", err);
      setIsCheckingActivation(false);
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        return { success: false, error: formatAuthErrorMessage(error) };
      }

      if (data.user) {
        localStorage.removeItem(DEMO_USER_KEY);
        setUser(data.user);
        setSession(data.session);
        await loadUserData(data.user);
        return { success: true };
      }

      return { success: false, error: "Gagal memproses otentikasi akun. Silakan coba lagi." };
    } catch (err: any) {
      return { success: false, error: formatAuthErrorMessage(err) };
    }
  };

  const register = async (email: string, password: string, namaGuru?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const trimmedEmail = email.trim();
      const teacherName = namaGuru?.trim() || trimmedEmail.split("@")[0] || "Guru Kelas";

      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            full_name: teacherName,
            is_active: false // Registrasi Baru: is_active = false secara default
          }
        }
      });

      if (error) {
        // Jika error email already registered, coba sign in langsung
        if (error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("already_exists")) {
          const autoLogin = await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password
          });
          if (autoLogin.data.user) {
            localStorage.removeItem(DEMO_USER_KEY);
            setUser(autoLogin.data.user);
            setSession(autoLogin.data.session);
            await loadUserData(autoLogin.data.user);
            return { success: true };
          }
        }
        return { success: false, error: formatAuthErrorMessage(error) };
      }

      const registeredUser = data.user || ({
        id: `user-${trimmedEmail.replace(/[^a-zA-Z0-9]/g, "_")}`,
        email: trimmedEmail,
        user_metadata: { full_name: teacherName, is_active: false }
      } as unknown as User);

      // Pastikan profile tersimpan di sipena_users dengan is_active: false
      const initialProfile = {
        user_id: registeredUser.id,
        nama_guru: teacherName,
        email: trimmedEmail,
        is_active: false
      };
      await supabaseService.upsertUserProfile(initialProfile);

      localStorage.removeItem(DEMO_USER_KEY);
      setUser(registeredUser);
      setUserProfile(initialProfile);
      setIsAccountActive(false);
      localStorage.setItem(`${STORAGE_KEY}_${registeredUser.id}_profile`, JSON.stringify(initialProfile));

      if (data.session) {
        setSession(data.session);
      }
      await loadUserData(registeredUser);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: formatAuthErrorMessage(err) };
    }
  };

  const demoLogin = async () => {
    const demoUser = {
      id: "demo-guru-sdn06",
      email: "sdn06slemped@gmail.com",
      user_metadata: { full_name: "Guru Kelas IV - SDN KARANGGINTUNG 06", is_active: true }
    } as unknown as User;

    const demoProfile: SipenaUserProfile = {
      user_id: "demo-guru-sdn06",
      nama_guru: "Guru Kelas IV - SDN KARANGGINTUNG 06",
      email: "sdn06slemped@gmail.com",
      is_active: true
    };

    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
    setUser(demoUser);
    setUserProfile(demoProfile);
    setIsAccountActive(true);
    await loadUserData(demoUser);
  };

  const logout = async () => {
    localStorage.removeItem(DEMO_USER_KEY);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Sign out exception:", e);
    }
    setUser(null);
    setSession(null);
    setUserProfile(null);
    setIsAccountActive(false);
    setActiveTab("dashboard");
    isDataInitializedRef.current = false;
    setStudents([]);
    setSubjects([]);
    setGradeRecords([]);
    setSchoolSettings(emptySchoolSettings);
  };

  const syncWithSupabase = async () => {
    if (!user || !isSupabaseConfigured) return;
    setSyncStatus("syncing");
    try {
      await Promise.all([
        supabaseService.saveSchoolSettings(user.id, schoolSettings),
        supabaseService.saveStudents(user.id, students),
        supabaseService.saveSubjects(user.id, subjects),
        supabaseService.saveGradeRecords(user.id, gradeRecords)
      ]);
      setSyncStatus("synced");
    } catch (e) {
      setSyncStatus("error");
    }
  };

  // School actions
  const updateSchoolSettings = async (newSettings: Partial<SchoolSettings>): Promise<boolean> => {
    let updated: SchoolSettings = { ...schoolSettings, ...newSettings };
    setSchoolSettings((prev) => {
      updated = { ...prev, ...newSettings };
      return updated;
    });

    if (user) {
      try {
        localStorage.setItem(`${STORAGE_KEY}_${user.id}_school`, JSON.stringify(updated));
      } catch (e) {
        console.error("Local storage error:", e);
      }

      if (isSupabaseConfigured) {
        setSyncStatus("syncing");
        const ok = await supabaseService.saveSchoolSettings(user.id, updated);
        setSyncStatus("synced");
        return ok;
      }
    }
    return true;
  };

  // Student actions (Multi-tenant with user_id)
  const addStudent = async (studentData: Omit<Student, "id">) => {
    const studentId = generateUUID();
    const newStudent: Student = {
      ...studentData,
      id: studentId
    };
    const nextStudents = [...students, newStudent];
    setStudents(nextStudents);

    if (user) {
      try {
        localStorage.setItem(`${STORAGE_KEY}_${user.id}_students`, JSON.stringify(nextStudents));
      } catch (e) {
        console.error("Local storage error:", e);
      }

      if (isSupabaseConfigured) {
        setSyncStatus("syncing");
        const res = await supabaseService.insertStudent(user.id, newStudent);
        if (res.success && res.data) {
          setStudents((prev) => prev.map((s) => (s.id === studentId ? res.data! : s)));
          setSyncStatus("synced");
        } else {
          setSyncStatus("synced");
        }
      }
    }
  };

  const updateStudent = async (id: string, data: Partial<Student>) => {
    const nextStudents = students.map((s) => (s.id === id ? { ...s, ...data } : s));
    setStudents(nextStudents);

    if (user) {
      try {
        localStorage.setItem(`${STORAGE_KEY}_${user.id}_students`, JSON.stringify(nextStudents));
      } catch (e) {
        console.error("Local storage error:", e);
      }

      if (isSupabaseConfigured) {
        setSyncStatus("syncing");
        await supabaseService.updateStudent(user.id, id, data);
        setSyncStatus("synced");
      }
    }
  };

  const deleteStudent = async (id: string) => {
    if (!user) return;
    const nextStudents = students.filter((s) => s.id !== id);
    setStudents(nextStudents);
    setGradeRecords((prev) => prev.filter((r) => r.studentId !== id));

    try {
      localStorage.setItem(`${STORAGE_KEY}_${user.id}_students`, JSON.stringify(nextStudents));
    } catch (e) {
      console.error("Local storage error:", e);
    }

    if (isSupabaseConfigured) {
      setSyncStatus("syncing");
      await supabaseService.deleteStudent(user.id, id);
      setSyncStatus("synced");
    }
  };

  // Subject actions (Multi-tenant with user_id)
  const addSubject = async (subjectData: Omit<Subject, "id">) => {
    const subjectId = generateUUID();
    const newSubject: Subject = {
      ...subjectData,
      id: subjectId
    };
    const nextSubjects = [...subjects, newSubject];
    setSubjects(nextSubjects);

    if (user) {
      try {
        localStorage.setItem(`${STORAGE_KEY}_${user.id}_subjects`, JSON.stringify(nextSubjects));
      } catch (e) {
        console.error("Local storage error:", e);
      }

      if (isSupabaseConfigured) {
        setSyncStatus("syncing");
        const res = await supabaseService.insertSubject(user.id, newSubject);
        if (res.success && res.data) {
          setSubjects((prev) => prev.map((s) => (s.id === subjectId ? res.data! : s)));
        }
        setSyncStatus("synced");
      }
    }
  };

  const updateSubject = async (id: string, data: Partial<Subject>) => {
    const nextSubjects = subjects.map((s) => (s.id === id ? { ...s, ...data } : s));
    setSubjects(nextSubjects);

    if (user) {
      try {
        localStorage.setItem(`${STORAGE_KEY}_${user.id}_subjects`, JSON.stringify(nextSubjects));
      } catch (e) {
        console.error("Local storage error:", e);
      }

      if (isSupabaseConfigured) {
        setSyncStatus("syncing");
        await supabaseService.saveSubjects(user.id, nextSubjects);
        setSyncStatus("synced");
      }
    }
  };

  const deleteSubject = async (id: string) => {
    const nextSubjects = subjects.filter((s) => s.id !== id);
    setSubjects(nextSubjects);
    setGradeRecords((prev) => prev.filter((r) => r.subjectId !== id));

    if (user) {
      try {
        localStorage.setItem(`${STORAGE_KEY}_${user.id}_subjects`, JSON.stringify(nextSubjects));
      } catch (e) {
        console.error("Local storage error:", e);
      }

      if (isSupabaseConfigured) {
        setSyncStatus("syncing");
        await supabaseService.deleteSubject(user.id, id);
        setSyncStatus("synced");
      }
    }
  };

  const addBab = async (subjectId: string, babData: Omit<Bab, "id" | "tps">) => {
    const newBab: Bab = {
      ...babData,
      id: `bab-${Date.now()}`,
      tps: []
    };
    const nextSubjects = subjects.map((sub) =>
      sub.id === subjectId ? { ...sub, babs: [...sub.babs, newBab] } : sub
    );
    setSubjects(nextSubjects);

    if (user) {
      try {
        localStorage.setItem(`${STORAGE_KEY}_${user.id}_subjects`, JSON.stringify(nextSubjects));
      } catch (e) {
        console.error("Local storage error:", e);
      }

      if (isSupabaseConfigured) {
        setSyncStatus("syncing");
        await supabaseService.saveSubjects(user.id, nextSubjects);
        setSyncStatus("synced");
      }
    }
  };

  const updateBab = async (subjectId: string, babId: string, data: Partial<Bab>) => {
    const nextSubjects = subjects.map((sub) => {
      if (sub.id !== subjectId) return sub;
      return {
        ...sub,
        babs: sub.babs.map((b) => (b.id === babId ? { ...b, ...data } : b))
      };
    });
    setSubjects(nextSubjects);

    if (user) {
      try {
        localStorage.setItem(`${STORAGE_KEY}_${user.id}_subjects`, JSON.stringify(nextSubjects));
      } catch (e) {
        console.error("Local storage error:", e);
      }

      if (isSupabaseConfigured) {
        setSyncStatus("syncing");
        await supabaseService.saveSubjects(user.id, nextSubjects);
        setSyncStatus("synced");
      }
    }
  };

  const deleteBab = async (subjectId: string, babId: string) => {
    const nextSubjects = subjects.map((sub) => {
      if (sub.id !== subjectId) return sub;
      return {
        ...sub,
        babs: sub.babs.filter((b) => b.id !== babId)
      };
    });
    setSubjects(nextSubjects);

    if (user) {
      try {
        localStorage.setItem(`${STORAGE_KEY}_${user.id}_subjects`, JSON.stringify(nextSubjects));
      } catch (e) {
        console.error("Local storage error:", e);
      }

      if (isSupabaseConfigured) {
        setSyncStatus("syncing");
        await supabaseService.saveSubjects(user.id, nextSubjects);
        setSyncStatus("synced");
      }
    }
  };

  const addTp = async (subjectId: string, babId: string, tpData: Omit<TujuanPembelajaran, "id" | "babId">) => {
    const newTp: TujuanPembelajaran = {
      ...tpData,
      id: `tp-${Date.now()}`,
      babId
    };
    const nextSubjects = subjects.map((sub) => {
      if (sub.id !== subjectId) return sub;
      return {
        ...sub,
        babs: sub.babs.map((b) =>
          b.id === babId ? { ...b, tps: [...b.tps, newTp] } : b
        )
      };
    });
    setSubjects(nextSubjects);

    if (user) {
      try {
        localStorage.setItem(`${STORAGE_KEY}_${user.id}_subjects`, JSON.stringify(nextSubjects));
      } catch (e) {
        console.error("Local storage error:", e);
      }

      if (isSupabaseConfigured) {
        setSyncStatus("syncing");
        await supabaseService.saveSubjects(user.id, nextSubjects);
        setSyncStatus("synced");
      }
    }
  };

  const updateTp = async (subjectId: string, babId: string, tpId: string, data: Partial<TujuanPembelajaran>) => {
    const nextSubjects = subjects.map((sub) => {
      if (sub.id !== subjectId) return sub;
      return {
        ...sub,
        babs: sub.babs.map((b) => {
          if (b.id !== babId) return b;
          return {
            ...b,
            tps: b.tps.map((tp) => (tp.id === tpId ? { ...tp, ...data } : tp))
          };
        })
      };
    });
    setSubjects(nextSubjects);

    if (user) {
      try {
        localStorage.setItem(`${STORAGE_KEY}_${user.id}_subjects`, JSON.stringify(nextSubjects));
      } catch (e) {
        console.error("Local storage error:", e);
      }

      if (isSupabaseConfigured) {
        setSyncStatus("syncing");
        await supabaseService.saveSubjects(user.id, nextSubjects);
        setSyncStatus("synced");
      }
    }
  };

  const deleteTp = async (subjectId: string, babId: string, tpId: string) => {
    const nextSubjects = subjects.map((sub) => {
      if (sub.id !== subjectId) return sub;
      return {
        ...sub,
        babs: sub.babs.map((b) => {
          if (b.id !== babId) return b;
          return {
            ...b,
            tps: b.tps.filter((tp) => tp.id !== tpId)
          };
        })
      };
    });
    setSubjects(nextSubjects);

    if (user) {
      try {
        localStorage.setItem(`${STORAGE_KEY}_${user.id}_subjects`, JSON.stringify(nextSubjects));
      } catch (e) {
        console.error("Local storage error:", e);
      }

      if (isSupabaseConfigured) {
        setSyncStatus("syncing");
        await supabaseService.saveSubjects(user.id, nextSubjects);
        setSyncStatus("synced");
      }
    }
  };

  // Grade record actions
  const getGradeRecord = (studentId: string, subjectId: string, semester: "1" | "2") => {
    return gradeRecords.find(
      (r) => r.studentId === studentId && r.subjectId === subjectId && r.semester === semester
    );
  };

  const updateGradeRecord = (record: StudentGradeRecord) => {
    setGradeRecords((prev) => {
      const idx = prev.findIndex(
        (r) =>
          r.studentId === record.studentId &&
          r.subjectId === record.subjectId &&
          r.semester === record.semester
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = record;
        return next;
      } else {
        return [...prev, record];
      }
    });

    if (user && isSupabaseConfigured) {
      supabaseService.saveSingleGradeRecord(user.id, record);
    }
  };

  const updateStudentGradeField = (
    studentId: string,
    subjectId: string,
    semester: "1" | "2",
    section: "formatif" | "sumatif",
    field: string,
    value: any,
    subKey?: string
  ) => {
    setGradeRecords((prev) => {
      const existing = prev.find(
        (r) => r.studentId === studentId && r.subjectId === subjectId && r.semester === semester
      );

      const baseRecord: StudentGradeRecord = existing
        ? JSON.parse(JSON.stringify(existing))
        : {
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

      if (section === "formatif") {
        if (field === "tpScores" && subKey) {
          baseRecord.formatif.tpScores[subKey] = value;
        } else {
          (baseRecord.formatif as any)[field] = value;
        }
      } else if (section === "sumatif") {
        if (field === "babScores" && subKey) {
          baseRecord.sumatif.babScores[subKey] = value;
        } else {
          (baseRecord.sumatif as any)[field] = value;
        }
      }

      const idx = prev.findIndex(
        (r) => r.studentId === studentId && r.subjectId === subjectId && r.semester === semester
      );

      let nextRecords: StudentGradeRecord[];
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = baseRecord;
        nextRecords = next;
      } else {
        nextRecords = [...prev, baseRecord];
      }

      if (user && isSupabaseConfigured) {
        // Direct save to sipena_nilai with user_id, siswa_id, mapel_id, semester, kolom_penilaian, nilai
        let babId = "";
        let jenisPenilaian = "";
        let tpId: string | undefined = undefined;
        let kolomPenilaian = "";

        if (section === "formatif") {
          if (field === "tpScores" && subKey) {
            babId = subKey;
            tpId = subKey;
            kolomPenilaian = subKey;
            jenisPenilaian = "formatif_tp";
          } else {
            babId = `formatif_${field}`;
            kolomPenilaian = field;
            jenisPenilaian = `formatif_${field}`;
          }
        } else if (section === "sumatif") {
          if (field === "babScores" && subKey) {
            babId = subKey;
            kolomPenilaian = subKey;
            jenisPenilaian = "sumatif_bab";
          } else {
            babId = field;
            kolomPenilaian = field;
            jenisPenilaian = field;
          }
        }

        if (babId || kolomPenilaian) {
          supabaseService.saveDirectGradeScore(user.id, {
            siswaId: studentId,
            mapelId: subjectId,
            semester,
            kolomPenilaian: kolomPenilaian || babId,
            nilai: value,
            babId,
            tpId,
            jenisPenilaian
          });
        }

        // Also persist full record for redundancy
        supabaseService.saveSingleGradeRecord(user.id, baseRecord);
      }

      return nextRecords;
    });
  };

  const mergeGradeRecords = useCallback((newRecords: StudentGradeRecord[]) => {
    if (!newRecords || newRecords.length === 0) return;
    setGradeRecords((prev) => {
      const map = new Map<string, StudentGradeRecord>();
      prev.forEach((r) => map.set(`${r.studentId}_${r.subjectId}_${r.semester}`, r));

      newRecords.forEach((nr) => {
        const key = `${nr.studentId}_${nr.subjectId}_${nr.semester}`;
        const existing = map.get(key);
        if (!existing) {
          map.set(key, nr);
        } else {
          map.set(key, {
            ...existing,
            ...nr,
            formatif: {
              ...existing.formatif,
              ...nr.formatif,
              tpScores: { ...existing.formatif.tpScores, ...nr.formatif.tpScores }
            },
            sumatif: {
              ...existing.sumatif,
              ...nr.sumatif,
              babScores: { ...existing.sumatif.babScores, ...nr.sumatif.babScores }
            }
          });
        }
      });

      return Array.from(map.values());
    });
  }, []);

  const refreshGradeRecords = useCallback(async () => {
    if (!user || !isSupabaseConfigured) return;
    setIsRefreshingGrades(true);
    try {
      const freshGrades = await supabaseService.fetchGradeRecords(user.id, subjects);
      if (freshGrades !== null) {
        setGradeRecords(freshGrades);
      }
    } catch (err) {
      console.warn("Error refreshing grades from Supabase:", err);
    } finally {
      setIsRefreshingGrades(false);
    }
  }, [user, subjects]);

  // Reset & Backup
  const resetToDefaultData = () => {
    if (!user) return;
    if (window.confirm("Kembalikan data Anda ke data contoh standar? Data yang Anda ubah akan ditimpa.")) {
      const userId = user.id;
      setSchoolSettings(initialSchoolSettings);
      setStudents(initialStudents);
      setSubjects(initialSubjects);
      setGradeRecords(generateInitialGradeRecords());
      localStorage.removeItem(`${STORAGE_KEY}_${userId}_school`);
      localStorage.removeItem(`${STORAGE_KEY}_${userId}_students`);
      localStorage.removeItem(`${STORAGE_KEY}_${userId}_subjects`);
      localStorage.removeItem(`${STORAGE_KEY}_${userId}_grades`);

      if (isSupabaseConfigured) {
        supabaseService.saveSchoolSettings(userId, initialSchoolSettings);
        supabaseService.saveStudents(userId, initialStudents);
        supabaseService.saveSubjects(userId, initialSubjects);
        supabaseService.saveGradeRecords(userId, generateInitialGradeRecords());
      }
    }
  };

  const exportDataJson = () => {
    const fullBackup = {
      userEmail: user?.email,
      schoolSettings,
      students,
      subjects,
      gradeRecords,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SiPENA_Kurmer_${schoolSettings.namaSekolah.replace(/\s+/g, "_")}_${schoolSettings.tahunPelajaran.replace("/", "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importDataJson = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.schoolSettings && parsed.students && parsed.subjects && parsed.gradeRecords) {
        setSchoolSettings(parsed.schoolSettings);
        setStudents(parsed.students);
        setSubjects(parsed.subjects);
        setGradeRecords(parsed.gradeRecords);
        if (user && isSupabaseConfigured) {
          syncWithSupabase();
        }
        return true;
      }
      return false;
    } catch (e) {
      console.error("Invalid JSON import", e);
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        session,
        userProfile,
        isAccountActive,
        setIsAccountActive,
        isCheckingActivation,
        checkActivationStatus,
        authLoading,
        login,
        register,
        logout,
        demoLogin,
        syncStatus,
        syncWithSupabase,
        schoolSettings,
        updateSchoolSettings,
        students,
        addStudent,
        updateStudent,
        deleteStudent,
        setStudents,
        subjects,
        addSubject,
        updateSubject,
        deleteSubject,
        addBab,
        updateBab,
        deleteBab,
        addTp,
        updateTp,
        deleteTp,
        gradeRecords,
        getGradeRecord,
        updateGradeRecord,
        mergeGradeRecords,
        updateStudentGradeField,
        isRefreshingGrades,
        refreshGradeRecords,
        activeTab,
        setActiveTab,
        selectedSubjectId,
        setSelectedSubjectId,
        selectedSemester,
        setSelectedSemester,
        selectedStudentId,
        setSelectedStudentId,
        rekapMode,
        setRekapMode,
        rekapTesVariant,
        setRekapTesVariant,
        resetToDefaultData,
        exportDataJson,
        importDataJson
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
