Use an hexagonal architectures for "api" and "webapp" pnpm workspace's packages. We use zod for data parsing and validation.

In the "api":
- Use the guidelines on Domain Driven Design from Vaughn Vernon.
- Always use business-logic's gateways interfaces to implement an adapter.
- Use types from shared-kernel's "controller.ts" nestjs primary adapter.
- Use builders like `report.builder.ts`.
- Use Drizzle for the ORM.
- Use this hexagonal architecture folder tree:
├── src
│   ├── reports-context
│   │   ├── adapters
│   │   │   ├── primary
│   │   │   │   └── nestjs
│   │   │   │       ├── dto
│   │   │   │       └── event-subscribers
│   │   │   └── secondary
│   │   │       └── gateways
│   │   │           ├── repositories
│   │   │           │   └── drizzle
│   │   │           │       └── schema
│   │   │           │           └── migration-tests
│   │   │           └── providers
│   │   │           └── services
│   │   └── business-logic
│   │       ├── errors
│   │       ├── gateways
│   │       │   ├── queries
│   │       │   ├── repositories
│   │       │   ├── providers
│   │       │   └── services
│   │       ├── models
│   │       └── use-cases
│   │           ├── report-retrieval
│   └── shared-kernel
│   ├── ... (other contexts folders)

In the "webapp":
- Use Redux. Use Thunks. Use `AppDependencies` type for dependency injection through Redux's extra arguments.
- Use vitest.
- Use react-testing-library for React component tests.
- Use `listReport.use-case.spec.ts` as test example for use cases tests.
- Use `selectReport.spec.ts` as a test example for selectors tests.
- Use `ReportOverview.spec.tsx` as a test example for React component tests.
- Use builders like `Report.builder.ts`.

For all tests:
- Never create tests only for stub or fake repositories.
- use the TDD Red-Green-Refactor method. In an answer, only do one of these three steps.
- use the Transformation Priority Premise from  Robert C. Martin.


Always use existing helpers and types from the "shared-models" package when it's possible.