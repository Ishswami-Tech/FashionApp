
export function formatDisplayDate(dateStr?: string) {
  if (!dateStr) return "No date";
  
  // Try to parse the date
  let d: Date;
  
  // Handle different date formats
  if (dateStr.includes('/')) {
    // Handle DD/MM/YYYY format from API
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    } else {
      d = new Date(dateStr);
    }
  } else {
    d = new Date(dateStr);
  }
  
  // If date is still invalid, return error message
  if (isNaN(d.getTime())) {
    console.warn(`[orderUtils] Invalid date: ${dateStr}`);
    return "Invalid date";
  }
  
  return d.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
} 