import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  addMechanicService,
  deleteMechanicService,
  getMyMechanicServices,
  updateMechanicService,
} from '../services/mechanic.services.service';

const MechanicServicesContext = createContext(undefined);

const getServiceId = (service) => {
  if (!service || typeof service !== 'object') {
    return '';
  }

  return String(
    service.id || service._id || service.service_id || service.serviceId || service.uuid || ''
  ).trim();
};

const extractServicesList = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== 'object') {
    return [];
  }

  if (Array.isArray(payload.services)) {
    return payload.services;
  }

  if (Array.isArray(payload.items)) {
    return payload.items;
  }

  if (Array.isArray(payload.results)) {
    return payload.results;
  }

  if (payload.data && typeof payload.data === 'object') {
    return extractServicesList(payload.data);
  }

  return [];
};

export const MechanicServicesProvider = ({ children }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getMyMechanicServices();
      const payload = response?.data || response || {};
      const nextServices = extractServicesList(payload);
      setServices(nextServices);
      return response;
    } catch (fetchError) {
      setError(fetchError?.message || 'Failed to fetch mechanic services.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const addService = useCallback(async (payload) => {
    setLoading(true);
    setError(null);

    try {
      const response = await addMechanicService(payload);
      const createdService = response?.data;
      const nextId = getServiceId(createdService);

      if (createdService && typeof createdService === 'object' && nextId) {
        setServices((prev) => [createdService, ...prev]);
      } else {
        await fetchServices();
      }

      return response;
    } catch (addError) {
      setError(addError?.message || 'Failed to add mechanic service.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchServices]);

  const updateService = useCallback(async (serviceId, payload) => {
    setLoading(true);
    setError(null);

    try {
      const response = await updateMechanicService(serviceId, payload);
      const updatedService = response?.data;
      const targetId = String(serviceId || '').trim();
      const updatedId = getServiceId(updatedService);
      const matchId = updatedId || targetId;

      if (updatedService && typeof updatedService === 'object' && matchId) {
        let didUpdate = false;

        setServices((prev) =>
          prev.map((item) => {
            const itemId = getServiceId(item);

            if (itemId && itemId === matchId) {
              didUpdate = true;
              return { ...item, ...updatedService };
            }

            return item;
          })
        );

        if (!didUpdate) {
          await fetchServices();
        }
      } else {
        await fetchServices();
      }

      return response;
    } catch (updateError) {
      setError(updateError?.message || 'Failed to update mechanic service.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchServices]);

  const deleteService = useCallback(async (serviceId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await deleteMechanicService(serviceId);
      const targetId = String(serviceId || '').trim();
      let didRemove = false;

      setServices((prev) => {
        const filtered = prev.filter((item) => {
          const keep = getServiceId(item) !== targetId;

          if (!keep) {
            didRemove = true;
          }

          return keep;
        });

        return filtered;
      });

      if (!didRemove) {
        await fetchServices();
      }

      return response;
    } catch (deleteError) {
      setError(deleteError?.message || 'Failed to delete mechanic service.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchServices]);

  const value = useMemo(
    () => ({
      services,
      loading,
      error,
      clearError,
      fetchServices,
      addService,
      updateService,
      deleteService,
    }),
    [services, loading, error, clearError, fetchServices, addService, updateService, deleteService]
  );

  return <MechanicServicesContext.Provider value={value}>{children}</MechanicServicesContext.Provider>;
};

export const useMechanicServices = () => {
  const context = useContext(MechanicServicesContext);

  if (!context) {
    throw new Error('useMechanicServices must be used within MechanicServicesProvider');
  }

  return context;
};

export default MechanicServicesContext;
