import { Injectable } from '@nestjs/common';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as nodemailer from 'nodemailer';

@Injectable()
export class InvoiceService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: "bokhtiarbooks@gmail.com",
        pass: "qdxj xaoy vyxs jehe",
      },
    });
  }

  async generateInvoice(data: { id: number, email: string; items: any[]; total: number }): Promise<string> {
    const doc = new PDFDocument({ margin: 50 });
    const filePath = `invoices/invoice-${Date.now()}.pdf`;

    // Ensure invoice directory exists
    if (!fs.existsSync('invoices')) {
      fs.mkdirSync('invoices');
    }

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header
    const logoWidth = 120;
    const pageWidth = doc.page.width;
    const logoX = (pageWidth - logoWidth) / 2;
    doc
      .image('src/assets/elevate.png', logoX, 30, { width: logoWidth })
      .moveDown(2)
      // .fontSize(24)
      // .text('ELEVATE', { align: 'center' })
      .fontSize(14)
      .text('www.elevatenow.com', { align: 'center' })
      .moveDown(4);

    // Invoice Metadata
    doc
      .fontSize(16)
      .text(`Invoice`, { align: 'left' })
      .moveDown()
      .fontSize(12)
      .text(`Order ID: ${data.id}`)
      .text(`Email: ${data.email}`)
      .text(`Date: ${new Date().toLocaleDateString()}`)
      .moveDown();

    // Line separator
    doc
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .stroke();

    doc.moveDown(1.5);

    // Table Header
    doc.font('Helvetica-Bold');
    let startY = doc.y;

    // Header Row
    doc.text('Item', 60, startY, { width: 180, align: 'left' });
    doc.text('Qty', 250, startY, { width: 50, align: 'center' });
    doc.text('Price', 330, startY, { width: 80, align: 'right' });
    doc.text('Subtotal', 430, startY, { width: 100, align: 'right' });

    doc.moveDown(0.8);
    doc.font('Helvetica');

    // Table Content
    data.items.forEach((item) => {
      const quantity = item.quantity || 1;
      const subtotal = item.price * quantity;

      const rowY = doc.y;

      doc.text(item.name, 60, rowY, { width: 180, align: 'left' });
      doc.text(quantity.toString(), 250, rowY, { width: 50, align: 'center' });
      doc.text(`$${item.price}`, 330, rowY, { width: 80, align: 'right' });
      doc.text(`$${subtotal}`, 430, rowY, { width: 100, align: 'right' });

      doc.moveDown(0.5);
    });


    // Line separator
    doc
      .moveDown()
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .stroke();

    // Total
    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .text(`Total: $${data.total}`, 400, doc.y + 10, { align: 'right' });

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve(filePath));
      stream.on('error', (err) => reject(err));
    });
  }


  async sendInvoice(email: string, invoicePath: string) {
    const mailOptions = {
      from: 'bokhtiarbooks@gmail.com',
      to: email,
      subject: 'Your Invoice',
      text: `Hello,\n\nPlease find your invoice attached.\n\nThank you!`,
      attachments: [
        {
          filename: 'invoice.pdf',
          path: invoicePath,
        },
      ],
    };

    try {
      console.log("Sending invoice to:", email);
      console.log("Invoice path:", invoicePath);

      // Check if file exists
      if (!fs.existsSync(invoicePath)) {
        console.error('Invoice file missing at path:', invoicePath);
        throw new Error('Invoice file not found');
      }

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result);
      return { message: 'Invoice sent successfully to the provided email address' };

    } catch (error) {
      console.error('Error sending email:', error?.response || error?.message || error);
      throw new Error('Failed to send invoice');
    }
  }


  create(createInvoiceDto: CreateInvoiceDto) {
    return 'This action adds a new invoice';
  }

  findAll() {
    return `This action returns all invoice`;
  }

  findOne(id: number) {
    return `This action returns a #${id} invoice`;
  }

  update(id: number, updateInvoiceDto: UpdateInvoiceDto) {
    return `This action updates a #${id} invoice`;
  }

  remove(id: number) {
    return `This action removes a #${id} invoice`;
  }
  
}
