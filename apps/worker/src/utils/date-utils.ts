import { format, parse, isValid, addDays } from 'date-fns';
import { ja } from 'date-fns/locale';

/**
 * Extract dates and times from text
 * @param text Text containing date and time information
 * @returns Array of extracted date options
 */
export function extractDatesFromText(text: string): Array<{
  date: Date;
  startTime?: string;
  endTime?: string;
}> {
  const results: Array<{
    date: Date;
    startTime?: string;
    endTime?: string;
  }> = [];
  
  // Extract date patterns (simplified for MVP)
  // In a production app, use more sophisticated date parsing
  
  // Pattern 1: YYYY/MM/DD or YYYY-MM-DD
  const datePattern1 = /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/g;
  
  // Pattern 2: MM/DD or MM月DD日
  const datePattern2 = /(\d{1,2})[\/月](\d{1,2})[日]?/g;
  
  // Pattern 3: "明日", "明後日", "今日", etc.
  const relativeDatePatterns = [
    { pattern: /今日/g, days: 0 },
    { pattern: /明日/g, days: 1 },
    { pattern: /明後日/g, days: 2 },
    { pattern: /明々後日|明明後日/g, days: 3 },
    // Add more relative date patterns as needed
  ];
  
  // Pattern 4: Time patterns (HH:MM or HH時MM分)
  const timePattern = /(\d{1,2})[:時](\d{0,2})分?(?:\s*[~-]\s*(\d{1,2})[:時](\d{0,2})分?)?/g;
  
  // Extract dates from pattern 1
  let match;
  while ((match = datePattern1.exec(text)) !== null) {
    const year = parseInt(match[1]);
    const month = parseInt(match[2]) - 1; // JavaScript months are 0-indexed
    const day = parseInt(match[3]);
    
    const date = new Date(year, month, day);
    if (isValid(date)) {
      results.push({ date });
    }
  }
  
  // Extract dates from pattern 2
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  
  while ((match = datePattern2.exec(text)) !== null) {
    const month = parseInt(match[1]) - 1; // JavaScript months are 0-indexed
    const day = parseInt(match[2]);
    
    // Assume current year, adjust if date is in the past
    let year = currentYear;
    let date = new Date(year, month, day);
    
    // If the date is in the past, assume next year
    if (date < today && month < currentMonth) {
      year = currentYear + 1;
      date = new Date(year, month, day);
    }
    
    if (isValid(date)) {
      results.push({ date });
    }
  }
  
  // Extract dates from relative patterns
  for (const { pattern, days } of relativeDatePatterns) {
    while (pattern.exec(text) !== null) {
      const date = addDays(today, days);
      results.push({ date });
      
      // Reset the regex lastIndex to find all occurrences
      pattern.lastIndex = 0;
    }
  }
  
  // Extract times and associate with dates
  const timeMatches: Array<{
    startTime: string;
    endTime?: string;
  }> = [];
  
  while ((match = timePattern.exec(text)) !== null) {
    const startHour = parseInt(match[1]);
    const startMinute = match[2] ? parseInt(match[2]) : 0;
    const startTime = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
    
    let endTime;
    if (match[3]) {
      const endHour = parseInt(match[3]);
      const endMinute = match[4] ? parseInt(match[4]) : 0;
      endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
    }
    
    timeMatches.push({
      startTime,
      endTime
    });
  }
  
  // If we have both dates and times, combine them
  if (results.length > 0 && timeMatches.length > 0) {
    // First, add times to existing dates
    const updatedResults = results.map((result, index) => {
      const timeIndex = index % timeMatches.length;
      return {
        ...result,
        startTime: timeMatches[timeIndex].startTime,
        endTime: timeMatches[timeIndex].endTime
      };
    });
    
    return updatedResults;
  }
  
  // If we only have dates or only have times
  if (results.length === 0 && timeMatches.length > 0) {
    // Only time patterns found, assume today
    return timeMatches.map(({ startTime, endTime }) => ({
      date: today,
      startTime,
      endTime
    }));
  }
  
  return results;
}

/**
 * Format date options for display
 * @param dateOptions Array of date options
 * @returns Formatted date strings
 */
export function formatDateOptions(dateOptions: Array<{
  date: Date;
  startTime?: string;
  endTime?: string;
}>): string[] {
  return dateOptions.map(option => {
    const formattedDate = format(option.date, 'yyyy年M月d日(E)', { locale: ja });
    
    if (option.startTime && option.endTime) {
      return `${formattedDate} ${option.startTime}～${option.endTime}`;
    } else if (option.startTime) {
      return `${formattedDate} ${option.startTime}～`;
    } else {
      return formattedDate;
    }
  });
}

/**
 * Parse a date string in various formats
 * @param dateString Date string to parse
 * @returns Parsed date or null if invalid
 */
export function parseFlexibleDate(dateString: string): Date | null {
  // Try various date formats
  const formats = [
    'yyyy/MM/dd',
    'yyyy-MM-dd',
    'MM/dd',
    'MM-dd',
    'yyyy年MM月dd日',
    'MM月dd日'
  ];
  
  for (const fmt of formats) {
    try {
      const date = parse(dateString, fmt, new Date());
      if (isValid(date)) {
        return date;
      }
    } catch (error) {
      // Try next format
    }
  }
  
  // Handle relative dates
  const today = new Date();
  
  if (dateString.includes('今日')) {
    return today;
  } else if (dateString.includes('明日')) {
    return addDays(today, 1);
  } else if (dateString.includes('明後日')) {
    return addDays(today, 2);
  } else if (dateString.includes('明々後日') || dateString.includes('明明後日')) {
    return addDays(today, 3);
  }
  
  return null;
}
