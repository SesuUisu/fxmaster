import { FXMASTER } from "../module/config.js"

export class FXMasterLayer extends PlaceablesLayer {
  constructor() {
    super();
    this.effects = {};
    this.weather = null;
    this.specials = [];

    // Listen to the socket
    game.socket.on("module.fxmaster", (data) => {
      this.throwEffect(data);
    });
  }

  static get layerOptions() {
    return mergeObject(super.layerOptions, {
      objectClass: Note,
      sheetClass: NoteConfig,
      canDragCreate: false,
      zIndex: 180
    });
  }

  throwEffect(data) {
    const loader = PIXI.Loader.shared;
    const textureId = randomID()
    loader.add(textureId, data.file)

    loader.load((_, resources) => {
      const texture = PIXI.Texture.from(resources[textureId].data);
      var vidSprite = new PIXI.Sprite(texture);
      vidSprite.anchor.set(0.5, 0.5);
      vidSprite.position.set(data.position.x, data.position.y);
      vidSprite.scale.set(data.scale, data.scale);
      this.addChild(vidSprite);
      const source = getProperty(texture, "baseTexture.resource.source");
      source.onended = function () {
        vidSprite.destroy();
      }
    })
  }

  /** @override */
  _onClickLeft(event) {
    const windows = Object.values(ui.windows);
    const effectConfig = windows.find((w) => w.id == "specials-config");
    if (!effectConfig) return;
    const active = effectConfig.element.find(".active");
    if (active.length == 0) return;

    const id = active[0].dataset.effectId;
    const effectData = game.settings.get('fxmaster', 'specialEffects')[0]
    let data = mergeObject(effectData[id], {
      position: {
        x: event.data.origin.x,
        y: event.data.origin.y,
      },
    });

    event.stopPropagation();
    game.socket.emit("module.fxmaster", data);
    canvas.fxmaster.throwEffect(data);
  }

  /* -------------------------------------------- */
  /*  Methods
    /* -------------------------------------------- */

  activate() {
    // Skipping Placeable Layers activate method
    // super.activate();
    CanvasLayer.prototype.activate.apply(this)
    return this
  }

  deactivate() {
    // Skipping Placeable Layers deactivate method
    // super.deactivate();
    CanvasLayer.prototype.deactivate.apply(this)
    return this
  }

  async draw() {
    super.draw();
  }

  /* -------------------------------------------- */

  updateMask() {
    this.visible = true;
    // Setup scene mask
    if (this.mask) this.removeChild(this.mask);
    this.mask = new PIXI.Graphics();
    this.addChild(this.mask);
    const d = canvas.dimensions;
    this.mask.beginFill(0xffffff);
    if (canvas.background.img) {
      this.mask.drawRect(
        d.paddingX - d.shiftX,
        d.paddingY - d.shiftY,
        d.sceneWidth,
        d.sceneHeight
      );
    } else {
      this.mask.drawRect(0, 0, d.width, d.height);
    }
  }

  /** @override */
  tearDown() {
    this.weather = null;
    for (let i = 0; i < this.specials.length; ++i) {
      this.specials[i].stop();
    }
    const effKeys = Object.keys(this.effects);
    for (let i = 0; i < effKeys.length; ++i) {
      this.effects[effKeys[i]].fx.stop();
      delete this.effects[effKeys[i]];
    }
    this.visible = false;
    return super.tearDown();
  }

  drawWeather() {
    if (!this.weather) this.weather = this.addChild(new PIXI.Container());
    const effKeys = Object.keys(this.effects);
    for (let i = 0; i < effKeys.length; ++i) {
      this.effects[effKeys[i]].fx.stop();
      delete this.effects[effKeys[i]];
    }

    // Updating scene weather
    const flags = canvas.scene.getFlag("fxmaster", "effects");
    if (flags) {
      const keys = Object.keys(flags);
      for (let i = 0; i < keys.length; ++i) {
        // Effect already exists
        if (hasProperty(this.effects, keys[i])) {
          this.effects[keys[i]].fx.play();
          continue;
        }
        this.effects[keys[i]] = {
          type: flags[keys[i]].type,
          fx: new CONFIG.weatherEffects[flags[keys[i]].type](this.weather),
        };
        this.configureEffect(keys[i]);
        this.effects[keys[i]].fx.play();
      }
    }
  }

  configureEffect(id) {
    const flags = canvas.scene.getFlag("fxmaster", "effects");
    if (!flags || !flags[id]) return;

    // Adjust density
    if (hasProperty(flags[id], "options.density")) {
      let factor = (2 * flags[id].options.density) / 100;
      this.effects[id].fx.emitters.forEach((el) => {
        el.frequency *= factor;
        el.maxParticles *= factor;
      });
    }

    // Adjust scale
    if (hasProperty(flags[id], "options.scale")) {
      let factor = (2 * flags[id].options.scale) / 100;
      this.effects[id].fx.emitters.forEach((el) => {
        el.startScale.value *= factor;
        let node = el.startScale.next;
        while (node) {
          node.value *= factor;
          node = node.next;
        }
      });
    }

    // Adjust speed
    if (hasProperty(flags[id], "options.speed")) {
      let factor = (2 * flags[id].options.speed) / 100;
      this.effects[id].fx.emitters.forEach((el) => {
        el.startSpeed.value *= factor;
        let node = el.startSpeed.next;
        while (node) {
          node.value *= factor;
          node = node.next;
        }
      });
    }

    // Adjust tint
    if (
      hasProperty(flags[id], "options.apply_tint") &&
      flags[id].options.apply_tint == true
    ) {
      this.effects[id].fx.emitters.forEach((el) => {
        let colors = hexToRGB(colorStringToHex(flags[id].options.tint));
        el.startColor.value = {
          r: colors[0] * 255,
          g: colors[1] * 255,
          b: colors[2] * 255,
        };
        let node = el.startColor.next;
        while (node) {
          node.value = el.startColor.value;
          node = node.next;
        }
      });
    }

    // Adjust direction
    if (hasProperty(flags[id], "options.direction")) {
      let factor = (360 * (flags[id].options.direction - 50)) / 100;
      this.effects[id].fx.emitters.forEach((el) => {
        el.minStartRotation += factor;
        el.maxStartRotation += factor;
      });
    }
  }
}