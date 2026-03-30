# team2-S26-CS320

## Setup
Before running, create a backend/.env file with:
GOOGLE_CLIENT_ID=...
JWT_SECRET="..."

Also create a .env file in the root with:
VITE_GOOGLE_CLIENT_ID=...

I will give the GOOGLE_CLIENT_ID and JWT_SECRET on slack

## How to test and run this:
  1. cd backend
  2. pip install -r requirements.txt
  3. uvicorn main:app --reload
  4. Open a separate terminal
  5. npm install
  6. npm run dev