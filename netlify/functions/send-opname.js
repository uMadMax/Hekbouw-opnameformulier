// Netlify Function: send-opname
// Stuurt mail via Gmail SMTP (nodemailer) met opname als HTML bijlage
// POST /api/send-opname

export default async (req) => {
  const headers = { 'Content-Type': 'application/json' };

  if (req.method === 'OPTIONS') return new Response('', { status: 200, headers });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });

  try {
    const body = await req.json();
    const { html, klantnaam, stad, onderwerp } = body;
    if (!html) return new Response(JSON.stringify({ error: 'Geen HTML ontvangen' }), { status: 400, headers });

    const smtpUser = Netlify.env.get('SMTP_USER');
    const smtpPass = Netlify.env.get('SMTP_PASS');
    if (!smtpUser || !smtpPass) return new Response(JSON.stringify({ error: 'SMTP niet geconfigureerd' }), { status: 500, headers });

    const { default: nodemailer } = await import('nodemailer');

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: smtpUser, pass: smtpPass }
    });

    const bestandsnaam = 'Opname_'
      + (klantnaam || 'klant').replace(/[^a-zA-Z0-9]/g, '_')
      + (stad ? '_' + stad.replace(/[^a-zA-Z0-9]/g, '_') : '')
      + '_' + new Date().toISOString().split('T')[0] + '.html';

    await transporter.sendMail({
      from: `"Hekbouw Opname" <${smtpUser}>`,
      to: 'max@hekbouw.com',
      subject: onderwerp || ('Opname \u2013 ' + (klantnaam || 'Klant')),
      html: `<p>Beste,</p><p>Bijgevoegd de opname voor <strong>${klantnaam || ''}${stad ? ' te ' + stad : ''}</strong>.</p><p>Open het bijgevoegde .html bestand in Chrome \u2192 Ctrl+P \u2192 Opslaan als PDF.</p>`,
      attachments: [{ filename: bestandsnaam, content: html, contentType: 'text/html; charset=utf-8' }]
    });

    return new Response(JSON.stringify({ success: true }), { status: 200, headers });

  } catch (err) {
    console.error('send-opname fout:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
};

export const config = { path: '/api/send-opname' };

