/*!
/*:
 * @plugindesc 八方向移動
 * @author F_
 * 
 * @param DelayTime
 * @desc 入力遅延フレーム数。
 * @default 5
 * 
 * @param SkewAngle
 * @desc 斜め方向を向いたときの画像を傾ける角度。
 * @default 15
 * 
 * @help
 * 八方向移動を可能にするプラグイン。
 * 
 * コアエンジンのAPI仕様を変更するため、
 * 他のプラグインと併用すると問題が発生する可能性あり。
 * 
 * Copyright (c) 2016 F_
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */

let plugin = MVPlugin.get(__moduleName);
let params = plugin.validate($ => {
	return {
		delayTime: Math.max(0, $.int('DelayTime')),
		skewAngle: $.float('SkewAngle') * Math.PI / 180,
	}
});

declare global {
	interface Game_Map {
		getHeight(x: number, y: number): number;
		isWater(x: number, y: number): boolean;
		isWall(x: number, y: number): boolean;
	}

	interface Game_CharacterBase {
		toImageDirection(d: number): number;
	}

	interface Game_Player {
		_inputDelay: number | undefined;
		_deferredInputDirection: number | undefined;
	}
}

function isDir4(d: number): boolean {
	return ((d & 0x01) === 0);
}

function dirX(d: number): number {
	return ((d === 1 || d === 7) ? 4 : (d === 3 || d === 9) ? 6 : d);
}

function dirY(d: number): number {
	return ((d === 1 || d === 3) ? 2 : (d === 7 || d === 9) ? 8 : d);
}

function dir8(horz: number, vert: number): number {
	let d = (horz === 4 ? 1 : horz === 6 ? 3 : 2) + (vert === 2 ? 0 : vert === 8 ? 6 : 3);
	return (d !== 5 ? d : 0);
}

@MVPlugin.extension(Game_Map)
export class GameMapExtensions {
	private constructor() { }

	private static readonly SQRT_2 = Math.sqrt(2);

	@MVPlugin.method
	public static xWithDirection(base: Function) {
		return function (this: Game_Map, x: number, d: number): number {
			return base.call(this, x, dirX(d));
		};
	}

	@MVPlugin.method
	public static yWithDirection(base: Function) {
		return function (this: Game_Map, y: number, d: number): number {
			return base.call(this, y, dirY(d));
		};
	}

	@MVPlugin.method
	public static roundXWithDirection(base: Function) {
		return function (this: Game_Map, x: number, d: number): number {
			return base.call(this, x, dirX(d));
		};
	}

	@MVPlugin.method
	public static roundYWithDirection(base: Function) {
		return function (this: Game_Map, y: number, d: number): number {
			return base.call(this, y, dirY(d));
		};
	}

	@MVPlugin.method
	public static doScroll(base: Function) {
		return function (this: Game_Map, direction: number, distance: number): void {
			if (isDir4(direction)) {
				base.call(this, direction, distance);
			} else {
				let amount = distance / GameMapExtensions.SQRT_2;
				base.call(this, dirY(direction), amount);
				base.call(this, dirX(direction), amount);
			}
		};
	}

	@MVPlugin.method
	public static isPassable(base: Function) {
		return function (this: Game_Map, x: number, y: number, d: number): boolean {
			if (isDir4(d)) {
				return base.call(this, x, y, d);
			} else {
				let horz = dirX(d);
				let vert = dirY(d);
				let x2 = this.roundXWithDirection(x, horz);
				let y2 = this.roundYWithDirection(y, vert);

				let h11 = this.getHeight(x, y);
				let h12 = this.getHeight(x, y2);
				let h21 = this.getHeight(x2, y);
				let h22 = this.getHeight(x2, y2);
				if (Math.max(h11, h22) <= Math.max(h12, h21)) {
					let hv1 = base.call(this, x, y, horz);
					let hv2 = base.call(this, x2, y, vert);
					let vh1 = base.call(this, x, y, vert);
					let vh2 = base.call(this, x, y2, horz);

					return ((hv1 && hv2) || (vh1 && vh2) || (hv1 && vh1));
				}

				return false;
			}
		}
	}

	@MVPlugin.method
	public static getHeight() {
		return function (this: Game_Map, x: number, y: number): number {
			return this.isWater(x, y) ? -1 : this.isWall(x, y) ? 1 : 0;
		};
	}

	@MVPlugin.method
	public static isWater() {
		return function (this: Game_Map, x: number, y: number): boolean {
			return this.isBoatPassable(x, y) || this.isShipPassable(x, y);
		};
	}

	@MVPlugin.method
	public static isWall() {
		return function (this: Game_Map, x: number, y: number): boolean {
			let flags = this.tilesetFlags();
			let tiles = this.allTiles(x, y);
			for (let tile of tiles) {
				let flag = flags[tile];
				if ((flag & 0x10) !== 0) continue;

				return Tilemap.isWallTile(tile);
			}
			return true;
		};
	}
}

@MVPlugin.extension(Game_CharacterBase)
export class GameCharacterBaseExtensions {
	@MVPlugin.method
	public static toImageDirection() {
		return function (this: Game_CharacterBase, d: number): number {
			return isDir4(d) ? d : dirX(d);
		};
	}

	@MVPlugin.method
	public static canPassDiagonally(base: Function) {
		return function (this: Game_CharacterBase, x: number, y: number, horz: number, vert: number): boolean {
			return this.canPass(x, y, dir8(horz, vert));
		};
	}

	@MVPlugin.method
	public static moveDiagonally(base: Function) {
		return function (this: Game_CharacterBase, horz: number, vert: number): void {
			this.moveStraight(dir8(horz, vert));
		};
	}
}

@MVPlugin.extension(Game_Character)
export class GameCharacterExtensions {
	private static readonly TURN_RIGHT_TABLE = [0, 4, 1, 2, 7, 0, 3, 8, 9, 6];
	private static readonly TURN_LEFT_TABLE = [0, 2, 3, 6, 1, 0, 9, 4, 7, 8];
	private static readonly ANGLE_TO_DIRECTION = [6, 3, 2, 1, 4, 7, 8, 9];

	@MVPlugin.method
	public static moveRandom(base: Function) {
		return function (this: Game_Character): void {
			let value = Math.randomInt(8);
			let direction = value + (value < 4 ? 1 : 2);
			if (this.canPass(this.x, this.y, direction)) {
				this.moveStraight(direction);
			}
		};
	}

	@MVPlugin.method
	public static moveTowardCharacter(base: Function) {
		return function (this: Game_Character, character: Game_Character): void {
			let direction = GameCharacterExtensions.directionFrom.call(this, character);
			this.moveStraight(this.reverseDir(direction));
			if (!this.isMovementSucceeded()) {
				base.call(this, character);
			}
		};
	}

	@MVPlugin.method
	public static moveAwayFromCharacter(base: Function) {
		return function (this: Game_Character, character: Game_Character): void {
			let direction = GameCharacterExtensions.directionFrom.call(this, character);
			this.moveStraight(direction);
			if (!this.isMovementSucceeded()) {
				base.call(this, character);
			}
		};
	}

	@MVPlugin.method
	public static turnTowardCharacter(base: Function) {
		return function (this: Game_Character, character: Game_Character): void {
			let direction = GameCharacterExtensions.directionFrom.call(this, character);
			this.setDirection(this.reverseDir(direction));
		};
	}

	@MVPlugin.method
	public static turnAwayFromCharacter(base: Function) {
		return function (this: Game_Character, character: Game_Character): void {
			let direction = GameCharacterExtensions.directionFrom.call(this, character);
			this.setDirection(direction);
		};
	}

	@MVPlugin.method
	public static turnRight90(base: Function) {
		return function (this: Game_Character): void {
			this.setDirection(GameCharacterExtensions.TURN_RIGHT_TABLE[this.direction()]);
		};
	}

	@MVPlugin.method
	public static turnLeft90(base: Function) {
		return function (this: Game_Character): void {
			this.setDirection(GameCharacterExtensions.TURN_LEFT_TABLE[this.direction()]);
		};
	}

	@MVPlugin.method
	public static turnRandom(base: Function) {
		return function (this: Game_Character): void {
			let value = Math.randomInt(8);
			this.setDirection(value + (value < 4 ? 1 : 2));
		};
	}

	@MVPlugin.method
	public static findDirectionTo(base: Function) {
		return function (this: Game_Character, goalX: number, goalY: number): number {
			interface Node {
				parent: Node | null;
				x: number;
				y: number;
				g: number;
				f: number;
			}

			let searchLimit = this.searchLimit();
			let mapWidth = $gameMap.width();
			let nodeList = <Node[]>[];
			let openList = <number[]>[];
			let closedList = <number[]>[];
			let start = <Node>{};
			let best = start;

			if (this.x === goalX && this.y === goalY) {
				return 0;
			}

			start.parent = null;
			start.x = this.x;
			start.y = this.y;
			start.g = 0;
			start.f = $gameMap.distance(start.x, start.y, goalX, goalY);
			nodeList.push(start);
			openList.push(start.y * mapWidth + start.x);

			while (nodeList.length > 0) {
				let bestIndex = 0;
				for (let i = 0; i < nodeList.length; i++) {
					if (nodeList[i].f < nodeList[bestIndex].f) {
						bestIndex = i;
					}
				}

				let current = nodeList[bestIndex];
				let x1 = current.x;
				let y1 = current.y;
				let pos1 = y1 * mapWidth + x1;
				let g1 = current.g;

				nodeList.splice(bestIndex, 1);
				openList.splice(openList.indexOf(pos1), 1);
				closedList.push(pos1);

				if (current.x === goalX && current.y === goalY) {
					best = current;
					break;
				}

				if (g1 >= searchLimit) {
					continue;
				}

				for (let j = 0; j < 8; j++) {
					let direction = j + (j < 4 ? 1 : 2);
					let x2 = $gameMap.roundXWithDirection(x1, direction);
					let y2 = $gameMap.roundYWithDirection(y1, direction);
					let pos2 = y2 * mapWidth + x2;

					if (closedList.contains(pos2)) {
						continue;
					}
					if (!this.canPass(x1, y1, direction)) {
						continue;
					}

					let g2 = g1 + 1;
					let index2 = openList.indexOf(pos2);

					if (index2 < 0 || g2 < nodeList[index2].g) {
						let neighbor: Node;
						if (index2 >= 0) {
							neighbor = nodeList[index2];
						} else {
							neighbor = <Node>{};
							nodeList.push(neighbor);
							openList.push(pos2);
						}
						neighbor.parent = current;
						neighbor.x = x2;
						neighbor.y = y2;
						neighbor.g = g2;
						neighbor.f = g2 + $gameMap.distance(x2, y2, goalX, goalY);
						if (!best || neighbor.f - neighbor.g < best.f - best.g) {
							best = neighbor;
						}
					}
				}
			}

			let node = best;
			while (node.parent && node.parent !== start) {
				node = node.parent;
			}

			let deltaX1 = $gameMap.deltaX(node.x, start.x);
			let deltaY1 = $gameMap.deltaY(node.y, start.y);
			if (deltaX1 < 0) {
				return (deltaY1 < 0 ? 7 : deltaY1 > 0 ? 1 : 4);
			} else if (deltaX1 > 0) {
				return (deltaY1 < 0 ? 9 : deltaY1 > 0 ? 3 : 6);
			} else if (deltaY1 !== 0) {
				return (deltaY1 < 0 ? 8 : 2);
			}

			let deltaX2 = $gameMap.deltaX(goalX, this.x);
			let deltaY2 = $gameMap.deltaY(goalY, this.y);
			if (deltaX2 < 0) {
				return (deltaY2 < 0 ? 7 : deltaY2 > 0 ? 1 : 4);
			} else if (deltaX2 > 0) {
				return (deltaY2 < 0 ? 9 : deltaY2 > 0 ? 3 : 6);
			} else if (deltaY2 !== 0) {
				return (deltaY2 < 0 ? 8 : 2);
			}

			return 0;
		};
	}

	private static directionFrom(this: Game_Character, character: Game_Character): number {
		let dx = this.deltaXFrom(character.x);
		let dy = this.deltaYFrom(character.y);
		let s = Math.atan2(dy, dx) / (Math.PI * 2);
		let t = (s + (1 + 1 / 16)) % 1;
		let index = Math.floor(t * 8);
		return GameCharacterExtensions.ANGLE_TO_DIRECTION[index];
	}
}

@MVPlugin.extension(Game_Player)
export class GamePlayerExtensions {
	@MVPlugin.method
	public static getInputDirection(base: Function) {
		return function (this: Game_Player): number {
			let direction = Input.dir8;
			if (direction === 0) {
				direction = +this._deferredInputDirection;
				this._inputDelay = params.delayTime;
				this._deferredInputDirection = 0;
			} else if (isDir4(direction) && this._inputDelay > 0) {
				this._inputDelay--;
				this._deferredInputDirection = direction;
				direction = 0;
			} else {
				this._inputDelay = 0;
				this._deferredInputDirection = 0;
			}

			return direction;
		};
	}
}

@MVPlugin.extension(Game_Vehicle)
export class GameVehicleExtensions {
	@MVPlugin.method
	public static isMapPassable(base: Function) {
		return function (this: Game_Vehicle, x: number, y: number, d: number): boolean {
			if (isDir4(d)) {
				return base.call(this, x, y, d);
			} else {
				let x2 = $gameMap.roundXWithDirection(x, d);
				let y2 = $gameMap.roundYWithDirection(y, d);
				if (this.isBoat()) {
					return $gameMap.isBoatPassable(x2, y2)
						&& $gameMap.isBoatPassable(x2, y)
						&& $gameMap.isBoatPassable(x, y2);
				} else if (this.isShip()) {
					return $gameMap.isShipPassable(x2, y2)
						&& $gameMap.isShipPassable(x2, y)
						&& $gameMap.isShipPassable(x, y2);
				} else if (this.isAirship()) {
					return true;
				} else {
					return false;
				}
			}
		};
	}
}

@MVPlugin.extension(Sprite_Character)
export class SpriteCharacterExtensions {
	@MVPlugin.method
	public static characterPatternY(base: Function) {
		return function (this: Sprite_Character) {
			return (this._character.toImageDirection(this._character.direction()) - 2) / 2;
		};
	}

	@MVPlugin.methodIf(params.skewAngle !== 0)
	public static updateCharacterFrame(base: Function) {
		return function (this: Sprite_Character) {
			base.call(this);

			let direction = this._character.direction();
			if (direction === 3 || direction === 7) {
				this.skew.y = params.skewAngle;
			} else if (direction === 1 || direction === 9) {
				this.skew.y = -params.skewAngle;
			} else {
				this.skew.y = 0;
			}
		};
	}
}