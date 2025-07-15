import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';


@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('products')
  async searchProducts(@Query('q') query: string) {
    if (!query) {
      return { message: 'Query parameter "q" is required' };
    }
    const results = await this.searchService.searchProducts(query);
    return { results };
  }

  @Get('productsByRelevance')
  async searchProductsByRelevance(@Query('q') query: string) {
    if (!query) {
      return { message: 'Query parameter "q" is required' };
    }
    const results = await this.searchService.searchProductsByRelevance(query);
    return { results };
  }

  @Get('ai-enhanced')
  async aiEnhancedSearch(@Query('q') query: string) {
    if (!query) {
      return { message: 'Query parameter "q" is required' };
    }
    const aiSuggestions = await this.searchService.aiEnhancedSearch(query);
    return { aiSuggestions };
  }

  @Get('personalized/:userId')
  async personalizedSearch(@Param('userId') userId: number, @Query('q') query: string) {
    if (!userId || !query) {
      return { message: 'Query parameters "userId" and "q" are required' };
    }
    const results = await this.searchService.personalizedSearch(userId, query);
    return { results };
  }

  @Get('recommendations/:userId')
  async recommendProducts(@Param('userId') userId: number) {
    if (!userId) {
      return { message: 'Query parameter "userId" is required' };
    }
    const recommendations = await this.searchService.recommendProducts(userId);
    return { recommendations };
  }
}