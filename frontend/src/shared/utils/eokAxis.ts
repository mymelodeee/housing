const MANWON_PER_EOK = 10000
const DEFAULT_STEP_MANWON = 5000 // 0.5억

export function formatEok(valueManwon: number): string {
  return `${(valueManwon / MANWON_PER_EOK).toFixed(1)}억`
}

export interface EokAxis {
  min: number
  max: number
  ticks: number[]
}

// 매매가/전세가 그래프의 금액(Y)축을 0.5억 간격 눈금으로 정렬한다.
export function buildEokAxis(values: number[], stepManwon: number = DEFAULT_STEP_MANWON): EokAxis {
  if (values.length === 0) {
    return { min: 0, max: stepManwon, ticks: [0, stepManwon] }
  }

  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)
  const min = Math.floor(rawMin / stepManwon) * stepManwon
  const max = Math.max(Math.ceil(rawMax / stepManwon) * stepManwon, min + stepManwon)

  const ticks: number[] = []
  for (let value = min; value <= max + 1; value += stepManwon) {
    ticks.push(Math.round(value))
  }

  return { min, max, ticks }
}
