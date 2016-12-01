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

import { Service, MapDesign, Floor, Map, Cell, CellType, DungeonMapArranger } from 'Roguelike';

let plugin = MVPlugin.get(__moduleName);

plugin.type;
export class DefaultDungeonMapArranger implements DungeonMapArranger {
	public arrange(floor: Floor): MV.Map {
		let design = floor.spec.map.design;
		let adjacencies = this.createAdjacencyTable(floor.map);
		let tiles = this.createLayeredTileTable(floor.map, adjacencies, design);

		let map = this.newMap(design.baseMap);
		this.setMapData(map, tiles);

		return map;
	}

	private createAdjacencyTable(map: Map): number[] {
		let cells = map.cells;

		let table = new Array(map.width * map.height);
		for (let y = 0, height = map.height; y < height; y++) {
			for (let x = 0, width = map.width; x < width; x++) {
				let index = x + y * width;
				let type = cells[index].type;

				let l = (x === 0);
				let r = (x === width - 1);
				let t = (y === 0);
				let b = (y === height - 1);

				let field = 0;
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
	}

	private createLayeredTileTable(map: Map, adjacencies: number[], design: MapDesign): number[][] {
		let table = new Array(map.width * map.height);
		map.cells.forEach(function (this: DefaultDungeonMapArranger, cell: Cell, index: number) {
			let tileLayers: number[];
			if (cell.type === CellType.Floor) {
				tileLayers = design.floorTiles;
			} else if (cell.type === CellType.Wall) {
				tileLayers = design.wallTiles;
			} else {
				throw new Error(System.ErrorMessages.NOT_SUPPORTED);
			}

			table[index] = this.processAutotile(tileLayers, adjacencies[index]);
		}, this);

		return table;
	}

	private processAutotile(tileLayers: number[], field: number): number[] {
		return tileLayers.map(function (tileId) {
			return TilesetHelper.getActualTileId(tileId, field);
		});
	}

	private newMap(baseMap: MV.Map): MV.Map {
		let map = JSON.parse(JSON.stringify(baseMap));
		map.data = new Array(map.width * map.height * 6);
		map.events = [null];

		return map;
	}

	private setMapData(map: MV.Map, tiles: number[][]): void {
		let size = map.width * map.height;
		for (let y = 0, height = map.height; y < height; y++) {
			for (let x = 0, width = map.width; x < width; x++) {
				let index = x + y * width;
				let tileLayers = tiles[index];
				map.data[index + size * 0] = tileLayers[0];
				map.data[index + size * 1] = tileLayers[1];
				map.data[index + size * 2] = tileLayers[2];
				map.data[index + size * 3] = tileLayers[3];
				map.data[index + size * 4] = tileLayers[4];
				map.data[index + size * 5] = tileLayers[5];
			}
		}
	}
}

plugin.type
export class TilesetHelper {
	private constructor() { throw new Error(System.ErrorMessages.NEW_STATIC_CLASS); }

	private static readonly FLOOR_AUTOTILE_SHAPE_TABLE: ReadonlyArray<number> = [
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

	public static getActualTileId(tileId: number, field: number): number {
		let baseTileID = this.getBaseTileId(tileId);
		let shape = this.getShape(tileId, field);

		return baseTileID + shape;
	}

	public static getBaseTileId(tileId: number): number {
		if (Tilemap.isAutotile(tileId)) {
			return (tileId - Tilemap.getAutotileShape(tileId));
		} else {
			return tileId;
		}
	}

	public static getShape(tileId: number, field: number): number {
		if (Tilemap.isAutotile(tileId)) {
			if (Tilemap.isTileA1(tileId)) {
				let kind = Tilemap.getAutotileKind(tileId);
				if (kind < 4 || kind % 2 === 0) {
					return this.getFloorShape(field);
				} else {
					return this.getWaterfallShape(field);
				}
			} else if (Tilemap.isTileA2(tileId)) {
				return this.getFloorShape(field);
			} else if (Tilemap.isTileA3(tileId)) {
				return this.getWallShape(field);
			} else if (Tilemap.isTileA4(tileId)) {
				let kind = Tilemap.getAutotileKind(tileId);
				if ((kind & 0x08) === 0) {
					return this.getFloorShape(field);
				} else {
					return this.getWallShape(field);
				}
			}
		}

		return 0;
	}

	public static getFloorShape(field: number): number {
		let index = (field & 0x0f) | ((field >>> 1) & 0xf0);

		return this.FLOOR_AUTOTILE_SHAPE_TABLE[index];
	}

	public static getWallShape(field: number): number {
		let shape = 0;

		if ((field & 0x08) === 0) shape |= 0x01;
		if ((field & 0x80) === 0) shape |= 0x02;
		if ((field & 0x20) === 0) shape |= 0x04;
		if ((field & 0x02) === 0) shape |= 0x08;

		return shape;
	}

	public static getWaterfallShape(field: number): number {
		let shape = 0;

		if ((field & 0x08) === 0) shape |= 0x01;
		if ((field & 0x20) === 0) shape |= 0x02;

		return shape;
	}
}

Service.add(DungeonMapArranger, new DefaultDungeonMapArranger());