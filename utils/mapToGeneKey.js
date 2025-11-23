/**
 * Gene Key Mapping Utility
 * Maps Sun's ecliptic longitude (0-360°) to one of 64 Gene Keys
 */

/**
 * The I Ching / Gene Keys wheel mapping
 * This maps zodiac degrees to Gene Key numbers based on the traditional I Ching sequence
 * Starting from 0° Aries and moving through the zodiac
 */
const GENE_KEY_WHEEL = [
  13, 49, 30, 55, 37, 63, 22, 36,  // Aries (0-45°)
  25, 17, 21, 51, 42, 3, 27, 24,   // Taurus (45-90°)
  2, 23, 8, 20, 16, 35, 45, 12,    // Gemini (90-135°)
  15, 52, 39, 53, 62, 56, 31, 33,  // Cancer (135-180°)
  7, 4, 29, 59, 40, 64, 47, 6,     // Leo (180-225°)
  46, 18, 48, 57, 32, 50, 28, 44,  // Virgo (225-270°)
  1, 43, 14, 34, 9, 5, 26, 11,     // Libra (270-315°)
  10, 58, 38, 54, 61, 60, 41, 19   // Scorpio (315-360°)
];

/**
 * Map Sun's longitude to a Gene Key number (1-64)
 * Divides the 360° zodiac into 64 equal segments of 5.625° each
 * @param {number} longitude - Ecliptic longitude in degrees (0-360)
 * @returns {number} Gene Key number (1-64)
 */
export function mapLongitudeToGeneKey(longitude) {
  // Normalize longitude to 0-360 range
  let normalizedLongitude = longitude % 360;
  if (normalizedLongitude < 0) normalizedLongitude += 360;

  // Calculate which of the 64 segments this longitude falls into
  // Each segment is 360 / 64 = 5.625 degrees
  const segmentSize = 360 / 64;
  const segmentIndex = Math.floor(normalizedLongitude / segmentSize);

  // Return the corresponding Gene Key number from the wheel
  return GENE_KEY_WHEEL[segmentIndex];
}

/**
 * Get the degree range for a specific Gene Key
 * @param {number} geneKeyNumber - Gene Key number (1-64)
 * @returns {object} Object with start and end degrees
 */
export function getGeneKeyDegreeRange(geneKeyNumber) {
  const segmentSize = 360 / 64;
  const index = GENE_KEY_WHEEL.indexOf(geneKeyNumber);

  if (index === -1) {
    throw new Error('Invalid Gene Key number');
  }

  return {
    start: (index * segmentSize).toFixed(2),
    end: ((index + 1) * segmentSize).toFixed(2),
    geneKey: geneKeyNumber
  };
}

/**
 * Get all 64 Gene Keys in wheel order with their degree ranges
 * Useful for rendering the wheel visualization
 * @returns {Array} Array of objects with geneKey, start, and end degrees
 */
export function getAllGeneKeySegments() {
  const segmentSize = 360 / 64;
  return GENE_KEY_WHEEL.map((geneKey, index) => ({
    geneKey,
    start: index * segmentSize,
    end: (index + 1) * segmentSize,
    index
  }));
}
