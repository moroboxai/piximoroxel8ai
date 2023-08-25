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
  * Takes care of loading all your assets
  * Provides a simple interface for controlling the graphics, audio, and inputs

To sum up, PixiMoroxel8AI takes care of all the boilerplate required for initializing and running your game in MoroboxAI, and lets you focus on coding the game logic in Lua.

## Minimal game

For the purpose of this tutorial, we will create a `sample` folder with the following structure:

```bash
sample/
├─ assets/
│  ├─ tilemap.png
├─ game.js
├─ header.yml
```

The `assets` directory is where PixiMoroxel8AI will load assets from. Here is `tilemap.png`, this is a 16x16 pixels tilemap taken from Mario on NES:

![Preview](https://github.com/moroboxai/piximoroxel8ai/raw/media/tilemap.png)

The `header.json` contains some metadata about assets and how to run the game:

```yml
assets:
    - name: tilemap
      path: tilemap.png
boot: PixiMoroxel8AI
main: game.lua
```

All the game logic is written in `game.js`:

```js
-- select tilemap.png as the tilemap
local tilemap = tmap('tilemap')
-- set the size of one tile to 16x16 pixels
tmode(16)
-- assign the tile (0, 3) to sprite
stile(tilemap, 0, 3, 1, 1)
-- set the origin to center
sorigin(8, 8)

local angle = 0

function tick(deltaTime)
    -- clear screen
    clear()
    -- rotate sprite
    angle = angle + deltaTime
    srot(angle)
    -- draw sprite on screen
    sdraw(SWIDTH / 2, SHEIGHT / 2)
end
```

Now, all remain is `index.html` which is simply loading MoroboxAI + PixiMoroxel8AI and initializing the game:

```html
<html>
    <head>
        <title>PixiMoroxel8AI Sample</title>
        <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/moroboxai-player-web@latest/lib/umd/moroboxai-player-web.min.js"></script>
        <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/piximoroxel8ai@latest/lib/umd/piximoroxel8ai.min.js"></script>
    </head>
    <body>
        <div id="player"></div>
    </body>
    <script type="text/javascript">
        (function() {
            console.log(`moroboxai-player-web v${MoroboxAIPlayer.VERSION}`);
            
            player = MoroboxAIPlayer.init(document.getElementById("player"), {
                url: `./`,
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
            width: 256px;
            height: 256px;
        }
    </style>
</html>
```

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
