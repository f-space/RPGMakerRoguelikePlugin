/*:
 * @plugindesc PluginSystemのサンプル
 * @author F_
 * 
 * @param SampleParameter
 * @desc サンプルパラメータ
 * @default 100
 * 
 * @help
 * PluginSystemプラグインの使い方の説明。
 * 存在しないプラグインへの依存を設定している都合上、
 * 実際には実行できないので注意。
 * 
 * Copyright (c) 2016 F_
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */

// --- 準備 ---
// PluginSystemプラグインを必ず最初に実行する

// --- 実行に必要な他のプラグインを列挙 ---
// ここに記述したプラグインよりも後にコールバック関数が呼び出される
PluginSystem.require('OtherPluginName1');
PluginSystem.require('OtherPluginName2');

// --- プラグインパラメータのバリデータの設定 ---
// 引数にPluginManager.parametersで取得したパラメータオブジェクトが渡される
// 引数自体に変更を加えるか新しいパラメータオブジェクトを返す
PluginSystem.validate(function (params) {
	return {
		sample: parseInteger(params['SampleParameter']).clamp(0, 100),
	};
});

// --- 名前空間を指定してコールバックを登録 ---
// 名前空間は"Parent.Child"のようにドットで区切るか、キーワードを指定
// "self"でプラグイン名自体、"auto"でプラグイン名をいい感じに区切った名前空間になる
// nullを指定した場合にはグローバルスコープをラップした名前空間が使われる
//
// コールバック関数はすべてのプラグイン実行後に依存関係に違反しない制約のもと順番に呼び出される
// コールバック関数の第一引数およびthisは指定した名前空間のスコープオブジェクトで、
// 名前空間に登録されたオブジェクトがすべて展開されたオブジェクトとなる
// コールバック関数の第二引数はプラグインのパラメータ
PluginSystem.ns('self', function (scope, params) {

	// 他の名前空間のオブジェクトをスコープオブジェクトに展開
	// include,import,using的な使い方
	scope.extract('Other.Namespace');

	// 他の名前空間およびオブジェクトの検索
	var ns = scope.find('Other.Namespace');
	var ctor = ns.find('OtherClass');

	// --- プロパティの定義 ---
	// プロパティ名、 オブジェクトを指定してプロパティを定義
	// 名前空間およびスコープオブジェクトに対して定義される
	scope.define('MyEnum', Object.create(Object.prototype, {
		ValueA: { value: "ValueA" },
		ValueB: { value: "ValueB" },
	}));

	// --- クラスの定義 ---
	// クラス名、コンストラクタ、シリアライズ可能かどうかを指定してクラスを定義
	// 第二引数に関数を指定した場合には自動的に実行されて、戻り値が使用される
	// 第三引数にtrueを指定すると、コンストラクタがシステムに登録され、
	// デシリアライズ時にプロトタイプオブジェクトが自動的に設定されるようになる
	scope.define('MyClass', function () {
		function MyClass() { }

		// スコープオブジェクトを参照して別のクラスを継承
		MyClass.prototype = Object.create(scope.OtherClass.prototype);
		MyClass.prototype.constructor = MyClass;

		// onSerializeという名前の関数プロパティはシリアライズ前に呼び出される
		MyClass.prototype.onSerialize = function () { };

		// onDeserializeという名前の関数プロパティはデシリアライズ後に呼び出される
		MyClass.prototype.onDeserialize = function () { };

		// toJSONでシリアライズをカスタマイズ（JavaScriptの仕様）
		// デシリアライズ時に特定のプロトタイプオブジェクトを設定したければ、
		// '@'という名前のプロパティにコンストラクタ名を設定する
		MyClass.prototype.toJSON = function () { return '...'; }

		return MyClass;
	}, true);
});

// --- その他 ---
// # プラグインシステムに登録されたコールバック関数は、
//   すべての登録されていないプラグインより後に実行されるため注意
// # 実行順序は自動的に解決されるが、失敗ごとに再度リストを走査するため注意
//   予め手動で問題ない順序にした方がパフォーマンスはいい

// --- 未対応 ---
// # プラグインシステム非対応プラグインに対する依存
// # Optionalな実行順序依存
// # IE (document.currentScriptが動かないらしい)
//   NW.js上でしか動作確認していないので他の環境でも動かないとこあるかも
