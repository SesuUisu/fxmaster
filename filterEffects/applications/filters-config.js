import { filterManager } from "../FilterManager.js";
import { resetFlags } from "../../module/utils.js";

export class FiltersConfig extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["form", "fxmaster", "sidebar-popout"],
      closeOnSubmit: true,
      submitOnChange: false,
      submitOnClose: false,
      popOut: true,
      editable: game.user.isGM,
      width: 300,
      height: 450,
      template: "modules/fxmaster/filterEffects/templates/filters-config.html",
      id: "filters-config",
      title: game.i18n.localize("FILTERMANAGE.Title")
    });
  }

  /* -------------------------------------------- */

  /**
   * Obtain module metadata and merge it with game settings which track current module visibility
   * @return {Object}   The data provided to the template when rendering the form
   */
  getData() {
    const currentFilters = canvas.scene.getFlag("fxmaster", "filters") || {};
    const activeFilters = Object.values(currentFilters).reduce((obj, f) => {
      obj[f.type] = f.options;
      return obj;
    }, {});
    // Return data to the template
    return {
      filters: CONFIG.fxmaster.filters,
      activeFilters: activeFilters
    };
  }

  /* -------------------------------------------- */
  /*  Event Listeners and Handlers                */
  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html
      .find(".config.weather .weather-collapse")
      .click(event => this._onWeatherCollapse(event));
  }

  /**
   * Handle Weather collapse toggle
   * @private
   */
  _onWeatherCollapse(event) {
    let li = $(event.currentTarget).parents(".config.weather"),
      expanded = !li.children(".config.collapsible").hasClass("collapsed");
    this._collapse(li, expanded);
  }

  /* -------------------------------------------- */

  /**
   * Helper method to render the expansion or collapse of playlists
   * @param {HTMLElement} li
   * @param {boolean} collapse
   * @param {number} speed
   * @private
   */
  _collapse(li, collapse, speed = 250) {
    li = $(li);
    let ol = li.children(".config.collapsible"),
      icon = li.find("header i.fa");
    // Collapse the Playlist
    if (collapse) {
      ol.slideUp(speed, () => {
        ol.addClass("collapsed");
        icon.removeClass("fa-angle-up").addClass("fa-angle-down");
      });
    }

    // Expand the Playlist
    else {
      ol.slideDown(speed, () => {
        ol.removeClass("collapsed");
        icon.removeClass("fa-angle-down").addClass("fa-angle-up");
      });
    }
  }

  /**
   * This method is called upon form submission after form data is validated
   * @param event {Event}       The initial triggering submission event
   * @param formData {Object}   The object of validated form data with which to update the object
   * @private
   */
  async _updateObject(_, formData) {
    const filtersDB = CONFIG.fxmaster.filters;
    const filters = {};
    Object.keys(filtersDB).forEach(key => {
      const label = filtersDB[key].label;
      if (formData[label]) {
        const filter = {
          type: key,
          options: {}
        };
        Object.keys(filtersDB[key].parameters).forEach((key) => {
          filter.options[key] = formData[`${label}_${key}`];
        })
        filters[`core_${key}`] = filter;
      }
    });
    resetFlags(canvas.scene, "filters", filters);
  }
}

FiltersConfig.CONFIG_SETTING = "filtersConfiguration";
