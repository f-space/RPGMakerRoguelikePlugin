/*!
/*:
 * @plugindesc ローグライク：シーン
 * @author F_
 *
 * @help
 * マップ画面をローグライクに変更するプラグイン。
 *
 * Copyright (c) 2016 F_
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */
System.register(['SceneRedirection', 'ZoomExtension', 'EventExtension', 'DarknessEffect', 'Roguelike', 'RoguelikeResource'], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var __extends = (this && this.__extends) || function (d, b) {
        for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
    var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var SceneRedirection_1, ZoomExtension_1, EventExtension_1, DarknessEffect_1, Roguelike_1, RoguelikeResource_1;
    var plugin, DungeonSpriteset, MapType, DungeonScene;
    return {
        setters:[
            function (SceneRedirection_1_1) {
                SceneRedirection_1 = SceneRedirection_1_1;
            },
            function (ZoomExtension_1_1) {
                ZoomExtension_1 = ZoomExtension_1_1;
            },
            function (EventExtension_1_1) {
                EventExtension_1 = EventExtension_1_1;
            },
            function (DarknessEffect_1_1) {
                DarknessEffect_1 = DarknessEffect_1_1;
            },
            function (Roguelike_1_1) {
                Roguelike_1 = Roguelike_1_1;
            },
            function (RoguelikeResource_1_1) {
                RoguelikeResource_1 = RoguelikeResource_1_1;
            }],
        execute: function() {
            plugin = MVPlugin.get(__moduleName);
            DungeonSpriteset = (function (_super) {
                __extends(DungeonSpriteset, _super);
                function DungeonSpriteset() {
                    _super.apply(this, arguments);
                }
                DungeonSpriteset.prototype.createDarknessEffect = function () {
                    _super.prototype.createDarknessEffect.call(this);
                    this.darknessColor = 'rgba(0,0,0,0.75)';
                };
                DungeonSpriteset.prototype.updateDarknessEffect = function () {
                    var floor = Roguelike_1.DungeonManager.floor;
                    if (floor) {
                        var room = this.getCurrentRoom(floor);
                        if (room) {
                            var area = this.getRoomArea(room);
                            this.darknessMode = DarknessEffect_1.DarknessMode.Area;
                            this.darknessArea = area;
                        }
                        else {
                            this.darknessMode = DarknessEffect_1.DarknessMode.Circle;
                        }
                    }
                    else {
                        this.darknessMode = DarknessEffect_1.DarknessMode.None;
                    }
                    _super.prototype.updateDarknessEffect.call(this);
                };
                DungeonSpriteset.prototype.getCurrentRoom = function (floor) {
                    var rooms = floor.map.rooms;
                    var x = $gamePlayer.x;
                    var y = $gamePlayer.y;
                    for (var i = 0, length_1 = rooms.length; i < length_1; i++) {
                        if (rooms[i].contains(x, y)) {
                            return rooms[i];
                        }
                    }
                    return null;
                };
                DungeonSpriteset.prototype.getRoomArea = function (room) {
                    var tileWidth = $gameMap.tileWidth();
                    var tileHeight = $gameMap.tileHeight();
                    var x = Math.round($gameMap.adjustX(room.x - 0.75) * tileWidth);
                    var y = Math.round($gameMap.adjustY(room.y - 0.75) * tileHeight);
                    var width = (room.width + 1.5) * tileWidth;
                    var height = (room.height + 1.5) * tileHeight;
                    return new Rectangle(x, y, width, height);
                };
                DungeonSpriteset = __decorate([
                    plugin.type
                ], DungeonSpriteset);
                return DungeonSpriteset;
            }(DarknessEffect_1.DarkMapSpriteset));
            exports_1("DungeonSpriteset", DungeonSpriteset);
            (function (MapType) {
                MapType[MapType["Normal"] = 0] = "Normal";
                MapType[MapType["Dungeon"] = 1] = "Dungeon";
                MapType[MapType["Floor"] = 2] = "Floor";
            })(MapType || (MapType = {}));
            exports_1("MapType", MapType);
            DungeonScene = (function (_super) {
                __extends(DungeonScene, _super);
                function DungeonScene() {
                    _super.apply(this, arguments);
                    this._mapReady = false;
                    this._mapType = MapType.Normal;
                }
                Object.defineProperty(DungeonScene.prototype, "mapType", {
                    get: function () { return this._mapType; },
                    enumerable: true,
                    configurable: true
                });
                DungeonScene.prototype.createSpriteset = function () {
                    this._spriteset = new DungeonSpriteset();
                    this.addChild(this._spriteset);
                };
                DungeonScene.prototype.create = function () {
                    if (!$gamePlayer.isTransferring() && Roguelike_1.DungeonManager.floor) {
                        Scene_Base.prototype.create.call(this);
                        this._transfer = false;
                        this._mapLoaded = true;
                        this._mapType = MapType.Floor;
                    }
                    else {
                        _super.prototype.create.call(this);
                    }
                };
                DungeonScene.prototype.isReady = function () {
                    if (!this._mapLoaded && DataManager.isMapLoaded()) {
                        this.onMapLoaded();
                        this._mapLoaded = true;
                    }
                    if (this._mapLoaded) {
                        if (!this._mapReady && Roguelike_1.DungeonManager.context.ready) {
                            this.onMapReady();
                            this._mapReady = true;
                        }
                    }
                    return this._mapReady && Scene_Base.prototype.isReady.call(this);
                };
                DungeonScene.prototype.onMapLoaded = function () {
                    var map = $dataMap;
                    if (RoguelikeResource_1.ResourceHelper.isDungeonMap(map)) {
                        this.onDungeonMapLoaded();
                        this._mapType = MapType.Dungeon;
                    }
                    else if (RoguelikeResource_1.ResourceHelper.isFloorMap(map)) {
                        this.onFloorMapLoaded();
                        this._mapType = MapType.Floor;
                    }
                    else {
                        this.onNormalMapLoaded();
                        this._mapType = MapType.Normal;
                    }
                };
                DungeonScene.prototype.start = function () {
                    _super.prototype.start.call(this);
                    this.setupCamera();
                    if (this.mapType === MapType.Floor) {
                        Roguelike_1.TurnManager.addEventListener(this);
                        if (this._transfer) {
                            Roguelike_1.TurnManager.start();
                        }
                    }
                };
                DungeonScene.prototype.startFadeIn = function (duration, white) {
                    if (this.mapType !== MapType.Dungeon) {
                        _super.prototype.startFadeIn.call(this, duration, white);
                    }
                };
                DungeonScene.prototype.startFadeOut = function (duration, white) {
                    if (this.mapType !== MapType.Dungeon) {
                        _super.prototype.startFadeOut.call(this, duration, white);
                    }
                };
                DungeonScene.prototype.terminate = function () {
                    _super.prototype.terminate.call(this);
                    if (this.mapType === MapType.Floor) {
                        if ($gamePlayer.isTransferring()) {
                            Roguelike_1.TurnManager.end();
                        }
                        Roguelike_1.TurnManager.removeEventListener(this);
                    }
                };
                DungeonScene.prototype.updateMain = function () {
                    if (this.mapType === MapType.Floor) {
                        if (this.isActive())
                            this.updateDungeon();
                    }
                    _super.prototype.updateMain.call(this);
                };
                DungeonScene.prototype.onEnterFloor = function () {
                    var strategy = Roguelike_1.Service.get(Roguelike_1.DungeonStrategy);
                    var factory = Roguelike_1.Service.get(Roguelike_1.DungeonObjectFactory);
                    var floor = Roguelike_1.DungeonManager.floor;
                    factory.bind(floor);
                    strategy.start(floor, factory);
                    factory.unbind();
                };
                DungeonScene.prototype.onExitFloor = function () {
                    Roguelike_1.DungeonManager.deleteFloor();
                };
                DungeonScene.prototype.onStartTurn = function () {
                    var strategy = Roguelike_1.Service.get(Roguelike_1.DungeonStrategy);
                    var factory = Roguelike_1.Service.get(Roguelike_1.DungeonObjectFactory);
                    var floor = Roguelike_1.DungeonManager.floor;
                    factory.bind(floor);
                    strategy.update(floor, factory);
                    factory.unbind();
                };
                DungeonScene.prototype.onEndTurn = function () {
                };
                DungeonScene.prototype.onNormalMapLoaded = function () { };
                DungeonScene.prototype.onDungeonMapLoaded = function () {
                    if ($gamePlayer.isTransferring()) {
                        var map = $dataMap;
                        var mapID = $gamePlayer.newMapId();
                        var depth = $gamePlayer._newX + $gamePlayer._newY * map.width;
                        var source = new RoguelikeResource_1.MapDungeonSource(mapID);
                        source.set(map);
                        Roguelike_1.DungeonManager.createDungeon(source, depth);
                    }
                };
                DungeonScene.prototype.onFloorMapLoaded = function () {
                    if ($gamePlayer.isTransferring()) {
                        var map = $dataMap;
                        var mapID = $gamePlayer.newMapId();
                        var source = new RoguelikeResource_1.MapFloorSource(mapID);
                        source.set(map);
                        Roguelike_1.DungeonManager.createFloor(source);
                    }
                };
                DungeonScene.prototype.onMapReady = function () {
                    switch (this.mapType) {
                        case MapType.Normal:
                            this.onNormalMapReady();
                            break;
                        case MapType.Dungeon:
                            this.onDungeonMapReady();
                            break;
                        case MapType.Floor:
                            this.onFloorMapReady();
                            break;
                    }
                    Scene_Map.prototype.onMapLoaded.call(this);
                };
                DungeonScene.prototype.onNormalMapReady = function () { };
                DungeonScene.prototype.onDungeonMapReady = function () {
                    var dungeon = Roguelike_1.DungeonManager.dungeon;
                    var callback = dungeon.spec.callbacks[0];
                    if (callback) {
                        var invoker = DungeonScene.invoker;
                        invoker.list = callback;
                        $gameTemp.reserveCommonEvent(invoker.id);
                    }
                };
                DungeonScene.prototype.onFloorMapReady = function () {
                    if ($gamePlayer.isTransferring()) {
                        var floor = Roguelike_1.DungeonManager.floor;
                        var mapID = floor.spec.id;
                        $gamePlayer.reserveTransfer(mapID, 0, 0, 2, $gamePlayer.fadeType());
                        ;
                    }
                    $dataMap = this.arrangeMap();
                };
                DungeonScene.prototype.arrangeMap = function () {
                    var arranger = Roguelike_1.Service.get(Roguelike_1.DungeonMapArranger);
                    var floor = Roguelike_1.DungeonManager.floor;
                    var dataMap = arranger.arrange(floor);
                    return dataMap;
                };
                DungeonScene.prototype.setupCamera = function () {
                    if (this.mapType === MapType.Floor) {
                        $gameScreen.camera = new ZoomExtension_1.Camera(new ZoomExtension_1.PlayerTarget(), 0, 0, 2, true);
                    }
                    else {
                        $gameScreen.camera = null;
                    }
                };
                DungeonScene.prototype.updateDungeon = function () {
                    if ($gamePlayer.canMove()) {
                        Roguelike_1.TurnManager.next();
                    }
                };
                DungeonScene.invoker = (function () {
                    var event = EventExtension_1.CommonEventManager.create();
                    event.name = 'CallbackInvoker';
                    event.trigger = 0;
                    return event;
                })();
                DungeonScene = __decorate([
                    plugin.type
                ], DungeonScene);
                return DungeonScene;
            }(Scene_Map));
            exports_1("DungeonScene", DungeonScene);
            SceneRedirection_1.SceneRedirection.set(Scene_Map, DungeonScene);
        }
    }
});
