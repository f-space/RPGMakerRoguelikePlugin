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
var System = (function () {
    function System() {
        throw new Error(System.ErrorMessages.NEW_STATIC_CLASS);
    }
    Object.defineProperty(System, "moduleNameResolver", {
        get: function () { return this._moduleNameResolver; },
        set: function (value) { this._moduleNameResolver = value; },
        enumerable: true,
        configurable: true
    });
    System.get = function (name) {
        var entry = this._modules[name];
        return (entry ? entry.value : null);
    };
    System.set = function (name, value) {
        this.checkDuplicate(name);
        this._modules[name] = new System.Internal.ExternalModule(name, value);
    };
    System.has = function (name) {
        return (name in this._modules);
    };
    System.execute = function (name) {
        this.executeCore(name);
    };
    System.register = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        if (!System.Utility.isString(args[0])) {
            args = [null].concat(args);
        }
        this.registerCore.apply(this, args);
    };
    System.executeCore = function (name) {
        this.checkExistence(name);
        var entry = this._modules[name];
        if (!entry.external && !entry.executed) {
            entry.dependencies.forEach(function (name) {
                var dependency = this.executeCore(name);
                if (!dependency.external) {
                    dependency.dependants.push(entry.name);
                }
                entry.update(dependency);
            }, this);
            entry.execute();
            entry.executed = true;
        }
        return entry;
    };
    System.registerCore = function (name, deps, declare) {
        name = name || this.resolveModuleName();
        this.checkDuplicate(name);
        var entry = new System.Internal.Module(name, deps);
        var $export = this.createExportFunction(entry);
        var $context = this.createModuleContext(entry);
        entry.declaration = declare($export, $context);
        this._modules[name] = entry;
    };
    System.$export = function (target, name, value) {
        target.exports[name] = value;
        if (!Object.getOwnPropertyDescriptor(target.proxy, name)) {
            var values_1 = target.exports;
            Object.defineProperty(target.proxy, name, {
                get: function () { return values_1[name]; },
                enumerable: true,
            });
        }
        target.lock = true;
        target.dependants.forEach(function (name) {
            var dependant = this._modules[name];
            if (dependant && !dependant.lock) {
                dependant.update(target);
            }
        }, this);
        target.lock = false;
        return value;
    };
    System.createExportFunction = function (entry) {
        return Object.freeze(this.$export.bind(this, entry));
    };
    System.createModuleContext = function (entry) {
        return Object.freeze(Object.create(null, { id: { value: entry.name } }));
    };
    System.resolveModuleName = function () {
        if (this._moduleNameResolver == null) {
            throw new Error("ModuleNameResolver is not set.");
        }
        return this._moduleNameResolver.resolve();
    };
    System.checkDuplicate = function (name) {
        if (this.has(name)) {
            throw new Error("Duplicate module '" + name + "'.");
        }
    };
    System.checkExistence = function (name) {
        if (!this.has(name)) {
            throw new Error("Missing module '" + name + "'.");
        }
    };
    System._modules = Object.create(null);
    System._moduleNameResolver = null;
    return System;
}());
var System;
(function (System) {
    var Internal;
    (function (Internal) {
        var Module = (function () {
            function Module(name, dependencies) {
                this.name = name;
                this.dependencies = dependencies;
                this.external = false;
                this.dependants = [];
                this.proxy = Object.create(null);
                this.exports = Object.create(null);
                this.lock = false;
                this.executed = false;
            }
            Object.defineProperty(Module.prototype, "value", {
                get: function () { return this.proxy; },
                enumerable: true,
                configurable: true
            });
            Module.prototype.update = function (dependency) {
                var index = this.dependencies.indexOf(dependency.name);
                if (index !== -1)
                    this.declaration.setters[index](dependency.value);
            };
            Module.prototype.execute = function () {
                this.declaration.execute();
            };
            return Module;
        }());
        Internal.Module = Module;
        var ExternalModule = (function () {
            function ExternalModule(name, value) {
                this.name = name;
                this.value = value;
                this.external = true;
            }
            return ExternalModule;
        }());
        Internal.ExternalModule = ExternalModule;
    })(Internal = System.Internal || (System.Internal = {}));
    System.Type = ((function () {
        function Type(value) {
            return Type.of(value.constructor);
        }
        Type.of = function (ctor) {
            if (!ctor.hasOwnProperty(Type.property)) {
                var global = System.Utility.global;
                var name_1 = Type.getName(ctor);
                if (!global.hasOwnProperty(name_1)) {
                    throw new Error("Unknown type: '" + name_1 + "'.");
                }
                Type.register(ctor, null, name_1);
            }
            return ctor[Type.property];
        };
        Type.find = function (id) {
            var result = this.database[id];
            if (!result)
                result = System.Utility.global[id];
            return result || null;
        };
        Type.register = function (ctor, module, name) {
            var id = this.makeID(module, name != null ? name : this.getName(ctor));
            if (id in this.database) {
                throw new Error("Duplicate identifier: '" + id + "'.");
            }
            Object.defineProperty(ctor, Type.property, { value: id });
            Object.defineProperty(this.database, id, { value: ctor });
        };
        Type.makeID = function (module, name) {
            return (module != null ? '@' + module + '.' + name : name);
        };
        Type.getName = function (ctor) {
            return System.Utility.getFunctionName(ctor);
        };
        Type.property = '@@Type';
        Type.database = Object.create(null);
        return Type;
    }()));
    System.ObjectID = ((function () {
        function ObjectID(object) {
            if (!object.hasOwnProperty(ObjectID.property)) {
                Object.defineProperty(object, ObjectID.property, { value: ObjectID.newID() });
            }
            return object[ObjectID.property];
        }
        ObjectID.newID = function () {
            var id = this._counter++;
            if (id === this._counter)
                throw new Error('No more available IDs.');
            return id;
        };
        ObjectID.property = '@@ObjectID';
        ObjectID._counter = 1;
        return ObjectID;
    }()));
    var Serialization = (function () {
        function Serialization() {
            throw new Error(ErrorMessages.NEW_STATIC_CLASS);
        }
        Serialization.serialize = function (object) {
            return JSON.stringify(this.encode(object));
        };
        Serialization.deserialize = function (json) {
            return this.decode(JSON.parse(json));
        };
        Serialization.encode = function (value) {
            var result = { root: null, table: [] };
            result.root = this.flatten(value, result.table, Object.create(null));
            return result;
        };
        Serialization.flatten = function (value, table, map) {
            if (this.isObject(value)) {
                var id = System.ObjectID(value);
                if (!(id in map)) {
                    if (this.isFunction(value.onSerialize)) {
                        value.onSerialize();
                    }
                    var object_1 = value;
                    if (this.isFunction(value.toJSON)) {
                        object_1 = value.toJSON();
                    }
                    var type = System.Type(value);
                    var ref = new Serialization.ObjectReference(table.length);
                    var entry = new Serialization.Entry(type);
                    map[id] = ref;
                    table.push(entry);
                    if (this.isObject(object_1)) {
                        var data_1;
                        var recurse_1 = this.flatten.bind(this);
                        if (Array.isArray(object_1)) {
                            data_1 = object_1.map(function (value) { return recurse_1(value, table, map); });
                        }
                        else {
                            data_1 = Object.create(null);
                            Object.keys(object_1).forEach(function (key) {
                                data_1[key] = recurse_1(object_1[key], table, map);
                            });
                        }
                        entry.data = data_1;
                    }
                    else {
                        entry.data = object_1;
                    }
                }
                return map[id];
            }
            return value;
        };
        Serialization.decode = function (value) {
            var root = (value.root != null ? value.root : null);
            var table = (value.table != null ? value.table : []);
            var objects = new Array(table.length);
            var result = this.resolve(root, table, objects);
            return result;
        };
        Serialization.resolve = function (value, table, objects) {
            var ref = this.isObject(value) ? Serialization.ObjectReference.getReferenceNo(value) : null;
            if (ref != null) {
                if (!objects.hasOwnProperty(String(ref))) {
                    var entry = table[ref];
                    if (entry) {
                        var type = Serialization.Entry.getType(entry);
                        var data_2 = Serialization.Entry.getData(entry);
                        if (this.isObject(data_2)) {
                            var object_2 = Array.isArray(data_2) ? [] : Object.create(this.getPrototype(type));
                            objects[ref] = object_2;
                            var recurse_2 = this.resolve.bind(this);
                            if (this.isFunction(object_2.fromJSON)) {
                                Object.keys(data_2).forEach(function (key) {
                                    data_2[key] = recurse_2(data_2[key], table, objects);
                                });
                                object_2.fromJSON(data_2);
                            }
                            else {
                                Object.keys(data_2).forEach(function (key) {
                                    object_2[key] = recurse_2(data_2[key], table, objects);
                                });
                            }
                            if (this.isFunction(object_2.onDeserialize)) {
                                object_2.onDeserialize();
                            }
                        }
                        else {
                            objects[ref] = data_2;
                        }
                    }
                    else {
                        objects[ref] = void (0);
                    }
                }
                return objects[ref];
            }
            return value;
        };
        Serialization.getPrototype = function (type) {
            if (type != null) {
                if (!(type in this._typeCache)) {
                    var ctor = System.Type.find(type);
                    var prototype = ctor && ctor.prototype;
                    this._typeCache[type] = prototype;
                }
                var result = this._typeCache[type];
                if (result)
                    return result;
            }
            return Object.prototype;
        };
        Serialization.isObject = function (value) {
            return (value !== null && typeof value === 'object');
        };
        Serialization.isFunction = function (value) {
            return (typeof value === 'function');
        };
        Serialization._typeCache = Object.create(null);
        return Serialization;
    }());
    System.Serialization = Serialization;
    var Serialization;
    (function (Serialization) {
        var PROPERTY_TYPE = '@';
        var PROPERTY_DATA = '_';
        var PROPERTY_REF = '@ref';
        var Entry = (function () {
            function Entry(type, data) {
                this.type = type;
                this.data = data;
            }
            Object.defineProperty(Entry.prototype, "type", {
                get: function () { return this[PROPERTY_TYPE]; },
                set: function (value) { this[PROPERTY_TYPE] = value; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Entry.prototype, "data", {
                get: function () { return this[PROPERTY_DATA]; },
                set: function (value) { this[PROPERTY_DATA] = value; },
                enumerable: true,
                configurable: true
            });
            ;
            ;
            Entry.getType = function (object) {
                return object[PROPERTY_TYPE];
            };
            Entry.getData = function (object) {
                return object[PROPERTY_DATA];
            };
            return Entry;
        }());
        Serialization.Entry = Entry;
        var ObjectReference = (function () {
            function ObjectReference(refNo) {
                this.refNo = refNo;
            }
            Object.defineProperty(ObjectReference.prototype, "refNo", {
                get: function () { return this[PROPERTY_REF]; },
                set: function (value) { this[PROPERTY_REF] = value; },
                enumerable: true,
                configurable: true
            });
            ;
            ;
            ObjectReference.getReferenceNo = function (object) {
                return object[PROPERTY_REF];
            };
            return ObjectReference;
        }());
        Serialization.ObjectReference = ObjectReference;
    })(Serialization = System.Serialization || (System.Serialization = {}));
    var Utility = (function () {
        function Utility() {
            throw new Error(ErrorMessages.NEW_STATIC_CLASS);
        }
        Utility.isNumber = function (value) {
            return (typeof value === 'number' || value instanceof Number);
        };
        Utility.isString = function (value) {
            return (typeof value === 'string' || value instanceof String);
        };
        Utility.isObject = function (value) {
            var type = typeof value;
            return ((type === 'object' && value !== null) || type === 'function');
        };
        Utility.isFunction = function (value) {
            return (typeof value === 'function');
        };
        Utility.isArray = function (value) {
            return Array.isArray(value);
        };
        Utility.isUndefined = function (value) {
            return (value === void 0);
        };
        Utility.getFunctionName = function (func) {
            if (func.hasOwnProperty('name')) {
                return String(func.name);
            }
            else {
                var match = String(func).match(/^\s*function\s*(\S+?)\s*\(/);
                return match ? match[1] : '';
            }
        };
        Utility.global = (0, eval)('this');
        Utility.undefined = (void 0);
        return Utility;
    }());
    System.Utility = Utility;
    var ErrorMessages;
    (function (ErrorMessages) {
        ErrorMessages.NEW_STATIC_CLASS = "This is a static class.";
        ErrorMessages.NOT_IMPLEMENTED = "Not implemented.";
        ErrorMessages.NOT_SUPPORTED = "Not supoorted.";
    })(ErrorMessages = System.ErrorMessages || (System.ErrorMessages = {}));
})(System || (System = {}));
var MVPlugin = (function () {
    function MVPlugin(source, order) {
        this.name = source.name;
        this.description = source.description;
        this.parameters = new MVPlugin.Parameters(source.parameters);
        this.order = order;
        this.type = this.createTypeDecorator();
        this.typeAs = this.createTypeAsDecoratorFactory();
    }
    MVPlugin.get = function (name) {
        var plugin = this.find(name);
        if (!plugin)
            throw new Error("Missing plugin '" + name + "'.");
        return plugin;
    };
    MVPlugin.find = function (name) {
        return MVPlugin.PluginManager.getPlugin(name);
    };
    MVPlugin.prototype.validate = function (validator) {
        return validator(this.parameters);
    };
    MVPlugin.prototype.createTypeDecorator = function () {
        var module = this.name;
        return function (target) {
            System.Type.register(target, module);
        };
    };
    MVPlugin.prototype.createTypeAsDecoratorFactory = function () {
        var module = this.name;
        return function (name) {
            return function (target) {
                System.Type.register(target, module, name);
            };
        };
    };
    return MVPlugin;
}());
var MVPlugin;
(function (MVPlugin) {
    var SYMBOL_METHODS = '@methods';
    var SYMBOL_PROPERTIES = '@properties';
    function extension(type, static) {
        if (!static)
            type = type.prototype;
        return function (target) {
            var methods = target[SYMBOL_METHODS];
            if (methods) {
                methods.forEach(function (name) { return type[name] = target[name](type[name]); });
            }
            var properties = target[SYMBOL_PROPERTIES];
            if (properties) {
                properties.forEach(function (name) { return Object.defineProperty(type, name, Object.getOwnPropertyDescriptor(target, name)); });
            }
        };
    }
    MVPlugin.extension = extension;
    function extensionIf(type, condition, static) {
        var decorator = extension(type, static);
        return function (target) {
            if (condition)
                decorator(target);
        };
    }
    MVPlugin.extensionIf = extensionIf;
    function method(target, key) {
        var methods = (target[SYMBOL_METHODS] || (target[SYMBOL_METHODS] = []));
        methods.push(key);
    }
    MVPlugin.method = method;
    ;
    function methodIf(condition) {
        return function (target, key) {
            if (condition)
                method(target, key);
        };
    }
    MVPlugin.methodIf = methodIf;
    function property(target, key) {
        var properties = (target[SYMBOL_PROPERTIES] || (target[SYMBOL_PROPERTIES] = []));
        properties.push(key);
    }
    MVPlugin.property = property;
    function propertyIf(condition) {
        return function (target, key) {
            if (condition)
                property(target, key);
        };
    }
    MVPlugin.propertyIf = propertyIf;
    var PluginManager = (function () {
        function PluginManager() {
            throw new Error(System.ErrorMessages.NEW_STATIC_CLASS);
        }
        Object.defineProperty(PluginManager, "path", {
            get: function () { return System.Utility.global.PluginManager._path; },
            enumerable: true,
            configurable: true
        });
        PluginManager.initialize = function () {
            if (!this.initialized) {
                this.collectPluginInfo();
                this.initialized = true;
            }
        };
        PluginManager.contains = function (name) {
            return !!this.getPlugin(name);
        };
        PluginManager.getPlugin = function (name) {
            return this.plugins[name] || null;
        };
        PluginManager.getPlugins = function () {
            var _this = this;
            return Object.keys(this.plugins).map(function (key) { return _this.plugins[key]; });
        };
        PluginManager.getCurrentPlugin = function () {
            var name = this.getCurrentPluginName();
            var plugin = (name != null ? this.getPlugin(name) : null);
            return plugin;
        };
        PluginManager.getCurrentPluginName = function () {
            var script = this.getCurrentScript();
            var src = script.getAttribute('src');
            var name = src && this.nameTable[src];
            return name || null;
        };
        PluginManager.getCurrentScript = function () {
            return document.currentScript || (function () {
                var scripts = document.getElementsByTagName('script');
                return scripts[scripts.length - 1];
            })();
        };
        PluginManager.collectPluginInfo = function () {
            var _this = this;
            $plugins.forEach(function (source, index) {
                if (source.status) {
                    var name_2 = source.name;
                    if (!(name_2 in _this.plugins)) {
                        var plugin = new MVPlugin(source, index);
                        var src = _this.getPluginSrc(name_2);
                        _this.plugins[name_2] = plugin;
                        _this.nameTable[src] = name_2;
                    }
                }
            });
        };
        PluginManager.getPluginSrc = function (name) {
            return this.path + name + '.js';
        };
        PluginManager.plugins = Object.create(null);
        PluginManager.nameTable = Object.create(null);
        PluginManager.initialized = false;
        return PluginManager;
    }());
    MVPlugin.PluginManager = PluginManager;
    var PluginNameResolver = (function () {
        function PluginNameResolver() {
            PluginManager.initialize();
        }
        PluginNameResolver.prototype.resolve = function () {
            return MVPlugin.PluginManager.getCurrentPluginName();
        };
        return PluginNameResolver;
    }());
    MVPlugin.PluginNameResolver = PluginNameResolver;
    var Parameters = (function () {
        function Parameters(value) {
            this.value = value;
        }
        Parameters.prototype.int = function (name, radix) {
            var string = this.get(name);
            var value = parseInt(string, radix || 10);
            return (!isNaN(value) ? value : this.error(name, string));
        };
        Parameters.prototype.float = function (name) {
            var string = this.get(name);
            var value = parseFloat(string);
            return (!isNaN(value) ? value : this.error(name, string));
        };
        Parameters.prototype.bool = function (name) {
            var string = this.get(name);
            var value = Parameters.BOOLEAN_TABLE[string.toLowerCase()];
            return (value != null ? value : this.error(name, string));
        };
        Parameters.prototype.string = function (name) {
            return this.get(name);
        };
        Parameters.prototype.lower = function (name) {
            return this.get(name).toLowerCase();
        };
        Parameters.prototype.upper = function (name) {
            return this.get(name).toUpperCase();
        };
        Parameters.prototype.get = function (name) {
            if (!this.value.hasOwnProperty(name)) {
                throw new Error("Unknown parameter '" + name + "'.");
            }
            return this.value[name];
        };
        Parameters.prototype.error = function (name, string) {
            throw new Error("ParseError: " + name + " '" + string + "'");
        };
        Parameters.BOOLEAN_TABLE = {
            true: true, false: false,
            yes: true, no: false,
            on: true, off: false,
            enabled: true, disabled: false,
        };
        return Parameters;
    }());
    MVPlugin.Parameters = Parameters;
})(MVPlugin || (MVPlugin = {}));
(function () {
    System.moduleNameResolver = new MVPlugin.PluginNameResolver();
    var serializer = System.Serialization;
    JsonEx.stringify = function (object) { return serializer.serialize(object); };
    JsonEx.parse = function (json) { return serializer.deserialize(json); };
    var onload = window.onload;
    window.onload = function () {
        try {
            var registered_1 = [];
            MVPlugin.PluginManager.getPlugins().forEach(function (plugin) {
                if (System.has(plugin.name)) {
                    registered_1.push(plugin);
                }
                else {
                    System.set(plugin.name, null);
                }
            });
            registered_1.sort(function (x, y) { return x.order - y.order; });
            registered_1.forEach(function (plugin) { return System.execute(plugin.name); });
        }
        finally {
            onload.apply(this, arguments);
        }
    };
})();
