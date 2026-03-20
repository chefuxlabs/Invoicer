const BIZ_KEY = "inv_biz";
const COUNTER_KEY = "inv_counter";

export function loadBizInfo() {
  try {
    return JSON.parse(localStorage.getItem(BIZ_KEY)) || {};
  } catch {
    return {};
  }
}

export function saveBizInfo(biz) {
  localStorage.setItem(BIZ_KEY, JSON.stringify(biz));
}

export function nextInvoiceNumber() {
  const n = parseInt(localStorage.getItem(COUNTER_KEY) || "0") + 1;
  localStorage.setItem(COUNTER_KEY, String(n));
  return `INV-${String(n).padStart(4, "0")}`;
}

export function peekInvoiceNumber() {
  const n = parseInt(localStorage.getItem(COUNTER_KEY) || "0") + 1;
  return `INV-${String(n).padStart(4, "0")}`;
}
