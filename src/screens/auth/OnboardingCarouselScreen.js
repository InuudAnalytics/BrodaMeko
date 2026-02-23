import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, FlatList, Image, Pressable, StatusBar, StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { ClipPath, Defs, Image as SvgImage, Path, Rect } from 'react-native-svg';
import { AppButton, AppText, ScreenContainer } from '../../components';
import { useAuth } from '../../context';
import { darkTheme } from '../../theme';
import { ROLES, ROUTES } from '../../utils';

const AUTO_SCROLL_INTERVAL_MS = 4000;
const PAGINATION_DOT_SIZE = 10;
const PAGINATION_ACTIVE_DOT_WIDTH = 64;
const PAGINATION_INACTIVE_COLOR = '#F5F5F5';
const PAGINATION_ACTIVE_COLOR = '#E6C714';
const IMAGE_OVERLAY_COLOR = 'rgba(0,0,0,0.18)';
const CAROUSEL_IMAGE_HEIGHT = 400;

const SLIDES = [
  {
    key: 'onboarding-1',
    title: 'Car Troubles?',
    subtitle: 'Find trusted mechanics nearby and get back on the road without stress.',
    image: require('../../../assets/images/onboarding/onboarding1.png'),
  },
  {
    key: 'onboarding-2',
    title: 'More jobs, less stress',
    subtitle: 'Get discovered by real car owners who need urgent support now.',
    image: require('../../../assets/images/onboarding/onboarding2.png'),
  },
  {
    key: 'onboarding-3',
    title: 'Sell Parts, Grow Fast',
    subtitle: 'Reach vehicle owners and mechanics searching for quality parts.',
    image: require('../../../assets/images/onboarding/onboarding3.png'),
  },
];

const ROLE_ACTIONS = [
  { key: 'car-owner', label: 'Get started as car owner', role: ROLES.CAR_OWNER, variant: 'carOwner' },
  { key: 'mechanic', label: 'Get started as mechanic', role: ROLES.MECH, variant: 'mechanic' },
  { key: 'spare-parts', label: 'Get started as spare part seller', role: ROLES.CAR_OWNER, variant: 'spareParts' },
];

const BadgeImage = ({ source, clipId }) => {
  const resolved = Image.resolveAssetSource(source);
  const imageUri = resolved?.uri || '';
  const shapePath =
    'M88 0 H912 Q1000 0 1000 88 V716 Q1000 802 930 854 Q750 914 598 954 Q500 980 402 954 Q250 914 70 854 Q0 802 0 716 V88 Q0 0 88 0 Z';

  return (
    <View style={styles.badgeWrap}>
      <Svg width="100%" height="100%" viewBox="0 0 1000 980" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <ClipPath id={clipId}>
            <Path d={shapePath} />
          </ClipPath>
        </Defs>
        <SvgImage
          x={0}
          y={0}
          width={1000}
          height={980}
          href={{ uri: imageUri }}
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${clipId})`}
        />
        <Rect
          x={0}
          y={0}
          width={1000}
          height={980}
          fill={IMAGE_OVERLAY_COLOR}
          clipPath={`url(#${clipId})`}
        />
      </Svg>
    </View>
  );
};

const OnboardingCarouselScreen = ({ navigation, route }) => {
  const { width } = useWindowDimensions();
  const { setSelectedRole } = useAuth();
  const returnToLogin = route?.params?.returnToLogin === true;

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const textOpacity = useRef(new Animated.Value(1)).current;
  const scrollX = useRef(new Animated.Value(0)).current;
  const isTransitioning = useRef(false);

  const slidesCount = SLIDES.length;
  const activeSlide = SLIDES[currentIndex] || SLIDES[0];

  const goToSlide = useCallback(
    (nextIndex) => {
      if (isTransitioning.current || slidesCount <= 1) {
        return;
      }

      isTransitioning.current = true;
      Animated.timing(textOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(() => {
        setCurrentIndex(nextIndex);
        flatListRef.current?.scrollToOffset({
          offset: nextIndex * width,
          animated: true,
        });

        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }).start(() => {
          isTransitioning.current = false;
        });
      });
    },
    [slidesCount, textOpacity, width]
  );

  const advanceSlide = useCallback(() => {
    const nextIndex = (currentIndex + 1) % slidesCount;
    goToSlide(nextIndex);
  }, [currentIndex, goToSlide, slidesCount]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      advanceSlide();
    }, AUTO_SCROLL_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [advanceSlide]);

  const handleRolePress = async (nextRole) => {
    await setSelectedRole(nextRole);

    if (returnToLogin) {
      navigation.replace(ROUTES.LOGIN, { role: nextRole });
      return;
    }

    navigation.replace(ROUTES.SIGN_UP, { role: nextRole });
  };

  const renderSlide = useCallback(
    ({ item, index }) => (
      <View style={[styles.slide, { width }]}>
        <BadgeImage source={item.image} clipId={`onboardingClip-${index}`} />
      </View>
    ),
    [width]
  );

  const paginationDots = useMemo(
    () =>
      SLIDES.map((slide, index) => {
        const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
        const animatedWidth = scrollX.interpolate({
          inputRange,
          outputRange: [PAGINATION_DOT_SIZE, PAGINATION_ACTIVE_DOT_WIDTH, PAGINATION_DOT_SIZE],
          extrapolate: 'clamp',
        });
        const animatedOpacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.4, 1, 0.4],
          extrapolate: 'clamp',
        });
        const animatedBackgroundColor = scrollX.interpolate({
          inputRange,
          outputRange: [PAGINATION_INACTIVE_COLOR, PAGINATION_ACTIVE_COLOR, PAGINATION_INACTIVE_COLOR],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            key={slide.key}
            style={[
              styles.paginationDot,
              {
                width: animatedWidth,
                opacity: animatedOpacity,
                backgroundColor: animatedBackgroundColor,
              },
            ]}
          />
        );
      }),
    [scrollX, width]
  );

  return (
    <ScreenContainer padded={false} keyboardAware={false} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={darkTheme.colors.background} />

      <Pressable style={styles.carouselSection} onPress={advanceSlide}>
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          renderItem={renderSlide}
          keyExtractor={(item) => item.key}
          style={styles.carouselList}
          contentContainerStyle={styles.carouselListContent}
          horizontal
          pagingEnabled
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: false,
          })}
          scrollEventThrottle={16}
        />

        <View style={styles.paginationRow}>{paginationDots}</View>

        <Animated.View style={[styles.textWrap, { opacity: textOpacity }]}>
          <AppText variant="title" style={styles.heading}>
            {activeSlide.title}
          </AppText>
          <AppText variant="muted" style={styles.subtext}>
            {activeSlide.subtitle}
          </AppText>
        </Animated.View>

      </Pressable>

      <View style={styles.buttonsSection}>
        {ROLE_ACTIONS.map((action, index) => (
          <AppButton
            key={action.key}
            label={action.label}
            onPress={() => handleRolePress(action.role)}
            style={[
              styles.roleButtonBase,
              action.variant === 'carOwner' ? styles.carOwnerButton : null,
              action.variant === 'mechanic' ? styles.mechanicButton : null,
              action.variant === 'spareParts' ? styles.sparePartsButton : null,
              index < ROLE_ACTIONS.length - 1 ? styles.buttonGap : null,
            ]}
            textStyle={[
              styles.roleButtonText,
              action.variant === 'spareParts' ? styles.sparePartsButtonText : styles.lightButtonText,
            ]}
          />
        ))}
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: darkTheme.colors.background,
  },
  carouselSection: {
    paddingTop: darkTheme.spacing.xs,
  },
  slide: {
    height: CAROUSEL_IMAGE_HEIGHT,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: darkTheme.spacing.lg,
  },
  slideImage: {
    width: '100%',
    height: 360,
    borderTopLeftRadius: darkTheme.radius.xl,
    borderTopRightRadius: darkTheme.radius.xl,
    borderBottomLeftRadius: darkTheme.radius.xxxl,
    borderBottomRightRadius: darkTheme.radius.xxxl,
  },
  badgeWrap: {
    width: '100%',
    height: CAROUSEL_IMAGE_HEIGHT,
  },
  carouselList: {
    height: CAROUSEL_IMAGE_HEIGHT,
    flexGrow: 0,
  },
  carouselListContent: {
    height: CAROUSEL_IMAGE_HEIGHT,
    alignItems: 'flex-start',
  },
  textWrap: {
    marginTop: darkTheme.spacing.md,
    paddingHorizontal: darkTheme.spacing.xl,
  },
  heading: {
    color: darkTheme.colors.text,
    marginBottom: darkTheme.spacing.xs,
  },
  subtext: {
    color: darkTheme.colors.muted,
    lineHeight: 21,
  },
  paginationRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: darkTheme.spacing.xs,
    marginTop: darkTheme.spacing.sm,
  },
  paginationDot: {
    height: PAGINATION_DOT_SIZE,
    borderRadius: PAGINATION_DOT_SIZE / 2,
    backgroundColor: PAGINATION_INACTIVE_COLOR,
  },
  buttonsSection: {
    width: '92%',
    alignSelf: 'center',
    paddingHorizontal: darkTheme.spacing.md,
    paddingTop: darkTheme.spacing.sm,
    paddingBottom: darkTheme.spacing.lg,
  },
  buttonGap: {
    marginBottom: darkTheme.spacing.sm,
  },
  roleButtonBase: {
    minHeight: 48,
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: darkTheme.typography.fontWeights.regular,
  },
  carOwnerButton: {
    backgroundColor: darkTheme.colors.accent,
  },
  mechanicButton: {
    backgroundColor: '#F5F5F5',
  },
  sparePartsButton: {
    backgroundColor: '#000033',
  },
  lightButtonText: {
    color: '#0B0B0B',
  },
  sparePartsButtonText: {
    color: '#F5F5F5',
  },
});

export default OnboardingCarouselScreen;
