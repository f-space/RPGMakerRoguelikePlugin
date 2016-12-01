/*!
/*:
 * @plugindesc シーンのリダイレクト
 * @author F_
 * 
 * @help
 * 特定のシーンに対する操作を別のシーンへの操作に差し替えるプラグイン。
 * 
 * 単体使用不可。
 * 
 * Copyright (c) 2016 F_
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */

let plugin = MVPlugin.get(__moduleName);

type Scene = SceneManager.SceneConstructor<Scene_Base>;

@plugin.type
export class SceneRedirection {
	private static TARGET_METHODS = ['run', 'isNextScene', 'isPreviousScene', 'goto', 'push'];

	private static dict: { [name: string]: Scene | undefined } = {}

	public static initialize(): void {
		this.TARGET_METHODS.forEach(function (this: typeof SceneRedirection, method: string) {
			this.redirect(method);
		}, this);
	}

	public static get(from: Scene): Scene {
		let name = System.Utility.getFunctionName(from);

		return this.dict[name] || from;
	}

	public static set(from: Scene, to: Scene): void {
		let name = System.Utility.getFunctionName(from);

		this.dict[name] = to;
	}

	private static redirect(method: string): void {
		let manager = <any>SceneManager;
		let baseMethod = manager[method];
		if (System.Utility.isFunction(baseMethod)) {
			let isSceneCtor = this.isSceneConstructor;
			manager[method] = function (this: SceneManager) {
				let args = Array.prototype.slice.call(arguments).map(function (x: any) {
					return (isSceneCtor(x) ? SceneRedirection.get(x) : x);
				});

				return baseMethod.apply(this, args);
			}
		}
	}

	private static isSceneConstructor(value: any): value is Scene {
		return System.Utility.isFunction(value) && value.prototype instanceof Scene_Base;
	}
}

SceneRedirection.initialize();