// A local static server that resolves URLs the way Cloudflare Pages does, so
// verify-live.js can rehearse against _site/ in a dry run:
//   /x/index.html → 308 /x/      /x.html → 308 /x      /x/ → x/index.html
//   /x → x.html if it exists, else 308 /x/ if x/index.html exists
//   anything else → 404.html with status 404
import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".xml": "application/xml; charset=utf-8", ".txt": "text/plain; charset=utf-8",
  ".sig": "text/plain; charset=utf-8", ".woff2": "font/woff2", ".pdf": "application/pdf",
};

export function startPagesServer(dir) {
  const isFile = (rel) => {
    const p = join(dir, rel);
    return existsSync(p) && statSync(p).isFile();
  };
  const server = createServer((req, res) => {
    const raw = decodeURIComponent(new URL(req.url, "http://x").pathname);
    const path = normalize(raw);
    const send = (rel, status = 200) => {
      res.writeHead(status, { "content-type": TYPES[extname(rel)] ?? "application/octet-stream" });
      res.end(readFileSync(join(dir, rel)));
    };
    const redirect = (to) => { res.writeHead(308, { location: to }); res.end(); };

    if (raw.includes("..")) return send("404.html", 404);
    if (path.endsWith("/index.html")) return redirect(path.slice(0, -"index.html".length));
    if (path.endsWith(".html")) return redirect(path.slice(0, -".html".length));
    if (path.endsWith("/")) return isFile(`${path}index.html`) ? send(`${path}index.html`) : send("404.html", 404);
    if (isFile(path)) return send(path);
    if (isFile(`${path}.html`)) return send(`${path}.html`);
    if (isFile(`${path}/index.html`)) return redirect(`${path}/`);
    return send("404.html", 404);
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve({
      url: `http://127.0.0.1:${server.address().port}`,
      close: () => new Promise((done) => server.close(done)),
    }));
  });
}
