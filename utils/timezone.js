export function convertLocalToUTC(date, time, timezone) {
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);

  const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;

  const localDateInTimezone = new Date(dateString + 'Z');

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const formatted = formatter.format(localDateInTimezone);

  const userLocalTime = new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);

  const tzString = userLocalTime.toLocaleString('en-US', { timeZone: timezone });
  const tzDate = new Date(tzString);
  const utcDate = new Date(tzDate.getTime() + tzDate.getTimezoneOffset() * 60000);

  const localAsUTC = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));

  const localInTzAsString = localAsUTC.toLocaleString('en-US', { timeZone: timezone });
  const localInTzDate = new Date(localInTzAsString);

  const offset = localAsUTC.getTime() - localInTzDate.getTime();
  const utcDateTime = new Date(localAsUTC.getTime() - offset);

  return utcDateTime;
}

export function getTimezoneOffset(date, time, timezone) {
  try {
    const localDateTime = `${date}T${time}:00`;
    const localDate = new Date(localDateTime);

    const utcDate = convertLocalToUTC(date, time, timezone);

    const offsetMinutes = (localDate - utcDate) / (1000 * 60);
    const offsetHours = offsetMinutes / 60;

    return {
      offsetMinutes,
      offsetHours,
      offsetString: formatOffset(offsetMinutes)
    };
  } catch (error) {
    console.error('Error calculating timezone offset:', error);
    return {
      offsetMinutes: 0,
      offsetHours: 0,
      offsetString: '+00:00'
    };
  }
}

function formatOffset(minutes) {
  const sign = minutes >= 0 ? '+' : '-';
  const absMinutes = Math.abs(minutes);
  const hours = Math.floor(absMinutes / 60);
  const mins = absMinutes % 60;

  return `${sign}${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export function validateDateTime(date, time, timezone) {
  try {
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);

    if (!year || !month || !day || isNaN(hours) || isNaN(minutes)) {
      return { valid: false, error: 'Invalid date or time format' };
    }

    if (month < 1 || month > 12) {
      return { valid: false, error: 'Month must be between 1 and 12' };
    }

    if (day < 1 || day > 31) {
      return { valid: false, error: 'Day must be between 1 and 31' };
    }

    if (hours < 0 || hours > 23) {
      return { valid: false, error: 'Hour must be between 0 and 23' };
    }

    if (minutes < 0 || minutes > 59) {
      return { valid: false, error: 'Minute must be between 0 and 59' };
    }

    const testDate = new Date(year, month - 1, day, hours, minutes);
    if (isNaN(testDate.getTime())) {
      return { valid: false, error: 'Invalid date/time combination' };
    }

    if (testDate.getMonth() !== month - 1) {
      return { valid: false, error: 'Invalid day for the given month' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Failed to validate date/time' };
  }
}
