import { prisma } from '@/config';

async function getAllHotels() {
  return await prisma.hotel.findMany();
}

async function getHotelById(hotelId: number) {
  return await prisma.hotel.findFirst({
    where: {
      id: hotelId,
    },
    include: {
      Rooms: true,
    },
  });
}

export const hotelsRepository = {
  getAllHotels,
  getHotelById,
};
