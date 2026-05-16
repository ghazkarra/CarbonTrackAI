import json
from concurrent.futures import ThreadPoolExecutor, TimeoutError
from typing import Any

from openai import OpenAI

from app.config import get_settings


def get_llm_client() -> OpenAI | None:
    settings = get_settings()
    if not settings.llm_api_key:
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


def _call_llm_json_sync(client: OpenAI, model: str, prompt: str) -> dict[str, Any] | None:
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
You are an industrial emission reduction assistant.
Use only the provided machine usage data, calculation results, and retrieved context.
Do not invent emission factors.
Generate practical recommendations that the user can mark as completed.
Return JSON only.

Machine Usage:
{json.dumps(machine_usage, default=str)}

Calculation:
{json.dumps(calculation or {}, default=str)}

Retrieved Context:
{json.dumps(retrieved_context or {}, default=str)}

Output JSON shape:
{{"recommendations":[{{"recommendation_title":"...","recommendation_description":"...","category":"energy_efficiency|maintenance|operation|equipment_upgrade|safety|reporting","priority":"low|medium|high|critical","estimated_impact":"low|medium|high","related_machine_name":"..."}}]}}
"""
    data = call_llm_json(prompt)
    recommendations = data.get("recommendations") if data else None
    return recommendations if isinstance(recommendations, list) else []


def explain_alert_with_llm(alert_rule: dict, retrieved_context: dict | None) -> dict | None:
    prompt = f"""
You are an emission monitoring alert assistant.
Explain the alert in simple Indonesian.
Use only the provided triggered values and retrieved context.
Do not invent thresholds.
Return JSON only.

Alert Rule Result:
{json.dumps(alert_rule, default=str)}

Retrieved Context:
{json.dumps(retrieved_context or {}, default=str)}

Output JSON shape:
{{"message":"...","recommended_action":"...","severity_reason":"..."}}
"""
    return call_llm_json(prompt)


def generate_report_summary_with_llm(report_type: str, report_data: dict) -> dict | None:
    prompt = f"""
You are a sustainability reporting assistant.
Create a concise Indonesian executive summary for a PDF report.
Use only the provided report data.
Do not mention completed recommendations for daily or weekly reports.
For monthly and annual reports, include completed recommendations summary if provided.
Return JSON only.

Report Type: {report_type}
Report Data: {json.dumps(report_data, default=str)}

Output JSON shape:
{{"executive_summary":"...","key_findings":["..."],"management_notes":["..."]}}
"""
    return call_llm_json(prompt)
