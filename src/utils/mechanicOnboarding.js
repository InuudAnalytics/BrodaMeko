import { ROUTES } from './constants';

export const MECH_ONBOARDING_STEPS = [
  ROUTES.MECH_UPLOAD_PROFILE_PHOTO,
  ROUTES.MECH_KYC_UPLOAD,
  ROUTES.MECH_UPLOAD_CERTIFICATE,
  ROUTES.MECH_BANK_DETAILS,
  ROUTES.MECH_SERVICE_PRICING,
];

const STEP_KEY_BY_ROUTE = {
  [ROUTES.MECH_UPLOAD_PROFILE_PHOTO]: 'photo',
  [ROUTES.MECH_KYC_UPLOAD]: 'id',
  [ROUTES.MECH_UPLOAD_CERTIFICATE]: 'certificate',
  [ROUTES.MECH_BANK_DETAILS]: 'bank',
  [ROUTES.MECH_SERVICE_PRICING]: 'services',
};

export const getOnboardingStepIndex = (routeName) => {
  const index = MECH_ONBOARDING_STEPS.indexOf(routeName);
  return index >= 0 ? index + 1 : 1;
};

const isStepComplete = (routeName, completedSteps = {}) => {
  const key = STEP_KEY_BY_ROUTE[routeName];
  return key ? Boolean(completedSteps[key]) : false;
};

export const getNextOnboardingRoute = ({ currentRoute, completedSteps = {}, skippedSteps = [] }) => {
  const currentIndex = MECH_ONBOARDING_STEPS.indexOf(currentRoute);
  const cleanedSkipped = skippedSteps.filter((step) => step !== currentRoute);

  for (let i = currentIndex + 1; i < MECH_ONBOARDING_STEPS.length; i += 1) {
    const nextRoute = MECH_ONBOARDING_STEPS[i];
    if (!isStepComplete(nextRoute, completedSteps)) {
      return { nextRoute, nextSkipped: cleanedSkipped };
    }
  }

  const pendingSkipped = cleanedSkipped.filter((step) => !isStepComplete(step, completedSteps));
  if (pendingSkipped.length) {
    return { nextRoute: pendingSkipped[0], nextSkipped: pendingSkipped };
  }

  return { nextRoute: ROUTES.MECH_PROFILE_SETUP, nextSkipped: cleanedSkipped };
};
