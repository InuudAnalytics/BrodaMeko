import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { GOOGLE_MAPS_API_KEY } from '../config/maps';
import { darkTheme } from '../theme';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

// Default to Lagos, Nigeria when no coords available yet.
const DEFAULT_LAT = 6.5244;
const DEFAULT_LNG = 3.3792;

const decodePolyline = (encoded = '') => {
  const points = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += deltaLat;

    result = 0;
    shift = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += deltaLng;

    points.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return points;
};

const OpenStreetMapView = ({
  latitude,
  longitude,
  otherLatitude,
  otherLongitude,
  showRoute = false,
  currentPinColor = darkTheme.colors.accent,
  targetPinColor = '#FF2D2D',
}) => {
  const [hasError, setHasError] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const safeLatitude = clamp(toNumber(latitude, DEFAULT_LAT), -90, 90);
  const safeLongitude = clamp(toNumber(longitude, DEFAULT_LNG), -180, 180);
  const safeOtherLatitude = Number.isFinite(Number(otherLatitude))
    ? clamp(Number(otherLatitude), -90, 90)
    : null;
  const safeOtherLongitude = Number.isFinite(Number(otherLongitude))
    ? clamp(Number(otherLongitude), -180, 180)
    : null;

  const region = useMemo(
    () => ({
      latitude: safeLatitude,
      longitude: safeLongitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    }),
    [safeLatitude, safeLongitude]
  );
  const fallbackRouteCoordinates = useMemo(() => {
    if (safeOtherLatitude === null || safeOtherLongitude === null) {
      return [];
    }
    return [
      { latitude: safeLatitude, longitude: safeLongitude },
      { latitude: safeOtherLatitude, longitude: safeOtherLongitude },
    ];
  }, [safeLatitude, safeLongitude, safeOtherLatitude, safeOtherLongitude]);

  useEffect(() => {
    let active = true;
    const fetchDirectionsRoute = async () => {
      if (
        !showRoute ||
        safeOtherLatitude === null ||
        safeOtherLongitude === null ||
        !GOOGLE_MAPS_API_KEY
      ) {
        if (active) {
          setRouteCoordinates(fallbackRouteCoordinates);
        }
        return;
      }

      try {
        const origin = `${safeLatitude},${safeLongitude}`;
        const destination = `${safeOtherLatitude},${safeOtherLongitude}`;
        const url =
          `https://maps.googleapis.com/maps/api/directions/json` +
          `?origin=${encodeURIComponent(origin)}` +
          `&destination=${encodeURIComponent(destination)}` +
          `&overview=full` +
          `&mode=driving` +
          `&key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}`;

        const response = await fetch(url);
        const payload = await response.json();
        const status = String(payload?.status || '').trim().toUpperCase();
        const encoded = String(payload?.routes?.[0]?.overview_polyline?.points || '').trim();
        const decoded = encoded ? decodePolyline(encoded) : [];

        if (!active) {
          return;
        }

        if (status && status !== 'OK') {
          // Keep a deterministic fallback path while surfacing root-cause in debug logs.
          console.warn('Directions API failed:', status, payload?.error_message || '');
          setRouteCoordinates(fallbackRouteCoordinates);
          return;
        }

        setRouteCoordinates(decoded.length >= 2 ? decoded : fallbackRouteCoordinates);
      } catch {
        if (active) {
          setRouteCoordinates(fallbackRouteCoordinates);
        }
      }
    };

    fetchDirectionsRoute();
    return () => {
      active = false;
    };
  }, [
    fallbackRouteCoordinates,
    safeLatitude,
    safeLongitude,
    safeOtherLatitude,
    safeOtherLongitude,
    showRoute,
  ]);

  return (
    <View style={styles.wrap}>
      {hasError ? <View style={styles.fallback} /> : null}
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={region}
        onMapReady={() => setHasError(false)}
        onError={() => setHasError(true)}
        loadingEnabled
        toolbarEnabled={false}
        showsUserLocation
        showsMyLocationButton={false}
        followsUserLocation
      >
        <Marker
          coordinate={{ latitude: safeLatitude, longitude: safeLongitude }}
          pinColor={currentPinColor}
        />
        {safeOtherLatitude !== null && safeOtherLongitude !== null ? (
          <Marker
            coordinate={{ latitude: safeOtherLatitude, longitude: safeOtherLongitude }}
            pinColor={targetPinColor}
          />
        ) : null}
        {showRoute && routeCoordinates.length >= 2 ? (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#26A4FF"
            strokeWidth={5}
          />
        ) : null}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#2b2b31',
  },
  map: {
    flex: 1,
  },
  fallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#2b2b31',
    zIndex: 1,
  },
});

export default OpenStreetMapView;
