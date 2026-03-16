// Location is enabled. Map is powered by OpenStreetMap (no Google Maps billing required).
export const LOCATION_ENABLED = true;

// Dispute V2 endpoint rollout controls.
export const DISPUTE_V2_ENABLED_GLOBAL = true;
export const DISPUTE_V2_ENABLED_BY_ROLE = {
  car_owner: true,
  mechanic: true,
  seller: true,
};

export const isDisputeV2EnabledForRole = (role) => {
  if (!DISPUTE_V2_ENABLED_GLOBAL) {
    return false;
  }

  const safeRole = String(role || '').trim().toLowerCase();
  if (!safeRole) {
    return DISPUTE_V2_ENABLED_GLOBAL;
  }

  if (safeRole === 'car_owner' || safeRole === 'carowner' || safeRole === 'car owner') {
    return Boolean(DISPUTE_V2_ENABLED_BY_ROLE.car_owner);
  }
  if (safeRole === 'mechanic' || safeRole === 'mech') {
    return Boolean(DISPUTE_V2_ENABLED_BY_ROLE.mechanic);
  }
  if (safeRole === 'seller' || safeRole === 'spare_parts_seller') {
    return Boolean(DISPUTE_V2_ENABLED_BY_ROLE.seller);
  }

  return DISPUTE_V2_ENABLED_GLOBAL;
};

export default {
  LOCATION_ENABLED,
  DISPUTE_V2_ENABLED_GLOBAL,
  DISPUTE_V2_ENABLED_BY_ROLE,
  isDisputeV2EnabledForRole,
};
