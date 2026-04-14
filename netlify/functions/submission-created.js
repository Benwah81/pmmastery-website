const sgMail = require('@sendgrid/mail');

exports.handler = async function(event, context) {
  const payload = JSON.parse(event.body).payload;
  const email = payload.data.email;
  const name = payload.data.name || 'PMP Student';
  const formName = payload.form_name;

  console.log(`Form submission received: ${formName} from ${email} (${name})`);

  // Set SendGrid API key
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  // Build email based on form type
  let msg;

  if (formName === '5day-course') {
    // 5-Day Course signup — send Day 1 welcome
    msg = {
      to: email,
      from: { email: 'ben@pmmastery.app', name: 'Ben from PM Mastery' },
      replyTo: 'support@pmmastery.app',
      subject: 'Day 1: The 2026 PMP Exam Breakdown',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #3B4C8B; margin: 0;">PM Mastery</h1>
            <p style="color: #C9A55C; font-weight: 600; margin: 5px 0 0;">5 Days to PMP Readiness</p>
          </div>

          <div style="background: linear-gradient(135deg, #3498DB 0%, #2980B9 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
            <h2 style="margin: 0 0 10px; color: white;">Day 1: The 2026 Exam Breakdown</h2>
            <p style="margin: 0; opacity: 0.9;">Hey ${name}! Welcome to the course. Let's start with what changed.</p>
          </div>

          <div style="padding: 0 10px; color: #333; line-height: 1.7;">
            <p>The PMP exam is changing in 2026, and it's a big shift. Here's what you need to know:</p>

            <h3 style="color: #3B4C8B;">New Domain Weights</h3>
            <p>The 2026 ECO (Examination Content Outline) restructures the exam into three domains:</p>
            <ul>
              <li><strong>People (33%)</strong> — Team leadership, conflict management, stakeholder engagement</li>
              <li><strong>Process (41%)</strong> — Planning, executing, monitoring across predictive and agile</li>
              <li><strong>Business Environment (26%)</strong> — Up from 8%! Benefits realization, compliance, organizational change</li>
            </ul>

            <h3 style="color: #3B4C8B;">PMBOK 8th Edition</h3>
            <p>The new exam references PMBOK 8th Edition, which shifts from process groups to <strong>12 Principles</strong> and <strong>8 Performance Domains</strong>. It's more principle-based and less prescriptive.</p>

            <h3 style="color: #3B4C8B;">What This Means for You</h3>
            <p>Focus your study time on agile/hybrid (60%+ of questions), the Business Environment domain (biggest increase), and understanding <em>why</em> behind project decisions, not just <em>what</em>.</p>

            <div style="background: #f0f4ff; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3498DB;">
              <strong>Tomorrow's lesson:</strong> The formulas you actually need for exam day — EVM, PERT, EMV, and memory tricks to lock them in.
            </div>
          </div>

          <div style="text-align: center; margin: 24px 0;">
            <a href="https://app.pmmastery.app/auth/register?utm_source=5day_course&utm_medium=email&utm_campaign=day1"
               style="display: inline-block; background: #3B4C8B; color: white; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Start Practicing Free — 100 Questions Included
            </a>
          </div>

          <div style="text-align: center; color: #999; font-size: 0.8rem; padding-top: 20px; border-top: 1px solid #eee;">
            <p>PM Mastery Solutions, LLC | New Orleans, LA</p>
            <p>You signed up for the 5 Days to PMP Readiness course.</p>
            <p><a href="https://pmmastery.app" style="color: #C9A55C;">pmmastery.app</a></p>
          </div>
        </div>
      `
    };

  } else if (formName === 'cheatsheet' || formName === 'exit-popup' || formName === 'newsletter') {
    // Cheat sheet / newsletter forms — send cheat sheet PDF
    msg = {
      to: email,
      from: { email: 'ben@pmmastery.app', name: 'Ben from PM Mastery' },
      replyTo: 'support@pmmastery.app',
      subject: 'Your Free PMP Cheat Sheet is Here!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #3B4C8B; margin: 0;">PM Mastery</h1>
            <p style="color: #C9A55C; font-weight: 600; margin: 5px 0 0;">Your PMP Exam Prep Partner</p>
          </div>

          <div style="background: linear-gradient(135deg, #3B4C8B 0%, #5D6FB5 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
            <h2 style="margin: 0 0 10px; color: white;">Hey ${name}! Your cheat sheet is ready.</h2>
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
      `
    };

  } else if (formName === 'blog-newsletter') {
    // Blog newsletter — send welcome + cheat sheet
    msg = {
      to: email,
      from: { email: 'ben@pmmastery.app', name: 'Ben from PM Mastery' },
      replyTo: 'support@pmmastery.app',
      subject: 'Welcome to the PM Mastery Newsletter!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #3B4C8B; margin: 0;">PM Mastery</h1>
            <p style="color: #C9A55C; font-weight: 600; margin: 5px 0 0;">Your PMP Exam Prep Partner</p>
          </div>

          <div style="background: linear-gradient(135deg, #3B4C8B 0%, #5D6FB5 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
            <h2 style="margin: 0 0 10px; color: white;">You're on the list!</h2>
            <p style="margin: 0; opacity: 0.9;">Weekly PMP strategies and study tips, straight to your inbox.</p>
          </div>

          <div style="padding: 0 10px; color: #333; line-height: 1.7;">
            <p>Thanks for subscribing! As a welcome gift, here's our free 2-page PMP cheat sheet:</p>
          </div>

          <div style="text-align: center; margin: 24px 0;">
            <a href="https://pmmastery.app/PM_Mastery_2026_PMP_Cheat_Sheet.pdf"
               style="display: inline-block; background: linear-gradient(135deg, #C9A55C, #d4b36f); color: #3B4C8B; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 1.1rem;">
              Download Your Cheat Sheet
            </a>
          </div>

          <div style="text-align: center; margin: 24px 0;">
            <a href="https://app.pmmastery.app/auth/register?utm_source=blog_newsletter&utm_medium=email&utm_campaign=welcome"
               style="display: inline-block; background: #3B4C8B; color: white; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Start Practicing Free — 100 Questions Included
            </a>
          </div>

          <div style="text-align: center; color: #999; font-size: 0.8rem; padding-top: 20px; border-top: 1px solid #eee;">
            <p>PM Mastery Solutions, LLC | New Orleans, LA</p>
            <p>You subscribed to the PM Mastery blog newsletter.</p>
            <p><a href="https://pmmastery.app" style="color: #C9A55C;">pmmastery.app</a></p>
          </div>
        </div>
      `
    };

  } else {
    console.log(`Unhandled form: ${formName}`);
    return { statusCode: 200, body: `Skipped: unhandled form '${formName}'` };
  }

  // Also send lead notification to Ben
  const notifyMsg = {
    to: 'ben@pmmastery.app',
    from: { email: 'noreply@pmmastery.app', name: 'PM Mastery' },
    subject: `New PM Mastery Lead: ${formName}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #3B4C8B;">New Lead from ${formName}</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Form:</strong> ${formName}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })}</p>
      </div>
    `
  };

  try {
    // Send both: the user email and the notification to Ben
    await Promise.all([
      sgMail.send(msg),
      sgMail.send(notifyMsg)
    ]);
    console.log(`Emails sent for ${formName}: user=${email}, notification=ben@pmmastery.app`);

    // For 5-day course signups, register in Railway DB so cron can send Days 2-5
    if (formName === '5day-course') {
      try {
        const courseApiKey = process.env.COURSE_API_KEY;
        if (courseApiKey) {
          const response = await fetch('https://app.pmmastery.app/api/course-signup', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': courseApiKey
            },
            body: JSON.stringify({ email, name, source: '5day-course' })
          });
          const result = await response.json();
          console.log(`Course signup registered: ${JSON.stringify(result)}`);
        } else {
          console.warn('COURSE_API_KEY not set, skipping course signup registration');
        }
      } catch (regError) {
        // Don't fail the whole function if registration fails
        console.error('Course signup registration error:', regError);
      }
    }

    // Schedule cheat sheet lead nurture drip (SendGrid send_at)
    if (formName === 'cheatsheet' || formName === 'exit-popup') {
      try {
        const now = Math.floor(Date.now() / 1000);

        // Email 2: Practice question teaser (24 hours later)
        const drip2 = {
          to: email,
          from: { email: 'ben@pmmastery.app', name: 'Ben from PM Mastery' },
          replyTo: 'support@pmmastery.app',
          subject: 'Can you spot the trap in this PMP question?',
          send_at: now + 86400,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; padding: 20px 0;">
                <h1 style="color: #3B4C8B; margin: 0;">PM Mastery</h1>
              </div>
              <div style="padding: 0 10px; color: #333; line-height: 1.7;">
                <p>Hey ${name},</p>
                <p>Quick scenario for you:</p>
                <blockquote style="border-left: 4px solid #C9A55C; padding: 12px 16px; background: #f8f9fa; margin: 16px 0; font-style: italic;">
                  A senior stakeholder has been giving requirements directly to your development team without going through the change control process. The team already started working on two requests. What should you do FIRST?
                </blockquote>
                <p><strong>A.</strong> Escalate to the project sponsor<br>
                <strong>B.</strong> Meet with the stakeholder to discuss the process<br>
                <strong>C.</strong> Evaluate the impact of the unauthorized changes<br>
                <strong>D.</strong> Tell the team to stop working on the requests</p>
                <p>Most experienced PMs pick B or D. But PMI wants C — <strong>assess before you act.</strong></p>
                <p>This is exactly the kind of trap the PMP exam sets. Real-world instincts lead you to the wrong answer.</p>
                <p>We wrote up 5 of these tricky questions with full explanations:</p>
                <div style="text-align: center; margin: 24px 0;">
                  <a href="https://pmmastery.app/blog/5-pmp-questions-that-trip-up-experienced-pms?utm_source=drip&utm_medium=email&utm_campaign=cheatsheet_nurture"
                     style="display: inline-block; background: #3B4C8B; color: white; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                    Read All 5 Questions →
                  </a>
                </div>
                <p style="color: #999; font-size: 0.85rem;">— Ben, PM Mastery</p>
              </div>
              <div style="text-align: center; color: #999; font-size: 0.8rem; padding-top: 20px; border-top: 1px solid #eee;">
                <p>PM Mastery Solutions, LLC | New Orleans, LA</p>
                <p><a href="https://pmmastery.app" style="color: #C9A55C;">pmmastery.app</a></p>
              </div>
            </div>
          `
        };

        // Email 3: Signup nudge (72 hours later)
        const drip3 = {
          to: email,
          from: { email: 'ben@pmmastery.app', name: 'Ben from PM Mastery' },
          replyTo: 'support@pmmastery.app',
          subject: 'Your cheat sheet + 100 free practice questions',
          send_at: now + 259200,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; padding: 20px 0;">
                <h1 style="color: #3B4C8B; margin: 0;">PM Mastery</h1>
              </div>
              <div style="padding: 0 10px; color: #333; line-height: 1.7;">
                <p>Hey ${name},</p>
                <p>A few days ago you grabbed our PMP cheat sheet — nice move. That two-pager covers the formulas and principles you'll need on exam day.</p>
                <p>But formulas alone won't pass the exam. The 2026 PMP is 70-80% situational questions where you have to <strong>think like PMI thinks</strong>.</p>
                <p>That's what practice questions are for. And we have 4,500+ of them.</p>
                <p>Here's what you get free — no credit card:</p>
                <ul>
                  <li><strong>100 practice questions</strong> aligned with the 2026 ECO</li>
                  <li><strong>AI Coach</strong> that explains any answer (3 questions/day)</li>
                  <li><strong>Basic flashcards</strong> and formula calculator</li>
                  <li><strong>2026 ECO reference</strong> page</li>
                </ul>
                <div style="text-align: center; margin: 24px 0;">
                  <a href="https://app.pmmastery.app/auth/register?utm_source=drip&utm_medium=email&utm_campaign=cheatsheet_nurture_day3"
                     style="display: inline-block; background: linear-gradient(135deg, #C9A55C, #d4b36f); color: #3B4C8B; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 1.1rem;">
                    Start Practicing Free →
                  </a>
                </div>
                <p style="color: #999; font-size: 0.85rem;">— Ben, PM Mastery</p>
              </div>
              <div style="text-align: center; color: #999; font-size: 0.8rem; padding-top: 20px; border-top: 1px solid #eee;">
                <p>PM Mastery Solutions, LLC | New Orleans, LA</p>
                <p><a href="https://pmmastery.app" style="color: #C9A55C;">pmmastery.app</a></p>
              </div>
            </div>
          `
        };

        await Promise.all([
          sgMail.send(drip2),
          sgMail.send(drip3)
        ]);
        console.log(`Drip emails scheduled for ${email}: +24h and +72h`);
      } catch (dripError) {
        // Don't fail the main function if drip scheduling fails
        console.error('Drip scheduling error:', dripError.response ? dripError.response.body : dripError);
      }
    }

    return { statusCode: 200, body: 'Emails sent successfully' };
  } catch (error) {
    console.error('SendGrid error:', error.response ? error.response.body : error);
    return { statusCode: 500, body: 'Failed to send email' };
  }
};
