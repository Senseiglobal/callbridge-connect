FROM python:3.12-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

ENV PORT=8080
ENV CALLE_DRY_RUN=true
ENV STORAGE_BACKEND=local

CMD ["python", "app.py"]
