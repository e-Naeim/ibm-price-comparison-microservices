FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py products.json ./
EXPOSE 5000
ENV PORT=5000
CMD ["sh", "-c", "exec gunicorn --bind 0.0.0.0:${PORT} --workers 2 app:app"]
