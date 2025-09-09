import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'success':
      return 'badge-success'
    case 'pending':
    case 'warning':
      return 'badge-secondary'
    case 'failed':
    case 'error':
    case 'cancelled':
      return 'badge-destructive'
    default:
      return 'badge-default'
  }
}

export function getRiskColor(level: string): string {
  switch (level.toLowerCase()) {
    case 'high':
    case 'critical':
      return 'text-red-600 bg-red-50 border-red-200'
    case 'medium':
    case 'moderate':
      return 'text-amber-600 bg-amber-50 border-amber-200'
    case 'low':
    case 'minimal':
      return 'text-green-600 bg-green-50 border-green-200'
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return 'Invalid Date'
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function truncateHash(hash: string, length: number = 8): string {
  if (!hash) return ''
  return `${hash.slice(0, length)}...${hash.slice(-4)}`
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}
