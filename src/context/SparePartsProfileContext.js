import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

const STORAGE_KEY_BASE = '@brodameko/spare_parts_profile';

const INITIAL_PROFILE = {
  cacImages: [],
  ninImages: [],
  bankDetails: null,
  storeDetails: null,
  skippedSteps: [],
};

const SparePartsProfileContext = createContext(undefined);

const sanitizeProfile = (value) => {
  const next = value && typeof value === 'object' ? value : {};
  const bank = next.bankDetails && typeof next.bankDetails === 'object' ? next.bankDetails : null;
  const storeDetails = next.storeDetails && typeof next.storeDetails === 'object' ? next.storeDetails : null;

  return {
    cacImages: Array.isArray(next.cacImages) ? next.cacImages.filter(Boolean) : [],
    ninImages: Array.isArray(next.ninImages) ? next.ninImages.filter(Boolean) : [],
    bankDetails: bank
      ? {
          id: String(bank.id || '').trim(),
          accountName: String(bank.accountName || '').trim(),
          accountNumber: String(bank.accountNumber || '').trim(),
          bankName: String(bank.bankName || '').trim(),
          isPrimary: Boolean(bank.isPrimary),
        }
      : null,
    storeDetails: storeDetails
      ? {
          storeName: String(storeDetails?.storeName || storeDetails?.store_name || '').trim(),
          description: String(storeDetails?.description || '').trim(),
          street: String(storeDetails?.street || '').trim(),
          city: String(storeDetails?.city || '').trim(),
          state: String(storeDetails?.state || '').trim(),
          country: String(storeDetails?.country || '').trim(),
          latitude: String(storeDetails?.latitude ?? '').trim(),
          longitude: String(storeDetails?.longitude ?? '').trim(),
          openingTime: String(storeDetails?.openingTime || storeDetails?.opening_time || '').trim(),
          closingTime: String(storeDetails?.closingTime || storeDetails?.closing_time || '').trim(),
          openDays: Array.isArray(storeDetails?.openDays || storeDetails?.open_days) ? (storeDetails?.openDays || storeDetails?.open_days) : [],
          deliveryType: String(storeDetails?.deliveryType || storeDetails?.delivery_type || '').trim(),
          deliveryScope: String(storeDetails?.deliveryScope || storeDetails?.delivery_scope || '').trim(),
          bannerUrl: String(storeDetails?.bannerUrl || storeDetails?.banner_url || '').trim(),
        }
      : null,
    skippedSteps: Array.isArray(next.skippedSteps) ? next.skippedSteps.filter(Boolean) : [],
  };
};

export const SparePartsProfileProvider = ({ children }) => {
  const { user, role } = useAuth();
  const [sparePartsProfile, setSparePartsProfile] = useState(INITIAL_PROFILE);
  const [isHydrated, setIsHydrated] = useState(false);

  const ownerKey = useMemo(() => {
    const raw =
      user?.id ||
      user?._id ||
      user?.user_id ||
      user?.seller_id ||
      user?.email ||
      user?.phone_number ||
      user?.phoneNumber ||
      'guest';

    return String(raw || 'guest').trim() || 'guest';
  }, [user]);

  const storageKey = useMemo(
    () => `${STORAGE_KEY_BASE}:${String(role || 'unknown').toLowerCase()}:${ownerKey}`,
    [ownerKey, role]
  );

  useEffect(() => {
    const restore = async () => {
      setIsHydrated(false);
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          setSparePartsProfile(sanitizeProfile(parsed));
        } else {
          setSparePartsProfile(INITIAL_PROFILE);
        }
      } catch {
        setSparePartsProfile(INITIAL_PROFILE);
      } finally {
        setIsHydrated(true);
      }
    };

    restore();
  }, [storageKey]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    AsyncStorage.setItem(storageKey, JSON.stringify(sparePartsProfile)).catch(() => {});
  }, [isHydrated, sparePartsProfile, storageKey]);

  const setCac = useCallback((images = []) => {
    setSparePartsProfile((prev) => ({
      ...prev,
      cacImages: Array.isArray(images) ? images.filter(Boolean) : [],
    }));
  }, []);

  const setNin = useCallback((images = []) => {
    setSparePartsProfile((prev) => ({
      ...prev,
      ninImages: Array.isArray(images) ? images.filter(Boolean) : [],
    }));
  }, []);

  const setBankDetails = useCallback((details) => {
    const normalized = details && typeof details === 'object'
      ? {
          id: String(details.id || '').trim(),
          accountName: String(details.accountName || '').trim(),
          accountNumber: String(details.accountNumber || '').trim(),
          bankName: String(details.bankName || '').trim(),
          isPrimary: Boolean(details.isPrimary),
        }
      : null;

    setSparePartsProfile((prev) => ({
      ...prev,
      bankDetails: normalized,
    }));
  }, []);

  const setStoreDetails = useCallback((details) => {
    const normalized = details && typeof details === 'object'
      ? {
          storeName: String(details?.storeName || details?.store_name || '').trim(),
          description: String(details?.description || '').trim(),
          street: String(details?.street || '').trim(),
          city: String(details?.city || '').trim(),
          state: String(details?.state || '').trim(),
          country: String(details?.country || '').trim(),
          latitude: String(details?.latitude ?? '').trim(),
          longitude: String(details?.longitude ?? '').trim(),
          openingTime: String(details?.openingTime || details?.opening_time || '').trim(),
          closingTime: String(details?.closingTime || details?.closing_time || '').trim(),
          openDays: Array.isArray(details?.openDays || details?.open_days) ? (details?.openDays || details?.open_days) : [],
          deliveryType: String(details?.deliveryType || details?.delivery_type || '').trim(),
          deliveryScope: String(details?.deliveryScope || details?.delivery_scope || '').trim(),
          bannerUrl: String(details?.bannerUrl || details?.banner_url || '').trim(),
        }
      : null;

    setSparePartsProfile((prev) => ({
      ...prev,
      storeDetails: normalized,
    }));
  }, []);

  const resetSparePartsProfile = useCallback(() => {
    setSparePartsProfile(INITIAL_PROFILE);
  }, []);

  const markStepSkipped = useCallback((routeName) => {
    const value = String(routeName || '').trim();
    if (!value) {
      return;
    }

    setSparePartsProfile((prev) => ({
      ...prev,
      skippedSteps: Array.from(new Set([...(prev.skippedSteps || []), value])),
    }));
  }, []);

  const clearSkippedStep = useCallback((routeName) => {
    const value = String(routeName || '').trim();
    if (!value) {
      return;
    }

    setSparePartsProfile((prev) => ({
      ...prev,
      skippedSteps: (prev.skippedSteps || []).filter((step) => step !== value),
    }));
  }, []);

  const resetSkippedSteps = useCallback(() => {
    setSparePartsProfile((prev) => ({
      ...prev,
      skippedSteps: [],
    }));
  }, []);

  const completedSteps = useMemo(() => {
    const bank = sparePartsProfile.bankDetails || {};
    const hasBank = Boolean(bank.accountName && bank.accountNumber && bank.bankName);

    return {
      cac: sparePartsProfile.cacImages.length > 0,
      nin: sparePartsProfile.ninImages.length > 0,
      address: Boolean(sparePartsProfile.storeDetails?.storeName),
      bank: hasBank,
    };
  }, [sparePartsProfile]);

  const completionPercent = useMemo(() => {
    const completedCount = Object.values(completedSteps).filter(Boolean).length;
    return Math.round((completedCount / 4) * 100);
  }, [completedSteps]);

  const isComplete = completionPercent >= 100;

  const value = useMemo(
    () => ({
      sparePartsProfile,
      completedSteps,
      completionPercent,
      isComplete,
      isHydrated,
      setCac,
      setNin,
      setBankDetails,
      setStoreDetails,
      markStepSkipped,
      clearSkippedStep,
      resetSkippedSteps,
      resetSparePartsProfile,
      skippedSteps: sparePartsProfile.skippedSteps || [],
    }),
    [
      sparePartsProfile,
      completedSteps,
      completionPercent,
      isComplete,
      isHydrated,
      setCac,
      setNin,
      setBankDetails,
      setStoreDetails,
      markStepSkipped,
      clearSkippedStep,
      resetSkippedSteps,
      resetSparePartsProfile,
    ]
  );

  return <SparePartsProfileContext.Provider value={value}>{children}</SparePartsProfileContext.Provider>;
};

export const useSparePartsProfile = () => {
  const context = useContext(SparePartsProfileContext);

  if (!context) {
    throw new Error('useSparePartsProfile must be used within SparePartsProfileProvider');
  }

  return context;
};

export default SparePartsProfileContext;
