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

For the purpose of this tutorial, we will create a `sample` folder with the following structure:

```bash
sample/
├─ assets/
│  ├─ bunny.png
├─ game.ts
├─ header.yml
```

wip

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
