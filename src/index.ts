import * as MoroboxAIGameSDK from 'moroboxai-game-sdk';
import * as constants from "./constants";
import * as PIXI from 'pixi.js';


export interface AssetHeader {
    name?: string;
    path?: string;
}

export interface IPixiMoroxel8AI {
    // The pixi.js module
    PIXI: typeof PIXI;
    // Screen width
    SWIDTH: number;
    // Screen height
    SHEIGHT: number;
    // Instance of the player
    player: MoroboxAIGameSDK.IPlayer;
    // Root container
    stage: PIXI.Container;
}

interface ExtendedGameHeader extends MoroboxAIGameSDK.GameHeader {
    assets?: AssetHeader[];
    main?: string;
    script?: string;
}

// The game when loaded
interface IGame {
    // Initialize the game with PixiMoroxel8AI
    init?: (vm: IPixiMoroxel8AI) => void;
    // Load the game assets
    load?: () => Promise<void>;
    // Reset the state of the game
    reset?: () => void;
    // Save the state of the game
    saveState?: () => object;
    // Load the state of the game
    loadState?: (state: object) => void;
    // Get the game state for an agent
    getStateForAgent?: () => object;
    // Tick the game
    tick?: (inputs: Array<MoroboxAIGameSDK.IInputs>, delta: number) => void;
}

const GAME_FUNCTIONS = ["init", "load", "reset", "saveState", "loadState", "getStateForAgent", "tick"];

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
            (new Function('exports', `${data}\n; ${GAME_FUNCTIONS.map(name => `if (typeof ${name} !== "undefined") exports.${name} = ${name}`).join(';')}`))(game);
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
function initGame(player: MoroboxAIGameSDK.IPlayer, vm: IPixiMoroxel8AI): Promise<IGame> {
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

// RenderTexture used to render the game offscreen
class BackBuffer {
    public buffer: PIXI.RenderTexture;
    public sprite: PIXI.Sprite;

    constructor(width: number, height: number) {
        this.buffer = PIXI.RenderTexture.create({ width, height });
        this.sprite = new PIXI.Sprite(this.buffer);
        this.sprite.pivot.set(0, 0);
        this.sprite.position.set(0, 0);
    }
}

class PixiMoroxel8AI implements MoroboxAIGameSDK.IGame, IPixiMoroxel8AI {
    // Instance of the player
    private _player: MoroboxAIGameSDK.IPlayer;
    // Instance of the game
    private _game?: IGame;

    private _app: PIXI.Application;
    private _backBuffer: BackBuffer;
    private _backStage: PIXI.Container;
    private _clearSprite: PIXI.Sprite;
    private _ticker = (delta: number) => this._tick(delta);
    // If the game has been attached and is playing
    private _isPlaying: boolean = false;
    private _displayedTickError: boolean = false;

    constructor(player: MoroboxAIGameSDK.IPlayer) {
        this._player = player;
        PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

        this._app = new PIXI.Application({
            backgroundColor: 0x0,
            resolution: 1,
            autoDensity: true,
            width: this._player.width,
            height: this._player.height,
            clearBeforeRender: false,
            antialias: false
        });

        this._backBuffer = new BackBuffer(constants.SCREEN_WIDTH, constants.SCREEN_HEIGHT);
        this._backStage = new PIXI.Container();

        this._clearSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        this._clearSprite.width = constants.SCREEN_WIDTH;
        this._clearSprite.height = constants.SCREEN_HEIGHT;
        this._clearSprite.tint = 0;

        this.resize();

        // init the game and load assets
        initGame(player, this).then((game: IGame) => {
            // loaded the game
            this._game = game;
            this._initPixiJS();

            // reset the game state
            if (this._game.reset !== undefined) {
                this._game.reset();
            }

            // calling ready will call play
            player.ready();
        });
    }

    /**
     * Initialize the PixiJS application.
     */
    _initPixiJS() {
        // attach PIXI view to root HTML element
        this._player.root.appendChild(this._app.view);
    }

    // Physics loop
    private _tick(delta: number) {
        if (this.ticker !== undefined) {
            this.ticker(delta);
        }
    }

    // IGame interface
    speed: number = 1;
    ticker?: (delta: number) => void;

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
        // Remove the tick function
        if (this._app !== undefined) {
            this._app.ticker.remove(this._ticker);
        }
    }

    stop(): void {
        this._app.destroy(true, { children: true, texture: true, baseTexture: true });
    }

    reset(): void {
        if (this._game?.reset !== undefined) {
            this._game.reset();
        }
    }

    resize(): void {
        // Scale the game view according to parent div
        const resolution = 1;
        const realWidth = this._player.width;
        const realHeight = this._player.height;

        this._app.renderer.resolution = resolution;
        this._app.renderer.resize(realWidth, realHeight);
        this._backBuffer.sprite.scale.set(realWidth / this.SWIDTH, realHeight / this.SHEIGHT);
    }

    saveState(): object {
        return this._game?.saveState !== undefined ? this._game?.saveState() : {};
    }

    loadState(state: object) {
        if (this._game?.loadState !== undefined) {
            this._game?.loadState(state);
        }
    }

    getStateForAgent(): object {
        return this._game?.getStateForAgent !== undefined ? this._game?.getStateForAgent() : {};
    }

    tick(inputs: Array<MoroboxAIGameSDK.IInputs>, delta: number) {
        if (this._game?.tick !== undefined) {
            try {
                this._game?.tick(inputs, delta);
            } catch (e) {
                if (!this._displayedTickError) {
                    this._displayedTickError = true;
                    console.error(e);
                }
            }
        }

        // Render the back stage to back buffer
        this._app.renderer.render(this._clearSprite, this._backBuffer.buffer);
        this._app.renderer.render(this._backStage, this._backBuffer.buffer);

        // Render the back buffer to screen
        this._app.renderer.render(this._backBuffer.sprite);
    }

    // IPixiMoroxel8AI interface
    get PIXI(): typeof PIXI { return PIXI }

    get SWIDTH(): number { return constants.SCREEN_WIDTH; }

    get SHEIGHT(): number { return constants.SCREEN_HEIGHT; }

    get player(): MoroboxAIGameSDK.IPlayer { return this._player; }

    get stage(): PIXI.Container { return this._backStage; }
}

export const boot: MoroboxAIGameSDK.IBoot = (player: any) => {
    return new PixiMoroxel8AI(player);
};
