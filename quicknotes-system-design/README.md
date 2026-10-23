# QuickNotes System Design

QuickNotes is a capstone project that demonstrates a browser-based API client and documents a proposed production architecture for a notes service designed to scale toward one million users.

## Project contents

- `index.html` — semantic HTML structure and note form.
- `style.css` — responsive styling and success/error/loading status styles.
- `api.js` — reusable fetch helper plus GET, POST and DELETE operations.
- `docs/api-design.md` — proposed production REST API endpoints, examples and error model.
- `docs/data-model.md` — relational schema, keys, relationships, indexes and sample SQL.
- `docs/architecture.md` — requirements, capacity assumptions, architecture diagram, request flows and trade-offs.

## Run the API client

1. Download or clone this repository.
2. Open the project folder in VS Code.
3. Start a local static server from the project root. For example, if Python is installed:
   ```bash
   python -m http.server 8000
   ```
4. Visit `http://localhost:8000` in your browser.
5. Click **Load notes** to fetch ten posts, or use the form to create a practice note. Use the Delete button to remove a note from the current page.

The client uses the public JSONPlaceholder practice API at `https://jsonplaceholder.typicode.com/posts`. JSONPlaceholder simulates POST and DELETE operations and does not persist created/deleted posts as a real backend would. This client therefore updates the current page in memory and a reload may restore the original practice data. The API design documents describe a separate proposed production QuickNotes API.

No build step or package installation is required. An internet connection is required to reach JSONPlaceholder.

## Design documents

- [API design](docs/api-design.md)
- [Data model](docs/data-model.md)
- [Architecture](docs/architecture.md)

## What I learned

- How to structure a reusable asynchronous `fetch` helper and handle HTTP failures with `response.ok`.
- How loading, success, error and empty states make API interactions clearer for users.
- Why client-side validation improves usability but must be repeated by the backend for security.
- How relational keys and a join table model one-to-many and many-to-many relationships.
- How caching, read replicas, queues and stateless app servers address different scaling problems—and the trade-offs they introduce.

## Git history requirement

Create meaningful commits as you implement each task. Suggested sequence:

```bash
git init
git add index.html style.css
git commit -m "Add QuickNotes HTML structure and responsive styles"

git add api.js
git commit -m "Add API client with GET"

git add api.js
git commit -m "Add create note with POST"

git add api.js
git commit -m "Add delete with DELETE"

git add docs/api-design.md
git commit -m "Add API design doc"

git add docs/data-model.md
git commit -m "Add data model doc"

git add docs/architecture.md
git commit -m "Add architecture doc"

git add README.md
git commit -m "Add README and submission instructions"
```

## Publish to GitHub

Create a new **public** repository named `quicknotes-system-design` on GitHub, then run the following from this folder (replace the URL with your repository URL):

```bash
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/quicknotes-system-design.git
git push -u origin main
```

Before submitting, verify that the repository root contains `index.html`, `api.js`, `style.css`, and `README.md`, and that all three design documents are inside `docs/`. Submit the actual repository URL, not the ZIP file URL.
