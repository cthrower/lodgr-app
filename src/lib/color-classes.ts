const COLOR_CLASS_MAP: Record<
  string,
  {
    bg: string
    bgTint: string
    text: string
    border: string
  }
> = {
  '#ef4444': {
    bg: 'bg-[#ef4444]',
    bgTint: 'bg-[#ef444433]',
    text: 'text-[#ef4444]',
    border: 'border-[#ef4444]',
  },
  '#f97316': {
    bg: 'bg-[#f97316]',
    bgTint: 'bg-[#f9731633]',
    text: 'text-[#f97316]',
    border: 'border-[#f97316]',
  },
  '#eab308': {
    bg: 'bg-[#eab308]',
    bgTint: 'bg-[#eab30833]',
    text: 'text-[#eab308]',
    border: 'border-[#eab308]',
  },
  '#f59e0b': {
    bg: 'bg-[#f59e0b]',
    bgTint: 'bg-[#f59e0b33]',
    text: 'text-[#f59e0b]',
    border: 'border-[#f59e0b]',
  },
  '#22c55e': {
    bg: 'bg-[#22c55e]',
    bgTint: 'bg-[#22c55e33]',
    text: 'text-[#22c55e]',
    border: 'border-[#22c55e]',
  },
  '#10b981': {
    bg: 'bg-[#10b981]',
    bgTint: 'bg-[#10b98133]',
    text: 'text-[#10b981]',
    border: 'border-[#10b981]',
  },
  '#3b82f6': {
    bg: 'bg-[#3b82f6]',
    bgTint: 'bg-[#3b82f633]',
    text: 'text-[#3b82f6]',
    border: 'border-[#3b82f6]',
  },
  '#8b5cf6': {
    bg: 'bg-[#8b5cf6]',
    bgTint: 'bg-[#8b5cf633]',
    text: 'text-[#8b5cf6]',
    border: 'border-[#8b5cf6]',
  },
  '#ec4899': {
    bg: 'bg-[#ec4899]',
    bgTint: 'bg-[#ec489933]',
    text: 'text-[#ec4899]',
    border: 'border-[#ec4899]',
  },
  '#6b7280': {
    bg: 'bg-[#6b7280]',
    bgTint: 'bg-[#6b728033]',
    text: 'text-[#6b7280]',
    border: 'border-[#6b7280]',
  },
  '#6366f1': {
    bg: 'bg-[#6366f1]',
    bgTint: 'bg-[#6366f133]',
    text: 'text-[#6366f1]',
    border: 'border-[#6366f1]',
  },
  '#14b8a6': {
    bg: 'bg-[#14b8a6]',
    bgTint: 'bg-[#14b8a633]',
    text: 'text-[#14b8a6]',
    border: 'border-[#14b8a6]',
  },
}

function getColorClasses(hex: string | null | undefined) {
  if (!hex) return null
  return COLOR_CLASS_MAP[hex.toLowerCase()] ?? null
}

export function bgClassForColor(hex: string | null | undefined) {
  return getColorClasses(hex)?.bg ?? 'bg-[var(--text-muted)]'
}

export function bgTintClassForColor(hex: string | null | undefined) {
  return getColorClasses(hex)?.bgTint ?? 'bg-[var(--surface-hover)]'
}

export function textClassForColor(hex: string | null | undefined) {
  return getColorClasses(hex)?.text ?? 'text-[var(--text-secondary)]'
}

export function borderClassForColor(hex: string | null | undefined) {
  return getColorClasses(hex)?.border ?? 'border-[var(--border)]'
}
