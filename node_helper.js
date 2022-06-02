/* eslint-disable prettier/prettier */
var moment = require('moment');
const request = require('request');
var NodeHelper = require('node_helper');

module.exports = NodeHelper.create({
  updateTimer: null,
  /**
   * Start
   *
   * @function start start
   */
  start: function () {
    moment.locale(config.language || 'fi');
  },

  /**
   * Socket notification received
   *
   * @function socketNotificationReceived
   * @param {string} notification notification
   * @param {object} payload payload
   */
  socketNotificationReceived: function (notification, payload) {
    if (notification === 'GET_SENSOR_DATA_' + payload.sensor) {
      this.fetchSensorData(payload.apiUrl, payload.sensor);
    }
  },

  /**
   * Fetches sensor data
   *
   * @function fetchSensorData
   * @param {string} apiUrl api url
   * @param {string} sensor sensor identifier
   */
  fetchSensorData(apiUrl, sensor) {
    var self = this;

    request(
      {
        headers: {
          'accept-encoding': 'gzip'
        },
        url: apiUrl,
        method: 'GET',
        gzip: true
      },
      function (error, response, body) {
        if (!error && response.statusCode === 200) {
          const data = JSON.parse(body);
          const wantedSensor = data.sensors[sensor] || {};
          const wantedSensorData = wantedSensor.data || [];
          const latestData =
            wantedSensorData.length > 0
              ? wantedSensorData[wantedSensorData.length - 1]
              : null;

          let sensorData = {};

          if (latestData !== null) {
            const time = new Date(latestData.time);
            sensorData.time = moment(time).format('DD.MM.YYYY HH:mm');
            sensorData.temp_air = latestData.temp_air;
            sensorData.temp_water = latestData.temp_water;
            sensorData.sensor = sensor;
          }

          self.sendSocketNotification('SENSOR_RESPONSE_' + sensor, {
            data: sensorData
          });
        } else {
          let sensorData = {
            error: true,
            sensor: sensor
          };
          self.sendSocketNotification('SENSOR_RESPONSE_' + sensor, {
            data: sensorData
          });
        }
      }
    );
  }
});
