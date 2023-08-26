import * as MoroboxAIGameSDK from 'moroboxai-game-sdk';
import * as PIXI from 'pixi.js';

const PHYSICS_TIMESTEP = 0.01;

export interface AssetHeader {
    name?: string;
    path?: string;
}

export interface IPixiMoroxel8AI {
    // Instance of the player
    player: MoroboxAIGameSDK.IPlayer
}

interface ExtendedGameHeader extends MoroboxAIGameSDK.GameHeader {
    assets?: AssetHeader[];
    main?: string;
    script?: string;
}

// The game when loaded
interface IGame {
    // Initialize the game with PixiMoroxel8AI
    init?: (vm: IPixiMoroxel8AI) => void
    // Load the game assets
    load?: () => Promise<void>,
    // Tick the game
    tick?: () => void
}

/**
 * Load the game indicated in header.
 * @param {ExtendedGameHeader} header - game header
 * @param {MoroboxAIGameSDK.IGameServer} gameServer - game server for accessing files
 * @returns {Promise} - loaded game
 */
function loadGame(header: ExtendedGameHeader, gameServer: MoroboxAIGameSDK.IGameServer): Promise<IGame> {
    return new Promise<IGame>((resolve, reject) => {
        if (header.main === undefined) {
            return reject('header is missing main attribute with the path to your main script');
        }

        // use the game server to download main script
        return gameServer.get(header.main).then(data => {
            // parse the main script to JavaScript
            let game: IGame = {};
            (new Function('exports', data))(game);
            return resolve(game);
        });
    });
}

/**
 * Load and initialize the game.
 * @param {MoroboxAIGameSDK.IPlayer} player - instance of the player
 * @param {IPixiMoroxel8AI} vm - instance of PixiMoroxel8AI
 * @param {Function} assetLoaded - function called for each loaded asset
 * @returns {Promise} - game instance
 */
function initGame(player: MoroboxAIGameSDK.IPlayer, vm: IPixiMoroxel8AI, assetLoaded: (asset: AssetHeader, res: PIXI.LoaderResource) => void): Promise<IGame> {
    return new Promise<IGame>((resolve) => {
        // the player contains the game header
        const header = player.header as ExtendedGameHeader;

        // first load and parse the game
        return loadGame(
            header,
            player.gameServer
        ).then((game: IGame) => {
            console.log("loaded game with hooks", game);

            // initialize the game
            if (game.init !== undefined) {
                game.init(vm);
            }

            // load game assets
            if (game.load !== undefined) {
                return game.load().then(() => {
                    resolve(game);
                })
            }

            return resolve(game);
        });
    });
}

class PixiMoroxel8AI implements MoroboxAIGameSDK.IGame, IPixiMoroxel8AI {
    // Instance of the player
    private _player: MoroboxAIGameSDK.IPlayer;
    // Instance of the game
    private _game?: IGame;

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
        initGame(player, this, (asset, res) => this._handleAssetLoaded(asset, res)).then((game: IGame) => {
            // received the game script
            this._game = game;
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

    // IPixiMoroxel8AI interface
    get player(): MoroboxAIGameSDK.IPlayer { return this._player; }
}

export const boot: MoroboxAIGameSDK.IBoot = (player: any) => {
    return new PixiMoroxel8AI(player);
};
