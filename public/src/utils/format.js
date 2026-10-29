// IDR with comma thousands: 30000 -> "Rp 30,000"
const nf = new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export const formatIDR = (value) => `Rp ${nf.format(Number(value) || 0)}`;

// Thousands separators while typing: 3000 -> "3,000". Returns the numeric value.
export function formatNumericInput(event) {
  const digits = event.target.value.replace(/\D/g, '');
  const formatted = digits ? new Intl.NumberFormat('en-US').format(Number(digits)) : '';
  event.target.value = formatted;
  return digits ? Number(digits) : 0;
}

// Display value for a number input bound to a numeric model.
export const formatInputValue = (value) =>
  Number(value) ? new Intl.NumberFormat('en-US').format(Number(value)) : '';
