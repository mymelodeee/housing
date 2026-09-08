const SQUARE_METERS_PER_PYEONG = 3.305785

export function toPyeong(exclusiveAreaM2: number): number {
  return Math.round((exclusiveAreaM2 / SQUARE_METERS_PER_PYEONG) * 10) / 10
}

export function formatAreaWithPyeong(exclusiveAreaM2: number): string {
  return `${exclusiveAreaM2}m² (${toPyeong(exclusiveAreaM2)}평)`
}
