Z2A Academy — Tuition Centre Website
====================================

What's included:
- index.html — Student portal (search & download PDF)
- admin.html — Admin portal (login, add/edit/delete students)
- style.css — Common styling
- script.js — Frontend JS used by both pages
- server.js — Node.js + Express backend with MongoDB (mongoose)
- package.json — Node dependencies
- .env.sample — Example environment file

Quick start:
1. Install dependencies:
   npm install

2. Create a .env file (copy .env.sample) and set MONGO_URI and JWT_SECRET.

3. Run:
   npm start

4. Open:
   - Student portal: http://localhost:3000/
   - Admin portal:   http://localhost:3000/admin

Admin credentials (built-in):
- Username: Z2A
- Password: 1234

Notes:
- Roll number is enforced unique by the server.
- Subjects and marks can be entered as comma-separated values or by using "Add more pairs" in the admin form.
- Student results can be downloaded as PDF from the student portal (uses jsPDF via CDN).

