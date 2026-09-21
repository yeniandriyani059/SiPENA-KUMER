-- ==============================================================================
-- SIPENA (Sistem Penilaian Kurikulum Merdeka)
-- Skrip DDL Database Supabase untuk Tabel Nilai: sipena_nilai
-- ==============================================================================

-- 1. TABEL UTAMA NILAI SISWA TERPADU (sipena_nilai)
CREATE TABLE IF NOT EXISTS public.sipena_nilai (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    siswa_id TEXT NOT NULL,
    mapel_id TEXT NOT NULL,
    bab_id TEXT NOT NULL,
    tp_id TEXT,
    nilai NUMERIC,
    jenis_penilaian TEXT DEFAULT 'formatif_tp',
    semester TEXT DEFAULT '1',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT sipena_nilai_unique_record UNIQUE (user_id, siswa_id, mapel_id, bab_id, jenis_penilaian, semester)
);

-- Indeks untuk optimasi query real-time per guru/user_id
CREATE INDEX IF NOT EXISTS idx_sipena_nilai_user_id ON public.sipena_nilai(user_id);
CREATE INDEX IF NOT EXISTS idx_sipena_nilai_user_mapel ON public.sipena_nilai(user_id, mapel_id, semester);
CREATE INDEX IF NOT EXISTS idx_sipena_nilai_user_siswa ON public.sipena_nilai(user_id, siswa_id);

-- Aktifkan Row Level Security (RLS) untuk isolasi multi-tenant antar guru
ALTER TABLE public.sipena_nilai ENABLE ROW LEVEL SECURITY;

-- Kebijakan akses (RLS Policies)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'sipena_nilai' AND policyname = 'sipena_nilai_user_isolation'
    ) THEN
        CREATE POLICY sipena_nilai_user_isolation ON public.sipena_nilai
            FOR ALL
            USING (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claim.sub', true))
            WITH CHECK (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claim.sub', true));
    END IF;
END
$$;

-- 2. TABEL PENDUKUNG MASTER DATA LAINNYA
CREATE TABLE IF NOT EXISTS public.sipena_users (
    user_id TEXT PRIMARY KEY,
    nama_guru TEXT,
    email TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    expired_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Tabel Pengaturan / Identitas Sekolah Multi-Tenant (sipena_config)
CREATE TABLE IF NOT EXISTS public.sipena_config (
    user_id TEXT PRIMARY KEY,
    nama_sekolah TEXT,
    npsn TEXT,
    alamat TEXT,
    kecamatan TEXT,
    kabupaten TEXT,
    provinsi TEXT,
    kelas TEXT,
    fase TEXT,
    semester TEXT DEFAULT '1',
    tahun_pelajaran TEXT,
    nama_guru TEXT,
    nip_guru TEXT,
    nama_kepsek TEXT,
    nip_kepsek TEXT,
    titimangsa TEXT,
    tanggal_cetak TEXT,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.sipena_config ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'sipena_config' AND policyname = 'sipena_config_user_isolation'
    ) THEN
        CREATE POLICY sipena_config_user_isolation ON public.sipena_config
            FOR ALL
            USING (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claim.sub', true))
            WITH CHECK (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claim.sub', true));
    END IF;
END
$$;

-- Tabel Master Siswa Multi-Tenant (sipena_siswa)
CREATE TABLE IF NOT EXISTS public.sipena_siswa (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    no_induk TEXT,
    nisn TEXT,
    nama_lengkap TEXT,
    jenis_kelamin TEXT DEFAULT 'L',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.sipena_siswa ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'sipena_siswa' AND policyname = 'sipena_siswa_user_isolation'
    ) THEN
        CREATE POLICY sipena_siswa_user_isolation ON public.sipena_siswa
            FOR ALL
            USING (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claim.sub', true))
            WITH CHECK (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claim.sub', true));
    END IF;
END
$$;

-- Tabel Master Mapel & Lingkup Materi / BAB / TP (sipena_mapel)
CREATE TABLE IF NOT EXISTS public.sipena_mapel (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    kode TEXT,
    nama TEXT,
    kktp NUMERIC DEFAULT 75,
    babs JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.sipena_mapel ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'sipena_mapel' AND policyname = 'sipena_mapel_user_isolation'
    ) THEN
        CREATE POLICY sipena_mapel_user_isolation ON public.sipena_mapel
            FOR ALL
            USING (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claim.sub', true))
            WITH CHECK (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claim.sub', true));
    END IF;
END
$$;

-- Selesai! Jalankan skrip ini di SQL Editor dashboard Supabase Anda.
