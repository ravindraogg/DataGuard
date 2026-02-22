FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Create a non-root user (required by Hugging Face Spaces)
RUN useradd -m -u 1000 user
ENV HOME=/home/user
ENV PATH="/home/user/.local/bin:$PATH"

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set working directory and ensure user owns it
WORKDIR /home/user/app
RUN chown -R user:user /home/user/app

# Create directories needed at runtime (while still root)
RUN mkdir -p experience_logs && chown -R user:user experience_logs

# Copy requirements first for better layer caching
COPY --chown=user:user requirements.txt .

# Switch to non-root user
USER user

# Install Python dependencies (CPU-only PyTorch to keep image small)
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code and model files
COPY --chown=user:user heal.py .
COPY --chown=user:user models/ ./models/


# Expose the Hugging Face Spaces default port
EXPOSE 7860



# Run with gunicorn for production
CMD ["gunicorn", "--bind", "0.0.0.0:7860", "--workers", "1", "--timeout", "120", "heal:app"]
