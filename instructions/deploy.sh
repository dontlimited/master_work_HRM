#!/usr/bin/env bash

# Скрипт автоматичного розгортання HRM системи
# Використання: ./deploy.sh

set -euo pipefail

# Кольори для виводу
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функція для виводу повідомлень
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Перевірка наявності необхідних команд
check_command() {
    if ! command -v "$1" &> /dev/null; then
        log_error "$1 не встановлено. Будь ласка, встановіть $1 перед продовженням."
        exit 1
    fi
}

# Перевірка версії Node.js
check_node_version() {
    local node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt 18 ]; then
        log_error "Node.js версія 18+ необхідна. Поточна версія: $(node --version)"
        exit 1
    fi
    log_success "Node.js версія: $(node --version)"
}

# Перевірка підключення до PostgreSQL
check_postgres() {
    log_info "Перевірка підключення до PostgreSQL..."
    if command -v psql &> /dev/null; then
        if psql -U postgres -c '\q' 2>/dev/null; then
            log_success "PostgreSQL доступний"
        else
            log_warning "Не вдалося підключитися до PostgreSQL. Переконайтеся, що PostgreSQL запущений та доступний."
        fi
    else
        log_warning "psql не знайдено. Переконайтеся, що PostgreSQL встановлено."
    fi
}

# Створення бази даних
create_database() {
    local db_name="hrm_local"
    log_info "Перевірка наявності бази даних '$db_name'..."
    
    if psql -U postgres -lqt | cut -d \| -f 1 | grep -qw "$db_name"; then
        log_success "База даних '$db_name' вже існує"
    else
        log_info "Створення бази даних '$db_name'..."
        if psql -U postgres -c "CREATE DATABASE $db_name;" 2>/dev/null; then
            log_success "База даних '$db_name' створена"
        else
            log_error "Не вдалося створити базу даних. Переконайтеся, що PostgreSQL запущений та у вас є права."
            exit 1
        fi
    fi
}

# Генерація JWT секрету
generate_jwt_secret() {
    if command -v openssl &> /dev/null; then
        openssl rand -base64 32 | tr -d '\n'
    else
        # Fallback для систем без openssl
        cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1
    fi
}

# Основна функція
main() {
    log_info "Початок розгортання HRM системи..."
    echo ""
    
    # Перевірка необхідних команд
    log_info "Перевірка необхідних залежностей..."
    check_command "node"
    check_command "npm"
    check_node_version
    check_postgres
    echo ""
    
    # Створення бази даних
    create_database
    echo ""
    
    # Backend встановлення
    log_info "=== Встановлення Backend залежностей ==="
    if [ ! -d "backend" ]; then
        log_error "Директорія 'backend' не знайдена. Переконайтеся, що ви знаходитесь в корені проєкту."
        exit 1
    fi
    
    cd backend
    
    if [ ! -d "node_modules" ]; then
        log_info "Встановлення npm пакетів для backend..."
        npm install
        log_success "Backend залежності встановлено"
    else
        log_success "Backend залежності вже встановлені"
    fi
    
    # Створення .env файлу
    if [ ! -f ".env" ]; then
        log_info "Створення .env файлу для backend..."
        JWT_SECRET=$(generate_jwt_secret)
        cat > .env <<EOF
PORT=5050
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hrm_local?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="$JWT_SECRET"
NODE_ENV=development
UPLOAD_DIR=./uploads
EOF
        log_success ".env файл створено з автоматично згенерованим JWT_SECRET"
    else
        log_success ".env файл вже існує"
    fi
    
    # Створення директорії для завантаження файлів
    mkdir -p uploads
    log_success "Директорія uploads створена"
    
    # Генерація Prisma клієнта
    log_info "Генерація Prisma клієнта..."
    npx prisma generate
    log_success "Prisma клієнт згенеровано"
    
    # Застосування схеми бази даних
    log_info "Застосування схеми бази даних..."
    if npx prisma db push --accept-data-loss; then
        log_success "Схема бази даних застосована"
    else
        log_error "Не вдалося застосувати схему бази даних"
        exit 1
    fi
    
    # Заповнення бази даних початковими даними
    log_info "Заповнення бази даних початковими даними (seed)..."
    log_info "Це може зайняти кілька секунд..."
    if npm run prisma:seed; then
        log_success "База даних заповнена початковими даними"
        log_info "Створені тестові користувачі:"
        echo "    - Admin:    admin@local.test / Admin@123"
        echo "    - HR:        hr@local.test / Hr@12345"
        echo "    - Employee:  employee@local.test / Emp@12345"
        echo "    - Candidate: candidate@local.test / Cand@12345"
    else
        log_error "Не вдалося виконати seed. Перевірте помилки вище."
        log_warning "Можливо, дані вже існують або є проблема з підключенням до БД"
        exit 1
    fi
    
    cd ..
    echo ""
    
    # Frontend встановлення
    log_info "=== Встановлення Frontend залежностей ==="
    if [ ! -d "frontend" ]; then
        log_error "Директорія 'frontend' не знайдена. Переконайтеся, що ви знаходитесь в корені проєкту."
        exit 1
    fi
    
    cd frontend
    
    if [ ! -d "node_modules" ]; then
        log_info "Встановлення npm пакетів для frontend..."
        npm install
        log_success "Frontend залежності встановлено"
    else
        log_success "Frontend залежності вже встановлені"
    fi
    
    cd ..
    echo ""
    
    # Підсумок
    log_success "=== Розгортання завершено успішно! ==="
    echo ""
    log_info "Наступні кроки:"
    echo "  1. Запустіть backend:  cd backend && npm run dev"
    echo "  2. Запустіть frontend: cd frontend && npm run dev"
    echo ""
    log_info "Або використайте скрипт run-local.sh для одночасного запуску:"
    echo "  ./run-local.sh"
    echo ""
    log_info "Доступні адреси після запуску:"
    echo "  - Frontend: http://localhost:3000"
    echo "  - Backend:  http://localhost:5050"
    echo "  - API Docs: http://localhost:5050/api-docs"
    echo ""
    log_info "Тестові облікові записи (створені seed скриптом):"
    echo "  - Admin:    email: admin@local.test, password: Admin@123"
    echo "  - HR:       email: hr@local.test, password: Hr@12345"
    echo "  - Employee: email: employee@local.test, password: Emp@12345"
    echo "  - Candidate: email: candidate@local.test, password: Cand@12345"
    echo ""
    log_info "База даних містить:"
    echo "  - Користувачів з різними ролями"
    echo "  - Департаменти (Engineering, Frontend, Backend, QA, HR, тощо)"
    echo "  - Посади та компетенції"
    echo "  - Вакансії та кандидатів"
    echo "  - Курси для навчання"
    echo "  - Цикли 360 Feedback з питаннями"
    echo ""
}

# Запуск основної функції
main

