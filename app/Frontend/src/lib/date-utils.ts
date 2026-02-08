/**
 * Simple date utilities to replace date-fns
 */

export function addDays(date: Date, amount: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + amount)
  return result
}

export function format(date: Date, formatStr: string): string {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ]
  
  const longMonths = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  let result = formatStr
  
  // Replace year
  result = result.replace(/y+/g, date.getFullYear().toString())
  
  // Replace month (full name)
  result = result.replace(/LLLL/g, longMonths[date.getMonth()])
  
  // Replace month (short name)
  result = result.replace(/LLL/g, months[date.getMonth()])
  
  // Replace month (numeric)
  const monthNum = (date.getMonth() + 1).toString().padStart(2, '0')
  result = result.replace(/MM/g, monthNum)
  result = result.replace(/M/g, (date.getMonth() + 1).toString())
  
  // Replace day
  const dayNum = date.getDate().toString().padStart(2, '0')
  result = result.replace(/dd/g, dayNum)
  result = result.replace(/d/g, date.getDate().toString())
  
  return result
}

// Type definitions to match react-day-picker
export interface DateRange {
  from?: Date
  to?: Date
}