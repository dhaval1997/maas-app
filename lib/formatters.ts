const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
})

const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
})

export function formatCurrency(value: number) {
  return currencyFormatter.format(value)
}

export function formatDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value)
  return dateFormatter.format(date)
}

export function formatDateTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value)
  return dateTimeFormatter.format(date)
}

