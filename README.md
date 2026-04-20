# NostrToolsNgApp

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.1.0.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Local database (SQLite only)

The project now uses a single SQLite database for API requests:

- Runtime DB: `.runtime/pack-requests.sqlite` by default
- Empty schema: `pack-requests.schema.sql`
- SQL dump: `pack-requests.dump.sql`

The runtime path can be overridden with:

- `DATABASE_PATH=/absolute/path/to/pack-requests.sqlite`
- `DATA_DIR=/absolute/path/to/runtime-dir`

For Railway with a persistent volume, point `DATABASE_PATH` to the mounted volume, for example `/data/pack-requests.sqlite`.

Helper commands:

```bash
npm run db:reset
npm run db:dump
npm run db:restore
```

- `db:reset`: recreate `.runtime/pack-requests.sqlite` with an empty `pack_requests` table
- `db:dump`: export current `pack_requests` data to `pack-requests.dump.sql`
- `db:restore`: recreate `.runtime/pack-requests.sqlite` from `pack-requests.dump.sql`

Restore the dumped data into a fresh SQLite file with:

```bash
rm -f .runtime/pack-requests.sqlite
sqlite3 .runtime/pack-requests.sqlite < pack-requests.dump.sql
```
