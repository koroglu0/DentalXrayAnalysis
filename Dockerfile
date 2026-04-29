FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    libxcb1 \
    libxkbcommon0 \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir --force-reinstall opencv-python-headless

COPY . .

WORKDIR /app/backend

EXPOSE 8000

CMD gunicorn application:application --bind 0.0.0.0:$PORT --workers 1 --timeout 120
