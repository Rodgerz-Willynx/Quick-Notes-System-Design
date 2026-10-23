const API_URL = "https://jsonplaceholder.typicode.com/posts";

const loadButton = document.getElementById("load-btn");
const statusElement = document.getElementById("status");
const notesList = document.getElementById("notes-list");
const noteForm = document.getElementById("note-form");
const titleInput = document.getElementById("title-input");
const bodyInput = document.getElementById("body-input");
const submitButton = document.getElementById("submit-btn");

function setStatus(message, type = "") {
  statusElement.textContent = message;
  statusElement.className = `status ${type}`.trim();
}

async function request(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const error = new Error(`The server returned HTTP ${response.status}.`);
    error.status = response.status;
    throw error;
  }
  // A successful DELETE may have an empty response body.
  if (response.status === 204) return { data: null, status: response.status };
  const data = await response.json();
  return { data, status: response.status };
}

function renderEmptyState(message = "No notes to display. Load notes or create your first note.") {
  notesList.replaceChildren();
  const item = document.createElement("li");
  item.className = "empty-state";
  item.textContent = message;
  notesList.appendChild(item);
}

function renderNote(note, prepend = false) {
  const item = document.createElement("li");
  item.className = "note";
  item.dataset.noteId = String(note.id);

  const content = document.createElement("div");
  content.className = "note-content";
  const title = document.createElement("h3");
  title.textContent = note.title || "(Untitled note)";
  const body = document.createElement("p");
  body.textContent = note.body || "No body provided.";
  const meta = document.createElement("span");
  meta.className = "note-meta";
  meta.textContent = `Note ID: ${note.id}`;
  content.append(title, body, meta);

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "delete-btn";
  deleteButton.textContent = "Delete";
  deleteButton.addEventListener("click", () => deleteNote(note.id, deleteButton));

  item.append(content, deleteButton);
  if (prepend) notesList.prepend(item);
  else notesList.appendChild(item);
}

async function loadNotes() {
  loadButton.disabled = true;
  setStatus("Loading notes...", "loading");
  try {
    const { data: notes } = await request(`${API_URL}?_limit=10`);
    notesList.replaceChildren();
    if (!Array.isArray(notes) || notes.length === 0) {
      renderEmptyState("No notes were returned by the server.");
      setStatus("No notes found.", "success");
      return;
    }
    notes.forEach(note => renderNote(note));
    setStatus(`Loaded ${notes.length} notes from the server.`, "success");
  } catch (error) {
    setStatus(`Could not load notes. ${friendlyError(error)}`, "error");
  } finally {
    loadButton.disabled = false;
  }
}

async function createNote(event) {
  event.preventDefault();
  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();

  if (!title) {
    setStatus("Please enter a title before creating a note.", "error");
    titleInput.focus();
    return;
  }
  if (title.length > 100) {
    setStatus("The title must be 100 characters or fewer.", "error");
    titleInput.focus();
    return;
  }

  submitButton.disabled = true;
  setStatus("Creating note...", "loading");
  try {
    const { data: note, status } = await request(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify({ title, body, userId: 1 })
    });
    // JSONPlaceholder simulates writes and does not persist created posts. The
    // returned note is added to this page's in-memory list for this session only.
    if (notesList.querySelector(".empty-state")) notesList.replaceChildren();
    renderNote(note, true);
    setStatus(`Note created (status ${status}, id ${note.id}).`, "success");
    noteForm.reset();
  } catch (error) {
    setStatus(`Could not create note. ${friendlyError(error)}`, "error");
  } finally {
    submitButton.disabled = false;
  }
}

async function deleteNote(id, button) {
  button.disabled = true;
  setStatus(`Deleting note ${id}...`, "loading");
  try {
    await request(`${API_URL}/${encodeURIComponent(id)}`, { method: "DELETE" });
    const item = notesList.querySelector(`[data-note-id="${CSS.escape(String(id))}"]`);
    if (item) item.remove();
    if (notesList.children.length === 0) renderEmptyState();
    // DELETE is simulated by JSONPlaceholder too; removal is reflected locally,
    // not persisted to the remote service.
    setStatus(`Note ${id} deleted from this view.`, "success");
  } catch (error) {
    button.disabled = false;
    setStatus(`Could not delete note ${id}. ${friendlyError(error)}`, "error");
  }
}

function friendlyError(error) {
  if (!navigator.onLine) return "Check your internet connection and try again.";
  if (error.status) return `Please try again (error ${error.status}).`;
  return "Check your connection and try again.";
}

loadButton.addEventListener("click", loadNotes);
noteForm.addEventListener("submit", createNote);
