/*!
/*:
 * @plugindesc ローグライク：リソース管理
 * @author F_
 *
 * @param DungeonMapTag
 * @desc ダンジョンを示すメタデータのタグ。
 * @default blueprint
 *
 * @param FloorMapTag
 * @desc フロアを示すメタデータのタグ。
 * @default dungeon
 *
 * @param FloorTileTag
 * @desc 床タイルを示すメタデータのタグ。
 * @default floor
 *
 * @param WallTileTag
 * @desc 壁タイルを示すメタデータのタグ。
 * @default wall
 *
 * @param StairsTag
 * @desc 階段を示すメタデータのタグ。
 * @default stairs
 *
 * @param EnemyTag
 * @desc 敵を示すメタデータのタグ。
 * @default enemy
 *
 * @help
 * エディタによるリソースの指定を解釈してオブジェクトへと変換するクラスの実装。
 *
 * Copyright (c) 2016 F_
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */
System.register(['EventExtension'], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var EventExtension_1;
    var plugin, params, ResourceType, ResourceLoader, ResourceHelper, SourceState, MapDungeonSource, MapFloorSource, MapBasedMapConfig, MapBasedMapDesign, MapBasedDungeonEvents, MapInfo;
    return {
        setters:[
            function (EventExtension_1_1) {
                EventExtension_1 = EventExtension_1_1;
            }],
        execute: function() {
            plugin = MVPlugin.get(__moduleName);
            params = plugin.validate(function ($) {
                return {
                    dungeonMapTag: $.string('DungeonMapTag'),
                    floorMapTag: $.string('FloorMapTag'),
                    floorTileTag: $.string('FloorTileTag'),
                    wallTileTag: $.string('WallTileTag'),
                    stairsTag: $.string('StairsTag'),
                    enemyTag: $.string('EnemyTag'),
                };
            });
            (function (ResourceType) {
                ResourceType[ResourceType["Unknown"] = 0] = "Unknown";
                ResourceType[ResourceType["Actor"] = 1] = "Actor";
                ResourceType[ResourceType["Animation"] = 2] = "Animation";
                ResourceType[ResourceType["Armor"] = 3] = "Armor";
                ResourceType[ResourceType["Class"] = 4] = "Class";
                ResourceType[ResourceType["CommonEvent"] = 5] = "CommonEvent";
                ResourceType[ResourceType["Enemy"] = 6] = "Enemy";
                ResourceType[ResourceType["Item"] = 7] = "Item";
                ResourceType[ResourceType["Map"] = 8] = "Map";
                ResourceType[ResourceType["MapInfo"] = 9] = "MapInfo";
                ResourceType[ResourceType["Skill"] = 10] = "Skill";
                ResourceType[ResourceType["State"] = 11] = "State";
                ResourceType[ResourceType["System"] = 12] = "System";
                ResourceType[ResourceType["Tileset"] = 13] = "Tileset";
                ResourceType[ResourceType["Troop"] = 14] = "Troop";
                ResourceType[ResourceType["Weapon"] = 15] = "Weapon";
            })(ResourceType || (ResourceType = {}));
            exports_1("ResourceType", ResourceType);
            ResourceLoader = (function () {
                function ResourceLoader() {
                    throw new Error(System.ErrorMessages.NEW_STATIC_CLASS);
                }
                ResourceLoader.load = function (path, type, callback, options) {
                    var mimeType = (options && options.mimeType) || this.DefaultMimeType;
                    var xhr = new XMLHttpRequest();
                    var url = this.DataPath + path;
                    xhr.open(this.RequestMethod, url);
                    xhr.overrideMimeType(mimeType);
                    xhr.onload = ResourceLoader.onload.bind(this, xhr, type, url, callback);
                    xhr.onerror = ResourceLoader.onerror.bind(this, xhr, type, url);
                    xhr.send();
                };
                ResourceLoader.loadMap = function (mapID, callback, options) {
                    this.load(this.getMapFileName(mapID), ResourceType.Map, callback, options);
                };
                ResourceLoader.errors = function () {
                    return this._errors.slice();
                };
                ResourceLoader.checkError = function () {
                    if (this._errors.length !== 0) {
                        var message = this._errors.map(function (value) { return 'Failed to load: ' + value; }).join('\n');
                        throw new Error(message);
                    }
                };
                ResourceLoader.clearError = function () {
                    this._errors = [];
                };
                ResourceLoader.onload = function (xhr, type, url, callback) {
                    if (xhr.status === this.ResponseStatusOK || xhr.status === this.ResponseStatusLocal) {
                        if (typeof callback === 'function') {
                            var object = JSON.parse(xhr.responseText);
                            this.extractMetadata(object, type);
                            callback(object);
                        }
                    }
                };
                ResourceLoader.onerror = function (xhr, type, url) {
                    this._errors.push(url);
                };
                ResourceLoader.extractMetadata = function (object, type) {
                    var array;
                    if (type === ResourceType.Map) {
                        DataManager.extractMetadata(object);
                        array = object.events;
                    }
                    else {
                        array = object;
                    }
                    if (Array.isArray(array)) {
                        for (var i = 0; i < array.length; i++) {
                            var data = array[i];
                            if (data && data.note !== undefined) {
                                DataManager.extractMetadata(data);
                            }
                        }
                    }
                };
                ResourceLoader.getMapFileName = function (mapID) {
                    return 'Map%1.json'.format(mapID.padZero(3));
                };
                ResourceLoader.DataPath = 'data/';
                ResourceLoader.RequestMethod = 'GET';
                ResourceLoader.DefaultMimeType = 'application/json';
                ResourceLoader.ResponseStatusOK = 200;
                ResourceLoader.ResponseStatusLocal = 0;
                ResourceLoader._errors = [];
                ResourceLoader = __decorate([
                    plugin.type
                ], ResourceLoader);
                return ResourceLoader;
            }());
            exports_1("ResourceLoader", ResourceLoader);
            ResourceHelper = (function () {
                function ResourceHelper() {
                    throw new Error(System.ErrorMessages.NEW_STATIC_CLASS);
                }
                ResourceHelper.isDungeonMap = function (map) {
                    return !!map.meta[params.dungeonMapTag];
                };
                ResourceHelper.isFloorMap = function (map) {
                    return !!map.meta[params.floorMapTag];
                };
                ResourceHelper.getMapName = function (mapID) {
                    return $dataMapInfos[mapID].name;
                };
                ResourceHelper = __decorate([
                    plugin.type
                ], ResourceHelper);
                return ResourceHelper;
            }());
            exports_1("ResourceHelper", ResourceHelper);
            (function (SourceState) {
                SourceState[SourceState["NotLoaded"] = 0] = "NotLoaded";
                SourceState[SourceState["Loading"] = 1] = "Loading";
                SourceState[SourceState["Loaded"] = 2] = "Loaded";
            })(SourceState || (SourceState = {}));
            MapDungeonSource = (function () {
                function MapDungeonSource(mapID) {
                    var id = MapDungeonSource.getID(mapID);
                    this._mapID = mapID;
                    this._id = id;
                    this._name = '';
                    this._callbacks = [];
                    this._state = SourceState.NotLoaded;
                }
                Object.defineProperty(MapDungeonSource.prototype, "id", {
                    get: function () { return this._id; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(MapDungeonSource.prototype, "name", {
                    get: function () { return this._name; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(MapDungeonSource.prototype, "callbacks", {
                    get: function () { return this._callbacks; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(MapDungeonSource.prototype, "ready", {
                    get: function () { return (this._state === SourceState.Loaded); },
                    enumerable: true,
                    configurable: true
                });
                MapDungeonSource.prototype.toJSON = function () {
                    return { mapID: this._mapID };
                };
                MapDungeonSource.prototype.fromJSON = function (data) {
                    MapDungeonSource.call(this, data.mapID);
                };
                MapDungeonSource.prototype.onDeserialize = function () {
                    this.load();
                };
                MapDungeonSource.prototype.set = function (map) {
                    var callbacks = MapDungeonSource.extractCallbacks(map);
                    this._name = map.displayName;
                    this._callbacks = callbacks;
                    this._state = SourceState.Loaded;
                };
                MapDungeonSource.prototype.load = function () {
                    if (this._state === SourceState.NotLoaded) {
                        this._state = SourceState.Loading;
                        ResourceLoader.loadMap(this._mapID, this.onload.bind(this));
                    }
                };
                MapDungeonSource.prototype.onload = function (map) {
                    this.set(map);
                };
                MapDungeonSource.extractCallbacks = function (map) {
                    var events = new Array(map.width * map.height);
                    map.events.forEach(function (event) {
                        if (event) {
                            var index = event.x + event.y * map.width;
                            var pages = event.pages;
                            var list = (pages.length !== 0 && pages[0].list);
                            if (list)
                                events[index] = list;
                        }
                    });
                    return events;
                };
                MapDungeonSource.getID = function (mapID) {
                    return mapID.padZero(3);
                };
                MapDungeonSource = __decorate([
                    plugin.type
                ], MapDungeonSource);
                return MapDungeonSource;
            }());
            exports_1("MapDungeonSource", MapDungeonSource);
            MapFloorSource = (function () {
                function MapFloorSource(mapID) {
                    var id = MapFloorSource.getID(mapID);
                    this._mapID = mapID;
                    this._id = id;
                    this._name = '';
                    this._map = null;
                    this._events = null;
                    this._state = SourceState.NotLoaded;
                }
                Object.defineProperty(MapFloorSource.prototype, "mapID", {
                    get: function () { return this._mapID; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(MapFloorSource.prototype, "id", {
                    get: function () { return this._id; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(MapFloorSource.prototype, "name", {
                    get: function () { return this._name; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(MapFloorSource.prototype, "map", {
                    get: function () { return this._map; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(MapFloorSource.prototype, "events", {
                    get: function () { return this._events; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(MapFloorSource.prototype, "ready", {
                    get: function () { return (this._state === SourceState.Loaded); },
                    enumerable: true,
                    configurable: true
                });
                MapFloorSource.prototype.toJSON = function () {
                    return { mapID: this._mapID };
                };
                MapFloorSource.prototype.fromJSON = function (data) {
                    MapFloorSource.call(this, data.mapID);
                };
                MapFloorSource.prototype.onDeserialize = function () {
                    this.load();
                };
                MapFloorSource.prototype.set = function (map) {
                    var source = new MapInfo(map);
                    this._name = map.displayName;
                    this._map = new MapBasedMapConfig(source);
                    this._events = new MapBasedDungeonEvents(source);
                    this._state = SourceState.Loaded;
                };
                MapFloorSource.prototype.load = function () {
                    if (this._state === SourceState.NotLoaded) {
                        this._state = SourceState.Loading;
                        ResourceLoader.loadMap(this._mapID, this.onload.bind(this));
                    }
                };
                MapFloorSource.prototype.onload = function (map) {
                    this.set(map);
                };
                MapFloorSource.getID = function (mapID) {
                    return mapID.padZero(3);
                };
                MapFloorSource = __decorate([
                    plugin.type
                ], MapFloorSource);
                return MapFloorSource;
            }());
            exports_1("MapFloorSource", MapFloorSource);
            MapBasedMapConfig = (function () {
                function MapBasedMapConfig(source) {
                    var map = source.map;
                    var algorithm = MapBasedMapConfig.getAlgorithm(map);
                    var args = MapBasedMapConfig.getArguments(map);
                    this._width = map.width;
                    this._height = map.height;
                    this._algorithm = algorithm;
                    this._args = args;
                    this._design = new MapBasedMapDesign(source);
                }
                Object.defineProperty(MapBasedMapConfig.prototype, "width", {
                    get: function () { return this._width; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(MapBasedMapConfig.prototype, "height", {
                    get: function () { return this._height; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(MapBasedMapConfig.prototype, "algorithm", {
                    get: function () { return this._algorithm; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(MapBasedMapConfig.prototype, "args", {
                    get: function () { return this._args; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(MapBasedMapConfig.prototype, "design", {
                    get: function () { return this._design; },
                    enumerable: true,
                    configurable: true
                });
                MapBasedMapConfig.getAlgorithm = function (map) {
                    var algorithm = map.meta[params.floorMapTag];
                    return (System.Utility.isString(algorithm) ? algorithm : '');
                };
                MapBasedMapConfig.getArguments = function (map) {
                    return map.meta;
                };
                MapBasedMapConfig.getMapDesign = function (mapEvent) {
                    return new MapBasedMapDesign(mapEvent);
                };
                MapBasedMapConfig = __decorate([
                    plugin.type
                ], MapBasedMapConfig);
                return MapBasedMapConfig;
            }());
            exports_1("MapBasedMapConfig", MapBasedMapConfig);
            MapBasedMapDesign = (function () {
                function MapBasedMapDesign(source) {
                    var map = source.map;
                    var baseMap = MapBasedMapDesign.getBaseMap(map);
                    var floor = MapBasedMapDesign.getTilesOrDefault(map, source.floor, MapBasedMapDesign.DEFAULT_FLOOR);
                    var wall = MapBasedMapDesign.getTilesOrDefault(map, source.wall, MapBasedMapDesign.DEFAULT_WALL);
                    this.baseMap = baseMap;
                    this.floorTiles = floor;
                    this.wallTiles = wall;
                }
                MapBasedMapDesign.getBaseMap = function (map) {
                    var baseMap = JSON.parse(JSON.stringify(map));
                    baseMap.data = [];
                    baseMap.events = [null];
                    return baseMap;
                };
                MapBasedMapDesign.getTilesOrDefault = function (map, event, defaultValue) {
                    return (event ? this.getLayeredTiles(map, event) : defaultValue.slice());
                };
                MapBasedMapDesign.getLayeredTiles = function (map, event) {
                    var offset = event.x + event.y * map.width;
                    var size = map.width * map.height;
                    var tiles = [];
                    tiles[0] = map.data[offset + size * 0];
                    tiles[1] = map.data[offset + size * 1];
                    tiles[2] = map.data[offset + size * 2];
                    tiles[3] = map.data[offset + size * 3];
                    tiles[4] = 0;
                    tiles[5] = 0;
                    return tiles;
                };
                MapBasedMapDesign.DEFAULT_FLOOR = [Tilemap.TILE_ID_A2, 0, 0, 0, 0];
                MapBasedMapDesign.DEFAULT_WALL = [Tilemap.TILE_ID_A1, 0, 0, 0, 0];
                MapBasedMapDesign = __decorate([
                    plugin.type
                ], MapBasedMapDesign);
                return MapBasedMapDesign;
            }());
            exports_1("MapBasedMapDesign", MapBasedMapDesign);
            MapBasedDungeonEvents = (function () {
                function MapBasedDungeonEvents(mapEvent) {
                    this.stairs = mapEvent.stairs || new EventExtension_1.Event(-1);
                    this.enemies = mapEvent.enemies || [];
                }
                MapBasedDungeonEvents = __decorate([
                    plugin.type
                ], MapBasedDungeonEvents);
                return MapBasedDungeonEvents;
            }());
            exports_1("MapBasedDungeonEvents", MapBasedDungeonEvents);
            MapInfo = (function () {
                function MapInfo(map) {
                    var source = MapInfo.classifyEvents(map.events);
                    this.map = map;
                    this.floor = source.floor;
                    this.wall = source.wall;
                    this.stairs = source.stairs;
                    this.enemies = source.enemies;
                }
                MapInfo.classifyEvents = function (events) {
                    var source = {};
                    events.forEach(function (event) {
                        if (event) {
                            var meta_1 = event.meta;
                            Object.keys(meta_1).forEach(function (property) {
                                MapInfo.forEachMetadata.call(source, event, property, meta_1[property]);
                            });
                        }
                    });
                    return source;
                };
                MapInfo.forEachMetadata = function (event, key, value) {
                    switch (key) {
                        case params.floorTileTag:
                            this.floor = event;
                            break;
                        case params.wallTileTag:
                            this.wall = event;
                            break;
                        case params.stairsTag:
                            this.stairs = event;
                            break;
                        case params.enemyTag:
                            this.enemies = this.enemies || [];
                            this.enemies.push(event);
                            break;
                    }
                };
                return MapInfo;
            }());
        }
    }
});
