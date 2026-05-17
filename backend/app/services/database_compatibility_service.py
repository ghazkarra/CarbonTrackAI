from sqlalchemy import inspect
from sqlalchemy.engine import Engine


RECOMMENDATION_COLUMNS = {
    "alert_id": "INTEGER",
    "estimated_saving_kwh": "NUMERIC(15, 4) DEFAULT 0",
    "estimated_saving_idr": "NUMERIC(15, 2) DEFAULT 0",
    "estimated_co2_reduction_kg": "NUMERIC(15, 4) DEFAULT 0",
}

REPORT_FILE_COLUMNS = {
    "preview_data_json": "JSON",
}


def ensure_database_compatibility(engine: Engine) -> None:
    inspector = inspect(engine)
    table_names = set(inspector.get_table_names())
    missing_by_table: dict[str, list[tuple[str, str]]] = {}

    if "recommendations" in table_names:
        existing_columns = {column["name"] for column in inspector.get_columns("recommendations")}
        missing_by_table["recommendations"] = [(name, ddl) for name, ddl in RECOMMENDATION_COLUMNS.items() if name not in existing_columns]

    if "report_files" in table_names:
        existing_columns = {column["name"] for column in inspector.get_columns("report_files")}
        missing_by_table["report_files"] = [(name, ddl) for name, ddl in REPORT_FILE_COLUMNS.items() if name not in existing_columns]

    with engine.begin() as connection:
        for table_name, missing_columns in missing_by_table.items():
            for column_name, column_type in missing_columns:
                connection.exec_driver_sql(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}")
