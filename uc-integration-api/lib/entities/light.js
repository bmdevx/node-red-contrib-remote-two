"use strict";

const Entity = require("./entity");

/**
 * Light entity states.
 *
 * @type {{UNAVAILABLE: string, UNKNOWN: string, OFF: string, ON: string}}
 */
const STATES = {
  UNAVAILABLE: "UNAVAILABLE",
  UNKNOWN: "UNKNOWN",
  ON: "ON",
  OFF: "OFF"
};

/**
 * Light entity features.
 *
 * @type {{TOGGLE: string, COLOR: string, ON_OFF: string, DIM: string, COLOR_TEMPERATURE: string}}
 */
const FEATURES = {
  ON_OFF: "on_off",
  TOGGLE: "toggle",
  DIM: "dim",
  COLOR: "color",
  COLOR_TEMPERATURE: "color_temperature"
};

/**
 * Light entity attributes.
 *
 * @type {{STATE: string, HUE: string, COLOR_TEMPERATURE: string, BRIGHTNESS: string, SATURATION: string}}
 */
const ATTRIBUTES = {
  STATE: "state",
  HUE: "hue",
  SATURATION: "saturation",
  BRIGHTNESS: "brightness",
  COLOR_TEMPERATURE: "color_temperature"
};

/**
 * Light entity commands.
 *
 * @type {{TOGGLE: string, OFF: string, ON: string}}
 */
const COMMANDS = {
  ON: "on",
  OFF: "off",
  TOGGLE: "toggle"
};

/**
 * Light entity device classes.
 * @type {{}}
 */
const DEVICECLASSES = {};

/**
 * Light entity options.
 *
 * @type {{COLOR_TEMPERATURE_STEPS: string}}
 */
const OPTIONS = { COLOR_TEMPERATURE_STEPS: "color_temperature_steps" };

/**
 * See {@link https://github.com/unfoldedcircle/core-api/blob/main/doc/entities/entity_light.md light entity documentation}
 * for more information.
 */
class Light extends Entity {
  /**
   * Constructs a new light entity.
   *
   * @param {string} id The entity identifier. Must be unique inside the integration driver.
   * @param {string|Map} name The human-readable name of the entity. Either a string, which will be mapped to english, or a Map containing multiple language strings.
   * @param {string[]} features Optional entity features.
   * @param {Map} attributes Optional entity attribute Map holding the current state.
   * @param {string} deviceClass Optional device class.
   * @param {object} options Further options. See entity documentation.
   * @param {string} area Optional area or room.
   */
  constructor(id, name, features, attributes, deviceClass = undefined, options = null, area = undefined) {
    super(id, name, Entity.TYPES.LIGHT, features, attributes, deviceClass, options, area);

    console.debug(`Light entity created with id: ${this.id}`);
  }
}

module.exports = Light;
module.exports.STATES = STATES;
module.exports.FEATURES = FEATURES;
module.exports.ATTRIBUTES = ATTRIBUTES;
module.exports.COMMANDS = COMMANDS;
module.exports.DEVICECLASSES = DEVICECLASSES;
module.exports.OPTIONS = OPTIONS;
