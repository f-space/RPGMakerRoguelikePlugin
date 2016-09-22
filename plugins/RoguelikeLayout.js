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

PluginSystem.require('Roguelike');

PluginSystem.ns('auto', function (scope) {
	scope.extract('Roguelike');

	this.define('MapGenerator', function () {
		function MapGenerator() {
			this.initialize.apply(this, arguments);
		}

		MapGenerator.prototype.initialize = function () { }

		MapGenerator.prototype.generate = function (dataMap, dungeon) {
			var tilesetProvider = scope.LayoutTilesetProvider.instance;
			var tileset = tilesetProvider.getTileset(dataMap);

			var map = JsonEx.makeDeepCopy(dataMap);
			map.data = new Array(map.width * map.height * 5);
			map.events = [];

			var tileIds = createTileIdTable(tileset, dungeon.map);
			arrangeAutotile(tileIds, dungeon.map);

			var cells = dungeon.map.cells;
			cells.forEach(function (cell, index) {
				map.data[cell.getDataIndex(0)] = tileIds[index];
				map.data[cell.getDataIndex(1)] = 0;
				map.data[cell.getDataIndex(2)] = 0;
				map.data[cell.getDataIndex(3)] = 0;
				map.data[cell.getDataIndex(4)] = 0;
			});

			return map;
		}

		function createTileIdTable(tileset, map) {
			var tileIds = new Array(map.width * map.height);
			map.cells.forEach(function (cell, index) {
				var tileId;
				if (cell.state === scope.CellState.Floor) {
					tileId = tileset.floor;
				} else if (cell.state === scope.CellState.Wall) {
					tileId = tileset.wall;
				}

				tileIds[index] = tileId;
			});

			return tileIds;
		}

		function arrangeAutotile(tileIds, map) {
			var source = tileIds.slice();
			for (var y = 0, height = map.height; y < height; y++) {
				for (var x = 0, width = map.width; x < width; x++) {
					var index = x + y * width;
					var tileId = source[index];

					var l = (x === 0);
					var r = (x === width - 1);
					var t = (y === 0);
					var b = (y === height - 1);

					var field = 0;
					field |= (!l && !b && tileId !== source[(x - 1) + (y + 1) * width]) << 0;
					field |= (!b && !b && tileId !== source[(x + 0) + (y + 1) * width]) << 1;
					field |= (!r && !b && tileId !== source[(x + 1) + (y + 1) * width]) << 2;
					field |= (!l && !l && tileId !== source[(x - 1) + (y + 0) * width]) << 3;
					field |= (!r && !r && tileId !== source[(x + 1) + (y + 0) * width]) << 5;
					field |= (!l && !t && tileId !== source[(x - 1) + (y - 1) * width]) << 6;
					field |= (!b && !t && tileId !== source[(x + 0) + (y - 1) * width]) << 7;
					field |= (!r && !t && tileId !== source[(x + 1) + (y - 1) * width]) << 8;

					tileIds[index] = scope.TilesetHelper.getActualTileId(tileId, field);
				}
			}
		}

		return MapGenerator;
	});

	this.define('LayoutTileset', function () {
		function LayoutTileset() {
			this.initialize.apply(this, arguments);
		}

		LayoutTileset.prototype.initialize = function (floor, wall) {
			Object.defineProperties(this, {
				floor: { value: scope.TilesetHelper.getBaseTileId(floor) },
				wall: { value: scope.TilesetHelper.getBaseTileId(wall) },
			});
		}

		return LayoutTileset;
	});

	this.define('LayoutTilesetProvider', function () {
		function LayoutTilesetProvider() { }

		var defaultFloor = Tilemap.TILE_ID_A2;
		var defaultWall = Tilemap.TILE_ID_A1;

		var instance = null;

		LayoutTilesetProvider.prototype.getTileset = function (dataMap) {
			return new ns.LayoutTileset(defaultFloor, defaultWall);
		}

		Object.defineProperties(LayoutTilesetProvider.prototype, {
			defaultFloor: { value: defaultFloor },
			defaultWall: { value: defaultWall },
		});

		Object.defineProperty(LayoutTilesetProvider, 'instance', {
			get: function () { return (instance || (instance = new LayoutTilesetProvider())); },
			set: function (value) { instance = value; }
		});

		return LayoutTilesetProvider;
	});

	this.define('TilesetHelper', function () {

		function getActualTileId(tileId, field) {
			var baseTileID = getBaseTileId(tileId);
			var shape = getShape(tileId, field);

			return baseTileID + shape;
		}

		function getBaseTileId(tileId) {
			if (Tilemap.isAutotile(tileId)) {
				return (tileId - Tilemap.getAutotileShape(tileId));
			} else {
				return tileId;
			}
		}

		function getShape(tileId, field) {
			if (Tilemap.isAutotile(tileId)) {
				if (Tilemap.isTileA1(tileId)) {
					var kind = Tilemap.getAutotileKind(tileId);
					if (kind < 4 || kind % 2 === 0) {
						return getFloorShape(field);
					} else {
						return getWaterfallShape(field);
					}
				} else if (Tilemap.isTileA2(tileId)) {
					return getFloorShape(field);
				} else if (Tilemap.isTileA3(tileId)) {
					return getWallShape(field);
				} else if (Tilemap.isTileA4(tileId)) {
					var kind = Tilemap.getAutotileKind(tileId);
					if ((kind & 0x08) === 0) {
						return getFloorShape(field);
					} else {
						return getWallShape(field);
					}
				}
			}

			return 0;
		}

		function getFloorShape(field) {
			var index = (field & 0x0f) | ((field >>> 1) & 0xf0);

			return FloorAutotileShapeTable[index];

			// var d4 = (~field >>> 1) & 0x55;
			// d4 = (d4 + (d4 >>> 2)) & 0x33;
			// d4 = (d4 + (d4 >>> 4)) & 0x0f;

			// switch (d4) {
			// 	case 4:
			// 		var n = 0;
			// 		if ((field & 0x40) !== 0) n += 1;
			// 		if ((field & 0x100) !== 0) n += 2;
			// 		if ((field & 0x04) !== 0) n += 4;
			// 		if ((field & 0x01) !== 0) n += 8;
			// 		return n;
			// 	case 3:
			// 		if ((field & 0x08) !== 0) {
			// 			var n = 0;
			// 			if ((field & 0x100) !== 0) n += 1;
			// 			if ((field & 0x04) !== 0) n += 2;
			// 			return 16 + n;
			// 		}
			// 		if ((field & 0x80) !== 0) {
			// 			var n = 0;
			// 			if ((field & 0x04) !== 0) n += 1;
			// 			if ((field & 0x01) !== 0) n += 2;
			// 			return 20 + n;
			// 		}
			// 		if ((field & 0x20) !== 0) {
			// 			var n = 0;
			// 			if ((field & 0x01) !== 0) n += 1;
			// 			if ((field & 0x40) !== 0) n += 2;
			// 			return 24 + n;
			// 		}
			// 		if ((field & 0x02) !== 0) {
			// 			var n = 0;
			// 			if ((field & 0x40) !== 0) n += 1;
			// 			if ((field & 0x100) !== 0) n += 2;
			// 			return 28 + n;
			// 		}
			// 		break;
			// 	case 2:
			// 		if ((field & 0x28) === 0x28) return 32;
			// 		if ((field & 0x82) === 0x82) return 33;
			// 		if ((field & 0x88) === 0x88) {
			// 			if ((field & 0x04) === 0) return 34;
			// 			else return 35;
			// 		}
			// 		if ((field & 0xa0) === 0xa0) {
			// 			if ((field & 0x01) === 0) return 36;
			// 			else return 37;
			// 		}
			// 		if ((field & 0x22) === 0x22) {
			// 			if ((field & 0x40) === 0) return 38;
			// 			else return 39;
			// 		}
			// 		if ((field & 0x0a) === 0x0a) {
			// 			if ((field & 0x100) === 0) return 40;
			// 			else return 41;
			// 		}
			// 		break;
			// 	case 1:
			// 		if ((field & 0x02) === 0) return 42;
			// 		if ((field & 0x20) === 0) return 43;
			// 		if ((field & 0x80) === 0) return 44;
			// 		if ((field & 0x08) === 0) return 45;
			// 		break;
			// 	case 0: return 47;
			// }
		}

		function getWallShape(field) {
			var shape = 0;

			if ((field & 0x08) === 0) shape |= 0x01;
			if ((field & 0x80) === 0) shape |= 0x02;
			if ((field & 0x20) === 0) shape |= 0x04;
			if ((field & 0x02) === 0) shape |= 0x08;

			return shape;
		}

		function getWaterfallShape(field) {
			var shape = 0;

			if ((field & 0x08) === 0) shape |= 0x01;
			if ((field & 0x20) === 0) shape |= 0x02;

			return shape;
		}

		var FloorAutotileShapeTable = [
			00, 08, 28, 28, 04, 12, 28, 28, 16, 16, 40, 40, 18, 18, 40, 40,
			24, 25, 38, 38, 24, 25, 38, 38, 32, 32, 44, 44, 32, 32, 44, 44,
			01, 09, 29, 29, 05, 13, 29, 29, 16, 16, 40, 40, 18, 18, 40, 40,
			26, 27, 39, 39, 26, 27, 39, 39, 32, 32, 44, 44, 32, 32, 44, 44,
			20, 22, 33, 33, 21, 23, 33, 33, 34, 34, 43, 43, 35, 35, 43, 43,
			36, 37, 45, 45, 36, 37, 45, 45, 42, 42, 47, 47, 42, 42, 47, 47,
			20, 22, 33, 33, 21, 23, 33, 33, 34, 34, 43, 43, 35, 35, 43, 43,
			36, 37, 45, 45, 36, 37, 45, 45, 42, 42, 47, 47, 42, 42, 47, 47,
			02, 10, 30, 30, 06, 14, 30, 30, 17, 17, 41, 41, 19, 19, 41, 41,
			24, 25, 38, 38, 24, 25, 38, 38, 32, 32, 44, 44, 32, 32, 44, 44,
			03, 11, 31, 31, 07, 15, 31, 31, 17, 17, 41, 41, 19, 19, 41, 41,
			26, 27, 39, 39, 26, 27, 39, 39, 32, 32, 44, 44, 32, 32, 44, 44,
			20, 22, 33, 33, 21, 23, 33, 33, 34, 34, 43, 43, 35, 35, 43, 43,
			36, 37, 45, 45, 36, 37, 45, 45, 42, 42, 47, 47, 42, 42, 47, 47,
			20, 22, 33, 33, 21, 23, 33, 33, 34, 34, 43, 43, 35, 35, 43, 43,
			36, 37, 45, 45, 36, 37, 45, 45, 42, 42, 47, 47, 42, 42, 47, 47,
		];

		return Object.create(Object.prototype, {
			getActualTileId: { value: getActualTileId },
			getBaseTileId: { value: getBaseTileId },
			getShape: { value: getShape },
		});
	});

});