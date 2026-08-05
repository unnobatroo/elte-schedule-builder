# Releases and deployment

Production releases are built from version tags. A tag such as `v0.1.0` must
match the version in `package.json`. The release workflow runs the complete test
suite, publishes a multi-platform container to GitHub Container Registry
(GHCR), and creates a GitHub release.

Each release publishes two image tags:

- `ghcr.io/w04m1/elte-schedule-builder:0.1.0` for the release version.
- `ghcr.io/w04m1/elte-schedule-builder:sha-<full-commit-sha>` for the exact
  source commit.

The GitHub release also records the image digest. Use the digest reference for
strictly immutable deployments:

```text
ghcr.io/w04m1/elte-schedule-builder@sha256:<image-digest>
```

## Create a release

After the version and changelog changes have passed CI on `main`, create and
push the matching tag:

```bash
git tag v0.1.0
git push origin v0.1.0
```

Do not move or reuse an existing release tag. Prepare a new semantic version
instead.

## Configure Dokploy

Configure the application as an image-based deployment with these values:

- Image: the digest reference from the GitHub release. The full commit-SHA tag
  is a practical fallback if Dokploy requires a tag.
- Container port: `3000`.
- Persistent volume: mount persistent storage at `/app/data`.
- Cache database: leave `CACHE_DB_PATH` unset to use `/app/data/cache.db`, or
  set it explicitly to that path.
- Environment: copy only the production values needed from `.env.example`.
  Set `TRUST_PROXY_HOPS=1` only when exactly one trusted reverse proxy sits in
  front of the application.

Public GHCR packages need no registry credentials. For a private package,
configure Dokploy with a GitHub token that has `read:packages` permission.

After deployment, request `/api/subject/DEMO-1` and confirm that the response
contains `Introduction to Web Development`. This checks the server, database,
and bundled demo data without relying on Tanrend.

## Roll back

Select the digest (or full commit-SHA tag) from the previous successful GitHub
release and redeploy it in Dokploy. The SQLite cache volume is compatible across
these releases and should remain mounted during the rollback.
