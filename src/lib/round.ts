export function roundToNearestMultiple(num: number, multipleOf: number): number {
  if (Math.abs(multipleOf) < 1) {
    return num;
  }
  return Math.round(num / multipleOf) * multipleOf;
}
