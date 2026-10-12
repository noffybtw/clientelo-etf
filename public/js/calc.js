// Savings projection with fund costs. Pure functions, no DOM.
// Model: a fixed deposit at the end of every month; the entry fee is taken
// from each deposit; the assets grow by (1 + return) * (1 - ongoing cost)
// per year, applied monthly. This is an illustration, not a forecast.

function check(name, v, min, max) {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) {
    throw new RangeError(`${name} out of range: ${v}`);
  }
}

export function projectSavings({ monthly, years, returnPct, ongoingPct, entryPct }) {
  check('monthly', monthly, 0, 1e7);
  check('years', years, 1, 60);
  check('returnPct', returnPct, -50, 50);
  check('ongoingPct', ongoingPct, 0, 20);
  check('entryPct', entryPct, 0, 99);

  const months = Math.round(years * 12);
  const factor = Math.pow((1 + returnPct / 100) * (1 - ongoingPct / 100), 1 / 12);
  const deposit = monthly * (1 - entryPct / 100);

  let value = 0;
  for (let i = 0; i < months; i++) value = value * factor + deposit;

  return { paidIn: monthly * months, value };
}

export function compareCosts({ monthly, years, returnPct, a, b }) {
  const gross = projectSavings({ monthly, years, returnPct, ongoingPct: 0, entryPct: 0 }).value;
  const run = (f) => {
    const { value } = projectSavings({ monthly, years, returnPct, ...f });
    return { value, lostToCosts: gross - value };
  };
  const ra = run(a);
  const rb = run(b);
  return { paidIn: monthly * Math.round(years * 12), gross, a: ra, b: rb, difference: ra.value - rb.value };
}
