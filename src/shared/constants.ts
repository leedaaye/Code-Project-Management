export const STATUS_CONFIG = {
  active: { label: '进行中', color: '#22c55e' },
  paused: { label: '暂停', color: '#eab308' },
  completed: { label: '已完成', color: '#3b82f6' },
  archived: { label: '归档', color: '#6b7280' },
  refactoring: { label: '重构中', color: '#a855f7' }
} as const

export type ProjectStatus = keyof typeof STATUS_CONFIG

export function getStatusLabel(status: string): string {
  return STATUS_CONFIG[status as ProjectStatus]?.label || status
}

export function getStatusColor(status: string): string {
  return STATUS_CONFIG[status as ProjectStatus]?.color || '#6b7280'
}

export const CATEGORY_CONFIG = {
  all: { name: '全部', icon: 'folder' },
  work: { name: '工作', icon: 'briefcase' },
  personal: { name: '个人', icon: 'home' },
  learning: { name: '学习', icon: 'book' }
} as const
