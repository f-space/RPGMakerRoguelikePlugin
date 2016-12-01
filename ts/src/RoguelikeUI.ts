/*!
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
 * @param DefinitionOnly
 * @desc 定義以外の処理をスキップするかどうか。
 * @default false
 * 
 * @param ChangeMapNamePosition
 * @desc マップ名の表示位置を変更するかどうか。
 * @default true
 * 
 * @help
 * 現在情報をマップ画面に表示するためのプラグイン。
 * 
 * Copyright (c) 2016 F_
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */

import { DungeonManager } from 'Roguelike';

let plugin = MVPlugin.get(__moduleName);
let params = plugin.validate($ => {
	let marginRegex = /(?:^\s*|\s+)(\d+)(?:px)?(?=\s+|\s*$)/g;
	let match = $.string('Margin').match(marginRegex);
	let margin = (match && match.map(x => parseInt(x, 10))) || [];
	if (margin.length === 0) margin.push(0);
	if (margin.length === 1) margin.push(margin[0]);
	if (margin.length === 2) margin.push(margin[0]);
	if (margin.length === 3) margin.push(margin[1]);

	return {
		marginTop: margin[0],
		marginRight: margin[1],
		marginBottom: margin[2],
		marginLeft: margin[3],
		floorUnit: $.string('FloorUnit'),
		hpSeparator: $.string('HPSeparator'),
		floorNumLength: String($.int('MaxFloor')).length,
		levelNumLength: String($.int('MaxLevel')).length,
		hpNumLength: String($.int('MaxHP')).length,
		goldNumLength: String($.int('MaxGold')).length,
		definitionOnly: $.bool('DefinitionOnly'),
		changeMapNamePosition: $.bool('ChangeMapNamePosition'),
	};
});

declare global {
	interface Scene_Map {
		_infoWindow?: InfoWindow;

		createInfoWindow(): void;
	}
}

interface Layout {
	floorWidth: number;
	levelWidth: number;
	hpWidth: number;
	goldWidth: number;
	offsetX: number;
	offsetY: number;
	spacing: number;
}

@plugin.type
export class InfoWindow extends Window_Base {
	public constructor() {
		super(0, 0, InfoWindow.width, InfoWindow.height);

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

	private _floor: number = 0;
	private _level: number = 0;
	private _exp: number = 0;
	private _mexp: number = 0;
	private _hp: number = 0;
	private _mhp: number = 0;
	private _mp: number = 0;
	private _mmp: number = 0;
	private _gold: number = 0;

	public static get width(): number { return this.prototype.windowWidth(); }
	public static get height(): number { return this.prototype.windowHeight(); }

	public windowWidth(): number {
		return Graphics.boxWidth;
	}

	public windowHeight(): number {
		return this.fittingHeight(1)
			+ (this.gaugeSpacing() + this.gaugeHeight()) * 2
			+ (params.marginTop + params.marginBottom);
	}

	public standardFontSize(): number {
		return 42;
	}

	public standardPadding(): number {
		return 0;
	}

	public textPadding(): number {
		return 8;
	}

	public update(): void {
		Window_Base.prototype.update.call(this);

		let dirty = false;

		let dungeon = DungeonManager.dungeon;
		let floor = (dungeon && dungeon.depth) || 0;
		if (this._floor !== floor) {
			this._floor = floor;
			dirty = true;
		}

		if ($gameParty) {
			let actor = $gameParty.leader();

			let level = actor.level;
			if (this._level !== level) {
				this._level = level;
				dirty = true;
			}

			let exp = (actor.isMaxLevel() ? 0 : actor.currentExp());
			if (this._exp !== exp) {
				this._exp = exp;
				dirty = true;
			}

			let mexp = (actor.isMaxLevel() ? 0 : actor.nextRequiredExp());
			if (this._mexp !== mexp) {
				this._mexp = mexp;
				dirty = true;
			}

			let hp = actor.hp;
			if (this._hp !== hp) {
				this._hp = hp;
				dirty = true;
			}

			let mhp = actor.mhp;
			if (this._mhp !== mhp) {
				this._mhp = mhp;
				dirty = true;
			}

			let mp = actor.mp;
			if (this._mp !== mp) {
				this._mp = mp;
				dirty = true;
			}

			let mmp = actor.mmp;
			if (this._mmp !== mmp) {
				this._mmp = mmp;
				dirty = true;
			}

			let gold = $gameParty.gold();
			if (this._gold !== gold) {
				this._gold = gold;
				dirty = true;
			}
		}

		if (dirty) this.refresh();
	}

	public refresh(): void {
		this.contents.clear();

		let layout = this.measureInfoText();
		this.drawInfoText(layout);
	}

	protected gaugeSpacing(): number {
		return 4;
	}

	protected gaugeHeight(): number {
		return 8;
	}

	protected measureInfoText(): Layout {
		let floorWidth = this.measureFloorText();
		let levelWidth = this.measureLevelText();
		let hpWidth = this.measureHPText();
		let goldWidth = this.measureGoldText();

		let width = this.contents.width;
		let totalWidth = floorWidth + levelWidth + hpWidth + goldWidth;
		let horizontalMargin = params.marginLeft + params.marginRight;
		let space = width - totalWidth - horizontalMargin;

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

	protected measureFloorText(): number {
		let width = 0;
		width += this.measureNumberText(params.floorNumLength);
		width += this.textPadding();
		width += this.textWidth(params.floorUnit);
		return width;
	}

	protected measureLevelText(): number {
		let width = 0;
		width += this.textWidth(TextManager.levelA);
		width += this.textPadding();
		width += this.measureNumberText(params.levelNumLength);
		return width;
	}

	protected measureHPText(): number {
		let width = 0;
		width += this.textWidth(TextManager.hpA);
		width += this.textPadding();
		width += this.measureNumberText(params.hpNumLength) * 2;
		width += this.textWidth(params.hpSeparator);
		return width;
	}

	protected measureGoldText(): number {
		let width = 0;
		width += this.measureNumberText(params.goldNumLength);
		width += this.textPadding();
		width += this.textWidth(TextManager.currencyUnit);
		return width;
	}

	protected measureNumberText(length: number): number {
		return this.textWidth('0') * length;
	}

	protected drawInfoText(layout: Layout): void {
		let x = layout.offsetX;
		let y = layout.offsetY;
		let gaugeOffset = this.lineHeight() + this.gaugeSpacing();
		let gaugeHeight = this.gaugeHeight() + this.gaugeSpacing();

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

	protected drawFloorText(x: number, y: number, width: number): void {
		let text0 = this.getNumberText(this._floor || '-', params.floorNumLength);
		let text1 = params.floorUnit;
		let width0 = this.textWidth(text0);
		let width1 = this.textWidth(text1);
		let padding = this.textPadding();

		this.drawText(text0, x, y, width0, 'left');
		this.drawText(text1, x + width0 + padding, y, width1, 'left');
	}

	protected drawLevelText(x: number, y: number, width: number): void {
		let text0 = TextManager.levelA;
		let text1 = this.getNumberText(this._level, params.levelNumLength);
		let width0 = this.textWidth(text0);
		let width1 = this.textWidth(text1);
		let padding = this.textPadding();

		this.drawText(text0, x, y, width0, 'left');
		this.drawText(text1, x + width0 + padding, y, width1, 'left');
	}

	protected drawExpGauge(x: number, y: number, width: number): void {
		let rate = (this._mexp !== 0 ? (this._exp / this._mexp).clamp(0, 1) : 1);
		let color1 = this.tpGaugeColor1();
		let color2 = this.tpGaugeColor2();

		this.drawInfoGauge(x, y, width, rate, color1, color2);
	}

	protected drawHPText(x: number, y: number, width: number): void {
		let text0 = TextManager.hpA;
		let text1 = this.getNumberText(this._hp, params.hpNumLength)
			+ params.hpSeparator
			+ this.getNumberText(this._mhp, params.hpNumLength);
		let width0 = this.textWidth(text0);
		let width1 = this.textWidth(text1);
		let padding = this.textPadding();

		this.drawText(text0, x, y, width0, 'left');
		this.drawText(text1, x + width0 + padding, y, width1, 'left');
	}

	protected drawHPGauge(x: number, y: number, width: number): void {
		let rate = (this._mhp !== 0 ? (this._hp / this._mhp).clamp(0, 1) : 0);
		let color1 = this.hpGaugeColor1();
		let color2 = this.hpGaugeColor2();

		this.drawInfoGauge(x, y, width, rate, color1, color2);
	};

	protected drawMPGauge(x: number, y: number, width: number): void {
		let rate = (this._mmp !== 0 ? (this._mp / this._mmp).clamp(0, 1) : 0);
		let color1 = this.mpGaugeColor1();
		let color2 = this.mpGaugeColor2();

		this.drawInfoGauge(x, y, width, rate, color1, color2);
	}

	protected drawGoldText(x: number, y: number, width: number): void {
		let text0 = this.getNumberText(this._gold, params.goldNumLength);
		let text1 = TextManager.currencyUnit;
		let width0 = this.textWidth(text0);
		let width1 = this.textWidth(text1);
		let padding = this.textPadding();

		this.drawText(text0, x, y, width0, 'left');
		this.drawText(text1, x + width0 + padding, y, width1, 'left');
	}

	protected drawInfoGauge(x: number, y: number, width: number, rate: number, color1: string, color2: string): void {
		let filledAreaWidth = Math.floor(width * rate);
		let height = this.gaugeHeight();
		let background = this.gaugeBackColor();

		this.contents.fillRect(x, y, width, height, background);
		this.contents.gradientFillRect(x, y, filledAreaWidth, height, color1, color2);
	}

	protected getFloorText(): string {
		return this.getNumberText(this._floor, params.floorNumLength) + params.floorUnit;
	}

	protected getLevelText(): string {
		return TextManager.levelA + this.getNumberText(this._level, params.levelNumLength);
	}

	protected getHPText(): string {
		return TextManager.hpA + this.getNumberText(this._hp, params.hpNumLength)
			+ params.hpSeparator + this.getNumberText(this._mhp, params.hpNumLength);
	}

	protected getGoldText(): string {
		return this.getNumberText(this._gold, params.goldNumLength) + TextManager.currencyUnit;
	}

	protected getNumberText(value: number | string, length: number): string {
		let padding = '        ';
		return (padding + value).substr(-Math.min(padding.length, length));
	}
}

@MVPlugin.extensionIf(Scene_Map, !params.definitionOnly)
export class SceneMapExtensions {
	private constructor() { throw new Error(System.ErrorMessages.NEW_STATIC_CLASS); }

	@MVPlugin.method
	public static createAllWindows(base: Function) {
		return function (this: Scene_Map) {
			base.call(this);

			this.createInfoWindow();
		};
	}

	@MVPlugin.method
	public static createInfoWindow() {
		return function (this: Scene_Map) {
			this._infoWindow = new InfoWindow();
			this.addWindow(this._infoWindow);
		};
	}

	@MVPlugin.methodIf(params.changeMapNamePosition)
	public static createMapNameWindow(base: Function) {
		return function (this: Scene_Map) {
			base.call(this);

			let mapNameWindow = <Window_MapName>this._mapNameWindow;
			let width = mapNameWindow.width;
			let height = mapNameWindow.height;
			let x = Graphics.boxWidth - width;
			let y = Graphics.boxHeight - height;
			mapNameWindow.move(x, y, width, height);
		};
	}
}