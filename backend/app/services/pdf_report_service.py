from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.alert import Alert
from app.models.emission_calculation import EmissionCalculation
from app.models.machine_usage import MachineUsageRecord
from app.models.recommendation import Recommendation
from app.models.report_file import ReportFile
from app.models.user import User
from app.services.llm_service import generate_report_summary_with_llm


REPORT_TYPES_WITH_COMPLETED = {"monthly", "annual"}
REPORT_TYPE_LABELS = {"daily": "Harian", "weekly": "Mingguan", "monthly": "Bulanan", "annual": "Tahunan"}
SEVERITY_LABELS = {"critical": "Kritis", "high": "Tinggi", "warning": "Peringatan", "info": "Info"}
PRIORITY_LABELS = {"critical": "Kritis", "high": "Tinggi", "medium": "Sedang", "low": "Rendah"}


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

    start_month = period_start.strftime("%Y-%m")
    end_month = period_end.strftime("%Y-%m")
    records = (
        db.query(MachineUsageRecord)
        .filter(
            MachineUsageRecord.company_id == current_user.company_id,
            MachineUsageRecord.report_month >= start_month,
            MachineUsageRecord.report_month <= end_month,
        )
        .order_by(MachineUsageRecord.energy_kwh.desc())
        .all()
    )
    usage_ids = [record.id for record in records]
    calculations = db.query(EmissionCalculation).filter(EmissionCalculation.machine_usage_id.in_(usage_ids)).all() if usage_ids else []
    total_energy = sum(float(record.energy_kwh) for record in records)
    total_co2e = sum(float(calc.estimated_co2e_kg) for calc in calculations)
    alerts = db.query(Alert).filter(Alert.company_id == current_user.company_id, Alert.machine_usage_id.in_(usage_ids)).all() if usage_ids else []
    active_recommendations = db.query(Recommendation).filter(Recommendation.company_id == current_user.company_id, Recommendation.status == "active", Recommendation.machine_usage_id.in_(usage_ids)).all() if usage_ids else []
    completed_recommendations = []
    if include_completed and usage_ids:
        completed_recommendations = (
            db.query(Recommendation)
            .filter(Recommendation.company_id == current_user.company_id, Recommendation.status == "completed", Recommendation.machine_usage_id.in_(usage_ids))
            .all()
        )

    source_context_ids = sorted({context_id for calc in calculations for context_id in (calc.context_ids_json or [])})
    report_data = {
        "company_name": current_user.company.company_name if current_user.company else "Perusahaan",
        "report_type": normalized_type,
        "period_start": str(period_start),
        "period_end": str(period_end),
        "total_energy_kwh": total_energy,
        "estimated_co2e_kg": total_co2e,
        "records_count": len(records),
        "active_alerts_count": len(alerts),
        "active_recommendations_count": len(active_recommendations),
        "completed_recommendations_count": len(completed_recommendations),
        "source_context_ids": source_context_ids,
    }
    summary = generate_report_summary_with_llm(normalized_type, report_data) or fallback_summary(report_data)

    render_pdf(
        file_path=file_path,
        company_name=current_user.company.company_name if current_user.company else "Perusahaan",
        report_type=normalized_type,
        period_start=str(period_start),
        period_end=str(period_end),
        total_energy=total_energy,
        total_co2e=total_co2e,
        records=records[:10],
        alerts=alerts[:10],
        active_recommendations=active_recommendations[:10],
        completed_recommendations=completed_recommendations[:10],
        source_context_ids=source_context_ids[:12],
        summary=summary,
    )
    db.commit()
    db.refresh(report)
    return report


def fallback_summary(report_data: dict) -> dict:
    return {
        "executive_summary": (
            f"Selama periode {report_data['period_start']} sampai {report_data['period_end']}, "
            f"total konsumsi energi mencapai {report_data['total_energy_kwh']:,.2f} kWh "
            f"dengan estimasi emisi {report_data['estimated_co2e_kg']:,.2f} kg CO2e."
        ),
        "key_findings": [
            f"{report_data['records_count']} data pemakaian mesin disertakan.",
            f"{report_data['active_alerts_count']} peringatan aktif teridentifikasi.",
            f"{report_data['active_recommendations_count']} rekomendasi aktif tersedia.",
        ],
        "management_notes": ["Prioritaskan mesin dengan konsumsi energi tinggi dan selesaikan rekomendasi sebelum periode pelaporan berikutnya."],
    }


def render_pdf(
    file_path: Path,
    company_name: str,
    report_type: str,
    period_start: str,
    period_end: str,
    total_energy: float,
    total_co2e: float,
    records,
    alerts,
    active_recommendations,
    completed_recommendations,
    source_context_ids: list[str],
    summary: dict,
) -> None:
    doc = SimpleDocTemplate(str(file_path), pagesize=A4, rightMargin=14 * mm, leftMargin=14 * mm, topMargin=14 * mm, bottomMargin=14 * mm)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("CarbonTitle", parent=styles["Title"], textColor=colors.HexColor("#0f5132"), fontSize=20, leading=24)
    heading_style = ParagraphStyle("CarbonHeading", parent=styles["Heading2"], textColor=colors.HexColor("#166534"), fontSize=13, leading=16, spaceBefore=10)
    body_style = ParagraphStyle("CarbonBody", parent=styles["BodyText"], fontSize=9, leading=12)
    small_style = ParagraphStyle("CarbonSmall", parent=styles["BodyText"], fontSize=8, leading=10, textColor=colors.HexColor("#475569"))

    story = [
        Paragraph("Laporan Emisi CarbonCore AI", title_style),
        Paragraph(company_name, styles["Heading3"]),
        Paragraph(f"Jenis laporan: {REPORT_TYPE_LABELS.get(report_type, report_type)} | Periode: {period_start} sampai {period_end}", small_style),
        Spacer(1, 8),
        metric_table(total_energy, total_co2e, len(alerts), len(active_recommendations), len(completed_recommendations)),
        Spacer(1, 10),
        Paragraph("Ringkasan Eksekutif", heading_style),
        Paragraph(str(summary.get("executive_summary") or "Ringkasan belum tersedia."), body_style),
    ]

    key_findings = summary.get("key_findings") or []
    if key_findings:
        story.append(Paragraph("Temuan Utama", heading_style))
        for finding in key_findings[:5]:
            story.append(Paragraph(f"- {finding}", body_style))

    story.extend([Paragraph("Pemakaian Mesin Tertinggi", heading_style), machine_table(records)])
    story.extend([Paragraph("Peringatan Aktif", heading_style), alert_table(alerts)])
    story.extend([Paragraph("Rekomendasi Aktif", heading_style), recommendation_table(active_recommendations, include_status=False)])

    if report_type in REPORT_TYPES_WITH_COMPLETED:
        story.extend([Paragraph("Rekomendasi Selesai", heading_style), recommendation_table(completed_recommendations, include_status=True)])
    else:
        story.append(Paragraph("Rekomendasi selesai tidak disertakan dalam laporan harian dan mingguan.", small_style))

    story.append(Paragraph("Referensi Konteks Sumber", heading_style))
    story.append(Paragraph(", ".join(source_context_ids) if source_context_ids else "Tidak ada ID konteks ChromaDB yang terlampir pada periode laporan ini.", small_style))
    doc.build(story)


def metric_table(total_energy: float, total_co2e: float, alerts_count: int, active_recommendations_count: int, completed_recommendations_count: int) -> Table:
    table = Table(
        [
            ["Total Energi", "Estimasi CO2e", "Peringatan Aktif", "Rekom. Aktif", "Rekom. Selesai"],
            [f"{total_energy:,.2f} kWh", f"{total_co2e:,.2f} kg", str(alerts_count), str(active_recommendations_count), str(completed_recommendations_count)],
        ],
        colWidths=[35 * mm, 35 * mm, 28 * mm, 28 * mm, 32 * mm],
    )
    table.setStyle(base_table_style(header_bg="#dcfce7"))
    return table


def machine_table(records) -> Table:
    data = [["Mesin", "Lokasi", "Jumlah", "kW", "Jam", "kWh"]]
    for record in records:
        data.append([record.machine_name, record.machine_location, str(record.machine_quantity), str(record.machine_power_kw), str(record.usage_hours), str(record.energy_kwh)])
    if len(data) == 1:
        data.append(["Tidak ada data", "-", "-", "-", "-", "-"])
    table = Table(data, colWidths=[42 * mm, 30 * mm, 15 * mm, 24 * mm, 24 * mm, 28 * mm])
    table.setStyle(base_table_style())
    return table


def alert_table(alerts) -> Table:
    data = [["Risiko", "Jenis", "Pesan", "Aksi"]]
    for alert in alerts:
        data.append([SEVERITY_LABELS.get(alert.severity, alert.severity), alert.alert_type, alert.message, alert.recommended_action or "-"])
    if len(data) == 1:
        data.append(["-", "Tidak ada peringatan", "-", "-"])
    table = Table(data, colWidths=[22 * mm, 34 * mm, 62 * mm, 48 * mm])
    table.setStyle(base_table_style(header_bg="#fee2e2"))
    return table


def recommendation_table(recommendations, include_status: bool) -> Table:
    headers = ["Prioritas", "Judul", "Mesin", "Status"] if include_status else ["Prioritas", "Judul", "Mesin"]
    data = [headers]
    for recommendation in recommendations:
        row = [PRIORITY_LABELS.get(recommendation.priority, recommendation.priority), recommendation.recommendation_title, recommendation.related_machine_name or "-"]
        if include_status:
            row.append(recommendation.completion_note or "Selesai")
        data.append(row)
    if len(data) == 1:
        data.append(["-", "Tidak ada rekomendasi", "-"] + (["-"] if include_status else []))
    widths = [24 * mm, 78 * mm, 38 * mm, 28 * mm] if include_status else [24 * mm, 90 * mm, 48 * mm]
    table = Table(data, colWidths=widths)
    table.setStyle(base_table_style(header_bg="#e0f2fe"))
    return table


def base_table_style(header_bg: str = "#f1f5f9") -> TableStyle:
    return TableStyle(
        [
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor(header_bg)),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 7),
            ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#cbd5e1")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
            ("LEFTPADDING", (0, 0), (-1, -1), 4),
            ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]
    )
