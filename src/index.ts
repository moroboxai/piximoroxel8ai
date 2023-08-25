import * as MoroboxAIGameSDK from 'moroboxai-game-sdk';
import * as PIXI from 'pixi.js';

const PHYSICS_TIMESTEP = 0.01;

export interface AssetHeader {
    name?: string;
    path?: string;
}

export interface IPixiMoroxel8AI {

}

interface ExtendedGameHeader extends MoroboxAIGameSDK.GameHeader {
    assets?: AssetHeader[];
    main?: string;
    language?: string;
    script?: string;
}

interface GameScript {
    language: 'javascript' | 'lua',
    script: string;
}

/**
 * Load the main script indicated in game header.
 * @param {ExtendedGameHeader} header - game header
 * @param {MoroboxAIGameSDK.IGameServer} gameServer - game server for accessing files
 * @returns {Promise} - content of the main script
 */
function loadMain(header: ExtendedGameHeader, gameServer: MoroboxAIGameSDK.IGameServer): Promise<GameScript> {
    return new Promise<GameScript>((resolve, reject) => {
        if (header.script !== undefined) {
            if (header.language === undefined) {
                return reject('header is missing language attribute');
            }

            if (header.language !== 'javascript' && header.language !== 'lua') {
                return reject(`unknown script language ${header.language} in header`);
            }

            return resolve({
                language: header.language,
                script: header.script
            });
        }

        if (header.main === undefined) {
            return reject('header is missing main attribute with the path to your main script');
        }

        return gameServer.get(header.main).then(data => resolve({
            language: header.main!.endsWith('.js') ? 'javascript' : 'lua',
            script: data
        }));
    });
}

/**
 * Load a list of assets from the game server.
 * @param {AssetHeader[]} assets - list of assets to load
 * @param {MoroboxAIGameSDK.IGameServer} gameServer - game server for accessing files
 * @param {function} assetLoaded - function called for each loaded asset
 * @returns {Promise} - a promise
 */
function loadAssets(assets: AssetHeader[] | undefined, gameServer: MoroboxAIGameSDK.IGameServer, assetLoaded: (asset: AssetHeader, res: PIXI.LoaderResource) => void): Promise<void> {
    return new Promise((resolve) => {
        if (assets === undefined || assets.length === 0) {
            // no assets to load
            resolve();
            return;
        }

        console.log("loading assets...");
        const loader = new PIXI.Loader();

        // add each asset to the loader
        const validAssets = new Array<AssetHeader>();
        assets.forEach(_ => {
            if (_.name === undefined) {
                console.error('skip asset without name');
                return;
            }

            if (_.path === undefined) {
                console.error('skip asset without path');
                return;
            }

            console.log(`loading ${_.path}...`);
            validAssets.push(_);
            loader.add(gameServer.href(`assets/${_.path}`));
        });

        loader.onComplete.add(() => {
            // dispatch loaded assets
            validAssets.forEach(_ => {
                assetLoaded(_, loader.resources[gameServer.href(`assets/${_.path}`)]);
            });

            console.log('assets loaded');
            resolve()
        });
        loader.load();
    });
}

/**
 * Load and initialize the game.
 * @param {MoroboxAIGameSDK.IPlayer} player - player instance 
 * @param {Function} assetLoaded - function called for each loaded asset
 * @returns {Promise} - content of the main script
 */
function initGame(player: MoroboxAIGameSDK.IPlayer, assetLoaded: (asset: AssetHeader, res: PIXI.LoaderResource) => void): Promise<GameScript> {
    return new Promise<GameScript>((resolve) => {
        const header = player.header as ExtendedGameHeader;

        return loadMain(
            header,
            player.gameServer
        ).then((data) => {
            return loadAssets(
                header.assets,
                player.gameServer,
                assetLoaded
            ).then(() => resolve(data));
        });
    });
}

class piximoroxel8ai implements MoroboxAIGameSDK.IGame, IPixiMoroxel8AI {
    private _player: MoroboxAIGameSDK.IPlayer;
    // Main Lua script of the game
    private _gameScript?: GameScript;

    private _app: PIXI.Application;
    private _ticker = (delta: number) => this._tick(delta);
    // If the game has been attached and is playing
    private _isPlaying: boolean = false;
    private _displayedTickError: boolean = false;
    private _physicsAccumulator: number = 0;

    constructor(player: MoroboxAIGameSDK.IPlayer) {
        this._player = player;
        PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

        this._app = new PIXI.Application({
            backgroundColor: 0x0,
            resolution: window.devicePixelRatio || 1,
            width: this._player.width,
            height: this._player.height,
            clearBeforeRender: false,
            antialias: false
        });

        // init the game and load assets
        initGame(player, (asset, res) => this._handleAssetLoaded(asset, res)).then((data) => {
            // received the game script
            this._gameScript = data;
            this._initPixiJS();

            // calling ready will call play
            player.ready();
        });
    }

    _handleAssetLoaded(asset: AssetHeader, res: PIXI.LoaderResource) {
    }

    /**
     * Initialize the PixiJS application.
     */
    _initPixiJS() {
        // attach PIXI view to root HTML element
        this._player.root.appendChild(this._app.view);
    }

    // Physics loop
    private _update(deltaTime: number) {
    }

    private _tick(delta: number) {
    }

    // IGame interface
    speed: number = 1;

    help(): string {
        return "";
    }

    play(): void {
        if (this._app === undefined || this._isPlaying) {
            return;
        }

        this._isPlaying = true;
        this._displayedTickError = false;

        this.resize();

        // register the tick function
        this._ticker = (delta: number) => this._tick(delta);
        this._app.ticker.add(this._ticker);
    }

    pause(): void {
        if (this._app !== undefined) {
            this._app.ticker.remove(this._ticker);
        }
    }

    stop(): void {
        this._app.destroy(true, { children: true, texture: true, baseTexture: true });
    }

    resize(): void {
        // Scale the game view according to parent div
        const realWidth = this._player.width;
        const realHeight = this._player.height;

        this._app.renderer.resize(realWidth, realHeight);
    }

    // Ipiximoroxel8ai interface
    P1: number = 0;
    P2: number = 1;
    BLEFT: number = 0;
    BRIGHT: number = 1;
    BUP: number = 2;
    BDOWN: number = 3;
}

export const boot: MoroboxAIGameSDK.IBoot = (player: any) => {
    return new piximoroxel8ai(player);
};
