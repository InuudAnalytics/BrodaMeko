import { ENDPOINTS } from '../config/endpoints';
import api from './api';

const buildServiceError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  error.data = null;
  throw error;
};

const assertJobId = (jobId) => {
  const safeJobId = String(jobId || '').trim();

  if (!safeJobId) {
    buildServiceError('jobId is required.');
  }

  return safeJobId;
};

const toFilePart = (file, index = 0) => {
  if (!file) {
    return null;
  }

  if (typeof file === 'string') {
    const uri = file.trim();

    if (!uri) {
      return null;
    }

    return {
      uri,
      name: `image_${index}.jpg`,
      type: 'image/jpeg',
    };
  }

  if (typeof file === 'object') {
    const uri = String(file.uri || file.path || '').trim();

    if (!uri) {
      return null;
    }

    return {
      uri,
      name: String(file.fileName || file.name || `image_${index}.jpg`),
      type: String(file.type || 'image/jpeg'),
    };
  }

  return null;
};

export const buildFormData = (fields = {}) => {
  const form = new FormData();

  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (Array.isArray(value)) {
      if (key === 'images') {
        value.forEach((item, index) => {
          const filePart = toFilePart(item, index);

          if (filePart) {
            form.append('images', filePart);
          }
        });
        return;
      }

      value.forEach((item) => {
        if (item === undefined || item === null) {
          return;
        }

        if (typeof item === 'object') {
          form.append(key, JSON.stringify(item));
          return;
        }

        form.append(key, String(item));
      });
      return;
    }

    if (key === 'images') {
      const filePart = toFilePart(value);
      if (filePart) {
        form.append('images', filePart);
      }
      return;
    }

    if (typeof value === 'object') {
      form.append(key, JSON.stringify(value));
      return;
    }

    form.append(key, String(value));
  });

  return form;
};

const buildCarOwnerJobsParams = (limit = 10, page = 1) => {
  const safeLimit = Number.isFinite(Number(limit)) ? Number(limit) : 10;
  const safePage = Number.isFinite(Number(page)) ? Number(page) : 1;
  return { limit: safeLimit, page: safePage };
};

export const createJob = async ({ issue_type, description, car_make, images }) => {
  const safeCarMake = String(car_make || '').trim();

  if (!safeCarMake) {
    buildServiceError('car_make is required.');
  }

  const payload = {
    car_make: safeCarMake,
  };

  // Keep guarded optional fields for backend compatibility.
  const safeIssueType = String(issue_type || '').trim();
  const safeDescription = String(description || '').trim();

  if (safeIssueType) {
    payload.issue_type = safeIssueType;
  }

  if (safeDescription) {
    payload.description = safeDescription;
  }

  const imageFiles = Array.isArray(images) ? images.slice(0, 2) : [];
  if (imageFiles.length) {
    payload.images = imageFiles;
  }

  const formData = buildFormData(payload);
  const response = await api.post(ENDPOINTS.jobs.create, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data;
};

export const getCarOwnerJobs = async ({ limit = 10, page = 1 } = {}) => {
  const response = await api.get(ENDPOINTS.jobs.carOwnerList, {
    params: buildCarOwnerJobsParams(limit, page),
  });
  return response.data;
};

export const getCarOwnerJob = async (jobId) => {
  const safeJobId = assertJobId(jobId);
  const response = await api.get(ENDPOINTS.jobs.carOwnerDetails(safeJobId));
  return response.data;
};

export const updateCarOwnerJob = async (jobId, { description, car_make, imagesToAdd, remove_images } = {}) => {
  const safeJobId = assertJobId(jobId);
  const payload = {};

  if (description !== undefined) {
    payload.description = String(description || '').trim();
  }

  if (car_make !== undefined) {
    const safeCarMake = String(car_make || '').trim();

    if (!safeCarMake) {
      buildServiceError('car_make cannot be empty when provided.');
    }

    payload.car_make = safeCarMake;
  }

  if (Array.isArray(imagesToAdd) && imagesToAdd.length) {
    payload.images = imagesToAdd.slice(0, 2);
  }

  if (remove_images !== undefined) {
    if (!Array.isArray(remove_images)) {
      buildServiceError('remove_images must be an array when provided.');
    }

    payload.remove_images = JSON.stringify(remove_images);
  }

  if (!Object.keys(payload).length) {
    buildServiceError('Provide at least one field to update.');
  }

  const formData = buildFormData(payload);
  const response = await api.post(ENDPOINTS.jobs.carOwnerUpdate(safeJobId), formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data;
};

export const deleteJob = async (jobId) => {
  const safeJobId = assertJobId(jobId);
  const response = await api.delete(ENDPOINTS.jobs.delete(safeJobId));
  return response.data;
};

const buildMechanicAssignedParams = ({ status, created_after, page = 1, limit = 10 } = {}) => {
  const params = {};

  if (status !== undefined && String(status).trim()) {
    params.status = String(status).trim();
  }

  if (created_after !== undefined && String(created_after).trim()) {
    params.created_after = String(created_after).trim();
  }

  params.page = Number.isFinite(Number(page)) ? Number(page) : 1;
  params.limit = Number.isFinite(Number(limit)) ? Number(limit) : 10;

  return params;
};

export const getMechanicAssignedJobs = async ({ status, created_after, page = 1, limit = 10 } = {}) => {
  const response = await api.get(ENDPOINTS.jobs.mechanicAssigned, {
    params: buildMechanicAssignedParams({ status, created_after, page, limit }),
  });
  return response.data;
};

export const getMechanicAssignedJob = async (jobId) => {
  const safeJobId = assertJobId(jobId);
  const response = await api.get(ENDPOINTS.jobs.mechanicAssignedDetails(safeJobId));
  return response.data;
};

export const updateJobStatus = async (jobId, status) => {
  const safeJobId = assertJobId(jobId);
  const safeStatus = String(status || '').trim();

  if (!safeStatus) {
    buildServiceError('status is required.');
  }

  const response = await api.patch(ENDPOINTS.jobs.updateStatus(safeJobId), { status: safeStatus });
  return response.data;
};

export const confirmJob = async (jobId) => {
  const safeJobId = assertJobId(jobId);
  const response = await api.post(ENDPOINTS.jobs.confirm(safeJobId), {});
  return response.data;
};

export const fileJobDispute = async (jobId, reason) => {
  const safeJobId = assertJobId(jobId);
  const safeReason = String(reason || '').trim();

  if (!safeReason) {
    buildServiceError('reason is required.');
  }

  const response = await api.post(ENDPOINTS.jobs.dispute(safeJobId), { reason: safeReason });
  return response.data;
};

export const getMechanicsForJob = async (jobId) => {
  const safeJobId = assertJobId(jobId);
  const response = await api.get(ENDPOINTS.jobs.mechanicsForJob(safeJobId));
  return response.data;
};

export const hireMechanicForJob = async (jobId, mechanicId) => {
  const safeJobId = assertJobId(jobId);
  const safeMechanicId = String(mechanicId || '').trim();

  if (!safeMechanicId) {
    buildServiceError('mechanic_id is required.');
  }

  const response = await api.post(ENDPOINTS.jobs.hire(safeJobId), {
    mechanic_id: safeMechanicId,
  });
  return response.data;
};

export const respondToJobRequest = async (jobId, action) => {
  const safeJobId = assertJobId(jobId);
  const safeAction = String(action || '').trim().toLowerCase();

  if (safeAction !== 'accept' && safeAction !== 'decline') {
    buildServiceError('action must be accept or decline.');
  }

  const response = await api.post(ENDPOINTS.jobs.requestRespond(safeJobId), {
    action: safeAction,
  });
  return response.data;
};

export const getJobRequestStatus = async (jobId) => {
  const safeJobId = assertJobId(jobId);
  const response = await api.get(ENDPOINTS.jobs.requestStatus(safeJobId));
  return response.data;
};

export const getMechanicPendingJobRequests = async () => {
  const response = await api.get(ENDPOINTS.mechanic.jobRequests);
  return response.data;
};

export const getConversationByJobId = async (jobId) => {
  const safeJobId = assertJobId(jobId);
  try {
    const response = await api.get(ENDPOINTS.jobs.getConversation(safeJobId));
    const payload = response?.data || response || {};
    const root = payload?.data || payload;

    // Backend may return { conversation }, a bare conversation object,
    // or an array (including []) while conversation-service is stabilizing.
    let conversation = null;
    if (Array.isArray(root)) {
      conversation = root[0] || null;
    } else if (Array.isArray(root?.conversation)) {
      conversation = root.conversation[0] || null;
    } else {
      conversation = root?.conversation || root?.data?.conversation || null;
    }

    return {
      ...payload,
      data: {
        ...(typeof root === 'object' && root !== null && !Array.isArray(root) ? root : {}),
        conversation,
      },
    };
  } catch (error) {
    const statusCode = Number(error?.statusCode || error?.response?.status || 0);
    if (statusCode === 404) {
      return { data: { conversation: null } };
    }
    throw error;
  }
};

export const getMechanicJobStats = async (mechanicId) => {
  const safeMechanicId = String(mechanicId || '').trim();

  if (!safeMechanicId) {
    buildServiceError('mechanicId is required.');
  }

  const response = await api.get(ENDPOINTS.jobs.mechanicStats(safeMechanicId));
  return response.data;
};

export const updateJobLocation = async (jobId, { lat, lng, heading, speed } = {}) => {
  const safeJobId = assertJobId(jobId);
  const payload = {};

  if (lat !== undefined) {
    payload.lat = Number(lat);
  }
  if (lng !== undefined) {
    payload.lng = Number(lng);
  }
  if (heading !== undefined) {
    payload.heading = Number(heading);
  }
  if (speed !== undefined) {
    payload.speed = Number(speed);
  }

  const response = await api.post(ENDPOINTS.jobs.locationUpdate(safeJobId), payload);
  return response.data;
};

export const getLatestJobLocation = async (jobId) => {
  const safeJobId = assertJobId(jobId);
  const response = await api.get(ENDPOINTS.jobs.locationLatest(safeJobId));
  return response.data;
};

export const getSingleJob = getCarOwnerJob;
export const updateJob = updateCarOwnerJob;
export const getAvailableJobs = getMechanicAssignedJobs;

export default {
  buildFormData,
  createJob,
  getCarOwnerJobs,
  getCarOwnerJob,
  getSingleJob,
  updateCarOwnerJob,
  updateJob,
  deleteJob,
  getAvailableJobs,
  getMechanicAssignedJobs,
  getMechanicAssignedJob,
  updateJobStatus,
  confirmJob,
  fileJobDispute,
  getMechanicsForJob,
  hireMechanicForJob,
  respondToJobRequest,
  getJobRequestStatus,
  getMechanicPendingJobRequests,
  getConversationByJobId,
  getMechanicJobStats,
  updateJobLocation,
  getLatestJobLocation,
};
