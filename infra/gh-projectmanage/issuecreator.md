Good, this is a **Projects v2** board (that `/projects/1/views/1` URL gives it away). With **`gh` CLI**, this is clean and scriptable once you know the exact incantation.

We’ll do this in three precise steps using **`gh project item-add`**.

---

## Prerequisites (one-time sanity check)

Make sure you’re logged in and authenticated:

```bash
gh auth status
```

Your token must have:

* `repo`
* `project`
* `read:org`

If not:

```bash
gh auth refresh -s repo,project,read:org
```

---

## Step 1: Create the issue in `ASKIEP/iepapp`

```bash
gh issue create \
  --repo ASKIEP/iepapp \
  --title "IEP analyzer: add YoY comparison" \
  --body "Track year-over-year changes across uploaded IEP documents" \
  --assignee your-github-username \
  --label enhancement
```

When it finishes, note the issue number (say it prints `#42`).

---

## Step 2: Add the issue to the **ASKIEP org project (Projects v2)**

This is the key command 👇

```bash
gh project item-add 1 \
  --owner ASKIEP \
  --repo ASKIEP/iepapp \
  --issue 42
```

Explanation, in human terms:

* `1` → project number (from `/projects/1`)
* `--owner ASKIEP` → org-level project
* `--repo ASKIEP/iepapp` → source repo
* `--issue 42` → issue number

At this point, the issue is **visible in the project**, usually landing in the default view/state.

---

## Step 3 (Optional): Set status / column in the project

Projects v2 don’t have “columns”; they have **fields** (like `Status`).

First, list fields to find the exact field + option IDs:

```bash
gh project field-list 1 --owner ASKIEP
```

You’ll see something like:

```
ID          Name     Type
PVTF_xxx    Status   SingleSelect
```

Now list options for `Status`:

```bash
gh project field-list 1 --owner ASKIEP --format json | jq
```

Or more directly:

```bash
gh project field-list 1 --owner ASKIEP
```

Once you know:

* Field name: `Status`
* Option name: e.g. `Todo`

Set it:

```bash
gh project item-edit 1 \
  --owner ASKIEP \
  --repo ASKIEP/iepapp \
  --issue 42 \
  --field "Status" \
  --single-select-option "Todo"
```

Now it will appear correctly in **View 1** if that view filters by `Status`.

---

## One-shot script version (automation friendly)

```bash
ISSUE=$(gh issue create \
  --repo ASKIEP/iepapp \
  --title "IEP analyzer: add YoY comparison" \
  --body "Track year-over-year changes across uploaded IEP documents" \
  --assignee your-github-username \
  --label enhancement \
  --json number -q .number)

gh project item-add 1 \
  --owner ASKIEP \
  --repo ASKIEP/iepapp \
  --issue "$ISSUE"

gh project item-edit 1 \
  --owner ASKIEP \
  --repo ASKIEP/iepapp \
  --issue "$ISSUE" \
  --field "Status" \
  --single-select-option "Todo"
```

This is **CI/CD-safe**, works in GitHub Actions, and scales beautifully for backlog automation.

---

## Mental model (important)

Classic boards = columns
Projects v2 = database rows + fields

Once that clicks, everything becomes predictable instead of mystical.

This setup is exactly right for **AskIEP-scale planning**: repo-local issues, org-level product visibility, and automation-ready workflows.
