'use client'

// src/components/reteach/reteach-qr-code.tsx
// G5: QR code component for print packages — uses qr-server.com API (no package needed)
// Rendered in print view only (hidden on screen with print:block / screen:hidden classes)

interface ReteachQrCodeProps {
  sessionId:  string
  baseUrl?:   string  // e.g. "https://app.mirrorintelligence.com"
  size?:      number  // px, default 96
}

export function ReteachQrCode({
  sessionId,
  baseUrl = '',
  size = 96,
}: ReteachQrCodeProps) {
  const targetUrl  = `${baseUrl}/dashboard/reteach/sessions/${sessionId}`
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(targetUrl)}&format=svg`

  return (
    <div className="print-only hidden flex flex-col items-center gap-1">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qrImageUrl}
        alt={`QR code for session ${sessionId}`}
        width={size}
        height={size}
        className="rounded"
      />
      <p className="text-[8pt] text-muted-foreground text-center">
        Scan to open session
      </p>
    </div>
  )
}
