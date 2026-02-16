import { ENDPOINTS } from '../config/endpoints';
import api from './api';

const normalizeResponse = (payload, fallbackMessage) => {
  const root = payload?.data || payload || {};
  const nestedData = root?.data !== undefined ? root.data : root;

  return {
    success: Boolean(root?.success ?? true),
    message: root?.message || fallbackMessage,
    data: nestedData,
  };
};

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

const buildCarOwnerJobsEndpoint = (limit = 10, page = 1) => {
  const safeLimit = Number.isFinite(Number(limit)) ? Number(limit) : 10;
  const safePage = Number.isFinite(Number(page)) ? Number(page) : 1;
  const basePath = ENDPOINTS.jobs.carOwnerList.split('?')[0];

  return `${basePath}?limit=${encodeURIComponent(String(safeLimit))}&page=${encodeURIComponent(String(safePage))}`;
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

  if (Array.isArray(images) && images.length) {
    payload.images = images;
  }

  const formData = buildFormData(payload);
  const response = await api.post(ENDPOINTS.jobs.create, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return normalizeResponse(response.data, 'Job created successfully.');
};

export const getCarOwnerJobs = async ({ limit = 10, page = 1 } = {}) => {
  const endpoint = buildCarOwnerJobsEndpoint(limit, page);
  const response = await api.get(endpoint);
  return normalizeResponse(response.data, 'Jobs retrieved successfully.');
};

export const getCarOwnerJob = async (jobId) => {
  const safeJobId = assertJobId(jobId);
  const response = await api.get(ENDPOINTS.jobs.carOwnerDetails(safeJobId));
  return normalizeResponse(response.data, 'Job retrieved successfully.');
};

export const updateCarOwnerJob = async (jobId, { car_make, imagesToAdd, remove_images } = {}) => {
  const safeJobId = assertJobId(jobId);
  const payload = {};

  if (car_make !== undefined) {
    const safeCarMake = String(car_make || '').trim();

    if (!safeCarMake) {
      buildServiceError('car_make cannot be empty when provided.');
    }

    payload.car_make = safeCarMake;
  }

  if (Array.isArray(imagesToAdd) && imagesToAdd.length) {
    payload.images = imagesToAdd;
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
  const response = await api.patch(ENDPOINTS.jobs.carOwnerUpdate(safeJobId), formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return normalizeResponse(response.data, 'Job updated successfully.');
};

export const deleteJob = async (jobId) => {
  const safeJobId = assertJobId(jobId);
  const response = await api.delete(ENDPOINTS.jobs.delete(safeJobId));
  return normalizeResponse(response.data, 'Job deleted successfully.');
};

export default {
  buildFormData,
  createJob,
  getCarOwnerJobs,
  getCarOwnerJob,
  updateCarOwnerJob,
  deleteJob,
};
