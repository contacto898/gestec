// Determines if a worker has already been paid in the current period
// based on their payment_type and last_payment_date stored in the DB
//
// For weekly workers (Mon–Sat schedule), payments always align to Saturday.

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

// For weekly workers: returns the next Saturday strictly after the reference date.
// (day 6 = Saturday). If the reference is already a Saturday, jumps to the following week.
function getNextSaturday(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dayOfWeek = d.getDay(); // 0=Sun ... 6=Sat
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7;
  d.setDate(d.getDate() + (daysUntilSaturday === 0 ? 7 : daysUntilSaturday));
  return d;
}

// Returns the next payment date based on the worker's payment cycle.
export function getNextPaymentDate(worker) {
  if (worker.payment_type === "semanal") {
    const ref = parseLocal(worker.last_payment_date)
      || parseLocal(worker.payment_date)
      || parseLocal(worker.hire_date);
    if (!ref) return null;
    return getNextSaturday(ref);
  }

  if (!worker.last_payment_date) return null;
  const lastPaid = parseLocal(worker.last_payment_date);
  if (!lastPaid) return null;
  const periodDays = getPeriodDays(worker.payment_type);
  const next = new Date(lastPaid);
  next.setDate(next.getDate() + periodDays);
  return next;
}

// Returns true if the worker was already paid in the current period
export function isAlreadyPaidThisPeriod(worker) {
  if (!worker.last_payment_date) return false;
  const nextPay = getNextPaymentDate(worker);
  if (!nextPay) return false;
  const today = parseLocal(getTodayLocal());
  return today < nextPay;
}

// Returns true if today is the payment due date (period has elapsed since last payment)
export function isPaymentDue(worker) {
  const today = parseLocal(getTodayLocal());

  if (worker.last_payment_date) {
    const nextPay = getNextPaymentDate(worker);
    return nextPay ? today >= nextPay : false;
  }

  // No payment yet — use scheduled payment_date if set
  if (worker.payment_date) {
    const scheduled = parseLocal(worker.payment_date);
    return today >= scheduled;
  }

  // Fallback: use hire date
  if (worker.hire_date) {
    if (worker.payment_type === "semanal") {
      // First weekly payment is due on the first Saturday after a full week worked
      const nextSat = getNextSaturday(parseLocal(worker.hire_date));
      return today >= nextSat;
    }
    const periodDays = getPeriodDays(worker.payment_type);
    const hire = parseLocal(worker.hire_date);
    const diffDays = Math.floor((today - hire) / (1000 * 60 * 60 * 24));
    return diffDays >= periodDays;
  }

  return true; // No reference date → always enable
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