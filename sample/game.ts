// select tilemap.png as the tilemap
import { IPixiMoroxel8AI } from '../lib';
const PIXI = require("pixi.js");

const ASSETS = [
    "MoroboxAIRetro.fnt",
    "palette.png",
    "tilemap.png"
];

var _vm: IPixiMoroxel8AI;

export function init(vm: IPixiMoroxel8AI) {
    console.log("init called", vm);
    _vm = vm;
}

export function load(): Promise<void> {
    console.log("load called");
    return new Promise<void>((resolve, reject) => {
        console.log("load assets");
        // Use PIXI.Loader to load assets
        const loader = new PIXI.Loader();

        // add each asset to the loader
        ASSETS.forEach((asset: string) => {
            loader.add(_vm.player.gameServer.href(`assets/${asset}`));
        });

        // Notify when done
        loader.onComplete.add(() => {
            console.log('assets loaded');
            resolve()
        });

        // Start loading
        loader.load();
    });
}

export function tick(deltaTime: any) {
}
