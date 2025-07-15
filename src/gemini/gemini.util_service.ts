// src/utils/product-query-parser.service.ts
import { Injectable } from '@nestjs/common';

interface Product {
  name: string;
  slug: string;
  category: string;
}

@Injectable()
export class ProductQueryParserService {
  public normalize(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/gi, '') // remove punctuation
      .replace(/\b(pair of|set of|piece of|buy|order|get|purchase|pair)\b/g, '')
      .replace(/\s+/g, ' ') // remove extra spaces
      .trim();
  }

  matchProductFromQuery(query: string, products: Product[]): Product | null {
    const cleanedQuery = this.normalize(query);

    // Try direct match first
    const exactMatch = products.find(
      (p) =>
        this.normalize(p.name) === cleanedQuery ||
        this.normalize(p.slug) === cleanedQuery
    );
    if (exactMatch) return exactMatch;

    // Try partial match
    return (
      products.find((p) => cleanedQuery.includes(this.normalize(p.name))) ||
      products.find((p) => cleanedQuery.includes(this.normalize(p.slug))) ||
      null
    );
  }

  // Optional helper: extract likely product keyword
  extractLikelyProductName(query: string): string {
    const match = query.match(/(?:buy|order|get|purchase)?\s*(?:\d+\s*)?(.*)/i);
    return match?.[1]?.trim() || '';
  }
}
