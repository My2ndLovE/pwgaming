import { roomsApi } from '@/lib/api/rooms';

describe('Rooms API', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('listRooms', () => {
    it('should fetch all rooms successfully', async () => {
      const mockRooms = {
        rooms: [
          {
            id: '1',
            name: 'Test Room',
            smallBlind: 10,
            bigBlind: 20,
            minBuyIn: 100,
            maxBuyIn: 1000,
            maxPlayers: 6,
            currentPlayers: 3,
            status: 'active',
            createdAt: '2025-01-15T10:00:00Z',
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRooms,
      });

      const result = await roomsApi.listRooms('mock-token');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4110/rooms',
        {
          headers: {
            Authorization: 'Bearer mock-token',
          },
        }
      );
      expect(result).toEqual(mockRooms);
    });

    it('should filter rooms by status', async () => {
      const mockRooms = { rooms: [] };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRooms,
      });

      await roomsApi.listRooms('mock-token', 'active');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4110/rooms?status=active',
        expect.any(Object)
      );
    });
  });

  describe('getRoom', () => {
    it('should fetch room by ID', async () => {
      const mockRoom = {
        room: {
          id: '1',
          name: 'Test Room',
          smallBlind: 10,
          bigBlind: 20,
          minBuyIn: 100,
          maxBuyIn: 1000,
          maxPlayers: 6,
          currentPlayers: 3,
          status: 'active',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRoom,
      });

      const result = await roomsApi.getRoom('mock-token', '1');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4110/rooms/1',
        {
          headers: {
            Authorization: 'Bearer mock-token',
          },
        }
      );
      expect(result).toEqual(mockRoom);
    });
  });

  describe('joinRoom', () => {
    it('should join room with buy-in amount', async () => {
      const mockResponse = {
        message: 'Successfully joined room',
        gameState: { roomId: '1' },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await roomsApi.joinRoom('mock-token', '1', 500);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4110/rooms/1/join',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-token',
          },
          body: JSON.stringify({ buyInAmount: 500 }),
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle insufficient balance error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Insufficient balance' }),
      });

      await expect(
        roomsApi.joinRoom('mock-token', '1', 1000)
      ).rejects.toThrow();
    });
  });
});
