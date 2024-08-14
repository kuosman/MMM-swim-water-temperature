/* eslint-disable prettier/prettier */
/* global Module */

/*
 * Magic Mirror
 * Module: MMM-swim-water-temperature
 *
 *
 *  By Marko Kuosmanen http://github.com/kuosman
 *  MIT Licenced.
 */
Module.register('MMM-swim-water-temperature', {
    // Default module config.
    defaults: {
        waterIcon: 'person-swimming', // See free icons: https://fontawesome.com/icons?d=gallery
        airIcon: 'wind', // See free icons: https://fontawesome.com/icons?d=gallery
        sensor: '70B3D57050001ADA', // See: https://iot.fvh.fi/opendata/uiras/uiras-meta.json
        updateInterval: 10000, // every 30 minutes
        apiUrl: 'https://iot.fvh.fi/opendata/uiras/uiras2_v1.json',
    },

    sensorData: null,
    updateTimer: null,
    identifier: Date.now(),

    /**
     * Gets styles
     *
     * @function getStyles
     * @returns {Array} styles array
     */
    getStyles: function () {
        return [
            this.file('css/fontawesome/css/all.min.css'),
            this.file('css/styles.css'),
        ];
    },

    /**
     * Gets translations
     * @returns {Object} translation object
     */
    getTranslations: function () {
        return {
            en: 'translations/en.json',
            fi: 'translations/fi.json',
        };
    },

    /**
     * Gets dom
     *
     * @function getDom
     * @returns {object} html wrapper
     */
    getDom: function () {
        var wrapper = document.createElement('div');

        if (!this.config.sensor === null) {
            wrapper.innerHTML = this.translate('configEmpty') + this.name + '.';
            wrapper.className = 'swim-water-temperature dimmed light small';
            return wrapper;
        }

        if (this.sensorData === null) {
            wrapper.innerHTML = this.translate('loading');
            wrapper.className = 'swim-water-temperature dimmed light small';
            return wrapper;
        }

        if (this.sensorData.error !== null && this.sensorData.error === true) {
            wrapper.innerHTML =
                this.translate('errorGettingData') + this.config.sensor;
            wrapper.className = 'swim-water-temperature dimmed light small';
        } else {
            wrapper.className = 'swim-water-temperature light small';
            var waterIcon =
                '<span class="icon"><i class="fas fa-' +
                this.config.waterIcon +
                '"></i></span>';
            var airIcon =
                '<span class="icon"><i class="fas fa-' +
                this.config.airIcon +
                '"></i></span>';
            const time = '<div class="date">' + this.sensorData.time + '</div>';
            const waterTemp =
                '<div class="temperature bright">' +
                waterIcon +
                this.formatTemperature(this.sensorData.temp_water) +
                ' &#8451;</div>';
            const airTemp =
                '<div class="temperature bright">' +
                airIcon +
                this.formatTemperature(this.sensorData.temp_air) +
                ' &#8451;</div>';
            wrapper.innerHTML = waterTemp + airTemp + time;
        }

        return wrapper;
    },

    /**
     * Format temperature
     *
     * @function formatTemperature
     * @param {number} temp temperature
     * @returns {string} formatted temperature
     */
    formatTemperature: function (temp) {
        return temp.toLocaleString(undefined, {
            maximumFractionDigits: 1,
            minimumFractionDigits: 1,
        });
    },

    /**
     * Schedule next fetch
     *
     * @function scheduleNextFetch
     */
    scheduleNextFetch: function () {
        var self = this;
        if (self.sensorData === null) {
            self.sendSocketNotification(
                'MMM_SWIM_WATER_TEMPERATURE_GET_SENSOR_DATA_' +
                    self.config.sensor,
                {
                    config: self.config,
                    identifier: self.identifier,
                }
            );
        } else {
            clearTimeout(self.updateTimer);
            const delay = self.config.updateInterval;
            self.updateTimer = setTimeout(function () {
                self.sendSocketNotification(
                    'MMM_SWIM_WATER_TEMPERATURE_GET_SENSOR_DATA_' +
                        self.config.sensor,
                    {
                        config: self.config,
                        identifier: self.identifier,
                    }
                );
            }, delay);
        }
    },

    /**
     * Notification received
     *
     * @function  notificationReceived
     * @param {string} notification notification
     */
    notificationReceived: function (notification) {
        if (notification === 'DOM_OBJECTS_CREATED') {
            this.scheduleNextFetch();
        }
    },

    /**
     * Socket notification received
     *
     * @param {string} notification notification message
     * @param {object} payload payload
     */
    socketNotificationReceived: function (notification, payload) {
        if (payload.identifier !== this.identifier) return;

        switch (notification) {
            case 'MMM_SWIM_WATER_TEMPERATURE_SENSOR_RESPONSE_' +
                this.config.sensor:
                this.scheduleNextFetch();
                this.sensorData = payload.data;
                this.updateDom();
                break;
        }
    },
});
