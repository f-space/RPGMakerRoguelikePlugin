/*!
/*:
 * @plugindesc ローグライク：マップ生成
 * @author F_
 *
 * @help
 * ローグライクなマップ生成のためのプラグイン。
 *
 * ダンジョンを生成するためのものではなく、
 * 生成されたダンジョンモデルを基にマップチップを配置していくためのもの。
 *
 * Copyright (c) 2016 F_
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */
System.register(['Roguelike'], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var Roguelike_1;
    var plugin, DefaultDungeonMapArranger, TilesetHelper;
    return {
        setters:[
            function (Roguelike_1_1) {
                Roguelike_1 = Roguelike_1_1;
            }],
        execute: function() {
            plugin = MVPlugin.get(__moduleName);
            plugin.type;
            DefaultDungeonMapArranger = (function () {
                function DefaultDungeonMapArranger() {
                }
                DefaultDungeonMapArranger.prototype.arrange = function (floor) {
                    var design = floor.spec.map.design;
                    var adjacencies = this.createAdjacencyTable(floor.map);
                    var tiles = this.createLayeredTileTable(floor.map, adjacencies, design);
                    var map = this.newMap(design.baseMap);
                    this.setMapData(map, tiles);
                    return map;
                };
                DefaultDungeonMapArranger.prototype.createAdjacencyTable = function (map) {
                    var cells = map.cells;
                    var table = new Array(map.width * map.height);
                    for (var y = 0, height = map.height; y < height; y++) {
                        for (var x = 0, width = map.width; x < width; x++) {
                            var index = x + y * width;
                            var type = cells[index].type;
                            var l = (x === 0);
                            var r = (x === width - 1);
                            var t = (y === 0);
                            var b = (y === height - 1);
                            var field = 0;
                            field |= +(!l && !b && type !== cells[(x - 1) + (y + 1) * width].type) << 0;
                            field |= +(!b && !b && type !== cells[(x + 0) + (y + 1) * width].type) << 1;
                            field |= +(!r && !b && type !== cells[(x + 1) + (y + 1) * width].type) << 2;
                            field |= +(!l && !l && type !== cells[(x - 1) + (y + 0) * width].type) << 3;
                            field |= +(!r && !r && type !== cells[(x + 1) + (y + 0) * width].type) << 5;
                            field |= +(!l && !t && type !== cells[(x - 1) + (y - 1) * width].type) << 6;
                            field |= +(!b && !t && type !== cells[(x + 0) + (y - 1) * width].type) << 7;
                            field |= +(!r && !t && type !== cells[(x + 1) + (y - 1) * width].type) << 8;
                            table[index] = field;
                        }
                    }
                    return table;
                };
                DefaultDungeonMapArranger.prototype.createLayeredTileTable = function (map, adjacencies, design) {
                    var table = new Array(map.width * map.height);
                    map.cells.forEach(function (cell, index) {
                        var tileLayers;
                        if (cell.type === Roguelike_1.CellType.Floor) {
                            tileLayers = design.floorTiles;
                        }
                        else if (cell.type === Roguelike_1.CellType.Wall) {
                            tileLayers = design.wallTiles;
                        }
                        else {
                            throw new Error(System.ErrorMessages.NOT_SUPPORTED);
                        }
                        table[index] = this.processAutotile(tileLayers, adjacencies[index]);
                    }, this);
                    return table;
                };
                DefaultDungeonMapArranger.prototype.processAutotile = function (tileLayers, field) {
                    return tileLayers.map(function (tileId) {
                        return TilesetHelper.getActualTileId(tileId, field);
                    });
                };
                DefaultDungeonMapArranger.prototype.newMap = function (baseMap) {
                    var map = JSON.parse(JSON.stringify(baseMap));
                    map.data = new Array(map.width * map.height * 6);
                    map.events = [null];
                    return map;
                };
                DefaultDungeonMapArranger.prototype.setMapData = function (map, tiles) {
                    var size = map.width * map.height;
                    for (var y = 0, height = map.height; y < height; y++) {
                        for (var x = 0, width = map.width; x < width; x++) {
                            var index = x + y * width;
                            var tileLayers = tiles[index];
                            map.data[index + size * 0] = tileLayers[0];
                            map.data[index + size * 1] = tileLayers[1];
                            map.data[index + size * 2] = tileLayers[2];
                            map.data[index + size * 3] = tileLayers[3];
                            map.data[index + size * 4] = tileLayers[4];
                            map.data[index + size * 5] = tileLayers[5];
                        }
                    }
                };
                return DefaultDungeonMapArranger;
            }());
            exports_1("DefaultDungeonMapArranger", DefaultDungeonMapArranger);
            plugin.type;
            TilesetHelper = (function () {
                function TilesetHelper() {
                    throw new Error(System.ErrorMessages.NEW_STATIC_CLASS);
                }
                TilesetHelper.getActualTileId = function (tileId, field) {
                    var baseTileID = this.getBaseTileId(tileId);
                    var shape = this.getShape(tileId, field);
                    return baseTileID + shape;
                };
                TilesetHelper.getBaseTileId = function (tileId) {
                    if (Tilemap.isAutotile(tileId)) {
                        return (tileId - Tilemap.getAutotileShape(tileId));
                    }
                    else {
                        return tileId;
                    }
                };
                TilesetHelper.getShape = function (tileId, field) {
                    if (Tilemap.isAutotile(tileId)) {
                        if (Tilemap.isTileA1(tileId)) {
                            var kind = Tilemap.getAutotileKind(tileId);
                            if (kind < 4 || kind % 2 === 0) {
                                return this.getFloorShape(field);
                            }
                            else {
                                return this.getWaterfallShape(field);
                            }
                        }
                        else if (Tilemap.isTileA2(tileId)) {
                            return this.getFloorShape(field);
                        }
                        else if (Tilemap.isTileA3(tileId)) {
                            return this.getWallShape(field);
                        }
                        else if (Tilemap.isTileA4(tileId)) {
                            var kind = Tilemap.getAutotileKind(tileId);
                            if ((kind & 0x08) === 0) {
                                return this.getFloorShape(field);
                            }
                            else {
                                return this.getWallShape(field);
                            }
                        }
                    }
                    return 0;
                };
                TilesetHelper.getFloorShape = function (field) {
                    var index = (field & 0x0f) | ((field >>> 1) & 0xf0);
                    return this.FLOOR_AUTOTILE_SHAPE_TABLE[index];
                };
                TilesetHelper.getWallShape = function (field) {
                    var shape = 0;
                    if ((field & 0x08) === 0)
                        shape |= 0x01;
                    if ((field & 0x80) === 0)
                        shape |= 0x02;
                    if ((field & 0x20) === 0)
                        shape |= 0x04;
                    if ((field & 0x02) === 0)
                        shape |= 0x08;
                    return shape;
                };
                TilesetHelper.getWaterfallShape = function (field) {
                    var shape = 0;
                    if ((field & 0x08) === 0)
                        shape |= 0x01;
                    if ((field & 0x20) === 0)
                        shape |= 0x02;
                    return shape;
                };
                TilesetHelper.FLOOR_AUTOTILE_SHAPE_TABLE = [
                    +0, +8, 28, 28, +4, 12, 28, 28, 16, 16, 40, 40, 18, 18, 40, 40,
                    24, 25, 38, 38, 24, 25, 38, 38, 32, 32, 44, 44, 32, 32, 44, 44,
                    +1, +9, 29, 29, +5, 13, 29, 29, 16, 16, 40, 40, 18, 18, 40, 40,
                    26, 27, 39, 39, 26, 27, 39, 39, 32, 32, 44, 44, 32, 32, 44, 44,
                    20, 22, 33, 33, 21, 23, 33, 33, 34, 34, 43, 43, 35, 35, 43, 43,
                    36, 37, 45, 45, 36, 37, 45, 45, 42, 42, 47, 47, 42, 42, 47, 47,
                    20, 22, 33, 33, 21, 23, 33, 33, 34, 34, 43, 43, 35, 35, 43, 43,
                    36, 37, 45, 45, 36, 37, 45, 45, 42, 42, 47, 47, 42, 42, 47, 47,
                    +2, 10, 30, 30, +6, 14, 30, 30, 17, 17, 41, 41, 19, 19, 41, 41,
                    24, 25, 38, 38, 24, 25, 38, 38, 32, 32, 44, 44, 32, 32, 44, 44,
                    +3, 11, 31, 31, +7, 15, 31, 31, 17, 17, 41, 41, 19, 19, 41, 41,
                    26, 27, 39, 39, 26, 27, 39, 39, 32, 32, 44, 44, 32, 32, 44, 44,
                    20, 22, 33, 33, 21, 23, 33, 33, 34, 34, 43, 43, 35, 35, 43, 43,
                    36, 37, 45, 45, 36, 37, 45, 45, 42, 42, 47, 47, 42, 42, 47, 47,
                    20, 22, 33, 33, 21, 23, 33, 33, 34, 34, 43, 43, 35, 35, 43, 43,
                    36, 37, 45, 45, 36, 37, 45, 45, 42, 42, 47, 47, 42, 42, 47, 47,
                ];
                return TilesetHelper;
            }());
            exports_1("TilesetHelper", TilesetHelper);
            Roguelike_1.Service.add(Roguelike_1.DungeonMapArranger, new DefaultDungeonMapArranger());
        }
    }
});
