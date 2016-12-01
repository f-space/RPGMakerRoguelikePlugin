/*!
/*:
 * @plugindesc ローグライク：ダンジョン生成アルゴリズム
 * @author F_
 *
 * @help
 * ダンジョン生成アルゴリズムの実装。
 *
 * Copyright (c) 2016 F_
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */
System.register(['Roguelike'], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var Roguelike_1;
    var plugin, MinHallSize, MinLabyrinthSize, MinRegionSize, MinRoomSize, MinPathSize, MaxPathSize, DefaultDungeonAlgorithm, LabyrinthGenerator;
    function isBranch(node) {
        return node.children !== void 0;
    }
    return {
        setters:[
            function (Roguelike_1_1) {
                Roguelike_1 = Roguelike_1_1;
            }],
        execute: function() {
            plugin = MVPlugin.get(__moduleName);
            MinHallSize = 3;
            MinLabyrinthSize = 16;
            MinRegionSize = 6;
            MinRoomSize = 4;
            MinPathSize = 3;
            MaxPathSize = 5;
            DefaultDungeonAlgorithm = (function () {
                function DefaultDungeonAlgorithm() {
                }
                DefaultDungeonAlgorithm.prototype.create = function (config, random) {
                    var width = config.width;
                    var height = config.height;
                    var min = Math.min(width, height);
                    if (min < MinHallSize) {
                        return this.createSpace(width, height);
                    }
                    else if (min < MinLabyrinthSize) {
                        return this.createHall(width, height);
                    }
                    else {
                        return this.createLabyrinth(width, height, random);
                    }
                };
                DefaultDungeonAlgorithm.prototype.createSpace = function (width, height) {
                    var map = new Roguelike_1.Map(width, height);
                    var cells = map.cells;
                    for (var i = 0, length_1 = cells.length; i < length_1; i++) {
                        cells[i].type = Roguelike_1.CellType.Floor;
                    }
                    var room = new Roguelike_1.Room(0, 0, width, height);
                    map.rooms.push(room);
                    return map;
                };
                DefaultDungeonAlgorithm.prototype.createHall = function (width, height) {
                    var map = new Roguelike_1.Map(width, height);
                    var cells = map.cells;
                    for (var y = 1, endY = height - 1; y < endY; y++) {
                        for (var x = 1, endX = width - 1; x < endX; x++) {
                            cells[x + y * width].type = Roguelike_1.CellType.Floor;
                        }
                    }
                    var room = new Roguelike_1.Room(1, 1, width - 2, height - 2);
                    map.rooms.push(room);
                    return map;
                };
                DefaultDungeonAlgorithm.prototype.createLabyrinth = function (width, height, random) {
                    var map = new Roguelike_1.Map(width, height);
                    var generator = new LabyrinthGenerator(map, random);
                    generator.generate();
                    return map;
                };
                DefaultDungeonAlgorithm = __decorate([
                    plugin.type
                ], DefaultDungeonAlgorithm);
                return DefaultDungeonAlgorithm;
            }());
            exports_1("DefaultDungeonAlgorithm", DefaultDungeonAlgorithm);
            LabyrinthGenerator = (function () {
                function LabyrinthGenerator(map, random) {
                    this.map = map;
                    this.random = random;
                }
                LabyrinthGenerator.prototype.generate = function () {
                    var node = { x: 1, y: 1, width: this.map.width - 2, height: this.map.height - 2 };
                    this.splitRegion(node);
                    this.createMap(node);
                };
                LabyrinthGenerator.prototype.splitRegion = function (node) {
                    var horizontal = node.parent ? !node.parent.splitter.horizontal : !!this.random.next(2);
                    if (horizontal) {
                        var space = node.height - MinRegionSize * 2 - MinPathSize;
                        if (space >= 0) {
                            var pathSpace = this.random.next(Math.min(MaxPathSize - MinPathSize, space) + 1);
                            var region1Space = this.random.next(space - pathSpace + 1);
                            var region2Space = space - (pathSpace + region1Space);
                            var region1Size = MinRegionSize + region1Space;
                            var region2Size = MinRegionSize + region2Space;
                            var pathSize = MinPathSize + pathSpace;
                            var position = region1Size + 1 + this.random.next(pathSize - 2);
                            node.splitter = { horizontal: true, position: node.y + position };
                            node.children = [
                                {
                                    parent: node,
                                    x: node.x,
                                    y: node.y,
                                    width: node.width,
                                    height: region1Size,
                                },
                                {
                                    parent: node,
                                    x: node.x,
                                    y: node.y + region1Size + pathSize,
                                    width: node.width,
                                    height: region2Size,
                                },
                            ];
                            this.splitRegion(node.children[0]);
                            this.splitRegion(node.children[1]);
                            return;
                        }
                    }
                    else {
                        var space = node.width - MinRegionSize * 2 - MinPathSize;
                        if (space >= 0) {
                            var pathSpace = this.random.next(Math.min(MaxPathSize - MinPathSize, space) + 1);
                            var region1Space = this.random.next(space - pathSpace + 1);
                            var region2Space = space - (pathSpace + region1Space);
                            var region1Size = MinRegionSize + region1Space;
                            var region2Size = MinRegionSize + region2Space;
                            var pathSize = MinPathSize + pathSpace;
                            var position = region1Size + 1 + this.random.next(pathSize - 2);
                            node.splitter = { horizontal: false, position: node.x + position };
                            node.children = [
                                {
                                    parent: node,
                                    x: node.x,
                                    y: node.y,
                                    width: region1Size,
                                    height: node.height,
                                },
                                {
                                    parent: node,
                                    x: node.x + region1Size + pathSize,
                                    y: node.y,
                                    width: region2Size,
                                    height: node.height,
                                },
                            ];
                            this.splitRegion(node.children[0]);
                            this.splitRegion(node.children[1]);
                            return;
                        }
                    }
                    this.setRoom(node);
                };
                LabyrinthGenerator.prototype.setRoom = function (node) {
                    var xrange = Math.max(0, node.width - (MinRoomSize + 2));
                    var yrange = Math.max(0, node.height - (MinRoomSize + 2));
                    var xsize = this.random.next(xrange + 1);
                    var ysize = this.random.next(yrange + 1);
                    var x = node.x + 1 + this.random.next(xrange - xsize + 1);
                    var y = node.y + 1 + this.random.next(yrange - ysize + 1);
                    var width = MinRoomSize + xsize;
                    var height = MinRoomSize + ysize;
                    var entry;
                    if (node.parent.splitter.horizontal) {
                        entry = x + this.random.next(width);
                    }
                    else {
                        entry = y + this.random.next(height);
                    }
                    node.room = { x: x, y: y, width: width, height: height, entry: entry };
                };
                LabyrinthGenerator.prototype.createMap = function (node) {
                    var map = this.map;
                    var cells = map.cells;
                    var rooms = map.rooms;
                    var stack = [node];
                    while (stack.length !== 0) {
                        var current = stack.pop();
                        if (isBranch(current)) {
                            var splitter = current.splitter;
                            var path = current.children.concat(current.parent).reduce(function (result, value) {
                                if (value) {
                                    var position = (value.children ? value.splitter.position : value.room.entry);
                                    result.min = Math.min(result.min, position);
                                    result.max = Math.max(result.max, position);
                                }
                                return result;
                            }, { min: -1 >>> 0, max: 0 });
                            if (splitter.horizontal) {
                                var y = splitter.position;
                                for (var x = path.min, endX = path.max + 1; x < endX; x++) {
                                    cells[x + y * map.width].type = Roguelike_1.CellType.Floor;
                                }
                                var above = current.children[0];
                                if (above.room) {
                                    var x = above.room.entry;
                                    var startY = above.room.y + above.room.height;
                                    for (var y_1 = startY, endY = splitter.position; y_1 < endY; y_1++) {
                                        cells[x + y_1 * map.width].type = Roguelike_1.CellType.Floor;
                                    }
                                }
                                var below = current.children[1];
                                if (below.room) {
                                    var x = below.room.entry;
                                    var startY = below.room.y - 1;
                                    for (var y_2 = startY, endY = splitter.position; y_2 > endY; y_2--) {
                                        cells[x + y_2 * map.width].type = Roguelike_1.CellType.Floor;
                                    }
                                }
                            }
                            else {
                                var x = splitter.position;
                                for (var y = path.min, endY = path.max + 1; y < endY; y++) {
                                    cells[x + y * map.width].type = Roguelike_1.CellType.Floor;
                                }
                                var left = current.children[0];
                                if (left.room) {
                                    var y = left.room.entry;
                                    var startX = left.room.x + left.room.width;
                                    for (var x_1 = startX, endX = splitter.position; x_1 < endX; x_1++) {
                                        cells[x_1 + y * map.width].type = Roguelike_1.CellType.Floor;
                                    }
                                }
                                var right = current.children[1];
                                if (right.room) {
                                    var y = right.room.entry;
                                    var startX = right.room.x - 1;
                                    for (var x_2 = startX, endX = splitter.position; x_2 > endX; x_2--) {
                                        cells[x_2 + y * map.width].type = Roguelike_1.CellType.Floor;
                                    }
                                }
                            }
                            current.children.forEach(function (child) { stack.push(child); });
                        }
                        else if (current.room) {
                            var room = current.room;
                            var roomModel = new Roguelike_1.Room(room.x, room.y, room.width, room.height);
                            for (var y = room.y, endY = room.y + room.height; y < endY; y++) {
                                for (var x = room.x, endX = room.x + room.width; x < endX; x++) {
                                    cells[x + y * map.width].type = Roguelike_1.CellType.Floor;
                                }
                            }
                            rooms.push(roomModel);
                        }
                    }
                };
                return LabyrinthGenerator;
            }());
            Roguelike_1.DefaultDungeonAlgorithmProvider.default = new DefaultDungeonAlgorithm();
        }
    }
});
