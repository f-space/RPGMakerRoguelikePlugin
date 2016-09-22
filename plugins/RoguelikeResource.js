/*:
 * @plugindesc ローグライク：リソース管理
 * @author F_
 * 
 * @param FloorTag
 * @desc 床に対応する地形タグ
 * @default 1
 * 
 * @param WallTag
 * @desc 壁に対応する地形タグ
 * @default 2
 * 
 * @help
 * エディタによるリソースの指定を解釈してオブジェクトへと変換するクラスの実装。
 * 
 * Copyright (c) 2016 F_
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */

PluginSystem.require('Roguelike');
PluginSystem.require('RoguelikeLayout');

PluginSystem.validate(function (params) {
	return Object.create(Object.prototype, {
		floorTag: { value: parseInt(params.FloorTag) & 0x07 },
		wallTag: { value: parseInt(params.WallTag) & 0x07 },
	});
})

PluginSystem.ns('auto', function (scope, params) {
	scope.extract('Roguelike.Layout');

	this.define('TilePicker', function () {
		function TilePicker() {
			this.initialize.apply(this, arguments);
		}

		TilePicker.prototype = Object.create(scope.LayoutTilesetProvider.prototype);
		TilePicker.prototype.constructor = TilePicker;

		TilePicker.prototype.initialize = function () { };

		TilePicker.prototype.getTileset = function (dataMap) {
			var tileset = $dataTilesets[dataMap.tilesetId];
			var tiles = findTerrainTiles(tileset);
			var floorTiles = tiles[params.floorTag];
			var wallTiles = tiles[params.wallTag];

			var floor = ((floorTiles && floorTiles[0]) || this.defaultFloor);
			var wall = ((wallTiles && wallTiles[0]) || this.defaultWall);

			return new scope.LayoutTileset(floor, wall);
		}

		function findTerrainTiles(tileset) {
			var tiles = [null, [], [], [], [], [], [], []];
			for (var i = 0, length = tileset.flags.length; i < length; i++) {
				var tag = tileset.flags[i] >>> 12;
				if (tag !== 0) {
					tiles[tag].push(i);
				}
			}

			return tiles;
		}

		return TilePicker;
	});

	scope.LayoutTilesetProvider.instance = new scope.TilePicker();
});