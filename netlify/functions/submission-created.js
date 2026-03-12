const sgMail = require('@sendgrid/mail');

exports.handler = async function(event, context) {
  const payload = JSON.parse(event.body).payload;
  const email = payload.data.email;
  const name = payload.data.name || 'PMP Student';
  const formName = payload.form_name;

  // Only send cheat sheet for exit-popup and newsletter forms
  if (formName !== 'exit-popup' && formName !== 'newsletter') {
    return { statusCode: 200, body: 'Skipped: not a cheat sheet form' };
  }

  // Set SendGrid API key
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const msg = {
    to: email,
    from: {
      email: 'ben@pmmastery.app',
      name: 'Ben from PM Mastery'
    },
    replyTo: 'support@pmmastery.app',
    subject: 'Your Free PMP Cheat Sheet is Here!',
    html: 
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 20px 0;">
          <h1 style="color: #3B4C8B; margin: 0;">PM Mastery</h1>
          <p style="color: #C9A55C; font-weight: 600; margin: 5px 0 0;">Your PMP Exam Prep Partner</p>
        </div>

        <div style="background: linear-gradient(135deg, #3B4C8B 0%, #5D6FB5 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
          <h2 style="margin: 0 0 10px; color: white;">Hey ! Your cheat sheet is ready.</h2>
          <p style="margin: 0; opacity: 0.9;">Everything you need on one page for the 2026 PMP exam.</p>
        </div>

        <div style="background: #f8f9fc; padding: 24px; border-radius: 8px; border-left: 4px solid #C9A55C; margin-bottom: 24px;">
          <h3 style="color: #3B4C8B; margin: 0 0 12px;">What's in your cheat sheet:</h3>
          <ul style="color: #444; line-height: 1.8; padding-left: 20px; margin: 0;">
            <li>All EVM formulas (PV, EV, AC, CPI, SPI, EAC, ETC, VAC, TCPI)</li>
            <li>PERT estimation formula</li>
            <li>12 PMBOK 8th Edition Principles</li>
            <li>8 Performance Domains</li>
            <li>2026 ECO domain weights (People 33%, Process 41%, BE 26%)</li>
            <li>Exam day tips and strategies</li>
          </ul>
        </div>

        <div style="text-align: center; margin-bottom: 24px;">
          <a href="https://pmmastery.app/PM_Mastery_2026_PMP_Cheat_Sheet.pdf"
             style="display: inline-block; background: linear-gradient(135deg, #C9A55C, #d4b36f); color: #3B4C8B; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 1.1rem;">
            Download Your Cheat Sheet
          </a>
        </div>

        <div style="background: #fff; padding: 20px; border: 2px solid #C9A55C; border-radius: 8px; text-align: center; margin-bottom: 24px;">
          <h3 style="color: #3B4C8B; margin: 0 0 8px;">Ready to go deeper?</h3>
          <p style="color: #666; margin: 0 0 16px;">PM Mastery has 4,500+ practice questions, 40 case studies, and mock exams built for the 2026 PMP exam.</p>
          <a href="https://app.pmmastery.app/auth/register?utm_source=cheatsheet&utm_medium=email&utm_campaign=lead_magnet"
             style="display: inline-block; background: #3B4C8B; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Start Free - 100 Questions Included
          </a>
        </div>

        <div style="text-align: center; color: #999; font-size: 0.8rem; padding-top: 20px; border-top: 1px solid #eee;">
          <p>PM Mastery Solutions, LLC | New Orleans, LA</p>
          <p>You received this because you downloaded our PMP cheat sheet.</p>
          <p><a href="https://pmmastery.app" style="color: #C9A55C;">pmmastery.app</a></p>
        </div>
      </div>
    
  };

  try {
    await sgMail.send(msg);
    console.log('Cheat sheet email sent to: ' + email);
    return { statusCode: 200, body: 'Email sent successfully' };
  } catch (error) {
    console.error('SendGrid error:', error.response ? error.response.body : error);
    return { statusCode: 500, body: 'Failed to send email' };
  }
};
