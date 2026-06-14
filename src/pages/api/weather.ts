import type { APIRoute } from 'astro';

export const prerender = false;

const HCMC_COORDS = { lat: 10.7769, lon: 106.7009 };

export const GET: APIRoute = async ({ url }) => {
  const coords = HCMC_COORDS;

  const apiKey = import.meta.env.OPENWEATHERMAP_API_KEY;

  if (!apiKey) {
    // Return mock data when no API key configured
    return new Response(JSON.stringify({
      city: 'hcmc',
      temp: 32,
      condition: 'Clouds',
      description: 'Mây rải rác',
      humidity: 70,
      rain_chance: 40,
      icon: '03d',
    }));
  }

  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${apiKey}&units=metric&lang=vi`
  );

  if (!res.ok) {
    return new Response(JSON.stringify({ error: 'Weather API failed' }), { status: 502 });
  }

  const data = await res.json();

  return new Response(JSON.stringify({
    city: 'hcmc',
    temp: Math.round(data.main.temp),
    condition: data.weather[0].main,
    description: data.weather[0].description,
    humidity: data.main.humidity,
    rain_chance: data.rain?.['1h'] ? 90 : data.clouds?.all > 70 ? 60 : 20,
    icon: data.weather[0].icon,
  }));
};
