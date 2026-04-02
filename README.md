# team2-S26-CS320

## Setup
  1. Create a .env file in the root folder with:
      VITE_GOOGLE_CLIENT_ID=...
  2. create a backend/.env file with:
      GOOGLE_CLIENT_ID=...
      JWT_SECRET="..."
      ALLOWED_ORIGINS="http://localhost:5173"
  * Notes:
    * The VITE_GOOGLE_CLIENT_ID and GOOGLE_CLIENT_ID do not go in quotes or anything
    * The JWT_SECRET is in quotes
    * I will post the GOOGLE_CLIENT_ID, JWT_SECRET, and VITE_GOOGLE_CLIENT_ID on slack

## How to test and run this:
  1. Make sure you're in team2-S26-CS320 directory
  2. npm install
  3. npm run dev
  4. Open a separate terminal
  5. cd backend
  6. pip install -r requirements.txt (If this doesnt work, try: pip3 install -r requirements.txt)
  7. uvicorn main:app --reload
  8. Open a browser and go to: http://localhost:5173