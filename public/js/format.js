// TER as shown on the page: Czech comma, at least two decimals, never
// rounded away (0.3 -> "0,30 %", 0.0945 -> "0,0945 %").
export function terPct(n) {
  const [int, dec = ''] = String(n).split('.');
  return `${int},${dec.padEnd(2, '0')} %`;
}
