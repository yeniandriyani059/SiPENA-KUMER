import React from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { Navbar } from "./components/Navbar";
import { Dashboard } from "./components/Dashboard";
import { MasterData } from "./components/MasterData";
import { GradeInput } from "./components/GradeInput";
import { PrintReportSubject } from "./components/PrintReportSubject";
import { PrintReportAllSubjects } from "./components/PrintReportAllSubjects";
import { StudentKktpAnalysis } from "./components/StudentKktpAnalysis";
import { AuthPage } from "./components/AuthPage";
import { ActivationPendingScreen } from "./components/ActivationPendingScreen";
import { Loader2 } from "lucide-react";

const MainContent: React.FC = () => {
  const { user, isAccountActive, authLoading, activeTab, schoolSettings } = useApp();

  // Authentication Loading State
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center mb-4">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
        <h2 className="text-lg font-bold text-white tracking-wide">SiPENA Kurmer</h2>
        <p className="text-xs text-indigo-200 mt-1">Memeriksa status otentikasi akun guru...</p>
      </div>
    );
  }

  // Protected Route: If not logged in, show AuthPage only!
  if (!user) {
    return <AuthPage />;
  }

  // Commercial Licensing Gate: If user is logged in but is_active == false, show Activation Pending Screen!
  if (!isAccountActive) {
    return <ActivationPendingScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 print:p-0 print:m-0 print:max-w-none print:w-full">
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "master-data" && <MasterData />}
        {activeTab === "input-nilai" && <GradeInput />}
        {activeTab === "cetak-mapel" && <PrintReportSubject />}
        {activeTab === "rekap-all" && <PrintReportAllSubjects />}
        {activeTab === "analisis-kktp" && <StudentKktpAnalysis />}
      </main>

      <footer className="no-print print:hidden border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <p>
            <strong>SiPENA Kurmer</strong> • Sistem Penilaian & Analisis KKTP Kurikulum Merdeka Sekolah Dasar
          </p>
          <p>
            {schoolSettings.namaSekolah} • Tahun Pelajaran {schoolSettings.tahunPelajaran}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
