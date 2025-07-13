const BASE_URL = process.env.NEXT_PUBLIC_CHATROOMS_API || 'http://localhost:5000/api/v1';

export const chatService = {
  getRooms: async () => {
    const res = await fetch(`${BASE_URL}/my-rooms`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // important for cookies / auth
    });
    console.log('[ChatLayout] Sidebar open button clicked');

    if (!res.ok) throw new Error('Failed to fetch rooms');
    const json = await res.json();
    return json.data; // ✅ we only want the room array
  }

};