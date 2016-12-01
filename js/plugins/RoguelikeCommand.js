/*!
/*:
 * @plugindesc ローグライク：コマンド
 * @author F_
 *
 * @param EnterDungeon
 * @desc EnterDungeonコマンドのコマンド名
 * @default EnterDungeon
 *
 * @param ExitDungeon
 * @desc ExitDungeonコマンドのコマンド名
 * @default ExitDungeon
 *
 * @param ToFloor
 * @desc ToFloorコマンドのコマンド名
 * @default ToFloor
 *
 * @param ToPreviousFloor
 * @desc ToPreviousFloorコマンドのコマンド名
 * @default ToPreviousFloor
 *
 * @param ToNextFloor
 * @desc ToNextFloorコマンドのコマンド名
 * @default ToNextFloor
 *
 * @help
 * ローグライクなダンジョンを制御するコマンドの定義。
 *
 * Copyright (c) 2016 F_
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */
System.register(['Roguelike', 'RoguelikeResource'], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var Roguelike_1, RoguelikeResource_1;
    var plugin, params, CommandSet, GameInterpreterExtensions, DungeonSourceManager;
    return {
        setters:[
            function (Roguelike_1_1) {
                Roguelike_1 = Roguelike_1_1;
            },
            function (RoguelikeResource_1_1) {
                RoguelikeResource_1 = RoguelikeResource_1_1;
            }],
        execute: function() {
            plugin = MVPlugin.get(__moduleName);
            params = plugin.parameters.value;
            (function (CommandSet) {
                function EnterDungeon(name, floor) {
                    var _this = this;
                    if (floor === void 0) { floor = ''; }
                    var mapID = findMap(name);
                    var depth = parseInt(floor, 10) || 0;
                    if (mapID) {
                        DungeonSourceManager.load(mapID, function (source) {
                            Roguelike_1.DungeonManager.createDungeon(source, depth);
                            insertDungeonCallback(_this);
                        });
                        this.setWaitMode('dungeon');
                    }
                }
                CommandSet.EnterDungeon = EnterDungeon;
                function ExitDungeon() {
                    Roguelike_1.DungeonManager.deleteDungeon();
                }
                CommandSet.ExitDungeon = ExitDungeon;
                function ToFloor(expression) {
                    var dungeon = Roguelike_1.DungeonManager.dungeon;
                    if (dungeon) {
                        var evaluator = new Function('x', 'return (' + expression + ');');
                        dungeon.depth = Math.max(1, evaluator(dungeon.depth) | 0);
                        insertDungeonCallback(this);
                    }
                }
                CommandSet.ToFloor = ToFloor;
                function ToPreviousFloor() {
                    var dungeon = Roguelike_1.DungeonManager.dungeon;
                    if (dungeon) {
                        dungeon.depth = Math.max(1, dungeon.depth - 1);
                        insertDungeonCallback(this);
                    }
                }
                CommandSet.ToPreviousFloor = ToPreviousFloor;
                function ToNextFloor() {
                    var dungeon = Roguelike_1.DungeonManager.dungeon;
                    if (dungeon) {
                        dungeon.depth = Math.max(1, dungeon.depth + 1);
                        insertDungeonCallback(this);
                    }
                }
                CommandSet.ToNextFloor = ToNextFloor;
                function findMap(name) {
                    var maps = $dataMapInfos;
                    for (var i = 0, length_1 = maps.length; i < length_1; i++) {
                        var map = maps[i];
                        if (map && map.name === name) {
                            return i;
                        }
                    }
                    return null;
                }
                function insertDungeonCallback(interpreter) {
                    var dungeon = Roguelike_1.DungeonManager.dungeon;
                    if (dungeon) {
                        var callback = dungeon.spec.callbacks[dungeon.depth];
                        if (callback) {
                            insertCommands(interpreter, callback);
                        }
                    }
                }
                function insertCommands(interpreter, commands) {
                    var eventId = interpreter.isOnCurrentMap() ? interpreter.eventId() : 0;
                    interpreter.setupChild(commands, eventId);
                }
            })(CommandSet = CommandSet || (CommandSet = {}));
            exports_1("CommandSet", CommandSet);
            GameInterpreterExtensions = (function () {
                function GameInterpreterExtensions() {
                    throw new Error(System.ErrorMessages.NEW_STATIC_CLASS);
                }
                GameInterpreterExtensions.pluginCommand = function (base) {
                    var table = this.TABLE;
                    return function (command, args) {
                        var process = table[command];
                        if (process) {
                            process.apply(this, args);
                        }
                        else {
                            base.call(this, command, args);
                        }
                    };
                };
                GameInterpreterExtensions.updateWaitMode = function (base) {
                    return function () {
                        var handled = true, waiting = false;
                        switch (this._waitMode) {
                            case 'dungeon':
                                waiting = !DungeonSourceManager.ready;
                                break;
                            default:
                                handled = false;
                                break;
                        }
                        if (handled) {
                            if (!waiting) {
                                this._waitMode = '';
                            }
                            return waiting;
                        }
                        return base.call(this);
                    };
                };
                GameInterpreterExtensions.TABLE = (function () {
                    var table = {};
                    Object.keys(params).forEach(function (command) {
                        Object.defineProperty(table, params[command], { value: CommandSet[command] });
                    });
                    return table;
                })();
                __decorate([
                    MVPlugin.method
                ], GameInterpreterExtensions, "pluginCommand", null);
                __decorate([
                    MVPlugin.method
                ], GameInterpreterExtensions, "updateWaitMode", null);
                GameInterpreterExtensions = __decorate([
                    MVPlugin.extension(Game_Interpreter)
                ], GameInterpreterExtensions);
                return GameInterpreterExtensions;
            }());
            exports_1("GameInterpreterExtensions", GameInterpreterExtensions);
            DungeonSourceManager = (function () {
                function DungeonSourceManager() {
                    throw new Error(System.ErrorMessages.NEW_STATIC_CLASS);
                }
                Object.defineProperty(DungeonSourceManager, "ready", {
                    get: function () {
                        var source = this._source;
                        if (source && source.ready) {
                            if (this._callback)
                                this._callback(source);
                            this._source = null;
                            this._callback = null;
                        }
                        return !source;
                    },
                    enumerable: true,
                    configurable: true
                });
                DungeonSourceManager.load = function (mapID, callback) {
                    this._source = new RoguelikeResource_1.MapDungeonSource(mapID);
                    this._callback = callback;
                    this._source.load();
                };
                DungeonSourceManager._source = null;
                DungeonSourceManager._callback = null;
                return DungeonSourceManager;
            }());
        }
    }
});
