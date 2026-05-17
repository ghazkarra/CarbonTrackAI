import csv
from pathlib import Path

from app.chroma_client import get_chroma_collection, query_collection


DATASET_MAP = {
    "1_emission_standards_epa.csv": "emission_standard",
    "2_realworld_emission_factors.csv": "realworld_emission_factor",
    "3_underground_worker_exposure.csv": "worker_exposure",
    "4_mining_fleet_emission_profiles.csv": "mining_fleet_profile",
    "5_data_sources.csv": "data_source",
}


def ingest_all_datasets() -> dict[str, int]:
    dataset_dir = Path(__file__).resolve().parents[1] / "datasets"
    collection = get_chroma_collection()
    counts: dict[str, int] = {}

    for file_name, record_type in DATASET_MAP.items():
        file_path = dataset_dir / file_name
        if not file_path.exists():
            counts[file_name] = 0
            continue
        ids: list[str] = []
        documents: list[str] = []
        metadatas: list[dict] = []
        with file_path.open(newline="", encoding="utf-8") as csv_file:
            reader = csv.DictReader(csv_file)
            for index, row in enumerate(reader, start=1):
                row_id = row.get("row_id") or f"{record_type}-{index}"
                document = row_to_document(row, record_type)
                ids.append(row_id)
                documents.append(document)
                metadatas.append(row_to_metadata(row, file_name, record_type, row_id))
        if ids:
            collection.upsert(ids=ids, documents=documents, metadatas=metadatas)
        counts[file_name] = len(ids)
    return counts


def row_to_document(row: dict[str, str], record_type: str) -> str:
    values = ". ".join(f"{key}: {value}" for key, value in row.items() if value)
    return f"Record type: {record_type}. {values}"


def row_to_metadata(row: dict[str, str], source_file: str, record_type: str, row_id: str) -> dict:
    return {
        "source_file": source_file,
        "record_type": record_type,
        "row_id": row_id,
        "title": row.get("title", ""),
        "equipment_or_vehicle_type": row.get("equipment_or_vehicle_type", ""),
        "fuel_type": row.get("fuel_type", ""),
        "power_class_kw": row.get("power_class_kw", ""),
        "pollutant": row.get("pollutant", ""),
        "source_url": row.get("source_url", ""),
    }


def chroma_health() -> dict:
    collection = get_chroma_collection()
    return {"collection": collection.name, "count": collection.count()}
