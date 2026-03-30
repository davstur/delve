FROM python:3.11-slim

WORKDIR /app

RUN pip install poetry==2.1.1

COPY pyproject.toml poetry.lock ./
RUN poetry config virtualenvs.create false && \
    poetry install --only main --no-interaction --no-ansi

COPY . .

RUN useradd --create-home appuser && chmod -R a+rX /app
USER appuser

ENV PORT=8080
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port $PORT"]
