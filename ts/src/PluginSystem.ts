/*!
/*:
 * @plugindesc プラグインの管理システム
 * @author F_
 * 
 * @help
 * プラグイン開発をサポートするプラグイン。
 * 
 * 必ず最初に実行すること。
 * 
 * Copyright (c) 2016 F_
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */

declare const __moduleName: string;

class System {
	private constructor() { throw new Error(System.ErrorMessages.NEW_STATIC_CLASS); }

	private static _modules: { [name: string]: System.Internal.Entry | undefined } = Object.create(null);
	private static _moduleNameResolver: System.ModuleNameResolver | null = null;

	public static get moduleNameResolver() { return this._moduleNameResolver; }
	public static set moduleNameResolver(value) { this._moduleNameResolver = value; }

	public static get(name: string): any {
		let entry = this._modules[name];

		return (entry ? entry.value : null);
	}

	public static set(name: string, value: any): void {
		this.checkDuplicate(name);

		this._modules[name] = new System.Internal.ExternalModule(name, value);
	}

	public static has(name: string): boolean {
		return (name in this._modules);
	}

	public static execute(name: string): void {
		this.executeCore(name);
	}

	public static register(deps: string[], declare: System.DeclareFunction): void;
	public static register(name: string | null, deps: string[], declare: System.DeclareFunction): void;
	public static register(...args: any[]): void {
		if (!System.Utility.isString(args[0])) {
			args = [null].concat(args);
		}

		this.registerCore.apply(this, args);
	}

	private static executeCore(name: string): System.Internal.Entry {
		this.checkExistence(name);

		let entry = <System.Internal.Entry>this._modules[name];
		if (!entry.external && !entry.executed) {
			entry.dependencies.forEach(function (this: typeof System, name: string) {
				let dependency = this.executeCore(name);
				if (!dependency.external) {
					dependency.dependants.push(entry.name);
				}

				(<System.Internal.Module>entry).update(dependency);
			}, this);

			entry.execute();
			entry.executed = true;
		}

		return entry;
	}

	private static registerCore(name: string | null, deps: string[], declare: System.DeclareFunction): void {
		name = name || this.resolveModuleName();
		this.checkDuplicate(name);

		let entry = new System.Internal.Module(name, deps);
		let $export = this.createExportFunction(entry);
		let $context = this.createModuleContext(entry);
		entry.declaration = declare($export, $context);

		this._modules[name] = entry;
	}

	private static $export<T>(target: System.Internal.Module, name: string, value: T): T {
		target.exports[name] = value;
		if (!Object.getOwnPropertyDescriptor(target.proxy, name)) {
			let values = target.exports;
			Object.defineProperty(target.proxy, name, {
				get: () => values[name],
				enumerable: true,
			});
		}

		target.lock = true;
		target.dependants.forEach(function (this: typeof System, name: string) {
			let dependant = <System.Internal.Module>this._modules[name];
			if (dependant && !dependant.lock) {
				dependant.update(target);
			}
		}, this);
		target.lock = false;

		return value;
	}

	private static createExportFunction(entry: System.Internal.Module): System.ExportFunction {
		return Object.freeze(this.$export.bind(this, entry));
	}

	private static createModuleContext(entry: System.Internal.Module): System.ModuleContext {
		return Object.freeze(Object.create(null, { id: { value: entry.name } }));
	}

	private static resolveModuleName(): string {
		if (this._moduleNameResolver == null) {
			throw new Error("ModuleNameResolver is not set.");
		}

		return this._moduleNameResolver.resolve();
	}

	private static checkDuplicate(name: string): void {
		if (this.has(name)) {
			throw new Error(`Duplicate module '${name}'.`);
		}
	}

	private static checkExistence(name: string): void {
		if (!this.has(name)) {
			throw new Error(`Missing module '${name}'.`);
		}
	}
}

namespace System {
	export namespace Internal {
		export class Module {
			public constructor(readonly name: string, readonly dependencies: string[]) { }
			public readonly external: false = false;
			public readonly dependants: string[] = [];
			public readonly proxy: any = Object.create(null);
			public readonly exports: any = Object.create(null);
			public declaration: ModuleDeclaration;

			public lock: boolean = false;
			public executed: boolean = false;

			public get value(): any { return this.proxy; }

			public update(dependency: Entry): void {
				let index = this.dependencies.indexOf(dependency.name);
				if (index !== -1) this.declaration.setters[index](dependency.value);
			}

			public execute(): void {
				this.declaration.execute();
			}
		}

		export class ExternalModule {
			public constructor(readonly name: string, readonly value: any) { }
			public readonly external: true = true;
		}

		export type Entry = Module | ExternalModule;
	}

	export type DeclareFunction = ($export: ExportFunction, $context: ModuleContext) => ModuleDeclaration;
	export type ExportFunction = <T>(name: string, value: T) => T;

	export interface ModuleContext {
		id: string;
	}

	export interface ModuleDeclaration {
		setters: (<T>(value: T) => void)[];
		execute: () => void;
	}

	export interface ModuleNameResolver {
		resolve(): string;
	}

	export interface Type {
		(value: Object): string;
		readonly property: string;
		of(ctor: Function): string;
		find(id: string): Function | null;
		register(ctor: Function, module?: string | null, name?: string | null): void;
	}
	export const Type: Type = <any>(
		class Type {
			private constructor(value: Object) {
				return Type.of(value.constructor);
			}

			public static readonly property: string = '@@Type';

			private static database: { [id: string]: Function | undefined } = Object.create(null);

			public static of(ctor: Function): string {
				if (!ctor.hasOwnProperty(Type.property)) {
					let global = System.Utility.global;
					let name = Type.getName(ctor);
					if (!global.hasOwnProperty(name)) {
						throw new Error(`Unknown type: '${name}'.`);
					}

					Type.register(ctor, null, name);
				}

				return (<any>ctor)[Type.property];
			}

			public static find(id: string): Function | null {
				let result = this.database[id];
				if (!result) result = System.Utility.global[id];
				return result || null;
			}

			public static register(ctor: Function, module?: string | null, name?: string | null): void {
				let id = this.makeID(module, name != null ? name : this.getName(ctor));
				if (id in this.database) {
					throw new Error(`Duplicate identifier: '${id}'.`);
				}

				Object.defineProperty(ctor, Type.property, { value: id });
				Object.defineProperty(this.database, id, { value: ctor });
			}

			private static makeID(module: string | null | undefined, name: string): string {
				return (module != null ? '@' + module + '.' + name : name);
			}

			private static getName(ctor: Function): string {
				return System.Utility.getFunctionName(ctor);
			}
		}
	);

	export interface ObjectID {
		(object: any): number;
		readonly property: string;
	}
	export const ObjectID: ObjectID = <any>(
		class ObjectID {
			public constructor(object: any) {
				if (!object.hasOwnProperty(ObjectID.property)) {
					Object.defineProperty(object, ObjectID.property, { value: ObjectID.newID() });
				}

				return object[ObjectID.property];
			}

			public static readonly property: string = '@@ObjectID';

			private static _counter: number = 1;

			private static newID(): number {
				let id = this._counter++;
				if (id === this._counter) throw new Error('No more available IDs.');
				return id;
			}
		}
	);

	export class Serialization {
		private constructor() { throw new Error(ErrorMessages.NEW_STATIC_CLASS); }

		private static _typeCache: { [id: string]: Object | undefined } = Object.create(null);

		public static serialize(object: any): string {
			return JSON.stringify(this.encode(object));
		}

		public static deserialize(json: string): any {
			return this.decode(JSON.parse(json));
		}

		private static encode(value: any): any {
			let result = { root: <any>null, table: <Serialization.Entry[]>[] };
			result.root = this.flatten(value, result.table, Object.create(null));

			return result;
		}

		private static flatten(value: any, table: Serialization.Entry[], map: { [id: number]: Serialization.ObjectReference }): any {
			if (this.isObject(value)) {
				let id = ObjectID(value);
				if (!(id in map)) {
					if (this.isFunction(value.onSerialize)) {
						value.onSerialize();
					}

					let object = value;
					if (this.isFunction(value.toJSON)) {
						object = value.toJSON();
					}

					let type = Type(value);
					let ref = new Serialization.ObjectReference(table.length);
					let entry = new Serialization.Entry(type);

					map[id] = ref;
					table.push(entry);

					if (this.isObject(object)) {
						let data: any;
						let recurse = this.flatten.bind(this);
						if (Array.isArray(object)) {
							data = object.map(value => recurse(value, table, map));
						} else {
							data = Object.create(null);
							Object.keys(object).forEach(key => {
								data[key] = recurse(object[key], table, map);
							});
						}

						entry.data = data;
					} else {
						entry.data = object;
					}
				}

				return map[id];
			}

			return value;
		}

		private static decode(value: any): any {
			let root = (value.root != null ? value.root : null);
			let table = (value.table != null ? value.table : []);

			let objects = new Array(table.length);
			let result = this.resolve(root, table, objects);

			return result;
		}

		private static resolve(value: any, table: Serialization.Entry[], objects: any[]) {
			let ref = this.isObject(value) ? Serialization.ObjectReference.getReferenceNo(value) : null;
			if (ref != null) {
				if (!objects.hasOwnProperty(String(ref))) {
					let entry = table[ref];
					if (entry) {
						let type = Serialization.Entry.getType(entry);
						let data = Serialization.Entry.getData(entry);

						if (this.isObject(data)) {
							let object = Array.isArray(data) ? [] : Object.create(this.getPrototype(type));

							objects[ref] = object;

							let recurse = this.resolve.bind(this);
							if (this.isFunction(object.fromJSON)) {
								Object.keys(data).forEach(key => {
									data[key] = recurse(data[key], table, objects);
								});

								object.fromJSON(data);
							} else {
								Object.keys(data).forEach(key => {
									object[key] = recurse(data[key], table, objects);
								})
							}

							if (this.isFunction(object.onDeserialize)) {
								object.onDeserialize();
							}
						} else {
							objects[ref] = data;
						}
					} else {
						objects[ref] = void (0);
					}
				}

				return objects[ref];
			}

			return value;
		}

		private static getPrototype(type: string | null | undefined): any {
			if (type != null) {
				if (!(type in this._typeCache)) {
					let ctor = Type.find(type);
					let prototype = ctor && ctor.prototype;

					this._typeCache[type] = prototype;
				}

				let result = this._typeCache[type];
				if (result) return result;
			}

			return Object.prototype;
		}

		private static isObject(value: any): value is Object {
			return (value !== null && typeof value === 'object');
		}

		private static isFunction(value: any): value is Function {
			return (typeof value === 'function');
		}
	}
	export namespace Serialization {
		const PROPERTY_TYPE = '@';
		const PROPERTY_DATA = '_';
		const PROPERTY_REF = '@ref';

		export class Entry {
			public constructor(type: string, data?: any) {
				this.type = type;
				this.data = data;
			}

			public get type(this: any): string { return this[PROPERTY_TYPE]; }
			public set type(this: any, value: string) { this[PROPERTY_TYPE] = value; }

			public get data(this: any): any { return this[PROPERTY_DATA]; };
			public set data(this: any, value: any) { this[PROPERTY_DATA] = value; };

			public static getType(object: any): string | undefined {
				return object[PROPERTY_TYPE];
			}

			public static getData(object: any): any {
				return object[PROPERTY_DATA];
			}
		}

		export class ObjectReference {
			public constructor(refNo: number) {
				this.refNo = refNo;
			}

			public get refNo(this: any): number { return this[PROPERTY_REF]; };
			public set refNo(this: any, value: number) { this[PROPERTY_REF] = value; };

			public static getReferenceNo(object: any): number | undefined {
				return object[PROPERTY_REF];
			}
		}
	}

	export interface Serializable {
		toJSON?(): any;
		fromJSON?(data: any): void;
		onSerialize?(): void;
		onDeserialize?(): void;
	}

	export class Utility {
		private constructor() { throw new Error(ErrorMessages.NEW_STATIC_CLASS); }

		public static readonly global: any = (0, eval)('this');
		public static readonly undefined: undefined = (void 0);

		public static isNumber(value: any): value is number {
			return (typeof value === 'number' || value instanceof Number);
		}

		public static isString(value: any): value is string {
			return (typeof value === 'string' || value instanceof String);
		}

		public static isObject(value: any): value is Object {
			let type = typeof value;
			return ((type === 'object' && value !== null) || type === 'function')
		}

		public static isFunction(value: any): value is Function {
			return (typeof value === 'function');
		}

		public static isArray(value: any): value is Array<any> {
			return Array.isArray(value);
		}

		public static isUndefined(value: any): value is undefined {
			return (value === void 0);
		}

		public static getFunctionName(func: Function): string {
			if (func.hasOwnProperty('name')) {
				return String((<any>func).name);
			} else {
				let match = String(func).match(/^\s*function\s*(\S+?)\s*\(/);
				return match ? match[1] : '';
			}
		}
	}

	export namespace ErrorMessages {
		export const NEW_STATIC_CLASS = "This is a static class.";
		export const NOT_IMPLEMENTED = "Not implemented.";
		export const NOT_SUPPORTED = "Not supoorted.";
	}
}

class MVPlugin {
	public constructor(source: MV.Plugin, order: number) {
		this.name = source.name;
		this.description = source.description;
		this.parameters = new MVPlugin.Parameters(source.parameters);
		this.order = order;

		this.type = this.createTypeDecorator();
		this.typeAs = this.createTypeAsDecoratorFactory();
	}

	public readonly name: string;
	public readonly description: string;
	public readonly parameters: MVPlugin.Parameters;
	public readonly order: number;

	public readonly type: ClassDecorator;
	public readonly typeAs: (name: string) => ClassDecorator;

	public static get(name: string): MVPlugin {
		let plugin = this.find(name);
		if (!plugin) throw new Error(`Missing plugin '${name}'.`);
		return plugin;
	}

	public static find(name: string): MVPlugin | null {
		return MVPlugin.PluginManager.getPlugin(name);
	}

	public validate<T>(validator: (parameters: MVPlugin.Parameters) => T): T {
		return validator(this.parameters);
	}

	private createTypeDecorator(): ClassDecorator {
		let module = this.name;
		return function (target: any): void {
			System.Type.register(target, module);
		}
	}

	private createTypeAsDecoratorFactory(): (name: string) => ClassDecorator {
		let module = this.name;
		return function (name: string): ClassDecorator {
			return function (target: any): void {
				System.Type.register(target, module, name);
			}
		}
	}
}

namespace MVPlugin {
	const SYMBOL_METHODS = '@methods';
	const SYMBOL_PROPERTIES = '@properties';

	export function extension(type: any, static?: boolean): ClassDecorator {
		if (!static) type = type.prototype;

		return function (target: any): void {
			let methods = <string[] | undefined>target[SYMBOL_METHODS];
			if (methods) {
				methods.forEach(name => type[name] = target[name](type[name]));
			}

			let properties = <string[] | undefined>target[SYMBOL_PROPERTIES];
			if (properties) {
				properties.forEach(name => Object.defineProperty(type, name, Object.getOwnPropertyDescriptor(target, name)));
			}
		};
	}

	export function extensionIf(type: any, condition: boolean, static?: boolean): ClassDecorator {
		let decorator = extension(type, static);

		return function (target: any): void {
			if (condition) decorator(target);
		}
	}

	export function method(target: any, key: string): void {
		let methods = <string[]>(target[SYMBOL_METHODS] || (target[SYMBOL_METHODS] = []));
		methods.push(key);
	};

	export function methodIf(condition: boolean): MethodDecorator {
		return function (target: any, key: string): void {
			if (condition) method(target, key);
		};
	}

	export function property(target: any, key: string): void {
		let properties = <string[]>(target[SYMBOL_PROPERTIES] || (target[SYMBOL_PROPERTIES] = []));
		properties.push(key);
	}

	export function propertyIf(condition: boolean): PropertyDecorator {
		return function (target: any, key: string): void {
			if (condition) property(target, key);
		}
	}

	export class PluginManager {
		private constructor() { throw new Error(System.ErrorMessages.NEW_STATIC_CLASS); }

		private static plugins: { [name: string]: MVPlugin | undefined } = Object.create(null);
		private static nameTable: { [src: string]: string | undefined } = Object.create(null);

		private static initialized: boolean = false;

		public static get path(): string { return System.Utility.global.PluginManager._path; }

		public static initialize(): void {
			if (!this.initialized) {
				this.collectPluginInfo();

				this.initialized = true;
			}
		}

		public static contains(name: string): boolean {
			return !!this.getPlugin(name);
		}

		public static getPlugin(name: string): MVPlugin | null {
			return this.plugins[name] || null;
		}

		public static getPlugins(): MVPlugin[] {
			return Object.keys(this.plugins).map(key => <MVPlugin>this.plugins[key]);
		}

		public static getCurrentPlugin(): MVPlugin | null {
			let name = this.getCurrentPluginName();
			let plugin = (name != null ? this.getPlugin(name) : null);

			return plugin;
		}

		public static getCurrentPluginName(): string | null {
			let script = this.getCurrentScript();
			let src = script.getAttribute('src');
			let name = src && this.nameTable[src];

			return name || null;
		}

		private static getCurrentScript(): HTMLScriptElement {
			return <HTMLScriptElement>document.currentScript || (function () {
				let scripts = document.getElementsByTagName('script');
				return scripts[scripts.length - 1];
			})();
		}

		private static collectPluginInfo(): void {
			$plugins.forEach((source, index) => {
				if (source.status) {
					let name = source.name;
					if (!(name in this.plugins)) {
						let plugin = new MVPlugin(source, index);
						let src = this.getPluginSrc(name);

						this.plugins[name] = plugin;
						this.nameTable[src] = name;
					}
				}
			});
		}

		private static getPluginSrc(name: string): string {
			return this.path + name + '.js';
		}
	}

	export class PluginNameResolver implements System.ModuleNameResolver {
		public constructor() {
			PluginManager.initialize();
		}

		public resolve(): string {
			return <string>MVPlugin.PluginManager.getCurrentPluginName();
		}
	}

	export class Parameters {
		public constructor(readonly value: { [name: string]: string | undefined }) { }

		private static readonly BOOLEAN_TABLE: { [name: string]: boolean | undefined } = {
			true: true, false: false,
			yes: true, no: false,
			on: true, off: false,
			enabled: true, disabled: false,
		}

		public int(name: string, radix?: number): number {
			let string = this.get(name);
			let value = parseInt(string, radix || 10);
			return (!isNaN(value) ? value : this.error(name, string));
		}

		public float(name: string): number {
			let string = this.get(name);
			let value = parseFloat(string);
			return (!isNaN(value) ? value : this.error(name, string));
		}

		public bool(name: string): boolean {
			let string = this.get(name);
			let value = Parameters.BOOLEAN_TABLE[string.toLowerCase()];
			return (value != null ? value : this.error(name, string));
		}

		public string(name: string): string {
			return this.get(name);
		}

		public lower(name: string): string {
			return this.get(name).toLowerCase();
		}

		public upper(name: string): string {
			return this.get(name).toUpperCase();
		}

		private get(name: string): string {
			if (!this.value.hasOwnProperty(name)) {
				throw new Error(`Unknown parameter '${name}'.`);
			}

			return <string>this.value[name];
		}

		private error(name: string, string: string): never {
			throw new Error(`ParseError: ${name} '${string}'`);
		}
	}
}

(function () {
	System.moduleNameResolver = new MVPlugin.PluginNameResolver();

	let serializer = System.Serialization;
	JsonEx.stringify = function (object) { return serializer.serialize(object); }
	JsonEx.parse = function (json) { return serializer.deserialize(json); }

	let onload = window.onload;
	window.onload = function () {
		try {
			let registered = <MVPlugin[]>[];
			MVPlugin.PluginManager.getPlugins().forEach(plugin => {
				if (System.has(plugin.name)) {
					registered.push(plugin);
				} else {
					System.set(plugin.name, null);
				}
			});

			registered.sort((x, y) => x.order - y.order);
			registered.forEach(plugin => System.execute(plugin.name));
		} finally {
			onload.apply(this, arguments);
		}
	};
})();