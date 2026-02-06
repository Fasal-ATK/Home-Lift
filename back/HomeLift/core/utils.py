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
    
    # --- Date ---
    date_str = booking.booking_date.strftime('%Y-%m-%d') if booking.booking_date else "N/A"
    elements.append(Paragraph(f"Date: {date_str}", normal_style))
    elements.append(Spacer(1, 12))

    # --- Customer & Provider Details (2 columns) ---
    # We can use a table for layout
    customer_info = [
        Paragraph("<b>Billed To:</b>", header_style),
        Paragraph(f"{booking.user.get_full_name()}", normal_style),
        Paragraph(f"{booking.user.email}", normal_style),
        Paragraph(f"Phone: {booking.user.phone}", normal_style)
    ]
    
    # Handle address safely
    if hasattr(booking, 'address_details') and booking.address_details:
        addr = booking.address_details
        addr_str = f"{addr.get('address_line', '')}, {addr.get('city', '')}, {addr.get('state', '')} {addr.get('postal_code', '')}"
        customer_info.append(Paragraph(addr_str, normal_style))
    elif booking.address:
         addr = booking.address
         addr_str = f"{addr.address_line}, {addr.city}, {addr.state} {addr.postal_code}"
         customer_info.append(Paragraph(f"Address: {addr_str}", normal_style))

    provider_info = []
    if booking.provider:
        provider_info = [
            Paragraph("<b>Service Provider:</b>", header_style),
            Paragraph(f"{booking.provider.get_full_name()}", normal_style),
            Paragraph(f"{booking.provider.email}", normal_style),
            Paragraph(f"Phone: {booking.provider.phone}", normal_style)
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
        ["Service Description", "Amount"],
    ]
    
    service_name = booking.service.name if booking.service else "Service"
    price = booking.price if booking.price else 0
    
    data.append([service_name, f"INR {price}"])
    
    # Total
    data.append(["", ""]) # Spacer row
    data.append(["Total", f"INR {price}"])

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
        ('ALIGN', (0, 1), (0, -1), 'LEFT'), # Description left align
        ('ALIGN', (1, 1), (1, -1), 'RIGHT'), # Price right align
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -2), 1, colors.black), # Grid for items
        
        # Total formatting
        ('LINEBELOW', (0, -2), (-1, -2), 1, colors.black), # Line above total
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('ALIGN', (1, -1), (1, -1), 'RIGHT'),
    ]))
    
    elements.append(table)
    elements.append(Spacer(1, 25))
    
    # Footer
    elements.append(Paragraph("Thank you for your business!", normal_style))
    elements.append(Paragraph("HomeLift Services", normal_style))
    
    doc.build(elements)
    buffer.seek(0)
    return buffer
