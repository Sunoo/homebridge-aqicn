const aqicnApi = require('@shootismoke/dataproviders/lib/promise').aqicn;
const convert = require("@shootismoke/convert").convert;
var Accessory, Service, Characteristic, UUIDGen;

module.exports = function(homebridge) {
    Accessory = homebridge.platformAccessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;

    homebridge.registerPlatform("homebridge-aqicn", "aqicn", aqicn, true);
}

function aqicn(log, config, api) {
    this.log = log;
    this.config = config;
    this.accessory;
    this.service;

    this.api_key = config["api_key"];
    this.location_gps = config["location_gps"];
    if (config["polling_minutes"] != null) {
        this.interval = parseInt(config["polling_minutes"]) * 60 * 1000;
    } else {
        this.interval = 30 * 60 * 1000;
    }

    if (api) {
        this.api = api;
        this.api.on('didFinishLaunching', this.fetchData.bind(this));
        this.timer = setInterval(this.fetchData.bind(this), this.interval);
    }
}

aqicn.prototype.fetchData = function() {
    aqicnApi.fetchByGps({
            latitude: this.location_gps[0],
            longitude: this.location_gps[1]
        }, {
            token: this.api_key
        })
        .then(data => this.addUpdateAccessory(data));
}

aqicn.prototype.updateState = function(accessory) {
    accessory.getService(Service.AccessoryInformation)
        .setCharacteristic(Characteristic.Manufacturer, accessory.context.attributions[0].name)
        .setCharacteristic(Characteristic.Model, accessory.context.city.name)
        .setCharacteristic(Characteristic.SerialNumber, accessory.context.idx);

    var airService = accessory.getService(Service.AirQualitySensor)
    var level = 0;
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
    airService.setCharacteristic(Characteristic.AirQuality, level);

    if (accessory.context.iaqi.co) {
        airService.setCharacteristic(Characteristic.CarbonMonoxideLevel, convert('co', 'usaEpa', 'raw', accessory.context.iaqi.co.v) * 1.16);
    } else {
        airService.removeCharacteristic(Characteristic.CarbonMonoxideLevel);
    }

    if (accessory.context.iaqi.no2) {
        airService.setCharacteristic(Characteristic.NitrogenDioxideDensity, convert('no2', 'usaEpa', 'raw', accessory.context.iaqi.no2.v) * 1.91);
    } else {
        airService.removeCharacteristic(Characteristic.NitrogenDioxideDensity);
    }

    if (accessory.context.iaqi.o3) {
        airService.setCharacteristic(Characteristic.OzoneDensity, convert('o3', 'usaEpa', 'raw', accessory.context.iaqi.o3.v) * 2.0);
    } else {
        airService.removeCharacteristic(Characteristic.OzoneDensity);
    }

    if (accessory.context.iaqi.pm10) {
        airService.setCharacteristic(Characteristic.PM10Density, convert('pm10', 'usaEpa', 'raw', accessory.context.iaqi.pm10.v));
    } else {
        airService.removeCharacteristic(Characteristic.PM10Density);
    }

    if (accessory.context.iaqi.pm25) {
        airService.setCharacteristic(Characteristic.PM2_5Density, convert('pm25', 'usaEpa', 'raw', accessory.context.iaqi.pm25.v));
    } else {
        airService.removeCharacteristic(Characteristic.PM2_5Density);
    }

    if (accessory.context.iaqi.so2) {
        airService.setCharacteristic(Characteristic.SulphurDioxideDensity, convert('so2', 'usaEpa', 'raw', accessory.context.iaqi.so2.v) * 2.66)
    } else {
        airService.removeCharacteristic(Characteristic.SulphurDioxideDensity);
    }

    accessory.updateReachability(true);
}

aqicn.prototype.configureAccessory = function(accessory) {
    accessory.on('identify', function(paired, callback) {
        this.log(accessory.displayName, "identify requested!");
        callback();
    });

    this.updateState(accessory);

    this.accessory = accessory;
}

aqicn.prototype.addUpdateAccessory = function(data) {
    if (!this.accessory) {
        var uuid = UUIDGen.generate("aqicn" + accessory.context.idx);
        var newAccessory = new Accessory("aqicn", uuid);

        newAccessory.context = data;

        var airService = newAccessory.addService(Service.AirQualitySensor, "aqicn");

        this.configureAccessory(newAccessory);

        this.api.registerPlatformAccessories("homebridge-aqicn", "aqicn", [newAccessory]);
    } else {
        this.accessory.context = data;

        this.updateState(this.accessory);
    }
}