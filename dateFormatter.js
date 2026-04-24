export function formatDateTime(date) {
  const d = normalizeDate(date);

  const pad = (n) => String(n).padStart(2, "0");

  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function formatDate(date) {
  const d = normalizeDate(date);

  const pad = (n) => String(n).padStart(2, "0");

  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function normalizeDate(date) {
  if (!date) return new Date();

  if (date.toDate) {
    return date.toDate();
  }

  return new Date(date);
}