export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { to, subject, body } = req.body || {};
  if (!to || !subject || !body) {
    return res.status(400).json({ error: "Missing required fields (to, subject, or body)" });
  }

  // Simulate email sending on Vercel serverless platform
  console.log(`[SIMULATED EMAIL ON VERCEL] To: ${to}\nSubject: ${subject}\nBody: ${body}\n`);
  
  // Wait slightly to look realistic
  await new Promise((resolve) => setTimeout(resolve, 800));

  return res.status(200).json({ 
    success: true, 
    message: `Status report email successfully dispatched to ${to}! (Simulated Vercel outcome)` 
  });
}
