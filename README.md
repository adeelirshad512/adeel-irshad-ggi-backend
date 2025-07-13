
This is a Node.js backend for an AI chat application with PostgreSQL, using TypeORM, Express, and Jest for testing. The database is seeded with initial data via scripts in `src/scripts`.

## Docker Compose Architecture

- **Database (`db`)**: Runs PostgreSQL (port 5434) to store chat, usage, and subscription data.
- **Application (`app`)**: Builds and runs the Node.js app (port 3000), initializes the database schema, seeds data, and starts the server.
- **Test (`test`)**: Runs unit and integration tests with schema initialization and seeding.

## Prerequisites

- Docker
- Docker Compose

## How to Run

### Clone the Repository

```bash
git clone https://github.com/adeelirshad512/adeel-irshad-ggi-backend
cd adeel-irshad-ggi-backend
````

This will:

* Start PostgreSQL
* Initialize schemas for `ai_chat_subscription` and `ai_chat_subscription_test`
* Seed the databases
* Run the app on [http://localhost:3000](http://localhost:3000) (basic mode) or execute tests (test mode)

## API Endpoints

### Ask a Question

```bash
curl -X POST http://localhost:3000/api/chat/ask \
  -H "Content-Type: application/json" \
  -d '{"userId": "some-uuid", "question": "What is AI?"}'
```

### Create Subscription

```bash
curl -X POST http://localhost:3000/api/subscriptions \
  -H "Content-Type: application/json" \
  -d '{"userId": "some-uuid", "type": "MONTHLY", "autoRenew": true}'
```

### Get Usage

```bash
curl -X GET http://localhost:3000/api/usage/some-uuid
```

### Renew Subscription

```bash
curl -X POST http://localhost:3000/api/subscriptions/renew \
  -H "Content-Type: application/json" \
  -d '{"userId": "some-uuid"}'
```

## Stopping the Application

### Stop All Containers

```bash
docker-compose down
```

### Remove Database Volumes

```bash
docker-compose down -v
```

## Troubleshooting

* Ensure ports `3000` (app) and `5434` (PostgreSQL) are not already in use.
* Check logs with:

```bash
docker-compose logs
```
