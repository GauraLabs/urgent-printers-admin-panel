// India has no DST, so Asia/Kolkata is a fixed UTC+05:30 and plain offset
// arithmetic is exact. Discount windows are entered and shown in IST and sent
// to the API as UTC ISO strings.

const IST_OFFSET_MINUTES = 330;
const MS_PER_MINUTE = 60_000;
const LOCAL_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

/** `YYYY-MM-DDTHH:mm` (IST wall clock, a datetime-local value) to a UTC ISO string; null for blank/invalid. */
export function istLocalToUtcIso(local: string | null | undefined): string | null {
  if (!local) return null;
  const m = LOCAL_RE.exec(local);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m;
  const asIfUtc = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi));
  const date = new Date(asIfUtc - IST_OFFSET_MINUTES * MS_PER_MINUTE);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

/** UTC ISO string to a datetime-local value showing the IST wall clock; '' for null/invalid. */
export function utcIsoToIstLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  return new Date(t + IST_OFFSET_MINUTES * MS_PER_MINUTE).toISOString().slice(0, 16);
}

export function formatIst(iso: string | null | undefined): string {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const ist = new Date(t + IST_OFFSET_MINUTES * MS_PER_MINUTE);
  const date = ist.toISOString().slice(0, 10);
  const time = ist.toISOString().slice(11, 16);
  return `${date} ${time} IST`;
}

export function sameInstant(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return new Date(a).getTime() === new Date(b).getTime();
}
