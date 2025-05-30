import json

from servc_typings.dag import Dag
from servc_typings.domains.provisioner import ProvisionerType

pu = "500m"
memory = "256Mi"
req = {"cpu": "750m", "memory": "1Gi"}
common_step = {"type": "aks", "queue": "chess"}
common = {
    "resources": {"requests": req, "limits": req},
    "pullSecret": ["cluster-docker-private"],
    "env": [
        {
            "name": "CONF__WORKER__EXITON4XX",
            "value": "true"
        }
    ],
    "type": ProvisionerType.DEPLOYMENT.value,
    "maxReplicas": 1,
    "image": "registry.yusufali.ca/chess/etl",
}
dag: Dag = {
    "steps": [
        {**common_step, "name": "download pgns", "method": "downlad"},
        {**common_step, "name": "extract pgn data", "method": "extract"},
        # { **common_step, "name": "tabulate fens", "method": "fen" },
        {**common_step, "name": "run model", "method": "uci_engine"},
        {**common_step, "name": "publish2postgres", "method": "publish"},
    ],
    "provisioner": [
        # { type: str, name: str, image: str, resources: Resources, pullSecret: List[str], env: List[EnvVariable], cron: str, cmd: List[str] }
        {
            **common,
            "type": ProvisionerType.CRON.value,
            "name": "trigger",
            "cron": "@hourly",
            "cmd": ["python", "trigger.py"],
        },
        {**common, "name": "chess", "queueName": "chess"},
    ],
    "notifiers": {
        "complete": [],
        "failure": [],
    },
    # ^ this param is not supported yet
}
Dag.model_validate(dag)

with open("dag.json", "w+") as f:
    json.dump(dag, f, indent=4)
