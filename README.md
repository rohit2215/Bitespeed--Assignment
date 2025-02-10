# Bitespeed Backend Task: Identity Reconciliation

## Overview
This project handles **identity reconciliation** by linking user records based on shared emails and phone numbers. It ensures a **single source of truth** for user identities by consolidating multiple records into a unified contact.

## Tech Stack
- **Backend:** Node.js (Express)
- **Database:** PostgreSQL (Hosted on Render)
- **ORM:** Sequelize
- **Hosting:** Render

## API Endpoints
### 1. Identify and Link User Records
**POST** `/identify`  
Identifies and links user records based on shared emails and phone numbers.

#### Request Body (JSON):
```json
{
  "email": "user@example.com",
  "phoneNumber": "+1234567890"
}
```

#### Response (JSON):
```json
{
  "primaryContactId": 1,
  "emails": ["user@example.com"],
  "phoneNumbers": ["+1234567890"],
  "secondaryContactIds": []
}
```

### 2. Fetch Linked User Details
**GET** `/contacts/:id`  
Fetches all linked details for a given contact ID.

#### Response (JSON):
```json
{
  "primaryContactId": 1,
  "emails": ["user@example.com", "alternate@example.com"],
  "phoneNumbers": ["+1234567890", "+9876543210"],
  "secondaryContactIds": [2, 3]
}
```

## Setup Instructions
### 1. Clone & Install Dependencies
```sh
git clone https://github.com/your-repo.git
cd your-repo
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory and add the following variables:
```sh
DATABASE_URL=your_render_postgresql_url
PORT=3000
```

### 3. Run Migrations & Start Server
```sh
npx sequelize-cli db:migrate
npm start
```

## Deployment
The project is hosted on **Render** (Backend & Database). Ensure migrations run on startup.

## Contact
For any queries, feel free to reach out!

