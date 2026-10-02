# Course lab deployment and evidence

Status: commands prepared; **not executed against Code Engine yet**.
Use only the course-provided temporary IBM Cloud environment.

## Prepare the source

```sh
cd /home/project
git clone https://github.com/e-Naeim/ibm-price-comparison-microservices.git
cd ibm-price-comparison-microservices
```

## Backend services

```sh
ibmcloud ce application create --name prodlist \
  --image us.icr.io/${SN_ICR_NAMESPACE}/prodlist \
  --registry-secret icr-secret --port 5000 \
  --build-context-dir backend/products_list --build-source .

ibmcloud ce application create --name dealerdetails \
  --image us.icr.io/${SN_ICR_NAMESPACE}/dealerdetails \
  --registry-secret icr-secret --port 8080 \
  --build-context-dir backend/dealer_details --build-source .
```

Capture the actual successful outputs as `product_details_deploy.jpeg` and `dealer_details_details.jpeg`. Record the real URLs. If a service already exists, inspect it before deciding whether an update is appropriate; do not delete an existing service blindly.

## Clone, configure, and deploy the frontend

```sh
cd /home/project
git clone https://github.com/ibm-developer-skills-network/dealer_evaluation_frontend.git
```

Capture the actual clone output as `git_clone.jpeg`.

```sh
cd /home/project/ibm-price-comparison-microservices
python3 configure_endpoints.py --products 'ACTUAL_PRODUCT_DETAILS_URL' --dealers 'ACTUAL_DEALER_PRICING_URL'
cp frontend/app.py frontend/Dockerfile frontend/requirements.txt frontend/.dockerignore /home/project/dealer_evaluation_frontend/
cp frontend/html/index.html /home/project/dealer_evaluation_frontend/html/index.html
cd /home/project/dealer_evaluation_frontend
```

Open `html/index.html` and capture both actual deployment URLs as `index_urlchanges.jpeg`.

```sh
ibmcloud ce application create --name frontend \
  --image us.icr.io/${SN_ICR_NAMESPACE}/frontend \
  --registry-secret icr-secret --port 5001 --build-source .
```

Capture successful output as `frontend_deploy.jpeg`. Open the actual returned frontend URL and verify the remaining four screenshots.

## Verification before submission

- Product Details `/products` returns Headphones, Laptop, Mouse, Printer
- Product Details `/getdealers/Laptop` includes `Tech City` with matching capitalization
- Dealer Pricing `/price/Tech%20City/Laptop` returns `Laptop costs $850 at Tech City`
- Dealer Pricing `/allprice/Laptop` returns 3 dealer prices
- The frontend is accessed through its real Code Engine URL and calls the deployed backends
- All nine images are genuine screenshots of the completed work, not mockups or local substitutes
