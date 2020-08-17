#!/usr/bin/env python3

import os
import sys
import subprocess
import pathlib

"""
This script is used to run and delegate tasks are to be run within this mono repository.
It determines this based on the stage using $CI_JOB_STAGE variable.
"""

def getoutput(command, ret=True):
  result = []
  try:
    result = subprocess.check_output(command, stderr=subprocess.STDOUT)
  except subprocess.CalledProcessError as exc:
    cmd = ' '.join(command)
    print(f"Command failed: {cmd} with status {exc.returncode}")
    exit(exc.output)
  
  output = list(filter(None,result.decode('utf-8').split('\n')))
  if ret:
    return output
  
  for line in output:
    print(line)

def task_builder(package, group):
  # determine if the package as a defined task
  # if not, run the group level defined task
  script = f"{os.environ['STAGE']}.sh"
  package_script = os.path.join(package,"cicd",script)
  group_script = os.path.join(group,"cicd",script)
  
  if os.path.exists(package_script):
    return package_script
  elif os.path.exists(group_script):
    return group_script
  else:
    exit(f"Script {script} is not defined for package: {package}!")

def main():
  # check to make sure stage is defined
  if "STAGE" not in os.environ:
    exit("JOB stage is not defined")

  # install git
  getoutput(["apk","add","git","bash"],False)

  # determine list of files that changed from last commit.
  changed_files = getoutput(["git","log","-1","--name-only","--oneline"])[1:]
  
  # determine unique packages based on package group
  packages = []
  tasks = []
  for relgroup in sys.argv[1:]:
    group = os.path.join(os.environ['CI_PROJECT_DIR'], relgroup)
    print(f"Looking for tasks in package group: {group}")

    for fname in changed_files:
      file = os.path.join(os.environ['CI_PROJECT_DIR'],fname)

      # make sure it starts with group
      if not file.startswith(group):
        continue
      
      # determine package
      relpath = os.path.relpath(os.path.dirname(file), group)
      if relpath == "." or "cicd" in relpath:
        continue
      package = os.path.join(group,pathlib.Path(relpath).parts[0])
      
      if package not in packages and os.path.isdir(package):
        packages.append(package)
        tasks.append([package,group])
  
  # run tasks for each package
  with open("tasks.sh","w+") as f:
    for package,group in tasks:
      print(f"Running tasks in {package}")
      script = task_builder(package,group)
      f.write(f"{script} {package}\n")
  
  # print out tasks
  getoutput(["cat","tasks.sh"], False)
  getoutput(["chmod","+x","tasks.sh"])

  print("Done")

if __name__ == "__main__":
  main()