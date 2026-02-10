# Code and Architecture Audit — Budget Management App

Date: 2026-02-10  
Scope: Backend, Frontend, Infrastructure

This report consolidates the main technical findings identified in the repository, focusing on violations of SOLID principles, code smells, and scalability/maintainability risks. Each finding includes its description, the violated principle or practice, and the impact on scalability.

---

## 1. Exposing JPA Entities in REST API (Abstraction Leak)

- Finding:
  - REST controllers return JPA entities (`Transaction`, `Report`) directly in HTTP responses.
  - Evidence:
    - TransactionController: returns `ResponseEntity<Transaction>` and the full list in `getAll`.  
      [app/backend-microservice/transaction/src/main/java/com/microservice/transaction/controller/TransactionController.java](https://github.com/majoymajo/Budget_Management_App/blob/1083c51890b3b9a285dca3ad4059d1f70b09c5e3/app/backend-microservice/transaction/src/main/java/com/microservice/transaction/controller/TransactionController.java#L1-L42)
    - ReportController: returns `ResponseEntity<Report>` and lists of `Report`.  
      [app/backend-microservice/report/src/main/java/com/microservice/report/controller/ReportController.java](https://github.com/majoymajo/Budget_Management_App/blob/1083c51890b3b9a285dca3ad4059d1f70b09c5e3/app/backend-microservice/report/src/main/java/com/microservice/report/controller/ReportController.java#L1-L40)
- Violated principle:
  - Encapsulation and information hiding.
  - Clean Architecture: separation between persistence models and API contracts (use of DTOs).
- Impact on scalability:
  - Fragile API contracts: changes in the database schema break clients.
  - Difficulty versioning and controlling visibility of sensitive fields.
  - Increased coupling between layers and maintenance cost.

---

## 2. Controllers Orchestrating Infrastructure (Smart/Fat Controller)

- Finding:
  - The `TransactionController` orchestrates business logic and messaging (RabbitMQ), invoking a producer directly.
  - Evidence:
    - `TransactionMessageProducer` used from the controller.  
      [app/backend-microservice/transaction/src/main/java/com/microservice/transaction/infrastructure/TransactionMessageProducer.java](https://github.com/majoymajo/Budget_Management_App/blob/1083c51890b3b9a285dca3ad4059d1f70b09c5e3/app/backend-microservice/transaction/src/main/java/com/microservice/transaction/infrastructure/TransactionMessageProducer.java#L1-L35)
- Violated principle:
  - SRP (Single Responsibility Principle): the controller mixes presentation responsibilities with infrastructure.
  - DIP (Dependency Inversion Principle): it depends on a concrete implementation (specific producer).
- Impact on scalability:
  - More complex unit tests (hard to isolate).  
  - Greater coupling, less flexibility to change the broker or the event publishing strategy.  
  - Harder to evolve the architecture (e.g., introducing alternative queues/events).

---

## 3. Hardcoded and Duplicated RabbitMQ Configuration

- Finding:
  - Names of `exchange`, `queues`, and `routing keys` defined as string literals in code and repeated across microservices.
  - Evidence:
    - Configuration in `transaction`:  
      [app/backend-microservice/transaction/src/main/java/com/microservice/transaction/infrastructure/RabbitMQConfiguration.java](https://github.com/majoymajo/Budget_Management_App/blob/1083c51890b3b9a285dca3ad4059d1f70b09c5e3/app/backend-microservice/transaction/src/main/java/com/microservice/transaction/infrastructure/RabbitMQConfiguration.java#L1-L61)
    - Configuration in `report`:  
      [app/backend-microservice/report/src/main/java/com/microservice/report/infrastructure/RabbitMQConfiguration.java](https://github.com/majoymajo/Budget_Management_App/blob/1083c51890b3b9a285dca3ad4059d1f70b09c5e3/app/backend-microservice/report/src/main/java/com/microservice/report/infrastructure/RabbitMQConfiguration.java#L1-L61)
    - Usage in producer:  
      [app/backend-microservice/transaction/src/main/java/com/microservice/transaction/infrastructure/TransactionMessageProducer.java](https://github.com/majoymajo/Budget_Management_App/blob/1083c51890b3b9a285dca3ad4059d1f70b09c5e3/app/backend-microservice/transaction/src/main/java/com/microservice/transaction/infrastructure/TransactionMessageProducer.java#L1-L35)
- Violated principle:
  - Twelve-Factor App (configuration in the environment).
  - DRY (Don’t Repeat Yourself): duplication of constants across services.
- Impact on scalability:
  - Configuration changes require recompilation/deployment.  
  - Risk of inconsistencies across services.  
  - Operational complexity when scaling environments (dev/staging/prod).

---

## 4. Frontend Directly Coupled to Firebase Auth (Vendor Lock-In)

- Finding:
  - The user store and authentication services import and use the Firebase Auth SDK directly.
  - Evidence:
    - Store:  
      [app/Frontend/src/modules/auth/store/useUserStore.ts](https://github.com/majoymajo/Budget_Management_App/blob/1083c51890b3b9a285dca3ad4059d1f70b09c5e3/app/Frontend/src/modules/auth/store/useUserStore.ts#L1-L67)
    - Configuration:  
      [app/Frontend/src/core/config/firebase.config.ts](https://github.com/majoymajo/Budget_Management_App/blob/1083c51890b3b9a285dca3ad4059d1f70b09c5e3/app/Frontend/src/core/config/firebase.config.ts#L1-L15)
    - Service:  
      [app/Frontend/src/modules/auth/services/authService.ts](https://github.com/majoymajo/Budget_Management_App/blob/1083c51890b3b9a285dca3ad4059d1f70b09c5e3/app/Frontend/src/modules/auth/services/authService.ts#L1-L103)
- Violated principle:
  - DIP (Dependency Inversion Principle).
  - Clean Architecture: infrastructure details leaking into the state layer.
- Impact on scalability:
  - Hard to migrate to another identity provider without a massive refactor.  
  - Lower testability (complex SDK mocks).  
  - Impacts domain/UI independence from the provider.

---

## 5. Reinventing Date Utilities in Frontend

- Finding:
  - Manual implementation of date formatting and month names using string arrays.
  - Evidence:
    - `date-utils.ts`:  
      [app/Frontend/src/lib/date-utils.ts](https://github.com/majoymajo/Budget_Management_App/blob/1083c51890b3b9a285dca3ad4059d1f70b09c5e3/app/Frontend/src/lib/date-utils.ts#L1-L50)
- Violated principle:
  - DRY/KISS and “Don’t Reinvent the Wheel”.
- Impact on scalability:
  - Larger error surface (edge cases, i18n).  
  - Costly manual maintenance and hard to internationalize.  
  - Hinders consistent formatting as the app grows.

---

## 6. Inline Components and Hardcoded Presentation Logic

- Finding:
  - Page components defined inline in the router and category color maps embedded in components.
  - Evidence:
    - Router with inline components:  
      [app/Frontend/src/core/router/AppRouter.tsx](https://github.com/majoymajo/Budget_Management_App/blob/1083c51890b3b9a285dca3ad4059d1f70b09c5e3/app/Frontend/src/core/router/AppRouter.tsx#L1-L81)
    - Hardcoded colors:  
      [app/Frontend/src/modules/transactions/components/DataTable.tsx](https://github.com/majoymajo/Budget_Management_App/blob/1083c51890b3b9a285dca3ad4059d1f70b09c5e3/app/Frontend/src/modules/transactions/components/DataTable.tsx#L1-L93)
- Violated principle:
  - Separation of Concerns (SoC).  
  - Theming/centralized configuration principles.
- Impact on scalability:
  - Less readable and reusable code; harder to theme.  
  - Visual changes imply frequent deployments.  
  - Lower visual consistency as the number of views grows.

---

## 7. Side Effects on Store Load (initAuthListener on Import)

- Finding:
  - `useUserStore.getState().initAuthListener()` executes when the module is loaded, triggering side effects on import.
  - Evidence:
    - End of file `useUserStore.ts`.  
      [app/Frontend/src/modules/auth/store/useUserStore.ts](https://github.com/majoymajo/Budget_Management_App/blob/1083c51890b3b9a285dca3ad4059d1f70b09c5e3/app/Frontend/src/modules/auth/store/useUserStore.ts#L1-L67)
- Violated principle:
  - Explicit control of effects and predictable initialization (Clean Code/Architecture).
- Impact on scalability:
  - Unexpected behavior in SSR/tests.  
  - Hard to modularize and control lifecycle in large apps.  
  - Increases risk of errors as the number of stores/effects grows.

---

## 8. Hardcoded CORS in Spring Boot

- Finding:
  - Allowed origins defined in code with `allowedOrigins("http://localhost:3000")`.
  - Evidence:
    - ReportApplication:  
      [app/backend-microservice/report/src/main/java/com/microservice/report/ReportApplication.java](https://github.com/majoymajo/Budget_Management_App/blob/1083c51890b3b9a285dca3ad4059d1f70b09c5e3/app/backend-microservice/report/src/main/java/com/microservice/report/ReportApplication.java#L1-L28)
    - TransactionApplication:  
      [app/backend-microservice/transaction/src/main/java/com/microservice/transaction/TransactionApplication.java](https://github.com/majoymajo/Budget_Management_App/blob/1083c51890b3b9a285dca3ad4059d1f70b09c5e3/app/backend-microservice/transaction/src/main/java/com/microservice/transaction/TransactionApplication.java#L1-L27)
- Violated principle:
  - Twelve-Factor App: configuration in the environment, not in code.
- Impact on scalability:
  - Makes operating multiple environments (dev/staging/prod) harder.  
  - Requires deployment to change origins.  
  - Potential misalignment across services as teams scale.

---

## 9. List Endpoints Without Pagination/Filters

- Finding:
  - `getAll()` returns the complete list of transactions without pagination.
  - Evidence:
    - TransactionController `getAll`:  
      [app/backend-microservice/transaction/src/main/java/com/microservice/transaction/controller/TransactionController.java](https://github.com/majoymajo/Budget_Management_App/blob/1083c51890b3b9a285dca3ad4059d1f70b09c5e3/app/backend-microservice/transaction/src/main/java/com/microservice/transaction/controller/TransactionController.java#L1-L42)
- Violated principle:
  - API design best practices for scalability (pagination/sorting/filtering).
- Impact on scalability:
  - Performance/memory/network issues as the dataset grows.  
  - Less control of client consumption.  
  - Harder to guarantee SLAs with large volumes.

---

## 10. Error Handling and Uniform Responses

- Finding:
  - No centralized `@ControllerAdvice` observed to map exceptions to uniform responses; `ReportNotFoundException` exists but handling is not standardized globally.
  - Evidence:
    - Services and controllers in `report` without visible centralized handling.
- Violated principle:
  - Robustness/consistency of API contracts; Observability (clear messages).
- Impact on scalability:
  - Harder debugging and client support.  
  - Inconsistencies as the number of endpoints/services grows.  
  - Higher maintenance effort to align responses.

---

## 11. Duplicated Types/Models and Need for Shared Domain (Frontend)

- Finding:
  - Multiple modules define similar types; consolidation in a shared domain package (`src/shared/domain`) is required to avoid duplication.
  - Evidence:
    - Types in `transactions` and `shared` with their own maps/adapters.  
      [app/Frontend/src/modules/transactions/types/transaction.types.ts](https://github.com/majoymajo/Budget_Management_App/blob/1083c51890b3b9a285dca3ad4059d1f70b09c5e3/app/Frontend/src/modules/transactions/types/transaction.types.ts#L1-L21)  
      [app/Frontend/src/shared/types/index.ts](https://github.com/majoymajo/Budget_Management_App/blob/1083c51890b3b9a285dca3ad4059d1f70b09c5e3/app/Frontend/src/shared/types/index.ts#L1-L49)

---

## Additional Notes

- Spring Boot versioning: `spring-boot-starter-parent` is declared as version `4.0.2` in `pom.xml`, which does not align with the stable line known (3.x at this date). It is recommended to validate compatibility and support.
  - Evidence:  
    [app/backend-microservice/report/pom.xml](https://github.com/majoymajo/Budget_Management_App/blob/1083c51890b3b9a285dca3ad4059d1f70b09c5e3/app/backend-microservice/report/pom.xml#L1-L25)  
    [app/backend-microservice/transaction/pom.xml](https://github.com/majoymajo/Budget_Management_App/blob/1083c51890b3b9a285dca3ad4059d1f70b09c5e3/app/backend-microservice/transaction/pom.xml#L1-L25)

---
