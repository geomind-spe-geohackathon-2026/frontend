# Handoff: app thread -> WEBSITE I (2026-11-03 01:15 +0100)

This thread takes over the geomind web app: FastAPI backend and React frontend, live at https://geomind.team.
Reply to Sahand in Persian, following the RTL rules in memory [[persian-rtl-formatting]] / [[feedback-reply-format]].

## Current state

- Status: ALL WORK PAUSED. Sahand said "wait", so start nothing until he picks a task.
- Prod (geomind.team, served from the NTNU Dell via Traefik + a Cloudflare tunnel):
  - backend 1368fe3, frontend e90a162;
  - gemini 0.5.5 installed from the release wheel (URL pin with sha256);
  - geomind 0.4.1 (c9a5c1c), still from a local editable build context;
  - agents on deepseek/deepseek-v4.1-flash-1017 with provider relace/fp4.
- Data: 4 projects on prod, owner admin@geomind.team: SPE GeoHackathon 2026, Live test b, Live test c, Live test d. The local dev DB has been deleted.
- Unknown prod user demo@geomind.team: Sahand decides whether to keep or delete it.
- Uncommitted on the Dell (backend + contracts), held because of "wait":
  - .env.example model variables (DeepSeek);
  - a test that the example env files contain only allowed models;
  - contracts.md v47, which replaces a Sonnet example.
  - Tests pass. Push only when Sahand says to continue.
- Repo clones on the Dell: /home/fatemec/geomind-spe-hackathon-2026 (backend, frontend, infrastructure, geomind, and ux/frontend for the UX thread). gemini work lives in a separate gemini-work folder that belongs to the gemini thread, so do not touch it.
- Worktree check: no extra worktrees exist, and .tmp/ is already in .gitignore in backend, frontend and ux/frontend.

## Dell RC setup

- Remote Control runs on device NTNU09811 (WSL Ubuntu) with folder /home/fatemec/geomind-spe-hackathon-2026.
- Pushes use Fatemeh's SSH key.
- Frontend commits are authored as Fatemeh Chitsaz <fatemeh.chitsaz@ntnu.no> (set in repo-local git config, in both frontend clones).
- The old RC session from the previous thread is stopped. Start a new one with start_remote_control.
- RC has no permission for prod or for irreversible deletes:
  - the Hosting thread deploys prod (option A: clean worktree under .tmp/, tag :prev, pg_dump, smoke tests without any LLM);
  - Sahand runs blocked commands himself.
- Service how-to: /mnt/project-files/notes/run-services.md
- Deploy notes: /mnt/project-files/notes/prod-deploy-2026-11-02.md, /mnt/project-files/notes/prod-deploy-gemini-0.5.5.md
- Bug and status list: /mnt/project-files/notes/app-bug-list.md
- On the Dell: backend/docs/app-build/status.md (prod pins, open items) and backend/docs/app-build/gemini-requests.md (list for Sahand).

## Rules (all in force)

- Agents: NEVER Sonnet or any Anthropic model; DeepSeek everywhere. The backend guard ASSISTANT_MODEL_PREFIX=deepseek/ enforces this. Verify model ids in run logs.
- No live LLM runs and no token use. One exception is approved: ONE full live DeepSeek test after geomind 0.4.2 is final and wired in, capped at 1 USD total, on dev with a copy of the competition project (not prod).
- Work on production (geomind.team). Only the Hosting thread deploys.
- No -e installs anywhere; consumers pin released versions. gemini releases come from its dev branch, geomind releases from its main branch.
- NEW: nobody asks gemini for anything without Sahand's permission, and gemini is the source of truth. App needs go only into gemini-requests.md for Sahand to review. Never send them to the gemini thread.
- NEW: git worktrees go only under the repo's own .tmp/, and .tmp/ stays git-ignored.
- Backend/frontend: push to main. UX agent-first work stays on branch ux-agent-first (the UX thread owns it).
- Keep everything general, with no hackathon defaults. gemini stays backward compatible with 0.5.0. Frontend UI needs are top priority.
- Never print or commit secrets or .env files. Never run `down -v` on prod volumes. Do not change infrastructure .env files or ports.
- geomind main history is being rewritten after b2cbdf6 (to remove .tmp/live). c9a5c1c is unaffected. When GEOMIND 1 sends the new hashes, check the Dell geomind clone for local work, then fetch and reset to origin/main.

## Remaining work

Ready now, waiting for Sahand's "continue":

1. Commit and push the held DeepSeek doc/test change.
2. Tidy the report flowsheet lines that overlap between Treatment and Heating.

Waiting on geomind 0.4.2 (home thread "GEOMIND 1"): 3. Wire 0.4.2 into the app:

- install a pinned release;
- add a startup model check with a clear error;
- set GEOMIND_CONTEXT_WINDOW=128000 on dev, and give Hosting the variable names for prod.

4. Remove `-e ../geomind` once a release exists (the geomind 0.4.3 migration).
5. Run the ONE live test, capped at 1 USD, on dev:
   - size chat, LCTS optimisation and explanation;
   - one budget-stop test;
   - check that every step ran on DeepSeek.
6. Verify the design.py:293 crash fix and the tool-output size limits. The design-chat crash can still happen on prod until 0.4.2 is deployed.
7. Add a no_case error code. Today every chat error reads "internal error in geomind".

Waiting on Sahand: 8. Card cmsg_016VUmQoW7nUde2xdqUWA2PoVzdMVVtN93nMu9sprhHXpT: use HeatingCoolingPlant (LCTS 42.54, CO2 10.34, with the pump limit) and more uncertainty samples. 9. Old profile -> Case card. 10. Keep or delete demo@geomind.team. 11. Rewrite the ~98 old frontend commits under Fatemeh's name? Recommendation: no, because it needs a force-push to main. 12. Fatemeh adds fatemeh.chitsaz@ntnu.no in GitHub Settings > Emails.

Small app items: 13. Visual checks on prod (best done by Sahand in a browser): - the new report flowsheet; - Plant zoom in the competition project; - wide report tables on mobile; - Compare labels with several designs; - Days covered in dark theme; - Plant section unit conversion. 14. Plant-level rows have no unit dropdown. 15. A new doublet does not copy values. 16. Some runs show `done` even though their last tool failed. 17. Hosting to confirm that ASSISTANT_MODEL_PREFIX is unchanged on prod.

Lists for Sahand only (do NOT send to gemini):

- capabilities ranges per instance/size;
- a W/K (kW/K, MW/K) display unit;
- "format": "date" on case time.start and time.end.

After the hackathon: Operation pages; rotate the Cloudflare tokens and the admin password.

Other threads:

- Hosting cmsg_016VUmQoW7nUde2xdqUWA2Po11T5FvNh8vn1p5v4uLypFB
- GEOMIND 1 cmsg_016VUmQoW7nUde2xdqUWA2Po95xGxRTiZ2eX11DUwdU9Ba
- UX cmsg_016VUmQoW7nUde2xdqUWA2Po7W8VPbTj25a2atxjeoor6A
- gemini cmsg_016VUmQoW7nUde2xdqUWA2PoTxFGe8xk7M6PtK3f7gV8hj

## Extra details from the Dell session

- A full copy with commands is on the Dell at ~/geomind-spe-hackathon-2026/WEBSITE-I-handover.md. It is outside the repos and not pushed.
- Read first: backend/docs/app-build/status.md, handover.md, contracts.md, requests.md (geomind asks), gemini-requests.md, frontend/AGENTS.md.
- Held change: backend .env.example (3 GEOMIND model lines), tests/api/v1/assistant/runs/test_adapters.py, contracts.md v47, the status.md contract line. 568 tests and lint passed.
- Flowsheet tidy files: frontend/src/shared/plant/flowsheet-layout.ts, flowsheet-sheet.ts.
- No comments in code. Do not offer to limit the template list. Never pick Sonnet for helper subagents either.
- gemini and geomind repos are read-only from this thread. Do not work around geomind problems in the app.
- Git flow:
  - stage files by explicit path;
  - run backend tests, and frontend lint, typecheck and targeted tests;
  - read the results;
  - then `git pull --rebase` and push as a separate step. Other sessions edit these clones.
- Backend commits stay under Sahand's name. No model identifiers in commits.
- Sahand's messages can arrive late, and his screenshots may show old builds. Compare timestamps against the current code.
