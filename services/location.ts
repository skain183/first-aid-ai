
import { LocationData } from '../types';

export const getCurrentLocation = async (): Promise<LocationData> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported by this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        let address = "Unknown Location";
        let city = "Unknown City";
        let country = "Unknown Country";
        
        try {
          // Attempt reverse geocoding via OpenStreetMap (No API key needed for low volume)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'FirstAidAI-Demo/1.0'
              }
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            address = data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || "";
            country = data.address?.country || "";
          } else {
             address = `Lat: ${latitude.toFixed(6)}, Long: ${longitude.toFixed(6)}`;
          }
        } catch (e) {
          console.error("Reverse geocoding failed", e);
          address = `Lat: ${latitude.toFixed(6)}, Long: ${longitude.toFixed(6)}`;
        }

        resolve({
          latitude,
          longitude,
          accuracy,
          address,
          city,
          country,
          timestamp: new Date().toISOString(),
          source: 'GPS'
        });
      },
      (error) => {
        // Fallback or reject
        console.error("GPS Error:", error);
        reject(error);
      },
      { 
        enableHighAccuracy: true, 
        timeout: 20000, 
        maximumAge: 10000 
      }
    );
  });
};

export const getManualLocationFallback = (): LocationData => {
  return {
    latitude: 0,
    longitude: 0,
    accuracy: 0,
    address: "Location Unavailable (Manual Required)",
    city: "Unknown",
    country: "Unknown",
    timestamp: new Date().toISOString(),
    source: 'Manual'
  };
};
