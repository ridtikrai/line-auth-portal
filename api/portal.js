const CENTRAL_API_URL =
  "https://script.google.com/macros/s/AKfycbwphhIdSMHpTWHuFrRFTC3lEZe-QQCaZr2cebxb22C0e9ph1eYPscyrxdw29T44DaUT9/exec";

export default async function handler(req, res) {

  // CORS สำหรับ Vercel origin เดียวกัน
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      status: "error",
      message: "Method not allowed"
    });
  }

  try {

    const response = await fetch(CENTRAL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(req.body)
    });

    const text = await response.text();

    let result;

    try {
      result = JSON.parse(text);
    } catch (err) {
      return res.status(502).json({
        status: "error",
        message: "Portal API returned invalid JSON",
        raw: text
      });
    }

    return res.status(200).json(result);

  } catch (err) {

    console.error("Portal API error:", err);

    return res.status(502).json({
      status: "error",
      message: "Cannot connect to Portal API",
      detail: err.message
    });
  }
}