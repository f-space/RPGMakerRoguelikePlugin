/*:
 * @plugindesc 暗がりエフェクト
 * @author F_
 * 
 * @help
 * 暗がりを表現するエフェクト
 * 
 * 単体使用不可。
 * 
 * Copyright (c) 2016 F_
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */

PluginSystem.ns('self', function (scope) {
	this.define('DarknessBitmap', function () {
		function DarknessBitmap() {
			this.initialize.apply(this, arguments);
		}

		DarknessBitmap.prototype = Object.create(Bitmap.prototype);
		DarknessBitmap.prototype.constructor = DarknessBitmap;

		DarknessBitmap.prototype.initialize = function (width, height) {
			Bitmap.prototype.initialize.call(this, width, height);
		}

		DarknessBitmap.prototype.drawCircleShade = function (offset, startColor, endColor) {
			var radius = Math.max(this.width, this.height) * 0.5;
			var offset = (+offset).clamp(0, 1);

			var context = this._context;
			context.save();
			var gradient = context.createRadialGradient(radius, radius, radius * offset, radius, radius, radius);
			gradient.addColorStop(0, startColor);
			gradient.addColorStop(1, endColor);
			context.fillStyle = gradient;
			context.globalCompositeOperation = 'copy';
			context.fillRect(0, 0, this.width, this.height);
			context.restore();
			this._setDirty();
		}

		DarknessBitmap.prototype.drawLineShade = function (offset, startColor, endColor) {
			var size = Math.max(this.width, this.height);
			var offset = (+offset).clamp(0, 1);

			var context = this._context;
			context.save();
			var gradient = context.createLinearGradient(size * offset, 0, size, 0);
			gradient.addColorStop(0, startColor);
			gradient.addColorStop(1, endColor);
			context.fillStyle = gradient;
			context.globalCompositeOperation = 'copy';
			context.fillRect(0, 0, this.width, this.height);
			context.restore();
			this._setDirty();
		}

		DarknessBitmap.prototype.drawCornerShade = function (offset, startColor, endColor) {
			var radius = Math.max(this.width, this.height);
			var offset = (+offset).clamp(0, 1);

			var context = this._context;
			context.save();
			var gradient = context.createRadialGradient(0, 0, radius * offset, 0, 0, radius);
			gradient.addColorStop(0, startColor);
			gradient.addColorStop(1, endColor);
			context.fillStyle = gradient;
			context.globalCompositeOperation = 'copy';
			context.fillRect(0, 0, this.width, this.height);
			context.restore();
			this._setDirty();
		}

		return DarknessBitmap;
	});

	this.define('SightSprite', function () {
		function SightSprite() {
			this.initialize.apply(this, arguments);
		}

		SightSprite.prototype = Object.create(Sprite.prototype);
		SightSprite.prototype.constructor = SightSprite;

		Object.defineProperty(SightSprite.prototype, 'range', {
			get: function () { return this._range; },
			set: function (value) {
				value = (+value).clamp(0, 1);
				if (this._range !== value) {
					this._range = value;
					this._dirty = true;
				}
			},
			enumerable: true,
		});

		Object.defineProperty(SightSprite.prototype, 'color', {
			get: function () { return this._color; },
			set: function (value) {
				value = value || 'rgba(0,0,0,1)';
				if (this._color !== value) {
					this._color = value;
					this._dirty = true;
				}
			},
			enumerable: true,
		});

		Object.defineProperty(SightSprite.prototype, 'innerColor', {
			get: function () { return this._innerColor; },
			set: function (value) {
				value = value || 'rgba(0,0,0,0)';
				if (this._innerColor !== value) {
					this._innerColor = value;
					this._dirty = true;
				}
			},
			enumerable: true,
		});

		SightSprite.prototype.initialize = function (range, color, innerColor) {
			Sprite.prototype.initialize.call(this);

			this.range = (range != null ? range : 0.5);
			this.color = color;
			this.innerColor = innerColor;

			this.create();
			this.update();
		}

		SightSprite.prototype.create = function () {
			this.removeChildren();
			this.createCore();

			this._dirty = false;
		}

		SightSprite.prototype.createCore = function () { }

		SightSprite.prototype.createFillingSprite = function () {
			var bitmap = new Bitmap(1, 1);
			bitmap.fillAll(this.color);

			var width = Graphics.width * 5;
			var height = Graphics.height * 5;
			var anchors = [
				{ x: 1, y: 1 },
				{ x: 0, y: 1 },
				{ x: 0, y: 0 },
				{ x: 1, y: 0 },
			];

			var fillingSprites = [];
			for (var i = 0; i < 4; i++) {
				var fillingSprite = new Sprite(bitmap);
				fillingSprite.setFrame(0, 0, bitmap.width, bitmap.height);
				fillingSprite.anchor.x = (i === 0 || i === 3 ? 1 : 0);
				fillingSprite.anchor.y = (i === 0 || i === 1 ? 1 : 0);
				fillingSprite.x = 0;
				fillingSprite.y = 0;
				fillingSprite.scale.x = width;
				fillingSprite.scale.y = height;
				fillingSprites.push(fillingSprite);

				this.addChild(fillingSprite);
			}

			this._fillingSprites = fillingSprites;
		}

		SightSprite.prototype.update = function () {
			Sprite.prototype.update.call(this);

			if (this._dirty) this.create();
			this.updateCore();
		}

		SightSprite.prototype.updateCore = function () { }

		SightSprite.prototype.updateFillingSprite = function (left, top, right, bottom) {
			this._fillingSprites[0].x = left;
			this._fillingSprites[0].y = bottom;
			this._fillingSprites[1].x = left;
			this._fillingSprites[1].y = top;
			this._fillingSprites[2].x = right;
			this._fillingSprites[2].y = top;
			this._fillingSprites[3].x = right;
			this._fillingSprites[3].y = bottom;
		}

		return SightSprite;
	});

	this.define('CircleSightSprite', function () {
		function CircleSightSprite() {
			this.initialize.apply(this, arguments);
		}

		CircleSightSprite.prototype = Object.create(scope.SightSprite.prototype);
		CircleSightSprite.prototype.constructor = CircleSightSprite;

		Object.defineProperty(CircleSightSprite.prototype, 'radius', {
			get: function () { return this._radius; },
			set: function (value) {
				value = Math.max(1, value | 0);
				if (this._radius !== value) {
					this._radius = value;
					this._dirty = true;
				}
			},
			enumerable: true,
		});

		CircleSightSprite.prototype.initialize = function (radius, range, color, innerColor) {
			this.radius = radius;

			scope.SightSprite.prototype.initialize.call(this, range, color, innerColor);
		}

		CircleSightSprite.prototype.createCore = function () {
			this.createCircleSprite();
			this.createFillingSprite();
		}

		CircleSightSprite.prototype.createCircleSprite = function () {
			var size = this.radius * 2;
			var bitmap = new scope.DarknessBitmap(size, size);
			bitmap.smooth = true;
			bitmap.drawCircleShade(1 - this.range, this.innerColor, this.color);

			var circleSprite = new Sprite(bitmap);
			circleSprite.setFrame(0, 0, bitmap.width, bitmap.height);
			circleSprite.anchor.x = 0.5;
			circleSprite.anchor.y = 0.5;
			this.addChild(circleSprite);

			this._circleSprite = circleSprite;
		}

		CircleSightSprite.prototype.updateCore = function () {
			var radius = this.radius;

			this.updateFillingSprite(-radius, -radius, radius, radius);
		}

		return CircleSightSprite;
	});

	this.define('AreaSightSprite', function () {
		function AreaSightSprite() {
			this.initialize.apply(this, arguments);
		}

		AreaSightSprite.prototype = Object.create(scope.SightSprite.prototype);
		AreaSightSprite.prototype.constructor = AreaSightSprite;

		Object.defineProperty(AreaSightSprite.prototype, 'areaWidth', {
			get: function () { return this._areaWidth; },
			set: function (value) { this._areaWidth = Math.max(1, value | 0); },
			enumerable: true,
		});

		Object.defineProperty(AreaSightSprite.prototype, 'areaHeight', {
			get: function () { return this._areaHeight; },
			set: function (value) { this._areaHeight = Math.max(1, value | 0); },
			enumerable: true,
		});

		Object.defineProperty(AreaSightSprite.prototype, 'radius', {
			get: function () { return this._radius; },
			set: function (value) {
				value = Math.max(1, value | 0);
				if (this._radius !== value) {
					this._radius = value;
					this._dirty = true;
				}
			},
			enumerable: true,
		});

		AreaSightSprite.prototype.initialize = function (areaWidth, areaHeight, radius, range, color, innerColor) {
			this.areaWidth = areaWidth;
			this.areaHeight = areaHeight;
			this.radius = radius;

			scope.SightSprite.prototype.initialize.call(this, range, color, innerColor);
		}

		AreaSightSprite.prototype.createCore = function () {
			this.createAreaSprite();
			this.createFillingSprite();
		}

		AreaSightSprite.prototype.createAreaSprite = function () {
			var corner = new scope.DarknessBitmap(this.radius, this.radius);
			corner.smooth = true;
			corner.drawCornerShade(1 - this.range, this.innerColor, this.color);

			var line = new scope.DarknessBitmap(this.radius, 1);
			line.smooth = true;
			line.drawLineShade(1 - this.range, this.innerColor, this.color);

			var square = new Bitmap(1, 1);
			square.fillAll(this.innerColor);

			var cornerSprites = [];
			var lineSprites = [];
			for (var i = 0; i < 4; i++) {
				var angle = i * Math.PI * 0.5;

				var cornerSprite = new Sprite(corner);
				cornerSprite.setFrame(0, 0, corner.width, corner.height);
				cornerSprite.anchor.x = 1;
				cornerSprite.anchor.y = 1;
				cornerSprite.rotation = angle;
				cornerSprites.push(cornerSprite);
				this.addChild(cornerSprite);

				var lineSprite = new Sprite(line);
				lineSprite.setFrame(0, 0, line.width, line.height);
				lineSprite.anchor.x = 1;
				lineSprite.anchor.y = 1;;
				lineSprite.rotation = angle;
				lineSprites.push(lineSprite);
				this.addChild(lineSprite);
			}
			var squareSprite = new Sprite(square);
			squareSprite.setFrame(0, 0, square.width, square.height);
			this.addChild(squareSprite);

			this._cornerSprites = cornerSprites;
			this._lineSprites = lineSprites;
			this._squareSprite = squareSprite;
		}

		AreaSightSprite.prototype.updateCore = function () {
			this.updateAreaSprite();
			this.updateFillingSprite(0, 0, this.areaWidth, this.areaHeight);
		}

		AreaSightSprite.prototype.updateAreaSprite = function () {
			var radius = this.radius;
			var width = this.areaWidth;
			var height = this.areaHeight;
			var intervalH = Math.max(0, width - radius * 2);
			var intervalV = Math.max(0, height - radius * 2);

			this._cornerSprites[0].x = width;
			this._cornerSprites[0].y = height;
			this._lineSprites[0].x = width;
			this._lineSprites[0].y = height - radius;
			this._lineSprites[0].scale.y = intervalV;

			this._cornerSprites[1].x = 0;
			this._cornerSprites[1].y = height;
			this._lineSprites[1].x = radius;
			this._lineSprites[1].y = height;
			this._lineSprites[1].scale.y = intervalH;

			this._cornerSprites[2].x = 0;
			this._cornerSprites[2].y = 0;
			this._lineSprites[2].x = 0;
			this._lineSprites[2].y = radius;
			this._lineSprites[2].scale.y = intervalV;

			this._cornerSprites[3].x = width;
			this._cornerSprites[3].y = 0;
			this._lineSprites[3].x = width - radius;
			this._lineSprites[3].y = 0;
			this._lineSprites[3].scale.y = intervalH;

			this._squareSprite.x = radius;
			this._squareSprite.y = radius;
			this._squareSprite.scale.x = intervalH;
			this._squareSprite.scale.y = intervalV;
		}

		return AreaSightSprite;
	});

	this.define('DarkMapSpriteset', function () {
		function DarkMapSpriteset() {
			this.initialize.apply(this, arguments);
		}

		DarkMapSpriteset.prototype = Object.create(Spriteset_Map.prototype);
		DarkMapSpriteset.prototype.constructor = DarkMapSpriteset;

		Object.defineProperties(DarkMapSpriteset.prototype, {
			darknessMode: {
				get: function () { return this._darknessMode; },
			},
			darknessRange: {
				get: function () {
					return (this.darknessMode === 'area' ? this._areaSight : this._circleSight).range;
				},
				set: function (value) {
					this._areaSight.range = this._circleSight.range = value;
				},
			},
			darknessColor: {
				get: function () {
					return (this.darknessMode === 'area' ? this._areaSight : this._circleSight).color;
				},
				set: function (value) {
					this._areaSight.color = this._circleSight.color = value;
				},
			},
			darknessInnerColor: {
				get: function () {
					return (this.darknessMode === 'area' ? this._areaSight : this._circleSight).innerColor;
				},
				set: function (value) {
					this._areaSight.innerColor = this._circleSight.innerColor = value;
				},
			},
			darknessArea: {
				get: function () { return this._darknessArea; },
			},
		});

		DarkMapSpriteset.prototype.initialize = function () {
			Spriteset_Map.prototype.initialize.call(this);

			this._darknessMode = 'none';
		}

		DarkMapSpriteset.prototype.createLowerLayer = function () {
			Spriteset_Map.prototype.createLowerLayer.call(this);
			this.createDarknessEffect();
		}

		DarkMapSpriteset.prototype.update = function () {
			Spriteset_Map.prototype.update.call(this);
			this.updateDarknessEffect();
		}

		DarkMapSpriteset.prototype.createDarknessEffect = function () {
			var tileSize = Math.min($gameMap.tileWidth(), $gameMap.tileHeight());
			this._areaSight = new scope.AreaSightSprite(0, 0, tileSize);
			this._areaSight.z = 6.5;
			this._tilemap.addChild(this._areaSight);

			var radius = tileSize * 1.5;
			this._circleSight = new scope.CircleSightSprite(radius);
			this._circleSight.z = 6.5;
			this._tilemap.addChild(this._circleSight);
		}

		DarkMapSpriteset.prototype.updateDarknessEffect = function () {
			this._circleSight.visible = false;
			this._areaSight.visible = false;

			if (this._darknessMode === 'area') {
				var area = this._darknessArea;
				this._areaSight.x = area.x;
				this._areaSight.y = area.y;
				this._areaSight.areaWidth = area.width;
				this._areaSight.areaHeight = area.height;
				this._areaSight.visible = true;
			} else if (this._darknessMode === 'circle') {
				this._circleSight.x = $gamePlayer.screenX();
				this._circleSight.y = $gamePlayer.screenY() - $gameMap.tileHeight() * 0.5;
				this._circleSight.visible = true;
			}
		}

		DarkMapSpriteset.prototype.switchToAreaSight = function (area) {
			this._darknessArea = area;
			this._darknessMode = 'area';
		}

		DarkMapSpriteset.prototype.switchToCircleSight = function () {
			this._darknessMode = 'circle';
		}

		DarkMapSpriteset.prototype.switchToClearSight = function () {
			this._darknessMode = 'none';
		}

		return DarkMapSpriteset;
	});
});