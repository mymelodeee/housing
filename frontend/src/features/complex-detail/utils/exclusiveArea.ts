interface HasExclusiveArea {
  exclusiveArea?: number
}

export function getAvailableExclusiveAreas(entries: HasExclusiveArea[]): number[] {
  const areas = new Set<number>()
  for (const entry of entries) {
    if (typeof entry.exclusiveArea === 'number') {
      areas.add(entry.exclusiveArea)
    }
  }
  return [...areas].sort((a, b) => a - b)
}

export function filterByExclusiveArea<T extends HasExclusiveArea>(entries: T[], area: number | null): T[] {
  if (area === null) return entries
  return entries.filter((entry) => entry.exclusiveArea === area)
}
