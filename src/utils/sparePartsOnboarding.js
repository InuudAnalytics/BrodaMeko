import { ROUTES } from './constants';

export const SPARE_PARTS_ONBOARDING_STEPS = [
  ROUTES.SPARE_PARTS_UPLOAD_CAC,
  ROUTES.SPARE_PARTS_UPLOAD_NIN,
  ROUTES.SPARE_PARTS_BANK_DETAILS,
];

const STEP_KEY_BY_ROUTE = {
  [ROUTES.SPARE_PARTS_UPLOAD_CAC]: 'cac',
  [ROUTES.SPARE_PARTS_UPLOAD_NIN]: 'nin',
  [ROUTES.SPARE_PARTS_BANK_DETAILS]: 'bank',
};

export const getSparePartsOnboardingStepIndex = (routeName) => {
  const index = SPARE_PARTS_ONBOARDING_STEPS.indexOf(routeName);
  return index >= 0 ? index + 1 : 1;
};

const isStepComplete = (routeName, completedSteps = {}) => {
  const key = STEP_KEY_BY_ROUTE[routeName];
  return key ? Boolean(completedSteps[key]) : false;
};

export const getNextSparePartsOnboardingRoute = ({ currentRoute, completedSteps = {}, skippedSteps = [] }) => {
  const currentIndex = SPARE_PARTS_ONBOARDING_STEPS.indexOf(currentRoute);
  const cleanedSkipped = skippedSteps.filter((step) => step !== currentRoute);

  for (let i = currentIndex + 1; i < SPARE_PARTS_ONBOARDING_STEPS.length; i += 1) {
    const nextRoute = SPARE_PARTS_ONBOARDING_STEPS[i];
    if (!isStepComplete(nextRoute, completedSteps)) {
      return { nextRoute, nextSkipped: cleanedSkipped };
    }
  }

  const pendingSkipped = cleanedSkipped.filter((step) => !isStepComplete(step, completedSteps));
  if (pendingSkipped.length) {
    return { nextRoute: pendingSkipped[0], nextSkipped: pendingSkipped };
  }

  return { nextRoute: ROUTES.SPARE_PARTS_PROFILE_SETUP, nextSkipped: cleanedSkipped };
};
