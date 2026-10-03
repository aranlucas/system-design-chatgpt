# Upstream provenance

Source: https://github.com/dmmulroy/anti-slop

Revision: c44ef22ca116d0ba62a3ff663a0bd13a3f3fa40b

Canonical `src/` is vendored in `tools/oxlint/anti-slop/`, with the upstream MIT license and nested ESLint Stylistic license/provenance preserved. No intentional source deviations.

The entire upstream source tree is copied, including rule test fixtures and CLI
integration-test source. Application Vitest discovery is restricted to `tests/`.
Standalone rule tests are retained for update verification. Effect source is
present for provenance but Effect-specific rules are not enabled without a direct
application dependency.
