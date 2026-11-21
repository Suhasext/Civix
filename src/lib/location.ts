import type { LocationEvidence, LocationCheck } from "./ticket";

export const LOCATION_MATCH_METERS = 150;
export const MAX_ACCURACY_METERS = 300;

export function captureLocation(): Promise<LocationEvidence> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error("Location is unavailable in this browser.")); return; }
    navigator.geolocation.getCurrentPosition(position => resolve({
      lat: Number(position.coords.latitude.toFixed(4)),
      lng: Number(position.coords.longitude.toFixed(4)),
      accuracyM: position.coords.accuracy,
      capturedAt: new Date().toISOString(),
    }), error => reject(new Error(error.code === 1 ? "Location permission denied. You can continue without it." : "Location could not be obtained. You can continue without it.")),
    { enableHighAccuracy: true, timeout: 10000 });
  });
}

export function checkLocations(report?: LocationEvidence, resolution?: LocationEvidence): LocationCheck {
  if (!report || !resolution) return { result: "unavailable" };
  if (report.accuracyM > MAX_ACCURACY_METERS || resolution.accuracyM > MAX_ACCURACY_METERS) return { result: "inconclusive" };
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const lat = radians(resolution.lat - report.lat);
  const lng = radians(resolution.lng - report.lng);
  const a = Math.sin(lat / 2) ** 2 + Math.cos(radians(report.lat)) * Math.cos(radians(resolution.lat)) * Math.sin(lng / 2) ** 2;
  const distanceM = Math.round(6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  return { result: distanceM <= LOCATION_MATCH_METERS ? "same" : "different", distanceM };
}
