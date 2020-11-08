import { registerSettings } from "./settings.js";
import { registerHooks } from "./hooks.js";
import { FXMASTER } from "./config.js"
import { FXMasterLayer } from "../effects/FXMasterLayer.js";
import { filterManager } from "../filters/FilterManager.js";

function registerLayer() {
  const layers = mergeObject(Canvas.layers, {
    fxmaster: FXMasterLayer
  });
  Object.defineProperty(Canvas, 'layers', {
    get: function () {
      return layers
    }
  });
}

Hooks.once("init", function () {
  // Register custom system settings
  registerSettings();
  registerHooks();
  registerLayer();
  // game.settings.set('fxmaster', 'specialEffects', []);

  // Adding custom weather effects
  mergeObject(CONFIG.weatherEffects, FXMASTER.weatherEffects);

  // Adding filters and effects
  if (!CONFIG.fxmaster) CONFIG.fxmaster = {};
  mergeObject(CONFIG.fxmaster, { filters: FXMASTER.filters });
});

Hooks.once("canvasInit", (canvas) => {
  // canvas.fxmaster = canvas.stage.addChildAt(new FXMasterLayer(canvas), 8);
});

Hooks.on("canvasInit", (canvas) => {
  if (!game.settings.get("fxmaster", "enable")) {
    return
  }
  filterManager.clear();
});

Hooks.on("canvasReady", (_) => {
  if (!game.settings.get("fxmaster", "enable")) {
    return
  }
  filterManager.activate();
  canvas.fxmaster.updateMask();
  canvas.fxmaster.drawWeather();
});

Hooks.on("updateScene", (scene, data, options) => {
  if (!game.settings.get("fxmaster", "enable")) {
    return
  }
  if (!hasProperty(data, "flags.fxmaster.filters")) {
    canvas.fxmaster.updateMask();
    canvas.fxmaster.drawWeather();
  }
  filterManager.update();
});