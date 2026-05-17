import { Leaf } from 'lucide-react'
import { cn } from '@/lib/utils'

type BrandMarkProps = {
  className?: string
  iconClassName?: string
}

export function BrandMark({ className, iconClassName }: BrandMarkProps) {
  return (
    <span className={cn('grid size-10 place-items-center rounded-[18px] bg-[#079f6a] text-white shadow-sm', className)}>
      <Leaf aria-hidden="true" className={cn('size-6', iconClassName)} strokeWidth={2.75} />
    </span>
  )
}
