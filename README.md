# team2-S26-CS320

## Setup
  1. Create a .env file in the root folder(TEAM2-S36-CS320) with:
      VITE_GOOGLE_CLIENT_ID=...
  2. create a backend/.env file with:
      GOOGLE_CLIENT_ID=...
      JWT_SECRET="..."
      ALLOWED_ORIGINS="http://localhost:5173"
  * Notes:
    * The VITE_GOOGLE_CLIENT_ID and GOOGLE_CLIENT_ID do not go in quotes or anything
    * The JWT_SECRET is in quotes
    * I will post the GOOGLE_CLIENT_ID, JWT_SECRET, and VITE_GOOGLE_CLIENT_ID on slack
  3. Also add in backend/.env file:
      SUPABASE_URL=...
      SUPABASE_KEY=...
      FRONTEND_URL=...
      SUPABASE_URL should be https://slxuaqhbykwlftdfuhmn.supabase.co
      SUPABASE_KEY will be posted on Slack
      FRONTEND_URL should be http://localhost:5173 if doing local testing

## How to test and run this:
  1. Make sure you're in team2-S26-CS320 directory
  2. Create the venv virtual environment, inside terminal:
    * cd backend
    * python3 -m venv venv
    * source venv/bin/activate
    * pip install -r requirements.txt (If this doesn't work, try pip3 install -r requirements.txt)
  3. Open a separate terminal in the root directory:
    * npm install
    * npm run dev
  4. In your backend terminal, run:
    * uvicorn main:app --reload 
  5. Open a browser and go to: http://localhost:5173


## Testing Upcoming Tasks Sorting:

1. Open the app and navigate to Upcoming Tasks
2. Create a few tasks with different start times and assign them to categories with different priorities
3. Verify tasks are ordered by:
     -   Start time (earliest first)
     -  Category priority (High → Low) when start times match
     -  
Completed tasks should not appear in the list


<img width="2390" height="1466" alt="image" src="https://github.com/user-attachments/assets/d9aa9608-ac2d-4207-af91-f50917a73e40" />

