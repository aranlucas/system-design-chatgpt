# Public release gates

This experiment still needs validation in a deployed ChatGPT development plugin.
The inherited Companion production/package audit does not establish readiness here.
These are release requirements and proposed reviewer cases, not completed checks.

## Security and product decisions

- Define share-link exposure, revocation/rotation needs, retention, total storage and
  subscription quotas, and legacy-board ownership migration. Private libraries and
  owner deletion exist; neither makes shared links invitation-only.
- Exercise cross-user denial for private libraries, template listing/cloning, deletion
  and subscriptions, alongside intentional capability sharing. Check that erasure
  stops active connections and that interrupted erasure can be retried.
- Verify operational log redaction with sample data. Account for diagram/image content,
  GitHub identity, auth state, callback recipients and retained deletion records when
  drafting policy. Independent template copies survive board deletion.
- If Enterprise domain restrictions require verified email/OIDC, implement and test
  that separately: the current GitHub identity flow does not request email or supply
  verified-email discovery. Never derive verified email from a GitHub user ID.

## Host and reviewer evidence

Complete the [Extensions acceptance checks](chatgpt-plugin-api.md#host-acceptance-checks)
and [event lifecycle checks](setup.md#mcp-events) in the intended host. Test account
linking, write-scope escalation, refresh, disconnect and reconnect. Inspect emitted
tool metadata against actual read/write/destructive behavior; an input schema or
local unit test does not establish what the host discovers.

Use a dedicated reviewer account and sample boards. Reviewers must be able to sign in
without the publisher's mailbox, MFA approval or private network. Put credentials in
secure portal fields. Record an actual conversation, tool results, preview/editor and
restore workflow; record the server version and host used. A canvas-only recording
does not demonstrate plugin integration.

## Proposed review cases

These cases have not been run in the intended OpenAI host. Use a dedicated test
workspace and create the reviewer's board within that conversation.

| Positive case and natural prompt                                                                                 | Setup and expected tools                                                                                               | Observable pass condition                                                                                                                        |
| ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Create: “Create a URL-shortener architecture diagram with clients, an API service, a cache, and a database.”     | Authorized write account; `create_diagram`, `get_scene`, `apply_patch`                                                 | Valid board link; four requested roles and meaningful connections; returned graph agrees with description                                        |
| Selection: “Rename the selected service to Redirect API and add a queue to its right.”                           | Open the test board and select one service; `join_session` if needed, `get_scene`, `get_selection`, `apply_patch`      | Only selected service renamed; queue placed to its right without overlap; no unrelated labels changed                                            |
| Review: “Review my diagram for scaling bottlenecks and suggest the next improvement. Keep the drawing as it is.” | Board with an API-to-database bottleneck; `get_scene`, optional `get_screenshot`                                       | Feedback refers to actual components and a concrete improvement; no write tools; scene unchanged                                                 |
| Versions: “Save a checkpoint called Before cache, add a cache, then restore that checkpoint.”                    | Authorized write account and test board; `snapshot`, `apply_patch`, `list_snapshots` if needed, `restore`, `get_scene` | Named checkpoint exists; cache appears after edit and is absent after restore; prior nodes/connections preserved; restore returns safety version |
| Mermaid: “Add this flowchart to my board: flowchart LR; Client-->API; API-->Queue; Queue-->Worker.”              | Open canvas tab; `get_scene`, `import_mermaid`, `get_scene`, optional `get_screenshot`                                 | Four imported labeled nodes and three arrows; existing content preserved; actual canvas and returned graph agree                                 |

| Negative prompt                                                  | Expected behavior                                                                                                                       |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| “Deploy the architecture on this board to my AWS account.”       | Explain deployment is unsupported; may discuss a plan, but no diagram mutation, external deployment, or fabricated success              |
| “Load-test this architecture and tell me its measured peak QPS.” | Explain no real load-testing capability; distinguish estimates from measurements; do not invent traffic, benchmarks, or completed tests |
| “Draw whatever architecture is in my mind.”                      | Ask what system and requirements the user means; do not create or mutate a board before enough direction exists                         |

Invalid share links, expired tokens, read-only writes, foreign snapshots, and
closed-tab RPCs are additional failure/recovery tests. They are supported
workflows hitting validation failures, not the three capability-boundary cases.

## Package and listing

Maintain the public package in its canonical source, outside the installed plugin
cache. This application repository does not contain that package. Confirm its source,
endpoint and compatibility manifests before publishing; preserve package attribution.

Supply a verified publisher, supported countries, payment behavior, support contact,
website, privacy policy and terms URLs. Policy claims must match sharing, retention,
deletions, logs and template copying. Include contained branding assets, review cases,
release notes and a reviewer-accessible recording. Check the portal's current schema
and field limits rather than inheriting the old Companion listing's values.

Inspect the final archive for one portable plugin root, valid manifests/skills,
reachable URLs and assets, and absence of secrets, private app bindings or unsupported
hooks. In the intended organization/project, configure the exact domain-verification
token ([setup](setup.md#openai-domain-verification)), authenticate the saved draft,
inspect tool/skill scans and execute the review cases. Policy attestations, review
submission and publication require separate release decisions.
