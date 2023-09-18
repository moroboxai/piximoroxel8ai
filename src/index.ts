import * as MoroboxAIGameSDK from "moroboxai-game-sdk";
import * as constants from "./constants";
import * as PIXI from "pixi.js";

export const VERSION = "0.1.0-alpha.21";

export interface AssetHeader {
    name?: string;
    path?: string;
}

export interface ExtendedGameHeader extends MoroboxAIGameSDK.GameHeader {
    main?: string;
    // Desired aspect ratio based on the native resolution of PixiMoroxel8AI
    aspectRatio?: string;
}

/**
 * Interface for the PixiMoroxel8AI.
 */
export interface IPixiMoroxel8AI {
    // Header of the game
    readonly header: ExtendedGameHeader;
    // The pixi.js module
    readonly PIXI: typeof PIXI;
    // Screen width
    readonly SWIDTH: number;
    // Screen height
    readonly SHEIGHT: number;
    // Instance of the player
    readonly player: MoroboxAIGameSDK.IPlayer;
    // Root container
    readonly stage: PIXI.Container;
    // Renderer of pixi.js
    readonly renderer: PIXI.Renderer;
    // Back buffer rendered to screen
    readonly backBuffer: PIXI.RenderTexture;
    // Auto clear the back buffer before each render
    autoClearBackBuffer: boolean;
}

// The game when loaded
export interface IGame {
    // Initialize the game
    init?: (vm: IPixiMoroxel8AI) => void;
    // Load the game assets
    load?: () => Promise<void>;
    // Save the state of the game
    saveState?: () => object;
    // Load the state of the game
    loadState?: (state: object) => void;
    // Get the game state for an agent
    getStateForAgent?: () => object;
    // Tick the game
    tick?: (inputs: Array<MoroboxAIGameSDK.IInputs>, delta: number, render: boolean) => void;
}

const GAME_FUNCTIONS = [
    "init",
    "load",
    "saveState",
    "loadState",
    "getStateForAgent",
    "tick"
];

/**
 * Load the game indicated in header.
 * @param {PixiMoroxel8AI} vm - instance of the PixiMoroxel8AI
 * @param {MoroboxAIGameSDK.IGameServer} gameServer - game server for accessing files
 * @returns {Promise} - loaded game
 */
function loadGame(
    vm: PixiMoroxel8AI,
    gameServer: MoroboxAIGameSDK.IGameServer
): Promise<IGame> {
    return new Promise<IGame>((resolve, reject) => {
        if (vm.options.game !== undefined) {
            return resolve(vm.options.game);
        }

        const main = vm.header.main;
        if (main === undefined) {
            return reject(
                "header is missing main attribute with the path to your main script"
            );
        }

        // use the game server to download main script
        return gameServer.get(main).then((data) => {
            // parse the main script to JavaScript
            let game: IGame = {};
            new Function(
                "vm",
                "stage",
                "PIXI",
                "exports",
                `${data}\n; ${GAME_FUNCTIONS.map(
                    (name) =>
                        `if (typeof ${name} !== "undefined") exports.${name} = ${name}`
                ).join(";")}`
            )(vm, vm.stage, vm.PIXI, game);
            return resolve(game);
        });
    });
}

/**
 * Load and initialize the game.
 * @param {MoroboxAIGameSDK.IPlayer} player - instance of the player
 * @param {PixiMoroxel8AI} vm - instance of PixiMoroxel8AI
 * @returns {Promise} - game instance
 */
function initGame(
    player: MoroboxAIGameSDK.IPlayer,
    vm: PixiMoroxel8AI
): Promise<IGame> {
    return new Promise<IGame>((resolve) => {
        // first load and parse the game
        return loadGame(vm, player.gameServer).then((game: IGame) => {
            console.log("loaded game with hooks", game);

            // init the game
            if (game.init !== undefined) {
                game.init(vm.proxy);
            }

            // load game assets
            if (game.load !== undefined) {
                return game.load().then(() => {
                    resolve(game);
                });
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

// Proxy of PixiMoroxel8AI
class VMProxy implements IPixiMoroxel8AI {
    private _vm: IPixiMoroxel8AI;

    constructor(vm: IPixiMoroxel8AI) {
        this._vm = vm;
    }

    get header(): ExtendedGameHeader {
        return this._vm.header;
    }

    get PIXI(): typeof PIXI {
        return this._vm.PIXI;
    }

    get SWIDTH(): number {
        return this._vm.SWIDTH;
    }

    get SHEIGHT(): number {
        return this._vm.SHEIGHT;
    }

    get player(): MoroboxAIGameSDK.IPlayer {
        return this._vm.player;
    }

    get stage(): PIXI.Container {
        return this._vm.stage;
    }

    get renderer(): PIXI.Renderer {
        return this._vm.renderer;
    }

    get backBuffer(): PIXI.RenderTexture {
        return this._vm.backBuffer;
    }

    get autoClearBackBuffer(): boolean {
        return this._vm.autoClearBackBuffer;
    }

    set autoClearBackBuffer(value: boolean) {
        this._vm.autoClearBackBuffer = value;
    }
}

export interface IPixiMoroxel8AIOptions {
    // Instance of the player
    player: MoroboxAIGameSDK.IPlayer;
    // Directly pass a game to PixiMoroxel8AI
    game?: IGame;
}

class PixiMoroxel8AI implements MoroboxAIGameSDK.IGame, IPixiMoroxel8AI {
    // Instance of the player
    private _player: MoroboxAIGameSDK.IPlayer;
    // Instance of the game
    private _game?: IGame;

    readonly options: IPixiMoroxel8AIOptions;
    readonly proxy: IPixiMoroxel8AI;
    private _app: PIXI.Application;
    private _backBuffer: BackBuffer;
    private _backStage: PIXI.Container;
    private _clearSprite: PIXI.Sprite;
    private _ticker = (delta: number) => this._tick(delta);
    // If the game has been attached and is playing
    private _isPlaying: boolean = false;
    private _displayedTickError: boolean = false;
    autoClearBackBuffer: boolean = true;

    constructor(options: IPixiMoroxel8AIOptions) {
        this.options = options;
        this.proxy = new VMProxy(this);
        this._player = options.player;
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

        // Adapt the format
        let screenWidth = constants.SCREEN_WIDTH;
        let screenHeight = constants.SCREEN_HEIGHT;
        const aspectRatio = this.header.aspectRatio;
        if (aspectRatio !== undefined) {
            const [a, b] = aspectRatio.split("/").map(s => parseInt(s));
            console.log(`desired ratio ${a}/${b} = ${a / b}`);
            if (a >= b) {
                screenHeight = Math.round(screenWidth * b / a);
            } else {
                screenWidth = Math.round(screenHeight * a / b);
            }
        }

        console.log(`game size ${screenWidth}x${screenHeight}`);

        this._backBuffer = new BackBuffer(
            screenWidth,
            screenHeight
        );
        this._backStage = new PIXI.Container();

        this._clearSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        this._clearSprite.width = screenWidth;
        this._clearSprite.height = screenHeight;
        this._clearSprite.tint = 0;

        this.resize();
    }

    // Load and initialize the game
    init(): Promise<void> {
        return new Promise<void>((resolve) => {
            // init the game and load assets
            initGame(this._player, this).then((game: IGame) => {
                // loaded the game
                this._game = game;
                this._initPixiJS();

                return resolve();
            });
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

    get width(): number {
        return this._backBuffer.buffer.width;
    }

    get height(): number {
        return this._backBuffer.buffer.height;
    }

    get scale(): number {
        return constants.SCREEN_SCALE;
    }

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
        this._app.destroy(true, {
            children: true,
            texture: true,
            baseTexture: true
        });
    }

    resize(): void {
        // Scale the game view according to parent div
        const resolution = 1;
        const realWidth = this._player.width;
        const realHeight = this._player.height;

        this._app.renderer.resolution = resolution;
        this._app.renderer.resize(realWidth, realHeight);
        this._backBuffer.sprite.scale.set(
            realWidth / this.SWIDTH,
            realHeight / this.SHEIGHT
        );
    }

    saveState(): object {
        return this._game?.saveState !== undefined
            ? this._game?.saveState()
            : {};
    }

    loadState(state: object) {
        if (this._game?.loadState !== undefined) {
            this._game?.loadState(state);
        }
    }

    getStateForAgent(): object {
        return this._game?.getStateForAgent !== undefined
            ? this._game?.getStateForAgent()
            : {};
    }

    tick(inputs: Array<MoroboxAIGameSDK.IInputs>, delta: number, render: boolean) {
        if (this._game?.tick !== undefined) {
            try {
                this._game?.tick(inputs, delta, render);
            } catch (e) {
                if (!this._displayedTickError) {
                    this._displayedTickError = true;
                    console.error(e);
                }
            }
        }

        if (!render) {
            return;
        }
        
        // Render the back stage to back buffer
        if (this.autoClearBackBuffer) {
            this._app.renderer.render(
                this._clearSprite,
                this._backBuffer.buffer
            );
        }
        this._app.renderer.render(this._backStage, this._backBuffer.buffer);

        // Render the back buffer to screen
        this._app.renderer.render(this._backBuffer.sprite);
    }

    // IPixiMoroxel8AI interface
    get header(): ExtendedGameHeader {
        return this.player.header as ExtendedGameHeader;
    }

    get PIXI(): typeof PIXI {
        return PIXI;
    }

    get SWIDTH(): number {
        return this._backBuffer.buffer.width;
    }

    get SHEIGHT(): number {
        return this._backBuffer.buffer.height;
    }

    get player(): MoroboxAIGameSDK.IPlayer {
        return this._player;
    }

    get stage(): PIXI.Container {
        return this._backStage;
    }

    get renderer(): PIXI.Renderer {
        return this._app.renderer;
    }

    get backBuffer(): PIXI.RenderTexture {
        return this._backBuffer.buffer;
    }
}

export function init(
    options: IPixiMoroxel8AIOptions
): Promise<MoroboxAIGameSDK.IGame> {
    const game = new PixiMoroxel8AI(options);
    return new Promise<MoroboxAIGameSDK.IGame>((resolve) => {
        game.init().then(() => {
            return resolve(game);
        });
    });
}

// Boot function called by MoroboxAIPlayer
export const boot: MoroboxAIGameSDK.IBoot = (
    player: MoroboxAIGameSDK.IPlayer
) => {
    return init({ player });
};
