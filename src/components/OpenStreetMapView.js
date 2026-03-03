import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { darkTheme } from '../theme';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

// Default to Lagos, Nigeria when no coords available yet.
const DEFAULT_LAT = 6.5244;
const DEFAULT_LNG = 3.3792;

const OpenStreetMapView = ({ latitude, longitude }) => {
  const [hasError, setHasError] = useState(false);
  const safeLatitude = clamp(toNumber(latitude, DEFAULT_LAT), -90, 90);
  const safeLongitude = clamp(toNumber(longitude, DEFAULT_LNG), -180, 180);

  const region = useMemo(
    () => ({
      latitude: safeLatitude,
      longitude: safeLongitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    }),
    [safeLatitude, safeLongitude]
  );

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
          pinColor={darkTheme.colors.accent}
        />
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
