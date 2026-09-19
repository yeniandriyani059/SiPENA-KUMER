import { SchoolSettings, Student, Subject, StudentGradeRecord } from "../types";

export const initialSchoolSettings: SchoolSettings = {
  namaSekolah: "SDN KARANGGINTUNG 06",
  npsn: "20302145",
  alamat: "Jl. Pendidikan No. 6, Karanggintung",
  kecamatan: "Sumbang",
  kabupaten: "Banyumas",
  provinsi: "Jawa Tengah",
  kelas: "IV (Empat)",
  fase: "Fase B",
  semester: "1",
  tahunPelajaran: "2025/2026",
  namaGuru: "Siti Rahmawati, S.Pd.SD",
  nipGuru: "19880412 201101 2 015",
  namaKepsek: "Drs. H. Bambang Subagyo, M.Pd.",
  nipKepsek: "19720315 199703 1 004",
  titimangsa: "Karanggintung",
  tanggalCetak: "20 Desember 2025"
};

export const initialStudents: Student[] = [
  { id: "std-1", noInduk: "2101", nisn: "0134567801", nama: "Ahmad Rizky Pratama", jenisKelamin: "L" },
  { id: "std-2", noInduk: "2102", nisn: "0134567802", nama: "Anindita Putri Maharani", jenisKelamin: "P" },
  { id: "std-3", noInduk: "2103", nisn: "0134567803", nama: "Bagus Dwi Saputra", jenisKelamin: "L" },
  { id: "std-4", noInduk: "2104", nisn: "0134567804", nama: "Cantika Dewi Lestari", jenisKelamin: "P" },
  { id: "std-5", noInduk: "2105", nisn: "0134567805", nama: "Dafi Muhammad Fajar", jenisKelamin: "L" },
  { id: "std-6", noInduk: "2106", nisn: "0134567806", nama: "Fatimah Azzahra", jenisKelamin: "P" },
  { id: "std-7", noInduk: "2107", nisn: "0134567807", nama: "Galang Surya Kencana", jenisKelamin: "L" },
  { id: "std-8", noInduk: "2108", nisn: "0134567808", nama: "Hana Nur Aini", jenisKelamin: "P" },
  { id: "std-9", noInduk: "2109", nisn: "0134567809", nama: "Irfan Maulana Hakim", jenisKelamin: "L" },
  { id: "std-10", noInduk: "2110", nisn: "0134567810", nama: "Kaila Citra Amelia", jenisKelamin: "P" },
  { id: "std-11", noInduk: "2111", nisn: "0134567811", nama: "Latief Bagas Wicaksono", jenisKelamin: "L" },
  { id: "std-12", noInduk: "2112", nisn: "0134567812", nama: "Nadira Kayla Shafa", jenisKelamin: "P" },
  { id: "std-13", noInduk: "2113", nisn: "0134567813", nama: "Rafa Aditya Nugraha", jenisKelamin: "L" },
  { id: "std-14", noInduk: "2114", nisn: "0134567814", nama: "Salma Aulia Ramadhani", jenisKelamin: "P" },
  { id: "std-15", noInduk: "2115", nisn: "0134567815", nama: "Yusuf Al-Farizi", jenisKelamin: "L" }
];

export const initialSubjects: Subject[] = [
  {
    id: "sub-pabp",
    kode: "PABP",
    nama: "Pendidikan Agama & Budi Pekerti",
    kktp: 75,
    babs: [
      {
        id: "pabp-b1",
        nama: "BAB I",
        judul: "Membaca Al-Qur'an dan Meneladani Asmaul Husna",
        tps: [
          { id: "tp-pabp-1", kode: "TP 1", deskripsi: "Membaca surah pendek Al-Hujurat ayat 13 dengan tartil", babId: "pabp-b1" },
          { id: "tp-pabp-2", kode: "TP 2", deskripsi: "Menjelaskan arti lima Asmaul Husna: Al-Malik, Al-Aziz, Al-Quddus, As-Salam, Al-Mu'min", babId: "pabp-b1" }
        ]
      },
      {
        id: "pabp-b2",
        nama: "BAB II",
        judul: "Teladan Mulia Para Rasul",
        tps: [
          { id: "tp-pabp-3", kode: "TP 3", deskripsi: "Meneladani perilaku siddiq, amanah, fathanah, dan tabligh", babId: "pabp-b2" },
          { id: "tp-pabp-4", kode: "TP 4", deskripsi: "Menceritakan kisah Nabi Muhammad SAW dalam membangun kerukunan", babId: "pabp-b2" }
        ]
      },
      {
        id: "pabp-b3",
        nama: "BAB III",
        judul: "Indahnya Keragaman dalam Islam",
        tps: [
          { id: "tp-pabp-5", kode: "TP 5", deskripsi: "Menjelaskan pentingnya saling menghargai perbedaan ras dan suku", babId: "pabp-b3" }
        ]
      },
      {
        id: "pabp-b4",
        nama: "BAB IV",
        judul: "Tanda-Tanda Usia Baligh",
        tps: [
          { id: "tp-pabp-6", kode: "TP 6", deskripsi: "Menyebutkan tanda-tanda baligh menurut ilmu fikih dan ilmu biologi", babId: "pabp-b4" }
        ]
      }
    ]
  },
  {
    id: "sub-pp",
    kode: "PP",
    nama: "Pendidikan Pancasila",
    kktp: 75,
    babs: [
      {
        id: "pp-b1",
        nama: "BAB I",
        judul: "Pancasila Sebagai Panduan Hidup",
        tps: [
          { id: "tp-pp-1", kode: "TP 1", deskripsi: "Menerapkan nilai ketuhanan dan kemanusiaan dalam lingkungan sekolah", babId: "pp-b1" },
          { id: "tp-pp-2", kode: "TP 2", deskripsi: "Membiasakan sikap gotong royong dalam menyelesaikan tugas kelompok", babId: "pp-b1" }
        ]
      },
      {
        id: "pp-b2",
        nama: "BAB II",
        judul: "Konstitusi dan Norma di Masyarakat",
        tps: [
          { id: "tp-pp-3", kode: "TP 3", deskripsi: "Mengidentifikasi norma agama, kesusilaan, kesopanan, dan hukum", babId: "pp-b2" },
          { id: "tp-pp-4", kode: "TP 4", deskripsi: "Melaksanakan hak dan kewajiban sebagai anggota keluarga dan warga sekolah", babId: "pp-b2" }
        ]
      },
      {
        id: "pp-b3",
        nama: "BAB III",
        judul: "Membangun Jati Diri dalam Kebinekaan",
        tps: [
          { id: "tp-pp-5", kode: "TP 5", deskripsi: "Menghargai keragaman suku, bahasa daerah, dan pakaian adat di Indonesia", babId: "pp-b3" }
        ]
      },
      {
        id: "pp-b4",
        nama: "BAB IV",
        judul: "Negaraku Indonesia Tercinta",
        tps: [
          { id: "tp-pp-6", kode: "TP 6", deskripsi: "Mengenal susunan pemerintahan desa/kelurahan dan kecamatan", babId: "pp-b4" }
        ]
      }
    ]
  },
  {
    id: "sub-bi",
    kode: "BI",
    nama: "Bahasa Indonesia",
    kktp: 70,
    babs: [
      {
        id: "bi-b1",
        nama: "BAB I",
        judul: "Sudah Besar (Cerita Fiksi & Pengalaman)",
        tps: [
          { id: "tp-bi-1", kode: "TP 1", deskripsi: "Menemukan gagasan pokok dan kosakata baru dalam teks narasi", babId: "bi-b1" },
          { id: "tp-bi-2", kode: "TP 2", deskripsi: "Menulis kalimat transitif dan intransitif dengan tepat", babId: "bi-b1" }
        ]
      },
      {
        id: "bi-b2",
        nama: "BAB II",
        judul: "Di Bawah Atap (Tugas dan Tanggung Jawab)",
        tps: [
          { id: "tp-bi-3", kode: "TP 3", deskripsi: "Membaca teks deskriptif dan mengidentifikasi kata berawalan 'me-'", babId: "bi-b2" },
          { id: "tp-bi-4", kode: "TP 4", deskripsi: "Menulis paragraf deskriptif tentang tugas harian di rumah", babId: "bi-b2" }
        ]
      },
      {
        id: "bi-b3",
        nama: "BAB III",
        judul: "Lihat Sekitar (Rambu dan Petunjuk Arah)",
        tps: [
          { id: "tp-bi-5", kode: "TP 5", deskripsi: "Menjelaskan arti rambu-rambu lalu lintas dan petunjuk arah visual", babId: "bi-b3" },
          { id: "tp-bi-6", kode: "TP 6", deskripsi: "Menulis teks prosedur sederhana dengan konjungsi urutan", babId: "bi-b3" }
        ]
      },
      {
        id: "bi-b4",
        nama: "BAB IV",
        judul: "Meliuk dan Menerjang (Wawancara & Laporan)",
        tps: [
          { id: "tp-bi-7", kode: "TP 7", deskripsi: "Mengidentifikasi majas personifikasi dalam puisi anak", babId: "bi-b4" },
          { id: "tp-bi-8", kode: "TP 8", deskripsi: "Melakukan wawancara dan menyusun catatan hasil wawancara", babId: "bi-b4" }
        ]
      }
    ]
  },
  {
    id: "sub-mtk",
    kode: "MTK",
    nama: "Matematika",
    kktp: 70,
    babs: [
      {
        id: "mtk-b1",
        nama: "BAB I",
        judul: "Bilangan Cacah Sampai 10.000",
        tps: [
          { id: "tp-mtk-1", kode: "TP 1", deskripsi: "Membaca, menulis, dan menentukan nilai tempat bilangan hingga 10.000", babId: "mtk-b1" },
          { id: "tp-mtk-2", kode: "TP 2", deskripsi: "Melakukan operasi penjumlahan dan pengurangan bilangan cacah besar", babId: "mtk-b1" }
        ]
      },
      {
        id: "mtk-b2",
        nama: "BAB II",
        judul: "Pecahan Senilai dan Operasinya",
        tps: [
          { id: "tp-mtk-3", kode: "TP 3", deskripsi: "Menentukan pecahan senilai menggunakan representasi gambar", babId: "mtk-b2" },
          { id: "tp-mtk-4", kode: "TP 4", deskripsi: "Mengurutkan dan membandingkan pecahan berpenyebut sama", babId: "mtk-b2" }
        ]
      },
      {
        id: "mtk-b3",
        nama: "BAB III",
        judul: "Pola Gambar dan Pola Bilangan",
        tps: [
          { id: "tp-mtk-5", kode: "TP 5", deskripsi: "Mengidentifikasi dan melanjutkan pola bilangan membesar dan mengecil", babId: "mtk-b3" }
        ]
      },
      {
        id: "mtk-b4",
        nama: "BAB IV",
        judul: "Pengukuran Luas dan Volume",
        tps: [
          { id: "tp-mtk-6", kode: "TP 6", deskripsi: "Menghitung luas daerah menggunakan satuan baku dan tak baku", babId: "mtk-b4" }
        ]
      }
    ]
  },
  {
    id: "sub-ipas",
    kode: "IPAS",
    nama: "Ilmu Pengetahuan Alam & Sosial",
    kktp: 72,
    babs: [
      {
        id: "ipas-b1",
        nama: "BAB I",
        judul: "Tumbuhan, Sumber Kehidupan di Bumi",
        tps: [
          { id: "tp-ipas-1", kode: "TP 1", deskripsi: "Mengidentifikasi bagian tubuh tumbuhan dan fungsinya (akar, batang, daun)", babId: "ipas-b1" },
          { id: "tp-ipas-2", kode: "TP 2", deskripsi: "Menjelaskan proses fotosintesis dan dampaknya bagi makhluk hidup", babId: "ipas-b1" }
        ]
      },
      {
        id: "ipas-b2",
        nama: "BAB II",
        judul: "Wujud Zat dan Perubahannya",
        tps: [
          { id: "tp-ipas-3", kode: "TP 3", deskripsi: "Mengenali materi dan karakteristik wujud padat, cair, dan gas", babId: "ipas-b2" },
          { id: "tp-ipas-4", kode: "TP 4", deskripsi: "Mendemonstrasikan proses mencair, membeku, menguap, dan mengembun", babId: "ipas-b2" }
        ]
      },
      {
        id: "ipas-b3",
        nama: "BAB III",
        judul: "Gaya di Sekitar Kita",
        tps: [
          { id: "tp-ipas-5", kode: "TP 5", deskripsi: "Memanfaatkan gaya otot, gaya gesek, gaya magnet, dan gaya gravitasi", babId: "ipas-b3" }
        ]
      },
      {
        id: "ipas-b4",
        nama: "BAB IV",
        judul: "Mengubah Bentuk Energi",
        tps: [
          { id: "tp-ipas-6", kode: "TP 6", deskripsi: "Mengidentifikasi ragam transformasi energi dalam peralatan sehari-hari", babId: "ipas-b4" }
        ]
      }
    ]
  },
  {
    id: "sub-sbdp",
    kode: "SBDP",
    nama: "Seni Budaya & Prakarya",
    kktp: 75,
    babs: [
      {
        id: "sbdp-b1",
        nama: "BAB I",
        judul: "Menggambar Rumah Tetangga",
        tps: [
          { id: "tp-sbdp-1", kode: "TP 1", deskripsi: "Mengenal unsur seni rupa garis, bidang, warna, dan tekstur", babId: "sbdp-b1" }
        ]
      },
      {
        id: "sbdp-b2",
        nama: "BAB II",
        judul: "Daur Ulang Sampah Plastik",
        tps: [
          { id: "tp-sbdp-2", kode: "TP 2", deskripsi: "Merancang karya seni kriya dari limbah plastik bekas", babId: "sbdp-b2" }
        ]
      },
      {
        id: "sbdp-b3",
        nama: "BAB III",
        judul: "Eksplorasi Tekstur dan Garis",
        tps: [
          { id: "tp-sbdp-3", kode: "TP 3", deskripsi: "Membuat cetak tinggi / frottage menggunakan aneka permukaan alam", babId: "sbdp-b3" }
        ]
      },
      {
        id: "sbdp-b4",
        nama: "BAB IV",
        judul: "Membuat Wayang Kertas",
        tps: [
          { id: "tp-sbdp-4", kode: "TP 4", deskripsi: "Membuat wayang karton sederhana dengan karakter lokal", babId: "sbdp-b4" }
        ]
      }
    ]
  },
  {
    id: "sub-pjok",
    kode: "PJOK",
    nama: "Pendidikan Jasmani, Olahraga & Kesehatan",
    kktp: 75,
    babs: [
      {
        id: "pjok-b1",
        nama: "BAB I",
        judul: "Variasi Pola Gerak Dasar Lokomotor",
        tps: [
          { id: "tp-pjok-1", kode: "TP 1", deskripsi: "Mempraktikkan variasi jalan, lari, dan lompat pada permainan kasti", babId: "pjok-b1" }
        ]
      },
      {
        id: "pjok-b2",
        nama: "BAB II",
        judul: "Aktivitas Senam Lantai",
        tps: [
          { id: "tp-pjok-2", kode: "TP 2", deskripsi: "Mempraktikkan gerak bertumpu, guling depan, dan keseimbangan", babId: "pjok-b2" }
        ]
      },
      {
        id: "pjok-b3",
        nama: "BAB III",
        judul: "Aktivitas Kebugaran Jasmani",
        tps: [
          { id: "tp-pjok-3", kode: "TP 3", deskripsi: "Melakukan latihan daya tahan dan kelenturan tubuh", babId: "pjok-b3" }
        ]
      },
      {
        id: "pjok-b4",
        nama: "BAB IV",
        judul: "Kesehatan Pribadi dan Lingkungan",
        tps: [
          { id: "tp-pjok-4", kode: "TP 4", deskripsi: "Menjelaskan cara memelihara kebersihan alat reproduksi dan lingkungan", babId: "pjok-b4" }
        ]
      }
    ]
  },
  {
    id: "sub-bjawa",
    kode: "BJ",
    nama: "Bahasa Jawa (Muatan Lokal)",
    kktp: 70,
    babs: [
      {
        id: "bj-b1",
        nama: "BAB I",
        judul: "Geguritan & Tembang Dolanan",
        tps: [
          { id: "tp-bj-1", kode: "TP 1", deskripsi: "Maca geguritan kanthi lafal, intonasi, lan ekspresi kang trep", babId: "bj-b1" }
        ]
      },
      {
        id: "bj-b2",
        nama: "BAB II",
        judul: "Cerita Wayang Pandhawa",
        tps: [
          { id: "tp-bj-2", kode: "TP 2", deskripsi: "Ngidentifikasi watak lan silsilah satriya Pandhawa Lima", babId: "bj-b2" }
        ]
      },
      {
        id: "bj-b3",
        nama: "BAB III",
        judul: "Unggah-Ungguh Basa",
        tps: [
          { id: "tp-bj-3", kode: "TP 3", deskripsi: "Nrapake basa Ngoko lan Krama Alus nalika matur marang wong tuwa", babId: "bj-b3" }
        ]
      },
      {
        id: "bj-b4",
        nama: "BAB IV",
        judul: "Aksara Jawa Legena",
        tps: [
          { id: "tp-bj-4", kode: "TP 4", deskripsi: "Maca lan nulis aksara Jawa legena kanthi sandhangan swara", babId: "bj-b4" }
        ]
      }
    ]
  },
  {
    id: "sub-bing",
    kode: "Bing",
    nama: "Bahasa Inggris",
    kktp: 70,
    babs: [
      {
        id: "bing-b1",
        nama: "BAB I",
        judul: "What are You Doing? (Activities)",
        tps: [
          { id: "tp-bing-1", kode: "TP 1", deskripsi: "Express present continuous activities using correct verbs", babId: "bing-b1" }
        ]
      },
      {
        id: "bing-b2",
        nama: "BAB II",
        judul: "Numbers and Counting 50-100",
        tps: [
          { id: "tp-bing-2", kode: "TP 2", deskripsi: "Identify and pronounce cardinal numbers up to 100", babId: "bing-b2" }
        ]
      },
      {
        id: "bing-b3",
        nama: "BAB III",
        judul: "Rooms in My House",
        tps: [
          { id: "tp-bing-3", kode: "TP 3", deskripsi: "Describe objects and rooms in a house with prepositions", babId: "bing-b3" }
        ]
      },
      {
        id: "bing-b4",
        nama: "BAB IV",
        judul: "Daily Routines",
        tps: [
          { id: "tp-bing-4", kode: "TP 4", deskripsi: "Tell time and talk about daily morning/evening habits", babId: "bing-b4" }
        ]
      }
    ]
  }
];

// Helper to seed realistic grades for demo
export function generateInitialGradeRecords(): StudentGradeRecord[] {
  const records: StudentGradeRecord[] = [];

  // Pre-configured baseline scores for each student to make data realistic and varied
  const studentProfiles: Record<string, { base: number; p5: string }> = {
    "std-1": { base: 84, p5: "Sangat aktif dalam diskusi gotong royong dan bernalar kritis." },
    "std-2": { base: 92, p5: "Menunjukkan kemandirian tinggi, kreatif, dan budi pekerti luhur." },
    "std-3": { base: 78, p5: "Cukup tekun, perlu bimbingan dalam penguatan bernalar kritis." },
    "std-4": { base: 88, p5: "Sangat baik dalam kebhinekaan global dan kerjasama tim." },
    "std-5": { base: 66, p5: "Perlu motivasi belajar mandiri dan pendampingan fokus tugas." },
    "std-6": { base: 95, p5: "Prestasi sangat memuaskan, akhlak mulia dan kepemimpinan menonjol." },
    "std-7": { base: 72, p5: "Disiplin hadir, perlu peningkatan pemahaman konsep analitis." },
    "std-8": { base: 82, p5: "Kreatif dalam karya proyek, selalu bersikap ramah dan santun." },
    "std-9": { base: 68, p5: "Membutuhkan pengulangan materi hitung dan remedial berkala." },
    "std-10": { base: 86, p5: "Rapi dalam pengerjaan buku tugas dan aktif bertanya di kelas." },
    "std-11": { base: 74, p5: "Cukup baik, motivasi terus meningkat dalam unjuk kerja." },
    "std-12": { base: 90, p5: "Pemahaman materi cepat, sering membantu teman yang kesulitan." },
    "std-13": { base: 80, p5: "Menunjukkan rasa ingin tahu yang besar saat eksperimen praktik." },
    "std-14": { base: 85, p5: "Konsisten dan tekun, akhlak terpuji terhadap guru dan teman." },
    "std-15": { base: 70, p5: "Perlu bimbingan intensif dalam literasi dan pemahaman teks." }
  };

  initialStudents.forEach((student, sIdx) => {
    initialSubjects.forEach((subject, subIdx) => {
      const profile = studentProfiles[student.id] || { base: 75, p5: "Berkembang sesuai harapan." };
      // add minor deterministic variation based on student & subject index
      const variation = ((sIdx * 3 + subIdx * 5) % 11) - 5;
      const targetScore = Math.min(98, Math.max(55, profile.base + variation));

      // Build Formatif TP scores
      const tpScores: Record<string, number | null> = {};
      subject.babs.forEach((bab) => {
        bab.tps.forEach((tp, tpIdx) => {
          const tpScore = Math.min(100, Math.max(40, targetScore + ((tpIdx % 3) - 1) * 3));
          tpScores[tp.id] = tpScore;
        });
      });

      // Sumatif scores per BAB
      const babScores: Record<string, number | null> = {};
      subject.babs.forEach((bab, bIdx) => {
        const bScore = Math.min(100, Math.max(45, targetScore + ((bIdx % 2) === 0 ? 2 : -2)));
        babScores[bab.id] = bScore;
      });

      const astsNonTes = Math.min(100, Math.max(50, targetScore + 1));
      const astsTes = Math.min(100, Math.max(45, targetScore - 1));
      const asasNonTes = Math.min(100, Math.max(50, targetScore + 2));
      const asasTes = Math.min(100, Math.max(45, targetScore));

      records.push({
        studentId: student.id,
        subjectId: subject.id,
        semester: "1",
        formatif: {
          tpScores,
          ulanganHarian: targetScore,
          tugasRutin: Math.min(100, targetScore + 3),
          praktikProyek: Math.min(100, targetScore + 2),
          catatanP5: profile.p5
        },
        sumatif: {
          babScores,
          astsNonTes,
          astsTes,
          asasNonTes,
          asasTes
        }
      });
    });
  });

  return records;
}
