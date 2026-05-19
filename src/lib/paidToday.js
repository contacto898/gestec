// Persistent "paid today" tracking using localStorage keyed by date
// so it resets automatically the next day

function getTodayLocalKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
const getKey = (prefix) => `paidToday_${prefix}_${getTodayLocalKey()}`;

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

export function removePaidToday(prefix, id) {
  const current = getPaidToday(prefix);
  localStorage.setItem(getKey(prefix), JSON.stringify(current.filter((i) => i !== id)));
}