# ================================
# Dockerfile for SabiWay Django app
# ================================
FROM python:3.10-slim

# Prevent Python from writing .pyc files and force stdout buffer flushing
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Container working directory
WORKDIR /app

# Copy project files
COPY . /app/

# Install dependencies
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Expose Django/Gunicorn port
EXPOSE 8000

# Run Gunicorn in production
CMD ["gunicorn", "sabiway.wsgi:application", "--bind", "0.0.0.0:8000"]
