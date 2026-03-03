import { GOOGLE_MAPS_API_KEY } from '../config/maps';

const GOOGLE_BASE_URL = 'https://maps.googleapis.com/maps/api';

const ensureApiKey = () => {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API key is missing.');
  }
};

const buildUrl = (path, params) => {
  const query = new URLSearchParams(params).toString();
  return `${GOOGLE_BASE_URL}/${path}?${query}`;
};

const fetchJson = async (url) => {
  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(data.error_message || 'Unable to fetch location data.');
  }

  return data;
};

const pickComponent = (components, type) =>
  components?.find((item) => Array.isArray(item?.types) && item.types.includes(type));

export const parseAddressComponents = (components = []) => {
  const streetNumber = pickComponent(components, 'street_number')?.long_name || '';
  const route = pickComponent(components, 'route')?.long_name || '';
  const locality =
    pickComponent(components, 'locality')?.long_name ||
    pickComponent(components, 'administrative_area_level_2')?.long_name ||
    pickComponent(components, 'sublocality')?.long_name ||
    '';
  const state = pickComponent(components, 'administrative_area_level_1')?.long_name || '';
  const country = pickComponent(components, 'country')?.long_name || '';

  const street = [streetNumber, route].filter(Boolean).join(' ').trim();

  return {
    street,
    city: locality,
    state,
    country,
  };
};

export const fetchPlaceSuggestions = async (input, { sessionToken } = {}) => {
  ensureApiKey();

  const url = buildUrl('place/autocomplete/json', {
    input,
    key: GOOGLE_MAPS_API_KEY,
    sessiontoken: sessionToken,
    language: 'en',
  });

  const data = await fetchJson(url);
  return (data.predictions || []).map((prediction) => ({
    placeId: prediction.place_id,
    description: prediction.description,
  }));
};

export const fetchPlaceDetails = async (placeId, { sessionToken } = {}) => {
  ensureApiKey();

  const url = buildUrl('place/details/json', {
    place_id: placeId,
    key: GOOGLE_MAPS_API_KEY,
    sessiontoken: sessionToken,
    fields: 'address_component,geometry,formatted_address,name',
    language: 'en',
  });

  const data = await fetchJson(url);
  const result = data.result || {};
  const coordinates = result.geometry?.location || {};

  return {
    formattedAddress: result.formatted_address || result.name || '',
    components: result.address_components || [],
    latitude: coordinates.lat ?? null,
    longitude: coordinates.lng ?? null,
  };
};

export const reverseGeocode = async ({ latitude, longitude }) => {
  ensureApiKey();

  const url = buildUrl('geocode/json', {
    latlng: `${latitude},${longitude}`,
    key: GOOGLE_MAPS_API_KEY,
    language: 'en',
  });

  const data = await fetchJson(url);
  const first = data.results?.[0] || {};

  return {
    formattedAddress: first.formatted_address || '',
    components: first.address_components || [],
  };
};
