import supertest from 'supertest';
import httpStatus from 'http-status';
import { TicketStatus } from '@prisma/client';
import { cleanDb, generateValidToken } from '../helpers';
import {
  createUser,
  createTicket,
  createTicketType,
  createRemoteTicketType,
  createPresentialWithHotelTicketType,
  createPresentialWithoutHotelTicketType,
  createEnrollmentWithAddress,
  createPayment,
  createHotel,
  createRoom,
} from '../factories';
import app, { init } from '@/app';

beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await cleanDb();
});

const server = supertest(app);

describe('GET /hotels', () => {
  it('should return status code 401 if token not sent', async () => {
    const { status } = await server.get('/hotels');
    expect(status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should return status code 401 if token is invalid', async () => {
    const { status } = await server.get('/hotels').set('Authorization', 'Bearer FakeToken');
    expect(status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should return status code 402 if the ticket is remote', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createRemoteTicketType();
    const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    await createPayment(ticket.id, ticketType.price);
    const { status } = await server.get('/hotels').set('Authorization', `Bearer ${token}`);
    expect(status).toBe(httpStatus.PAYMENT_REQUIRED);
  });

  it('should return status code 402 if the ticket is not paid', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketType();
    await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
    const { status } = await server.get('/hotels').set('Authorization', `Bearer ${token}`);
    expect(status).toBe(httpStatus.PAYMENT_REQUIRED);
  });

  it("should return status code 402 if the ticket doesn't include a hotel", async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createPresentialWithoutHotelTicketType();
    const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    await createPayment(ticket.id, ticketType.price);
    const { status } = await server.get('/hotels').set('Authorization', `Bearer ${token}`);
    expect(status).toBe(httpStatus.PAYMENT_REQUIRED);
  });

  it("should return status code 404 when there's no enrollment", async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    await createTicketType();
    const { status } = await server.get('/hotels').set('Authorization', `Bearer ${token}`);
    expect(status).toBe(httpStatus.NOT_FOUND);
  });

  it("should return status code 404 when there's no ticket type", async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    await createEnrollmentWithAddress(user);
    const { status } = await server.get('/hotels').set('Authorization', `Bearer ${token}`);
    expect(status).toBe(httpStatus.NOT_FOUND);
  });

  it("should return status code 404 when there's no ticket", async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    await createEnrollmentWithAddress(user);
    await createTicketType();
    const { status } = await server.get('/hotels').set('Authorization', `Bearer ${token}`);
    expect(status).toBe(httpStatus.NOT_FOUND);
  });

  it("should return status code 404 when there's no hotel available", async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createPresentialWithHotelTicketType();
    const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    await createPayment(ticket.id, ticketType.price);
    const { status } = await server.get('/hotels').set('Authorization', `Bearer ${token}`);
    expect(status).toBe(httpStatus.NOT_FOUND);
  });

  it('should return status code 200 and should return the expected hotels in an array of objects', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createPresentialWithHotelTicketType();
    const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    const hotel = await createHotel();
    await createPayment(ticket.id, ticketType.price);
    const { status, body } = await server.get('/hotels').set('Authorization', `Bearer ${token}`);
    expect(status).toBe(httpStatus.OK);
    expect(body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ...hotel,
          createdAt: hotel.createdAt.toISOString(),
          updatedAt: hotel.updatedAt.toISOString(),
        }),
      ]),
    );
  });
});

describe('GET /hotels/:hotelId', () => {
  it('should return status code 401 if token not sent', async () => {
    const { status } = await server.get('/hotels/1234');
    expect(status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should return status code 401 if token is invalid', async () => {
    const { status } = await server.get('/hotels/1234').set('Authorization', 'Bearer FakeToken');
    expect(status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should return status code 402 if the ticket is remote', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createRemoteTicketType();
    const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    await createPayment(ticket.id, ticketType.price);
    const { status } = await server.get('/hotels/1234').set('Authorization', `Bearer ${token}`);
    expect(status).toBe(httpStatus.PAYMENT_REQUIRED);
  });

  it('should return status code 402 if the ticket is not paid', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketType();
    await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
    const { status } = await server.get('/hotels/1234').set('Authorization', `Bearer ${token}`);
    expect(status).toBe(httpStatus.PAYMENT_REQUIRED);
  });

  it("should return status code 402 if the ticket doesn't include a hotel", async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createPresentialWithoutHotelTicketType();
    await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    const { status } = await server.get('/hotels/1234').set('Authorization', `Bearer ${token}`);
    expect(status).toBe(httpStatus.PAYMENT_REQUIRED);
  });

  it("should return status code 404 when there's no enrollment", async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    await createTicketType();
    const { status } = await server.get('/hotels/1234').set('Authorization', `Bearer ${token}`);
    expect(status).toBe(httpStatus.NOT_FOUND);
  });

  it("should return status code 404 when there's no ticket type", async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    await createEnrollmentWithAddress(user);
    const { status } = await server.get('/hotels/1234').set('Authorization', `Bearer ${token}`);
    expect(status).toBe(httpStatus.NOT_FOUND);
  });

  it("should return status code 404 when there's no ticket", async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    await createEnrollmentWithAddress(user);
    await createTicketType();
    const { status } = await server.get('/hotels/1234').set('Authorization', `Bearer ${token}`);
    expect(status).toBe(httpStatus.NOT_FOUND);
  });

  it("should return status code 404 when there's no hotel available", async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createPresentialWithHotelTicketType();
    const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    await createPayment(ticket.id, ticketType.price);
    const { status } = await server.get('/hotels/1234').set('Authorization', `Bearer ${token}`);
    expect(status).toBe(httpStatus.NOT_FOUND);
  });

  it('should return status code 200 and should return the expected hotels in an array of objects', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createPresentialWithHotelTicketType();
    const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    const hotel = await createHotel();
    await createPayment(ticket.id, ticketType.price);
    const room = await createRoom(hotel.id);
    const { status, body } = await server.get(`/hotels/${hotel.id}`).set('Authorization', `Bearer ${token}`);
    expect(status).toBe(httpStatus.OK);
    expect(body).toEqual({
      ...hotel,
      createdAt: hotel.createdAt.toISOString(),
      updatedAt: hotel.updatedAt.toISOString(),
      Rooms: [
        {
          ...room,
          createdAt: room.createdAt.toISOString(),
          updatedAt: room.updatedAt.toISOString(),
        },
      ],
    });
  });
});
