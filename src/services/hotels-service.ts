import { notFoundError, paymentRequiredError } from '@/errors';
import { enrollmentRepository, ticketsRepository } from '@/repositories';
import { hotelsRepository } from '@/repositories/hotels-repository';

async function getAllHotels(userId: number) {
  await hasHotelsOption(userId);
  const hotels = await hotelsRepository.getAllHotels();
  if (hotels.length === 0) {
    throw notFoundError();
  }
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
  const ticket = await ticketsRepository.findTicketByEnrollmentId(enrollment.id);
  if (!ticket.TicketType.includesHotel) {
    throw paymentRequiredError();
  }
  return hotels;
}

async function hasHotelsOption(userId: number) {
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
  if (!enrollment) {
    throw notFoundError();
  }

  const ticket = await ticketsRepository.findTicketByEnrollmentId(enrollment.id);
  if (!ticket) {
    throw notFoundError();
  }
  if (ticket.TicketType.isRemote || !ticket.TicketType.includesHotel || ticket.status === 'RESERVED') {
    throw paymentRequiredError();
  }
}

async function getHotelById(userId: number, hotelId: number) {
  await hasHotelsOption(userId);
  const hotel = await hotelsRepository.getHotelById(hotelId);
  if (!hotel) {
    throw notFoundError();
  }
  return hotel;
}

export const hotelsService = {
  getAllHotels,
  getHotelById,
};
