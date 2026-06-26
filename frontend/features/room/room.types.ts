export interface RoomItem {
  code: string;
  slug: string;
  name: string;
  imageUrl: string | null;
}

export interface RoomListResponse {
  items: RoomItem[];
}

export interface AdminRoomItem {
  id: string;
  code: string;
  name: string;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface AdminRoomListResponse {
  items: AdminRoomItem[];
}
