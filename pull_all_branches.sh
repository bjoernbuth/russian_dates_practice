#!/bin/bash

git fetch --all

for branch in $(git branch -r); do
  git branch --track "${branch#origin/}" "$branch" 2>/dev/null
done

git pull --all
