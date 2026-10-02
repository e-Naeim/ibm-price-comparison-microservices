# Product Price Comparison Microservices

An IBM Full Stack Software Developer final project with three independent services:

- **Product Details**: Python / Flask, port 5000; lists products and their dealers
- **Dealer Pricing**: Node.js / Express, port 8080; returns one or all dealer prices
- **Frontend**: Python / Flask, port 5001; product and dealer dropdowns and price comparison

The project adapts the official IBM starter repositories, whose Apache-2.0 licenses remain in `backend/LICENSE` and `frontend/LICENSE`:
- https://github.com/ibm-developer-skills-network/dealer_evaluation_backend
- https://github.com/ibm-developer-skills-network/dealer_evaluation_frontend

## Current verification status

Implemented and tested locally. **Not yet deployed to IBM Cloud Code Engine.** Actual Code Engine URLs and the nine required screenshots must be collected in the course lab before the Coursera draft can be completed. The source currently contains local development URLs deliberately; no deployment URL is invented.

## Setup

Requires Python 3.12+ and Node.js 22+.

```sh
python3 -m venv .venv
.venv/bin/pip install -r backend/products_list/requirements.txt
npm ci
(cd backend/dealer_details && npm ci)
```

Start each service in a separate terminal from this repository's root:

```sh
(cd backend/products_list && ../../.venv/bin/gunicorn --bind 0.0.0.0:5000 app:app)
(cd backend/dealer_details && npm start)
(cd frontend && ../.venv/bin/gunicorn --bind 0.0.0.0:5001 app:app)
```

Then open http://localhost:5001. Choose Laptop → Tech City to see `$850`, or Laptop → All Dealers to compare `$850`, `$1000`, and `$1500`.

## Run verification

```sh
.venv/bin/python -m unittest discover -s tests -p 'test_*.py' -v
npm test
(cd backend/dealer_details && npm test)
.venv/bin/python scripts/test_live.py
```

The tests cover the API contract, all catalogue/pricing relationships, unknown values, cross-origin requests, input encoding, safe text rendering, dropdown resets, API failures/retry, and slow/out-of-order responses. The live integration test starts all three actual services and exercises the frontend with their real HTTP responses.

Docker image builds and Code Engine deployment have not been verified because the current environment has no Docker and course-lab access is awaiting the user's confirmation.

## IBM Code Engine deployment

Use the course's **Code Engine CLI** with the provided temporary course account. Do not create a paid IBM Cloud account, generate credentials, or enter secrets in this repository.

1. Clone this project into `/home/project` in the lab. Deploy the two backend contexts using the commands in `DEPLOYMENT.md`.
2. Capture the actual successful backend deployment output and copy both returned public URLs.
3. Clone the official frontend repository as required by the rubric, capturing the real clone result.
4. Configure the URLs in this project's frontend:

```sh
python3 configure_endpoints.py --products 'ACTUAL_PRODUCT_DETAILS_URL' --dealers 'ACTUAL_DEALER_PRICING_URL'
```

5. Copy the prepared frontend files into the official frontend clone, capture the actual changed `html/index.html`, and deploy that clone.
6. Capture all nine screenshots listed in `evidence/CHECKLIST.md` and upload them to the Coursera draft. Leave the honor-code checkbox and final Submit button to the learner.

## Improvements over the starter

- Corrects `Tech city` to `Tech City` so Laptop prices resolve for every listed dealer
- Resolves data/static files relative to source rather than current working directory
- Uses production Gunicorn for Python containers and a current Node container
- Returns useful 404s for missing data and has health endpoints for all services
- Encodes URL path parameters and renders API values as text
- Clears dependent selections and ignores stale responses when users change their selections quickly
- Provides visible loading, failure, and retry states

Prices are the provided course sample data; they are not live retail quotations.
