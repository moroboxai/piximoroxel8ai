# piximoroxel8ai

[![NPM version](https://img.shields.io/npm/v/piximoroxel8ai.svg)](https://www.npmjs.com/package/piximoroxel8ai)
![Node.js CI](https://github.com/moroboxai/piximoroxel8ai/workflows/Node.js%20CI/badge.svg)
[![gitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/moroboxai/piximoroxel8ai/blob/master/LICENSE)
[![Code Quality: Javascript](https://img.shields.io/lgtm/grade/javascript/g/moroboxai/piximoroxel8ai.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/moroboxai/piximoroxel8ai/context:javascript)
[![Total Alerts](https://img.shields.io/lgtm/alerts/g/moroboxai/piximoroxel8ai.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/moroboxai/piximoroxel8ai/alerts)

Run PixiJS games written for [MoroboxAI](https://github.com/moroboxai).

## Why

MoroboxAI by itself is a generic framework that can run any JavaScript code that exports a **boot** function.

PixiMoroxel8AI is a layer of abstraction on top of that and:
  * Uses [PixiJS](https://pixijs.com/) as a renderer
  * Loads and runs your game written in JavaScript
  * Implements all the boilerplate for being compatible with MoroboxAI
  * Provides a simple interface for controlling the graphics, audio, and inputs

To sum up, PixiMoroxel8AI takes care of all the boilerplate required for initializing and running your game in MoroboxAI, and lets you focus on coding the game logic in JavaScript.

## Minimal game

The `sample` folder contains a sample of a minimal game for PixiMoroxel8AI:

```bash
sample/
├─ assets/
│  ├─ bunny.png
├─ game.js
├─ game.ts
├─ header.yml
```

As you can see, the folder contains both `game.ts`, and `game.js`.

Your game can be written with TypeScript for a more type safe coding, but it must be converted to plain JavaScript for being loadable by PixiMoroxel8AI.

The `header.yml` defines how the game is loaded:
  * `boot` must be the name of a JS module loaded in the page, that exports a boot function compatible with MoroboxAI, here PixiMoroxel8AI.
  * `main` is simply the relative path to your game script.

```yml
# Defines the JS module used to boot the game
boot: PixiMoroxel8AI
# Defines the main script of the game
main: game.js
```

Now, all that remains is `index.html` which is a minimalist page loading MoroboxAI + PixiMoroxel8AI and initializing the game:

```html
<head>
    <title>PixiMoroxel8AI Sample</title>
    <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/moroboxai-player-web@latest/lib/umd/moroboxai-player-web.min.js"></script>
    <!-- Use https://cdn.jsdelivr.net/npm/piximoroxel8ai@latest/lib/umd/piximoroxel8ai.min.js in production -->
    <script type="text/javascript" src="./lib/umd/piximoroxel8ai.js"></script>
</head>

<body>
    <div id="player"></div>
</body>
<script type="text/javascript">
    (function () {
        console.log(`moroboxai-player-web v${MoroboxAIPlayer.VERSION}`);

        player = MoroboxAIPlayer.init(document.getElementById("player"), {
            // Replace with URL to your header.yml
            url: `./sample`,
            resizable: false,
            autoPlay: true,
            onReady: () => console.log("ready")
        });
    })();
</script>

<style type="text/css">
    body {
        height: 100%;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }

    #player {
        background-color: black;
        background-size: cover;
        width: 512px;
        height: 512px;
    }
</style>

</html>
```

This is all that is required for embedding and running your game in a webpage.

## Run on the web

Testing on the web requires you to run a local HTTP server to avoid CORS errors when loading local files.

For that you can install **http-server**:

```bash
npm install http-server -g
```

Open a command prompt in the `piximoroxel8ai` folder and run:

```bash
http-server
```

Now you can access the page on **localhost** and the port opened by **http-server**.

## License

This content is released under the [MIT](http://opensource.org/licenses/MIT) License.
