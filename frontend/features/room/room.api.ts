import { api } from "@/lib/api";
import { getAuthHeaders } from "@/lib/auth";
import type {
  RoomListResponse,
  AdminRoomListResponse,
  AdminRoomItem,
} from "./room.types";

/** Public — active room categories with hero images for the homepage rail. */
export async function getRooms(locale: string): Promise<RoomListResponse> {
  return api.get<RoomListResponse>(`/api/v1/rooms?locale=${locale}`);
}

export async function getAdminRooms(
  locale: string,
): Promise<AdminRoomListResponse> {
  return api.get<AdminRoomListResponse>(
    `/api/v1/admin/rooms?locale=${locale}`,
    getAuthHeaders(),
  );
}

export async function updateRoomImage(
  roomId: string,
  imageUrl: string | null,
  locale: string,
): Promise<AdminRoomItem> {
  return api.patch<AdminRoomItem>(
    `/api/v1/admin/rooms/${roomId}?locale=${locale}`,
    { imageUrl },
    getAuthHeaders(),
  );
}
