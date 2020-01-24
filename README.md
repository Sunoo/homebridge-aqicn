# homebridge-aqicn
[aqicn](http://aqicn.org) plugin for [Homebridge](https://github.com/nfarina/homebridge)

# Installation

1. Install homebridge using: npm install -g homebridge
2. Install this plugin using: npm install -g homebridge-aqicn
3. Update your configuration file. See sample config.json snippet below.

# Configuration

Configuration sample:

 ```
    "platforms": [
        {
            "platform": "aqicn",
            "api_key": "N4wbhJlHEywbmGbV01SL3gHqrKKNavOfrLTt1OnZ",
            "location_gps": [31.2047372, 121.4489017],
            "polling_minutes": 30
        }
    ]
```

Fields:

* "platform": Must always be "aqicn" (required)
* "api_key": Your API key for calling aqicn, you can get one free from [here](https://aqicn.org/data-platform/token/) (required)
* "location_gps": Latitude and longitude of your location, you can find that [here](http://www.mapcoordinates.net/en) (required)
* "polling_minutes": Number of minutes between updates, polling disabled if no entry (optional)