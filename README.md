# RICO Part Master App — Full Stack with SQLite

## Stack
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express.js
- **Database**: SQLite (1680 materials + 998 parts from your Excel file)
- **Auth**: Login page (admin / admin121)

## Database Summary
| Table             | Rows  | Description                          |
|-------------------|-------|--------------------------------------|
| plants            | 4     | Bawal, Pathredi, Chennai, Gurugram   |
| materials         | 1,680 | All materials from GGN (1002) sheet  |
| parts             | 998   | Finished goods from Part Master sheet|
| operations        | 0     | Ready to be filled via UI            |
| process_flow_diagrams | 0 | Ready for uploads                   |
| inspection_sheets | 0     | Ready for uploads                    |
| control_plan_charts | 0   | Ready for uploads                    |

## API Endpoints
| Method | Endpoint                         | Description             |
|--------|----------------------------------|-------------------------|
| GET    | /api/plants                      | All plants              |
| GET    | /api/parts?plant=GURUGRAM        | Parts by plant          |
| GET    | /api/parts?search=brake          | Search parts            |
| GET    | /api/parts?group=FINISHED        | Filter by group         |
| GET    | /api/parts/:id                   | Single part details     |
| GET    | /api/parts/:id/operations        | Part operations         |
| GET    | /api/parts/:id/configuration     | Part configuration      |
| PUT    | /api/parts/:id/configuration     | Update configuration    |
| GET    | /api/materials?group=RAWMAT      | Raw materials           |
| GET    | /api/stats?plant=GURUGRAM        | Plant statistics        |

## Setup & Run

### Step 1 — Backend
```bash
cd backend
npm install
node server.js
# ✅ Runs on http://localhost:5000
```

### Step 2 — Frontend
```bash
cd frontend
npm install
npm run dev
# ✅ Runs on http://localhost:5173
```

### Login
- Username: `admin`
- Password: `admin121`

## Switching to MySQL (When Ready)
Replace `backend/src/config/db.js` with:
```js
const mysql = require('mysql2/promise');
const pool  = mysql.createPool({ host:'localhost', user:'root', password:'', database:'rico_db' });
const query = (sql, params) => pool.query(sql, params).then(([rows]) => ({ rows }));
const run   = (sql, params) => pool.query(sql, params).then(([r]) => ({ changes: r.affectedRows }));
module.exports = { query, run };
```
Then run the same CREATE TABLE SQL from `schema.sql`. **Controllers and routes stay unchanged.**
