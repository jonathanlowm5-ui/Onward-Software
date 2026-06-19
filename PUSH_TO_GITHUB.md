# Push Onward to GitHub

This folder is **already a git repository** with one commit made. You just need to
create an empty repo on GitHub and point this at it.

## 1. Create an empty repo on GitHub
- Go to https://github.com/new
- Name it (e.g. `onward-fullstack`)
- **Do NOT** tick "Add a README", ".gitignore", or "license" — leave it empty
- Click **Create repository**

## 2. Connect and push
Open a terminal in this folder and paste these (swap in your repo URL):

```bash
git remote add origin https://github.com/YOUR_USERNAME/onward-fullstack.git
git branch -M main
git push -u origin main
```

If git asks for a password, use a **Personal Access Token** (Settings →
Developer settings → Personal access tokens → Tokens (classic) → generate one
with the `repo` scope), not your account password.

## Already set up here
- `.git` history with an initial commit
- A root `.gitignore` that excludes `node_modules`, build output, `.env` files,
  the backend `data/` store, and runtime uploads
- The empty `backend/uploads/` folder is kept via a `.gitkeep`

## Heads up — Firebase key in `.env.example`
`onward-react/.env.example` contains the Firebase **web** config (API key,
project ID, etc.). Firebase web keys are designed to live in client code and are
not a server secret, so this is normal to commit. But if your GitHub repo is
**public**, lock the key down in the Firebase console:
- APIs & Services → Credentials → restrict the key to your domains (HTTP referrers)
- Make sure Firestore/Storage security rules are enforced

If you'd rather not publish it at all, delete those Firebase lines from
`.env.example` before pushing and keep them only in your local `.env`.

## Later updates
After this first push, your normal loop is:

```bash
git add -A
git commit -m "describe what changed"
git push
```
