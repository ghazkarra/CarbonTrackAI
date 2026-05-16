import { FiLoader as Loader2 } from 'react-icons/fi'
import { Button } from '@/components/ui/button'
import type { ComponentProps } from 'react'

type LoadingButtonProps = ComponentProps<typeof Button> & {
  isLoading?: boolean
  loadingLabel?: string
}

export function LoadingButton({ children, disabled, isLoading = false, loadingLabel, ...props }: LoadingButtonProps) {
  return (
    <Button disabled={disabled || isLoading} {...props}>
      {isLoading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
      <span className="inline-flex items-center gap-2 whitespace-nowrap">{isLoading ? loadingLabel ?? children : children}</span>
    </Button>
  )
}
