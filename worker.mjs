// Copyright 2026 The cubby contributors
// SPDX-License-Identifier: Apache-2.0

// Serve the dark Go package directory and Go import discovery on go.toshicloud.io.
const hostname = "go.toshicloud.io";
const packages = [
  {
    name: "cubby",
    repository: "https://github.com/toshicloud/cubby",
    documentation: "https://github.com/toshicloud/cubby/blob/feat/cache-server/README.md",
    description: "A local cache for GitHub Actions, available as a Go library and server.",
    prerelease: true,
  },
];

function escapeHTML(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function packageRows(pkg) {
  return `<tbody>
    <tr class="package">
      <td data-label="Package"><a class="import-path" href="/${escapeHTML(pkg.name)}">${hostname}/${escapeHTML(pkg.name)}</a>${pkg.prerelease ? '<span class="status">pre-release</span>' : ""}</td>
      <td data-label="Source"><a href="${escapeHTML(pkg.repository)}">${escapeHTML(pkg.repository.replace("https://", ""))}</a></td>
      <td data-label="Documentation"><a class="docs" href="${escapeHTML(pkg.documentation)}"><span class="docs-type">Go</span><span class="docs-label">README</span></a></td>
    </tr>
    <tr class="description"><td colspan="3">${escapeHTML(pkg.description)}</td></tr>
  </tbody>`;
}

const index = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="description" content="Go packages from Toshi, with source code and documentation.">
  <title>go.toshicloud.io</title>
  <style>
    :root {
      color-scheme: dark;
      --background: #0d1117;
      --text: #e6edf3;
      --muted: #9da7b3;
      --line: #2b333d;
      --link: #74c7e8;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--background);
      color: var(--text);
      font: 15px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    main { max-width: 1008px; margin: 0 auto; padding: 16px 24px 32px; }
    .sr-only {
      position: absolute; width: 1px; height: 1px; padding: 0;
      overflow: hidden; clip-path: inset(50%); white-space: nowrap;
    }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; text-align: left; }
    th { padding: 0 12px 6px 0; font-weight: 600; border-bottom: 1px solid var(--line); }
    th:nth-child(1) { width: 43%; }
    th:nth-child(2) { width: 41%; }
    th:nth-child(3) { width: 16%; }
    td { padding: 7px 12px 0 0; vertical-align: top; overflow-wrap: anywhere; }
    tbody { border-bottom: 1px solid var(--line); }
    .description td { padding: 4px 0 9px 36px; color: var(--muted); }
    a { color: var(--link); text-decoration: underline; text-underline-offset: 3px; }
    a:hover { color: #b7e8fa; }
    a:focus-visible { outline: 2px solid var(--link); outline-offset: 4px; border-radius: 2px; }
    .import-path { color: var(--text); text-decoration: none; }
    .import-path:hover { text-decoration: underline; }
    .status {
      display: inline-block; margin-left: 9px; padding: 0 5px;
      color: var(--muted); border: 1px solid var(--line); border-radius: 3px;
      font-size: 10px; line-height: 17px; vertical-align: 1px; white-space: nowrap;
    }
    .docs {
      display: inline-flex; overflow: hidden; border-radius: 3px;
      color: #f0f6fc; font-size: 11px; font-weight: 600; line-height: 21px;
      text-decoration: none; white-space: nowrap; vertical-align: middle;
    }
    .docs-type { padding: 0 6px; background: #384451; }
    .docs-label { padding: 0 7px; background: #0d617d; }
    .docs:hover .docs-label { background: #117b9d; }
    footer {
      display: flex; justify-content: space-between; gap: 16px;
      margin-top: 22px; color: var(--muted); font-size: 12px;
    }
    footer a { color: var(--muted); }
    @media (max-width: 640px) {
      main { padding: 18px 20px 28px; }
      table, tbody, tr, td { display: block; width: 100%; }
      thead { display: none; }
      td { padding: 0 0 16px; }
      .package td::before {
        content: attr(data-label); display: block; margin-bottom: 3px;
        color: var(--muted); font-size: 12px; font-weight: 600;
      }
      .description td { padding: 0 0 18px; }
      tbody + tbody { padding-top: 18px; }
    }
  </style>
</head>
<body>
  <main>
    <h1 class="sr-only">Toshi Go packages</h1>
    <table aria-label="Go packages from Toshi">
      <thead><tr><th scope="col">Package</th><th scope="col">Source</th><th scope="col">Documentation</th></tr></thead>
      ${packages.map(packageRows).join("\n")}
    </table>
    <footer><span>go.toshicloud.io</span><a href="https://github.com/toshicloud/go.toshicloud.io">Source for this site</a></footer>
  </main>
</body>
</html>`;

function html(body, method) {
  return new Response(method === "HEAD" ? null : body, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}

export default {
  fetch(request) {
    const url = new URL(request.url);
    const pkg = packages.find(({ name }) =>
      url.pathname === "/" + name || url.pathname.startsWith("/" + name + "/"));
    if (url.pathname !== "/" && !pkg) {
      return new Response("not found\n", { status: 404 });
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response(null, { status: 405, headers: { allow: "GET, HEAD" } });
    }
    if (url.pathname === "/") return html(index, request.method);
    if (url.searchParams.get("go-get") !== "1") {
      return Response.redirect(pkg.repository, 302);
    }
    return html(`<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="go-import" content="${hostname}/${escapeHTML(pkg.name)} git ${escapeHTML(pkg.repository)}">
<title>${escapeHTML(pkg.name)}</title></head>
<body><a href="${escapeHTML(pkg.repository)}">${escapeHTML(pkg.name)} source repository</a></body></html>
`, request.method);
  },
};
