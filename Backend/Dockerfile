# ================================
# Dockerfile for SabiWay Django app
# ================================
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set working directory
WORKDIR /app

# Install system dependencies (fixed for Debian 13+)
RUN apt-get update && apt-get install -y \
    build-essential \
    libmariadb-dev \
    libmariadb-dev-compat \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Copy project files into container
COPY . /app/

# Upgrade pip and install Python dependencies
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Collect static files (optional, will skip errors if no static setup)
RUN python manage.py collectstatic --noinput || true

# Expose port 8000 for Gunicorn
EXPOSE 8000

# Run Gunicorn as the app server
CMD ["gunicorn", "sabiway.wsgi:application", "--bind", "0.0.0.0:8000"]
