import 'dotenv/config'; 

export default ({ config }) => {
  return {
    ...config,
    extra: {
      geminiApiKey: process.env.GEMINI_API_KEY,
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY 
    }
  };
};