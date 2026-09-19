import React from "react";
import { SchoolSettings } from "../types";

interface SignatureBlockProps {
  settings: SchoolSettings;
  includeParent?: boolean;
}

export const SignatureBlock: React.FC<SignatureBlockProps> = ({ settings, includeParent = false }) => {
  return (
    <div className="mt-8 pt-4 break-inside-avoid text-xs sm:text-sm text-slate-800">
      <div className="flex justify-between items-start gap-8">
        {/* Kepala Sekolah or Left side */}
        <div className="text-center min-w-[220px]">
          <p className="font-medium text-slate-700">Mengetahui,</p>
          <p className="font-semibold text-slate-900">Kepala {settings.namaSekolah}</p>
          <div className="h-20 sm:h-24"></div>
          <p className="font-bold underline text-slate-950 uppercase">{settings.namaKepsek}</p>
          <p className="text-slate-600">NIP. {settings.nipKepsek}</p>
        </div>

        {/* Optional Parent Column */}
        {includeParent && (
          <div className="text-center min-w-[200px]">
            <p className="font-medium text-slate-700">Mengetahui,</p>
            <p className="font-semibold text-slate-900">Orang Tua / Wali Siswa</p>
            <div className="h-20 sm:h-24"></div>
            <p className="font-bold text-slate-950">( ........................................ )</p>
          </div>
        )}

        {/* Guru Kelas / Right side */}
        <div className="text-center min-w-[220px]">
          <p className="text-slate-700">
            {settings.titimangsa}, {settings.tanggalCetak}
          </p>
          <p className="font-semibold text-slate-900">Guru Kelas {settings.kelas}</p>
          <div className="h-20 sm:h-24"></div>
          <p className="font-bold underline text-slate-950 uppercase">{settings.namaGuru}</p>
          <p className="text-slate-600">NIP. {settings.nipGuru}</p>
        </div>
      </div>
    </div>
  );
};
