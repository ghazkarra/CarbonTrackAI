from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.emission_calculation import EmissionCalculation
from app.models.machine_usage import MachineUsageRecord


DECIMAL_PLACES = Decimal("0.0001")


def quantize(value: Decimal, places: Decimal = DECIMAL_PLACES) -> Decimal:
    return value.quantize(places, rounding=ROUND_HALF_UP)


def calculate_machine_power_kw(machine_power_watt: Decimal) -> Decimal:
    return quantize(machine_power_watt / Decimal("1000"))


def calculate_energy_kwh(machine_quantity: int, machine_power_kw: Decimal, usage_hours: Decimal) -> Decimal:
    return quantize(Decimal(machine_quantity) * machine_power_kw * usage_hours)


def build_formula_warning(field_name: str, provided: Decimal | None, calculated: Decimal) -> str | None:
    if provided is None:
        return None
    if calculated == 0:
        return None if provided == 0 else f"{field_name} differs from calculated value 0"
    diff_ratio = abs(provided - calculated) / calculated
    if diff_ratio > Decimal("0.02"):
        return f"{field_name} differs from calculated value {calculated} by more than 2%"
    return None


def create_emission_calculation(db: Session, usage: MachineUsageRecord) -> EmissionCalculation:
    settings = get_settings()
    factor = Decimal(str(settings.default_electricity_ef_kgco2e_per_kwh))
    estimated_kg = quantize(Decimal(usage.energy_kwh) * factor)
    estimated_ton = quantize(estimated_kg / Decimal("1000"), Decimal("0.000001"))
    calculation = EmissionCalculation(
        machine_usage_id=usage.id,
        calculation_method="electric_machine",
        emission_factor_value=factor,
        emission_factor_unit="kgCO2e/kWh",
        estimated_co2e_kg=estimated_kg,
        estimated_co2e_ton=estimated_ton,
        pollutant_estimates_json={},
        context_ids_json=[],
        confidence_label="medium",
    )
    db.add(calculation)
    db.flush()
    return calculation


def attach_retrieved_context(calculation: EmissionCalculation, context: dict[str, list[dict]]) -> None:
    context_ids = []
    for results in context.values():
        for item in results:
            row_id = item.get("metadata", {}).get("row_id")
            if row_id:
                context_ids.append(row_id)
    calculation.context_ids_json = context_ids
    calculation.confidence_label = "high" if context_ids else "medium"
