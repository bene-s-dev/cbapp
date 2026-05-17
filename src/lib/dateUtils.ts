/**
 * Generates a stable day key that resets at 3:00 AM Central European Time (CET/CEST).
 * This ensures all users see the same questions and their answers match the current period.
 */
export function getDailyKey(): string {
  const now = new Date();
  
  // Convert current time to a number representing hours since midnight in CET/CEST
  // We use "Europe/Berlin" for Central European Time
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Berlin',
    hour: 'numeric',
    hour12: false
  });
  
  const cetHour = parseInt(formatter.format(now));
  
  // If it's before 3 AM CET, we belong to "yesterday's" question set
  const adjustedDate = new Date(now);
  if (cetHour < 3) {
    adjustedDate.setDate(adjustedDate.getDate() - 1);
  }
  
  // Format as YYYY-MM-DD based on the adjusted date in CET
  const dayFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const [{ value: day }, , { value: month }, , { value: year }] = dayFormatter.formatToParts(adjustedDate);
  return `${year}-${month}-${day}`;
}

/**
 * Calculates the time remaining until the next 3:00 AM CET reset.
 */
export function getTimeUntilReset(): { hours: number; minutes: number; seconds: number; totalSeconds: number } {
  const now = new Date();
  
  // Target is 3:00 AM CET today or tomorrow
  const target = new Date(now);
  
  // Get current hour in CET
  const hourFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Berlin',
    hour: 'numeric',
    hour12: false
  });
  const cetHour = parseInt(hourFormatter.format(now));

  // If it's already past 3 AM CET, the next reset is tomorrow at 3 AM
  if (cetHour >= 3) {
    target.setDate(target.getDate() + 1);
  }
  
  // Set target to 3:00 AM in the local time equivalent of CET
  // To be precise, we calculate the absolute timestamp of the next 3 AM CET
  const nextResetCET = new Date(target.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
  nextResetCET.setHours(3, 0, 0, 0);
  
  // Because locale strings can be tricky, we find the offset
  const nowCET = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
  const diffMs = nextResetCET.getTime() - nowCET.getTime();
  
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return { hours, minutes, seconds, totalSeconds };
}
