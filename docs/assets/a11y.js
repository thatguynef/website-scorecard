/* Material's search overlay is role="dialog" without an accessible name. */
(function () {
  function labelSearch() {
    document.querySelectorAll('.md-search[role="dialog"]').forEach(function (node) {
      if (!node.getAttribute("aria-label") && !node.getAttribute("aria-labelledby")) {
        node.setAttribute("aria-label", "Search the documentation");
      }
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", labelSearch);
  } else {
    labelSearch();
  }
})();
