# CarbonCore AI Demo Runbook

## Start Backend

```powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

Swagger:

```txt
http://127.0.0.1:8000/docs
```

## Start Frontend

```powershell
cd frontend
npm run dev
```

App:

```txt
http://localhost:5173
```

## Demo Accounts

Operator:

```txt
operator@carboncore.ai
password
```

Superadmin:

```txt
admin@carboncore.ai
password
```

## Demo Flow

1. Login as superadmin.
2. Open `/dashboard/superadmin`.
3. Click `Ingest datasets`.
4. Logout.
5. Login as operator.
6. Open `/dashboard/machine-usage`.
7. Download sample CSV.
8. Upload sample CSV.
9. Open `/dashboard` and verify metrics/top machines.
10. Open `/dashboard/recommendations` and click `Generate`.
11. Mark one recommendation as completed.
12. Open `/dashboard/alerts` and acknowledge one alert.
13. Open `/dashboard/reports`.
14. Generate a monthly PDF for `2025-02-01` to `2025-02-28`.
15. Preview/download the PDF.

## Reset Demo Data

Use Swagger as superadmin:

```txt
POST /api/dev/reset-demo-data
```

This endpoint only works when `APP_ENV=development`.
