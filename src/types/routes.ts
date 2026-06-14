export interface RouteInfo {
  id: string;
  name: string;
  type: 'metro' | 'bus';
  city: 'hcmc';
  color: string;
  distance_km: number;
  duration_min: number;
  stops_count: number;
  geojson_file: string;
}

export interface StopInfo {
  name: string;
  lat: number;
  lng: number;
  type: 'metro' | 'bus';
  routes: string[];
}
