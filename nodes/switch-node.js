const uc = require('../uc-integration-api/index');
const Switch = uc.Entities.Switch;

module.exports = function (RED) {
    function SwitchNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const configNode = (typeof config.config === 'string') ? RED.nodes.getNode(config.config) : config.config;

        if (configNode === undefined) {
            node.warn('Config Node not found');
            return;
        }

        node.switch_state = false;

        node.getAttrs = () => {
            var state;
            if (node.switch_state === true)
                state = Switch.STATES.ON;
            else if (node.switch_state === false)
                state = Switch.STATES.OFF;
            else
                state = Switch.STATES.UNKNOWN;

            return new Map([
                [Switch.ATTRIBUTES.STATE, state]
            ]);
        };

        node.entity = new Switch(
            config.entity_id || configNode.generateEntityID('switch'),
            config.name,
            [Switch.FEATURES.ON_OFF, Switch.FEATURES.TOGGLE],
            node.getAttrs(),
            config.device_class || 'virtual_switch',
            undefined,
            config.area || null
        );

        const setState = (cmd, updateEntity = false) => {
            if (typeof cmd === 'string' || cmd instanceof String) {
                var cmd = cmd.toLowerCase();

                switch (cmd) {
                    case Switch.COMMANDS.ON: this.switch_state = true; break;
                    case Switch.COMMANDS.OFF: this.switch_state = false; break;
                    case Switch.COMMANDS.TOGGLE: this.switch_state = !this.switch_state; break;
                }
            } else if (typeof cmd === 'boolean' || cmd instanceof Boolean) {
                if (cmd === true)
                    this.switch_state = true;
                else if (cmd === false)
                    this.switch_state = false;
                else
                    this.switch_state = !this.switch_state;
            } else if (cmd === null) {
                this.switch_state = !this.switch_state;
            }

            if (updateEntity) {
                configNode.updateEntity(this);
            }
        }

        node.command = (cmdId, params) => {
            if (Object.values(Switch.COMMANDS).includes(cmdId)) {
                setState(cmdId);

                node.send({
                    payload: cmdId,
                    params: params,
                    state: this.switch_state
                });

                return uc.STATUS_CODES.OK;
            } else {
                return uc.STATUS_CODES.BAD_REQUEST;
            }
        };

        node.on('input', (msg, send, done) => {
            setState(msg.payload, true);
            done();
        });

        node.on('close', (done) => {
            done();
        });

        configNode.addEntity(this);
    }

    RED.nodes.registerType("switch-node", SwitchNode);
}
