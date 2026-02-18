import React, { createContext, useContext, useState } from 'react';
import {
  createJob as createJobService,
  deleteJob as deleteJobService,
  getCarOwnerJob,
  getCarOwnerJobs,
  updateCarOwnerJob,
} from '../services/jobs.service';

const JobsContext = createContext(undefined);

const getJobId = (job) => {
  if (!job || typeof job !== 'object') {
    return '';
  }

  return String(job.id || job._id || job.job_id || job.jobId || '').trim();
};

const extractCreatedJob = (response) => {
  const root = response?.data || response || {};

  if (!root || typeof root !== 'object') {
    return null;
  }

  if (root.job && typeof root.job === 'object') {
    return root.job;
  }

  if (root.data && typeof root.data === 'object') {
    if (root.data.job && typeof root.data.job === 'object') {
      return root.data.job;
    }
    return root.data;
  }

  return root;
};

const extractJobs = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== 'object') {
    return [];
  }

  if (Array.isArray(payload.jobs)) {
    return payload.jobs;
  }

  if (Array.isArray(payload.items)) {
    return payload.items;
  }

  if (Array.isArray(payload.results)) {
    return payload.results;
  }

  return [];
};

export const JobsProvider = ({ children }) => {
  const [myJobs, setMyJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState({
    createJob: false,
    fetchMyJobs: false,
    fetchJob: false,
    updateJob: false,
    deleteJob: false,
  });

  const setLoadingFlag = (key, value) => {
    setLoading((prev) => ({ ...prev, [key]: Boolean(value) }));
  };

  const clearError = () => {
    setError(null);
  };

  const createJob = async (payload) => {
    setLoadingFlag('createJob', true);
    clearError();

    try {
      const response = await createJobService(payload);
      const created = extractCreatedJob(response);
      const createdId = getJobId(created);

      if (created && typeof created === 'object') {
        setSelectedJob(created);
      }

      if (created && typeof created === 'object' && createdId) {
        setMyJobs((prev) => [created, ...prev]);
      } else {
        await fetchMyJobs({});
      }

      return response;
    } catch (createError) {
      setError(createError?.message || 'Failed to create job.');
      return null;
    } finally {
      setLoadingFlag('createJob', false);
    }
  };

  const fetchMyJobs = async ({ limit = 5, page = 1 } = {}) => {
    setLoadingFlag('fetchMyJobs', true);
    clearError();

    try {
      const response = await getCarOwnerJobs({ limit, page });
      const nextJobs = extractJobs(response?.data);
      setMyJobs(nextJobs);
      return response;
    } catch (listError) {
      setError(listError?.message || 'Failed to fetch jobs.');
      return null;
    } finally {
      setLoadingFlag('fetchMyJobs', false);
    }
  };

  const fetchJob = async (jobId) => {
    setLoadingFlag('fetchJob', true);
    clearError();

    try {
      const response = await getCarOwnerJob(jobId);
      const job = response?.data || null;

      if (job && typeof job === 'object') {
        setSelectedJob(job);

        const targetId = getJobId(job);
        if (targetId) {
          let found = false;

          setMyJobs((prev) =>
            prev.map((item) => {
              if (getJobId(item) === targetId) {
                found = true;
                return { ...item, ...job };
              }

              return item;
            })
          );

          if (!found) {
            setMyJobs((prev) => [job, ...prev]);
          }
        }
      } else {
        setSelectedJob(null);
      }

      return response;
    } catch (jobError) {
      setError(jobError?.message || 'Failed to fetch job details.');
      return null;
    } finally {
      setLoadingFlag('fetchJob', false);
    }
  };

  const updateJob = async (jobId, payload) => {
    setLoadingFlag('updateJob', true);
    clearError();

    try {
      const response = await updateCarOwnerJob(jobId, payload);
      const updated = response?.data;
      const targetId = String(jobId || '').trim();
      const updatedId = getJobId(updated);
      const matchId = updatedId || targetId;

      if (updated && typeof updated === 'object' && matchId) {
        setMyJobs((prev) =>
          prev.map((item) => (getJobId(item) === matchId ? { ...item, ...updated } : item))
        );

        if (getJobId(selectedJob) === matchId) {
          setSelectedJob((prev) => ({ ...(prev || {}), ...updated }));
        }
      } else {
        await fetchMyJobs({});
      }

      return response;
    } catch (updateError) {
      setError(updateError?.message || 'Failed to update job.');
      return null;
    } finally {
      setLoadingFlag('updateJob', false);
    }
  };

  const deleteJob = async (jobId) => {
    setLoadingFlag('deleteJob', true);
    clearError();

    try {
      const response = await deleteJobService(jobId);
      const targetId = String(jobId || '').trim();

      setMyJobs((prev) => prev.filter((item) => getJobId(item) !== targetId));

      if (getJobId(selectedJob) === targetId) {
        setSelectedJob(null);
      }

      return response;
    } catch (deleteError) {
      setError(deleteError?.message || 'Failed to delete job.');
      return null;
    } finally {
      setLoadingFlag('deleteJob', false);
    }
  };

  const value = {
    myJobs,
    selectedJob,
    loading,
    error,
    clearError,
    createJob,
    fetchMyJobs,
    fetchJob,
    updateJob,
    deleteJob,
  };

  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>;
};

export const useJobs = () => {
  const context = useContext(JobsContext);

  if (!context) {
    throw new Error('useJobs must be used within JobsProvider');
  }

  return context;
};

export default JobsContext;
