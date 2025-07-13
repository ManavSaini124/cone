export const createRoom = async (roomData: {
  name: string;
  description?: string;
  type: 'private' | 'group' | 'Public';
}) => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat-rooms/create`, {
    method: 'POST',
    credentials: 'include', // Include cookies (auth)
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(roomData),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to create room');
  }

  const json = await res.json();
  return json.data; // Assuming your API responds with { data: room }
};
