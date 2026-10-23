# QuickNotes Data Model

## Design overview

QuickNotes uses a relational SQL database (PostgreSQL is the proposed default). Users own notes, and notes can be associated with multiple tags. A tag can also describe many notes, so `note_tags` resolves the many-to-many relationship.

## Entities and relationships

- **users**: one user can own many notes (one-to-many).
- **notes**: each note belongs to exactly one user; note title is required and limited to 100 characters.
- **tags**: tags are scoped to their owner to avoid accidental cross-user tag sharing.
- **note_tags**: join table connecting notes and tags; its composite primary key prevents duplicate assignments. Foreign keys enforce referential integrity.

## SQL schema

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL CHECK (char_length(trim(title)) > 0),
    body TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL CHECK (char_length(trim(name)) > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, name)
);

CREATE TABLE note_tags (
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (note_id, tag_id)
);
```

## Example SQL queries

### 1. List a user's newest notes

```sql
SELECT id, title, body, created_at, updated_at
FROM notes
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT 20;
```

### 2. Search a user's notes by title or body

```sql
SELECT id, title, body, created_at
FROM notes
WHERE user_id = $1
  AND (title ILIKE '%' || $2 || '%' OR body ILIKE '%' || $2 || '%')
ORDER BY updated_at DESC
LIMIT 50;
```

### 3. Retrieve notes with their tags (JOIN)

```sql
SELECT n.id, n.title, t.id AS tag_id, t.name AS tag_name
FROM notes AS n
LEFT JOIN note_tags AS nt ON nt.note_id = n.id
LEFT JOIN tags AS t ON t.id = nt.tag_id
WHERE n.user_id = $1
ORDER BY n.created_at DESC, t.name;
```

### 4. Add a tag to a note

```sql
INSERT INTO note_tags (note_id, tag_id)
SELECT n.id, t.id
FROM notes n
JOIN tags t ON t.id = $2 AND t.user_id = n.user_id
WHERE n.id = $1
ON CONFLICT (note_id, tag_id) DO NOTHING;
```

## Indexes

```sql
CREATE INDEX idx_notes_user_created
ON notes (user_id, created_at DESC);

CREATE INDEX idx_note_tags_tag
ON note_tags (tag_id);
```

`idx_notes_user_created` supports the most common list operation—fetching a user's newest notes—without scanning the entire notes table. The primary key on `note_tags(note_id, tag_id)` already supports lookups beginning with `note_id`; the additional `tag_id` index supports finding notes associated with a tag.

## SQL vs NoSQL decision

A relational SQL database is preferred because ownership, tags, and note-tag assignments have clear relationships and need reliable transactions and foreign-key constraints. PostgreSQL offers mature indexing, backups, and operational tooling. NoSQL could be reconsidered if future workloads require flexible document shapes or a different access pattern, but it would add complexity for the current relational model.
