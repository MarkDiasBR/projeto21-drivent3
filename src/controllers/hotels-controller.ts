import { Response } from 'express';
import httpStatus from 'http-status';
import { hotelsService } from '@/services';
import { AuthenticatedRequest } from '@/middlewares';

export async function getAllHotels(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const hotels = await hotelsService.getAllHotels(userId);
  return res.status(httpStatus.OK).send(hotels);
}

export async function getHotelById(req: AuthenticatedRequest, res: Response) {
  const {
    userId,
    params: { hotelId },
  } = req;

  const hotel = await hotelsService.getHotelById(userId, parseInt(hotelId, 10));
  return res.status(httpStatus.OK).send(hotel);
}
