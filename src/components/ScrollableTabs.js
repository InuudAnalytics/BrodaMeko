import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { darkTheme } from '../theme';
import AppText from './AppText';

const ScrollableTabs = ({
  tabs = [],
  activeKey,
  onChange,
  containerStyle,
  contentContainerStyle,
  tabStyle,
  activeTabStyle,
  textStyle,
  activeTextStyle,
}) => {
  const [viewportWidth, setViewportWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);

  const hasOverflow = useMemo(() => {
    if (!viewportWidth || !contentWidth) {
      return false;
    }
    return contentWidth > viewportWidth + 1;
  }, [contentWidth, viewportWidth]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      onLayout={(event) => setViewportWidth(Number(event?.nativeEvent?.layout?.width || 0))}
      onContentSizeChange={(width) => setContentWidth(Number(width || 0))}
      contentContainerStyle={[
        styles.container,
        !hasOverflow ? styles.containerFill : null,
        contentContainerStyle,
        containerStyle,
      ]}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <TouchableOpacity
            key={tab.key}
            activeOpacity={0.85}
            onPress={() => onChange?.(tab.key)}
            style={[
              styles.tab,
              !hasOverflow ? styles.tabFill : null,
              tabStyle,
              isActive ? styles.tabActive : null,
              isActive ? activeTabStyle : null,
            ]}
          >
            <AppText
              numberOfLines={1}
              style={[
                styles.text,
                !hasOverflow ? styles.textCentered : null,
                textStyle,
                isActive ? styles.textActive : null,
                isActive ? activeTextStyle : null,
              ]}
            >
              {tab.label}
            </AppText>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    minWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 8,
    padding: 5,
    columnGap: 6,
    flexGrow: 0,
  },
  containerFill: {
    flexGrow: 1,
  },
  tab: {
    minHeight: 30,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  tabFill: {
    flex: 1,
  },
  tabActive: {
    backgroundColor: darkTheme.colors.accent,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  textCentered: {
    textAlign: 'center',
  },
  textActive: {
    color: 'rgba(26,26,26,0.92)',
  },
});

export default ScrollableTabs;
