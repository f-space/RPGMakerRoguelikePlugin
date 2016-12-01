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

import { MapConfig, Map, Room, Cell, CellType, DungeonAlgorithm, DefaultDungeonAlgorithmProvider, Random } from 'Roguelike';

let plugin = MVPlugin.get(__moduleName);

const MinHallSize: number = 3;
const MinLabyrinthSize: number = 16;

const MinRegionSize: number = 6;
const MinRoomSize: number = 4;
const MinPathSize: number = 3;
const MaxPathSize: number = 5;

@plugin.type
export class DefaultDungeonAlgorithm implements DungeonAlgorithm {

	public create(config: MapConfig, random: Random): Map {
		let width = config.width;
		let height = config.height;

		let min = Math.min(width, height);
		if (min < MinHallSize) {
			return this.createSpace(width, height);
		} else if (min < MinLabyrinthSize) {
			return this.createHall(width, height);
		} else {
			return this.createLabyrinth(width, height, random);
		}
	}

	public createSpace(width: number, height: number): Map {
		let map = new Map(width, height);

		let cells = map.cells;
		for (let i = 0, length = cells.length; i < length; i++) {
			cells[i].type = CellType.Floor;
		}

		let room = new Room(0, 0, width, height);
		map.rooms.push(room);

		return map;
	}

	public createHall(width: number, height: number): Map {
		let map = new Map(width, height);

		let cells = map.cells;
		for (let y = 1, endY = height - 1; y < endY; y++) {
			for (let x = 1, endX = width - 1; x < endX; x++) {
				cells[x + y * width].type = CellType.Floor;
			}
		}

		let room = new Room(1, 1, width - 2, height - 2);
		map.rooms.push(room);

		return map;
	}

	public createLabyrinth(width: number, height: number, random: Random): Map {
		let map = new Map(width, height);

		let generator = new LabyrinthGenerator(map, random);
		generator.generate();

		return map;
	}
}

interface Node {
	x: number;
	y: number;
	width: number;
	height: number;
	parent?: Branch;
	children?: [Node, Node];
	splitter?: { horizontal: boolean; position: number; };
	room?: RoomData;
}

interface Branch extends Node {
	children: [Node, Node];
	splitter: { horizontal: boolean; position: number; };
}

interface Leaf extends Node {
	parent: Branch;
	room: RoomData;
}

interface RoomData {
	x: number;
	y: number;
	width: number;
	height: number;
	entry: number;
}

function isBranch(node: Node): node is Branch {
	return node.children !== void 0;
}

class LabyrinthGenerator {
	public constructor(readonly map: Map, readonly random: Random) { }

	public generate(): void {
		let node = { x: 1, y: 1, width: this.map.width - 2, height: this.map.height - 2 };
		this.splitRegion(node);
		this.createMap(node);
	}

	private splitRegion(node: Node): void {
		let horizontal = node.parent ? !node.parent.splitter.horizontal : !!this.random.next(2);
		if (horizontal) {
			let space = node.height - MinRegionSize * 2 - MinPathSize;
			if (space >= 0) {
				let pathSpace = this.random.next(Math.min(MaxPathSize - MinPathSize, space) + 1);
				let region1Space = this.random.next(space - pathSpace + 1);
				let region2Space = space - (pathSpace + region1Space);
				let region1Size = MinRegionSize + region1Space;
				let region2Size = MinRegionSize + region2Space;
				let pathSize = MinPathSize + pathSpace;

				let position = region1Size + 1 + this.random.next(pathSize - 2);
				node.splitter = { horizontal: true, position: node.y + position };
				node.children = [
					{
						parent: <Branch>node,
						x: node.x,
						y: node.y,
						width: node.width,
						height: region1Size,
					},
					{
						parent: <Branch>node,
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
		} else {
			let space = node.width - MinRegionSize * 2 - MinPathSize;
			if (space >= 0) {
				let pathSpace = this.random.next(Math.min(MaxPathSize - MinPathSize, space) + 1);
				let region1Space = this.random.next(space - pathSpace + 1);
				let region2Space = space - (pathSpace + region1Space);
				let region1Size = MinRegionSize + region1Space;
				let region2Size = MinRegionSize + region2Space;
				let pathSize = MinPathSize + pathSpace;

				let position = region1Size + 1 + this.random.next(pathSize - 2);
				node.splitter = { horizontal: false, position: node.x + position };
				node.children = [
					{
						parent: <Branch>node,
						x: node.x,
						y: node.y,
						width: region1Size,
						height: node.height,
					},
					{
						parent: <Branch>node,
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

		this.setRoom(<Leaf>node);
	}

	private setRoom(node: Leaf): void {
		let xrange = Math.max(0, node.width - (MinRoomSize + 2));
		let yrange = Math.max(0, node.height - (MinRoomSize + 2));
		let xsize = this.random.next(xrange + 1);
		let ysize = this.random.next(yrange + 1);
		let x = node.x + 1 + this.random.next(xrange - xsize + 1);
		let y = node.y + 1 + this.random.next(yrange - ysize + 1);
		let width = MinRoomSize + xsize;
		let height = MinRoomSize + ysize;

		let entry: number;
		if (node.parent.splitter.horizontal) {
			entry = x + this.random.next(width);
		} else {
			entry = y + this.random.next(height);
		}

		node.room = { x: x, y: y, width: width, height: height, entry: entry };
	}

	private createMap(node: Node): void {
		let map = this.map;
		let cells = map.cells;
		let rooms = map.rooms;

		let stack = [node];
		while (stack.length !== 0) {
			let current = <Node>stack.pop();
			if (isBranch(current)) {
				let splitter = current.splitter;
				let path = (<Array<Node | undefined>>current.children).concat(current.parent).reduce(function (result, value) {
					if (value) {
						let position = (value.children ? (<Branch>value).splitter.position : (<Leaf>value).room.entry);
						result.min = Math.min(result.min, position);
						result.max = Math.max(result.max, position);
					}
					return result;
				}, { min: -1 >>> 0, max: 0 });

				if (splitter.horizontal) {
					let y = splitter.position;
					for (let x = path.min, endX = path.max + 1; x < endX; x++) {
						cells[x + y * map.width].type = CellType.Floor;
					}

					let above = current.children[0];
					if (above.room) {
						let x = above.room.entry;
						let startY = above.room.y + above.room.height;
						for (let y = startY, endY = splitter.position; y < endY; y++) {
							cells[x + y * map.width].type = CellType.Floor;
						}
					}

					let below = current.children[1];
					if (below.room) {
						let x = below.room.entry;
						let startY = below.room.y - 1;
						for (let y = startY, endY = splitter.position; y > endY; y--) {
							cells[x + y * map.width].type = CellType.Floor;
						}
					}
				} else {
					let x = splitter.position;
					for (let y = path.min, endY = path.max + 1; y < endY; y++) {
						cells[x + y * map.width].type = CellType.Floor;
					}

					let left = current.children[0];
					if (left.room) {
						let y = left.room.entry;
						let startX = left.room.x + left.room.width;
						for (let x = startX, endX = splitter.position; x < endX; x++) {
							cells[x + y * map.width].type = CellType.Floor;
						}
					}

					let right = current.children[1];
					if (right.room) {
						let y = right.room.entry;
						let startX = right.room.x - 1;
						for (let x = startX, endX = splitter.position; x > endX; x--) {
							cells[x + y * map.width].type = CellType.Floor;
						}
					}
				}

				current.children.forEach(function (child) { stack.push(child) });
			} else if (current.room) {
				let room = current.room;
				let roomModel = new Room(room.x, room.y, room.width, room.height);

				for (let y = room.y, endY = room.y + room.height; y < endY; y++) {
					for (let x = room.x, endX = room.x + room.width; x < endX; x++) {
						cells[x + y * map.width].type = CellType.Floor;
					}
				}
				rooms.push(roomModel);
			}
		}
	}
}

DefaultDungeonAlgorithmProvider.default = new DefaultDungeonAlgorithm();