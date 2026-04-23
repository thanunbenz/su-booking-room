import { bookingApi } from '@/lib/api/client'

export type PDFStyle = 'notice' | 'report'

export interface PDFOptions {
  style?: PDFStyle
  showFooter?: boolean
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** Download a single booking's PDF and save it. */
export async function downloadBookingPDF(id: number, opts?: PDFOptions): Promise<void> {
  const blob = await bookingApi.downloadPDF(id, opts)
  triggerDownload(blob, `booking-${id}.pdf`)
}

/** Download multiple bookings (by ids) as one PDF. */
export async function downloadBookingsByIds(
  ids: number[],
  opts?: PDFOptions
): Promise<void> {
  if (ids.length === 0) return
  const blob = await bookingApi.downloadBatchPDF({ ids, ...opts })
  const suffix = opts?.style === 'report' ? 'report' : 'notices'
  triggerDownload(blob, `bookings-${suffix}-${new Date().toISOString().slice(0, 10)}.pdf`)
}

/** Download all bookings matching a filter as one PDF. */
export async function downloadBookingsByFilter(
  filter: { status?: string; room_id?: number; booking_date?: string },
  opts?: PDFOptions
): Promise<void> {
  const blob = await bookingApi.downloadBatchPDF({ filter, ...opts })
  const suffix = opts?.style === 'report' ? 'report' : 'notices'
  triggerDownload(blob, `bookings-${suffix}-${new Date().toISOString().slice(0, 10)}.pdf`)
}
