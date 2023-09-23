const uc = require('../uc-integration-api/index');
const Button = uc.Entities.Button;

module.exports = function (RED) {
    function ButtonNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        var configNode = (typeof config.config === 'string') ? RED.nodes.getNode(config.config) : config.config;

        if (configNode === undefined) {
            node.warn('Config Node not found');
            return;
        }

        const entityId = config.name;
        const entityName = config.name;
        const entityArea = config.area;

        const entity = new Button(
            entityId,
            entityName,
            entityArea
        );

        node.entity = entity;

        node.command = (cmdId, params) => {
            if (cmdId === Button.COMMANDS.PUSH) {
                node.send(new {
                    payload: params
                })

                return uc.STATUS_CODES.OK;
            } else {
                return uc.STATUS_CODES.BAD_REQUEST;
            }
        };

        configNode.addEntity(this);

        node.on('close', (done) => {
            done();
        });
    }

    RED.nodes.registerType("button-node", ButtonNode);
}
