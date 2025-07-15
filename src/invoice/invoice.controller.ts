import { Controller, Get, Post, Body, Patch, Param, Delete, BadRequestException } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@Controller('invoice')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post('send')
  async sendMail(@Body() body: { email: string }) {
    const { email } = body;

    if (!email) {
      throw new BadRequestException('Email is required');
    }

    const invoicePath = 'E:/desktop/ElevateProject/invoice.pdf'; // Replace with a valid default path or logic to generate it
    return this.invoiceService.sendInvoice(email, invoicePath);
  }

  @Post('send-invoice')
  async sendInvoice(@Body() body: { id: number ; email: string; items: any[]; total: number }) {
    const { id, email, items, total } = body;

    if (!id || !email || !items || !total) {
      throw new BadRequestException('OrderID, Email, items, and total are required');
    }

    const invoicePath = await this.invoiceService.generateInvoice({ id, email, items, total });
    return this.invoiceService.sendInvoice(email, invoicePath);
  }


  @Post()
  create(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoiceService.create(createInvoiceDto);
  }

  @Get()
  findAll() {
    return this.invoiceService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoiceService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateInvoiceDto: UpdateInvoiceDto) {
    return this.invoiceService.update(+id, updateInvoiceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.invoiceService.remove(+id);
  }
}
