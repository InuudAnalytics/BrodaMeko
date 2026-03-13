export const GOOGLE_CONFIG = {
  // Get this from Google Cloud Console -> APIs & Services -> Credentials
  // Create an OAuth 2.0 Client ID of type "Web application"
  // This is required even for mobile apps to verify the token on the backend
  webClientId:
    '209768529550-lrtb1gm7l3rammg8spr83gv9vnsj27sa.apps.googleusercontent.com',

  // Optional: Only needed if you want to support offline access (getting refresh tokens)
  offlineAccess: true,

  // Optional: Force user to select account even if only one exists
  forceCodeForRefreshToken: true,
};
