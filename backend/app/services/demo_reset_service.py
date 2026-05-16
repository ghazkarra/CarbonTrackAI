from sqlalchemy.orm import Session

from app.models.alert import Alert
from app.models.emission_calculation import EmissionCalculation
from app.models.import_log import ImportLog
from app.models.machine_usage import MachineUsageBatch, MachineUsageRecord
from app.models.recommendation import Recommendation
from app.models.report_file import ReportFile
from app.services.seed_service import seed_database


def reset_demo_data(db: Session) -> dict[str, int]:
    deleted: dict[str, int] = {}
    for model, name in [
        (ReportFile, "report_files"),
        (Alert, "alerts"),
        (Recommendation, "recommendations"),
        (EmissionCalculation, "emission_calculations"),
        (ImportLog, "import_logs"),
        (MachineUsageRecord, "machine_usage_records"),
        (MachineUsageBatch, "machine_usage_batches"),
    ]:
        deleted[name] = db.query(model).delete(synchronize_session=False)
    db.commit()
    seed_database(db)
    return deleted
