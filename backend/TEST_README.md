# Тестування HRM Backend

## Передумови

1. PostgreSQL запущена локально
2. Створена тестова база даних `hrm_test`
3. Node.js 18+ встановлений

## Налаштування тестового оточення

### 1. Створіть `.env.test` файл в корені `backend/`

```env
PORT=5050
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hrm_test?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="test-secret-key-change-in-production"
NODE_ENV=test
UPLOAD_DIR=./uploads_test
```

### 2. Створіть тестову базу даних

```bash
# Підключіться до PostgreSQL
psql -U postgres

# Створіть тестову базу
CREATE DATABASE hrm_test;

# Вийдіть з psql
\q
```

### 3. Застосуйте міграції до тестової БД

```bash
cd backend
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hrm_test?schema=public" npx prisma migrate deploy
```

Або використовуйте `prisma db push` для тестової БД:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hrm_test?schema=public" npx prisma db push
```

## Запуск тестів

### Всі тести
```bash
npm test
```

### Тільки юніт-тести
```bash
npm run test:unit
```

### Тільки інтеграційні тести
```bash
npm run test:integration
```

### З покриттям коду
```bash
npm run test:cov
```

### У режимі watch (автоматичний перезапуск)
```bash
npm run test:watch
```

## Структура тестів

```
backend/src/tests/
├── setupTestEnv.ts          # Налаштування тестового оточення
├── factories/               # Фабрики для створення тестових даних
│   └── index.ts
├── helpers/                  # Допоміжні функції
│   └── auth.ts              # Генерація тестових JWT токенів
├── unit/                    # Юніт-тести
│   ├── middlewares/
│   │   ├── auth.test.ts
│   │   └── errorHandler.test.ts
│   └── validation/
│       └── zod.test.ts
└── integration/             # Інтеграційні тести
    ├── users.test.ts
    ├── employees.test.ts
    ├── departments.test.ts
    ├── time.test.ts
    ├── documents.test.ts
    ├── recruitment.test.ts
    ├── analytics.test.ts
    └── swagger-contract.test.ts
```

## Покриття коду

Мінімальні вимоги:
- Statements: 70%
- Branches: 70%
- Functions: 70%
- Lines: 70%

Звіт з покриттям генерується в `coverage/` директорії:
- `coverage/lcov-report/index.html` - HTML звіт
- `coverage/lcov.info` - LCOV формат

## Тестові дані

Тести автоматично створюють і очищають тестові дані через фабрики (`factories/index.ts`).

Перед кожним тестом база даних очищається (isolation).

## Типи тестів

### Юніт-тести

Тестують окремі компоненти ізоляційно:
- Middleware (auth, error handling)
- Валідація (Zod схеми)
- Утиліти та хелпери

### Інтеграційні тести

Тестують повний стек (API → Controller → DB):
- CRUD операції
- Аутентифікація та авторизація
- Фільтрація, пагінація, сортування
- Бізнес-логіка

### Контрактні тести

Перевіряють відповідність API Swagger специфікації:
- Структура запитів/відповідей
- Security requirements
- Schema validation

## Приклад запуску

```bash
# 1. Запустити всі тести
npm test

# 2. Переглянути покриття
npm run test:cov
open coverage/lcov-report/index.html

# 3. Запустити конкретний тест
npm test -- users.test.ts

# 4. Запустити тести з додатковим виводом
npm test -- --verbose
```

## Вирішення проблем

### Помилка: "Database does not exist"
Переконайтесь, що тестова БД створена і міграції застосовані.

### Помилка: "Connection refused"
Перевірте, що PostgreSQL запущений і DATABASE_URL правильний.

### Помилки з foreign keys під час очищення БД
Тести автоматично очищають таблиці в правильному порядку. Якщо помилки залишаються, перевірте порядок видалення в `setupTestEnv.ts`.

### Помилки з токенами
Переконайтесь, що `JWT_SECRET` в `.env.test` відповідає тому, що використовується в тестах.

## Скріншоти для документації

Після успішного запуску тестів можна зробити скріншоти:

1. **Swagger UI**: `http://localhost:5050/api-docs`
2. **Test Run**: термінал з усіма тестами (green)
3. **Coverage Summary**: `npm run test:cov` output
4. **Prisma Studio**: `npx prisma studio` з тестовими даними (використовуйте тестову БД)

