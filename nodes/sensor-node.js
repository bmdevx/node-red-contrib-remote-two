const uc = require('../uc-integration-api/index');
const Sensor = uc.Entities.Sensor;

module.exports = function (RED) {
    function SensorNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const configNode = (typeof config.config === 'string') ? RED.nodes.getNode(config.config) : config.config;

        if (configNode === undefined) {
            node.error('Config Node not found');
            return;
        }

        node.sensor_state = Sensor.STATES.UNKNOWN;
        node.sensor_value = null;
        node.sensor_options = {}

        if (config.device_class === Sensor.DEVICECLASSES.CUSTOM) {
            node.sensor_options[Sensor.OPTIONS.CUSTOM_UNIT] = config.custom_unit;
        } else if (config.device_class === Sensor.DEVICECLASSES.TEMPERATURE) {
            node.sensor_options[Sensor.OPTIONS.NATIVE_UNIT] = config.native_unit;
        }

        if (config.decimals > 0) {
            node.sensor_options[Sensor.OPTIONS.DECIMALS] = config.decimals;
        }

        if (config.min_value != null) {
            node.sensor_options[Sensor.OPTIONS.MIN_VALUE] = config.min_value;
        }

        if (config.max_value != null) {
            node.sensor_options[Sensor.OPTIONS.MAX_VALUE] = config.max_value;
        }

        node.getAttrs = () => {
            return new Map([
                [Sensor.ATTRIBUTES.STATE, node.sensor_state],
                [Sensor.ATTRIBUTES.VALUE, node.sensor_value]
            ]);
        };

        node.command = (cmdId, params) => {
            return uc.STATUS_CODES.OK;
        };

        node.on('input', (msg, send, done) => {
            if (msg.payload) {
                node.sensor_state = Sensor.STATES.ON;

                if (config.unit_type != Sensor.DEVICECLASSES.CUSTOM && typeof msg.payload === 'Number') {
                    node.warn('Payload is not of type Number');
                } else {
                    node.sensor_value = msg.payload;

                    if (node.entity !== undefined) {
                        configNode.updateEntity(this);
                    }
                }
            }

            done();
        });

        node.on('close', (done) => {
            done();
        });

        node.entity = new Sensor(
            config.entity_id || configNode.generateEntityID('sensor'),
            config.name,
            null,
            new Map([
                [Sensor.ATTRIBUTES.STATE, node.sensor_state],
            ]),
            config.device_class,
            node.sensor_options,
            config.area || null
        );

        configNode.addEntity(this);
    }

    RED.nodes.registerType("sensor-node", SensorNode);
}
