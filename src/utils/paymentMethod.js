export function isUtangPayment(method) {
  return method === 'utang'
}

export function getUtangPaidAmount(order) {
  if (!isUtangPayment(order?.payment_method)) return 0
  const paidAmount = Number(order?.utang_paid_amount) || 0
  if (paidAmount > 0) return paidAmount
  if (order?.utang_paid) return Number(order?.total_amount) || 0
  return 0
}

export function getUtangRemaining(order) {
  if (!isUtangPayment(order?.payment_method)) return 0
  const total = Number(order?.total_amount) || 0
  return Math.max(0, total - getUtangPaidAmount(order))
}

export function isUtangPaid(order) {
  return isUtangPayment(order?.payment_method) && getUtangRemaining(order) <= 0.001
}

export function isUtangUnpaid(order) {
  return isUtangPayment(order?.payment_method) && getUtangRemaining(order) > 0.001
}

export function isUtangPartial(order) {
  return isUtangPayment(order?.payment_method)
    && getUtangPaidAmount(order) > 0
    && getUtangRemaining(order) > 0.001
}

export function formatPaymentMethod(method) {
  switch (method) {
    case 'utang':
      return 'Utang'
    case 'gcash':
      return 'GCash'
    case 'card':
      return 'Card'
    case 'credit_card':
      return 'Credit Card'
    default:
      return 'Cash'
  }
}
