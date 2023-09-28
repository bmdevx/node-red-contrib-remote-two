const uc = require('../uc-integration-api/index');
const Button = uc.Entities.Button;

module.exports = function (RED) {
    function ButtonNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        var configNode = (typeof config.config === 'string') ? RED.nodes.getNode(config.config) : config.config;

        if (configNode === undefined) {
            node.error('Config Node not found');
            return;
        }

        node.getAttrs = () => {
            return new Map([
                [Button.ATTRIBUTES.STATE, Button.STATES.AVAILABLE]
            ]);
        };

        node.command = (cmdId, params) => {
            if (cmdId === Button.COMMANDS.PUSH) {
                node.send({
                    cmd: cmdId,
                    payload: params
                })

                return uc.STATUS_CODES.OK;
            } else {
                return uc.STATUS_CODES.BAD_REQUEST;
            }
        };

        node.on('close', (done) => {
            done();
        });

        node.entity = new Button(
            config.entity_id || configNode.generateEntityID('button'),
            config.name,
            config.area
        );

        configNode.addEntity(this);
    }

    RED.nodes.registerType("button-node", ButtonNode);
}
