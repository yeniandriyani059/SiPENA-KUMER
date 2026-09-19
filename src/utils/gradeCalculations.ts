import { StudentGradeRecord, KktpIntervalEvaluation } from "../types";

/**
 * Calculates average of array of numbers, ignoring null, undefined, or NaN.
 * Returns null if no valid numbers are provided to avoid #DIV/0!
 */
export function safeAverage(values: (number | null | undefined)[]): number | null {
  const valid = values.filter((v): v is number => typeof v === "number" && !isNaN(v) && v >= 0);
  if (valid.length === 0) return null;
  const sum = valid.reduce((acc, curr) => acc + curr, 0);
  return Math.round((sum / valid.length) * 10) / 10;
}

/**
 * Evaluate score against standard Kurikulum Merdeka KKTP Intervals
 */
export function evaluateKktpInterval(score: number | null): KktpIntervalEvaluation | null {
  if (score === null || isNaN(score)) return null;

  if (score <= 40) {
    return {
      score,
      kriteria: "BT",
      intervensi: "Remedial di seluruh bagian",
      level: "0-40"
    };
  } else if (score <= 69) {
    return {
      score,
      kriteria: "BT",
      intervensi: "Remedial di bagian yang diperlukan",
      level: "41-69"
    };
  } else if (score <= 85) {
    return {
      score,
      kriteria: "T",
      intervensi: "Tidak perlu remedial",
      level: "70-85"
    };
  } else {
    return {
      score,
      kriteria: "T",
      intervensi: "Diberikan pengayaan atau tantangan lebih",
      level: "86-100"
    };
  }
}

/**
 * Calculates all summary grades for a single student record
 */
export function calculateStudentGrades(
  record: StudentGradeRecord | undefined,
  kktp: number,
  activeTpIds?: string[],
  activeBabIds?: string[]
) {
  if (!record) {
    return {
      avgFormatifTP: null,
      avgFormatifAll: null,
      avgSumatifLM: null,
      avgAsts: null,
      avgAsas: null,
      nilaiAkhir: null,
      ketuntasan: "-",
      isTuntas: false
    };
  }

  // 1. Formatif TP Average (Hanya TP aktif yang valid milik mata pelajaran)
  const tpValues = activeTpIds
    ? activeTpIds.map((id) => record.formatif?.tpScores[id])
    : Object.values(record.formatif?.tpScores || {});
  const avgFormatifTP = safeAverage(tpValues);

  // Formatif overall including UH, Tugas, Praktik
  const allFormatifValues = [
    ...tpValues,
    record.formatif?.ulanganHarian,
    record.formatif?.tugasRutin,
    record.formatif?.praktikProyek
  ];
  const avgFormatifAll = safeAverage(allFormatifValues);

  // 2. Sumatif Lingkup Materi BAB (Hanya BAB aktif milik mata pelajaran)
  const babValues = activeBabIds
    ? activeBabIds.map((id) => record.sumatif?.babScores[id])
    : Object.values(record.sumatif?.babScores || {});
  const avgSumatifLM = safeAverage(babValues);

  // 3. ASTS (Tengah Semester)
  const astsValues = [record.sumatif?.astsNonTes, record.sumatif?.astsTes];
  const avgAsts = safeAverage(astsValues);

  // 4. ASAS (Akhir Semester)
  const asasValues = [record.sumatif?.asasNonTes, record.sumatif?.asasTes];
  const avgAsas = safeAverage(asasValues);

  // 5. Nilai Akhir (N/A)
  // Standard weighted calculation if all present:
  // (avgSumatifLM * 2 + avgAsts + avgAsas) / 4
  // If some are empty, dynamically weight based on available components without #DIV/0!
  let nilaiAkhir: number | null = null;
  const components: { val: number; weight: number }[] = [];

  if (avgSumatifLM !== null) components.push({ val: avgSumatifLM, weight: 2 });
  if (avgAsts !== null) components.push({ val: avgAsts, weight: 1 });
  if (avgAsas !== null) components.push({ val: avgAsas, weight: 1 });

  if (components.length > 0) {
    const totalWeighted = components.reduce((acc, c) => acc + c.val * c.weight, 0);
    const totalWeight = components.reduce((acc, c) => acc + c.weight, 0);
    nilaiAkhir = totalWeight > 0 ? Math.round((totalWeighted / totalWeight) * 10) / 10 : null;
  } else if (avgFormatifAll !== null) {
    // Fallback if only formatif is available
    nilaiAkhir = avgFormatifAll;
  }

  const isTuntas = nilaiAkhir !== null ? nilaiAkhir >= kktp : false;
  const ketuntasan = nilaiAkhir !== null ? (isTuntas ? "TUNTAS" : "BELUM TUNTAS") : "-";

  return {
    avgFormatifTP,
    avgFormatifAll,
    avgSumatifLM,
    avgAsts,
    avgAsas,
    nilaiAkhir,
    ketuntasan,
    isTuntas
  };
}
