const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4110';

export interface Room {
  id: string;
  name: string;
  smallBlind: number;
  bigBlind: number;
  minBuyIn: number;
  maxBuyIn: number;
  maxPlayers: number;
  currentPlayers: number;
  status: string;
  createdAt: string;
}

export interface RoomsResponse {
  rooms: Room[];
}

export interface RoomResponse {
  room: Room;
}

export interface JoinRoomResponse {
  message: string;
  gameState: any;
}

class RoomsApiService {
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'Request failed',
      }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async listRooms(
    token: string,
    status?: string
  ): Promise<RoomsResponse> {
    const queryParams = status ? `?status=${status}` : '';
    return this.request<RoomsResponse>(`/rooms${queryParams}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getRoom(token: string, roomId: string): Promise<RoomResponse> {
    return this.request<RoomResponse>(`/rooms/${roomId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async joinRoom(
    token: string,
    roomId: string,
    buyInAmount: number
  ): Promise<JoinRoomResponse> {
    return this.request<JoinRoomResponse>(`/rooms/${roomId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ buyInAmount }),
    });
  }
}

export const roomsApi = new RoomsApiService();
