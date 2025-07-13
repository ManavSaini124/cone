import ChatLayout from '@/components/chat/ChatLayout';
import { UserProvider } from '@/contexts/UserContext';
import { SocketProvider } from '@/contexts/SocketContext';
export default function ChatPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <SocketProvider>
        <ChatLayout>{children}</ChatLayout>
      </SocketProvider> 
    </UserProvider>
  );
}