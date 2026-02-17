import requests
import json
import sys

username = "korsonedu"
password = "gyc050216"
repo_name = "korson-ai-web"

# Create Repository
url = "https://api.github.com/user/repos"
payload = {
    "name": repo_name,
    "private": False,
    "auto_init": False
}

try:
    response = requests.post(
        url,
        data=json.dumps(payload),
        auth=(username, password),
        headers={"Accept": "application/vnd.github.v3+json"}
    )
    if response.status_code == 201:
        print(f"Successfully created repository: {repo_name}")
    elif response.status_code == 422:
        print(f"Repository {repo_name} already exists.")
    else:
        print(f"Failed to create repository. Status: {response.status_code}")
        print(response.json())
except Exception as e:
    print(f"Error: {str(e)}")
