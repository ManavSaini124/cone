const BASE_URL = process.env.NEXT_PUBLIC_AUTH_API  || 'http://localhost:5000/api/v1/user';

export const authService = {
  register: async (data: { username: string; email: string; password: string , otp: string}) => {
    // console.log("Sending to backend →", data);
    const res = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    
    if (!res.ok) throw new Error('Registration failed');
    return await res.json();
  },
  
  login: async (data: { email: string; password: string }) => {
    const res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error('Login failed');
    return await res.json();
  },
};
