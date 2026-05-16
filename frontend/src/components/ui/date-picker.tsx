import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

type DatePickerProps = {
  value: string
  onChange: (value: string) => void
  ariaLabel: string
  className?: string
}

function parseDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return undefined
  return new Date(year, month - 1, day)
}

function formatDateValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDisplayDate(value: string) {
  const date = parseDate(value)
  if (!date) return 'Select date'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

export function DatePicker({ value, onChange, ariaLabel, className }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const selected = parseDate(value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn('justify-start font-normal', className)} aria-label={ariaLabel}>
          <CalendarIcon className="size-4 text-muted-foreground" />
          {formatDisplayDate(value)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            if (!date) return
            onChange(formatDateValue(date))
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

type MonthPickerProps = {
  value: string
  onChange: (value: string) => void
  ariaLabel: string
  className?: string
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function parseMonth(value: string) {
  const [year, month] = value.split('-').map(Number)
  return {
    year: Number.isFinite(year) && year > 0 ? year : new Date().getFullYear(),
    month: Number.isFinite(month) && month >= 1 && month <= 12 ? month : new Date().getMonth() + 1,
  }
}

function formatMonthValue(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`
}

export function MonthPicker({ value, onChange, ariaLabel, className }: MonthPickerProps) {
  const [open, setOpen] = useState(false)
  const { year, month } = useMemo(() => parseMonth(value), [value])
  const [viewYear, setViewYear] = useState(year)

  return (
    <Popover open={open} onOpenChange={(nextOpen) => {
      setOpen(nextOpen)
      if (nextOpen) setViewYear(year)
    }}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn('justify-start font-normal', className)} aria-label={ariaLabel}>
          <CalendarIcon className="size-4 text-muted-foreground" />
          {new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date(year, month - 1, 1))}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => setViewYear((current) => current - 1)} aria-label="Previous year">
            <ChevronLeft className="size-4" />
          </Button>
          <p className="font-medium">{viewYear}</p>
          <Button variant="ghost" size="icon" onClick={() => setViewYear((current) => current + 1)} aria-label="Next year">
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {months.map((label, index) => {
            const itemMonth = index + 1
            const selected = viewYear === year && itemMonth === month
            return (
              <Button
                key={label}
                variant={selected ? 'default' : 'ghost'}
                className="h-9"
                onClick={() => {
                  onChange(formatMonthValue(viewYear, itemMonth))
                  setOpen(false)
                }}
              >
                {label}
              </Button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
