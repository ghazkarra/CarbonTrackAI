from app.chroma_client import query_collection
from app.models.machine_usage import MachineUsageRecord


RECORD_TYPES = [
    "emission_standard",
    "realworld_emission_factor",
    "mining_fleet_profile",
    "worker_exposure",
    "data_source",
]


def retrieve_machine_context(usage: MachineUsageRecord) -> dict[str, list[dict]]:
    query_text = f"{usage.machine_name} {usage.machine_location} {usage.machine_power_kw} kW {usage.energy_kwh} kWh"
    context: dict[str, list[dict]] = {}
    for record_type in RECORD_TYPES:
        result = query_collection(query_text, record_type, n_results=3)
        docs = result.get("documents", [[]])[0]
        metadatas = result.get("metadatas", [[]])[0]
        distances = result.get("distances", [[]])[0]
        context[record_type] = [
            {"document": doc, "metadata": metadata, "distance": distance}
            for doc, metadata, distance in zip(docs, metadatas, distances)
        ]
    return context
