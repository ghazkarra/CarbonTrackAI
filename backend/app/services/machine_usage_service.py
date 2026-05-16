import csv
from decimal import Decimal, InvalidOperation
from io import StringIO

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.models.alert import Alert
from app.models.emission_calculation import EmissionCalculation
from app.models.machine_usage import MachineUsageBatch, MachineUsageRecord
from app.models.import_log import ImportLog
from app.models.recommendation import Recommendation
from app.models.user import User
from app.schemas.machine_usage_schema import ImportCsvResponse, ImportRowResult, MachineUsageCreate, MachineUsageUpdate
from app.services.calculation_service import (
    attach_retrieved_context,
    build_formula_warning,
    calculate_energy_kwh,
    calculate_machine_power_kw,
    create_emission_calculation,
)
from app.services.rag_retrieval_service import retrieve_machine_context
from app.services.recommendation_service import delete_usage_alerts_and_recommendations, regenerate_usage_alerts_and_recommendations
from app.services.savings_service import build_savings_summary


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

FIELD_LABELS = {
    "machine_power_watt": "Daya watt",
    "machine_power_kw": "Daya kW",
    "usage_hours": "Jam pemakaian",
    "energy_kwh": "Energi kWh",
}


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
    regenerate_usage_alerts_and_recommendations(db, record, delete_existing=True)
    db.commit()
    db.refresh(record)
    return record


def update_machine_usage(db: Session, usage_id: int, payload: MachineUsageUpdate, current_user: User) -> MachineUsageRecord | None:
    record = db.get(MachineUsageRecord, usage_id)
    if record is None or record.company_id != current_user.company_id:
        return None

    values = payload.model_dump(exclude_unset=True)
    report_month = values.get("report_month", record.report_month)
    row_no = values.get("row_no", record.row_no)
    machine_name = values.get("machine_name", record.machine_name)
    machine_location = values.get("machine_location", record.machine_location)
    machine_quantity = values.get("machine_quantity", record.machine_quantity)
    machine_power_watt = values.get("machine_power_watt", record.machine_power_watt)
    usage_hours = values.get("usage_hours", record.usage_hours)

    calculated_kw = calculate_machine_power_kw(machine_power_watt)
    machine_power_kw = values.get("machine_power_kw", calculated_kw)
    calculated_kwh = calculate_energy_kwh(machine_quantity, machine_power_kw, usage_hours)
    energy_kwh = values.get("energy_kwh", calculated_kwh)
    warnings = [
        build_formula_warning("machine_power_kw", values.get("machine_power_kw"), calculated_kw),
        build_formula_warning("energy_kwh", values.get("energy_kwh"), calculated_kwh),
    ]
    warning_text = "; ".join([warning for warning in warnings if warning]) or None

    record.report_month = report_month
    record.row_no = row_no
    record.machine_name = machine_name
    record.machine_location = machine_location
    record.machine_quantity = machine_quantity
    record.machine_power_watt = machine_power_watt
    record.machine_power_kw = machine_power_kw
    record.usage_hours = usage_hours
    record.energy_kwh = energy_kwh
    record.validation_status = "warning" if warning_text else "valid"
    record.validation_message = warning_text
    db.flush()

    calculation = create_emission_calculation(db, record)
    try:
        attach_retrieved_context(calculation, retrieve_machine_context(record))
    except Exception:
        calculation.confidence_label = "medium"
    regenerate_usage_alerts_and_recommendations(db, record, delete_existing=True)
    db.commit()
    db.refresh(record)
    return record


def delete_machine_usage(db: Session, usage_id: int, current_user: User) -> dict | None:
    record = db.get(MachineUsageRecord, usage_id)
    if record is None or record.company_id != current_user.company_id:
        return None
    response = machine_usage_record_to_dict(record)
    delete_usage_alerts_and_recommendations(db, record.id)
    db.query(EmissionCalculation).filter(EmissionCalculation.machine_usage_id == record.id).delete(synchronize_session=False)
    db.delete(record)
    db.commit()
    return response


def get_machine_usage_detail(db: Session, usage_id: int, current_user: User) -> dict | None:
    record = db.get(MachineUsageRecord, usage_id)
    if record is None or record.company_id != current_user.company_id:
        return None
    return build_machine_usage_detail(db, record)


def build_machine_usage_detail(db: Session, record: MachineUsageRecord) -> dict:
    recommendations = (
        db.query(Recommendation)
        .filter(Recommendation.company_id == record.company_id, Recommendation.machine_usage_id == record.id)
        .order_by(Recommendation.is_completed.asc(), Recommendation.created_at.desc())
        .all()
    )
    alerts = (
        db.query(Alert)
        .filter(Alert.company_id == record.company_id, Alert.machine_usage_id == record.id)
        .order_by(Alert.created_at.desc())
        .all()
    )
    summary = build_savings_summary(recommendations)
    estimated_co2e_kg = record.calculation.estimated_co2e_kg if record.calculation else 0
    estimated_co2e_ton = record.calculation.estimated_co2e_ton if record.calculation else 0
    return {
        **machine_usage_record_to_dict(record),
        "calculation": record.calculation,
        "statistics": {
            "total_energy_kwh": record.energy_kwh,
            "estimated_co2e_kg": estimated_co2e_kg,
            "estimated_co2e_ton": estimated_co2e_ton,
            **summary,
        },
        "alerts": alerts,
        "recommendations": recommendations,
    }


def machine_usage_record_to_dict(record: MachineUsageRecord) -> dict:
    return {
        "id": record.id,
        "batch_id": record.batch_id,
        "company_id": record.company_id,
        "report_month": record.report_month,
        "row_no": record.row_no,
        "machine_name": record.machine_name,
        "machine_location": record.machine_location,
        "machine_quantity": record.machine_quantity,
        "machine_power_watt": record.machine_power_watt,
        "machine_power_kw": record.machine_power_kw,
        "usage_hours": record.usage_hours,
        "energy_kwh": record.energy_kwh,
        "data_source": record.data_source,
        "validation_status": record.validation_status,
        "validation_message": record.validation_message,
        "created_at": record.created_at,
    }


def parse_decimal(value: str | None, field_name: str, required: bool = True) -> Decimal | None:
    field_label = FIELD_LABELS.get(field_name, field_name)
    if value is None or value == "":
        if required:
            raise ValueError(f"{field_label} wajib diisi")
        return None
    try:
        decimal_value = Decimal(value)
    except InvalidOperation as exc:
        raise ValueError(f"{field_label} harus berupa angka") from exc
    if decimal_value < 0:
        raise ValueError(f"{field_label} tidak boleh negatif")
    return decimal_value


async def import_machine_usage_csv(db: Session, file: UploadFile, current_user: User) -> ImportCsvResponse:
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Hanya file CSV yang diizinkan")

    content = (await file.read()).decode("utf-8-sig")
    reader = csv.DictReader(StringIO(content))
    if reader.fieldnames != EXPECTED_CSV_HEADER:
        db.add(
            ImportLog(
                company_id=current_user.company_id,
                file_name=file.filename,
                status="error",
                message="Header CSV tidak valid",
                summary_json={"expected": EXPECTED_CSV_HEADER, "received": reader.fieldnames},
                created_by=current_user.id,
            )
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "Header CSV tidak valid", "expected": EXPECTED_CSV_HEADER, "received": reader.fieldnames},
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
            regenerate_usage_alerts_and_recommendations(db, record, delete_existing=True)
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
            message="Impor CSV selesai diproses",
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
