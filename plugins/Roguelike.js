/*:
 * @plugindesc ローグライク：共通モデル
 * @author F_
 * 
 * @help
 * ローグライクプラグインで使用する共通モデルの定義。
 * 
 * このプラグインをONにしていないと、
 * すべてのローグライクプラグインは動作しない可能性があるため注意。
 * 
 * Copyright (c) 2016 F_
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */

PluginSystem.ns('auto', function (scope) {
	this.define('CellState', function () {
		return Object.create(Object.prototype, {
			Floor: { value: {}, enumerable: true },
			Wall: { value: {}, enumerable: true },
		});
	});

	this.define('Cell', function () {
		function Cell() {
			this.initialize.apply(this, arguments);
		}

		Cell.prototype.initialize = function (map, x, y) {
			var state = scope.CellState.Wall;
			Object.defineProperties(this, {
				map: { value: map },
				x: { value: x },
				y: { value: y },
				state: {
					get: function () { return state; },
					set: function (value) { state = value; }
				},
				index: {
					get: function () { return (x + map.width * y); }
				},
				getDataIndex: {
					value: function (z) {
						return (x + map.width * (y + map.height * (z || 0)));
					}
				}
			});
		}

		return Cell;
	});

	this.define('Room', function () {
		function Room() {
			this.initialize.apply(this, arguments);
		}

		Room.prototype.initialize = function (x, y, width, height) {
			Object.defineProperties(this, {
				x: { value: x },
				y: { value: y },
				width: { value: width },
				height: { value: height },
				minX: { get: function () { return this.x; } },
				maxX: { get: function () { return this.x + this.width; } },
				minY: { get: function () { return this.y; } },
				maxY: { get: function () { return this.y + this.height } },
			});
		}

		return Room;
	});

	this.define('Map', function () {
		function Map() {
			this.initialize.apply(this, arguments);
		}

		Map.prototype.initialize = function (width, height) {
			var cells = createCells.call(this, width, height);
			Object.defineProperties(this, {
				width: { value: width },
				height: { value: height },
				cells: { value: cells },
				rooms: { value: [] },
			});
		}

		function createCells(width, height) {
			var cells = new Array(width * height);
			for (var y = 0; y < height; y++) {
				for (var x = 0; x < width; x++) {
					cells[x + y * width] = new scope.Cell(this, x, y);
				}
			}

			Object.freeze(cells);

			return cells;
		}

		return Map;
	});

	this.define('Dungeon', function () {
		function Dungeon() {
			this.initialize.apply(this, arguments);
		}

		Dungeon.prototype.initialize = function (algorithm, width, height) {
			var map = new scope.Map(width, height);
			Object.defineProperties(this, {
				algorithm: { value: algorithm },
				map: { value: map },
				width: { get: function () { return map.width } },
				height: { get: function () { return map.height } },
			});
		}

		Dungeon.create = function (width, height, algorithm, seed) {
			if (!algorithm || !algorithm.create) {
				if (Object.prototype.toString.apply(algorithm) === '[object String]') {
					algorithm = this.getAlgorithm(algorithm);
				}
				if (!algorithm || !algorithm.create) {
					algorithm = this.getAlgorithm('default');
				}
			}

			var random = new scope.Random(seed || Graphics.frameCount);
			var dungeon = algorithm.create(width, height, random);
			Object.defineProperty(dungeon, 'algorithm', { value: algorithm });

			return dungeon;
		}

		return Dungeon;
	});

	this.define('DungeonAlgorithm', function () {
		function DungeonAlgorithm() {
			this.initialize.apply(this, arguments);
		}

		var algorithms = {};

		DungeonAlgorithm.prototype.initialize = function () { }

		DungeonAlgorithm.prototype.create = function (width, height, seed, arguments) {
			return new scope.Dungeon(this, width, height);
		}

		DungeonAlgorithm.get = function (name) {
			return algorithms[name] || new DungeonAlgorithm();
		}

		DungeonAlgorithm.set = function (name, algorithm) {
			Object.defineProperty(algorithms, name, { value: algorithm });
		}

		return DungeonAlgorithm;
	});

	this.define('Random', function () {
		function Random() {
			this.initialize.apply(this, arguments);
		}

		Random.prototype.initialize = function (seed) {
			var x = (seed >>> 0) || 1;
			Object.defineProperties(this, {
				seed: { value: x },
				value: {
					get: function () { return x; },
					set: function (value) { x = value >>> 0; },
				},
			});
		}

		Random.prototype.next = function (max) {
			this.value = xorshift32(this.value);

			return (max == null ? this.value : (this.value % ((max >>> 0) || 1)));
		}

		Random.prototype.next01 = function () {
			this.value = xorshift32(this.value);

			return (this.value / (-1 >>> 0));
		}

		function xorshift32(x) {
			x = x ^ (x << 13);
			x = x ^ (x >>> 17);
			x = x ^ (x << 15);
			return x;
		}

		return Random;
	});
});
