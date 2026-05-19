// Persistent "paid today" tracking using localStorage keyed by date
// so it resets automatically the next day

const getKey = (prefix) => `paidToday_${prefix}_${new Date().toISOString().split("T")[0]}`;

export function getPaidToday(prefix) {
  try {
    const raw = localStorage.getItem(getKey(prefix));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addPaidToday(prefix, id) {
  const current = getPaidToday(prefix);
  if (!current.includes(id)) {
    localStorage.setItem(getKey(prefix), JSON.stringify([...current, id]));
  }
}