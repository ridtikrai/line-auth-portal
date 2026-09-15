const CENTRAL_API_URL =
  "https://script.google.com/macros/s/AKfycbwphhIdSMHpTWHuFrRFTC3lEZe-QQCaZr2cebxb22C0e9ph1eYPscyrxdw29T44DaUT9/exec";


async function postToPortal_(url, payload) {

  const response = await fetch(url, {
    method: "POST",

    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },

    body: JSON.stringify(payload),

    // สำคัญมากสำหรับ Google Apps Script
    redirect: "manual"
  });

  return response;
}


export default async function handler(req, res) {

  // ==========================================
  // CORS
  // ==========================================

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


  // ==========================================
  // OPTIONS
  // ==========================================

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }


  // ==========================================
  // POST ONLY
  // ==========================================

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


    console.log(
      "Portal Request:",
      payload
    );


    // ==========================================
    // 1. เรียก Portal ครั้งแรก
    // ==========================================

    let response =
      await postToPortal_(
        CENTRAL_API_URL,
        payload
      );


    console.log(
      "Portal First Response:",
      response.status
    );


    // ==========================================
    // 2. Google Apps Script Redirect
    // ==========================================

    if (
      response.status >= 300 &&
      response.status < 400
    ) {

      const location =
        response.headers.get("location");


      console.log(
        "Portal Redirect Location:",
        location
      );


      if (!location) {

        return res.status(502).json({

          status: "error",

          message:
            "Portal GAS redirect without Location header"
        });

      }


      // ========================================
      // POST ซ้ำไปยัง URL ที่ Google ส่งกลับมา
      // ========================================

      response =
        await postToPortal_(
          location,
          payload
        );


      console.log(
        "Portal Redirect Response:",
        response.status
      );

    }


    // ==========================================
    // 3. อ่าน Response
    // ==========================================

    const text =
      await response.text();


    console.log(
      "Portal GAS Response:",
      text.substring(0, 2000)
    );


    // ==========================================
    // 4. ตรวจ HTTP
    // ==========================================

    if (!response.ok) {

      return res.status(502).json({

        status: "error",

        message:
          "Portal GAS HTTP error",

        httpStatus:
          response.status,

        raw:
          text.substring(0, 2000)

      });

    }


    // ==========================================
    // 5. Parse JSON
    // ==========================================

    let result;

    try {

      result = JSON.parse(text);

    } catch (err) {

      console.error(
        "Portal GAS returned invalid JSON:",
        text.substring(0, 2000)
      );


      return res.status(502).json({

        status: "error",

        message:
          "Portal GAS returned invalid JSON",

        httpStatus:
          response.status,

        raw:
          text.substring(0, 2000)

      });

    }


    // ==========================================
    // 6. ส่งกลับ Vercel → Browser
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