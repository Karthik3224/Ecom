# Ecom Client Setup

This guide starts the backend and frontend after cloning the separate repositories.

## 1. Required Software

Install on Windows:

- Git
- Java 21
- Maven 3.9 or newer
- Node.js 20 or newer
- MySQL 8
- Apache Kafka 3.6.2, Scala 2.13, KRaft mode

Use these required local ports:

- MySQL: `3306`
- Kafka: `9092`
- Frontend: `5173`

## 2. Clone Repositories

```powershell
git clone https://github.com/ecom-fial/ecom-backend.git C:\ecom-client-package\ecom-backend
git clone https://github.com/ecom-fial/ecom-frontend.git C:\ecom-client-package\ecom-frontend
```

## 3. Start MySQL

Install MySQL Server 8+ separately and start it on port `3306`. The database is persistent and is not bundled with this application.

Confirm that it listens on port `3306`:

```powershell
netstat -ano | findstr ":3306"
```

The client installation uses MySQL port `3306`.

MySQL is not bundled because it contains persistent database data and requires separate Windows installation/configuration. It must be running on `localhost:3306` before application services start.

## 4. Start Kafka

Kafka 3.6.2 Scala 2.13 is included under `ecom-backend\tools\kafka` as a fallback. The launcher first uses an existing `C:\kafka` installation when available. On a fresh client machine, the bundled Kafka creates `ecom-backend\tools\kafka\data` and initializes its own KRaft cluster once. Later launches reuse that data and never format or delete it.

If using an existing installation, install Kafka at `C:\kafka` and use KRaft mode. Start it once:

```powershell
C:\kafka\bin\windows\kafka-server-start.bat C:\kafka\config\kraft\server.properties
```

Keep the Kafka window open. Do not start Kafka a second time.

Verify the topics:

```powershell
C:\kafka\bin\windows\kafka-topics.bat --bootstrap-server localhost:9092 --list
```

Required topics:

- `order.events`
- `payment.events`
- `fulfillment.events`

## 5. Configure Runtime Environment

The launcher prompts for these values automatically. Password prompts are hidden and values are kept only in the running PowerShell process. Do not put real values in Git files.

The prompts configure `MYSQL_PASSWORD`, `SMTP_USERNAME`, `SMTP_PASSWORD`, and the required SMTP settings automatically. If `JWT_SECRET` is not already configured, the launcher generates a strong installation-specific secret once under `.local\secrets\jwt.secret` and reuses it on later startups. This runtime file must never be committed.

Never commit SMTP passwords, database passwords, JWT secrets, or Google Maps API keys.

## 6. Start Everything

After MySQL, Kafka, and the environment variables are configured, double-click:

```text
C:\ecom-client-package\start-ecommerce.bat
```

This starts Kafka when needed, all backend services, and the frontend. Allow up to two minutes for Spring Boot services to initialize.

The launcher uses MySQL `3306` and Kafka `localhost:9092`. It prefers installed Java/Maven/Node/Kafka and falls back to matching tools under `ecom-backend\tools`. Do not edit it for passwords or API keys.

The backend launcher can also be run directly:

```text
C:\ecom-client-package\ecom-backend\RUN-APPLICATION.bat
```

## 7. Service Ports

| Service | Port |
|---|---:|
| MySQL | 3306 |
| Kafka | 9092 |
| Eureka | 8761 |
| Config Server | 8888 |
| Catalog | 8089 |
| Customer Profile | 8088 |
| Cart | 8091 |
| Inventory | 8095 |
| Alerts | 8087 |
| Org Access | 3310 |
| Order | 3311 |
| Payment | 3314 |
| Fulfillment | 3315 |
| Notification | 3317 |
| API Gateway | 8082 |
| Frontend | 5173 |

The launcher starts all listed backend services in dependency order.

Open the frontend after startup:

```text
http://127.0.0.1:5173
```

## 8. Verify Health

```powershell
curl.exe http://127.0.0.1:8761/actuator/health
curl.exe http://127.0.0.1:8888/actuator/health
curl.exe http://127.0.0.1:8089/actuator/health
curl.exe http://127.0.0.1:3310/actuator/health
curl.exe http://127.0.0.1:3311/actuator/health
curl.exe http://127.0.0.1:3317/actuator/health
curl.exe http://127.0.0.1:8082/actuator/health
```

Org Access must show both database and mail as `UP`. Notification must return `status: UP` before testing order email notifications.

## 9. Expected Order Email Flow

```text
Frontend order
  -> Order Service
  -> ORDER_CREATED on order.events
  -> Notification Service
  -> Store Manager and Location Admin lookup
  -> Gmail SMTP email
```

## 10. Common Problems

### Kafka port already in use

Only one Kafka broker may run:

```cmd
netstat -ano | findstr ":9092"
```

Stop the stale Kafka process, then start Kafka once.

### Org Access uses port 3310

Restart Config Server first, then restart Org Access. The project requires Org Access on port `3310`.

### SMTP reports no password

The service was started from a PowerShell session without `SMTP_PASSWORD`. Set it in the current session and restart Config Server, Org Access, and Notification Service.

### Stop the application

```powershell
cd C:\ecom-final\ecom-backend
powershell -ExecutionPolicy Bypass -File .\run-all-services.ps1 stop
```
