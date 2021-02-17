import { PlatformIdentifier, PlatformName } from 'homebridge';

export type AqicnPlatformConfig = {
  platform: PlatformName | PlatformIdentifier;
  name?: string;
  api_key?: string;
  location_gps?: Array<number>;
  polling_minutes?: number;
};