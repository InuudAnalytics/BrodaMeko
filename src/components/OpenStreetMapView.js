import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { darkTheme } from '../theme';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

// Default to Lagos, Nigeria when no coords available yet.
const DEFAULT_LAT = 6.5244;
const DEFAULT_LNG = 3.3792;

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
  const routeCoordinates = useMemo(() => {
    if (safeOtherLatitude === null || safeOtherLongitude === null) {
      return [];
    }
    return [
      { latitude: safeLatitude, longitude: safeLongitude },
      { latitude: safeOtherLatitude, longitude: safeOtherLongitude },
    ];
  }, [safeLatitude, safeLongitude, safeOtherLatitude, safeOtherLongitude]);

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
        {showRoute && routeCoordinates.length === 2 ? (
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
