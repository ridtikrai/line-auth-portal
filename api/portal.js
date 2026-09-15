const CENTRAL_API_URL =
  "https://script.google.com/macros/s/AKfycbwphhIdSMHpTWHuFrRFTC3lEZe-QQCaZr2cebxb22C0e9ph1eYPscyrxdw29T44DaUT9/exec";

export default async function handler(req, res) {

  // ================================
  // CORS
  // ================================

  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  // ================================
  // OPTIONS
  // ================================

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // ================================
  // POST only
  // ================================

  if (req.method !== "POST") {
    return res.status(405).json({
      status: "error",
      message: "Method not allowed"
    });
  }

  try {

    const payload =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : (req.body || {});

    console.log("Portal Request:", payload);

    // ==========================================
    // เรียก Google Apps Script
    // ==========================================

    const response = await fetch(CENTRAL_API_URL, {
      method: "POST",

      headers: {
        "Content-Type":
          "text/plain;charset=utf-8"
      },

      body: JSON.stringify(payload),

      // สำคัญ
      redirect: "follow"
    });

    console.log(
      "Portal GAS HTTP Status:",
      response.status
    );

    console.log(
      "Portal GAS Final URL:",
      response.url
    );

    const text = await response.text();

    console.log(
      "Portal GAS Response:",
      text.substring(0, 1000)
    );

    // ==========================================
    // ตรวจ JSON
    // ==========================================

    let result;

    try {

      result = JSON.parse(text);

    } catch (parseError) {

      console.error(
        "Portal GAS returned non-JSON:",
        text.substring(0, 2000)
      );

      return res.status(502).json({

        status: "error",

        message:
          "Portal GAS returned invalid JSON",

        httpStatus:
          response.status,

        finalUrl:
          response.url,

        raw:
          text.substring(0, 2000)
      });
    }

    // ==========================================
    // ส่งผลกลับ Browser
    // ==========================================

    return res.status(200).json(result);

  } catch (error) {

    console.error(
      "Portal Proxy Error:",
      error
    );

    return res.status(502).json({

      status: "error",

      message:
        "Cannot connect to Portal API",

      detail:
        error.message
    });
  }
}