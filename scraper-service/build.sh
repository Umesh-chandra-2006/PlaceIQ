#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install python dependencies
pip install -r requirements.txt

# Install Playwright browsers (Chromium only to save space/time)
# This is required for Render deployments to avoid the 'Executable doesn't exist' error
python -m playwright install chromium
