import { cn } from 'cn'
import { useEffect, useRef, useState } from 'react'

type Flash = 'up' | 'down' | null

// Nhớ giá trị trước; khi giá trị đổi thì nháy nền xanh (tăng) hoặc đỏ (giảm) khoảng 0,8 giây
function useFlash(value: number | undefined): Flash {
  const previous = useRef(value)
  const [flash, setFlash] = useState<Flash>(null)

  useEffect(() => {
    const before = previous.current
    previous.current = value
    if (value === undefined || before === undefined || value === before) return
    setFlash(value > before ? 'up' : 'down')
    const id = setTimeout(() => setFlash(null), 800)
    return () => clearTimeout(id)
  }, [value])

  return flash
}

type BoardValueProps = {
  value: number | undefined
  text: string
  className?: string
}

export function BoardValue({ value, text, className }: BoardValueProps) {
  const flash = useFlash(value)
  return (
    <span
      className={cn(
        'block px-1.5 py-1 text-right motion-reduce:animate-none',
        flash === 'up' && 'animate-flash-up',
        flash === 'down' && 'animate-flash-down',
        className,
      )}
    >
      {text}
    </span>
  )
}
