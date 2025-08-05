Use an hexagonal architectures for "api" pnpm workspace's packages. We use zod for data parsing and validation.

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


Always use existing helpers and types from the "shared-models" package when it's possible.