/*!
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

let plugin = MVPlugin.get(__moduleName);

declare global {
	interface Game_Screen {
		camera: Camera | null;
		_camera: Camera | null | undefined;
	}
}

@plugin.type
export class Camera implements System.Serializable {
	public constructor(target?: CameraTarget | null, offsetX?: number, offsetY?: number, scale?: number, bounded?: boolean) {
		this.target = target || null;
		this.offsetX = offsetX || 0;
		this.offsetY = offsetY || 0;
		this.scale = scale || 1;
		this.bounded = !!bounded;
	}

	public target: CameraTarget | null;
	public offsetX: number;
	public offsetY: number;
	public scale: number;
	public bounded: boolean;

	public get x(): number { return (this.target ? this.target.x : 0) + this.offsetX; }
	public get y(): number { return (this.target ? this.target.y : 0) + this.offsetY; }

	public toJSON(): any {
		return {
			target: this.target,
			offsetX: this.offsetX,
			offsetY: this.offsetY,
			scale: this.scale,
			bounded: this.bounded,
		}
	}

	public fromJSON(data: any): void {
		this.target = data.target;
		this.offsetX = data.offsetX;
		this.offsetY = data.offsetY;
		this.scale = data.scale;
		this.bounded = data.bounded;
	}
}

export interface CameraTarget extends System.Serializable {
	readonly x: number;
	readonly y: number;
}

@plugin.type
export class FixedTarget implements CameraTarget {
	public constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
	}

	public x: number;
	public y: number;

	public toJSON(): any {
		return { x: this.x, y: this.y };
	}

	public fromJSON(data: any): void {
		this.x = data.x; this.y = data.y;
	}
}

@plugin.type
export class TileTarget implements CameraTarget {
	public constructor(tileX: number, tileY: number) {
		this.tileX = tileX;
		this.tileY = tileY;
	}

	public tileX: number;
	public tileY: number;

	public get x(): number {
		let x = $gameMap.adjustX(this.tileX);
		let w = $gameMap.tileWidth();
		return Math.round((x + 0.5) * w);
	}

	public get y(): number {
		let y = $gameMap.adjustY(this.tileY);
		let h = $gameMap.tileHeight();
		return Math.round((y + 0.5) * h);
	}
}

@plugin.type
export class PlayerTarget implements CameraTarget {
	public get x(): number { return $gamePlayer.screenX(); }
	public get y(): number { return $gamePlayer.screenY(); }

	public toJSON(): any { return {}; }
	public fromJSON(data: any): void { }
}

function screenCenterX() {
	return Graphics.width * 0.5;
}

function screenCenterY() {
	return Graphics.height * 0.5;
}

class Zoom {
	public constructor(public x: number, public y: number, public scale: number, bounded?: boolean) {
		if (bounded) this.adjust();
	}

	public static get normal(): Zoom {
		let x = $gameScreen.zoomX();
		let y = $gameScreen.zoomY();
		let scale = $gameScreen.zoomScale();
		return new Zoom(x, y, scale);
	}

	public static get camera(): Zoom | null {
		let camera = $gameScreen.camera;
		return (camera ? new Zoom(camera.x, camera.y, camera.scale, camera.bounded) : null);
	}

	public static get complex(): Zoom {
		let normalZoom = Zoom.normal;
		let cameraZoom = Zoom.camera;

		let scale = normalZoom.scale;
		let x = normalZoom.x * (1 - scale);
		let y = normalZoom.y * (1 - scale);
		if (cameraZoom) {
			let cscale = cameraZoom.scale;
			let cx = screenCenterX() - cameraZoom.x * cscale;
			let cy = screenCenterY() - cameraZoom.y * cscale;

			scale = scale * cscale;
			x = x * cscale + cx;
			y = y * cscale + cy;
		}

		return new Zoom(x, y, scale);
	}

	public adjust(): void {
		if (this.scale < 1) {
			this.x = screenCenterX();
			this.y = screenCenterY();
		} else {
			let map = $gameMap;

			let halfScreenWidth = screenCenterX() / this.scale;
			let halfScreenHeight = screenCenterY() / this.scale;
			let displayX = map.displayX();
			let displayY = map.displayY();
			let tileWidth = map.tileWidth();
			let tileHeight = map.tileHeight();

			let left = displayX + (this.x - halfScreenWidth) / tileWidth;
			if (left <= 0) {
				this.x = halfScreenWidth;
			} else {
				let right = displayX + (this.x + halfScreenWidth) / tileWidth;
				if (right >= map.width()) {
					this.x = screenCenterX() * 2 - halfScreenWidth;
				}
			}

			let top = displayY + (this.y - halfScreenHeight) / tileHeight;
			if (top <= 0) {
				this.y = halfScreenHeight;
			} else {
				let bottom = displayY + (this.y + halfScreenHeight) / tileHeight;
				if (bottom >= map.height()) {
					this.y = screenCenterY() * 2 - halfScreenHeight;
				}
			}
		}
	}
}

@MVPlugin.extension(Game_Screen)
export class GameScreenExtensions {
	@MVPlugin.property
	public static get camera(this: Game_Screen): Camera | null { return this._camera || null; }
	public static set camera(this: Game_Screen, value: Camera | null) { this._camera = value; }
}

@MVPlugin.extension(Game_Map)
export class GameMapExtensions {
	@MVPlugin.method
	public static canvasToMapX(base: Function) {
		return function (this: Game_Map, x: number): number {
			let zoom = Zoom.camera;
			if (zoom) {
				x = zoom.x + (x - screenCenterX()) / zoom.scale;
			}

			return base.call(this, x);
		}
	}

	@MVPlugin.method
	public static canvasToMapY(base: Function) {
		return function (this: Game_Map, y: number): number {
			let zoom = Zoom.camera;
			if (zoom) {
				y = zoom.y + (y - screenCenterY()) / zoom.scale;
			}

			return base.call(this, y);
		}
	}
}

@MVPlugin.extension(Game_CharacterBase)
export class GameCharacterBaseExtensions {
	@MVPlugin.method
	public static isNearTheScreen(base: Function) {
		return function (this: Game_CharacterBase): boolean {
			let camera = $gameScreen.camera;
			let scale = camera ? camera.scale : 1;

			let gw = Graphics.width / scale;
			let gh = Graphics.height / scale;
			let tw = $gameMap.tileWidth();
			let th = $gameMap.tileHeight();
			let px = this.scrolledX() * tw + tw / 2 - gw / 2;
			let py = this.scrolledY() * th + th / 2 - gh / 2;
			return px >= -gw && px <= gw && py >= -gh && py <= gh;
		}
	}
}

@MVPlugin.extension(Spriteset_Map)
export class SpritesetMapExtensions {
	@MVPlugin.method
	public static updatePosition(base: Function) {
		return function (this: Spriteset_Map): void {
			let zoom = Zoom.complex;
			this.scale.x = zoom.scale;
			this.scale.y = zoom.scale;
			this.x = Math.round(zoom.x);
			this.y = Math.round(zoom.y);
			this.x += Math.round($gameScreen.shake());
		}
	}
}