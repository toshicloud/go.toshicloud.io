# go.toshicloud.io

A dark Go package directory and vanity import host, served by a Cloudflare
Worker at [go.toshicloud.io](https://go.toshicloud.io/).

The homepage lists packages, source repositories and documentation. Requests
such as `go.toshicloud.io/cubby?go-get=1` return Go discovery metadata, including
for subpackages. Browser visits to a package path redirect to its repository.

## Packages

Edit the `packages` array in `worker.mjs` to add a package or change its links.
Each entry supplies a name, repository, documentation URL and description.
The package list and discovery responses use the same entries.

Cubby is currently pre-release. Its documentation link points to the current
README; it can switch to pkg.go.dev after a release is published and indexed.

## Develop and deploy

There are no application dependencies or build step. Check JavaScript syntax:

```sh
node --check worker.mjs
```

Preview with Wrangler:

```sh
npx wrangler@4.152.0 dev
```

Deploy with an authenticated Cloudflare account:

```sh
npx wrangler@4.152.0 deploy
```

`wrangler.toml` attaches the existing `toshicloud-goimport` Worker to the custom
domain. Its workers.dev and preview URLs are disabled.

After a deployment, check the homepage and both discovery paths:

```sh
curl --fail https://go.toshicloud.io/
curl --fail 'https://go.toshicloud.io/cubby?go-get=1'
curl --fail 'https://go.toshicloud.io/cubby/fixedscope?go-get=1'
```

## Licence

[Apache-2.0](LICENSE). See [NOTICE](NOTICE).
