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

def task_runner(package, group):
  # determine if the package as a defined task
  # if not, run the group level defined task
  script = f"{os.environ['CI_JOB_STAGE']}.sh"
  package_script = os.path.join(package,"cicd",script)
  group_script = os.path.join(group,"cicd",script)
  if os.path.exists(package_script):
    getoutput([package_script, package], False)
  elif os.path.exists(group_script):
    getoutput([group_script, package], False)
  else:
    exit(f"Script {script} is not defined for package: {package}!")

def main():
  # check to make sure stage is defined
  if "CI_JOB_STAGE" not in os.environ:
    exit("JOB stage is not defined")

  # install git
  getoutput(["apk","add","git"],False)

  # determine list of files that changed from last commit.
  changed_files = getoutput(["git","log","-1","--name-only","--oneline"])[1:]
  
  # determine unique packages based on package group
  packages = []
  tasks = []
  for group in sys.argv[1:]:
    print(f"Looking for tasks in package group: {group}")

    for file in changed_files:

      # make sure it starts with group
      if not file.startswith(group):
        continue
      
      # determine package
      relpath = os.path.relpath(os.path.dirname(file), group)
      if relpath == "." or relpath == "cicd":
        continue
      package = os.path.join(group,pathlib.Path(relpath).parts[0])
      
      if package not in packages and os.path.isdir(package):
        packages.append(package)
        tasks.append([package,group])
  
  # run tasks for each package
  for package,group in tasks:
    print(f"Running tasks in {package}")
    task_runner(package,group)
    
  print("Done")

if __name__ == "__main__":
  main()