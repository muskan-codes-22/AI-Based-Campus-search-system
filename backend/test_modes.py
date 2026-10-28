import requests
import json

URL = "http://127.0.0.1:8000/api/chat"

test_cases = [
    {
        "name": "2-marks mode",
        "question": "What is asymptotic notation?",
        "answer_mode": "2-marks",
    },
    {
        "name": "10-marks mode",
        "question": "Explain Divide and Conquer approach with algorithm and complexity",
        "answer_mode": "10-marks",
    },
    {
        "name": "compare mode",
        "question": "Compare Big-O, Big-Omega, and Big-Theta notations",
        "answer_mode": "compare",
    },
    {
        "name": "auto mode (define)",
        "question": "Define Big-O notation",
        "answer_mode": "auto",
    },
    {
        "name": "auto mode (explain)",
        "question": "Explain the Master Theorem with examples",
        "answer_mode": "auto",
    },
]

for tc in test_cases:
    print(f"\n==================== TEST: {tc['name']} ====================")
    payload = {
        "question": tc["question"],
        "answer_mode": tc["answer_mode"],
        "history": [],
    }
    try:
        res = requests.post(URL, json=payload, timeout=60)
        if res.status_code == 200:
            data = res.json()
            ans = data.get("answer", "")
            first_line = ans.splitlines()[0] if ans else ""
            print(f"Status: 200 OK")
            print(f"First line: {first_line[:120]}")
            print(f"Length: {len(ans)} chars")
            has_think = "<think>" in ans or "Let me" in ans[:80] or "The user is asking" in ans[:80]
            print(f"Has thinking leak? {has_think}")
            print(f"Snippet (first 300 chars):\n{ans[:300]}")
            print(f"Contains table? {'|' in ans}")
            print(f"Contains code block? {'```' in ans}")
        else:
            print(f"Status: {res.status_code}")
            print(res.text[:300])
    except Exception as e:
        print(f"Error: {e}")
