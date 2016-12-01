/*!
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

let plugin = MVPlugin.get(__moduleName);

@plugin.type
export class DarknessBitmap extends Bitmap {

	public drawCircleShade(offset: number, startColor: string, endColor: string): void {
		offset = (+offset).clamp(0, 1);

		let radius = Math.max(this.width, this.height) * 0.5;

		let context = this._context;
		context.save();
		let gradient = context.createRadialGradient(radius, radius, radius * offset, radius, radius, radius);
		gradient.addColorStop(0, startColor);
		gradient.addColorStop(1, endColor);
		context.fillStyle = gradient;
		context.globalCompositeOperation = 'copy';
		context.fillRect(0, 0, this.width, this.height);
		context.restore();
		this._setDirty();
	}

	public drawLineShade(offset: number, startColor: string, endColor: string): void {
		offset = (+offset).clamp(0, 1);

		let size = Math.max(this.width, this.height);

		let context = this._context;
		context.save();
		let gradient = context.createLinearGradient(size * offset, 0, size, 0);
		gradient.addColorStop(0, startColor);
		gradient.addColorStop(1, endColor);
		context.fillStyle = gradient;
		context.globalCompositeOperation = 'copy';
		context.fillRect(0, 0, this.width, this.height);
		context.restore();
		this._setDirty();
	}

	public drawCornerShade(offset: number, startColor: string, endColor: string): void {
		offset = (+offset).clamp(0, 1);

		let radius = Math.max(this.width, this.height);

		let context = this._context;
		context.save();
		let gradient = context.createRadialGradient(0, 0, radius * offset, 0, 0, radius);
		gradient.addColorStop(0, startColor);
		gradient.addColorStop(1, endColor);
		context.fillStyle = gradient;
		context.globalCompositeOperation = 'copy';
		context.fillRect(0, 0, this.width, this.height);
		context.restore();
		this._setDirty();
	}
}

@plugin.type
export abstract class SightSprite extends Sprite {
	public constructor(range?: number, color?: string, innerColor?: string) {
		super();

		this._dirty = Object.create(null);

		this.range = (range != null ? range : 0.5);
		this.color = <string>color;
		this.innerColor = <string>innerColor;

		this._fillingSprites = SightSprite.createFillingSprite();
		this._fillingSprites.forEach(function (this: SightSprite, sprite: Sprite) {
			this.addChild(sprite);
		}, this);
	}

	protected _dirty: { [name: string]: boolean | undefined };
	protected _fillingSprites: Sprite[];

	private _range: number;
	private _color: string;
	private _innerColor: string;

	public get range(): number { return this._range; }
	public set range(value: number) {
		value = (+value).clamp(0, 1);
		if (this._range !== value) {
			this._range = value;
			this._dirty['range'] = true;
		}
	}

	public get color(): string { return this._color; }
	public set color(value: string) {
		value = value || 'rgba(0,0,0,1)';
		if (this._color !== value) {
			this._color = value;
			this._dirty['color'] = true;
		}
	}

	public get innerColor(): string { return this._innerColor; }
	public set innerColor(value: string) {
		value = value || 'rgba(0,0,0,0)';
		if (this._innerColor !== value) {
			this._innerColor = value;
			this._dirty['innerColor'] = true;
		}
	}

	public update(): void {
		super.update();

		if (Object.keys(this._dirty).length !== 0) {
			this.updateImage();
			this._dirty = Object.create(null);
		}
		this.updateRange();
	}

	protected updateImage(): void {
		this.updateFillingImage();
	}

	protected updateFillingImage(): void {
		if (this._dirty['color']) {
			let bitmap = new Bitmap(1, 1);
			bitmap.fillAll(this.color);

			let sprites = this._fillingSprites;
			sprites.forEach(sprite => {
				sprite.bitmap = bitmap;
				sprite.setFrame(0, 0, bitmap.width, bitmap.height);
			});
		}
	}

	protected abstract updateRange(): void;

	protected updateFillingSprite(left: number, top: number, right: number, bottom: number): void {
		let sprites = this._fillingSprites;
		sprites[0].x = left;
		sprites[0].y = bottom;
		sprites[1].x = left;
		sprites[1].y = top;
		sprites[2].x = right;
		sprites[2].y = top;
		sprites[3].x = right;
		sprites[3].y = bottom;
	}

	private static createFillingSprite(): Sprite[] {
		let width = Graphics.width * 5;
		let height = Graphics.height * 5;
		let anchors = [
			{ x: 1, y: 1 },
			{ x: 0, y: 1 },
			{ x: 0, y: 0 },
			{ x: 1, y: 0 },
		];

		let sprites = <Sprite[]>[];
		for (let i = 0; i < 4; i++) {
			let sprite = new Sprite();
			sprite.anchor.x = anchors[i].x;
			sprite.anchor.y = anchors[i].y;
			sprite.x = 0;
			sprite.y = 0;
			sprite.scale.x = width;
			sprite.scale.y = height;
			sprites.push(sprite);
		}

		return sprites;
	}
}

@plugin.type
export class CircleSightSprite extends SightSprite {
	public constructor(radius: number, range?: number, color?: string, innerColor?: string) {
		super(range, color, innerColor);

		this.radius = radius;
		this._circleSprite = CircleSightSprite.createCircleSprite();

		this.addChild(this._circleSprite);
	}

	protected _circleSprite: Sprite;

	private _radius: number;

	public get radius(): number { return this._radius; }
	public set radius(value: number) {
		value = Math.max(1, value | 0);
		if (this._radius !== value) {
			this._radius = value;
			this._dirty['radius'] = true;
		}
	}

	protected updateImage(): void {
		super.updateImage();

		this.updateCircleImage();
	}

	protected updateCircleImage(): void {
		if (this._dirty['radius'] || this._dirty['range'] || this._dirty['color'] || this._dirty['innerColor']) {
			let size = this.radius * 2;
			let bitmap = new DarknessBitmap(size, size);
			bitmap.smooth = true;
			bitmap.drawCircleShade(1 - this.range, this.innerColor, this.color);

			let sprite = this._circleSprite;
			sprite.bitmap = bitmap;
			sprite.setFrame(0, 0, bitmap.width, bitmap.height);
		}
	}

	protected updateRange(): void {
		let radius = this.radius;
		this.updateFillingSprite(-radius, -radius, radius, radius);
	}

	private static createCircleSprite(): Sprite {
		let sprite = new Sprite();
		sprite.anchor.x = 0.5;
		sprite.anchor.y = 0.5;

		return sprite;
	}
}

@plugin.type
export class AreaSightSprite extends SightSprite {
	public constructor(areaWidth: number, areaHeight: number, radius: number, range?: number, color?: string, innerColor?: string) {
		super(range, color, innerColor);

		this.areaWidth = areaWidth;
		this.areaHeight = areaHeight;
		this.radius = radius;

		this._cornerSprites = AreaSightSprite.createCornerSprites();
		this._lineSprites = AreaSightSprite.createLineSprites();
		this._squareSprite = AreaSightSprite.createSquareSprite();

		this._cornerSprites.forEach(function (this: AreaSightSprite, sprite: Sprite) {
			this.addChild(sprite);
		}, this);
		this._lineSprites.forEach(function (this: AreaSightSprite, sprite: Sprite) {
			this.addChild(sprite);
		}, this);
		this.addChild(this._squareSprite);
	}

	protected _cornerSprites: Sprite[];
	protected _lineSprites: Sprite[];
	protected _squareSprite: Sprite;

	private _areaWidth: number;
	private _areaHeight: number;
	private _radius: number;

	public get areaWidth(): number { return this._areaWidth; }
	public set areaWidth(value: number) { this._areaWidth = Math.max(1, value | 0); }

	public get areaHeight(): number { return this._areaHeight; }
	public set areaHeight(value: number) { this._areaHeight = Math.max(1, value | 0); }

	public get radius(): number { return this._radius; }
	public set radius(value: number) {
		value = Math.max(1, value | 0);
		if (this._radius !== value) {
			this._radius = value;
			this._dirty['radius'] = true;
		}
	}

	protected updateImage(): void {
		super.updateImage();

		this.updateAreaImages();
	}

	protected updateAreaImages(): void {
		if (this._dirty['radius'] || this._dirty['range'] || this._dirty['color'] || this._dirty['innerColor']) {
			let corner = new DarknessBitmap(this.radius, this.radius);
			corner.smooth = true;
			corner.drawCornerShade(1 - this.range, this.innerColor, this.color);

			let line = new DarknessBitmap(this.radius, 1);
			line.smooth = true;
			line.drawLineShade(1 - this.range, this.innerColor, this.color);

			let square = new Bitmap(1, 1);
			square.fillAll(this.innerColor);

			for (let i = 0; i < 4; i++) {
				let cornerSprite = this._cornerSprites[i];
				cornerSprite.bitmap = corner;
				cornerSprite.setFrame(0, 0, corner.width, corner.height);

				let lineSprite = this._lineSprites[i];
				lineSprite.bitmap = line;
				lineSprite.setFrame(0, 0, line.width, line.height);
			}
			let squareSprite = this._squareSprite;
			squareSprite.bitmap = square;
			squareSprite.setFrame(0, 0, square.width, square.height);
		}
	}

	protected updateRange(): void {
		this.updateAreaSprite();
		this.updateFillingSprite(0, 0, this.areaWidth, this.areaHeight);
	}

	protected updateAreaSprite(): void {
		let radius = this.radius;
		let width = this.areaWidth;
		let height = this.areaHeight;
		let intervalH = Math.max(0, width - radius * 2);
		let intervalV = Math.max(0, height - radius * 2);

		let corners = this._cornerSprites;
		let lines = this._lineSprites;
		let square = this._squareSprite;

		corners[0].x = width;
		corners[0].y = height;
		lines[0].x = width;
		lines[0].y = height - radius;
		lines[0].scale.y = intervalV;

		corners[1].x = 0;
		corners[1].y = height;
		lines[1].x = radius;
		lines[1].y = height;
		lines[1].scale.y = intervalH;

		corners[2].x = 0;
		corners[2].y = 0;
		lines[2].x = 0;
		lines[2].y = radius;
		lines[2].scale.y = intervalV;

		corners[3].x = width;
		corners[3].y = 0;
		lines[3].x = width - radius;
		lines[3].y = 0;
		lines[3].scale.y = intervalH;

		square.x = radius;
		square.y = radius;
		square.scale.x = intervalH;
		square.scale.y = intervalV;
	}

	private static createCornerSprites(): Sprite[] {
		let sprites = <Sprite[]>[];
		for (let i = 0; i < 4; i++) {
			let sprtie = new Sprite();
			sprtie.anchor.x = 1;
			sprtie.anchor.y = 1;
			sprtie.rotation = i * Math.PI * 0.5;
			sprites.push(sprtie);
		}
		return sprites;
	}

	private static createLineSprites(): Sprite[] {
		let sprites = <Sprite[]>[];
		for (let i = 0; i < 4; i++) {
			let sprite = new Sprite();
			sprite.anchor.x = 1;
			sprite.anchor.y = 1;;
			sprite.rotation = i * Math.PI * 0.5;
			sprites.push(sprite);
		}
		return sprites;
	}

	private static createSquareSprite(): Sprite {
		let sprite = new Sprite();
		return sprite;
	}
}

export enum DarknessMode {
	None,
	Circle,
	Area,
}

@plugin.type
export class DarkMapSpriteset extends Spriteset_Map {
	protected _circleSight: CircleSightSprite;
	protected _areaSight: AreaSightSprite;

	private _darknessMode: DarknessMode;
	private _darknessArea: Rectangle;
	private _darknessRange: number;
	private _darknaesColor: string;
	private _darknessInnerColor: string;

	public get darknessMode(): DarknessMode { return this._darknessMode; }
	public set darknessMode(value: DarknessMode) { this._darknessMode = value; }

	public get darknessArea(): Rectangle { return this._darknessArea; }
	public set darknessArea(value: Rectangle) { this._darknessArea = value; }

	public get darknessRange(): number { return this._darknessRange; }
	public set darknessRange(value: number) {
		this._circleSight.range = this._areaSight.range = this._darknessRange = value;
	}

	public get darknessColor(): string { return this._darknaesColor; }
	public set darknessColor(value: string) {
		this._circleSight.color = this._areaSight.color = this._darknaesColor = value;
	}

	public get darknessInnerColor(): string { return this._darknessInnerColor; }
	public set darknessInnerColor(value: string) {
		this._circleSight.innerColor = this._areaSight.innerColor = this._darknessInnerColor = value;
	}

	public createUpperLayer(): void {
		super.createUpperLayer();

		this.createDarknessEffect();
	}

	public update(): void {
		super.update();

		this.updateDarknessEffect();
	}

	protected createDarknessEffect(): void {
		let tileSize = Math.min($gameMap.tileWidth(), $gameMap.tileHeight());
		let radius = tileSize * 1.5;

		this._circleSight = new CircleSightSprite(radius);
		this._circleSight.z = 6.5;
		this._tilemap.addChild(this._circleSight);

		this._areaSight = new AreaSightSprite(0, 0, tileSize);
		this._areaSight.z = 6.5;
		this._tilemap.addChild(this._areaSight);

		this._darknessMode = DarknessMode.None;
		this._darknessArea = new Rectangle(0, 0, Graphics.width, Graphics.height);
	}

	protected updateDarknessEffect() {
		let circle = <CircleSightSprite>this._circleSight;
		let area = <AreaSightSprite>this._areaSight;

		circle.visible = false;
		area.visible = false;

		if (this._darknessMode === DarknessMode.Circle) {
			circle.x = $gamePlayer.screenX();
			circle.y = $gamePlayer.screenY() - $gameMap.tileHeight() * 0.5;
			circle.visible = true;
		} else if (this._darknessMode === DarknessMode.Area) {
			let rect = this._darknessArea;
			area.x = rect.x;
			area.y = rect.y;
			area.areaWidth = rect.width;
			area.areaHeight = rect.height;
			area.visible = true;
		}
	}
}
