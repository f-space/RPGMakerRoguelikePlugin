/*!
/*:
 * @plugindesc 方向転換・横移動制限・連続移動制限
 * @author F_
 * 
 * @param ChangeKeyMapper
 * @desc 自動的にキーの割り当てを変更するかどうか。
 * @default true
 * 
 * @param Support8Way
 * @desc 八方向移動に対応するかどうか。
 * @default auto
 * 
 * @help
 * 方向転換や斜め方向のみの移動、タッチによる連続移動の制限など、
 * 誤った操作をしづらくするためのプラグイン。
 * 
 * 'pageup', 'pagedown'を修飾キーとして使うため注意。
 * また設定によってはコントロールキーも修飾キーとして再割り当てされる。
 * 
 * Copyright (c) 2016 F_
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */

let plugin = MVPlugin.get(__moduleName);
let params = plugin.validate($ => {
	return {
		changeKeyMapper: $.bool('ChangeKeyMapper'),
		support8Way: $.lower('Support8Way') === 'auto'
			? MVPlugin.PluginManager.contains('EightWayMovement')
			: $.bool('Support8Way'),
	}
});

declare global {
	interface Game_Player {
		readonly dashButton: string[];
		readonly modifierButton: string[];

		changeDirectionByInput(): void;
	}
}

type RotateFunction = (d: number) => number;
const CW_TABLE = [0, 4, 1, 2, 7, 0, 3, 8, 9, 6];
const CCW_TABLE = [0, 2, 3, 6, 1, 0, 9, 4, 7, 8];
let rotateCW: RotateFunction, rotateCCW: RotateFunction;
if (params.support8Way) {
	rotateCW = d => CW_TABLE[d];
	rotateCCW = d => CCW_TABLE[d];
} else {
	rotateCW = d => CW_TABLE[CW_TABLE[d]];
	rotateCCW = d => CCW_TABLE[CCW_TABLE[d]];
}

function toDirection(x: number, y: number): number {
	if (x < 0) {
		return (y < 0 ? 7 : y > 0 ? 1 : 4);
	} else if (x > 0) {
		return (y < 0 ? 9 : y > 0 ? 3 : 6);
	} else {
		return (y < 0 ? 8 : y > 0 ? 2 : 0);
	}
}

function isPressed(buttons: string | string[]) {
	if (Array.isArray(buttons)) {
		return buttons.some(button => Input.isPressed(button));
	} else {
		return Input.isPressed(buttons);
	}
}

@MVPlugin.extension(Game_Temp)
export class GameTempExtensions {
	@MVPlugin.method
	public static setDestination(base: Function) {
		return function (this: Game_Temp, x: number, y: number): void {
			if ($gamePlayer) {
				let deltaX = Math.abs(x - $gamePlayer.x);
				let deltaY = Math.abs(y - $gamePlayer.y);
				if (params.support8Way ? (deltaX <= 1 && deltaY <= 1) : (deltaX + deltaY <= 1)) {
					base.call(this, x, y);
				}
			}
		};
	}
}

@MVPlugin.extension(Game_Player)
export class GamePlayerExtensions {
	@MVPlugin.method
	public static moveByInput(base: Function) {
		return function (this: Game_Player) {
			let dontMove = isPressed(this.modifierButton) && !isPressed(this.dashButton);
			let changeDirection = (TouchInput.wheelY !== 0);
			if (dontMove || changeDirection) {
				this.changeDirectionByInput();
			} else {
				base.call(this);
			}
		};
	}

	@MVPlugin.method
	public static changeDirectionByInput() {
		return function (this: Game_Player) {
			if (!this.isMoving() && this.canMove()) {
				let direction = this.getInputDirection();

				if (direction === 0 && TouchInput.wheelY !== 0) {
					let clockwise = (TouchInput.wheelY > 0);
					direction = (clockwise ? rotateCW(this.direction()) : rotateCCW(this.direction()));
				}

				if (direction === 0 && $gameTemp.isDestinationValid()) {
					let dstX = $gameTemp.destinationX();
					let dstY = $gameTemp.destinationY();
					let deltaX = $gameMap.deltaX(dstX, this.x);
					let deltaY = $gameMap.deltaY(dstY, this.y);
					direction = toDirection(deltaX, deltaY);
				}

				$gameTemp.clearDestination();

				if (direction > 0) {
					this.setDirection(direction);
				}
			}
		};
	}

	@MVPlugin.method
	public static getInputDirection(base: Function) {
		return function (this: Game_Player) {
			let direction = base.call(this);

			let diagonalOnly = isPressed(this.dashButton) && isPressed(this.modifierButton);
			if (diagonalOnly && direction % 2 === 0) {
				direction = 0;
			}

			return direction;
		};
	}

	@MVPlugin.method
	public static isDashButtonPressed(base: Function) {
		return function (this: Game_Player) {
			let shift = isPressed(this.dashButton) && !isPressed(this.modifierButton);
			if (ConfigManager.alwaysDash) {
				return !shift;
			} else {
				return shift;
			}
		}
	}

	@MVPlugin.property
	public static get dashButton(this: Game_Player) { return ['dash', 'shift']; }

	@MVPlugin.property
	public static get modifierButton(this: Game_Player) { return ['modifier', 'pageup', 'pagedown']; }
}

if (params.changeKeyMapper) {
	Input.keyMapper[17] = 'modifier'; // control
}