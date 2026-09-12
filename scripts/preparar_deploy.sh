#!/usr/bin/env bash
# Arma en build/deploy un paquete con la estructura que espera el deploy de Devin:
# pyproject.toml en la raiz y la app FastAPI en app/main.py, con el frontend compilado adentro.
set -euo pipefail

raiz="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
destino="$raiz/build/deploy"

rm -rf "$destino"
mkdir -p "$destino/app"

cp "$raiz"/backend/*.py "$destino/app/"
mv "$destino/app/main.py" "$destino/app/api.py"
touch "$destino/app/__init__.py"

cat > "$destino/pyproject.toml" <<'TOML'
[tool.poetry]
name = "app"
version = "0.1.0"
description = "API de stock y facturacion interna para distribuidora"
authors = ["Distribuidora"]
readme = "README.md"
packages = [{ include = "app" }]

[tool.poetry.dependencies]
python = "^3.12"
fastapi = "^0.115.0"
uvicorn = { extras = ["standard"], version = "^0.34.0" }
sqlmodel = "^0.0.22"

[build-system]
requires = ["poetry-core"]
build-backend = "poetry.core.masonry.api"
TOML

cat > "$destino/README.md" <<'MD'
# Distribuidora — API y demo

Paquete generado por `scripts/preparar_deploy.sh`.
MD

printf 'fastapi>=0.115.0\nuvicorn[standard]>=0.34.0\nsqlmodel>=0.0.22\n' > "$destino/requirements.txt"

cat > "$destino/app/main.py" <<'PY'
import os
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
os.environ.setdefault("FRONTEND_DIR", os.path.join(AQUI, "static"))

from api import app  # noqa: E402,F401
PY

(cd "$raiz/frontend" && npm run build)
cp -r "$raiz/frontend/dist" "$destino/app/static"

(cd "$destino" && poetry lock --no-update >/dev/null 2>&1 || poetry lock >/dev/null)

echo "Listo: $destino"
