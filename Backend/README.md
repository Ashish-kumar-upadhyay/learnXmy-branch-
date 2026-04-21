# LearnX Backend

Express + TypeScript + MongoDB LMS API. सेटअप:

1. `cp .env.example .env` (Windows: copy) और MongoDB URI / JWT secrets भरें।
2. `npm install`
3. `npm run dev` — डिफ़ॉल्ट `http://localhost:5000`
4. पहला **admin** बनाने के लिए DB में सीधे रole जोड़ें या अस्थायी रूप से `user.routes.ts` में `register` फ्लो से `admin` रोल ऐड करने का स्क्रिप्ट चलाएँ।

`GET /health` से सर्वर चेक करें।
