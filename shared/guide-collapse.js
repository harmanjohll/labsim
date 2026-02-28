/* ============================================================
   LabSim — Guide Panel Collapse
   Automatically adjusts grid layout when the guide panel is
   hidden so the workbench expands to fill available space.
   Also triggers a window resize event so canvas elements
   can recalculate their dimensions.
   ============================================================ */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var panel = document.getElementById('guide-panel');
    if (!panel) return;

    var layout = panel.parentElement;
    if (!layout) return;

    /* Capture the data-panel column width from the original grid definition.
       getComputedStyle resolves track sizes to pixels, e.g. "260px 823px 300px".
       We keep the last track (data panel) and middle tracks as-is. */
    var origCols = getComputedStyle(layout).gridTemplateColumns;
    var tracks = origCols.split(/\s+/);
    if (tracks.length < 2) return; // not a grid layout we can handle

    /* Build the collapsed column definition:
       first track → 0px, middle → 1fr, keep remaining tracks intact */
    var dataTracks = tracks.slice(2).join(' '); // e.g. "300px"
    var collapsedCols = dataTracks
      ? '0px 1fr ' + dataTracks
      : '0px 1fr';

    /* Find the toggle button (two naming conventions exist) */
    var btn = document.getElementById('btn-toggle-guide')
           || document.getElementById('btn-guide');

    /* Apply or remove the collapsed grid when the guide panel is toggled.
       Uses a MutationObserver so it works regardless of which JS
       code actually hides the panel (existing per-practical handlers). */
    function applyCollapse() {
      var hidden = panel.style.display === 'none';
      if (hidden) {
        layout.style.gridTemplateColumns = collapsedCols;
        layout.classList.add('guide-collapsed');
      } else {
        layout.style.gridTemplateColumns = '';
        layout.classList.remove('guide-collapsed');
      }
      /* Give the browser a frame to reflow, then notify canvases */
      setTimeout(function () {
        window.dispatchEvent(new Event('resize'));
      }, 60);
    }

    /* Observe style-attribute changes on the guide panel */
    var observer = new MutationObserver(applyCollapse);
    observer.observe(panel, { attributes: true, attributeFilter: ['style'] });

    /* Also update the Guide button text to reflect state */
    if (btn) {
      btn.addEventListener('click', function () {
        /* Delay slightly so the existing handler sets display first */
        setTimeout(function () {
          var hidden = panel.style.display === 'none';
          /* Update aria if present */
          if (btn.getAttribute('aria-expanded') !== null) {
            btn.setAttribute('aria-expanded', !hidden);
          }
        }, 20);
      });
    }
  });
})();
