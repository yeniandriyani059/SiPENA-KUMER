import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { supabase } from "../lib/supabase";
import {
  ShieldAlert,
  MessageCircle,
  LogOut,
  KeyRound,
  Copy,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle
} from "lucide-react";

export const ActivationPendingScreen: React.FC = () => {
  const { user, userProfile, logout, setIsAccountActive, setActiveTab } = useApp();
  const [copied, setCopied] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "warning" | "error";
    message: string;
  } | null>(null);

  // Nomor WhatsApp Admin & template pesan
  const adminWhatsAppNumber = "6285881155514"; // Nomor WA Admin SiPENA Kurmer
  const formattedWaDisplay = "+62 858-8115-5514";

  const namaGuru =
    userProfile?.nama_guru ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Guru";

  const userEmail = user?.email || "";
  const userId = user?.id || "-";

  // URL Direct WhatsApp aktivasi lisensi
  const waLink = `https://wa.me/${adminWhatsAppNumber}?text=Halo%20Admin,%20saya%20ingin%20mengaktifkan%20lisensi%20SiPENA%20Kurmer`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(
      `Permohonan Aktivasi SiPENA Kurmer\nNama: ${namaGuru}\nEmail: ${userEmail}\nID: ${userId}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // 1 & 2. FUNGSI CEK STATUS AKTIVASI BERDASARKAN EMAIL (FORCE FETCH) DAN REDIRECT LANGSUNG
  const handleCheckActivation = async () => {
    if (!userEmail) {
      setFeedback({
        type: "error",
        message: "Email akun tidak ditemukan. Silakan masuk / login ulang."
      });
      return;
    }

    setIsChecking(true);
    setFeedback(null);

    try {
      // 1. Query Supabase mencari berdasarkan email (bukan ID) tanpa cache (force fetch)
      const { data, error } = await supabase
        .from("sipena_users")
        .select("is_active")
        .eq("email", userEmail)
        .setHeader("Cache-Control", "no-cache, no-store, must-revalidate")
        .setHeader("Pragma", "no-cache")
        .single();

      if (error) {
        console.warn("Pengecekan status lisensi Supabase:", error);
        if (error.code === "PGRST116") {
          setFeedback({
            type: "warning",
            message: `Email ${userEmail} belum terdaftar di tabel lisensi SiPENA. Silakan konfirmasi ke Admin via WhatsApp.`
          });
        } else {
          setFeedback({
            type: "error",
            message: `Gagal memeriksa status: ${error.message || "Koneksi bermasalah"}. Silakan coba lagi.`
          });
        }
        return;
      }

      // 2. LOGIKA REDIRECT LANGSUNG:
      // Jika hasil balikan data.is_active bernilai true, langsung set state autentikasi menjadi AKTIF dan segera arahkan ke Dashboard utama secara instan
      if (data && data.is_active) {
        setFeedback({
          type: "success",
          message: "Akun Anda telah AKTIF! Mengarahkan ke Dashboard utama..."
        });

        // Update local storage profile cache
        if (userId && userId !== "-") {
          try {
            const cacheKey = `SIPENA_KURMER_STORAGE_V2_${userId}_profile`;
            const raw = localStorage.getItem(cacheKey);
            const p = raw ? JSON.parse(raw) : {};
            p.is_active = true;
            localStorage.setItem(cacheKey, JSON.stringify(p));
          } catch (e) {}
        }

        // Set state autentikasi aktif & redirect seketika ke Dashboard
        setIsAccountActive(true);
        setActiveTab("dashboard");
      } else {
        setFeedback({
          type: "warning",
          message: "Status akun Anda masih belum aktif. Silakan hubungi Admin via WhatsApp di atas untuk mengaktifkan lisensi."
        });
      }
    } catch (err: any) {
      console.error("Error check activation:", err);
      setFeedback({
        type: "error",
        message: "Terjadi kendala saat memeriksa server lisensi. Silakan periksa koneksi internet Anda."
      });
    } finally {
      setIsChecking(false);
    }
  };

  // 3. LOGIKA TOMBOL KELUAR / GANTI AKUN
  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      // Jalankan supabase.auth.signOut()
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Supabase signOut error:", e);
    }

    // Hapus local state & cached session
    try {
      localStorage.removeItem("SIPENA_DEMO_USER_SESSION");
      if (userId && userId !== "-") {
        localStorage.removeItem(`SIPENA_KURMER_STORAGE_V2_${userId}_profile`);
        localStorage.removeItem(`SIPENA_KURMER_STORAGE_V2_${userId}_school`);
      }
    } catch (e) {}

    // Jalankan context logout untuk reset state dan kembalikan ke layar Login
    await logout();
    setIsLoggingOut(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100 relative overflow-hidden">
      {/* Background Decorative Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-xl w-full relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 shadow-xl shadow-amber-500/30 text-white mb-3 ring-1 ring-amber-400/40">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Akun Anda Belum Aktif
          </h1>
          <p className="mt-1 text-sm text-indigo-200">
            Verifikasi Lisensi Komersial Aplikasi SiPENA Kurmer
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-100">
          {/* Status Box */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0 mt-0.5">
                <Clock className="w-5 h-5" />
              </div>
              <div className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                <p className="font-bold text-amber-900 text-sm mb-1">
                  Menunggu Konfirmasi Aktivasi Admin
                </p>
                Akun Anda telah terdaftar di sistem. Untuk menjaga keaslian lisensi dan hak penggunaan resmi aplikasi <strong>SiPENA Kurmer</strong>, akun Anda memerlukan persetujuan aktivasi dari Administrator.
              </div>
            </div>
          </div>

          {/* User Account Info Details */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-xs sm:text-sm space-y-2">
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Nama Guru</span>
              <span className="font-semibold text-slate-800">{namaGuru}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Email Akun</span>
              <span className="font-mono font-medium text-slate-800">{userEmail}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">Status Lisensi</span>
              <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                Belum Aktif (Non-Active)
              </span>
            </div>
          </div>

          {/* Action Callouts */}
          <div className="space-y-3 mb-6">
            <a
              id="btn-contact-whatsapp-admin"
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              <span>Hubungi Admin via WhatsApp ({formattedWaDisplay})</span>
            </a>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-copy-account-info"
                onClick={copyToClipboard}
                className="inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-xs font-semibold text-slate-700 transition cursor-pointer"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">Info Disalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-500" />
                    <span>Salin Info Akun</span>
                  </>
                )}
              </button>

              <button
                type="button"
                id="btn-check-activation-status"
                onClick={handleCheckActivation}
                disabled={isChecking}
                className="inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 active:bg-indigo-200 text-xs font-semibold text-indigo-800 transition cursor-pointer disabled:opacity-60"
              >
                {isChecking ? (
                  <>
                    <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                    <span>Memeriksa...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4 text-indigo-600" />
                    <span>Cek Status Aktivasi</span>
                  </>
                )}
              </button>
            </div>

            {/* 3. TOMBOL BARU "Keluar / Ganti Akun" DIPOSISIKAN DI BAWAH TOMBOL CEK STATUS */}
            <button
              type="button"
              id="btn-logout-switch-account"
              onClick={handleSignOut}
              disabled={isLoggingOut}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-rose-200 bg-rose-50/80 hover:bg-rose-100 active:bg-rose-200/90 text-rose-700 font-semibold text-xs sm:text-sm transition cursor-pointer disabled:opacity-60"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="w-4 h-4 text-rose-600 animate-spin" />
                  <span>Sedang Keluar Akun...</span>
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>Keluar / Ganti Akun</span>
                </>
              )}
            </button>
          </div>

          {/* Feedback message banner if checking status */}
          {feedback && (
            <div
              id="activation-feedback-banner"
              className={`mb-6 p-3.5 rounded-xl text-xs sm:text-sm border flex items-start gap-2.5 transition-all ${
                feedback.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : feedback.type === "warning"
                  ? "bg-amber-50 border-amber-200 text-amber-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <div className="leading-relaxed font-medium">{feedback.message}</div>
            </div>
          )}

          {/* Instruction Note */}
          <div className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-100 pt-4">
            <p className="font-semibold text-slate-700 mb-1">💡 Langkah Aktivasi:</p>
            <ol className="list-decimal list-inside space-y-1 text-slate-600">
              <li>Klik tombol hijau di atas untuk terhubung langsung ke Admin via WhatsApp.</li>
              <li>Kirim pesan konfirmasi aktivasi lisensi SiPENA Kurmer.</li>
              <li>Setelah Admin mengaktifkan akun Anda, klik <strong>"Cek Status Aktivasi"</strong> untuk langsung mengakses Dashboard utama secara instan.</li>
              <li>Jika perlu me-refresh sesi atau beralih ke akun lain, gunakan tombol <strong>"Keluar / Ganti Akun"</strong>.</li>
            </ol>
          </div>

          {/* Footer Info */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">SiPENA Kurmer v2.5</span>
            <span className="text-[11px] text-slate-400">Lisensi Resmi Sekolah Dasar</span>
          </div>
        </div>
      </div>
    </div>
  );
};
