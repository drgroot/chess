import json
import os
import time

import requests

dag = {}
with open("dag.json", "r") as f:
    dag = json.load(f)

url = os.getenv("API_URL", "https://api.servc.io")
hdrs = {"Apitoken": os.getenv("API_TOKEN", "")}
request = requests.post(
    url=url,
    json={
        "type": "input",
        "route": "orchestrator",
        "argumentId": "plain",
        "force": True,
        "instanceId": None,
        "inputs": {
            "method": "add_dag",
            "inputs": {
                "dag": json.dumps(dag),
            },
        },
    },
    headers=hdrs,
)
job_id = request.text

# poll for result
response = None
while True:
    time.sleep(2)
    status = requests.get(url=f"{url}/id/{job_id}", headers=hdrs)
    res = status.json() if status.text else {}
    if res and (res["progress"] == 100 or res["isError"]):
        response = res["responseBody"]

        if res["isError"]:
            print("Error:", response)
            exit(1)
        break
print(response)
