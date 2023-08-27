/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else {
		var a = factory();
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(self, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./game.ts":
/*!*****************!*\
  !*** ./game.ts ***!
  \*****************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   getStateForAgent: () => (/* binding */ getStateForAgent),\n/* harmony export */   init: () => (/* binding */ init),\n/* harmony export */   load: () => (/* binding */ load),\n/* harmony export */   reset: () => (/* binding */ reset),\n/* harmony export */   tick: () => (/* binding */ tick)\n/* harmony export */ });\n// Instance of the VM\r\nvar _vm;\r\n// Instance of pixi.js\r\nvar _PIXI;\r\nvar container;\r\nvar bunnyTexture;\r\n/**\r\n * Initializes the game.\r\n * @param {IPixiMoroxel8AI} vm - instance of the VM\r\n */\r\nfunction init(vm) {\r\n    console.log(\"init called\", vm);\r\n    _vm = vm;\r\n    _PIXI = vm.PIXI;\r\n}\r\n/**\r\n * Loads the game and its assets.\r\n */\r\nfunction load() {\r\n    console.log(\"load called\");\r\n    return new Promise((resolve, reject) => {\r\n        console.log(\"load assets\");\r\n        // use PIXI.Loader to load assets\r\n        const loader = new _PIXI.Loader();\r\n        // load bunny.png\r\n        loader.add(\"bunny\", _vm.player.gameServer.href(`assets/bunny.png`));\r\n        // notify when done\r\n        loader.onComplete.add(() => {\r\n            console.log('assets loaded');\r\n            // get bunny.png\r\n            bunnyTexture = loader.resources.bunny.texture;\r\n            resolve();\r\n        });\r\n        // start loading\r\n        loader.load();\r\n    });\r\n}\r\n/**\r\n * Resets the state of the game.\r\n */\r\nfunction reset() {\r\n    if (container !== undefined) {\r\n        _vm.stage.removeChild(container);\r\n    }\r\n    // Create a new clean container\r\n    container = new _PIXI.Container();\r\n    _vm.stage.addChild(container);\r\n    // Create a 5x5 grid of bunnies\r\n    for (let i = 0; i < 25; i++) {\r\n        const bunny = new _PIXI.Sprite(bunnyTexture);\r\n        bunny.anchor.set(0.5);\r\n        bunny.x = (i % 5) * 40;\r\n        bunny.y = Math.floor(i / 5) * 40;\r\n        container.addChild(bunny);\r\n    }\r\n    // Move container to the center\r\n    container.x = _vm.SWIDTH / 2;\r\n    container.y = _vm.SHEIGHT / 2;\r\n    // Center bunny sprite in local container coordinates\r\n    container.pivot.x = container.width / 2;\r\n    container.pivot.y = container.height / 2;\r\n}\r\n/**\r\n * Ticks the game.\r\n * @param {number} delta - elapsed time\r\n */\r\nfunction tick(inputs, delta) {\r\n    // Agent can rotate the bunnies left or right\r\n    if (inputs[0].left) {\r\n        container.angle -= 1 * delta;\r\n    }\r\n    else if (inputs[0].right) {\r\n        container.angle += 1 * delta;\r\n    }\r\n}\r\nfunction getStateForAgent() {\r\n    // Send the position and angle of the container to agent\r\n    return {\r\n        x: container.x,\r\n        y: container.y,\r\n        angle: container.angle\r\n    };\r\n}\r\n\n\n//# sourceURL=webpack:///./game.ts?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./game.ts"](0, __webpack_exports__, __webpack_require__);
/******/ 	
/******/ 	return __webpack_exports__;
/******/ })()
;
});