import * as MoroboxAIGameSDK from "moroboxai-game-sdk";
import * as constants from "./constants";
import * as PIXI from "pixi.js";

export const VERSION = "__VERSION__";

/**
 * Parameters passed to the entrypoint of the game.
 *
 * Those parameters are passed by PixiMoroxel8AI when booting the
 * game specified in the header.
 */
export interface MainOptions {
    vm: IVM;
    stage: PIXI.Container;
    PIXI: typeof PIXI;
}

/**
 * Entrypoint of the game.
 *
 * Passing the entrypoint in code can be useful in development mode,
 * where the default behavior of PixiMoroxel8AI, of making a big
 * eval of the main file of the game, can cause issues with imports
 * and exports.
 */
export interface MainFunction {
    (options: MainOptions): Promise<IGame>;
}

/**
 * Something that looks like an entrypoint.
 */
export type MainLike = string | MainFunction;

/**
 * Game header extended with PixiMoroxel8AI-specific settings.
 */
export interface GameHeader extends MoroboxAIGameSDK.GameHeader {
    // Entrypoint of the game
    main?: MainLike;
    // Desired aspect ratio based on the native resolution of PixiMoroxel8AI
    aspectRatio?: string;
}

/**
 * Interface for the instance of PixiMoroxel8AI.
 *
 * This interface is meant to be known and used only from libraries
 * embedding PixiMoroxelAI in the browser, and not from games.
 */
export interface IPixiMoroxel8AI
    extends MoroboxAIGameSDK.IGame,
        MoroboxAIGameSDK.IBootable {}

/**
 * Interface for the VM running the game.
 *
 * This interface is meant to be known and used from games.
 */
export interface IVM {
    // Header of the game
    readonly header: GameHeader;
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
    init?: (vm: IVM) => void;
    // Load the game assets
    load?: () => Promise<void>;
    // Save the state of the game
    saveState?: () => object;
    // Load the state of the game
    loadState?: (state: object) => void;
    // Get the game state for an agent
    getStateForAgent?: () => object;
    // Tick the game
    tick?: (
        inputs: Array<MoroboxAIGameSDK.Inputs>,
        delta: number,
        render: boolean
    ) => void;
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
        // Override the main from header
        if (vm.options.main !== undefined) {
            vm.header.main = vm.options.main;
        }

        const main = vm.header.main;
        if (main === undefined) {
            return reject(
                "header is missing main attribute with the path to your main script"
            );
        }

        if (typeof main === "function") {
            // User passed a function acting as the entrypoint of the game
            return resolve(
                main({
                    vm,
                    stage: vm.stage,
                    PIXI: vm.PIXI
                })
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

/**
 * Proxy of the VM for access from games.
 */
class VMProxy implements IVM {
    private _vm: IVM;

    constructor(vm: IVM) {
        this._vm = vm;
    }

    get header(): GameHeader {
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

/**
 * Possible modes for running PixiMoroxel8AI.
 */
export type Mode = "development" | "production";

/**
 * Options for PixiMoroxel8AI.
 */
export interface PixiMoroxel8AIOptions {
    // Mode
    mode?: Mode;
    // Override the main defined in header
    main?: MainLike;
}

class PixiMoroxel8AI implements IPixiMoroxel8AI, IVM {
    // Options for PixiMoroxel8AI.
    readonly options: PixiMoroxel8AIOptions;
    private _bootOptions?: MoroboxAIGameSDK.BootOptions;
    // Instance of the player
    private _player?: MoroboxAIGameSDK.IPlayer;
    // Instance of the game
    private _game?: IGame;
    readonly proxy: IVM;
    private _app: PIXI.Application;
    private _backBuffer: BackBuffer;
    private _backStage: PIXI.Container;
    private _clearSprite: PIXI.Sprite;
    private _ticker = (delta: number) => this._tick(delta);
    // If the game has been attached and is playing
    private _isPlaying: boolean = false;
    private _displayedTickError: boolean = false;
    autoClearBackBuffer: boolean = true;

    constructor(options?: PixiMoroxel8AIOptions) {
        this.options = options ?? {};
        this.proxy = new VMProxy(this);
        PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

        // Create the app
        this._app = new PIXI.Application({
            backgroundColor: 0x0,
            resolution: 1,
            autoDensity: true,
            width: constants.SCREEN_WIDTH,
            height: constants.SCREEN_HEIGHT,
            clearBeforeRender: false,
            antialias: false
        });

        // Create the stage for game
        this._backBuffer = new BackBuffer(
            constants.SCREEN_WIDTH,
            constants.SCREEN_HEIGHT
        );
        this._backStage = new PIXI.Container();

        this._clearSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        this._clearSprite.width = constants.SCREEN_WIDTH;
        this._clearSprite.height = constants.SCREEN_HEIGHT;
        this._clearSprite.tint = 0;

        if (this.options.mode === "development") {
            console.log("hook PixiMoroxel8AI API");
            this.hookAPI(window);
        }
    }

    /**
     * Hook the API provided by PixiMoroxel8AI.
     *
     * Games written for PixiMoroxel8AI need to have access to the instance
     * of PIXI, and the stage, provided by PixiMoroxel8AI. This is usually
     * done by passing some variables when loading the script of the game,
     * but in development mode, it may be desirable to inject these variables
     * directly into the window object to make it globally available.
     * @param {any} target - target object for the API
     */
    hookAPI(target: any) {
        target.PIXI = PIXI;
        target.stage = this.stage;
        target.vm = this;
    }

    /**
     * Boot function called by MoroxoAIPlayer.
     */
    boot: MoroboxAIGameSDK.BootFunction = (
        options: MoroboxAIGameSDK.BootOptions
    ): Promise<MoroboxAIGameSDK.IGame> => {
        return new Promise<MoroboxAIGameSDK.IGame>((resolve) => {
            // At this point the header has been loaded
            this._bootOptions = options;
            this._player = options.player;

            // Adapt the format
            let screenWidth = constants.SCREEN_WIDTH;
            let screenHeight = constants.SCREEN_HEIGHT;
            const aspectRatio = this.header.aspectRatio;
            if (aspectRatio !== undefined) {
                const [a, b] = aspectRatio.split("/").map((s) => parseInt(s));
                console.log(`desired ratio ${a}/${b} = ${a / b}`);
                if (a >= b) {
                    screenWidth = Math.round((screenHeight * a) / b);
                } else {
                    screenHeight = Math.round((screenWidth * b) / a);
                }
            }

            console.log(`game size ${screenWidth}x${screenHeight}`);
            this.backBuffer.resize(screenWidth, screenHeight);

            // Boot the game
            return this._bootGame().then(() => {
                // Resize to desired game size
                this.resize();
                return resolve(this);
            });
        });
    };

    // Load and initialize the game
    _bootGame(): Promise<IGame> {
        return new Promise<IGame>((resolve, reject) => {
            if (this._player === undefined) {
                return reject("player not defined");
            }

            // init the game and load assets
            initGame(this._player, this).then((game: IGame) => {
                // loaded the game
                this._game = game;
                this._initPixiJS();

                return resolve(game);
            });
        });
    }

    /**
     * Initialize the PixiJS application.
     */
    _initPixiJS() {
        // attach PIXI view to root HTML element
        if (this._player !== undefined) {
            this._player.root.appendChild(this._app.view as any);
        }
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
        if (this._player === undefined) {
            return;
        }

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

    tick(
        inputs: Array<MoroboxAIGameSDK.Inputs>,
        delta: number,
        render: boolean
    ) {
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
    get header(): GameHeader {
        return this.player.header as GameHeader;
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
        return this._player!;
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

/**
 * Initialize a new PixiMoroxel8AI instance.
 *
 * This function is not called by MoroboxAIPlayer and is only meant
 * for libraries embedding PixiMoroxel8AI in the browser.
 *
 * This creates and initializes a new PixiMoroxel8AI instance, without
 * loading the game yet.
 * @param {PixiMoroxel8AIOptions} options - options for PixiMoroxel8AI
 * @returns the new instance
 */
export function init(options?: PixiMoroxel8AIOptions): IPixiMoroxel8AI {
    return new PixiMoroxel8AI(options);
}

/**
 * Boot function called by MoroboxAIPlayer.
 */
export const boot: MoroboxAIGameSDK.BootFunction = (
    options: MoroboxAIGameSDK.BootOptions
): Promise<MoroboxAIGameSDK.IGame> => {
    return new Promise<MoroboxAIGameSDK.IGame>((resolve) => {
        // Create PixiMoroxel8AI
        const vm = new PixiMoroxel8AI();
        // Boot the game
        return vm.boot(options).then((game) => {
            // Return to the player
            return resolve(game);
        });
    });
};
