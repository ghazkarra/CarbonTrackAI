import csv
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from pathlib import Path

from app.config import get_settings
from app.models.machine_usage import MachineUsageRecord
from app.models.recommendation import Recommendation


DEFAULT_TARIFF_CODE = "I-4/TT"
DEFAULT_TARIFF_FILE = "tarif_listrik_pln_industri_kwh.csv"
MONEY_PLACES = Decimal("0.01")
ENERGY_PLACES = Decimal("0.0001")
PRIORITY_SAVING_RATIOS = {
    "critical": Decimal("0.15"),
    "high": Decimal("0.15"),
    "medium": Decimal("0.08"),
    "low": Decimal("0.03"),
}


def quantize_decimal(value: Decimal, places: Decimal) -> Decimal:
    return value.quantize(places, rounding=ROUND_HALF_UP)


def dataset_dir() -> Path:
    return Path(__file__).resolve().parents[1] / "datasets"


def get_default_tariff_info() -> dict[str, Decimal | str]:
    tariff = read_tariff_per_kwh(DEFAULT_TARIFF_CODE)
    return {"tariff_code": DEFAULT_TARIFF_CODE, "tariff_per_kwh_idr": tariff}


def read_tariff_per_kwh(tariff_code: str = DEFAULT_TARIFF_CODE) -> Decimal:
    file_path = dataset_dir() / DEFAULT_TARIFF_FILE
    if not file_path.exists():
        return Decimal("996.74")

    with file_path.open(newline="", encoding="utf-8-sig") as csv_file:
        data_lines = [line for line in csv_file if line.strip() and not line.lstrip().startswith("#")]

    reader = csv.DictReader(data_lines)
    matching_rows = [row for row in reader if (row.get("Golongan_Tarif") or "").strip() == tariff_code]
    matching_rows.sort(key=lambda row: parse_decimal(row.get("Daya_Terpasang_kVA")) or Decimal("0"))

    for row in matching_rows:
        tariff = parse_decimal(row.get("Tarif_per_kWh_IDR"))
        if tariff is not None:
            return tariff

    return Decimal("996.74")


def parse_decimal(value: str | None) -> Decimal | None:
    if value is None:
        return None
    normalized = value.strip().replace(",", ".")
    if not normalized:
        return None
    try:
        return Decimal(normalized)
    except InvalidOperation:
        return None


def saving_ratio_for_priority(priority: str | None) -> Decimal:
    return PRIORITY_SAVING_RATIOS.get((priority or "").strip().lower(), Decimal("0.08"))


def estimate_savings_for_usage(usage: MachineUsageRecord | None, priority: str | None) -> dict[str, Decimal]:
    tariff = read_tariff_per_kwh()
    if usage is None:
        return {
            "estimated_saving_kwh": Decimal("0.0000"),
            "estimated_saving_idr": Decimal("0.00"),
            "estimated_co2_reduction_kg": Decimal("0.0000"),
        }

    ratio = saving_ratio_for_priority(priority)
    saving_kwh = quantize_decimal(Decimal(usage.energy_kwh) * ratio, ENERGY_PLACES)
    saving_idr = quantize_decimal(saving_kwh * tariff, MONEY_PLACES)
    factor = Decimal(str(getattr(usage.calculation, "emission_factor_value", None) or get_settings().default_electricity_ef_kgco2e_per_kwh))
    co2_reduction = quantize_decimal(saving_kwh * factor, ENERGY_PLACES)
    return {
        "estimated_saving_kwh": saving_kwh,
        "estimated_saving_idr": saving_idr,
        "estimated_co2_reduction_kg": co2_reduction,
    }


def apply_savings_estimate(recommendation: Recommendation, usage: MachineUsageRecord | None) -> None:
    estimates = estimate_savings_for_usage(usage, recommendation.priority)
    recommendation.estimated_saving_kwh = estimates["estimated_saving_kwh"]
    recommendation.estimated_saving_idr = estimates["estimated_saving_idr"]
    recommendation.estimated_co2_reduction_kg = estimates["estimated_co2_reduction_kg"]


def build_savings_summary(recommendations: list[Recommendation]) -> dict[str, Decimal | str]:
    tariff_info = get_default_tariff_info()
    return {
        "total_potential_saving_idr": quantize_decimal(sum((Decimal(item.estimated_saving_idr or 0) for item in recommendations), Decimal("0")), MONEY_PLACES),
        "total_saving_kwh": quantize_decimal(sum((Decimal(item.estimated_saving_kwh or 0) for item in recommendations), Decimal("0")), ENERGY_PLACES),
        "total_co2_reduction_kg": quantize_decimal(sum((Decimal(item.estimated_co2_reduction_kg or 0) for item in recommendations), Decimal("0")), ENERGY_PLACES),
        "tariff_code": str(tariff_info["tariff_code"]),
        "tariff_per_kwh_idr": Decimal(tariff_info["tariff_per_kwh_idr"]),
    }
