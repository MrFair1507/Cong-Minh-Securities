import type { ReactNode } from 'react'

type PageHeaderProps = {
  title: string
  description?: string
  actions?: ReactNode
}

// Tiêu đề trang theo khối "Page heading" trong Figma: tiêu đề 24px, mô tả 14px xám, nút bên phải
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="text-2xl leading-8 font-semibold">{title}</h1>
        {description && (
          <p className="text-sm leading-5 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center">{actions}</div>}
    </div>
  )
}
