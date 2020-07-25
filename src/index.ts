import {
  API,
  APIEvent,
  CharacteristicGetCallback,
  DynamicPlatformPlugin,
  HAP,
  Logging,
  PlatformAccessory,
  PlatformAccessoryEvent,
  PlatformConfig
} from 'homebridge';
import { aqicn as aqicnApi } from '@shootismoke/dataproviders/lib/promise';
import { convert } from '@shootismoke/convert';

let hap: HAP;
let Accessory: typeof PlatformAccessory;

const PLUGIN_NAME = 'homebridge-aqicn';
const PLATFORM_NAME = 'aqicn';

class AqicnPlatform implements DynamicPlatformPlugin {
  private readonly log: Logging;
  private readonly api: API;
  private readonly config: PlatformConfig;
  private accessory? : PlatformAccessory;
  private timer? : NodeJS.Timeout;

  constructor(log: Logging, config: PlatformConfig, api: API) {
    this.log = log;
    this.config = config;
    this.api = api;

    api.on(APIEvent.DID_FINISH_LAUNCHING, this.fetchData.bind(this));
    if (this.config.polling_minutes > 0) {
      this.timer = setTimeout(this.fetchData.bind(this), this.config.polling_minutes * 60 * 1000);
    }
  }

  fetchData(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }

    aqicnApi.fetchByGps({
      latitude: this.config.location_gps[0],
      longitude: this.config.location_gps[1]
    }, {
      token: this.config.api_key
    })
      .then((data: any) => this.addUpdateAccessory(data))
      .finally(((): void => {
        if (this.config.polling_minutes > 0) {
          this.timer = setTimeout(this.fetchData.bind(this),
            this.config.polling_minutes * 60 * 1000);
        }
      }).bind(this));
  }

  trimString(string: string, length: number): string {
    if (string.length > length) {
      if (string[length + 1] && string[length + 1] == ' ') {
        string = string.substring(0, length);
      } else {
        string = string.substring(0, string.lastIndexOf(' '));
      }

      if (string[string.length - 1] == ',') {
        string = string.substring(0, string.length - 1);
      }
    }
    return string;
  }

  updateState(accessory: PlatformAccessory): void {
    const accInfo = accessory.getService(hap.Service.AccessoryInformation);
    if (accInfo) {
      accInfo
        .setCharacteristic(hap.Characteristic.Manufacturer, this.trimString(accessory.context.attributions[0].name, 64))
        .setCharacteristic(hap.Characteristic.Model, this.trimString(accessory.context.city.name, 64))
        .setCharacteristic(hap.Characteristic.SerialNumber, accessory.context.idx);
    }

    const airService = accessory.getService(hap.Service.AirQualitySensor);
    if (!airService) {
      return;
    }

    let level = 0;
    if (accessory.context.aqi <= 50) {
      level = 1;
    } else if (accessory.context.aqi <= 100) {
      level = 2;
    } else if (accessory.context.aqi <= 150) {
      level = 3;
    } else if (accessory.context.aqi <= 200) {
      level = 4;
    } else {
      level = 5;
    }

    const active = Date.now() - Date.parse(accessory.context.time.s) < 60 * 60 * 1000;

    airService.setCharacteristic(hap.Characteristic.AirQuality, level)
      .setCharacteristic(hap.Characteristic.StatusActive, active);

    let coService = accessory.getService(hap.Service.CarbonMonoxideSensor);
    if (accessory.context.iaqi.co) {
      if (!coService) {
        coService = accessory.addService(hap.Service.CarbonMonoxideSensor, 'aqicn');
      }
      coService.setCharacteristic(hap.Characteristic.CarbonMonoxideLevel, convert('co', 'usaEpa', 'raw', accessory.context.iaqi.co.v) * 0.0409 * 28.0101)
        .setCharacteristic(hap.Characteristic.StatusActive, active);
    } else if (coService) {
      accessory.removeService(coService);
    }

    if (accessory.context.iaqi.no2) {
      airService.setCharacteristic(hap.Characteristic.NitrogenDioxideDensity, convert('no2', 'usaEpa', 'raw', accessory.context.iaqi.no2.v) * 0.0409 * 46.0055);
    } else {
      const no2Char = airService.getCharacteristic(hap.Characteristic.NitrogenDioxideDensity);
      airService.removeCharacteristic(no2Char);
    }

    if (accessory.context.iaqi.o3) {
      airService.setCharacteristic(hap.Characteristic.OzoneDensity, convert('o3', 'usaEpa', 'raw', accessory.context.iaqi.o3.v) * 0.0409 * 47.9982);
    } else {
      const o3Char = airService.getCharacteristic(hap.Characteristic.OzoneDensity);
      airService.removeCharacteristic(o3Char);
    }

    if (accessory.context.iaqi.pm10) {
      airService.setCharacteristic(hap.Characteristic.PM10Density, convert('pm10', 'usaEpa', 'raw', accessory.context.iaqi.pm10.v));
    } else {
      const pm10Char = airService.getCharacteristic(hap.Characteristic.PM10Density);
      airService.removeCharacteristic(pm10Char);
    }

    if (accessory.context.iaqi.pm25) {
      airService.setCharacteristic(hap.Characteristic.PM2_5Density, convert('pm25', 'usaEpa', 'raw', accessory.context.iaqi.pm25.v));
    } else {
      const pm25Char = airService.getCharacteristic(hap.Characteristic.PM2_5Density);
      airService.removeCharacteristic(pm25Char);
    }

    if (accessory.context.iaqi.so2) {
      airService.setCharacteristic(hap.Characteristic.SulphurDioxideDensity, convert('so2', 'usaEpa', 'raw', accessory.context.iaqi.so2.v) * 0.0409 * 64.0638);
    } else {
      const so2Char = airService.getCharacteristic(hap.Characteristic.SulphurDioxideDensity);
      airService.removeCharacteristic(so2Char);
    }

    accessory.updateReachability(true);
  }

  configureAccessory(accessory: PlatformAccessory): void {
    accessory.on(PlatformAccessoryEvent.IDENTIFY, () => {
      this.log(accessory.displayName, 'identify requested!');
    });
    const airService = accessory.getService(hap.Service.AirQualitySensor);
    if (airService) {
      airService.getCharacteristic(hap.Characteristic.AirQuality)
        .on('get', (callback: CharacteristicGetCallback) => {
          this.updateState(accessory);
          callback();
        });
    }

    this.updateState(accessory);

    this.accessory = accessory;
  }

  addUpdateAccessory(data: any): void {
    if (!this.accessory) {
      const uuid = hap.uuid.generate('aqicn' + data.idx);
      const newAccessory = new Accessory('aqicn', uuid);

      newAccessory.context = data;

      newAccessory.addService(hap.Service.AirQualitySensor, 'aqicn');

      this.configureAccessory(newAccessory);

      this.api.registerPlatformAccessories('homebridge-aqicn', 'aqicn', [newAccessory]);
    } else {
      this.accessory.context = data;
    }
    if (this.accessory) {
      this.updateState(this.accessory);
    }
  }
}

export = (api: API): void => {
  hap = api.hap;
  Accessory = api.platformAccessory;

  api.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, AqicnPlatform);
};