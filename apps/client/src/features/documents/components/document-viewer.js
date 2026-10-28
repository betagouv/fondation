function reportHeight() {
  parent.postMessage({ type: 'CONTENT_HEIGHT', height: document.documentElement.scrollHeight }, '*');
}

function observeHeight() {
  new ResizeObserver(reportHeight).observe(document.documentElement);
  reportHeight();
}

// reporting before paged.js paginates would size the frame on the unpaginated column, then shrink it
if (document.querySelector('script[src*="paged"]')) {
  setTimeout(function () {
    if (!document.querySelector('.pagedjs_pages')) observeHeight();
  }, 3000);
} else {
  addEventListener('load', observeHeight);
}

function after() {
  var pages = document.querySelector('.pagedjs_pages');
  var firstSheet = document.querySelector('.pagedjs_sheet');
  if (!pages || !firstSheet) return;

  // zoom takes part in layout, where a scale transform stays invisible to the flow
  function resize() {
    pages.style.zoom = '';
    var sheetWidth = firstSheet.offsetWidth;
    if (!sheetWidth) return;
    pages.style.zoom = (document.documentElement.clientWidth * 0.9) / sheetWidth;
    reportHeight();
  }

  resize();
  new ResizeObserver(resize).observe(document.documentElement);
  if (document.fonts) document.fonts.ready.then(resize);
}

// only the window that embedded us may rewrite the document, never a page embedding the app
addEventListener('message', function (event) {
  if (event.source !== parent) return;
  if (event.data && event.data.type === 'UPDATE_CONTENT') {
    var node = document.querySelector('[data-editable-content]');
    if (node) node.innerHTML = event.data.html;
  }
});

window.PagedConfig = { after };
