const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const uc = require('../uc-integration-api/index');

const DRIVER_PATH = '../driver.json';


const checkExists = (path) => new Promise(r => fs.access(path, fs.F_OK, e => r(!e)));

module.exports = function (RED) {

    function ConfigNode(config) {
        RED.nodes.createNode(this, config);

        const node = this;
        node.entities = new Map();

        var initiated = false;

        node.isInitialized = () => {
            return initiated;
        };

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

        const init = (driver) => {

            if (node.port) {
                driver.port = node.port;
            }

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
                console.log(`ENTITY COMMAND: ${entityId} ${entityType} ${cmdId} ${JSON.stringify(params, null, 4)}`);

                if (node.entities.has(entityId)) {
                    const enode = node.entities.get(entityId);
                    const entity = enode.entity;

                    if (entity.entity_type == entityType) {
                        await uc.acknowledgeCommand(wsHandle, enode.command(cmdId, params));
                    } else {
                        node.warn(`Entity ${entity.name}(${entityId}) does not match type ${entityType}`);
                        await uc.acknowledgeCommand(wsHandle, uc.STATUS_CODES.BAD_REQUEST);
                    }
                } else {
                    node.warn(`Entity ${entityId} not found`);
                    await uc.acknowledgeCommand(wsHandle, uc.STATUS_CODES.BAD_REQUEST);
                }
            });


            node.addEntity = (entityNode) => {
                const entity = entityNode.entity;

                if (entity instanceof uc.Entities.Entity) {
                    if (entity.id) {
                        if (node.entities.has(entity.id)) {
                            node.warn(`Entity ${entity.id} has already been added`);
                        } else {
                            node.entities.set(entity.id);
                            uc.availableEntities.addEntity(enode);
                        }
                    } else {
                        node.warn(`Entity does not have an id`);
                    }
                } else {
                    node.warn(`Not a valid entity`);
                }
            }

            node.updateEntity = (entity, attrs) => {
                if (entity.id) {
                    if (node.entities.has(entity.id)) {
                        if (attrs instanceof Map) {
                            uc.configuredEntities.updateEntityAttributes(entity.id, attrs);
                        } else {
                            node.warn(`Entity ${entity.id} has not been added`);
                        }
                    } else {
                        node.warn(`Entity ${entity.id} has not been added`);
                    }
                } else {
                    node.warn(`Entity does not have an id`);
                }
            }


            initiated = true;
        };

        checkExists(configFilePath).then(exists => {
            if (exists) {
                loadDriver(DRIVER_PATH)
                    .then(init)
                    .catch(e => {
                        node.error(e);
                    });
            } else {
                node.warn('driver not found');
            }
        });
    }

    RED.nodes.registerType("config-node", ConfigNode);
}