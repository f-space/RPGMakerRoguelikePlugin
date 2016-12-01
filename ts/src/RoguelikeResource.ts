/*!
/*:
 * @plugindesc ローグライク：リソース管理
 * @author F_
 * 
 * @param DungeonMapTag
 * @desc ダンジョンを示すメタデータのタグ。
 * @default blueprint
 * 
 * @param FloorMapTag
 * @desc フロアを示すメタデータのタグ。
 * @default dungeon
 * 
 * @param FloorTileTag
 * @desc 床タイルを示すメタデータのタグ。
 * @default floor
 * 
 * @param WallTileTag
 * @desc 壁タイルを示すメタデータのタグ。
 * @default wall
 * 
 * @param StairsTag
 * @desc 階段を示すメタデータのタグ。
 * @default stairs
 * 
 * @param EnemyTag
 * @desc 敵を示すメタデータのタグ。
 * @default enemy
 * 
 * @help
 * エディタによるリソースの指定を解釈してオブジェクトへと変換するクラスの実装。
 * 
 * Copyright (c) 2016 F_
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */

import { Event } from 'EventExtension';
import { DungeonSource, DungeonCallbacks, FloorSource, MapConfig, MapDesign, DungeonEvents } from 'Roguelike';

let plugin = MVPlugin.get(__moduleName);
let params = plugin.validate($ => {
	return {
		dungeonMapTag: $.string('DungeonMapTag'),
		floorMapTag: $.string('FloorMapTag'),
		floorTileTag: $.string('FloorTileTag'),
		wallTileTag: $.string('WallTileTag'),
		stairsTag: $.string('StairsTag'),
		enemyTag: $.string('EnemyTag'),
	};
});

export enum ResourceType {
	Unknown,
	Actor,
	Animation,
	Armor,
	Class,
	CommonEvent,
	Enemy,
	Item,
	Map,
	MapInfo,
	Skill,
	State,
	System,
	Tileset,
	Troop,
	Weapon,
}

@plugin.type
export class ResourceLoader {
	private constructor() { throw new Error(System.ErrorMessages.NEW_STATIC_CLASS); }

	private static readonly DataPath: string = 'data/';
	private static readonly RequestMethod: string = 'GET';
	private static readonly DefaultMimeType: string = 'application/json';
	private static readonly ResponseStatusOK: number = 200;
	private static readonly ResponseStatusLocal: number = 0;

	private static _errors: string[] = [];

	public static load(path: string, type: ResourceType, callback: (object: any) => void, options?: any): void {
		let mimeType = (options && options.mimeType) || this.DefaultMimeType;

		let xhr = new XMLHttpRequest();
		let url = this.DataPath + path;

		xhr.open(this.RequestMethod, url);
		xhr.overrideMimeType(mimeType);
		xhr.onload = ResourceLoader.onload.bind(this, xhr, type, url, callback);
		xhr.onerror = ResourceLoader.onerror.bind(this, xhr, type, url);
		xhr.send();
	}

	public static loadMap(mapID: number, callback: (object: any) => void, options?: any): void {
		this.load(this.getMapFileName(mapID), ResourceType.Map, callback, options);
	}

	public static errors(): string[] {
		return this._errors.slice();
	}

	public static checkError() {
		if (this._errors.length !== 0) {
			let message = this._errors.map(function (value) { return 'Failed to load: ' + value; }).join('\n');

			throw new Error(message);
		}
	}

	public static clearError() {
		this._errors = [];
	}

	private static onload(xhr: XMLHttpRequest, type: ResourceType, url: string, callback: (object: any) => void) {
		if (xhr.status === this.ResponseStatusOK || xhr.status === this.ResponseStatusLocal) {
			if (typeof callback === 'function') {
				let object = JSON.parse(xhr.responseText);
				this.extractMetadata(object, type);

				callback(object);
			}
		}
	}

	private static onerror(xhr: XMLHttpRequest, type: ResourceType, url: string) {
		this._errors.push(url);
	}

	private static extractMetadata(object: any, type: ResourceType) {
		let array: any[];
		if (type === ResourceType.Map) {
			DataManager.extractMetadata(object);
			array = object.events;
		} else {
			array = object;
		}

		if (Array.isArray(array)) {
			for (let i = 0; i < array.length; i++) {
				let data = array[i];
				if (data && data.note !== undefined) {
					DataManager.extractMetadata(data);
				}
			}
		}
	}

	private static getMapFileName(mapID: number) {
		return 'Map%1.json'.format(mapID.padZero(3));
	}
}

@plugin.type
export class ResourceHelper {
	private constructor() { throw new Error(System.ErrorMessages.NEW_STATIC_CLASS); }

	public static isDungeonMap(map: MV.Map) {
		return !!map.meta[params.dungeonMapTag];
	}

	public static isFloorMap(map: MV.Map) {
		return !!map.meta[params.floorMapTag];
	}

	public static getMapName(mapID: number) {
		return $dataMapInfos[mapID].name;
	}
}

enum SourceState {
	NotLoaded,
	Loading,
	Loaded,
}

@plugin.type
export class MapDungeonSource implements DungeonSource {
	public constructor(mapID: number) {
		let id = MapDungeonSource.getID(mapID);

		this._mapID = mapID;
		this._id = id;
		this._name = '';
		this._callbacks = [];
		this._state = SourceState.NotLoaded;
	}

	private _mapID: number;
	private _id: string;
	private _name: string;
	private _callbacks: DungeonCallbacks;
	private _state: SourceState;

	public get id(): string { return this._id; }
	public get name(): string { return this._name; }
	public get callbacks(): DungeonCallbacks { return this._callbacks; }
	public get ready(): boolean { return (this._state === SourceState.Loaded); }

	public toJSON(): any {
		return { mapID: this._mapID };
	}

	public fromJSON(data: any): void {
		MapDungeonSource.call(this, data.mapID);
	}

	public onDeserialize(): void {
		this.load();
	}

	public set(map: MV.Map): void {
		let callbacks = MapDungeonSource.extractCallbacks(map);

		this._name = map.displayName;
		this._callbacks = callbacks;
		this._state = SourceState.Loaded;
	}

	public load(): void {
		if (this._state === SourceState.NotLoaded) {
			this._state = SourceState.Loading;

			ResourceLoader.loadMap(this._mapID, this.onload.bind(this));
		}
	}

	private onload(map: MV.Map): void {
		this.set(map);
	}

	private static extractCallbacks(map: MV.Map) {
		let events = new Array(map.width * map.height);
		map.events.forEach(function (event) {
			if (event) {
				let index = event.x + event.y * map.width;
				let pages = event.pages;
				let list = (pages.length !== 0 && pages[0].list);
				if (list) events[index] = list;
			}
		});

		return events;
	}

	private static getID(mapID: number) {
		return mapID.padZero(3);
	}
}

@plugin.type
export class MapFloorSource implements FloorSource {
	public constructor(mapID: number) {
		let id = MapFloorSource.getID(mapID);

		this._mapID = mapID;
		this._id = id;
		this._name = '';
		this._map = null;
		this._events = null;
		this._state = SourceState.NotLoaded;
	}

	private _mapID: number;
	private _id: string;
	private _name: string;
	private _map: MapConfig | null;
	private _events: DungeonEvents | null;
	private _state: SourceState;

	public get mapID(): number { return this._mapID; }
	public get id(): string { return this._id; }
	public get name(): string { return this._name; }
	public get map(): MapConfig { return <MapConfig>this._map; }
	public get events(): DungeonEvents { return <DungeonEvents>this._events; }
	public get ready(): boolean { return (this._state === SourceState.Loaded); }

	public toJSON(): any {
		return { mapID: this._mapID };
	}

	public fromJSON(data: any): void {
		MapFloorSource.call(this, data.mapID);
	}

	public onDeserialize(): void {
		this.load();
	}

	public set(map: MV.Map): void {
		let source = new MapInfo(map);

		this._name = map.displayName;
		this._map = new MapBasedMapConfig(source);
		this._events = new MapBasedDungeonEvents(source);
		this._state = SourceState.Loaded;
	}

	public load() {
		if (this._state === SourceState.NotLoaded) {
			this._state = SourceState.Loading;

			ResourceLoader.loadMap(this._mapID, this.onload.bind(this));
		}
	}

	private onload(map: MV.Map): void {
		this.set(map);
	}

	private static getID(mapID: number): string {
		return mapID.padZero(3);
	}
}

@plugin.type
export class MapBasedMapConfig implements MapConfig {
	public constructor(source: MapInfo) {
		let map = source.map;
		let algorithm = MapBasedMapConfig.getAlgorithm(map);
		let args = MapBasedMapConfig.getArguments(map);

		this._width = map.width;
		this._height = map.height;
		this._algorithm = algorithm;
		this._args = args;
		this._design = new MapBasedMapDesign(source);
	}

	private _width: number;
	private _height: number;
	private _algorithm: string;
	private _args: any;
	private _design: MapDesign;

	public get width(): number { return this._width; }
	public get height(): number { return this._height; }
	public get algorithm(): string { return this._algorithm; }
	public get args(): any { return this._args; }
	public get design(): MapDesign { return this._design; }

	private static getAlgorithm(map: MV.Map): string {
		let algorithm = map.meta[params.floorMapTag];

		return (System.Utility.isString(algorithm) ? algorithm : '');
	}

	private static getArguments(map: MV.Map): any {
		return map.meta;
	}

	private static getMapDesign(mapEvent: MapInfo): MapDesign {
		return new MapBasedMapDesign(mapEvent);
	}
}

@plugin.type
export class MapBasedMapDesign implements MapDesign {
	public constructor(source: MapInfo) {
		let map = source.map;
		let baseMap = MapBasedMapDesign.getBaseMap(map);
		let floor = MapBasedMapDesign.getTilesOrDefault(map, source.floor, MapBasedMapDesign.DEFAULT_FLOOR);
		let wall = MapBasedMapDesign.getTilesOrDefault(map, source.wall, MapBasedMapDesign.DEFAULT_WALL);

		this.baseMap = baseMap;
		this.floorTiles = floor;
		this.wallTiles = wall;
	}

	public static readonly DEFAULT_FLOOR: ReadonlyArray<number> = [Tilemap.TILE_ID_A2, 0, 0, 0, 0];
	public static readonly DEFAULT_WALL: ReadonlyArray<number> = [Tilemap.TILE_ID_A1, 0, 0, 0, 0];

	public readonly baseMap: MV.Map;
	public readonly floorTiles: number[];
	public readonly wallTiles: number[];

	private static getBaseMap(map: MV.Map): MV.Map {
		let baseMap = JSON.parse(JSON.stringify(map));
		baseMap.data = [];
		baseMap.events = [null];
		return baseMap;
	}

	private static getTilesOrDefault(map: MV.Map, event: MV.Event | undefined, defaultValue: ReadonlyArray<number>): number[] {
		return (event ? this.getLayeredTiles(map, event) : defaultValue.slice());
	}

	private static getLayeredTiles(map: MV.Map, event: MV.Event): number[] {
		let offset = event.x + event.y * map.width;
		let size = map.width * map.height;

		let tiles = <number[]>[];
		tiles[0] = map.data[offset + size * 0];
		tiles[1] = map.data[offset + size * 1];
		tiles[2] = map.data[offset + size * 2];
		tiles[3] = map.data[offset + size * 3];
		tiles[4] = 0;
		tiles[5] = 0;

		return tiles;
	}
}

@plugin.type
export class MapBasedDungeonEvents implements DungeonEvents {
	public constructor(mapEvent: MapInfo) {
		this.stairs = mapEvent.stairs || new Event(-1);
		this.enemies = mapEvent.enemies || [];
	}

	public readonly stairs: MV.Event;
	public readonly enemies: MV.Event[];
}

class MapInfo {
	public constructor(map: MV.Map) {
		let source = MapInfo.classifyEvents(map.events);

		this.map = map;
		this.floor = source.floor;
		this.wall = source.wall;
		this.stairs = source.stairs;
		this.enemies = source.enemies;
	}

	public readonly map: MV.Map;
	public readonly floor: MV.Event | undefined;
	public readonly wall: MV.Event | undefined;
	public readonly stairs: MV.Event | undefined;
	public readonly enemies: MV.Event[] | undefined;

	private static classifyEvents(events: MV.Event[]): any {
		let source = {};
		events.forEach(function (event: MV.Event) {
			if (event) {
				let meta = event.meta;
				Object.keys(meta).forEach(function (property: string) {
					MapInfo.forEachMetadata.call(source, event, property, meta[property]);
				});
			}
		});

		return source;
	}

	private static forEachMetadata(this: any, event: MV.Event, key: string, value: string) {
		switch (key) {
			case params.floorTileTag:
				this.floor = event;
				break;
			case params.wallTileTag:
				this.wall = event;
				break;
			case params.stairsTag:
				this.stairs = event;
				break;
			case params.enemyTag:
				this.enemies = this.enemies || [];
				this.enemies.push(event);
				break;
		}
	}
}