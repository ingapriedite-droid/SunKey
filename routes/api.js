import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { calculateSunLongitude, calculateSunPosition, getZodiacSign } from '../utils/suncalc.js';
import { mapLongitudeToGeneKey, getAllGeneKeySegments } from '../utils/mapToGeneKey.js';
import { geocodeLocation, searchCities } from '../utils/geocoding.js';
import { convertLocalToUTC, validateDateTime } from '../utils/timezone.js';
import geneKeysData from '../data/genekeys.json' assert { type: 'json' };

const router = express.Router();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

router.get('/sunkey', async (req, res) => {
  try {
    const { date, time, place } = req.query;

    if (!date || !time || !place) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'Please provide date (YYYY-MM-DD), time (HH:mm), and place'
      });
    }

    const validation = validateDateTime(date, time, 'UTC');
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid date or time',
        message: validation.error
      });
    }

    const location = await geocodeLocation(place);

    const { data: cachedCalc } = await supabase
      .from('sun_calculations_cache')
      .select('*')
      .eq('date', date)
      .eq('time', time)
      .eq('latitude', location.latitude.toFixed(7))
      .eq('longitude', location.longitude.toFixed(7))
      .maybeSingle();

    if (cachedCalc) {
      return res.json({
        birthDate: {
          date,
          time,
          place: `${location.city}, ${location.country}`,
          timezone: location.timezone
        },
        location: {
          city: location.city,
          country: location.country,
          latitude: parseFloat(cachedCalc.latitude),
          longitude: parseFloat(cachedCalc.longitude),
          timezone: cachedCalc.timezone,
          source: 'cache'
        },
        sunLongitude: parseFloat(cachedCalc.sun_longitude),
        zodiacSign: cachedCalc.zodiac_sign,
        geneKey: cachedCalc.gene_key,
        shadow: geneKeysData[cachedCalc.gene_key.toString()].shadow,
        gift: geneKeysData[cachedCalc.gene_key.toString()].gift,
        siddhi: geneKeysData[cachedCalc.gene_key.toString()].siddhi,
        accuracy: 'High precision (VSOP87, cached)',
        utcDateTime: cachedCalc.utc_datetime
      });
    }

    const utcDateTime = convertLocalToUTC(date, time, location.timezone);

    const sunLongitude = calculateSunLongitude(utcDateTime);

    const geneKeyNumber = mapLongitudeToGeneKey(sunLongitude);

    const geneKeyInfo = geneKeysData[geneKeyNumber.toString()];

    if (!geneKeyInfo) {
      return res.status(500).json({
        error: 'Gene Key data not found',
        message: `No data found for Gene Key ${geneKeyNumber}`
      });
    }

    const zodiacSign = getZodiacSign(sunLongitude);

    try {
      await supabase
        .from('sun_calculations_cache')
        .insert({
          date,
          time,
          latitude: location.latitude.toFixed(7),
          longitude: location.longitude.toFixed(7),
          timezone: location.timezone,
          utc_datetime: utcDateTime.toISOString(),
          sun_longitude: sunLongitude.toFixed(7),
          zodiac_sign: zodiacSign,
          gene_key: geneKeyNumber
        });
    } catch (cacheError) {
      console.warn('Failed to cache calculation:', cacheError);
    }

    res.json({
      birthDate: {
        date,
        time,
        place: `${location.city}, ${location.country}`,
        timezone: location.timezone
      },
      location: {
        city: location.city,
        country: location.country,
        latitude: location.latitude,
        longitude: location.longitude,
        timezone: location.timezone,
        source: location.source
      },
      sunLongitude: parseFloat(sunLongitude.toFixed(4)),
      zodiacSign,
      geneKey: geneKeyNumber,
      shadow: geneKeyInfo.shadow,
      gift: geneKeyInfo.gift,
      siddhi: geneKeyInfo.siddhi,
      accuracy: 'High precision (VSOP87)',
      utcDateTime: utcDateTime.toISOString()
    });

  } catch (error) {
    console.error('Error calculating Sun Key:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

router.get('/wheel', (req, res) => {
  try {
    const segments = getAllGeneKeySegments();

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

router.get('/cities/search', (req, res) => {
  try {
    const { q, limit } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        error: 'Invalid query',
        message: 'Please provide at least 2 characters'
      });
    }

    const results = searchCities(q, parseInt(limit) || 10);

    res.json({ cities: results });

  } catch (error) {
    console.error('Error searching cities:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

export default router;
