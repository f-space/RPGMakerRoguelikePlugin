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

PluginSystem.validate(function (params) {
	function detectEightWayMovementPlugin() {
		return PluginManager._scripts.contains('EightWayMovement');
	}

	return {
		changeKeyMapper: (params['ChangeKeyMapper'].toLowerCase() === 'true'),
		support8Way: (params['Support8Way'].toLowerCase() === 'auto')
			? detectEightWayMovementPlugin()
			: (params['Support8Way'].toLowerCase() === 'true'),
	}
});

PluginSystem.ns(null, function (scope, params) {
	var _Game_Temp_setDestination = Game_Temp.prototype.setDestination;
	Game_Temp.prototype.setDestination = function (x, y) {
		if ($gamePlayer) {
			var deltaX = Math.abs(x - $gamePlayer.x);
			var deltaY = Math.abs(y - $gamePlayer.y);
			if (params.support8Way ? (deltaX <= 1 && deltaY <= 1) : (deltaX + deltaY <= 1)) {
				_Game_Temp_setDestination.call(this, x, y);
			}
		}
	}

	var _Game_Player_moveByInput = Game_Player.prototype.moveByInput;
	Game_Player.prototype.moveByInput = function () {
		var dontMove = isPressed(this.modifierButton) && !isPressed(this.dashButton);
		var changeDirection = (TouchInput.wheelY !== 0);
		if (dontMove || changeDirection) {
			this.changeDirectionByInput();
		} else {
			_Game_Player_moveByInput.call(this);
		}
	}

	Game_Player.prototype.changeDirectionByInput = function () {
		if (!this.isMoving() && this.canMove()) {
			var direction = this.getInputDirection();

			if (direction === 0 && TouchInput.wheelY !== 0) {
				var clockwise = (TouchInput.wheelY > 0);
				direction = (clockwise ? rotateCW(this.direction()) : rotateCCW(this.direction()));
			}

			if (direction === 0 && $gameTemp.isDestinationValid()) {
				var dstX = $gameTemp.destinationX();
				var dstY = $gameTemp.destinationY();
				var deltaX = $gameMap.deltaX(dstX, this.x);
				var deltaY = $gameMap.deltaY(dstY, this.y);
				direction = toDirection(deltaX, deltaY);
			}

			$gameTemp.clearDestination();

			if (direction > 0) {
				this.setDirection(direction);
			}
		}
	}

	var _Game_Player_getInputDirection = Game_Player.prototype.getInputDirection;
	Game_Player.prototype.getInputDirection = function () {
		var direction = _Game_Player_getInputDirection.call(this);

		var diagonalOnly = isPressed(this.dashButton) && isPressed(this.modifierButton);
		if (diagonalOnly && direction % 2 === 0) {
			direction = 0;
		}

		return direction;
	}

	Game_Player.prototype.isDashButtonPressed = function () {
		var shift = isPressed(this.dashButton) && !isPressed(this.modifierButton);
		if (ConfigManager.alwaysDash) {
			return !shift;
		} else {
			return shift;
		}
	}

	Object.defineProperties(Game_Player.prototype, {
		dashButton: { value: ['dash', 'shift'], configurable: true },
		modifierButton: { value: ['modifier', 'pageup', 'pagedown'], configurable: true },
	});

	if (params.changeKeyMapper) {
		Input.keyMapper[17] = 'modifier'; // control
	}

	var rotateCW, rotateCCW;
	if (params.support8Way) {
		rotateCW = function (d) {
			switch (d) {
				case 1: return 4;
				case 2: return 1;
				case 3: return 2;
				case 4: return 7;
				case 6: return 3;
				case 7: return 8;
				case 8: return 9;
				case 9: return 6;
				default: return 0;
			}
		}

		rotateCCW = function (d) {
			switch (d) {
				case 1: return 2;
				case 2: return 3;
				case 3: return 6;
				case 4: return 1;
				case 6: return 9;
				case 7: return 4;
				case 8: return 7;
				case 9: return 8;
				default: return 0;
			}
		}
	} else {
		rotateCW = function (d) {
			switch (d) {
				case 2: return 4;
				case 4: return 8;
				case 6: return 2;
				case 8: return 6;
				default: return 0;
			}
		}

		rotateCCW = function (d) {
			switch (d) {
				case 2: return 6;
				case 4: return 2;
				case 6: return 8;
				case 8: return 4;
				default: return 0;
			}
		}
	}

	function toDirection(x, y) {
		if (x < 0) {
			return (y < 0 ? 7 : y > 0 ? 1 : 4);
		} else if (x > 0) {
			return (y < 0 ? 9 : y > 0 ? 3 : 6);
		} else if (y !== 0) {
			return (y < 0 ? 8 : 2);
		}
	}

	var isPressedCallback = function (button) { return Input.isPressed(button); };
	function isPressed(buttons) {
		if (Array.isArray(buttons)) {
			return buttons.some(isPressedCallback);
		} else {
			return Input.isPressed(buttons);
		}
	}
});