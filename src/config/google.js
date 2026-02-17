export const GOOGLE_CONFIG = {
    // Get this from Google Cloud Console -> APIs & Services -> Credentials
    // Create an OAuth 2.0 Client ID of type "Web application"
    // This is required even for mobile apps to verify the token on the backend
    webClientId: '530427513158-753nr4mg383cpk7gs26gbqd7umgh2qgi.apps.googleusercontent.com',

    // Optional: Only needed if you want to support offline access (getting refresh tokens)
    offlineAccess: true,

    // Optional: Force user to select account even if only one exists
    forceCodeForRefreshToken: true,
};
