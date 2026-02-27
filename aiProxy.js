exports.handler = async function(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const body    = JSON.parse(event.body || "{}");
    const content = body.content || "";
    const apiKey  = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "GEMINI_API_KEY not set in Netlify environment variables" })
      };
    }

    const prompt = `You are an expert quiz maker. Extract ALL MCQ questions from the content below.

Return ONLY this JSON format, no explanation, no markdown, no backticks:
{"questions":[{"question":"Question text?","option_a":"Option 1","option_b":"Option 2","option_c":"Option 3","option_d":"Option 4","correct":"A"}]}

Rules:
- correct = only "A", "B", "C", or "D"
- Map numbered options (1/2/3/4) to (A/B/C/D)
- If answer is full text, match it to the correct letter
- Remove bullets/numbers from option text
- Skip questions with less than 4 options
- Return ONLY the JSON, nothing else

Content:
${content}`;

    const url  = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey;

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 8192 }
      })
    });

    const data = await resp.json();

    if (!resp.ok) {
      return {
        statusCode: resp.status,
        headers,
        body: JSON.stringify({ error: data.error?.message || "Gemini API error" })
      };
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return { statusCode: 200, headers, body: JSON.stringify({ text }) };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};