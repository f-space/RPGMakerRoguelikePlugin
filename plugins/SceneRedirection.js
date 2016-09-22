/*:
 * @plugindesc シーンのリダイレクト
 * @author F_
 * 
 * @help
 * 特定のシーンへの移行を掠め取り、指定したシーンへと移動へと変更するプラグイン。
 * 
 * 単体使用不可。
 * 
 * Copyright (c) 2016 F_
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */

PluginSystem.ns(null, function () {
	this.define('SceneRedirection', function () {
		var dict = [];

		function get(from) {
			for (var i = 0, length = dict.length; i < length; i++) {
				if (dict[i].key === from) return dict[i].value;
			}

			return from;
		}

		function set(from, to) {
			dict.push({ key: from, value: to });
		}

		function redirect(method) {
			var baseMethod = SceneManager[method];
			if (typeof baseMethod === 'function') {
				SceneManager[method] = function () {
					var args = Array.prototype.slice.call(arguments).map(function (x) {
						return (x && SceneRedirection.get(x));
					});
					
					return baseMethod.apply(this, args);
				}
			}
		}

		var methods = ['run', 'isNextScene', 'isPreviousScene', 'goto', 'push'];
		methods.forEach(function (method) { redirect(method); });

		return Object.create(Object.prototype, {
			get: { value: get },
			set: { value: set },
		});
	});
});