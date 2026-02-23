import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { darkTheme } from '../theme';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

// Default to Lagos, Nigeria when no coords available yet.
const DEFAULT_LAT = 6.5244;
const DEFAULT_LNG = 3.3792;

const buildHtml = (latitude, longitude, accentColor, baselineColor) => {
  const lat = latitude.toFixed(6);
  const lng = longitude.toFixed(6);

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV/XN/WLs=" crossorigin=""></script>
    <style>
      html, body, #map {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        background: #2b2b31;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      var map = L.map('map', {
        center: [${lat}, ${lng}],
        zoom: 15,
        zoomControl: false,
        attributionControl: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(map);

      var markerIcon = L.divIcon({
        className: '',
        html: '<div style="width:18px;height:18px;border-radius:50%;background:${accentColor};border:3px solid ${baselineColor};box-shadow:0 0 6px rgba(0,0,0,0.5);"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9]
      });

      L.marker([${lat}, ${lng}], { icon: markerIcon }).addTo(map);
    </script>
  </body>
</html>`;
};

const OpenStreetMapView = ({ latitude, longitude }) => {
  const [hasError, setHasError] = useState(false);
  const safeLatitude = clamp(toNumber(latitude, DEFAULT_LAT), -90, 90);
  const safeLongitude = clamp(toNumber(longitude, DEFAULT_LNG), -180, 180);

  const html = useMemo(
    () => buildHtml(safeLatitude, safeLongitude, darkTheme.colors.accent, darkTheme.colors.background),
    [safeLatitude, safeLongitude]
  );

  return (
    <View style={styles.wrap}>
      {hasError ? <View style={styles.fallback} /> : null}
      <WebView
        source={{ html, baseUrl: 'https://www.openstreetmap.org' }}
        originWhitelist={['*']}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        bounces={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        onError={() => setHasError(true)}
        onHttpError={() => setHasError(true)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#2b2b31',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  fallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#2b2b31',
    zIndex: 1,
  },
});

export default OpenStreetMapView;
