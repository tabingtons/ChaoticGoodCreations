(function () {
  "use strict";

  const redirects = {
    "/keepsake/index": "/keepsake/",
    "/keepsake/index.html": "/keepsake/",
    "/keepsake/journal/index": "/keepsake/journal/",
    "/keepsake/journal/index.html": "/keepsake/journal/",
    "/keepsake/presskit.html": "/keepsake/presskit/",
    "/keepsake/presskit/index": "/keepsake/presskit/",
    "/keepsake/presskit/index.html": "/keepsake/presskit/",
    "/keepsake/journal/articles/family-memories-privacy.html": "/keepsake/journal/articles/family-memories-privacy/",
    "/keepsake/journal/articles/family-memories-privacy/index": "/keepsake/journal/articles/family-memories-privacy/",
    "/keepsake/journal/articles/family-memories-privacy/index.html": "/keepsake/journal/articles/family-memories-privacy/",
    "/keepsake/journal/articles/what-to-do-with-childrens-artwork.html": "/keepsake/journal/articles/what-to-do-with-childrens-artwork/",
    "/keepsake/journal/articles/what-to-do-with-childrens-artwork/index": "/keepsake/journal/articles/what-to-do-with-childrens-artwork/",
    "/keepsake/journal/articles/what-to-do-with-childrens-artwork/index.html": "/keepsake/journal/articles/what-to-do-with-childrens-artwork/",
    "/keepsake/journal/articles/why-childrens-artwork-matters.html": "/keepsake/journal/articles/why-childrens-artwork-matters/",
    "/keepsake/journal/articles/why-childrens-artwork-matters/index": "/keepsake/journal/articles/why-childrens-artwork-matters/",
    "/keepsake/journal/articles/why-childrens-artwork-matters/index.html": "/keepsake/journal/articles/why-childrens-artwork-matters/",
    "/keepsake/journal/articles/why-revisiting-memories-matters.html": "/keepsake/journal/articles/why-revisiting-memories-matters/",
    "/keepsake/journal/articles/why-revisiting-memories-matters/index": "/keepsake/journal/articles/why-revisiting-memories-matters/",
    "/keepsake/journal/articles/why-revisiting-memories-matters/index.html": "/keepsake/journal/articles/why-revisiting-memories-matters/"
  };

  const canonicalPath = redirects[window.location.pathname];

  if (canonicalPath) {
    window.location.replace(
      canonicalPath + window.location.search + window.location.hash
    );
  }
})();
