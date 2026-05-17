from __future__ import annotations

import json
from concurrent.futures import ThreadPoolExecutor, TimeoutError
from typing import Any

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

from app.config import get_settings


def get_llm_client() -> Any | None:
    settings = get_settings()
    if OpenAI is None or not settings.llm_api_key:
        return None
    return OpenAI(base_url=settings.llm_base_url, api_key=settings.llm_api_key, timeout=settings.llm_timeout_seconds)


def call_llm_json(prompt: str) -> dict[str, Any] | None:
    client = get_llm_client()
    if client is None:
        return None

    settings = get_settings()
    executor = ThreadPoolExecutor(max_workers=1)
    future = executor.submit(_call_llm_json_sync, client, settings.llm_model, prompt)
    try:
        return future.result(timeout=settings.llm_timeout_seconds)
    except TimeoutError:
        future.cancel()
        return None
    except Exception:
        return None
    finally:
        executor.shutdown(wait=False, cancel_futures=True)


def _call_llm_json_sync(client: Any, model: str, prompt: str) -> dict[str, Any] | None:
    try:
        completion = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            top_p=0.95,
            max_tokens=2048,
            extra_body={"chat_template_kwargs": {"thinking": False}},
            stream=False,
        )
        content = completion.choices[0].message.content or "{}"
        return parse_json_object(content)
    except Exception:
        return None


def parse_json_object(content: str) -> dict[str, Any] | None:
    cleaned = content.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.startswith("json"):
            cleaned = cleaned[4:].strip()
    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start == -1 or end == -1 or end <= start:
            return None
        try:
            parsed = json.loads(cleaned[start : end + 1])
        except json.JSONDecodeError:
            return None
    return parsed if isinstance(parsed, dict) else None


def generate_recommendations_with_llm(machine_usage: dict, calculation: dict | None, retrieved_context: dict | None) -> list[dict]:
    prompt = f"""
Anda adalah asisten pengurangan emisi industri.
Gunakan hanya data pemakaian mesin, hasil perhitungan, dan konteks yang diberikan.
Jangan mengarang faktor emisi, ambang batas, atau data operasional baru.
Hasilkan rekomendasi praktis yang bisa ditandai selesai oleh pengguna.
Semua teks yang dibaca pengguna wajib menggunakan Bahasa Indonesia: recommendation_title, recommendation_description, dan related_machine_name.
Nilai category, priority, dan estimated_impact wajib tetap memakai enum bahasa Inggris sesuai skema.
Kembalikan JSON saja.

Data Pemakaian Mesin:
{json.dumps(machine_usage, default=str)}

Perhitungan:
{json.dumps(calculation or {}, default=str)}

Konteks Terambil:
{json.dumps(retrieved_context or {}, default=str)}

Skema JSON output:
{{"recommendations":[{{"recommendation_title":"...","recommendation_description":"...","category":"energy_efficiency|maintenance|operation|equipment_upgrade|safety|reporting","priority":"low|medium|high|critical","estimated_impact":"low|medium|high","related_machine_name":"..."}}]}}
"""
    data = call_llm_json(prompt)
    recommendations = data.get("recommendations") if data else None
    return recommendations if isinstance(recommendations, list) else []


def explain_alert_with_llm(alert_rule: dict, retrieved_context: dict | None) -> dict | None:
    prompt = f"""
Anda adalah asisten pemantauan peringatan emisi.
Jelaskan peringatan dalam Bahasa Indonesia yang sederhana dan operasional.
Gunakan hanya nilai pemicu dan konteks yang diberikan.
Jangan mengarang ambang batas atau data operasional baru.
Kembalikan JSON saja.

Hasil Aturan Peringatan:
{json.dumps(alert_rule, default=str)}

Konteks Terambil:
{json.dumps(retrieved_context or {}, default=str)}

Skema JSON output:
{{"message":"...","recommended_action":"...","severity_reason":"..."}}
"""
    return call_llm_json(prompt)


def generate_report_summary_with_llm(report_type: str, report_data: dict) -> dict | None:
    prompt = f"""
Anda adalah asisten pelaporan keberlanjutan.
Buat ringkasan eksekutif singkat dalam Bahasa Indonesia untuk laporan PDF.
Gunakan hanya data laporan yang diberikan.
Jangan menyebut rekomendasi selesai untuk laporan harian atau mingguan.
Untuk laporan bulanan dan tahunan, sertakan ringkasan rekomendasi selesai jika tersedia.
Kembalikan JSON saja.

Jenis Laporan: {report_type}
Data Laporan: {json.dumps(report_data, default=str)}

Skema JSON output:
{{"executive_summary":"...","key_findings":["..."],"management_notes":["..."]}}
"""
    return call_llm_json(prompt)
