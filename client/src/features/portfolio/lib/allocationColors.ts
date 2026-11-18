const FILL = [
  'bg-alloc-1',
  'bg-alloc-2',
  'bg-alloc-3',
  'bg-alloc-4',
  'bg-alloc-5',
]

export function allocationFill(slot: number | null): string {
  return slot === null ? 'bg-muted-foreground' : FILL[slot]
}

// Giá trị CSS cho lát biểu đồ Recharts (thuộc tính fill nhận biến CSS, tự đổi theo theme)
export function allocationColor(slot: number | null): string {
  return slot === null ? 'var(--muted-foreground)' : `var(--alloc-${slot + 1})`
}
