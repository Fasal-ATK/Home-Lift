import io
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.units import inch

def generate_invoice_pdf(booking):
    """
    Generate a PDF invoice for the given booking.
    Returns a BytesIO object containing the PDF data.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    
    styles = getSampleStyleSheet()
    # reliable styles
    title_style = styles['Heading1']
    normal_style = styles['Normal']
    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        spaceAfter=6
    )

    # --- Header ---
    elements.append(Paragraph(f"INVOICE #{booking.id}", title_style))
    elements.append(Spacer(1, 12))
    
    # --- Date & Status ---
    date_str = booking.booking_date.strftime('%Y-%m-%d') if booking.booking_date else "N/A"
    elements.append(Paragraph(f"Booking Date: {date_str}", normal_style))
    
    status_display = booking.status.replace('_', ' ').title()
    if booking.is_refunded:
        status_display += " (REFUNDED)"
    
    elements.append(Paragraph(f"Status: <b>{status_display}</b>", normal_style))
    elements.append(Spacer(1, 12))

    # --- Customer & Provider Details (2 columns) ---
    customer_info = [
        Paragraph("<b>Billed To:</b>", header_style),
        Paragraph(f"{booking.user.get_full_name()}", normal_style),
        Paragraph(f"{booking.user.email}", normal_style),
        Paragraph(f"Phone: {booking.user.phone}", normal_style)
    ]
    
    # Handle address safely
    addr_str = "N/A"
    if hasattr(booking, 'address_details') and booking.address_details:
        addr = booking.address_details
        addr_str = f"{addr.get('address_line', '')}, {addr.get('city', '')}, {addr.get('state', '')} {addr.get('postal_code', '')}"
    elif hasattr(booking, 'address') and booking.address:
        a = booking.address
        if hasattr(a, 'address_line'): # it's an object
            addr_str = f"{a.address_line}, {a.city}, {a.state} {a.postal_code}"
        else: # it's a string
            addr_str = str(a)
    
    customer_info.append(Paragraph(f"Address: {addr_str}", normal_style))

    provider_info = []
    if booking.provider:
        provider_info = [
            Paragraph("<b>Service Provider:</b>", header_style),
            Paragraph(f"{booking.provider.get_full_name()}", normal_style),
            Paragraph(f"{booking.provider.email}", normal_style),
            Paragraph(f"Phone: {booking.provider.phone}", normal_style)
        ]
    else:
        provider_info = [
            Paragraph("<b>Service Provider:</b>", header_style),
            Paragraph("Not Assigned", normal_style)
        ]
    
    # Table data for layout
    info_data = [[customer_info, provider_info]]
    info_table = Table(info_data, colWidths=[3.5*inch, 3.5*inch])
    info_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 25))

    # --- Service Details Table ---
    data = [
        ["Description", "Amount"],
    ]
    
    service_name = booking.service.name if booking.service else "Service"
    price = booking.price if booking.price else 0
    advance = booking.advance if booking.advance else 0
    remaining = price - advance
    
    data.append([service_name, f"INR {price:.2f}"])
    
    # Breakdown
    data.append(["", ""]) # Spacer
    data.append(["Subtotal", f"INR {price:.2f}"])
    
    advance_label = "Advance Paid"
    if booking.is_refunded:
        advance_label = "Advance Refunded (Wallet)"
        
    data.append([advance_label, f"- INR {advance:.2f}"])
    
    data.append(["", ""]) # Spacer
    data.append(["REMAINING BALANCE", f"INR {remaining:.2f}"])

    table = Table(data, colWidths=[5*inch, 2*inch])
    table.setStyle(TableStyle([
        # Header formatting
        ('BACKGROUND', (0, 0), (1, 0), colors.HexColor('#f0f0f0')),
        ('TEXTCOLOR', (0, 0), (1, 0), colors.black),
        ('ALIGN', (0, 0), (1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (1, 0), 12),
        
        # Data formatting
        ('ALIGN', (0, 1), (0, -1), 'LEFT'),
        ('ALIGN', (1, 1), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        
        # Grid
        ('LINEBELOW', (0, 0), (-1, 0), 1, colors.black),
        ('LINEBELOW', (0, -3), (-1, -3), 0.5, colors.grey), # above Advance Paid
        ('LINEBELOW', (0, -1), (-1, -1), 1, colors.black), # below Remaining
        
        # Grand Total highlighting
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0, -1), (-1, -1), colors.darkblue),
        ('FONTSIZE', (0, -1), (-1, -1), 11),
    ]))
    
    elements.append(table)
    elements.append(Spacer(1, 15))
    
    # Payment Summary Note
    payment_note = ""
    if booking.is_refunded:
        payment_note = "Note: The advance payment has been refunded to your wallet due to cancellation."
    elif booking.is_advance_paid:
        payment_note = "Advance payment received successfully. Remaining balance to be paid upon service completion."
    else:
        payment_note = "Advance payment pending."
        
    elements.append(Paragraph(f"<i>{payment_note}</i>", ParagraphStyle('Note', parent=normal_style, fontSize=9, italic=True)))
    
    elements.append(Spacer(1, 25))
    
    # Footer
    elements.append(Paragraph("Thank you for choosing HomeLift!", normal_style))
    elements.append(Paragraph("For any queries, contact support@homelift.com", ParagraphStyle('Small', parent=normal_style, fontSize=8)))
    
    doc.build(elements)
    buffer.seek(0)
    return buffer
