/*!
/*:
 * @plugindesc ローグライク：コア実装
 * @author F_
 *
 * @help
 * ローグライクモデルのツクールへの適用。
 *
 * Copyright (c) 2016 F_
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */
System.register(['EventExtension', 'Roguelike'], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var EventExtension_1, Roguelike_1, rl;
    var plugin, DataManagerExtensions, PlayerAction, PlayerActionNode, DungeonPlayer, DungeonEnemy, DungeonStairs, DefaultDungeonObjectFactory, DefaultDungeonStrategy;
    return {
        setters:[
            function (EventExtension_1_1) {
                EventExtension_1 = EventExtension_1_1;
            },
            function (Roguelike_1_1) {
                Roguelike_1 = Roguelike_1_1;
                rl = Roguelike_1_1;
            }],
        execute: function() {
            plugin = MVPlugin.get(__moduleName);
            DataManagerExtensions = (function () {
                function DataManagerExtensions() {
                }
                DataManagerExtensions.createGameObjects = function (base) {
                    return function () {
                        base.call(this);
                        Roguelike_1.DungeonManager.context = new Roguelike_1.Context();
                    };
                };
                DataManagerExtensions.makeSaveContents = function (base) {
                    return function () {
                        var contents = base.call(this);
                        contents.roguelike = Roguelike_1.DungeonManager.context;
                        return contents;
                    };
                };
                DataManagerExtensions.extractSaveContents = function (base) {
                    return function (contents) {
                        base.call(this, contents);
                        Roguelike_1.DungeonManager.context = contents.roguelike;
                    };
                };
                __decorate([
                    MVPlugin.method
                ], DataManagerExtensions, "createGameObjects", null);
                __decorate([
                    MVPlugin.method
                ], DataManagerExtensions, "makeSaveContents", null);
                __decorate([
                    MVPlugin.method
                ], DataManagerExtensions, "extractSaveContents", null);
                DataManagerExtensions = __decorate([
                    MVPlugin.extension(DataManager, true)
                ], DataManagerExtensions);
                return DataManagerExtensions;
            }());
            exports_1("DataManagerExtensions", DataManagerExtensions);
            PlayerAction = (function () {
                function PlayerAction(entry) {
                    this.entry = entry;
                }
                Object.defineProperty(PlayerAction, "ready", {
                    get: function () { return (PlayerAction.node !== null); },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(PlayerAction.prototype, "type", {
                    get: function () { return (PlayerAction.node ? PlayerAction.node.type : Roguelike_1.ActionType.None); },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(PlayerAction.prototype, "priority", {
                    get: function () { return 0; },
                    enumerable: true,
                    configurable: true
                });
                PlayerAction.set = function (type, body) {
                    PlayerAction.node = new PlayerActionNode(PlayerAction.node, type, body);
                };
                PlayerAction.prototype.perform = function () {
                    var node;
                    while (node = PlayerAction.node) {
                        PlayerAction.node = null;
                        node.body();
                    }
                };
                PlayerAction.node = null;
                PlayerAction = __decorate([
                    plugin.type
                ], PlayerAction);
                return PlayerAction;
            }());
            exports_1("PlayerAction", PlayerAction);
            PlayerActionNode = (function () {
                function PlayerActionNode(parent, type, body) {
                    this.parent = parent;
                    this.type = type;
                    this.body = body;
                }
                return PlayerActionNode;
            }());
            DungeonPlayer = (function () {
                function DungeonPlayer() {
                }
                Object.defineProperty(DungeonPlayer.prototype, "type", {
                    get: function () { return Roguelike_1.DungeonObjectType.Player; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(DungeonPlayer.prototype, "x", {
                    get: function () { return $gamePlayer.x; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(DungeonPlayer.prototype, "y", {
                    get: function () { return $gamePlayer.y; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(DungeonPlayer.prototype, "direction", {
                    get: function () { return $gamePlayer.direction(); },
                    set: function (value) { $gamePlayer.setDirection(value); },
                    enumerable: true,
                    configurable: true
                });
                DungeonPlayer.prototype.locate = function (x, y) {
                    $gamePlayer.locate(x, y);
                };
                DungeonPlayer.prototype.requestActions = function () {
                    Roguelike_1.TurnManager.request(new Roguelike_1.ActionEntry(this, 1, 1));
                };
                DungeonPlayer.prototype.decideAction = function (entry) {
                    return (PlayerAction.ready ? new PlayerAction(entry) : null);
                };
                DungeonPlayer = __decorate([
                    plugin.type
                ], DungeonPlayer);
                return DungeonPlayer;
            }());
            exports_1("DungeonPlayer", DungeonPlayer);
            DungeonEnemy = (function () {
                function DungeonEnemy(event) {
                    this._event = EventExtension_1.EventManager.create(event);
                }
                Object.defineProperty(DungeonEnemy.prototype, "type", {
                    get: function () { return Roguelike_1.DungeonObjectType.Enemy; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(DungeonEnemy.prototype, "event", {
                    get: function () { return this._event.model; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(DungeonEnemy.prototype, "x", {
                    get: function () { return this.event.x; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(DungeonEnemy.prototype, "y", {
                    get: function () { return this.event.y; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(DungeonEnemy.prototype, "direction", {
                    get: function () { return this.event.direction(); },
                    set: function (value) { this.event.setDirection(value); },
                    enumerable: true,
                    configurable: true
                });
                DungeonEnemy.prototype.locate = function (x, y) {
                    this.event.locate(x, y);
                };
                DungeonEnemy.prototype.requestActions = function () {
                    Roguelike_1.TurnManager.request(new Roguelike_1.ActionEntry(this, 1, 1));
                };
                DungeonEnemy.prototype.decideAction = function (entry) {
                    var _this = this;
                    var event = this.event;
                    var dx = Math.abs(event.deltaXFrom($gamePlayer.x));
                    var dy = Math.abs(event.deltaYFrom($gamePlayer.y));
                    if (dx + dy <= 3) {
                        return {
                            entry: entry,
                            type: Roguelike_1.ActionType.Move,
                            priority: 0,
                            perform: function () {
                                _this.event.moveTowardPlayer();
                            }
                        };
                    }
                    else {
                        return {
                            entry: entry,
                            type: Roguelike_1.ActionType.None,
                            priority: 0,
                            perform: function () { },
                        };
                    }
                };
                DungeonEnemy = __decorate([
                    plugin.type
                ], DungeonEnemy);
                return DungeonEnemy;
            }());
            exports_1("DungeonEnemy", DungeonEnemy);
            DungeonStairs = (function () {
                function DungeonStairs(event) {
                    this._event = EventExtension_1.EventManager.create(event);
                }
                Object.defineProperty(DungeonStairs.prototype, "type", {
                    get: function () { return Roguelike_1.DungeonObjectType.Stairs; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(DungeonStairs.prototype, "event", {
                    get: function () { return this._event.model; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(DungeonStairs.prototype, "x", {
                    get: function () { return this.event.x; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(DungeonStairs.prototype, "y", {
                    get: function () { return this.event.y; },
                    enumerable: true,
                    configurable: true
                });
                DungeonStairs.prototype.locate = function (x, y) {
                    this.event.locate(x, y);
                };
                DungeonStairs.prototype.requestActions = function () { };
                DungeonStairs.prototype.decideAction = function (entry) {
                    throw new Error(System.ErrorMessages.NOT_SUPPORTED);
                };
                DungeonStairs = __decorate([
                    plugin.type
                ], DungeonStairs);
                return DungeonStairs;
            }());
            exports_1("DungeonStairs", DungeonStairs);
            DefaultDungeonObjectFactory = (function () {
                function DefaultDungeonObjectFactory() {
                    this._floor = null;
                }
                DefaultDungeonObjectFactory.prototype.bind = function (floor) { this._floor = floor; };
                DefaultDungeonObjectFactory.prototype.unbind = function () { this._floor = null; };
                DefaultDungeonObjectFactory.prototype.create = function (type) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    switch (type) {
                        case Roguelike_1.DungeonObjectType.Player:
                            return this.createPlayer.apply(this, args);
                        case Roguelike_1.DungeonObjectType.Enemy:
                            return this.createEnemy.apply(this, args);
                        case Roguelike_1.DungeonObjectType.Stairs:
                            return this.createStairs.apply(this, args);
                        default:
                            throw new Error(System.ErrorMessages.NOT_SUPPORTED);
                    }
                };
                DefaultDungeonObjectFactory.prototype.createPlayer = function () {
                    return new DungeonPlayer();
                };
                DefaultDungeonObjectFactory.prototype.createEnemy = function () {
                    return new DungeonEnemy(this.events().enemies[0]);
                };
                DefaultDungeonObjectFactory.prototype.createStairs = function () {
                    return new DungeonStairs(this.events().stairs);
                };
                DefaultDungeonObjectFactory.prototype.events = function () {
                    if (!this._floor) {
                        throw new Error('Floor is not bound.');
                    }
                    return this._floor.spec.events;
                };
                DefaultDungeonObjectFactory = __decorate([
                    plugin.type
                ], DefaultDungeonObjectFactory);
                return DefaultDungeonObjectFactory;
            }());
            exports_1("DefaultDungeonObjectFactory", DefaultDungeonObjectFactory);
            DefaultDungeonStrategy = (function () {
                function DefaultDungeonStrategy() {
                }
                DefaultDungeonStrategy.prototype.start = function (floor, factory) {
                    var player = factory.createPlayer();
                    var stairs = factory.createStairs();
                    var playerPosition = this.getRandomPosition(floor);
                    var stairsPosition = this.getRandomPosition(floor);
                    player.locate(playerPosition.x, playerPosition.y);
                    stairs.locate(stairsPosition.x, stairsPosition.y);
                    for (var i = 0; i < 10; i++) {
                        var enemy = factory.createEnemy();
                        var enemyPosition = this.getRandomPosition(floor);
                        enemy.locate(enemyPosition.x, enemyPosition.y);
                        floor.objects.enemies.push(enemy);
                    }
                    floor.objects.player = player;
                    floor.objects.stairs = stairs;
                };
                DefaultDungeonStrategy.prototype.update = function (floor, factory) {
                };
                DefaultDungeonStrategy.prototype.getRandomPosition = function (floor) {
                    var map = floor.map;
                    var random = floor.random;
                    var rooms = map.rooms;
                    var roomIndex = random.next(rooms.length);
                    var room = rooms[roomIndex];
                    var offsetX = random.next(room.width);
                    var offsetY = random.next(room.height);
                    var x = room.x + offsetX;
                    var y = room.y + offsetY;
                    return { x: x, y: y };
                };
                DefaultDungeonStrategy = __decorate([
                    plugin.type
                ], DefaultDungeonStrategy);
                return DefaultDungeonStrategy;
            }());
            exports_1("DefaultDungeonStrategy", DefaultDungeonStrategy);
            Roguelike_1.Service.add(rl.DungeonObjectFactory, new DefaultDungeonObjectFactory());
            Roguelike_1.Service.add(rl.DungeonStrategy, new DefaultDungeonStrategy());
        }
    }
});
