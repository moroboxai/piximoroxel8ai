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

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   getStateForAgent: () => (/* binding */ getStateForAgent),\n/* harmony export */   init: () => (/* binding */ init),\n/* harmony export */   load: () => (/* binding */ load),\n/* harmony export */   reset: () => (/* binding */ reset),\n/* harmony export */   tick: () => (/* binding */ tick)\n/* harmony export */ });\n// Instance of the VM\nvar _vm;\n// Instance of pixi.js\nvar _PIXI;\nvar container;\nvar bunnyTexture;\n/**\n * Initializes the game.\n * @param {IPixiMoroxel8AI} vm - instance of the VM\n */\nfunction init(vm) {\n    console.log(\"init called\", vm);\n    _vm = vm;\n    _PIXI = vm.PIXI;\n}\n/**\n * Loads the game and its assets.\n */\nfunction load() {\n    console.log(\"load called\");\n    return new Promise((resolve, reject) => {\n        console.log(\"load assets\");\n        // use PIXI.Loader to load assets\n        const loader = new _PIXI.Loader();\n        // load bunny.png\n        loader.add(\"bunny\", _vm.player.gameServer.href(`assets/bunny.png`));\n        // notify when done\n        loader.onComplete.add(() => {\n            console.log('assets loaded');\n            // get bunny.png\n            bunnyTexture = loader.resources.bunny.texture;\n            resolve();\n        });\n        // start loading\n        loader.load();\n    });\n}\n/**\n * Resets the state of the game.\n */\nfunction reset() {\n    if (container !== undefined) {\n        _vm.stage.removeChild(container);\n    }\n    // Create a new clean container\n    container = new _PIXI.Container();\n    _vm.stage.addChild(container);\n    // Create a 5x5 grid of bunnies\n    for (let i = 0; i < 25; i++) {\n        const bunny = new _PIXI.Sprite(bunnyTexture);\n        bunny.anchor.set(0.5);\n        bunny.x = (i % 5) * 40;\n        bunny.y = Math.floor(i / 5) * 40;\n        container.addChild(bunny);\n    }\n    // Move container to the center\n    container.x = _vm.SWIDTH / 2;\n    container.y = _vm.SHEIGHT / 2;\n    // Center bunny sprite in local container coordinates\n    container.pivot.x = container.width / 2;\n    container.pivot.y = container.height / 2;\n}\n/**\n * Ticks the game.\n * @param {number} delta - elapsed time\n */\nfunction tick(inputs, delta) {\n    // Agent can rotate the bunnies left or right\n    if (inputs[0].left) {\n        container.angle -= 1 * delta;\n    }\n    else if (inputs[0].right) {\n        container.angle += 1 * delta;\n    }\n}\nfunction getStateForAgent() {\n    // Send the position and angle of the container to agent\n    return {\n        x: container.x,\n        y: container.y,\n        angle: container.angle\n    };\n}\n\n\n//# sourceURL=webpack:///./game.ts?");

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