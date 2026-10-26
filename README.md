# go.toshicloud.io

[Go packages and custom import paths](https://go.toshicloud.io/), served by a
Cloudflare Worker.

Edit [packages.yaml](packages.yaml) to add or update packages. The build uses
it for the directory and Go import metadata. Documentation links default to
pkg.go.dev and can be overridden in the catalogue.

With Node.js 22 or newer, install dependencies and preview locally:

```sh
npm ci
npm run dev
```

Deploy with your Cloudflare account:

```sh
npm run deploy
```

Both commands build the catalogue automatically.

[Apache-2.0](LICENSE) · [NOTICE](NOTICE)
