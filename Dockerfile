FROM python:3.9-slim

WORKDIR /app

# Install dependencies
COPY backend_api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend files
COPY backend_api/ .

# Hugging Face Spaces exposes port 7860
EXPOSE 7860

# Start the Flask API
CMD ["gunicorn", "-b", "0.0.0.0:7860", "api:app"]
