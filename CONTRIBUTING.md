# Working together on Scopewise

Three of us work on this repo at the same time. These rules keep us from
overwriting each other's work. Read this once completely, then use the
cheat sheet at the bottom.

## The golden rules

1. **Never commit directly to `main`.** `main` is protected: it only changes
   through Pull Requests (PRs). It must always build and run.
2. **One task = one issue = one branch = one PR.**
3. **Pull often, push often.** Small PRs (a few hundred lines at most) get
   reviewed fast and rarely conflict.
4. **Every PR needs one approval** from one of the other two before merging.
5. **Never commit secrets** (API keys, passwords). See [Secrets](#secrets).
6. **Frontend and backend only talk through the API contract** in
   [`docs/API.md`](docs/API.md). If you change an endpoint, update that file
   in the same PR.

## Who works where

The repo is split so we can work in parallel without touching the same files:

| Folder                         | What lives there                        |
| ------------------------------ | --------------------------------------- |
| `backend/`                     | ASP.NET Core API (C#)                   |
| `frontend/apps/dashboard/`     | Agency dashboard (React + TS)           |
| `frontend/apps/survey/`        | Client survey page (React + TS)         |
| `frontend/packages/shared/`    | Shared types + API client for both apps |
| `docs/`                        | Plan, API contract, architecture        |

Before you start a task, assign yourself the issue on GitHub so the others
know you are on it.

## Step by step: doing a task

### 1. Pick an issue

On GitHub: **Issues** → open one → **Assignees** → assign yourself.
Remember its number, e.g. `#7`.

### 2. Get the latest `main` and create your branch

```bash
git checkout main
git pull
git checkout -b feature/7-survey-question-page
```

Branch names: `feature/<issue>-<short-name>`, `fix/<issue>-<short-name>` or
`docs/<short-name>`.

### 3. Work and commit in small steps

```bash
git status                 # what did I change?
git add <files>            # or: git add .
git commit -m "Add question page layout"
```

Commit messages: short, present tense, say *what* changed
("Add login form", "Fix progress bar overflow").

### 4. Push your branch

```bash
git push -u origin feature/7-survey-question-page   # first time
git push                                            # after that
```

### 5. Open a Pull Request

GitHub shows a yellow **Compare & pull request** button after you push.
Fill in the template and write `Closes #7` so the issue closes on merge.
Request a review from one of the other two.

You can also do it from the terminal: `gh pr create --fill`.

### 6. Review and merge

- The reviewer reads the code, tries it locally if needed, and either
  **Approves** or leaves comments.
- Fix comments by committing to the same branch and pushing again; the PR
  updates automatically.
- Once approved and CI is green: **Squash and merge**. The branch is deleted
  automatically.

### 7. Back to start

```bash
git checkout main
git pull
```

## Keeping your branch up to date

If `main` changed while you were working (someone merged a PR), bring those
changes into your branch:

```bash
git checkout main
git pull
git checkout feature/7-survey-question-page
git merge main
```

### Merge conflicts

A conflict happens when two people changed the same lines. Git marks them:

```
<<<<<<< HEAD
your version
=======
the other version
>>>>>>> main
```

Edit the file so it contains the correct final result (remove the markers),
then:

```bash
git add <file>
git commit
```

Unsure which version is right? Ask the person who wrote the other part.
VS Code also shows buttons ("Accept Current / Incoming / Both").

## Reviewing a PR

- Does it do what the issue asked?
- Is it understandable? Would you be able to change it later?
- Any secrets, debug logs or commented-out code left in?
- Be kind and specific. "Could we rename `x` to `questionText`?" beats
  "bad naming".

To test a PR locally: `gh pr checkout <number>`.

## Secrets

- Backend secrets go in **.NET user-secrets**, which live outside the repo:
  ```bash
  cd backend/src/Scopewise.Api
  dotnet user-secrets set "Gemini:ApiKey" "<your key>"
  ```
- Frontend: `.env.local` files are ignored by git. Never put API keys in the
  frontend, because everything there is visible to users.
- If you accidentally commit a secret: tell the team and **rotate the key
  immediately**. Deleting the commit is not enough.

## Cheat sheet

| I want to…                         | Command                                   |
| ---------------------------------- | ----------------------------------------- |
| see what changed                   | `git status` / `git diff`                 |
| get latest main                    | `git checkout main && git pull`           |
| start a task                       | `git checkout -b feature/<nr>-<name>`     |
| save work                          | `git add . && git commit -m "…"`          |
| upload work                        | `git push`                                |
| open a PR                          | `gh pr create --fill`                     |
| test someone's PR                  | `gh pr checkout <nr>`                     |
| update my branch with main         | `git merge main` (after pulling main)     |
| throw away uncommitted changes     | `git restore <file>` (careful!)           |
| see history                        | `git log --oneline --graph`               |
