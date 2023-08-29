import * as MoroboxAIGameSDK from "moroboxai-game-sdk";
// In the real world: import { IPixiMoroxel8AI } from 'piximoroxel8ai';
import { IPixiMoroxel8AI } from '../lib';

// Instance of the VM
var _vm: IPixiMoroxel8AI;

// Instance of pixi.js
var _PIXI: typeof PIXI;

var container: PIXI.Container;
var bunnyTexture: PIXI.Texture;

/**
 * Initializes the game.
 * @param {IPixiMoroxel8AI} vm - instance of the VM
 */
export function init(vm: IPixiMoroxel8AI) {
    console.log("init called", vm);
    _vm = vm;
    _PIXI = vm.PIXI;
}

/**
 * Loads the game and its assets.
 */
export function load(): Promise<void> {
    console.log("load called");
    return new Promise<void>((resolve, reject) => {
        console.log("load assets");
        // use PIXI.Loader to load assets
        const loader = new _PIXI.Loader();

        // load bunny.png
        loader.add("bunny", _vm.player.gameServer.href(`assets/bunny.png`));

        // notify when done
        loader.onComplete.add(() => {
            console.log('assets loaded');

            // get bunny.png
            bunnyTexture = loader.resources.bunny.texture;

            resolve()
        });

        // start loading
        loader.load();
    });
}

/**
 * Resets the state of the game.
 */
export function reset() {
    if (container !== undefined) {
        _vm.stage.removeChild(container);
    }

    // Create a new clean container
    container = new _PIXI.Container();
    _vm.stage.addChild(container);

    // Create a 5x5 grid of bunnies
    for (let i = 0; i < 25; i++) {
        const bunny = new _PIXI.Sprite(bunnyTexture);
        bunny.anchor.set(0.5);
        bunny.x = (i % 5) * 40;
        bunny.y = Math.floor(i / 5) * 40;
        container.addChild(bunny);
    }

    // Move container to the center
    container.x = _vm.SWIDTH / 2;
    container.y = _vm.SHEIGHT / 2;

    // Center bunny sprite in local container coordinates
    container.pivot.x = container.width / 2;
    container.pivot.y = container.height / 2;

}

/**
 * Ticks the game.
 * @param {number} delta - elapsed time
 */
export function tick(inputs: Array<MoroboxAIGameSDK.IInputs>, delta: number) {
    // Agent can rotate the bunnies left or right
    if (inputs[0].left) {
        container.angle -= 1 * delta;
    } else if (inputs[0].right) {
        container.angle += 1 * delta;
    }
}

export interface IGameState {
    x: number;
    y: number;
    angle: number;
}

export function getStateForAgent(): IGameState {
    // Send the position and angle of the container to agent
    return {
        x: container.x,
        y: container.y,
        angle: container.angle
    };
}