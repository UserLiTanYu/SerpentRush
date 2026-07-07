// Bundler: merges ES modules into a single IIFE script for file:// compatibility.
// Run: node bundle.js
const fs = require("fs");
const path = require("path");
const dir = path.join(__dirname, "src");

const order = [
  "config.js",
  "state.js",
  "effects.js",
  "audio.js",
  "renderer.js",
  "game-logic.js",
  "achievements.js",
  "ui.js",
  "input.js",
  "main.js"
];

function strip(code, isRenderer) {
  let out = code
    .replace(/^import\s+\{[\s\S]*?\}\s+from\s+".*";\s*$/gm, "")
    .replace(/^export\s+\{[\s\S]*?\};$/gm, "")
    .replace(/^\s*\n/gm, "");
  // Remove duplicate canvas query from renderer (already in config.js)
  if (isRenderer) {
    out = out.replace(/^const canvas = document\.querySelector\("#gameCanvas"\);\s*\n/m, "");
  }
  return out.trim();
}

const modules = order.map(function (name) {
  return strip(fs.readFileSync(path.join(dir, name), "utf8"), name === "renderer.js");
});

const bundle = "(() => {\n  \"use strict\";\n\n" + modules.join("\n\n") + "\n\n})();\n";

fs.writeFileSync(path.join(__dirname, "game.js"), bundle);
console.log("game.js written (" + (bundle.length / 1024).toFixed(1) + " KB)");
