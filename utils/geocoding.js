import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import NodeGeocoder from 'node-geocoder';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const citiesData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/cities.json'), 'utf8')
);

const geocoder = NodeGeocoder({
  provider: 'openstreetmap',
  httpAdapter: 'https',
  formatter: null
});

export async function geocodeLocation(locationInput) {
  const normalizedInput = locationInput.trim().toLowerCase();

  try {
    const { data: cached } = await supabase
      .from('geocoding_cache')
      .select('*')
      .eq('location_input', normalizedInput)
      .maybeSingle();

    if (cached) {
      return {
        city: cached.city,
        country: cached.country,
        latitude: parseFloat(cached.latitude),
        longitude: parseFloat(cached.longitude),
        timezone: cached.timezone,
        source: 'cache'
      };
    }
  } catch (error) {
    console.warn('Cache lookup failed:', error);
  }

  const localMatch = citiesData.find(city => {
    const cityMatch = city.city.toLowerCase() === normalizedInput;
    const cityCountryMatch = `${city.city}, ${city.country}`.toLowerCase() === normalizedInput;
    const cityCountryAltMatch = `${city.city} ${city.country}`.toLowerCase() === normalizedInput;
    return cityMatch || cityCountryMatch || cityCountryAltMatch;
  });

  if (localMatch) {
    const result = {
      city: localMatch.city,
      country: localMatch.country,
      latitude: localMatch.lat,
      longitude: localMatch.lng,
      timezone: localMatch.timezone,
      source: 'local'
    };

    await cacheGeocodingResult(normalizedInput, result);
    return result;
  }

  const cityNameOnly = normalizedInput.split(',')[0].trim();
  const fuzzyMatch = citiesData.find(city =>
    city.city.toLowerCase().includes(cityNameOnly) ||
    cityNameOnly.includes(city.city.toLowerCase())
  );

  if (fuzzyMatch) {
    const result = {
      city: fuzzyMatch.city,
      country: fuzzyMatch.country,
      latitude: fuzzyMatch.lat,
      longitude: fuzzyMatch.lng,
      timezone: fuzzyMatch.timezone,
      source: 'local-fuzzy'
    };

    await cacheGeocodingResult(normalizedInput, result);
    return result;
  }

  try {
    const geoResults = await geocoder.geocode(locationInput);

    if (geoResults && geoResults.length > 0) {
      const geo = geoResults[0];

      const geoTz = await import('geo-tz');
      const timezones = geoTz.find(geo.latitude, geo.longitude);
      const timezone = timezones && timezones.length > 0 ? timezones[0] : 'UTC';

      const result = {
        city: geo.city || geo.county || geo.state || 'Unknown',
        country: geo.country || 'Unknown',
        latitude: geo.latitude,
        longitude: geo.longitude,
        timezone: timezone,
        source: 'geocoder'
      };

      await cacheGeocodingResult(normalizedInput, result);
      return result;
    }
  } catch (error) {
    console.error('Geocoding API failed:', error);
  }

  throw new Error(`Unable to find location: ${locationInput}. Please try with city and country (e.g., "Paris, France")`);
}

async function cacheGeocodingResult(locationInput, result) {
  try {
    await supabase
      .from('geocoding_cache')
      .insert({
        location_input: locationInput,
        city: result.city,
        country: result.country,
        latitude: result.latitude,
        longitude: result.longitude,
        timezone: result.timezone
      });
  } catch (error) {
    console.warn('Failed to cache geocoding result:', error);
  }
}

export function searchCities(query, limit = 10) {
  const normalizedQuery = query.toLowerCase();

  const matches = citiesData
    .filter(city =>
      city.city.toLowerCase().includes(normalizedQuery) ||
      city.country.toLowerCase().includes(normalizedQuery)
    )
    .slice(0, limit)
    .map(city => ({
      label: `${city.city}, ${city.country}`,
      city: city.city,
      country: city.country,
      latitude: city.lat,
      longitude: city.lng,
      timezone: city.timezone
    }));

  return matches;
}
