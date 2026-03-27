# AskIEP API

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ with pgvector extension
- Task (Taskfile runner) - [Install here](https://taskfile.dev/installation/)

## Environment Setup

Create a `.env` file in the project root with:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=iep_database
POSTGRES_USER=iep_user
POSTGRES_PASSWORD=yourpassword
```

**Note:** Taskfile automatically loads `.env` for all tasks. No need for dotenv library.

## Database Setup & Migrations

This project uses Sequelize for migrations and seed data. All database tasks are available via npm scripts and Taskfile tasks.

### Common Tasks

- **Run all migrations:**
  ```sh
  task db:migrate
  ```

- **Rollback last migration:**
  ```sh
  task db:migrate:down
  ```

- **Show migration status:**
  ```sh
  task db:migrate:status
  ```

- **Run all seeds:**
  ```sh
  task db:seed
  ```

- **Rollback last seed:**
  ```sh
  task db:seed:down
  ```

- **Show seed status:**
  ```sh
  task db:seed:status
  ```

- **Reset database (dangerous, deletes all data):**
  ```sh
  task db:reset
  ```

- **Setup database (migrate + seed):**
  ```sh
  task db:setup
  ```

## Demo Users

After running migrations and seeds, you can log in with:

| Role     | Email                | Password |
|----------|----------------------|----------|
| Parent   | parent@askiep.com    | Demo123  |
| Advocate | advocate@askiep.com  | Demo123  |
| Teacher  | teacher@askiep.com   | Demo123  |
| Admin    | admin@askiep.com     | Demo123  |

Advocate and Teacher accounts require admin approval before login.

---

See the database design in `../docs/dbdesign.md` for full schema details.
