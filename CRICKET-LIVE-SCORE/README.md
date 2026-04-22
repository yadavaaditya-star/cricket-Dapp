# Cricket Live Score 

This project is a Cricket Live Score Web Application built using React.js and CSS. It fetches real-time cricket data from a RapidAPI cricket API and displays live match updates, upcoming fixtures, recent results, and detailed match insights. The application also includes team performance analysis, match visualizations, and lineup information.

## Prerequisites

Before setting up the project, ensure the following are installed on your system:

* Node.js (version 14 or higher recommended)
* npm (comes with Node.js)
* A RapidAPI account for API credentials


## Installation and Setup

### 1. Clone the Repository

Clone the project from GitHub:

```bash
git clone https://github.com/sneha-at-hub/CRICKET-LIVE-SCORE.git
```

### 2. Navigate to Project Directory

```bash
cd CRICKET-LIVE-SCORE
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Create Environment Variables

Create a `.env` file in the root directory and add your RapidAPI credentials:

```env
VITE_RAPIDAPI_KEY=your_api_key_here
VITE_RAPIDAPI_HOST=your_api_host_here
```

Make sure not to expose your API keys publicly.

### 5. Run the Application

Start the development server:

```bash
npm run dev
```

The application will run on your local host (usually http://localhost:5173/).

---

## Features

### Live Matches

* Displays real-time cricket scores
* Shows live match status and updates

### Upcoming Matches

* Lists scheduled matches
* Displays match timing and participating teams

### Recent Matches

* Shows completed match results
* Provides summary of outcomes

### Match Details

* Displays in-depth match information
* Includes team performance and score breakdown

### Visualization

* Graphical representation of match progress
* Comparative analysis of team performance

### Lineups

* Shows playing XI for both teams
* Displays team structure and player information

---

## Tech Stack

* Frontend: React.js
* Styling: CSS
* API: RapidAPI (Cricket API)
* Build Tool: Vite

---

## API Integration

The application uses RapidAPI to fetch cricket data. API calls are managed in the services layer and include:

* Authentication using API key and host
* Endpoints for live scores, match details, and fixtures

## Blockchain Match Verification

This project now includes a backend service that can anchor match events on a smart contract. The flow is:

1. Fetch key event data from RapidAPI.
2. Create a deterministic event hash in the backend.
3. Store the hash on-chain through a verification contract.
4. Verify a match ID later by comparing stored blockchain hash with computed event payload.

### Backend setup

Create a `.env` file with the following values:

```env
VITE_RAPIDAPI_KEY=your_api_key_here
VITE_RAPIDAPI_HOST=cricbuzz-cricket.p.rapidapi.com
RPC_URL=https://polygon-mumbai.infura.io/v3/your_project_id
BACKEND_PRIVATE_KEY=your_funding_wallet_private_key
CONTRACT_ADDRESS=0xYourDeployedMatchVerifierContractAddress
```

Install dependencies and run the backend with:

```bash
npm install
npm run serve:backend
```

The frontend will proxy `/api` requests to `http://localhost:4000` during development.

---

## Notes

* Ensure your RapidAPI subscription is active
* Be aware of API rate limits
* Add `.env` to `.gitignore` to protect sensitive data

---

## Author

Developed by Sneha

---

## License

This project is intended for educational and development purposes.


