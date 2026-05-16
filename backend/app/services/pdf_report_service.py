from pathlib import Path

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.alert import Alert
from app.models.emission_calculation import EmissionCalculation
from app.models.machine_usage import MachineUsageRecord
from app.models.recommendation import Recommendation
from app.models.report_file import ReportFile
from app.models.user import User


REPORT_TYPES_WITH_COMPLETED = {"monthly", "annual"}


def generate_pdf_report(db: Session, current_user: User, report_type: str, period_start, period_end) -> ReportFile:
    normalized_type = report_type.lower()
    include_completed = normalized_type in REPORT_TYPES_WITH_COMPLETED
    output_dir = Path(get_settings().pdf_output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    file_name = f"carboncore_{current_user.company_id}_{normalized_type}_{period_start}_{period_end}.pdf"
    file_path = output_dir / file_name

    report = ReportFile(
        company_id=current_user.company_id,
        report_type=normalized_type,
        period_start=period_start,
        period_end=period_end,
        file_path=str(file_path),
        generated_by=current_user.id,
        include_completed_recommendations=include_completed,
        status="generated",
    )
    db.add(report)
    db.flush()

    records = db.query(MachineUsageRecord).filter(MachineUsageRecord.company_id == current_user.company_id).all()
    usage_ids = [record.id for record in records]
    total_energy = sum(float(record.energy_kwh) for record in records)
    total_co2e = sum(
        float(calc.estimated_co2e_kg)
        for calc in db.query(EmissionCalculation).filter(EmissionCalculation.machine_usage_id.in_(usage_ids)).all()
    ) if usage_ids else 0
    alerts = db.query(Alert).filter(Alert.company_id == current_user.company_id).all()
    active_recommendations = db.query(Recommendation).filter(Recommendation.company_id == current_user.company_id, Recommendation.status == "active").all()
    completed_recommendations = []
    if include_completed:
        completed_recommendations = db.query(Recommendation).filter(Recommendation.company_id == current_user.company_id, Recommendation.status == "completed").all()

    render_pdf(file_path, current_user.company.company_name if current_user.company else "Company", normalized_type, str(period_start), str(period_end), total_energy, total_co2e, records[:10], alerts[:10], active_recommendations[:10], completed_recommendations[:10])
    db.commit()
    db.refresh(report)
    return report


def render_pdf(file_path: Path, company_name: str, report_type: str, period_start: str, period_end: str, total_energy: float, total_co2e: float, records, alerts, active_recommendations, completed_recommendations) -> None:
    pdf = canvas.Canvas(str(file_path), pagesize=A4)
    width, height = A4
    y = height - 60

    def line(text: str, size: int = 10, gap: int = 16):
        nonlocal y
        if y < 80:
            pdf.showPage()
            y = height - 60
        pdf.setFont("Helvetica", size)
        pdf.drawString(50, y, text[:110])
        y -= gap

    line("CarbonCore AI Emission Report", 16, 24)
    line(f"Company: {company_name}", 11)
    line(f"Report Type: {report_type.title()}", 11)
    line(f"Period: {period_start} to {period_end}", 11, 24)
    line(f"Total Energy: {total_energy:,.2f} kWh", 12)
    line(f"Estimated CO2e: {total_co2e:,.2f} kg", 12, 24)

    line("Top Machine Usage", 13, 20)
    for record in records:
        line(f"- {record.machine_name} ({record.machine_location}): {record.energy_kwh} kWh")

    line("Active Alerts", 13, 20)
    for alert in alerts:
        line(f"- [{alert.severity}] {alert.alert_type}: {alert.message}")

    line("Active Recommendations", 13, 20)
    for recommendation in active_recommendations:
        line(f"- [{recommendation.priority}] {recommendation.recommendation_title}")

    if report_type in REPORT_TYPES_WITH_COMPLETED:
        line("Completed Recommendations", 13, 20)
        for recommendation in completed_recommendations:
            line(f"- {recommendation.recommendation_title}: {recommendation.completion_note or 'Completed'}")

    pdf.save()
