/*:
 * @plugindesc ローグライク：UI
 * @author F_
 * 
 * @param Margin
 * @desc 余白(CSS-Style but 'px' only)。
 * @default 20 50
 * 
 * @param FloorUnit
 * @desc 階層の単位。
 * @default F
 * 
 * @param HPSeparator
 * @desc 最大HPと現在HPの仕切り。
 * @default /
 * 
 * @param MaxFloor
 * @desc 最大階層。
 * @default 99
 * 
 * @param MaxLevel
 * @desc 最大レベル。
 * @default 99
 * 
 * @param MaxHP
 * @desc 最大HP。
 * @default 999
 * 
 * @param MaxGold
 * @desc 最大ゴールド。
 * @default 999999
 * 
 * @help
 * 現在情報をマップ画面に表示するためのプラグイン。
 * 
 * Copyright (c) 2016 F_
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */

PluginSystem.validate(function (params) {
	var marginRegex = /(?:^\s*|\s+)(\d+)(?:px)?(?=\s+|\s*$)/g
	var match = String(params['Margin']).match(marginRegex);
	var margin = (match && match.map(function (value) { return parseInt(value, 10); })) || [];
	if (margin.length === 0) margin.push(0);
	if (margin.length === 1) margin.push(margin[0]);
	if (margin.length === 2) margin.push(margin[0]);
	if (margin.length === 3) margin.push(margin[1]);

	return {
		marginTop: margin[0],
		marginRight: margin[1],
		marginBottom: margin[2],
		marginLeft: margin[3],
		floorUnit: String(params['FloorUnit']),
		hpSeparator: String(params['HPSeparator']),
		floorNumLength: String(parseInt(params['MaxFloor'])).length,
		levelNumLength: String(parseInt(params['MaxLevel'])).length,
		hpNumLength: String(parseInt(params['MaxHP'])).length,
		goldNumLength: String(parseInt(params['MaxGold'])).length,
	};
});

PluginSystem.ns('auto', function (scope, params) {

	scope.define('InfoWindow', function () {
		function InfoWindow() {
			this.initialize.apply(this, arguments);
		}

		InfoWindow.prototype = Object.create(Window_Base.prototype);
		InfoWindow.prototype.constructor = InfoWindow;

		InfoWindow.prototype.initialize = function () {
			var width = this.windowWidth();
			var height = this.windowHeight();
			Window_Base.prototype.initialize.call(this, 0, 0, width, height);

			this.opacity = 0;

			this._floor = 0;
			this._level = 0;
			this._exp = 0;
			this._mexp = 0;
			this._hp = 0;
			this._mhp = 0;
			this._mp = 0;
			this._mmp = 0;
			this._gold = 0;
		}

		InfoWindow.prototype.windowWidth = function () {
			return Graphics.boxWidth;
		}

		InfoWindow.prototype.windowHeight = function () {
			return this.fittingHeight(1)
				+ (this.gaugeSpacing() + this.gaugeHeight()) * 2
				+ (params.marginTop + params.marginBottom);
		}

		InfoWindow.prototype.standardFontSize = function () {
			return 42;
		}

		InfoWindow.prototype.standardPadding = function () {
			return 0;
		}

		InfoWindow.prototype.textPadding = function () {
			return 8;
		}

		InfoWindow.prototype.gaugeSpacing = function () {
			return 4;
		}

		InfoWindow.prototype.gaugeHeight = function () {
			return 8;
		}

		InfoWindow.prototype.update = function () {
			Window_Base.prototype.update.call(this);

			var dirty = false;

			if ($gameMap) {
				var floor = ($gameMap.dungeonContext && $gameMap.dungeonContext.level) || 0;
				if (this._floor !== floor) {
					this._floor = floor;
					dirty = true;
				}
			}

			if ($gameParty) {
				var actor = $gameParty.leader();

				var level = actor.level;
				if (this._level !== level) {
					this._level = level;
					dirty = true;
				}

				var exp = (actor.isMaxLevel() ? 0 : actor.currentExp());
				if (this._exp !== exp) {
					this._exp = exp;
					dirty = true;
				}

				var mexp = (actor.isMaxLevel() ? 0 : actor.nextRequiredExp());
				if (this._mexp !== mexp) {
					this._mexp = mexp;
					dirty = true;
				}

				var hp = actor.hp;
				if (this._hp !== hp) {
					this._hp = hp;
					dirty = true;
				}

				var mhp = actor.mhp;
				if (this._mhp !== mhp) {
					this._mhp = mhp;
					dirty = true;
				}

				var mp = actor.mp;
				if (this._mp !== mp) {
					this._mp = mp;
					dirty = true;
				}

				var mmp = actor.mmp;
				if (this._mmp !== mmp) {
					this._mmp = mmp;
					dirty = true;
				}

				var gold = $gameParty.gold();
				if (this._gold !== gold) {
					this._gold = gold;
					dirty = true;
				}
			}

			if (dirty) this.refresh();
		}

		InfoWindow.prototype.refresh = function () {
			this.contents.clear();

			var layout = this.measureInfoText();
			this.drawInfoText(layout);
		}

		InfoWindow.prototype.measureInfoText = function () {
			var floorWidth = this.measureFloorText();
			var levelWidth = this.measureLevelText();
			var hpWidth = this.measureHPText();
			var goldWidth = this.measureGoldText();

			var width = this.contents.width;
			var totalWidth = floorWidth + levelWidth + hpWidth + goldWidth;
			var horizontalMargin = params.marginLeft + params.marginRight;
			var space = width - totalWidth - horizontalMargin;

			return {
				floorWidth: floorWidth,
				levelWidth: levelWidth,
				hpWidth: hpWidth,
				goldWidth: goldWidth,
				offsetX: params.marginLeft,
				offsetY: params.marginTop,
				spacing: Math.round(space / 3),
			};
		}

		InfoWindow.prototype.measureFloorText = function () {
			var width = 0;
			width += this.measureNumberText(params.floorNumLength);
			width += this.textPadding();
			width += this.textWidth(params.floorUnit);
			return width;
		}

		InfoWindow.prototype.measureLevelText = function () {
			var width = 0;
			width += this.textWidth(TextManager.levelA);
			width += this.textPadding();
			width += this.measureNumberText(params.levelNumLength);
			return width;
		}

		InfoWindow.prototype.measureHPText = function () {
			var width = 0;
			width += this.textWidth(TextManager.hpA);
			width += this.textPadding();
			width += this.measureNumberText(params.hpNumLength) * 2;
			width += this.textWidth(params.hpSeparator);
			return width;
		}

		InfoWindow.prototype.measureGoldText = function () {
			var width = 0;
			width += this.measureNumberText(params.goldNumLength);
			width += this.textPadding();
			width += this.textWidth(TextManager.currencyUnit);
			return width;
		}

		InfoWindow.prototype.measureNumberText = function (length) {
			return this.textWidth('0') * length;
		}

		InfoWindow.prototype.drawInfoText = function (layout) {
			var x = layout.offsetX;
			var y = layout.offsetY;
			var gaugeOffset = this.lineHeight() + this.gaugeSpacing();
			var gaugeHeight = this.gaugeHeight() + this.gaugeSpacing();

			this.drawFloorText(x, y, layout.floorWidth);
			x += layout.floorWidth + layout.spacing;

			this.drawLevelText(x, y, layout.levelWidth);
			this.drawExpGauge(x, y + gaugeOffset, layout.levelWidth);
			x += layout.levelWidth + layout.spacing;

			this.drawHPText(x, y, layout.hpWidth);
			this.drawHPGauge(x, y + gaugeOffset, layout.hpWidth);
			this.drawMPGauge(x, y + gaugeOffset + gaugeHeight, layout.hpWidth);
			x += layout.hpWidth + layout.spacing;

			this.drawGoldText(x, y, layout.goldWidth);
			x += layout.goldWidth + layout.spacing;
		}

		InfoWindow.prototype.drawFloorText = function (x, y, width) {
			var text0 = this.getNumberText(this._floor || '-', params.floorNumLength);
			var text1 = params.floorUnit;
			var width0 = this.textWidth(text0);
			var width1 = this.textWidth(text1);
			var padding = this.textPadding();

			this.drawText(text0, x, y, width0, 'left');
			this.drawText(text1, x + width0 + padding, y, width1, 'left');
		}

		InfoWindow.prototype.drawLevelText = function (x, y, width) {
			var text0 = TextManager.levelA;
			var text1 = this.getNumberText(this._level, params.levelNumLength);
			var width0 = this.textWidth(text0);
			var width1 = this.textWidth(text1);
			var padding = this.textPadding();

			this.drawText(text0, x, y, width0, 'left');
			this.drawText(text1, x + width0 + padding, y, width1, 'left');
		}

		InfoWindow.prototype.drawExpGauge = function (x, y, width) {
			var rate = (this._mexp !== 0 ? (this._exp / this._mexp).clamp(0, 1) : 1);
			var color1 = this.tpGaugeColor1();
			var color2 = this.tpGaugeColor2();

			this.drawGauge(x, y, width, rate, color1, color2);
		}

		InfoWindow.prototype.drawHPText = function (x, y, width) {
			var text0 = TextManager.hpA;
			var text1 = this.getNumberText(this._hp, params.hpNumLength)
				+ params.hpSeparator
				+ this.getNumberText(this._mhp, params.hpNumLength);
			var width0 = this.textWidth(text0);
			var width1 = this.textWidth(text1);
			var padding = this.textPadding();

			this.drawText(text0, x, y, width0, 'left');
			this.drawText(text1, x + width0 + padding, y, width1, 'left');
		}

		InfoWindow.prototype.drawHPGauge = function (x, y, width) {
			var rate = (this._mhp !== 0 ? (this._hp / this._mhp).clamp(0, 1) : 0);
			var color1 = this.hpGaugeColor1();
			var color2 = this.hpGaugeColor2();

			this.drawGauge(x, y, width, rate, color1, color2);
		};

		InfoWindow.prototype.drawMPGauge = function (x, y, width) {
			var rate = (this._mmp !== 0 ? (this._mp / this._mmp).clamp(0, 1) : 0);
			var color1 = this.mpGaugeColor1();
			var color2 = this.mpGaugeColor2();

			this.drawGauge(x, y, width, rate, color1, color2);
		}

		InfoWindow.prototype.drawGoldText = function (x, y, width) {
			var text0 = this.getNumberText(this._gold, params.goldNumLength);
			var text1 = TextManager.currencyUnit;
			var width0 = this.textWidth(text0);
			var width1 = this.textWidth(text1);
			var padding = this.textPadding();

			this.drawText(text0, x, y, width0, 'left');
			this.drawText(text1, x + width0 + padding, y, width1, 'left');
		}

		InfoWindow.prototype.drawGauge = function (x, y, width, rate, color1, color2) {
			var filledAreaWidth = Math.floor(width * rate);
			var height = this.gaugeHeight();
			var background = this.gaugeBackColor();

			this.contents.fillRect(x, y, width, height, background);
			this.contents.gradientFillRect(x, y, filledAreaWidth, height, color1, color2);
		}

		InfoWindow.prototype.getFloorText = function () {
			return this.getNumberText(this._floor, params.floorNumLength) + params.floorUnit;
		}

		InfoWindow.prototype.getLevelText = function () {
			return TextManager.levelA + this.getNumberText(this._level, params.levelNumLength);
		}

		InfoWindow.prototype.getHPText = function () {
			return TextManager.hpA + this.getNumberText(this._hp, params.hpNumLength)
				+ params.hpSeparator + this.getNumberText(this._mhp, params.hpNumLength);
		}

		InfoWindow.prototype.getGoldText = function () {
			return this.getNumberText(this._gold, params.goldNumLength) + TextManager.currencyUnit;
		}

		InfoWindow.prototype.getNumberText = function (value, length) {
			var padding = '        ';
			return (padding + value).substr(-Math.min(padding.length, length));
		}

		return InfoWindow;
	});
});