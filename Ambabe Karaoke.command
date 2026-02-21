#!/bin/bash
cd "$(dirname "$0")"
if ! command -v node &>/dev/null; then
  osascript -e 'display alert "Node.js required" message "Please install Node.js from https://nodejs.org then try again."'
  exit 1
fi
open "http://localhost:3847/" 2>/dev/null
exec node server.js
