FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy codebase
COPY . .

# Set Environment
ENV PORT=8000
EXPOSE 8000

# Start Python backend server
CMD ["python", "backend/app/server.py"]
