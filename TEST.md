# Testing Guide

This document provides comprehensive information about the testing infrastructure and practices for the Budget Management App.

## Table of Contents

- [Overview](#overview)
- [Frontend Testing](#frontend-testing)
- [Backend Testing](#backend-testing)
- [Running Tests](#running-tests)
- [Coverage Reports](#coverage-reports)
- [CI/CD Integration](#cicd-integration)
- [Writing Tests](#writing-tests)

## Overview

The Budget Management App uses a comprehensive testing strategy that includes:

- **Frontend**: Jest and React Testing Library for React/TypeScript components and hooks
- **Backend**: JUnit 5, Mockito, and Spring Boot Test for Java microservices
- **Coverage**: Jest for frontend, JaCoCo for backend with 80% coverage target

## Frontend Testing

### Technology Stack

- **Jest** - Testing framework
- **React Testing Library** - React component testing
- **@testing-library/user-event** - User interaction simulation
- **ts-jest** - TypeScript support for Jest

### Test Structure

```
app/Frontend/src/
├── modules/
│   ├── auth/
│   │   ├── hooks/__tests__/
│   │   └── pages/__tests__/
│   └── transactions/
│       └── hooks/__tests__/
└── shared/
    └── layouts/
        └── components/__tests__/
```

### Configuration

Tests are configured in `jest.config.js` with the following settings:

- Test environment: `jsdom`
- Coverage thresholds: 80% (branches, functions, lines, statements)
- Module path mapping for `@/` imports
- Setup file: `src/setupTests.ts`

### Test Categories

#### 1. Component Tests
Tests for React components focusing on rendering and user interactions.

**Example:**
```typescript
// LoginPage.test.tsx
import { render, screen } from '@testing-library/react';
import { LoginPage } from '../LoginPage';

test('should render login form', () => {
  render(<LoginPage />);
  expect(screen.getByTestId('login-form')).toBeInTheDocument();
});
```

#### 2. Hook Tests
Tests for custom React hooks.

**Example:**
```typescript
// useAuthStatus.test.ts
import { renderHook } from '@testing-library/react';
import { useAuthStatus } from '../useAuthStatus';

test('should return auth status', () => {
  const { result } = renderHook(() => useAuthStatus());
  expect(result.current.isAuthenticated).toBeDefined();
});
```

#### 3. Service Tests
Tests for API services and utilities.

### Running Frontend Tests

```bash
cd app/Frontend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Coverage Report Location

Coverage reports are generated in:
- HTML: `app/Frontend/coverage/lcov-report/index.html`
- LCOV: `app/Frontend/coverage/lcov.info`

## Backend Testing

### Technology Stack

- **JUnit 5** - Testing framework
- **Mockito** - Mocking framework
- **Spring Boot Test** - Spring testing support
- **AssertJ** - Fluent assertions
- **JaCoCo** - Code coverage

### Test Structure

```
app/backend-microservice/
├── transaction/
│   └── src/test/java/
│       └── com/microservice/transaction/
│           ├── controller/
│           ├── service/
│           └── repository/
└── report/
    └── src/test/java/
        └── com/microservice/report/
            ├── controller/
            ├── service/
            └── repository/
```

### Test Categories

#### 1. Controller Tests (Web Layer)

Uses `@WebMvcTest` for testing REST controllers.

**Example:**
```java
@WebMvcTest(TransactionController.class)
class TransactionControllerTest {
    @Autowired
    private MockMvc mockMvc;
    
    @MockBean
    private TransactionService transactionService;
    
    @Test
    void testCreateTransaction() throws Exception {
        // Test implementation
    }
}
```

#### 2. Service Tests (Business Logic)

Uses `@ExtendWith(MockitoExtension.class)` for testing service layer.

**Example:**
```java
@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {
    @Mock
    private TransactionRepository repository;
    
    @InjectMocks
    private TransactionServiceImpl service;
    
    @Test
    void testCreateTransaction() {
        // Test implementation
    }
}
```

#### 3. Repository Tests (Data Layer)

Uses `@DataJpaTest` for testing JPA repositories.

**Example:**
```java
@DataJpaTest
class TransactionRepositoryTest {
    @Autowired
    private TestEntityManager entityManager;
    
    @Autowired
    private TransactionRepository repository;
    
    @Test
    void testSaveTransaction() {
        // Test implementation
    }
}
```

### Running Backend Tests

#### Transaction Microservice

```bash
cd app/backend-microservice/transaction

# Run all tests
mvn test

# Run tests with coverage
mvn clean test jacoco:report

# Run specific test class
mvn test -Dtest=TransactionControllerTest
```

#### Report Microservice

```bash
cd app/backend-microservice/report

# Run all tests
mvn test

# Run tests with coverage
mvn clean test jacoco:report

# Run specific test class
mvn test -Dtest=ReportServiceTest
```

### Coverage Report Location

JaCoCo generates coverage reports in:
- HTML: `target/site/jacoco/index.html`
- XML: `target/site/jacoco/jacoco.xml`

## Running Tests

### Full Test Suite

To run all tests across the entire application:

```bash
# Frontend
cd app/Frontend
npm test

# Transaction Microservice
cd app/backend-microservice/transaction
mvn test

# Report Microservice
cd app/backend-microservice/report
mvn test
```

### Continuous Testing

For development with automatic test re-runs:

```bash
# Frontend
npm run test:watch

# Backend (using Maven wrapper if available)
mvn test -Dtest.watch=true
```

## Coverage Reports

### Frontend Coverage Thresholds

Configured in `jest.config.js`:
- Branches: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%

### Backend Coverage Thresholds

Configured in `pom.xml` via JaCoCo plugin:
- Line Coverage: 80%

### Viewing Coverage Reports

#### Frontend
```bash
cd app/Frontend
npm run test:coverage
open coverage/lcov-report/index.html
```

#### Backend
```bash
cd app/backend-microservice/transaction
mvn clean test jacoco:report
open target/site/jacoco/index.html
```

## CI/CD Integration

Tests are automatically executed in the GitHub Actions workflow on:
- Push to `main`, `develop`, `release/**`, `feature/**` branches
- Pull requests to `main`, `develop`, `feature/**` branches

### Workflow Configuration

The CI/CD pipeline includes:

1. **Frontend Testing**
   - Install dependencies
   - Run Jest tests
   - Generate coverage reports
   - Upload coverage to artifacts

2. **Backend Testing**
   - Set up Java environment
   - Run Maven tests
   - Generate JaCoCo reports
   - Check coverage thresholds
   - Upload coverage to artifacts

## Writing Tests

### Best Practices

#### Frontend

1. **Use Testing Library Queries Properly**
   ```typescript
   // ✅ Good - Accessible query
   screen.getByRole('button', { name: /submit/i });
   
   // ❌ Avoid - Fragile query
   container.querySelector('.submit-button');
   ```

2. **Test User Behavior, Not Implementation**
   ```typescript
   // ✅ Good - Tests behavior
   await userEvent.click(screen.getByRole('button'));
   expect(mockFunction).toHaveBeenCalled();
   
   // ❌ Avoid - Tests implementation
   expect(component.state.clicked).toBe(true);
   ```

3. **Use Descriptive Test Names**
   ```typescript
   // ✅ Good
   test('should display error message when login fails', () => {});
   
   // ❌ Avoid
   test('test 1', () => {});
   ```

#### Backend

1. **Follow AAA Pattern (Arrange, Act, Assert)**
   ```java
   @Test
   void testCreateTransaction() {
       // Arrange
       Transaction transaction = Transaction.builder().build();
       when(repository.save(any())).thenReturn(transaction);
       
       // Act
       Transaction result = service.create(transaction);
       
       // Assert
       assertThat(result).isNotNull();
       verify(repository).save(any());
   }
   ```

2. **Use Meaningful Assertions**
   ```java
   // ✅ Good - Clear assertions
   assertThat(result.getAmount())
       .isEqualByComparingTo(new BigDecimal("100.00"));
   
   // ❌ Avoid - Vague assertions
   assertTrue(result.getAmount() != null);
   ```

3. **Test Edge Cases**
   ```java
   @Test
   void testGetByIdNotFound() {
       when(repository.findById(999)).thenReturn(Optional.empty());
       
       assertThatThrownBy(() -> service.getById(999))
           .isInstanceOf(EntityNotFoundException.class);
   }
   ```

### Test Naming Conventions

#### Frontend
- Test files: `*.test.ts`, `*.test.tsx`
- Location: `__tests__/` directory next to source files

#### Backend
- Test files: `*Test.java`
- Location: Mirror structure in `src/test/java/`

### Mocking Guidelines

#### Frontend
```typescript
// Mock modules
jest.mock('../../services/api');

// Mock functions
const mockFunction = jest.fn();
mockFunction.mockReturnValue('value');
mockFunction.mockResolvedValue('async value');
```

#### Backend
```java
// Mock dependencies
@Mock
private Repository repository;

// Configure behavior
when(repository.findById(1)).thenReturn(Optional.of(entity));

// Verify calls
verify(repository, times(1)).save(any());
```

## Troubleshooting

### Common Issues

#### Frontend

**Issue**: Tests fail with "Cannot find module '@/...'"
- **Solution**: Check that path mapping is configured correctly in `jest.config.js`

**Issue**: "TextEncoder is not defined"
- **Solution**: Add polyfill in `setupTests.ts`

#### Backend

**Issue**: "No tests were executed"
- **Solution**: Ensure test classes end with `Test` and test methods are annotated with `@Test`

**Issue**: H2 database errors in tests
- **Solution**: Check that H2 dependency is in scope `test` in `pom.xml`

## Contributing

When adding new features:

1. Write tests before or alongside the implementation
2. Ensure tests pass locally before pushing
3. Maintain or improve coverage percentages
4. Follow the established test patterns
5. Update this documentation if adding new test types

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [JUnit 5 Documentation](https://junit.org/junit5/)
- [Mockito Documentation](https://site.mockito.org/)
- [Spring Boot Testing](https://spring.io/guides/gs/testing-web/)
- [JaCoCo Documentation](https://www.jacoco.org/jacoco/trunk/doc/)
