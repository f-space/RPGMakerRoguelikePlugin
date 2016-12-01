/*!
/*:
 * @plugindesc ローグライク：共通モデル
 * @author F_
 *
 * @help
 * ローグライクプラグインで使用する共通モデルの定義。
 *
 * このプラグインをONにしていないと、
 * すべてのローグライクプラグインは基本的に動作しないため注意。
 *
 * Copyright (c) 2016 F_
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */
System.register([], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var plugin, PriorityQueue, Random, DungeonSpec, FloorSpec, DungeonManager, Context, Dungeon, Floor, Map, Cell, CellType, Room, DungeonObjectType, DungeonObjectList, ActionEntry, ActionType, Action, Stats, TurnManager, DungeonAlgorithm, DungeonAlgorithmSelector, DungeonAlgorithmProvider, DefaultDungeonAlgorithmProvider, DungeonStrategy, DungeonObjectFactory, DungeonMapArranger, Service;
    return {
        setters:[],
        execute: function() {
            plugin = MVPlugin.get(__moduleName);
            PriorityQueue = (function () {
                function PriorityQueue(comparer) {
                    this.comparer = comparer;
                    this._array = [];
                    this._head = 0;
                    this._dirty = false;
                }
                Object.defineProperty(PriorityQueue.prototype, "size", {
                    get: function () { return (this._array.length - this._head); },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(PriorityQueue.prototype, "empty", {
                    get: function () { return (this.size === 0); },
                    enumerable: true,
                    configurable: true
                });
                PriorityQueue.prototype.enqueue = function (item) {
                    this._array.push(item);
                    this._dirty = true;
                    return this;
                };
                PriorityQueue.prototype.dequeue = function () {
                    this.checkSize();
                    this.ensureOrder();
                    var item = this._array[this._head];
                    this._array[this._head] = null;
                    this._head++;
                    return item;
                };
                PriorityQueue.prototype.peek = function () {
                    this.checkSize();
                    this.ensureOrder();
                    return this._array[this._head];
                };
                PriorityQueue.prototype.clear = function () {
                    this._array = [];
                    this._head = 0;
                    this._dirty = false;
                    return this;
                };
                PriorityQueue.prototype.checkSize = function () {
                    if (this.empty)
                        throw new Error('Queue is empty.');
                };
                PriorityQueue.prototype.ensureOrder = function () {
                    if (this._dirty) {
                        this._array = this._array.slice(this._head).sort(this.comparer);
                        this._head = 0;
                        this._dirty = false;
                    }
                };
                PriorityQueue = __decorate([
                    plugin.type
                ], PriorityQueue);
                return PriorityQueue;
            }());
            exports_1("PriorityQueue", PriorityQueue);
            Random = (function () {
                function Random(seed) {
                    var useed = Random.seed(seed);
                    this._seed = useed;
                    this._value = useed;
                }
                Object.defineProperty(Random.prototype, "seed", {
                    get: function () { return this._seed; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(Random.prototype, "value", {
                    get: function () { return this._value; },
                    set: function (value) { this._value = value >>> 0; },
                    enumerable: true,
                    configurable: true
                });
                Random.prototype.toJSON = function () {
                    return {
                        seed: this._seed,
                        value: this._value
                    };
                };
                Random.prototype.fromJSON = function (data) {
                    this._seed = data.seed;
                    this._value = data.value;
                };
                Random.prototype.next = function (max) {
                    this.toNext();
                    return (max == null ? this._value : (this._value % ((max >>> 0) || 1)));
                };
                Random.prototype.next01 = function () {
                    this.toNext();
                    return (this._value / Random.MAX);
                };
                Random.seed = function (n) {
                    if (n === void 0) { n = Date.now(); }
                    return (n >>> 0) || Random.MAX;
                };
                Random.prototype.toNext = function () {
                    this._value = Random.xorshift32(this._value);
                };
                Random.xorshift32 = function (x) {
                    x = x ^ (x << 13);
                    x = x ^ (x >>> 17);
                    x = x ^ (x << 15);
                    return x >>> 0;
                };
                Random.MAX = (-1 >>> 0);
                Random = __decorate([
                    plugin.type
                ], Random);
                return Random;
            }());
            exports_1("Random", Random);
            DungeonSpec = (function () {
                function DungeonSpec(source, seed) {
                    var useed = Random.seed(seed);
                    var id = source.id + '_' + useed.padZero(10);
                    this._id = id;
                    this._source = source;
                    this._seed = useed;
                }
                Object.defineProperty(DungeonSpec.prototype, "id", {
                    get: function () { return this._id; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(DungeonSpec.prototype, "source", {
                    get: function () { return this._source; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(DungeonSpec.prototype, "seed", {
                    get: function () { return this._seed; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(DungeonSpec.prototype, "name", {
                    get: function () { return this.source.name; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(DungeonSpec.prototype, "callbacks", {
                    get: function () { return this.source.callbacks; },
                    enumerable: true,
                    configurable: true
                });
                DungeonSpec.prototype.toJSON = function () {
                    return {
                        id: this._id,
                        source: this._source,
                        seed: this._seed,
                    };
                };
                DungeonSpec.prototype.fromJSON = function (data) {
                    this._id = data.id;
                    this._source = data.source;
                    this._seed = data.seed;
                };
                DungeonSpec = __decorate([
                    plugin.type
                ], DungeonSpec);
                return DungeonSpec;
            }());
            exports_1("DungeonSpec", DungeonSpec);
            FloorSpec = (function () {
                function FloorSpec(source, seed) {
                    var useed = (seed >>> 0) || (-1 >>> 0);
                    var id = source.id + '_' + useed.padZero(10);
                    this._id = id;
                    this._source = source;
                    this._seed = useed;
                }
                Object.defineProperty(FloorSpec.prototype, "id", {
                    get: function () { return this._id; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(FloorSpec.prototype, "source", {
                    get: function () { return this._source; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(FloorSpec.prototype, "seed", {
                    get: function () { return this._seed; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(FloorSpec.prototype, "name", {
                    get: function () { return this.source.name; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(FloorSpec.prototype, "map", {
                    get: function () { return this.source.map; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(FloorSpec.prototype, "events", {
                    get: function () { return this.source.events; },
                    enumerable: true,
                    configurable: true
                });
                FloorSpec.prototype.toJSON = function () {
                    return {
                        id: this._id,
                        source: this._source,
                        seed: this._seed,
                    };
                };
                FloorSpec.prototype.fromJSON = function (data) {
                    this._id = data.id;
                    this._source = data.source;
                    this._seed = data.seed;
                };
                FloorSpec = __decorate([
                    plugin.type
                ], FloorSpec);
                return FloorSpec;
            }());
            exports_1("FloorSpec", FloorSpec);
            DungeonManager = (function () {
                function DungeonManager() {
                    throw new Error(System.ErrorMessages.NEW_STATIC_CLASS);
                }
                Object.defineProperty(DungeonManager, "context", {
                    get: function () { return this._context; },
                    set: function (value) { this._context = value; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(DungeonManager, "dungeon", {
                    get: function () { return this._context.dungeon; },
                    set: function (value) { this._context.dungeon = value; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(DungeonManager, "floor", {
                    get: function () { return this._context.floor; },
                    set: function (value) { this._context.floor = value; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(DungeonManager, "inDungeon", {
                    get: function () { return (this._context.dungeon != null); },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(DungeonManager, "inFloor", {
                    get: function () { return (this._context.floor != null); },
                    enumerable: true,
                    configurable: true
                });
                DungeonManager.createDungeon = function (source, depth) {
                    if (!source.ready)
                        throw new Error("DungeonSource is not ready.");
                    var seed = this.newSeed();
                    var spec = new DungeonSpec(source, seed);
                    var dungeon = new Dungeon(spec, depth);
                    return (this.dungeon = dungeon);
                };
                DungeonManager.deleteDungeon = function () {
                    this.dungeon = null;
                };
                DungeonManager.createFloor = function (source) {
                    if (!source.ready)
                        throw new Error("FloorSource is not ready.");
                    var algorithms = Service.get(DungeonAlgorithmProvider);
                    var dungeon = this.dungeon;
                    var seed = dungeon ? dungeon.random.next() : this.newSeed();
                    var spec = new FloorSpec(source, seed);
                    var floor = new Floor(spec, algorithms);
                    return (this.floor = floor);
                };
                DungeonManager.deleteFloor = function () {
                    this.floor = null;
                };
                DungeonManager.newSeed = function () {
                    return (new Random()).next();
                };
                DungeonManager = __decorate([
                    plugin.type
                ], DungeonManager);
                return DungeonManager;
            }());
            exports_1("DungeonManager", DungeonManager);
            Context = (function () {
                function Context() {
                    this.dungeon = null;
                    this.floor = null;
                    this.stats = new Stats();
                }
                Object.defineProperty(Context.prototype, "ready", {
                    get: function () {
                        var dungeon = this.dungeon;
                        var floor = this.floor;
                        return ((!dungeon || dungeon.spec.source.ready) && (!floor || floor.spec.source.ready));
                    },
                    enumerable: true,
                    configurable: true
                });
                Context.prototype.toJSON = function () {
                    return {
                        dungeon: this.dungeon,
                        floor: this.floor,
                    };
                };
                Context.prototype.fromJSON = function (data) {
                    this.dungeon = data.dungeon;
                    this.floor = data.floor;
                };
                Context = __decorate([
                    plugin.type
                ], Context);
                return Context;
            }());
            exports_1("Context", Context);
            Dungeon = (function () {
                function Dungeon(spec, depth) {
                    if (depth === void 0) { depth = 0; }
                    this._spec = spec;
                    this._random = new Random(spec.seed);
                    this._depth = depth;
                }
                Object.defineProperty(Dungeon.prototype, "spec", {
                    get: function () { return this._spec; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(Dungeon.prototype, "random", {
                    get: function () { return this._random; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(Dungeon.prototype, "depth", {
                    get: function () { return this._depth; },
                    set: function (value) { this._depth = value; },
                    enumerable: true,
                    configurable: true
                });
                Dungeon.prototype.toJSON = function () {
                    return {
                        spec: this._spec,
                        random: this._random,
                        depth: this._depth,
                    };
                };
                Dungeon.prototype.fromJSON = function (data) {
                    this._spec = data.spec;
                    this._random = data.random;
                    this._depth = data.depth;
                };
                Dungeon = __decorate([
                    plugin.type
                ], Dungeon);
                return Dungeon;
            }());
            exports_1("Dungeon", Dungeon);
            Floor = (function () {
                function Floor(spec, algorithms) {
                    var random = new Random(spec.seed);
                    var map = Floor.createMap(spec.map, algorithms, random.next());
                    var seed = random.next();
                    this._spec = spec;
                    this._random = new Random(seed);
                    this._map = map;
                    this._objects = new DungeonObjectList();
                }
                Object.defineProperty(Floor.prototype, "spec", {
                    get: function () { return this._spec; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(Floor.prototype, "random", {
                    get: function () { return this._random; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(Floor.prototype, "map", {
                    get: function () { return this._map; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(Floor.prototype, "objects", {
                    get: function () { return this._objects; },
                    enumerable: true,
                    configurable: true
                });
                Floor.prototype.toJSON = function () {
                    return {
                        spec: this._spec,
                        random: this._random,
                        map: this._map,
                        objects: this._objects,
                    };
                };
                Floor.prototype.fromJSON = function (data) {
                    this._spec = data.spec;
                    this._random = data.random;
                    this._map = data.map;
                    this._objects = data.objects;
                };
                Floor.createMap = function (config, algorithms, seed) {
                    var algorithm = algorithms.get(config.algorithm);
                    var random = new Random(seed);
                    var map = algorithm.create(config, random);
                    return map;
                };
                Floor = __decorate([
                    plugin.type
                ], Floor);
                return Floor;
            }());
            exports_1("Floor", Floor);
            Map = (function () {
                function Map(width, height) {
                    var cells = this.createCells(width, height);
                    this._width = width;
                    this._height = height;
                    this._cells = cells;
                    this._rooms = [];
                }
                Object.defineProperty(Map.prototype, "width", {
                    get: function () { return this._width; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(Map.prototype, "height", {
                    get: function () { return this._height; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(Map.prototype, "cells", {
                    get: function () { return this._cells; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(Map.prototype, "rooms", {
                    get: function () { return this._rooms; },
                    enumerable: true,
                    configurable: true
                });
                Map.prototype.toJSON = function () {
                    return {
                        width: this._width,
                        height: this._height,
                        cells: this._cells,
                        rooms: this._rooms,
                    };
                };
                Map.prototype.fromJSON = function (data) {
                    this._width = data.width;
                    this._height = data.height;
                    this._cells = data.cells;
                    this._rooms = data.rooms;
                };
                Map.prototype.createCells = function (width, height) {
                    var cells = new Array(width * height);
                    for (var y = 0; y < height; y++) {
                        for (var x = 0; x < width; x++) {
                            cells[x + y * width] = new Cell(this, x, y);
                        }
                    }
                    return cells;
                };
                Map = __decorate([
                    plugin.type
                ], Map);
                return Map;
            }());
            exports_1("Map", Map);
            Cell = (function () {
                function Cell(map, x, y) {
                    this._map = map;
                    this._x = x;
                    this._y = y;
                    this._type = CellType.Wall;
                }
                Object.defineProperty(Cell.prototype, "map", {
                    get: function () { return this._map; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(Cell.prototype, "x", {
                    get: function () { return this._x; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(Cell.prototype, "y", {
                    get: function () { return this._y; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(Cell.prototype, "index", {
                    get: function () { return (this.x + this.map.width * this.y); },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(Cell.prototype, "type", {
                    get: function () { return this._type; },
                    set: function (value) { this._type = value; },
                    enumerable: true,
                    configurable: true
                });
                Cell.prototype.toJSON = function () {
                    return {
                        map: this._map,
                        x: this._x,
                        y: this._y,
                        type: this._type,
                    };
                };
                Cell.prototype.fromJSON = function (data) {
                    this._map = data.map;
                    this._x = data.x;
                    this._y = data.y;
                    this._type = data.type;
                };
                Cell.prototype.getDataIndex = function (z) {
                    return (this.x + this.map.width * (this.y + this.map.height * (z || 0)));
                };
                Cell = __decorate([
                    plugin.type
                ], Cell);
                return Cell;
            }());
            exports_1("Cell", Cell);
            (function (CellType) {
                CellType[CellType["Floor"] = 0] = "Floor";
                CellType[CellType["Wall"] = 1] = "Wall";
            })(CellType || (CellType = {}));
            exports_1("CellType", CellType);
            Room = (function () {
                function Room(x, y, width, height) {
                    this.x = x;
                    this.y = y;
                    this.width = width;
                    this.height = height;
                }
                Object.defineProperty(Room.prototype, "minX", {
                    get: function () { return this.x; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(Room.prototype, "maxX", {
                    get: function () { return this.x + this.width; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(Room.prototype, "minY", {
                    get: function () { return this.y; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(Room.prototype, "maxY", {
                    get: function () { return this.y + this.height; },
                    enumerable: true,
                    configurable: true
                });
                Room.prototype.toJSON = function () {
                    return {
                        x: this.x,
                        y: this.y,
                        width: this.width,
                        height: this.height,
                    };
                };
                Room.prototype.fromJSON = function (data) {
                    this.x = data.x;
                    this.y = data.y;
                    this.width = data.width;
                    this.height = data.height;
                };
                Room.prototype.contains = function (x, y) {
                    return (x >= this.minX && x < this.maxX && y >= this.minY && y < this.maxY);
                };
                Room = __decorate([
                    plugin.type
                ], Room);
                return Room;
            }());
            exports_1("Room", Room);
            (function (DungeonObjectType) {
                DungeonObjectType[DungeonObjectType["Unknown"] = 0] = "Unknown";
                DungeonObjectType[DungeonObjectType["Player"] = 1] = "Player";
                DungeonObjectType[DungeonObjectType["Enemy"] = 2] = "Enemy";
                DungeonObjectType[DungeonObjectType["Item"] = 3] = "Item";
                DungeonObjectType[DungeonObjectType["Trap"] = 4] = "Trap";
                DungeonObjectType[DungeonObjectType["Stairs"] = 5] = "Stairs";
            })(DungeonObjectType || (DungeonObjectType = {}));
            exports_1("DungeonObjectType", DungeonObjectType);
            DungeonObjectList = (function () {
                function DungeonObjectList() {
                    this._objects = DungeonObjectList.getPredefinedObjects();
                }
                Object.defineProperty(DungeonObjectList.prototype, "player", {
                    get: function () { return this.get(DungeonObjectType.Player); },
                    set: function (value) { this.set(DungeonObjectType.Player, value); },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(DungeonObjectList.prototype, "enemies", {
                    get: function () { return this.get(DungeonObjectType.Enemy); },
                    set: function (value) { this.set(DungeonObjectType.Enemy, value); },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(DungeonObjectList.prototype, "items", {
                    get: function () { return this.get(DungeonObjectType.Item); },
                    set: function (value) { this.set(DungeonObjectType.Item, value); },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(DungeonObjectList.prototype, "traps", {
                    get: function () { return this.get(DungeonObjectType.Trap); },
                    set: function (value) { this.set(DungeonObjectType.Trap, value); },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(DungeonObjectList.prototype, "stairs", {
                    get: function () { return this.get(DungeonObjectType.Stairs); },
                    set: function (value) { this.set(DungeonObjectType.Stairs, value); },
                    enumerable: true,
                    configurable: true
                });
                DungeonObjectList.prototype.toJSON = function () {
                    return { objects: this._objects };
                };
                DungeonObjectList.prototype.fromJSON = function (data) {
                    this._objects = data.objects;
                };
                DungeonObjectList.prototype.get = function (type) {
                    return this._objects[type];
                };
                DungeonObjectList.prototype.set = function (type, value) {
                    this._objects[type] = value;
                };
                DungeonObjectList.prototype.all = function () {
                    var objects = this._objects;
                    var all = Array.prototype.concat.apply([], Object.keys(objects).map(function (key) { return objects[+key]; }));
                    return all;
                };
                DungeonObjectList.getPredefinedObjects = function () {
                    var objects = {};
                    objects[DungeonObjectType.Player] = null;
                    objects[DungeonObjectType.Enemy] = [];
                    objects[DungeonObjectType.Item] = [];
                    objects[DungeonObjectType.Trap] = [];
                    objects[DungeonObjectType.Stairs] = null;
                    return objects;
                };
                DungeonObjectList = __decorate([
                    plugin.type
                ], DungeonObjectList);
                return DungeonObjectList;
            }());
            exports_1("DungeonObjectList", DungeonObjectList);
            ActionEntry = (function () {
                function ActionEntry(subject, phase, timing) {
                    this.subject = subject;
                    this.phase = phase;
                    this.timing = timing;
                }
                Object.defineProperty(ActionEntry.prototype, "type", {
                    get: function () { return this.subject.type; },
                    enumerable: true,
                    configurable: true
                });
                ActionEntry.compare = function (x, y) {
                    return (x.timing - y.timing) || (ActionEntry.PRIORITY_TABLE[x.type] - ActionEntry.PRIORITY_TABLE[y.type]);
                };
                ActionEntry.PRIORITY_TABLE = (function () {
                    var table = [];
                    table[DungeonObjectType.Unknown] = -1 >>> 0;
                    table[DungeonObjectType.Player] = 100;
                    table[DungeonObjectType.Enemy] = 1000;
                    table[DungeonObjectType.Item] = 3000;
                    table[DungeonObjectType.Trap] = 2000;
                    table[DungeonObjectType.Stairs] = 5000;
                    return table;
                })();
                ActionEntry = __decorate([
                    plugin.type
                ], ActionEntry);
                return ActionEntry;
            }());
            exports_1("ActionEntry", ActionEntry);
            ActionType = (function () {
                function ActionType(name, priority, block) {
                    this.name = name;
                    this.priority = priority;
                    this.block = block;
                }
                ActionType.compare = function (x, y) {
                    return x.priority - y.priority;
                };
                ActionType.None = new ActionType('None', 0, false);
                ActionType.Move = new ActionType('Move', 1000, false);
                ActionType.Skill = new ActionType('Skill', 2000, true);
                ActionType = __decorate([
                    plugin.type
                ], ActionType);
                return ActionType;
            }());
            exports_1("ActionType", ActionType);
            Action = (function () {
                function Action() {
                    throw new Error(System.ErrorMessages.NEW_STATIC_CLASS);
                }
                Action.compare = function (x, y) {
                    return ActionEntry.compare(x.entry, y.entry) || ActionType.compare(x.type, y.type) || (x.priority - y.priority);
                };
                Action = __decorate([
                    plugin.type
                ], Action);
                return Action;
            }());
            exports_1("Action", Action);
            Stats = (function () {
                function Stats() {
                }
                Stats.prototype.toJSON = function () {
                    return {
                        turn: TurnManager.turn,
                    };
                };
                Stats.prototype.fromJSON = function (data) {
                    TurnManager.turn = data.turn;
                };
                Stats = __decorate([
                    plugin.type
                ], Stats);
                return Stats;
            }());
            exports_1("Stats", Stats);
            TurnManager = (function () {
                function TurnManager() {
                    throw new Error(System.ErrorMessages.NEW_STATIC_CLASS);
                }
                Object.defineProperty(TurnManager, "turn", {
                    get: function () { return this._turn; },
                    set: function (value) { this._turn = value; },
                    enumerable: true,
                    configurable: true
                });
                TurnManager.start = function () {
                    this.raiseEvent(function (listener) { return listener.onEnterFloor; });
                };
                TurnManager.end = function () {
                    this.raiseEvent(function (listener) { return listener.onExitFloor; });
                    this.clear();
                };
                TurnManager.next = function () {
                    if (this._actionQueue.empty) {
                        if (this._entryQueue.empty) {
                            if (this._turn > 0)
                                this.endTurn();
                            this.startTurn();
                            this.collectActionEntries();
                        }
                        this.collectActions();
                    }
                    this.invokeActions();
                };
                TurnManager.request = function (entry) {
                    this._entryQueue.enqueue(entry);
                };
                TurnManager.addEventListener = function (listener) {
                    this._listeners.push(listener);
                };
                TurnManager.removeEventListener = function (listener) {
                    this._listeners.splice(this._listeners.indexOf(listener), 1);
                };
                TurnManager.clear = function () {
                    this._turn = 0;
                    this._entryQueue.clear();
                    this._actionQueue.clear();
                };
                TurnManager.startTurn = function () {
                    this._turn++;
                    this.raiseEvent(function (listener) { return listener.onStartTurn; });
                };
                TurnManager.endTurn = function () {
                    this.raiseEvent(function (listener) { return listener.onEndTurn; });
                };
                TurnManager.collectActionEntries = function () {
                    var floor = DungeonManager.floor;
                    if (floor) {
                        var objects = floor.objects.all();
                        objects.forEach(function (object) { return object.requestActions(); });
                    }
                };
                TurnManager.collectActions = function () {
                    var queue = this._entryQueue;
                    while (!queue.empty) {
                        var entry = queue.peek();
                        var action = entry.subject.decideAction(entry);
                        if (!action)
                            break;
                        this._actionQueue.enqueue(action);
                        queue.dequeue();
                    }
                };
                TurnManager.invokeActions = function () {
                    var queue = this._actionQueue;
                    var first = true;
                    while (!queue.empty && (first || !queue.peek().type.block)) {
                        var action = queue.dequeue();
                        action.perform();
                    }
                };
                TurnManager.raiseEvent = function (selector) {
                    this._listeners.forEach(function (listener) {
                        var handler = selector(listener);
                        if (System.Utility.isFunction(handler)) {
                            handler();
                        }
                    });
                };
                TurnManager._turn = 0;
                TurnManager._entryQueue = new PriorityQueue(ActionEntry.compare);
                TurnManager._actionQueue = new PriorityQueue(Action.compare);
                TurnManager._listeners = [];
                TurnManager = __decorate([
                    plugin.type
                ], TurnManager);
                return TurnManager;
            }());
            exports_1("TurnManager", TurnManager);
            DungeonAlgorithm = (function () {
                function DungeonAlgorithm() {
                    throw new Error(System.ErrorMessages.NEW_STATIC_CLASS);
                }
                DungeonAlgorithm = __decorate([
                    plugin.type
                ], DungeonAlgorithm);
                return DungeonAlgorithm;
            }());
            exports_1("DungeonAlgorithm", DungeonAlgorithm);
            DungeonAlgorithmSelector = (function () {
                function DungeonAlgorithmSelector() {
                    this._algorithms = [];
                }
                DungeonAlgorithmSelector.prototype.create = function (config, random) {
                    if (this._algorithms.length !== 0) {
                        var index = this.select(random);
                        var algorithm = this._algorithms[index].algorithm;
                        return algorithm.create(config, random);
                    }
                    return new Map(config.width, config.height);
                };
                DungeonAlgorithmSelector.prototype.add = function (algorithm, weight) {
                    if (weight === void 0) { weight = 1; }
                    this._algorithms.push({ algorithm: algorithm, weight: weight });
                };
                DungeonAlgorithmSelector.prototype.select = function (random) {
                    var total = this._algorithms.reduce(function (total, entry) { return total + entry.weight; }, 0);
                    var weights = this._algorithms.map(function (entry) { return entry.weight / total; });
                    var selection = random.next01();
                    for (var i = 0; i < weights.length; i++) {
                        if (selection <= weights[i])
                            return i;
                    }
                    return weights.length - 1;
                };
                DungeonAlgorithmSelector = __decorate([
                    plugin.type
                ], DungeonAlgorithmSelector);
                return DungeonAlgorithmSelector;
            }());
            exports_1("DungeonAlgorithmSelector", DungeonAlgorithmSelector);
            DungeonAlgorithmProvider = (function () {
                function DungeonAlgorithmProvider() {
                    throw new Error(System.ErrorMessages.NEW_STATIC_CLASS);
                }
                DungeonAlgorithmProvider = __decorate([
                    plugin.type
                ], DungeonAlgorithmProvider);
                return DungeonAlgorithmProvider;
            }());
            exports_1("DungeonAlgorithmProvider", DungeonAlgorithmProvider);
            DefaultDungeonAlgorithmProvider = (function () {
                function DefaultDungeonAlgorithmProvider() {
                    this._algorithms = Object.create(null);
                }
                Object.defineProperty(DefaultDungeonAlgorithmProvider, "default", {
                    get: function () { return this.instance._algorithms[this.DEFAULT]; },
                    set: function (value) { this.instance._algorithms[this.DEFAULT] = value; },
                    enumerable: true,
                    configurable: true
                });
                DefaultDungeonAlgorithmProvider.get = function (name) {
                    return this.instance.get(name);
                };
                DefaultDungeonAlgorithmProvider.register = function (name, algorithm) {
                    this.instance.register(name, algorithm);
                };
                DefaultDungeonAlgorithmProvider.unregister = function (name) {
                    this.instance.unregister(name);
                };
                DefaultDungeonAlgorithmProvider.prototype.get = function (name) {
                    name = name || DefaultDungeonAlgorithmProvider.DEFAULT;
                    if (!(name in this._algorithms)) {
                        throw new Error("Unknown algorithm: '" + name + "'.");
                    }
                    return this._algorithms[name];
                };
                DefaultDungeonAlgorithmProvider.prototype.register = function (name, algorithm) {
                    this._algorithms[name] = algorithm;
                };
                DefaultDungeonAlgorithmProvider.prototype.unregister = function (name) {
                    delete this._algorithms[name];
                };
                DefaultDungeonAlgorithmProvider.instance = new DefaultDungeonAlgorithmProvider();
                DefaultDungeonAlgorithmProvider.DEFAULT = '@default';
                DefaultDungeonAlgorithmProvider = __decorate([
                    plugin.type
                ], DefaultDungeonAlgorithmProvider);
                return DefaultDungeonAlgorithmProvider;
            }());
            exports_1("DefaultDungeonAlgorithmProvider", DefaultDungeonAlgorithmProvider);
            DungeonStrategy = (function () {
                function DungeonStrategy() {
                    throw new Error(System.ErrorMessages.NEW_STATIC_CLASS);
                }
                DungeonStrategy = __decorate([
                    plugin.type
                ], DungeonStrategy);
                return DungeonStrategy;
            }());
            exports_1("DungeonStrategy", DungeonStrategy);
            DungeonObjectFactory = (function () {
                function DungeonObjectFactory() {
                    throw new Error(System.ErrorMessages.NEW_STATIC_CLASS);
                }
                DungeonObjectFactory = __decorate([
                    plugin.type
                ], DungeonObjectFactory);
                return DungeonObjectFactory;
            }());
            exports_1("DungeonObjectFactory", DungeonObjectFactory);
            DungeonMapArranger = (function () {
                function DungeonMapArranger() {
                    throw new Error(System.ErrorMessages.NEW_STATIC_CLASS);
                }
                DungeonMapArranger = __decorate([
                    plugin.type
                ], DungeonMapArranger);
                return DungeonMapArranger;
            }());
            exports_1("DungeonMapArranger", DungeonMapArranger);
            Service = (function () {
                function Service() {
                    throw new Error(System.ErrorMessages.NEW_STATIC_CLASS);
                }
                Service.get = function (id) {
                    var name = this.getUniqueName(id);
                    return (name in this.services ? this.services[name] : null);
                };
                Service.add = function (id, service) {
                    var name = this.getUniqueName(id);
                    this.services[name] = service;
                };
                ;
                Service.remove = function (id) {
                    var name = this.getUniqueName(id);
                    return delete this.services[name];
                };
                ;
                Service.getUniqueName = function (id) {
                    return (System.Utility.isFunction(id) ? System.Type.of(id) : String(id));
                };
                Service.services = Object.create(null);
                Service = __decorate([
                    plugin.type
                ], Service);
                return Service;
            }());
            exports_1("Service", Service);
            Service.add(DungeonAlgorithmProvider, DefaultDungeonAlgorithmProvider.instance);
            Service.add(DungeonStrategy, null);
            Service.add(DungeonObjectFactory, null);
            Service.add(DungeonMapArranger, null);
        }
    }
});
