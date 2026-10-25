# Build context must be the repository root to include the trained model.
FROM python:3.11-slim
WORKDIR /app
ENV PYTHONUNBUFFERED=1 OMP_NUM_THREADS=1 OPENBLAS_NUM_THREADS=1 MKL_NUM_THREADS=1 REQUIRE_MODEL=true
COPY backend/ml-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ml-service/app.py .
COPY ml/fraud_detection_model.pkl ./model.pkl
USER 10001
EXPOSE 10000
CMD ["sh", "-c", "exec uvicorn app:app --host 0.0.0.0 --port ${PORT:-10000} --workers 1"]
