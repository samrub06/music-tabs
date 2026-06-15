export function xpLog(event: string, data?: Record<string, unknown>) {
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[xp] ${event}`, data ?? '')
  }
}
