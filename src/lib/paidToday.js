// Determines if a worker has already been paid in the current period
// based on their payment_type and last_payment_date stored in the DB

function getTodayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function parseLocal(str) {
  if (!str) return null;
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Returns the number of days for the payment period
function getPeriodDays(paymentType) {
  if (paymentType === "quincenal") return 15;
  if (paymentType === "semanal") return 7;
  return 30; // mensual
}

// Returns true if the worker was already paid in the current period
export function isAlreadyPaidThisPeriod(worker) {
  if (!worker.last_payment_date) return false;
  const lastPaid = parseLocal(worker.last_payment_date);
  if (!lastPaid) return false;
  const today = parseLocal(getTodayLocal());
  const diffDays = Math.floor((today - lastPaid) / (1000 * 60 * 60 * 24));
  const periodDays = getPeriodDays(worker.payment_type);
  return diffDays < periodDays;
}

// Returns the next payment date based on last payment
export function getNextPaymentDate(worker) {
  if (!worker.last_payment_date) return null;
  const lastPaid = parseLocal(worker.last_payment_date);
  if (!lastPaid) return null;
  const periodDays = getPeriodDays(worker.payment_type);
  const next = new Date(lastPaid);
  next.setDate(next.getDate() + periodDays);
  return next;
}

// Legacy localStorage helpers — kept for vacation tracking only
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