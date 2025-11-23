/**
 * API Routes for SunKey Application
 * Handles requests to calculate Gene Keys from birth data
 */

import express from 'express';
import { calculateSunLongitude, getZodiacSign } from '../utils/suncalc.js';
import { mapLongitudeToGeneKey, getAllGeneKeySegments } from '../utils/mapToGeneKey.js';
import geneKeysData from '../data/genekeys.json' assert { type: 'json' };

const router = express.Router();

/**
 * GET /api/sunkey
 * Calculate Sun Key from birth data
 * Query parameters:
 *   - date: YYYY-MM-DD
 *   - time: HH:mm
 *   - place: City name (currently for display only, timezone conversion would require geocoding API)
 */
router.get('/sunkey', (req, res) => {
  try {
    const { date, time, place } = req.query;

    // Validate required parameters
    if (!date || !time) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'Please provide date (YYYY-MM-DD) and time (HH:mm)'
      });
    }

    // Parse date and time into a Date object
    // Note: This assumes UTC. For production, you'd want to convert based on birthplace timezone
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);

    const birthDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));

    // Validate date
    if (isNaN(birthDate.getTime())) {
      return res.status(400).json({
        error: 'Invalid date or time',
        message: 'Please provide valid date and time values'
      });
    }

    // Calculate Sun's longitude
    const sunLongitude = calculateSunLongitude(birthDate);

    // Map to Gene Key
    const geneKeyNumber = mapLongitudeToGeneKey(sunLongitude);

    // Get Gene Key data
    const geneKeyInfo = geneKeysData[geneKeyNumber.toString()];

    if (!geneKeyInfo) {
      return res.status(500).json({
        error: 'Gene Key data not found',
        message: `No data found for Gene Key ${geneKeyNumber}`
      });
    }

    // Get zodiac sign
    const zodiacSign = getZodiacSign(sunLongitude);

    // Return the complete result
    res.json({
      birthDate: {
        date,
        time,
        place: place || 'Not specified'
      },
      sunLongitude: parseFloat(sunLongitude.toFixed(2)),
      zodiacSign,
      geneKey: geneKeyNumber,
      shadow: geneKeyInfo.shadow,
      gift: geneKeyInfo.gift,
      siddhi: geneKeyInfo.siddhi
    });

  } catch (error) {
    console.error('Error calculating Sun Key:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/wheel
 * Get all 64 Gene Key segments for rendering the wheel
 */
router.get('/wheel', (req, res) => {
  try {
    const segments = getAllGeneKeySegments();

    // Add Gene Key info to each segment
    const wheelData = segments.map(segment => ({
      ...segment,
      ...geneKeysData[segment.geneKey.toString()]
    }));

    res.json({ segments: wheelData });

  } catch (error) {
    console.error('Error getting wheel data:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/genekey/:number
 * Get information for a specific Gene Key
 */
router.get('/genekey/:number', (req, res) => {
  try {
    const number = parseInt(req.params.number);

    if (isNaN(number) || number < 1 || number > 64) {
      return res.status(400).json({
        error: 'Invalid Gene Key number',
        message: 'Gene Key number must be between 1 and 64'
      });
    }

    const geneKeyInfo = geneKeysData[number.toString()];

    if (!geneKeyInfo) {
      return res.status(404).json({
        error: 'Gene Key not found',
        message: `No data found for Gene Key ${number}`
      });
    }

    res.json({
      geneKey: number,
      ...geneKeyInfo
    });

  } catch (error) {
    console.error('Error getting Gene Key:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

export default router;
