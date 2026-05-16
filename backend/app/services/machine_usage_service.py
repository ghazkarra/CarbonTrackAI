import csv
from decimal import Decimal, InvalidOperation
from io import StringIO

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.models.machine_usage import MachineUsageBatch, MachineUsageRecord
from app.models.import_log import ImportLog
from app.models.user import User
from app.schemas.machine_usage_schema import ImportCsvResponse, ImportRowResult, MachineUsageCreate
from app.services.alert_service import generate_alerts_for_usage
from app.services.calculation_service import (
    attach_retrieved_context,
    build_formula_warning,
    calculate_energy_kwh,
    calculate_machine_power_kw,
    create_emission_calculation,
)
from app.services.rag_retrieval_service import retrieve_machine_context


EXPECTED_CSV_HEADER = [
    "report_month",
    "row_no",
    "machine_name",
    "machine_location",
    "machine_quantity",
    "machine_power_watt",
    "machine_power_kw",
    "usage_hours",
    "energy_kwh",
]


def create_machine_usage(db: Session, payload: MachineUsageCreate, current_user: User) -> MachineUsageRecord:
    calculated_kw = calculate_machine_power_kw(payload.machine_power_watt)
    machine_power_kw = payload.machine_power_kw if payload.machine_power_kw is not None else calculated_kw
    calculated_kwh = calculate_energy_kwh(payload.machine_quantity, machine_power_kw, payload.usage_hours)
    energy_kwh = payload.energy_kwh if payload.energy_kwh is not None else calculated_kwh

    warnings = [
        build_formula_warning("machine_power_kw", payload.machine_power_kw, calculated_kw),
        build_formula_warning("energy_kwh", payload.energy_kwh, calculated_kwh),
    ]
    warning_text = "; ".join([warning for warning in warnings if warning]) or None
    record = MachineUsageRecord(
        company_id=current_user.company_id,
        report_month=payload.report_month,
        row_no=payload.row_no,
        machine_name=payload.machine_name,
        machine_location=payload.machine_location,
        machine_quantity=payload.machine_quantity,
        machine_power_watt=payload.machine_power_watt,
        machine_power_kw=machine_power_kw,
        usage_hours=payload.usage_hours,
        energy_kwh=energy_kwh,
        data_source="form",
        validation_status="warning" if warning_text else "valid",
        validation_message=warning_text,
    )
    db.add(record)
    db.flush()
    calculation = create_emission_calculation(db, record)
    try:
        attach_retrieved_context(calculation, retrieve_machine_context(record))
    except Exception:
        calculation.confidence_label = "medium"
    generate_alerts_for_usage(db, record)
    db.commit()
    db.refresh(record)
    return record


def parse_decimal(value: str | None, field_name: str, required: bool = True) -> Decimal | None:
    if value is None or value == "":
        if required:
            raise ValueError(f"{field_name} is required")
        return None
    try:
        decimal_value = Decimal(value)
    except InvalidOperation as exc:
        raise ValueError(f"{field_name} must be numeric") from exc
    if decimal_value < 0:
        raise ValueError(f"{field_name} must be non-negative")
    return decimal_value


async def import_machine_usage_csv(db: Session, file: UploadFile, current_user: User) -> ImportCsvResponse:
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only CSV files are allowed")

    content = (await file.read()).decode("utf-8-sig")
    reader = csv.DictReader(StringIO(content))
    if reader.fieldnames != EXPECTED_CSV_HEADER:
        db.add(
            ImportLog(
                company_id=current_user.company_id,
                file_name=file.filename,
                status="error",
                message="Invalid CSV header",
                summary_json={"expected": EXPECTED_CSV_HEADER, "received": reader.fieldnames},
                created_by=current_user.id,
            )
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "Invalid CSV header", "expected": EXPECTED_CSV_HEADER, "received": reader.fieldnames},
        )

    rows = list(reader)
    report_month = rows[0].get("report_month") if rows else ""
    batch = MachineUsageBatch(
        company_id=current_user.company_id,
        source="csv_upload",
        report_month=report_month or "unknown",
        file_name=file.filename,
        total_rows=len(rows),
        created_by=current_user.id,
    )
    db.add(batch)
    db.flush()

    results: list[ImportRowResult] = []
    valid_rows = warning_rows = error_rows = 0
    for raw in rows:
        row_no = int(raw["row_no"]) if raw.get("row_no") else None
        machine_name = (raw.get("machine_name") or "").strip()
        try:
            payload = MachineUsageCreate(
                report_month=raw.get("report_month") or "",
                row_no=row_no,
                machine_name=machine_name,
                machine_location=raw.get("machine_location") or "",
                machine_quantity=int(raw.get("machine_quantity") or "0"),
                machine_power_watt=parse_decimal(raw.get("machine_power_watt"), "machine_power_watt"),
                machine_power_kw=parse_decimal(raw.get("machine_power_kw"), "machine_power_kw", required=False),
                usage_hours=parse_decimal(raw.get("usage_hours"), "usage_hours"),
                energy_kwh=parse_decimal(raw.get("energy_kwh"), "energy_kwh", required=False),
            )
            calculated_kw = calculate_machine_power_kw(payload.machine_power_watt)
            machine_power_kw = payload.machine_power_kw if payload.machine_power_kw is not None else calculated_kw
            calculated_kwh = calculate_energy_kwh(payload.machine_quantity, machine_power_kw, payload.usage_hours)
            energy_kwh = payload.energy_kwh if payload.energy_kwh is not None else calculated_kwh
            warnings = [
                build_formula_warning("machine_power_kw", payload.machine_power_kw, calculated_kw),
                build_formula_warning("energy_kwh", payload.energy_kwh, calculated_kwh),
            ]
            warning_text = "; ".join([warning for warning in warnings if warning]) or None
            record = MachineUsageRecord(
                batch_id=batch.id,
                company_id=current_user.company_id,
                report_month=payload.report_month,
                row_no=payload.row_no,
                machine_name=payload.machine_name,
                machine_location=payload.machine_location,
                machine_quantity=payload.machine_quantity,
                machine_power_watt=payload.machine_power_watt,
                machine_power_kw=machine_power_kw,
                usage_hours=payload.usage_hours,
                energy_kwh=energy_kwh,
                data_source="csv_upload",
                validation_status="warning" if warning_text else "valid",
                validation_message=warning_text,
            )
            db.add(record)
            db.flush()
            calculation = create_emission_calculation(db, record)
            try:
                attach_retrieved_context(calculation, retrieve_machine_context(record))
            except Exception:
                calculation.confidence_label = "medium"
            generate_alerts_for_usage(db, record)
            if warning_text:
                warning_rows += 1
                status_text = "warning"
            else:
                valid_rows += 1
                status_text = "valid"
            results.append(ImportRowResult(row_no=row_no, machine_name=machine_name, status=status_text, validation_message=warning_text, energy_kwh=energy_kwh))
        except (ValueError, TypeError) as exc:
            error_rows += 1
            results.append(ImportRowResult(row_no=row_no, machine_name=machine_name or None, status="error", validation_message=str(exc), energy_kwh=None))

    batch.valid_rows = valid_rows
    batch.warning_rows = warning_rows
    batch.error_rows = error_rows
    db.add(
        ImportLog(
            batch_id=batch.id,
            company_id=current_user.company_id,
            file_name=file.filename,
            status="completed_with_errors" if error_rows else "completed",
            message="CSV import processed",
            summary_json={
                "total_rows": len(rows),
                "valid_rows": valid_rows,
                "warning_rows": warning_rows,
                "error_rows": error_rows,
            },
            created_by=current_user.id,
        )
    )
    db.commit()
    return ImportCsvResponse(batch_id=batch.id, total_rows=len(rows), valid_rows=valid_rows, warning_rows=warning_rows, error_rows=error_rows, rows=results)
