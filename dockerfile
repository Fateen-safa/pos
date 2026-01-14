# ver1 build failed
# FROM python:3.11-slim

# WORKDIR /app

# COPY backend /app/
# COPY frontend /app/
# COPY backend/req.txt /app/req
# COPY run.py /app/


#  RUN pip install 

#  CMD ["python", "run.py"]

#ver2 build failed 

# # Use official Python runtime as parent image
# FROM python:3.11-slim

# # Set working directory
# WORKDIR /app

# # Copy requirements first for better caching
# COPY req.txt .

# # Install dependencies
# #apt ... is for installing psycopg2-binary
# RUN pip install --no-cache-dir -r req.txt

# # Copy application code
# COPY . .

# # Command to run the application
# CMD ["python", "run.py"]



FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000 

CMD ["python", "run.py"]