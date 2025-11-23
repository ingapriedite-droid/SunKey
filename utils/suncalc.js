/**
 * Sun Calculation Utility
 * Calculates the Sun's ecliptic longitude using Astronomy Engine
 * Provides professional-grade accuracy based on VSOP87 theory
 */

import Astronomy from 'astronomy-engine';

/**
 * Calculate the Sun's ecliptic longitude with high precision
 * Uses Astronomy Engine which implements VSOP87 theory
 * Accurate to within 1 arcminute
 * @param {Date} utcDate - Birth date and time in UTC
 * @returns {number} Sun's ecliptic longitude in degrees (0-360)
 */
export function calculateSunLongitude(utcDate) {
  const ecliptic = Astronomy.Ecliptic(utcDate);

  let longitude = ecliptic.elon;

  if (longitude < 0) {
    longitude += 360;
  }

  return longitude;
}

/**
 * Calculate Sun position with additional details
 * @param {Date} utcDate - Birth date and time in UTC
 * @returns {Object} Detailed sun position information
 */
export function calculateSunPosition(utcDate) {
  const ecliptic = Astronomy.Ecliptic(utcDate);
  const equatorial = Astronomy.Equator('Sun', utcDate, null, true, true);

  let longitude = ecliptic.elon;
  if (longitude < 0) {
    longitude += 360;
  }

  let latitude = ecliptic.elat;

  return {
    longitude,
    latitude,
    rightAscension: equatorial.ra,
    declination: equatorial.dec,
    distance: equatorial.dist
  };
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
