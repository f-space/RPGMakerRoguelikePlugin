/*:
 * @plugindesc プラグインの管理システム
 * @author F_
 * 
 * @param OverrideJsonSerializer
 * @desc JSONシリアライザを置き換えるかどうか
 * @default true
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

if (typeof PluginSystem === 'undefined') {
	var PluginSystem = (function () {
		function PluginSystem() {
			throw new Error('This is a static class');
		}

		var phase = null;
		var global = null;

		var plugins = {};
		var pluginRegex = new RegExp(PluginManager._path + '([^\.]*)' + '.js');
		var pluginNames = {};
		var currentPluginName = null;

		function require(pluginName) {
			_throwErrorIfCalledInCallbacks();
			_throwErrorIfNotString(pluginName);

			var plugin = _getPlugin();
			plugin.dependencies.push(pluginName);
		}

		function validate(validator) {
			_throwErrorIfCalledInCallbacks();
			_throwErrorIfNotFunction(validator);

			var plugin = _getPlugin();
			plugin.validator = validator;
			plugin.parameters = null;
		}

		function ns(fqn, callback) {
			_throwErrorIfCalledInCallbacks();
			_throwErrorIfNotString(fqn, true);
			_throwErrorIfNotFunction(callback);

			if (fqn === 'self') {
				fqn = _selfNamespace();
			} else if (fqn === 'auto') {
				fqn = _autoNamespace();
			}

			var plugin = _getPlugin();
			plugin.ns = global.ns(fqn, true);
			plugin.callback = callback;
		}

		function parameters() {
			if (phase !== PluginSystem.Phase.Done) {
				var plugin = _getPlugin();
				var parameters = _getParameters(plugin);

				return parameters;
			}

			return null;
		}

		function _initialize() {
			phase = PluginSystem.Phase.Registration;
			global = new PluginSystem.Namespace('global', null, window);
			global.scope = function () { return new PluginSystem.Scope(this); }
		}

		function _execute() {
			if (phase === PluginSystem.Phase.Registration) {
				phase = PluginSystem.Phase.Exection;

				var pluginList = _getPluginList();
				_checkDependency(pluginList);
				_executeForeach(pluginList);
				_releaseUnusedObjects();

				phase = PluginSystem.Phase.Done;
			}
		}

		function _checkDependency(pluginList) {
			function flatMap(callback) { return Array.prototype.concat.apply([], this.map(callback)); }
			function isFirstValue(value, index, self) { return (self.indexOf(value) === index); }
			function distinct() { return this.filter(isFirstValue); }

			function pluginMissing(pluginName) { return !plugins.hasOwnProperty(pluginName); }
			var missingPlugins = flatMap.call(pluginList, function (plugin) {
				return plugin.dependencies.filter(pluginMissing);
			})

			if (missingPlugins.length !== 0) {
				var message = "Missing Plugin(s): " + distinct.call(missingPlugins).join(', ');
				throw new Error(message);
			}
		}

		function _executeForeach(pluginList) {
			var count = pluginList.length;
			while (count !== 0) {
				var rest = count;
				pluginList.forEach(function (plugin) {
					if (!plugin.done && _isReady(plugin)) {
						if (plugin.callback) {
							currentPluginName = plugin.name;

							var ns = plugin.ns || global;
							var scope = ns.scope();
							var parameters = _getParameters(plugin);
							plugin.callback.call(scope, scope, parameters);
						}

						plugin.done = true;
						count--;
					}
				});

				if (rest === count) {
					throw new Error('Circular dependency detected.');
				}
			}
		}

		function _isReady(plugin) {
			return plugin.dependencies.every(function (pluginName) {
				return plugins[pluginName].done;
			});
		}

		function _getParameters(plugin) {
			if (plugin.parameters == null) {
				var parameters = PluginManager.parameters(plugin.name);
				if (typeof plugin.validator === 'function') {
					var result = plugin.validator(parameters);
					if (typeof result !== 'undefined') {
						parameters = result;
					}
				}

				plugin.parameters = parameters;
			}

			return plugin.parameters;
		}

		function _releaseUnusedObjects() {
			plugins = null;
			pluginRegex = null;
			pluginNames = null;
			currentPluginName = null;
		}

		function _getPlugin() {
			var pluginName = _getPluginName();
			var plugin = plugins[pluginName];
			if (!plugin) {
				plugin = plugins[pluginName] = {
					name: pluginName,
					dependencies: [],
					validator: null,
					ns: null,
					callback: null,
					parameters: null,
					done: false,
				}
			}

			return plugin;
		}

		function _getPluginList() {
			var names = Object.getOwnPropertyNames(plugins);

			return names.map(function (name) { return plugins[name]; });
		}

		function _getPluginName() {
			if (phase === PluginSystem.Phase.Registration) {
				var script = document.currentScript;
				var src = script && script.src;
				if (!pluginNames.hasOwnProperty(src)) {
					var match = src && src.match(pluginRegex);
					if (match) {
						var pluginName = match[1];
						pluginNames[src] = pluginName;
					}
				}

				return pluginNames[src];
			}

			return currentPluginName;
		}

		function _selfNamespace() {
			return _getPluginName();
		}

		function _autoNamespace() {
			var pluginName = _getPluginName();

			return PluginSystem.Namespace.makeFqn(pluginName);
		}

		function _throwErrorIfCalledInCallbacks() {
			if (phase !== PluginSystem.Phase.Registration) {
				throw new Error("Don't call this method in callbacks.")
			}
		}

		function _throwErrorIfNotString(value, nullable) {
			if ((!nullable || value != null) && (typeof value !== 'string' && !(value instanceof String))) {
				throw new TypeError(String(value) + " is not a string.");
			}
		}

		function _throwErrorIfNotFunction(value, nullable) {
			if ((!nullable || value != null) && typeof value !== 'function') {
				throw new TypeError(String(name) + " is not a function.");
			}
		}

		return Object.defineProperties(PluginSystem, {
			phase: { get: function () { return phase; } },
			global: { get: function () { return global; } },
			pluginName: { get: _getPluginName },
			require: { value: require },
			validate: { value: validate },
			ns: { value: ns },
			_initialize: { value: _initialize },
			_execute: { value: _execute },
		});
	})();

	PluginSystem.Phase = Object.create(Object.prototype, {
		Registration: { value: 'Registration' },
		Exection: { value: 'Execution' },
		Done: { value: 'Done' },
	});

	PluginSystem.Namespace = (function () {
		function Namespace() {
			this.initialize.apply(this, arguments);
		}

		var nameRegex = /^([a-zA-Z_$][a-zA-Z0-9_$]*)$/
		var fqnRegex = /(?:^|\.)([a-zA-Z_$][a-zA-Z0-9_$]*)(?=\.|$)/g;
		var autoRegex = /(?:[A-Z][A-Z0-9]+|[a-zA-Z][a-z0-9]*)(?=[A-Z_$]|$)/g;

		Namespace.prototype.initialize = function (name, parent, members) {
			var fqn = (parent ? ((parent.fqn && parent.fqn + '.') + name) : '');
			Object.defineProperties(this, {
				fqn: { value: fqn },
				name: { value: name },
				parent: { value: parent },
				members: { value: members || this },
			});
		}

		Namespace.prototype.ns = function (name, recurse) {
			return (recurse ? _constructNamespace(this, name) : _newNamespace(this, name));
		}

		Namespace.prototype.scope = function (extractAll) {
			var scope = new PluginSystem.Scope(this);
			if (extractAll) {
				for (var ns = this; ns; ns = ns.parent) {
					ns.extract(scope);
				}
			} else {
				this.extract(scope);
			}

			return scope;
		}

		Namespace.prototype.find = function (name, namespaceOnly) {
			var segments = Array.isArray(name) ? name : _decomposeFqn(name);
			if (segments != null) {
				var nsonly = !!namespaceOnly;
				var current = this;
				for (var i = 0, length = segments.length; i < length; i++) {
					var members = (current instanceof Namespace ? current.members : current);
					var next = members[segments[i]];
					if (typeof next !== 'undefined' && (!nsonly || next instanceof Namespace)) {
						current = next;
					} else {
						return (this.parent ? this.parent.find(segments) : null);
					}
				}

				return current;
			}

			return null;
		}

		Namespace.prototype.extract = function (scope) {
			if (scope instanceof PluginSystem.Scope) {
				var members = this.members;
				Object.keys(members).forEach(function (key) {
					Object.defineProperty(scope, key, { value: members[key], enumerable: true });
				})
			}

			return scope;
		}

		Namespace.prototype.define = function (name, definition, serializable) {
			if (_validateName(this, name)) {
				if (typeof definition === 'function') {
					definition = definition.call(this.members);
				}

				Object.defineProperty(this.members, name, { value: definition, enumerable: true });

				if (serializable && typeof definition === 'function') {
					_registerConstructor(this, name, definition);
				}

				return definition;
			}

			return null;
		}

		Namespace.makeFqn = function (label) {
			if (_isString(label)) {
				autoRegex.lastIndex = 0;
				var result, segments = [];
				while ((result = autoRegex.exec(label)) != null) {
					var name = result[0];
					var pascalCase = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
					var segment = (name.length < 3 ? name : pascalCase);
					segments.push(segment);
				}

				return segments.join('.');
			}

			return null;
		}

		function _decomposeFqn(fqn) {
			if (_isString(fqn)) {
				fqnRegex.lastIndex = 0;
				var result, segments = [];
				while ((result = fqnRegex.exec(fqn)) != null) {
					var segment = result[1];
					segments.push(segment);
				}

				return segments || (fqn.length === 0 ? [] : null);
			}

			return null;
		}

		function _newNamespace(ns, name) {
			if (_validateName(ns, name)) {
				var newNS = new Namespace(name, ns);

				Object.defineProperty(ns.members, name, { value: newNS, enumerable: true });

				return newNS;
			}

			return null;
		}

		function _constructNamespace(ns, fqn) {
			var segments = _decomposeFqn(fqn);
			if (segments != null) {
				var currentNS = ns;
				segments.forEach(function (name) {
					if (currentNS.members.hasOwnProperty(name)) {
						currentNS = currentNS.members[name];
					} else {
						currentNS = _newNamespace(currentNS, name);
					}
				});

				return currentNS;
			}

			return null;
		}

		function _isString(value) {
			return (typeof value === 'string' || value instanceof String);
		}

		function _validateName(ns, name) {
			return (_isString(name) && !ns.members.hasOwnProperty(name) && nameRegex.test(name));
		}

		function _registerConstructor(ns, name, ctor) {
			if (PluginSystem.Serialization) {
				var id = ns.fqn + '.' + name;
				PluginSystem.Serialization.registerConstrcutor(id, ctor);
			}
		}

		return Namespace;
	})();

	PluginSystem.Scope = (function () {
		function Scope() {
			this.initialize.apply(this, arguments);
		}

		Scope.prototype.initialize = function (base) {
			Object.defineProperties(this, {
				base: { value: base },
			});
		}

		Scope.prototype.find = function (name) {
			return this.hasOwnProperty(name) ? this[name] : this.base.find(name);
		}

		Scope.prototype.extract = function (name) {
			var ns = this.base.find(name, true);
			if (ns != null) {
				ns.extract(this);
			}

			return this;
		}

		Scope.prototype.define = function (name, definition, serializable) {
			var value = this.base.define(name, definition, serializable);
			if (value != null) {
				Object.defineProperty(this, name, { value: value, enumerable: true });
			}

			return value;
		}

		return Scope;
	})();

	(function () {
		var parameters = PluginManager.parameters('PluginSystem');
		var overrideJsonSerializer = (parameters['OverrideJsonSerializer'].toLowerCase() === 'true');

		if (overrideJsonSerializer) {
			PluginSystem.Serialization = (function () {
				function Serialization() {
					throw new Error('This is a static class');
				}

				var constructors = {};

				function registerConstructor(id, ctor) {
					Object.defineProperty(ctor.prototype, '@', { value: id });
					constructors[id] = ctor;
				}
				function _findConstructor(id) {
					return constructors[id];
				}

				JsonEx._encode = function (value, depth) {
					depth = depth || 0;
					if (++depth >= this.maxDepth) {
						throw new Error('Object too deep');
					}
					var type = Object.prototype.toString.call(value);
					if (type === '[object Object]' || type === '[object Array]') {
						if (typeof value.onSerialize === 'function') {
							value.onSerialize();
						}

						if (!value['@']) {
							var constructorName = this._getConstructorName(value);
							if (constructorName !== 'Object' && constructorName !== 'Array') {
								value['@'] = constructorName;
							}
						}
						for (var key in value) {
							if (value.hasOwnProperty(key)) {
								value[key] = this._encode(value[key], depth + 1);
							}
						}
					}
					depth--;
					return value;
				};

				JsonEx._decode = function (value) {
					var type = Object.prototype.toString.call(value);
					if (type === '[object Object]' || type === '[object Array]') {
						if (value['@']) {
							var constructor = _findConstructor(value['@']) || window[value['@']];
							if (constructor) {
								value = this._resetPrototype(value, constructor.prototype);
							}
						}
						for (var key in value) {
							if (value.hasOwnProperty(key)) {
								value[key] = this._decode(value[key]);
							}
						}

						if (typeof value.onDeserialize === 'function') {
							value.onDeserialize();
						}
					}
					return value;
				};

				return Object.defineProperties(Serialization, {
					registerConstrcutor: { value: registerConstructor },
				})
			})();
		};
	})();

	Object.freeze(PluginSystem);

	PluginSystem._initialize();
	PluginManager.loadScript('PluginSystem.js');
} else {
	PluginSystem._execute();
}