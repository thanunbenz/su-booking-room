// Shared Thai date helpers. Accepts ISO date strings ("YYYY-MM-DD").

const thaiMonthsShort = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
]

/** Full Thai date, e.g. "25 เมษายน 2569". */
export function formatThaiDate(dateString: string): string {
  const d = new Date(dateString)
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Compact date range. Single-day returns formatThaiDate.
 * Same month: "25-27 เม.ย. 2569". Cross-month: "28 เม.ย. - 2 พ.ค. 2569".
 * Cross-year: "28 ธ.ค. 2569 - 2 ม.ค. 2570".
 */
export function formatThaiDateRange(startISO: string, endISO?: string): string {
  if (!endISO || endISO === startISO) return formatThaiDate(startISO)
  const s = new Date(startISO)
  const e = new Date(endISO)
  const sY = s.getFullYear() + 543
  const eY = e.getFullYear() + 543
  const sM = s.getMonth()
  const eM = e.getMonth()
  const sD = s.getDate()
  const eD = e.getDate()
  if (sY === eY && sM === eM) {
    return `${sD}-${eD} ${thaiMonthsShort[sM]} ${sY}`
  }
  if (sY === eY) {
    return `${sD} ${thaiMonthsShort[sM]} - ${eD} ${thaiMonthsShort[eM]} ${sY}`
  }
  return `${sD} ${thaiMonthsShort[sM]} ${sY} - ${eD} ${thaiMonthsShort[eM]} ${eY}`
}

/** Returns true when end date equals start or is missing. */
export function isSingleDay(startISO: string, endISO?: string): boolean {
  return !endISO || endISO === startISO
}
