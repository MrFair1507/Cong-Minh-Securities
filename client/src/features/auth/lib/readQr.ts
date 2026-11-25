import jsQR from 'jsqr'
import type { CardResult } from './idCard'

// Cạnh dài tối đa khi đọc. Cỡ lớn không thấy mã thì thử cỡ nhỏ (ảnh chụp to thường bị nhiễu).
const READ_SIZES = [1600, 800]

// Đọc mã QR ngay trên trình duyệt, ảnh không gửi đi đâu
export async function readQr(file: File): Promise<CardResult<string>> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return { error: 'IMAGE_UNREADABLE' } // không phải ảnh, dù đuôi file là .png
  }

  try {
    for (const size of READ_SIZES) {
      const image = toImageData(bitmap, size)
      const code = jsQR(image.data, image.width, image.height)
      if (code) return { data: code.data }
    }
    return { error: 'NO_QR' }
  } finally {
    bitmap.close()
  }
}

function toImageData(bitmap: ImageBitmap, maxSize: number) {
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Trình duyệt không hỗ trợ canvas 2D')
  // Nền trắng: ảnh PNG có góc trong suốt sẽ thành đen nếu không tô
  context.fillStyle = '#fff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return context.getImageData(0, 0, canvas.width, canvas.height)
}
