"""
Generate the PMP Application Worksheet PDF (email-gated lead magnet on
tools/pmp-application-helper).

Writes PM_Mastery_PMP_Application_Worksheet.pdf to the website repo root.

Usage:
  C:\\Users\\georg\\pmp-study-assistant\\venv\\Scripts\\python.exe scripts\\generate_application_worksheet.py

ASCII text only in the PDF. No curly quotes, em-dashes or special arrows.
"""

import os

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER

NAVY = HexColor('#3B4C8B')
GOLD = HexColor('#C9A55C')
DARK = HexColor('#2C3E50')
LIGHT_BG = HexColor('#F8F9FA')
WHITE = HexColor('#FFFFFF')
GRID = HexColor('#DEE2E6')
GRAY = HexColor('#777777')

TOTAL_PAGES = 4
PDF_NAME = 'PM_Mastery_PMP_Application_Worksheet.pdf'
REGISTER_URL = 'https://app.pmmastery.app/auth/register?utm_source=app_worksheet&utm_medium=pdf&utm_campaign=lead_magnet'

LEFT = 0.6 * inch
RIGHT = 0.6 * inch
CONTENT_W = letter[0] - LEFT - RIGHT  # 7.3in


def draw_footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(GOLD)
    canvas.setLineWidth(0.75)
    canvas.line(LEFT, 0.62 * inch, letter[0] - RIGHT, 0.62 * inch)
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(DARK)
    canvas.drawCentredString(
        letter[0] / 2, 0.47 * inch,
        f"pmmastery.app  |  PMP Application Worksheet  |  Page {doc.page} of {TOTAL_PAGES}")
    canvas.setFont('Helvetica', 6.5)
    canvas.setFillColor(GRAY)
    canvas.drawCentredString(
        letter[0] / 2, 0.34 * inch,
        "PMP, CAPM and PMI are registered marks of Project Management Institute, Inc. "
        "PM Mastery is not affiliated with or endorsed by PMI.")
    canvas.restoreState()


def create_worksheet():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    pdf_path = os.path.normpath(os.path.join(script_dir, '..', PDF_NAME))

    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        topMargin=0.55 * inch, bottomMargin=0.85 * inch,
        leftMargin=LEFT, rightMargin=RIGHT,
        title='PMP Application Worksheet (2026)',
        author='PM Mastery',
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title2', parent=styles['Title'], fontSize=22, textColor=NAVY, spaceAfter=4)
    subtitle_style = ParagraphStyle('Sub', parent=styles['Normal'], fontSize=11, textColor=GOLD,
                                    alignment=TA_CENTER, spaceAfter=14)
    h1 = ParagraphStyle('H1', parent=styles['Heading1'], fontSize=16, textColor=NAVY, spaceBefore=6, spaceAfter=8)
    h2 = ParagraphStyle('H2', parent=styles['Heading2'], fontSize=12, textColor=DARK, spaceBefore=12, spaceAfter=6)
    body = ParagraphStyle('Body', parent=styles['Normal'], fontSize=9.5, leading=13, spaceAfter=4)
    body_sm = ParagraphStyle('BodySm', parent=styles['Normal'], fontSize=8.5, leading=11, spaceAfter=3)
    source = ParagraphStyle('Source', parent=body_sm, fontSize=7.5, leading=10, textColor=GRAY, spaceBefore=6)
    bullet = ParagraphStyle('Bullet', parent=body, leftIndent=15, bulletIndent=5, bulletFontSize=8)
    cell = ParagraphStyle('Cell', parent=styles['Normal'], fontSize=9, leading=11)
    cell_head = ParagraphStyle('CellHead', parent=cell, fontName='Helvetica-Bold', textColor=WHITE, fontSize=7.5, leading=9)
    field_label = ParagraphStyle('FieldLabel', parent=body, fontName='Helvetica-Bold', textColor=NAVY, spaceAfter=0, spaceBefore=6)

    def bullets(items):
        return [Paragraph(t, bullet, bulletText='-') for t in items]

    def ruled_lines(n, height=0.27 * inch):
        t = Table([[''] for _ in range(n)], colWidths=[CONTENT_W], rowHeights=[height] * n)
        t.setStyle(TableStyle([('LINEBELOW', (0, 0), (-1, -1), 0.5, HexColor('#999999'))]))
        return t

    def blank_table(headers, col_widths, rows, row_h):
        data = [[Paragraph(h, cell_head) for h in headers]] + [[''] * len(headers) for _ in range(rows)]
        t = Table(data, colWidths=col_widths, rowHeights=[0.34 * inch] + [row_h] * rows)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), NAVY),
            ('VALIGN', (0, 0), (-1, 0), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, GRID),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ]))
        return t

    el = []

    # === PAGE 1: Which path are you on? ===
    el.append(Paragraph("PMP Application Worksheet (2026)", title_style))
    el.append(Paragraph("Plan your application on paper before you type it into PMI's form.", subtitle_style))
    el.append(Paragraph("Which path are you on?", h1))

    path_data = [
        [Paragraph('Your education', cell_head), Paragraph('Experience leading projects you need', cell_head)],
        [Paragraph('Secondary school (high school diploma, GED or equivalent)', cell), Paragraph('60 months', cell)],
        [Paragraph("Associate's degree or equivalent post-secondary program", cell), Paragraph('48 months', cell)],
        [Paragraph("Bachelor's degree or higher", cell), Paragraph('36 months', cell)],
        [Paragraph("Bachelor's or postgraduate degree from a PMI GAC-accredited program", cell), Paragraph('24 months', cell)],
    ]
    pt = Table(path_data, colWidths=[CONTENT_W - 2.4 * inch, 2.4 * inch])
    pt.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, GRID),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
        ('TOPPADDING', (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
    ]))
    el.append(pt)

    el.append(Paragraph("The rules", h2))
    el += bullets([
        "All of your experience has to fall within the 10 years before you submit your application.",
        "Months count once. If two projects ran at the same time, those months only count one time.",
        "The experience has to be leading and directing projects.",
        "You also need 35 hours of project management training. An active CAPM gives you credit for all 35.",
        "Books and practice exams alone don't count as training.",
    ])

    el.append(Spacer(1, 22))
    el.append(Paragraph(
        "My path: ________________ &nbsp;&nbsp; Months I need: ______ &nbsp;&nbsp; Months I have: ______",
        ParagraphStyle('Fill', parent=body, fontSize=10.5, leading=16)))
    el.append(Paragraph(
        "Checked against PMI's PMP Examination Content Outline (July 2026), pages 13-14. "
        "PMI's rules win. Check pmi.org before you apply.", source))

    el.append(PageBreak())

    # === PAGE 2: Experience log ===
    el.append(Paragraph("Experience log", h1))
    widths = [0.3, 1.2, 1.0, 1.2, 0.7, 0.7, 0.5, 0.6, 1.1]
    widths = [w * inch for w in widths]
    log_headers = ['#', 'Organization', 'Job title', 'Project', 'Start (MM/YYYY)', 'End (MM/YYYY)',
                   'Months', 'Overlaps with #', 'Who can verify it']
    log = blank_table(log_headers, widths, 10, 0.5 * inch)
    # number the rows
    for i in range(1, 11):
        log._cellvalues[i][0] = Paragraph(str(i), cell)
    el.append(log)
    el.append(Spacer(1, 12))
    el.append(Paragraph(
        "Total non-overlapping months: ______ &nbsp;&nbsp;&nbsp; Needed for my path: ______",
        ParagraphStyle('Fill2', parent=body, fontSize=10.5, leading=16)))
    el.append(Paragraph(
        "<b>Tip:</b> \"Who can verify it\" = a supervisor or manager who can sign off if you're audited.", body))

    el.append(PageBreak())

    # === PAGE 3: Project summary planner ===
    el.append(Paragraph("Project summary planner", h1))
    el.append(Paragraph("One per project. Print more copies as you need them.", body))

    def field(label, lines):
        return KeepTogether([Paragraph(label, field_label), ruled_lines(lines)])

    el.append(field("Project name / Organization", 1))
    el.append(field("Dates", 1))
    el.append(field("The objective", 3))
    el.append(field("Your role", 2))
    el.append(field("What you led and did", 6))
    el.append(field("The outcome", 3))
    wc = Table([[Paragraph("Word count", field_label), '']], colWidths=[1.0 * inch, 1.6 * inch], rowHeights=[0.27 * inch])
    wc.setStyle(TableStyle([('LINEBELOW', (1, 0), (1, 0), 0.5, HexColor('#999999')), ('VALIGN', (0, 0), (-1, -1), 'BOTTOM'),
                            ('LEFTPADDING', (0, 0), (0, 0), 0)]))
    wc.hAlign = 'LEFT'
    el.append(Spacer(1, 4))
    el.append(wc)
    el.append(Paragraph("PMI's form sets a length limit for each summary. Count your words before you paste.", source))

    el.append(PageBreak())

    # === PAGE 4: Training hours and audit prep ===
    el.append(Paragraph("Training hours and audit prep", h1))
    tw = [1.8, 2.2, 1.2, 0.7, 1.4]
    tw = [w * inch for w in tw]
    train = blank_table(['Provider', 'Course', 'Dates', 'Hours', 'Certificate on file?'], tw, 6, 0.36 * inch)
    el.append(train)
    el.append(Spacer(1, 8))
    el.append(Paragraph("Total hours: ______ / 35", ParagraphStyle('Fill3', parent=body, fontSize=10.5, leading=16)))

    el.append(Paragraph("If you're audited, PMI asks for:", h2))
    el += bullets([
        "A copy of your diploma or degree",
        "Signatures from a supervisor or manager for each experience entry",
        "Certificates or letters from your training providers for the hours you listed",
    ])
    el.append(Paragraph("Good to know", h2))
    el += bullets([
        "You get 90 days to send your audit documents.",
        "Your 1-year window to take the exam starts after you're approved (after the audit, if you're picked).",
    ])
    el.append(Paragraph("Audit details from PMI's Certification Handbook (revised June 2026), pages 5-6.", source))
    el.append(Spacer(1, 18))

    box_style = ParagraphStyle('Box', parent=body, fontSize=11, leading=15, textColor=DARK, alignment=TA_CENTER)
    box_text = (
        "Once you're approved, the clock starts. Practice with 100 free PMP questions built for the 2026 exam: "
        f"<link href=\"{REGISTER_URL}\" color=\"#3B4C8B\"><u>app.pmmastery.app</u></link>"
    )
    box = Table([[Paragraph(box_text, box_style)]], colWidths=[CONTENT_W])
    box.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 1.5, GOLD),
        ('BACKGROUND', (0, 0), (-1, -1), HexColor('#FFF8E7')),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('LEFTPADDING', (0, 0), (-1, -1), 16),
        ('RIGHTPADDING', (0, 0), (-1, -1), 16),
    ]))
    el.append(box)

    doc.build(el, onFirstPage=draw_footer, onLaterPages=draw_footer)
    print(f"[OK] PDF created: {pdf_path}")
    print("Commit the PDF and this script, staged by name (never git add .).")


if __name__ == '__main__':
    create_worksheet()
