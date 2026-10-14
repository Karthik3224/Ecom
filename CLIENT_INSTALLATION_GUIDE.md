# Client Installation Guide

Use this after the client has cloned the backend/frontend repositories and received the database file.

## 1. Install Required Software

Install on the client laptop:

1. Git
2. Java JDK 21 or newer
3. Maven
4. Node.js 20 or newer
5. MySQL Server

Check:

```cmd
git --version
java -version
mvn -version
node -v
npm -v
```

## 2. Folder Structure

Use:

```text
C:\ecom-final
```

Folder should look like:

```text
C:\ecom-final
  ecom-backend
  ecom-frontend
  ecom-data.sql
  after-clone-setup.bat
  after-clone-setup.ps1
```

If not cloned yet:

```cmd
mkdir C:\ecom-final
cd /d C:\ecom-final
git clone https://github.com/ecom-fial/ecom-backend.git
git clone https://github.com/ecom-fial/ecom-frontend.git
```

Copy these files to `C:\ecom-final`:

```text
ecom-data.sql
after-clone-setup.bat
after-clone-setup.ps1
```

## 3. Run Setup Automation

Double-click:

```text
C:\ecom-final\after-clone-setup.bat
```

It will:

1. Find MySQL
2. Ask for MySQL password
3. Import `ecom-data.sql`
4. Create frontend `.env`
5. Add Google Maps API key
6. Run `npm install`

If MySQL is not found, it will ask for MySQL bin path.

Example:

```text
C:\Program Files\MySQL\MySQL Server 8.0\bin
```

## 4. Start Backend

Run:

```cmd
cd /d C:\ecom-final\ecom-backend
powershell -ExecutionPolicy Bypass -File .\run-all-services.ps1 restart -MysqlUsername root -MysqlPassword CLIENT_MYSQL_PASSWORD
```

Replace `CLIENT_MYSQL_PASSWORD` with the client MySQL password.

Example if password is `root`:

```cmd
powershell -ExecutionPolicy Bypass -File .\run-all-services.ps1 restart -MysqlUsername root -MysqlPassword root
```

## 5. Start Frontend

Open a new terminal:

```cmd
cd /d C:\ecom-final\ecom-frontend
npm run dev
```

Open:

```text
http://localhost:5173
```

## 6. Stop Application

Stop frontend:

```text
Press Ctrl+C in the frontend terminal.
```

Stop backend:

```cmd
cd /d C:\ecom-final\ecom-backend
powershell -ExecutionPolicy Bypass -File .\run-all-services.ps1 stop
```

## 7. Common Problems

### mysql.exe Not Found

Find MySQL path:

```cmd
dir "C:\Program Files\MySQL" /s /b | findstr mysql.exe
```

Use the `bin` folder path when setup asks.

### Data Not Showing

Check:

1. `C:\ecom-final\ecom-data.sql` exists
2. MySQL Server is running
3. MySQL password is correct
4. Setup completed without import errors

### Google Map Not Showing

Check:

```text
C:\ecom-final\ecom-frontend\.env
```

It must contain:

```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

Restart frontend after changing `.env`.

