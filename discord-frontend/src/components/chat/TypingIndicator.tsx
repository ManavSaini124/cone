import React from 'react';

interface TypingIndicatorProps {
  typingUsers: string[];
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers }) => {
  if (!typingUsers.length) return null;
  return (
    <div className="px-4 pb-2 text-sm text-white/50">
      {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
    </div>
  );
};

export default TypingIndicator;
