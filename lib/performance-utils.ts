export function detectDeviceCapabilities() {
  if (typeof window === "undefined") {
    return {
      isLowEnd: false,
      deviceMemory: 8,
      hardwareConcurrency: 4,
    }
  }

  const nav = navigator as any
  const deviceMemory = nav.deviceMemory || 8
  const hardwareConcurrency = nav.hardwareConcurrency || 4

  // Consider device low-end if memory <= 4GB or CPU cores <= 2
  const isLowEnd = deviceMemory <= 4 || hardwareConcurrency <= 2

  return {
    isLowEnd,
    deviceMemory,
    hardwareConcurrency,
  }
}

export function getOptimalItemsPerPage() {
  const { isLowEnd } = detectDeviceCapabilities()
  return isLowEnd ? 15 : 20
}

export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}
