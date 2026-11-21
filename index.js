export default async function handler(req, res) {
  // CORS headers taake teri website kahin se bhi isay call kar sake
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Sirf POST request allowed hai' });
  }

  try {
    // Teri AQ. wali API key Vercel Environment Variable se aayegi (100% safe!)
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
      return res.status(500).json({ error: 'Server par GEMINI_API_KEY set nahi hai!' });
    }

    const { prompt, audioBase64, mimeType } = req.body;

    // AQ. wali keys ke liye Google AI / Vertex Express endpoint
    const url = `https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

    const parts = [{ text: prompt }];
    if (audioBase64 && mimeType) {
      parts.push({
        inline_data: {
          mime_type: mimeType,
          data: audioBase64
        }
      });
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || 'Google API Error'
      });
    }

    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.status(200).json({ result: resultText });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
