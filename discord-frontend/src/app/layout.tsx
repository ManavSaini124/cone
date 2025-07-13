import './globals.css';
import { Toaster } from 'react-hot-toast';


export const metadata = {
  title: 'Cone - Real-Time Chat',
  description: 'Let’s Connect. Like Never Before.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="top-right"
          reverseOrder={false}
          toastOptions={{
            className: 'bg-gray-800 text-white',
            style: {
              fontSize: '14px',
              padding: '10px 15px',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#4ade80',
                secondary: '#fff',
              },
            },
            error: {
              duration: 3000,
              iconTheme: {
                primary: '#f87171',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
