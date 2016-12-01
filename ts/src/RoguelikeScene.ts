/*!
/*:
 * @plugindesc ローグライク：シーン
 * @author F_
 * 
 * @help
 * マップ画面をローグライクに変更するプラグイン。
 * 
 * Copyright (c) 2016 F_
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */

import { SceneRedirection } from 'SceneRedirection';
import { Camera, PlayerTarget } from 'ZoomExtension';
import { CommonEventManager, CommonEventTrigger } from 'EventExtension';
import { DarknessMode, DarkMapSpriteset } from 'DarknessEffect';

import { DungeonManager, Dungeon, Floor, Map, Cell, Room, TurnManager, TurnEventListener, DungeonStrategy, DungeonObjectFactory, DungeonMapArranger, Service } from 'Roguelike';
import { ResourceHelper, MapDungeonSource, MapFloorSource } from 'RoguelikeResource';

let plugin = MVPlugin.get(__moduleName);

declare global {
	interface Game_Player {
		reserveTransfer(mapId: number | string, x: number, y: number, d: number, fadeType: number): void;
	}
}

@plugin.type
export class DungeonSpriteset extends DarkMapSpriteset {
	protected createDarknessEffect() {
		super.createDarknessEffect();

		this.darknessColor = 'rgba(0,0,0,0.75)';
	}

	protected updateDarknessEffect() {
		let floor = DungeonManager.floor;
		if (floor) {
			let room = this.getCurrentRoom(floor);
			if (room) {
				let area = this.getRoomArea(room);
				this.darknessMode = DarknessMode.Area;
				this.darknessArea = area;
			} else {
				this.darknessMode = DarknessMode.Circle;
			}
		} else {
			this.darknessMode = DarknessMode.None;
		}

		super.updateDarknessEffect();
	}

	protected getCurrentRoom(floor: Floor): Room | null {
		let rooms = floor.map.rooms;
		let x = $gamePlayer.x;
		let y = $gamePlayer.y;
		for (let i = 0, length = rooms.length; i < length; i++) {
			if (rooms[i].contains(x, y)) {
				return rooms[i];
			}
		}

		return null;
	}

	protected getRoomArea(room: Room): Rectangle {
		let tileWidth = $gameMap.tileWidth();
		let tileHeight = $gameMap.tileHeight();

		let x = Math.round($gameMap.adjustX(room.x - 0.75) * tileWidth);
		let y = Math.round($gameMap.adjustY(room.y - 0.75) * tileHeight);
		let width = (room.width + 1.5) * tileWidth;
		let height = (room.height + 1.5) * tileHeight;

		return new Rectangle(x, y, width, height);
	}
}

export enum MapType {
	Normal,
	Dungeon,
	Floor,
}

@plugin.type
export class DungeonScene extends Scene_Map implements TurnEventListener {

	private static readonly invoker = (function () {
		let event = CommonEventManager.create();
		event.name = 'CallbackInvoker';
		event.trigger = CommonEventTrigger.None;
		return event;
	})();

	private _mapReady: boolean = false;
	private _mapType: MapType = MapType.Normal;

	public get mapType(): MapType { return this._mapType; }

	public createSpriteset(): void {
		this._spriteset = new DungeonSpriteset();
		this.addChild(this._spriteset);
	}

	public create(): void {
		if (!$gamePlayer.isTransferring() && DungeonManager.floor) {
			Scene_Base.prototype.create.call(this);
			this._transfer = false;
			this._mapLoaded = true;
			this._mapType = MapType.Floor;
		} else {
			super.create();
		}
	}

	public isReady(): boolean {
		if (!this._mapLoaded && DataManager.isMapLoaded()) {
			this.onMapLoaded();
			this._mapLoaded = true;
		}

		if (this._mapLoaded) {
			if (!this._mapReady && DungeonManager.context.ready) {
				this.onMapReady();
				this._mapReady = true;
			}
		}

		return this._mapReady && Scene_Base.prototype.isReady.call(this);
	}

	public onMapLoaded(): void {
		let map = <MV.Map>$dataMap;
		if (ResourceHelper.isDungeonMap(map)) {
			this.onDungeonMapLoaded();
			this._mapType = MapType.Dungeon;
		} else if (ResourceHelper.isFloorMap(map)) {
			this.onFloorMapLoaded();
			this._mapType = MapType.Floor;
		} else {
			this.onNormalMapLoaded();
			this._mapType = MapType.Normal;
		}
	}

	public start(): void {
		super.start();

		this.setupCamera();

		if (this.mapType === MapType.Floor) {
			TurnManager.addEventListener(this);

			if (this._transfer) {
				TurnManager.start();
			}
		}
	}

	public startFadeIn(duration: number, white?: boolean): void {
		if (this.mapType !== MapType.Dungeon) {
			super.startFadeIn(duration, white);
		}
	}

	public startFadeOut(duration: number, white?: boolean): void {
		if (this.mapType !== MapType.Dungeon) {
			super.startFadeOut(duration, white);
		}
	}

	public terminate(): void {
		super.terminate();

		if (this.mapType === MapType.Floor) {
			if ($gamePlayer.isTransferring()) {
				TurnManager.end();
			}

			TurnManager.removeEventListener(this);
		}
	}

	public updateMain(): void {
		if (this.mapType === MapType.Floor) {
			if (this.isActive()) this.updateDungeon();
		}

		super.updateMain();
	}

	public onEnterFloor(): void {
		let strategy = Service.get<DungeonStrategy>(DungeonStrategy);
		let factory = Service.get<DungeonObjectFactory>(DungeonObjectFactory);
		let floor = <Floor>DungeonManager.floor;

		factory.bind(floor);
		strategy.start(floor, factory);
		factory.unbind();

		//$gameMap.requestRefresh();
	}

	public onExitFloor(): void {
		DungeonManager.deleteFloor();
	}

	public onStartTurn(): void {
		let strategy = Service.get<DungeonStrategy>(DungeonStrategy);
		let factory = Service.get<DungeonObjectFactory>(DungeonObjectFactory);
		let floor = <Floor>DungeonManager.floor;

		factory.bind(floor);
		strategy.update(floor, factory);
		factory.unbind();
	}

	public onEndTurn(): void {

	}

	protected onNormalMapLoaded(): void { }

	protected onDungeonMapLoaded(): void {
		if ($gamePlayer.isTransferring()) {
			let map = <MV.Map>$dataMap;
			let mapID = $gamePlayer.newMapId();
			let depth = $gamePlayer._newX + $gamePlayer._newY * map.width;

			let source = new MapDungeonSource(mapID);
			source.set(map);
			DungeonManager.createDungeon(source, depth);
		}
	}

	protected onFloorMapLoaded(): void {
		if ($gamePlayer.isTransferring()) {
			let map = <MV.Map>$dataMap;
			let mapID = $gamePlayer.newMapId();

			let source = new MapFloorSource(mapID);
			source.set(map);
			DungeonManager.createFloor(source);
		}
	}

	protected onMapReady(): void {
		switch (this.mapType) {
			case MapType.Normal:
				this.onNormalMapReady();
				break;
			case MapType.Dungeon:
				this.onDungeonMapReady();
				break;
			case MapType.Floor:
				this.onFloorMapReady();
				break;
		}

		Scene_Map.prototype.onMapLoaded.call(this);
	}

	protected onNormalMapReady(): void { }

	protected onDungeonMapReady(): void {
		let dungeon = <Dungeon>DungeonManager.dungeon;
		let callback = dungeon.spec.callbacks[0];
		if (callback) {
			let invoker = DungeonScene.invoker;
			invoker.list = callback;
			$gameTemp.reserveCommonEvent(invoker.id);
		}
	}

	protected onFloorMapReady(): void {
		if ($gamePlayer.isTransferring()) {
			let floor = <Floor>DungeonManager.floor;
			let mapID = floor.spec.id;
			$gamePlayer.reserveTransfer(mapID, 0, 0, 2, $gamePlayer.fadeType());;
		}

		$dataMap = this.arrangeMap();
	}

	protected arrangeMap(): MV.Map {
		let arranger = Service.get<DungeonMapArranger>(DungeonMapArranger);
		let floor = <Floor>DungeonManager.floor;
		let dataMap = arranger.arrange(floor);

		return dataMap;
	}

	protected setupCamera(): void {
		if (this.mapType === MapType.Floor) {
			$gameScreen.camera = new Camera(new PlayerTarget(), 0, 0, 2, true);
		} else {
			$gameScreen.camera = null;
		}
	}

	protected updateDungeon(): void {
		if ($gamePlayer.canMove()) {
			TurnManager.next();
		}
	}
}

SceneRedirection.set(Scene_Map, DungeonScene);