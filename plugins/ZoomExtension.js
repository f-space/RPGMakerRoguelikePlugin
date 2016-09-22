/*:
 * @plugindesc ズーム機能の拡張
 * @author F_
 * 
 * @help
 * カメラを設定することによるズーム機能の拡張。
 * 
 * 基本的に単体使用不可。
 * どうしても使用したい場合にはスクリプトイベントを設定して以下のコマンドのいずれかを実行。
 * 
 * // 特定位置へのズーム
 * $gameScreen.setCamera('fixed', x, y, scale, bounded);
 * 
 * // プレイヤー位置へのズーム
 * $gameScreen.setCamera('player', scale, bounded);
 * 
 * // ズーム状態のリセット
 * $gameScreen.setCamera(null);
 * 
 * ただし、以下の単語の部分は対応する値で置き換えること。
 * x: スクリーン上のx座標
 * y: スクリーン上のy座標
 * scale: 拡大率
 * bounded: ステージ外を表示するならfalse、表示しないならtrue
 * 
 * Copyright (c) 2016 F_
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */

PluginSystem.ns('self', function (scope, parameters) {
	this.define('Camera', function () {
		function Camera() {
			this.initialize.apply(this, arguments);
		}

		Camera.prototype.initialize = function (target) {
			defineProperties(this, target, 0, 0, 1, false);
		}

		Camera.prototype.onDeserialize = function () {
			defineProperties(this, this.target, this.offsetX, this.offsetY, this.scale, this.bounded);
		}

		function defineProperties(self, target, offsetX, offsetY, scale, bounded) {
			Object.defineProperties(self, {
				target: { value: target, enumerable: true, writable: true },
				offsetX: { value: 0, enumerable: true, writable: true },
				offsetY: { value: 0, enumerable: true, writable: true },
				scale: { value: 1, enumerable: true, writable: true },
				bounded: { value: false, enumerable: true, writable: true },
				x: { get: function () { return this.target.x; } },
				y: { get: function () { return this.target.y; } },
			});
		}

		return Camera;
	}, true);

	this.define('FixedTarget', function () {
		function FixedTarget() {
			this.initialize.apply(this, arguments);
		}

		FixedTarget.prototype.initialize = function (x, y) {
			defineProperties(this, x, y);
		}

		FixedTarget.prototype.onDeserialize = function () {
			defineProperties(this, this.x, this.y);
		}

		function defineProperties(self, x, y) {
			Object.defineProperties(self, {
				x: { value: x, enumerable: true, writable: true },
				y: { value: y, enumerable: true, writable: true },
			});
		}

		return FixedTarget;
	}, true);

	this.define('PlayerTarget', function () {
		function PlayerTarget() {
			this.initialize.apply(this, arguments);
		}

		PlayerTarget.prototype.initialize = function () {
			defineProperties(this);
		}

		PlayerTarget.prototype.onDeserialize = function () {
			defineProperties(this);
		}

		function defineProperties(self) {
			Object.defineProperties(self, {
				x: { get: function () { return $gamePlayer.screenX(); } },
				y: { get: function () { return $gamePlayer.screenY(); } },
			});
		}

		return PlayerTarget;
	}, true);

	Game_Screen.prototype.getCamera = function () {
		return this._camera || null;
	}

	Game_Screen.prototype.setCamera = function (type) {
		var args = Array.prototype.slice.call(arguments, 1);
		var camera = null;
		if (type === 'fixed') {
			var x = args[0] || 0;
			var y = args[1] || 0;
			var scale = args[2] || 1;
			var bounded = !!args[3];

			var target = new scope.FixedTarget(x, y);
			camera = new scope.Camera(target);
			camera.scale = scale;
			camera.bounded = bounded;
		} else if (type == 'player') {
			var scale = args[0] || 1;
			var bounded = !!args[1];

			var target = new scope.PlayerTarget();
			camera = new scope.Camera(target);
			camera.scale = scale;
			camera.bounded = bounded;
		}

		this._camera = camera;
	}

	var _Game_Map_canvasToMapX = Game_Map.prototype.canvasToMapX;
	Game_Map.prototype.canvasToMapX = function (x) {
		var zoom = getCameraZoom($gameScreen);
		if (zoom) {
			x = zoom.x + (x - screenCenterX()) / zoom.scale;
		}

		return _Game_Map_canvasToMapX.call(this, x);
	};

	var _Game_Map_canvasToMapY = Game_Map.prototype.canvasToMapY;
	Game_Map.prototype.canvasToMapY = function (y) {
		var zoom = getCameraZoom($gameScreen);
		if (zoom) {
			y = zoom.y + (y - screenCenterY()) / zoom.scale;
		}

		return _Game_Map_canvasToMapY.call(this, y);
	};

	Game_CharacterBase.prototype.isNearTheScreen = function () {
		var camera = $gameScreen.getCamera();
		var scale = camera ? camera.scale : 1;

		var gw = Graphics.width / scale;
		var gh = Graphics.height / scale;
		var tw = $gameMap.tileWidth();
		var th = $gameMap.tileHeight();
		var px = this.scrolledX() * tw + tw / 2 - gw / 2;
		var py = this.scrolledY() * th + th / 2 - gh / 2;
		return px >= -gw && px <= gw && py >= -gh && py <= gh;
	};

	Spriteset_Map.prototype.updatePosition = function () {
		var screen = $gameScreen;
		var zoom = getActualZoom(screen);
		this.scale.x = zoom.scale;
		this.scale.y = zoom.scale;
		this.x = Math.round(zoom.x);
		this.y = Math.round(zoom.y);
		this.x += Math.round(screen.shake());
	};

	function screenCenterX() {
		return Graphics.width * 0.5;
	}

	function screenCenterY() {
		return Graphics.height * 0.5;
	}

	function getActualZoom(screen) {
		var normalZoom = getNormalZoom(screen);
		var cameraZoom = getCameraZoom(screen);

		var scale = normalZoom.scale;
		var x = normalZoom.x * (1 - scale);
		var y = normalZoom.y * (1 - scale);
		if (cameraZoom) {
			var cscale = cameraZoom.scale;
			var cx = screenCenterX() - cameraZoom.x * cscale;
			var cy = screenCenterY() - cameraZoom.y * cscale;

			scale = scale * cscale;
			x = x * cscale + cx;
			y = y * cscale + cy;
		}

		return { x: x, y: y, scale: scale }
	}

	function getNormalZoom(screen) {
		return {
			x: screen.zoomX(),
			y: screen.zoomY(),
			scale: screen.zoomScale(),
		};
	}

	function getCameraZoom(screen) {
		var camera = screen.getCamera();
		if (camera) {
			var zoom = {
				x: camera.x + camera.offsetX,
				y: camera.y + camera.offsetY,
				scale: camera.scale,
				bounded: camera.bounded,
			};

			adjustZoom(zoom);

			return zoom;
		}

		return null;
	}

	function adjustZoom(zoom) {
		var map = $gameMap;

		if (zoom.bounded) {
			if (zoom.scale < 1) {
				zoom.x = screenCenterX();
				zoom.y = screenCenterY();
			} else {
				var halfScreenWidth = screenCenterX() / zoom.scale;
				var halfScreenHeight = screenCenterY() / zoom.scale;
				var displayX = map.displayX();
				var displayY = map.displayY();
				var tileWidth = map.tileWidth();
				var tileHeight = map.tileHeight();

				var left = displayX + (zoom.x - halfScreenWidth) / tileWidth;
				if (left <= 0) {
					zoom.x = halfScreenWidth;
				} else {
					var right = displayX + (zoom.x + halfScreenWidth) / tileWidth;
					if (right >= map.width()) {
						zoom.x = screenCenterX() * 2 - halfScreenWidth;
					}
				}

				var top = displayY + (zoom.y - halfScreenHeight) / tileHeight;
				if (top <= 0) {
					zoom.y = halfScreenHeight;
				} else {
					var bottom = displayY + (zoom.y + halfScreenHeight) / tileHeight;
					if (bottom >= map.height()) {
						zoom.y = screenCenterY() * 2 - halfScreenHeight;
					}
				}
			}
		}
	}
});