
import { DataPoint, MacroDataPoint } from '../types';
import { calculateSMAs } from '../utils/dataGenerators';

const FRED_API_KEY = 'ac7fe90c5c514db1c5f2b901221cdc23';

async function fetchFredSeries(seriesId: string): Promise<any[] | null> {
  const baseUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json&sort_order=desc&limit=3000`;
  
  const primaryUrl = `https://corsproxy.io/?${encodeURIComponent(baseUrl)}`;
  const fallbackUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(baseUrl)}`;

  const attemptFetch = async (url: string) => {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error(`Status ${response.status}`);
    const data = await response.json();
    if (!data || !data.observations) throw new Error('No observations found');
    return data.observations;
  };

  try {
    const observations = await attemptFetch(primaryUrl);
    return processObservations(observations);
  } catch (primaryError) {
    console.warn(`Primary proxy failed for ${seriesId}, trying fallback...`, primaryError);
    try {
      const observations = await attemptFetch(fallbackUrl);
      return processObservations(observations);
    } catch (fallbackError) {
      console.error(`All proxies failed for FRED API (${seriesId}):`, fallbackError);
      return null;
    }
  }
}

function processObservations(observations: any[]) {
  return observations
    .filter((obs: any) => obs.value !== '.' && obs.value !== undefined && obs.value !== null)
    .map((obs: any) => ({
      date: obs.date,
      value: parseFloat(obs.value)
    }))
    .filter((obs: any) => !isNaN(obs.value))
    .reverse();
}

export const fetchFredSp500 = async (): Promise<DataPoint[] | null> => {
  const data = await fetchFredSeries('SP500');
  if (!data || data.length === 0) return null;
  return calculateSMAs(data as DataPoint[]);
};

export const fetchFredNasdaq = async (): Promise<DataPoint[] | null> => {
  const data = await fetchFredSeries('NASDAQCOM');
  if (!data || data.length === 0) return null;
  return calculateSMAs(data as DataPoint[]);
};

export const fetchFredTreasury10Y = async (): Promise<MacroDataPoint[] | null> => {
  const data = await fetchFredSeries('DGS10');
  if (!data || data.length === 0) return null;
  return data as MacroDataPoint[];
};

export const fetchFredM2 = async (): Promise<MacroDataPoint[] | null> => {
  const data = await fetchFredSeries('M2SL');
  if (!data || data.length < 2) return null;
  
  // Calculate Monthly Change in Billions
  const result: MacroDataPoint[] = [];
  for (let i = 1; i < data.length; i++) {
    const change = data[i].value - data[i - 1].value;
    result.push({
      date: data[i].date,
      value: parseFloat(change.toFixed(2))
    });
  }
  return result;
};
