# Database setup

The database tests run against whichever of the three engines you configure
— any subset is fine. Tests you don't configure **skip with a warning**.

**Ground rules (all engines):**

- Use a **scratch database**. The tests create tables named
  `sgt_<something>_<run-guid>` and drop them when done, but never point the
  connection at anything holding real data.
- The account needs `CREATE TABLE` / `DROP TABLE` plus normal DML in that
  database (on SQL Server, `db_owner` on the scratch DB is the simple
  choice).

## SQL Server — `sgtDbMssql`

1. Create (or pick) a scratch database, e.g. `BotTestsDB`.
2. Create a SQL login with db_owner on that database only.
3. On the Shared Variables page, double-click `sgtDbMssql` and fill in the
   connection editor — or paste a connection string:
   `Server=myhost,1433;Database=BotTestsDB;User Id=bot_tests;Password=...;Encrypt=true;TrustServerCertificate=true;`
4. Run `tier1-features/database/select-rows-from-seed` to prove the wiring.

Used by most `tier1-features/database/` tests and several `tier2-shapes`
chains (int-03, int-05, int-11, int-14).

## PostgreSQL — `sgtDbPg`

1. Create a scratch database and a role that owns it.
2. Fill `sgtDbPg` with the URL form:
   `postgresql://bot_tests@myhost:5432/bottests` — add your password in the URL per your provider's format (`user:password@host`)
   (managed providers may need their SSL parameters kept in the URL exactly
   as issued).
3. Run `tier1-features/database/live-pg-select-where` to prove the wiring.

Also used by the int-02 chain (database → CSV → email).

## MySQL — `sgtDbMysql`

1. Create a scratch schema and a user with full rights on it.
2. Fill `sgtDbMysql`: `mysql://bot_tests@myhost:3306/bottests` (same note: add your password after the username)
3. Run `tier1-features/database/live-mysql-select-where`.

## ODBC — `sgtOdbcMssql` (optional)

The ODBC round-trip test additionally needs the Microsoft ODBC driver
installed locally. `sgtOdbcMssql` takes the full DSN-less string:
`DRIVER={ODBC Driver 18 for SQL Server};SERVER=myhost;DATABASE=BotTestsDB;UID=bot_tests;PWD=...;TrustServerCertificate=yes;`
