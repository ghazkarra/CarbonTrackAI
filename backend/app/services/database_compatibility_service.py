from sqlalchemy import inspect
from sqlalchemy.engine import Engine


RECOMMENDATION_COLUMNS = {
    "alert_id": "INTEGER",
    "estimated_saving_kwh": "NUMERIC(15, 4) DEFAULT 0",
    "estimated_saving_idr": "NUMERIC(15, 2) DEFAULT 0",
    "estimated_co2_reduction_kg": "NUMERIC(15, 4) DEFAULT 0",
}


def ensure_database_compatibility(engine: Engine) -> None:
    inspector = inspect(engine)
    if "recommendations" not in inspector.get_table_names():
        return

    existing_columns = {column["name"] for column in inspector.get_columns("recommendations")}
    missing_columns = [(name, ddl) for name, ddl in RECOMMENDATION_COLUMNS.items() if name not in existing_columns]
    if not missing_columns:
        return

    with engine.begin() as connection:
        for column_name, column_type in missing_columns:
            connection.exec_driver_sql(f"ALTER TABLE recommendations ADD COLUMN {column_name} {column_type}")
