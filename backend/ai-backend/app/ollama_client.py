import json
import re
import time
import threading
from typing import Any, Optional, List, Dict

import requests
from app.config import OLLAMA_URL, MODEL_NAME

# limit concurrent calls
_SEMAPHORE = threading.BoundedSemaphore(2)
_MAX_PROMPT_CHARS = 9000


def _trim_prompt(messages: List[Dict[str, str]]) -> List[Dict[str, str]]:
    total = sum(len(m.get("content", "")) for m in messages)
    if total <= _MAX_PROMPT_CHARS:
        return messages

    # trim biggest chunk
    largest = max(messages, key=lambda m: len(m.get("content", "")))
    excess = total - _MAX_PROMPT_CHARS
    largest["content"] = largest["content"][excess:]
    return messages


def query_ollama(messages, timeout=120, stream=True, retries=1) -> str:
    messages = _trim_prompt(messages)
    payload = {"model": MODEL_NAME, "messages": messages, "stream": stream}
    
    last_error = None

    for attempt in range(retries + 1):
        with _SEMAPHORE:
            try:
                response = requests.post(
                    OLLAMA_URL, 
                    json=payload, 
                    timeout=timeout, 
                    stream=stream
                )
                response.raise_for_status()

                if not stream:
                    data = response.json()
                    return data.get("message", {}).get("content", "")

                # streaming handling
                final = []
                for line in response.iter_lines():
                    if not line:
                        continue
                    try:
                        obj = json.loads(line.decode("utf-8"))
                        chunk = obj.get("message", {}).get("content", "")
                        if chunk:
                            final.append(chunk)
                        if obj.get("done"):
                            break
                    except:
                        continue

                return "".join(final)

            except Exception as e:
                last_error = e
                if attempt < retries:
                    time.sleep(1.5)
    
    raise last_error


def extract_json_from_model_output(raw_output: str):
    """
    Attempts multiple strategies to extract valid JSON out of messy LLM output.
    Useful when the model adds text before/after JSON or formatting noise.
    """
    if not raw_output:
        return None

    text = raw_output.strip()

    # Try fenced code blocks first
    import re, json
    try:
        fenced = re.search(r"```json(.*?)```", text, flags=re.S | re.I)
        if fenced:
            return json.loads(fenced.group(1))
    except:
        pass

    # Try isolate JSON by first and last brace/bracket
    try:
        start = min(i for i in [text.find("{"), text.find("[")] if i != -1)
        end_candidates = [text.rfind("}"), text.rfind("]")]
        end = max(e for e in end_candidates if e != -1) + 1
        return json.loads(text[start:end])
    except:
        pass

    # Final attempt: raw JSON parse
    try:
        return json.loads(text)
    except:
        return None
