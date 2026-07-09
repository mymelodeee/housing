export function formatPriceKorean(salePriceInManwon: number): string {
  const eok = Math.floor(salePriceInManwon / 10000)
  const remainder = salePriceInManwon % 10000
  if (remainder === 0) return `${eok}억`
  return `${eok}억 ${remainder.toLocaleString()}만원`
}
