export type AqicnResponse = AqicnOkResponse | AqicnErrorResponse;

export type AqicnErrorResponse = {
  status: 'error';
  data: string;
};

export type AqicnOkResponse = {
  status: 'ok';
  data: AqicnData;
};

export type AqicnData = {
  aqi: number;
  idx: number;
  attributions: Array<Attribution>;
  city: City;
  dominentpol: string;
  iaqi: Iaqi;
  time: Time;
  forecast: Forecast;
  debug: Debug;
};

export type Attribution = {
  url: string;
  name: string;
  logo?: string;
};

export type Iaqi = {
  co?: Value;
  dew?: Value;
  h?: Value;
  no2?: Value;
  o3?: Value;
  p?: Value;
  pm10?: Value;
  pm25?: Value;
  so2?: Value;
  t?: Value;
  uvi?: Value;
  w?: Value;
  wg?: Value;
};

export type Value = {
  v: number;
};

export type City = {
  geo: Array<number>;
  name: string;
  url: string;
};

export type Time = {
  s: string;
  tz: string;
  v: number;
  iso: string;
};

export type Forecast = {
  daily: DailyForecast;
};

export type DailyForecast = {
  co?: Array<ForecastDetails>;
  dew?: Array<ForecastDetails>;
  h?: Array<ForecastDetails>;
  no2?: Array<ForecastDetails>;
  o3?: Array<ForecastDetails>;
  p?: Array<ForecastDetails>;
  pm10?: Array<ForecastDetails>;
  pm25?: Array<ForecastDetails>;
  so2?: Array<ForecastDetails>;
  t?: Array<ForecastDetails>;
  uvi?: Array<ForecastDetails>;
  w?: Array<ForecastDetails>;
  wg?: Array<ForecastDetails>;
};

export type ForecastDetails = {
  avg: number;
  day: string;
  max: number;
  min: number;
};

export type Debug = {
  sync: string;
};