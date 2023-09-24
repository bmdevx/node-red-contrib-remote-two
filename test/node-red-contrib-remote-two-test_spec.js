const should = require("should");
const helper = require("node-red-node-test-helper");
const nrt_config = require("../nodes/config-node");
const nrt_button = require("../nodes/button-node");
const nrt_switch = require("../nodes/switch-node");

helper.init(require.resolve('node-red'));

const CONFIG_ID = 'ncfg';
const BUTTON_ID = 'button_1'
const SWITCH_ID = 'switch_1'

describe('Remote Two Nodes', function () {

    beforeEach(function (done) {
        helper.startServer(done);
    });

    afterEach(function (done) {
        helper.unload();
        helper.stopServer(done);
    });

    it('should be loaded', function (done) {
        var flow = [{ id: CONFIG_ID, type: "config-node", name: "config-node", port: 9999, driver_name: "node_red" },
        { id: "b1", type: "button-node", name: "Button Node", entity_id: BUTTON_ID, config: CONFIG_ID, area: "test" }];

        helper.load([nrt_config, nrt_button], flow, function () {
            const cfg = helper.getNode(CONFIG_ID);
            cfg.should.have.property('name', 'config-node');

            const btn = helper.getNode("b1");
            btn.should.have.property('name', 'Button Node');

            done();
        });
    }).timeout(60000);

    it('button test', function (done) {
        var flow = [{ id: CONFIG_ID, type: "config-node", name: "config-node", port: 9988, driver_name: "node_red" },
        { id: "b1Out", type: "helper" },
        { id: "b1", type: "button-node", name: "Button Node", entity_id: BUTTON_ID, config: CONFIG_ID, area: "test", wires: [["b1Out"]] }];

        helper.load([nrt_config, nrt_button], flow, function () {
            const btn = helper.getNode("b1");
            const b1Out = helper.getNode("b1Out");

            b1Out.on('input', (msg, send, nd) => {
                msg.should.have.property('cmd', 'push');
                nd();
                done();
            });
        });
    }).timeout(60000);

    it('switch test', function (done) {
        var flow = [{ id: CONFIG_ID, type: "config-node", name: "config-node", port: 9988, driver_name: "node_red" },
        { id: "s1Out", type: "helper" },
        { id: "s1", type: "switch-node", name: "Switch Node", entity_id: SWITCH_ID, config: CONFIG_ID, area: "test", wires: [["s1Out"]] }];

        helper.load([nrt_config, nrt_switch], flow, function () {
            const swt = helper.getNode("s1");
            const s1Out = helper.getNode("s1Out");

            s1Out.on('input', (msg, send, nd) => {
                msg.should.have.property('payload', 'on');

                swt.receive({
                    payload: false
                });

                nd();
                done();
            });
        });
    }).timeout(60000);
});