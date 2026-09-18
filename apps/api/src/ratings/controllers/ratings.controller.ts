import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RatingsService } from '../services/ratings.service';
import { CreateRatingDto } from '../dto/create-rating.dto';
import { UserRole } from '@yatra-seva/shared-types';

@Controller()
@UseGuards(JwtAuthGuard)
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  /**
   * POST /api/v1/rides/:rideId/rating
   * Submit a rating for a completed ride.
   * raterUserId is derived strictly from authenticated JWT.
   */
  @Post('rides/:rideId/rating')
  async createRating(
    @Param('rideId') rideId: string,
    @Request() req: any,
    @Body() dto: CreateRatingDto,
  ) {
    const raterUserId = req.user.userId;
    const rating = await this.ratingsService.createRating(rideId, raterUserId, dto);
    return {
      success: true,
      data: rating,
    };
  }

  /**
   * GET /api/v1/rides/:rideId/ratings
   * Get ratings associated with a specific ride.
   */
  @Get('rides/:rideId/ratings')
  async getRideRatings(
    @Param('rideId') rideId: string,
    @Request() req: any,
  ) {
    const requestingUserId = req.user.userId;
    const isAdmin = req.user.role === UserRole.ADMIN;
    const ratings = await this.ratingsService.getRideRatings(rideId, requestingUserId, isAdmin);
    return {
      success: true,
      data: ratings,
    };
  }

  /**
   * GET /api/v1/ratings/me
   * Get ratings given or received by the current authenticated user.
   */
  @Get('ratings/me')
  async getUserRatings(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user.userId;
    const result = await this.ratingsService.getUserRatings(userId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
    return {
      success: true,
      ...result,
    };
  }
}
