/*
 * UI manipulation for WPDTRT parent theme
 */

/* eslint-env browser */
/* globals jQuery */

/**
 * @namespace wpdtrt_ui
 */

const wpdtrt_ui = {

  /**
   * Make :focus state render on touch
   *
   * @see http://stackoverflow.com/a/28771425
   */
  touch_focus: () => {
    "use strict";

    document.addEventListener("touchstart", () => {}, false);
  }
};

jQuery(document).ready( () => {
  "use strict";

  wpdtrt_ui.touch_focus();
});