/**
 * Sun Calculation Utility
 * Calculates the Sun's ecliptic longitude at a given date/time
 */

/**
 * Calculate Julian Day Number from a date
 * @param {Date} date - JavaScript Date object
 * @returns {number} Julian Day Number
 */
function getJulianDayNumber(date) {
  const a = Math.floor((14 - (date.getMonth() + 1)) / 12);
  const y = date.getFullYear() + 4800 - a;
  const m = (date.getMonth() + 1) + 12 * a - 3;

  let jdn = date.getDate() + Math.floor((153 * m + 2) / 5) + 365 * y +
            Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;

  // Add fractional day for time
  const hours = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
  jdn += (hours - 12) / 24;

  return jdn;
}

/**
 * Calculate the Sun's ecliptic longitude
 * Uses a simplified astronomical algorithm
 * @param {Date} date - Birth date and time
 * @returns {number} Sun's ecliptic longitude in degrees (0-360)
 */
export function calculateSunLongitude(date) {
  // Get Julian Day Number
  const jd = getJulianDayNumber(date);

  // Calculate number of days since J2000.0 (January 1, 2000, 12:00 TT)
  const n = jd - 2451545.0;

  // Mean longitude of the Sun (in degrees)
  let L = (280.460 + 0.9856474 * n) % 360;
  if (L < 0) L += 360;

  // Mean anomaly of the Sun (in degrees)
  let g = (357.528 + 0.9856003 * n) % 360;
  if (g < 0) g += 360;

  // Convert to radians
  const gRad = g * Math.PI / 180;

  // Ecliptic longitude of the Sun (in degrees)
  // This includes the equation of center correction
  let lambda = L + 1.915 * Math.sin(gRad) + 0.020 * Math.sin(2 * gRad);

  // Normalize to 0-360 range
  lambda = lambda % 360;
  if (lambda < 0) lambda += 360;

  return lambda;
}

/**
 * Get the zodiac sign for a given longitude
 * @param {number} longitude - Ecliptic longitude in degrees
 * @returns {string} Zodiac sign name
 */
export function getZodiacSign(longitude) {
  const signs = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];

  const index = Math.floor(longitude / 30);
  return signs[index];
}
