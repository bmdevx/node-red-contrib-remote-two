const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const uc = require('../uc-integration-api/index');
const { Bonjour } = require('bonjour-service');
const os = require('os');

const DRIVER_PATH = path.join(__dirname, '..', 'driver.json');

module.exports = function (RED) {
    function ConfigNode(config) {
        RED.nodes.createNode(this, config);

        const node = this;
        node.entities = new Map();

        node.isInitialized = false;

        const loadDriver = (filePath) => {
            return new Promise((resolve, reject) => {
                fsp.readFile(filePath)
                    .then(data => {
                        try {
                            if (data.length > 0) {
                                resolve(JSON.parse(data));
                            } else {
                                reject('Invalid driver file');
                            }
                        } catch (e) {
                            reject(`Failed to parse driver file. (${e})`);
                        }
                    })
                    .catch(e => {
                        reject(`Driver file does not exist. (${filePath})`);
                    });
            });
        }


        node.startMdnsPublishing = (driver) => {
            if (!node.bonjour) {
                node.bonjour = new Bonjour();
            }

            if (node.bonjourService) {
                node.stopMdnsPublishing();
            }

            node.bonjourService = node.bonjour.publish({
                name: driver.driver_id,
                host: os.hostname().split(".")[0] + ".local.",
                type: "uc-integration",
                port: driver.port,
                txt: {
                    name: driver.name,
                    ver: driver.version,
                    developer: driver.developer.name
                }
            });
        };

        node.stopMdnsPublishing = () => {
            if (node.bonjourService) {
                node.bonjourService.stop();
            }
        };


        node.generateEntityID = (type) => {
            const getRandom = () => {
                const chars = "0123456789ABCDEF";
                var rs = '';
                for (var i = 0; i < 6; i++) {
                    rs += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                return rs;
            };

            while (true) {
                var entity_id = `${(type || 'entity')}_${getRandom()}`;
                if (!this.entities.has(entity_id)) {
                    return entity_id;
                }
            }
        }


        const init = (driver) => {
            if (config.port) {
                driver.port = config.port;
            }

            if (config.driver_name) {
                driver.device_id = config.driver_name;
            }

            process.env['UC_DISABLE_MDNS_PUBLISH'] = 'true';

            uc.init(driver);

            /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
            // Handling events
            /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
            uc.on(uc.EVENTS.CONNECT, async () => {
                // act on when the core connects to the integration
                // for example: start polling your devices
                await uc.setDeviceState(uc.DEVICE_STATES.CONNECTED);
            });

            uc.on(uc.EVENTS.DISCONNECT, async () => {
                // act on when the core disconnects from the integration
                // for example: stop polling your devices
                await uc.setDeviceState(uc.DEVICE_STATES.DISCONNECTED);
            });

            uc.on(uc.EVENTS.ENTER_STANDBY, async () => {
                // act on when the remote goes to standby
            });

            uc.on(uc.EVENTS.EXIT_STANDBY, async () => {
                // act on when the remote leaves standby
            });

            uc.on(uc.EVENTS.SUBSCRIBE_ENTITIES, async (entityIds) => {
                // the integration will configure entities and subscribe for entity update events
                // the UC library automatically adds the subscribed entities
                // from available to configured
                // you can act on this event if you need for your device handling
                // ...
            });

            uc.on(uc.EVENTS.UNSUBSCRIBE_ENTITIES, async (entityIds) => {
                // when the integration unsubscribed from certain entity updates,
                // the UC library automatically remove the unsubscribed entities
                // from configured
                // you can act on this event if you need for your device handling
                // ...
            });

            // handle commands coming from the core
            uc.on(uc.EVENTS.ENTITY_COMMAND, async (wsHandle, entityId, entityType, cmdId, params) => {
                node.log(`ENTITY COMMAND: ${entityId} ${entityType} ${cmdId} ${JSON.stringify(params, null, 4)}`);

                if (node.entities.has(entityId)) {
                    const enode = node.entities.get(entityId);
                    const entity = enode.entity;

                    if (entity.entity_type == entityType) {
                        await uc.acknowledgeCommand(wsHandle,
                            enode.command ? enode.command(cmdId, params) : uc.STATUS_CODES.OK);
                    } else {
                        node.warn(`Entity ${entity.name}(${entityId}) does not match type ${entityType}`);
                        await uc.acknowledgeCommand(wsHandle, uc.STATUS_CODES.BAD_REQUEST);
                    }
                } else {
                    node.warn(`Entity ${entityId} not found`);
                    await uc.acknowledgeCommand(wsHandle, uc.STATUS_CODES.BAD_REQUEST);
                }
            });

            if (node.entities.size > 0) {
                node.entities.forEach((enode, key) => {
                    uc.availableEntities.addEntity(enode.entity);
                })
            }

            if (config.publish_service === true) {
                node.startMdnsPublishing(driver);
            }

            node.isInitialized = true;
        };


        node.addEntity = (entityNode) => {
            const entity = entityNode.entity;

            if (entity instanceof uc.Entities.Entity) {
                if (entity.id) {
                    if (node.entities.has(entity.id)) {
                        node.warn(`Entity ${entity.id} has already been added`);
                    } else {
                        node.entities.set(entity.id, entityNode);

                        if (node.isInitialized) {
                            uc.availableEntities.addEntity(enode);
                        }
                    }
                } else {
                    node.warn(`Entity does not have an id`);
                }
            } else {
                node.warn(`Not a valid entity`);
            }
        }

        node.updateEntity = (entityNode) => {
            const entity = entityNode.entity;

            if (!node.isInitialized) {
                node.warn('Config Node not initialized');
                return;
            }

            if (entity.id) {
                if (node.entities.has(entity.id)) {
                    uc.configuredEntities.updateEntityAttributes(entity.id, entityNode.getAttrs());
                } else {
                    node.warn(`Entity ${entity.id} is not found`);
                }
            } else {
                node.warn(`Entity does not have an id`);
            }
        }


        node.on('close', done => {
            node.stopMdnsPublishing();

            if (node.bonjour) {
                node.bonjour.destroy();
                node.bonjour = null;
            }

            done();
        });


        fs.access(DRIVER_PATH, fs.F_OK, e => {
            if (!e) {
                loadDriver(DRIVER_PATH)
                    .then(init)
                    .catch(node.error);
            } else {
                node.warn('Driver config not found');
            }
        });
    }

    RED.nodes.registerType("config-node", ConfigNode);
}