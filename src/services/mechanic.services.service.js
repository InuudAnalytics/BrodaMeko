import {
  ISSUE_TYPES,
  addMechanicService as addMechanicServiceBase,
  deleteMechanicService as deleteMechanicServiceBase,
  getMyMechanicServices as getMyMechanicServicesBase,
  updateMechanicService as updateMechanicServiceBase,
} from './mechanic.service';

export { ISSUE_TYPES };

export const addMechanicService = async (payload) => addMechanicServiceBase(payload);

export const getMyMechanicServices = async () => getMyMechanicServicesBase();

export const updateMechanicService = async (serviceId, payload) =>
  updateMechanicServiceBase(serviceId, payload);

export const deleteMechanicService = async (serviceId) => deleteMechanicServiceBase(serviceId);

export default {
  ISSUE_TYPES,
  addMechanicService,
  getMyMechanicServices,
  updateMechanicService,
  deleteMechanicService,
};
