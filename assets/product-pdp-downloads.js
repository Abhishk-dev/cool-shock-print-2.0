/**
 * PDP downloads: generic_file in Liquid has no byte size — fill from CDN headers.
 */
(function () {
  function formatFileSize(bytes) {
    if (bytes == null || bytes < 0 || !isFinite(bytes)) return null;
    if (bytes >= 1048576) {
      var tenths = Math.round(bytes / 104857.6);
      var whole = Math.floor(tenths / 10);
      var frac = tenths % 10;
      return whole + '.' + frac + 'mb';
    }
    if (bytes >= 1024) return Math.floor(bytes / 1024) + 'kb';
    return bytes + 'b';
  }

  function parseContentRange(header) {
    if (!header) return null;
    var m = String(header).match(/\/(\d+)\s*$/);
    return m ? parseInt(m[1], 10) : null;
  }

  function getContentLength(url) {
    return fetch(url, { method: 'HEAD', credentials: 'same-origin', cache: 'force-cache' })
      .then(function (res) {
        if (!res.ok) return null;
        var cl = res.headers.get('Content-Length');
        if (cl && /^\d+$/.test(cl)) return parseInt(cl, 10);
        return null;
      })
      .then(function (len) {
        if (len != null) return len;
        return fetch(url, {
          method: 'GET',
          credentials: 'same-origin',
          cache: 'force-cache',
          headers: { Range: 'bytes=0-0' },
        }).then(function (res) {
          if (res.status === 206) {
            var fromRange = parseContentRange(res.headers.get('Content-Range'));
            if (fromRange != null) return fromRange;
          }
          if (res.ok) {
            var cl = res.headers.get('Content-Length');
            if (cl && /^\d+$/.test(cl)) return parseInt(cl, 10);
          }
          return null;
        });
      });
  }

  function fillRow(cell) {
    var url = cell.getAttribute('data-pdp-dl-size-url');
    if (!url) return;
    getContentLength(url)
      .then(function (bytes) {
        var label = formatFileSize(bytes);
        if (label) cell.textContent = label;
      })
      .catch(function () {});
  }

  function init(root) {
    root.querySelectorAll('[data-pdp-dl-size-url]').forEach(fillRow);
  }

  function run() {
    document.querySelectorAll('.product-pdp-downloads').forEach(init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
