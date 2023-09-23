const should = require("should");
const helper = require("node-red-node-test-helper");
const nrt_config = require("../nodes/config-node");
const nrt_button = require("../nodes/button-node");

helper.init(require.resolve('node-red'));

describe('Remote Two Nodes', function () {

    beforeEach(function (done) {
        helper.startServer(done);
    });

    afterEach(function (done) {
        helper.unload();
        helper.stopServer(done);
    });

    it('should be loaded', function (done) {
        var flow = [{ id: "ncfg", type: "config-node", name: "config-node", port: 9999, driver_name: "d1" },
        { id: "bn", type: "button-node", name: "Button Node", config: "ncfg", area: "test" }];

        helper.load([nrt_config, nrt_button], flow, function () {
            var n1 = helper.getNode("ncfg");
            n1.should.have.property('name', 'config-node');

            var n2 = helper.getNode("bn");
            n2.should.have.property('name', 'Button Node');

            done();
        });
    });
});