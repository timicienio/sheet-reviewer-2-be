import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000", // Your React app URL
    credentials: true,
  })
);
app.use(express.json());

// Google OAuth token exchange endpoint
app.post("/api/auth/google", async (req, res) => {
  const { code, redirect_uri } = req.body;

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri,
      }),
    });

    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ error: data.error_description });
    }

    res.json(data);
  } catch (error) {
    console.error("OAuth error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
});

// Google Sheets API proxy endpoint (optional)
app.get("/api/sheets/:spreadsheetId", async (req, res) => {
  const { spreadsheetId } = req.params;
  const { range } = req.query;
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "No authorization header" });
  }

  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
      {
        headers: {
          Authorization: authHeader,
        },
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Sheets API error:", error);
    res.status(500).json({ error: "Failed to fetch sheet data" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
