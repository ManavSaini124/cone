'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const heroElements = document.querySelectorAll('.hero-animate');
    heroElements.forEach((el, index) => {
      setTimeout(() => {
        el.classList.remove('opacity-0', 'translate-y-6');
        el.classList.add('opacity-100', 'translate-y-0');
      }, index * 200 + 500);
    });

    const animateOnScroll = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('opacity-0', 'translate-y-12');
          entry.target.classList.add('opacity-100', 'translate-y-0');
        }
      });
    };

    observerRef.current = new IntersectionObserver(animateOnScroll, {
      threshold: 0.2,
      rootMargin: '0px 0px -50px 0px'
    });

    const scrollElements = document.querySelectorAll('.scroll-animate');
    scrollElements.forEach((el) => {
      if (observerRef.current) {
        observerRef.current.observe(el);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white overflow-x-hidden">
      {/* Keep the entire JSX exactly as you have it in Index.tsx */}
      {/* Hero Section */}
      <section className="h-screen flex flex-col items-center justify-center px-6 relative">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="hero-animate opacity-0 translate-y-6 transition-all duration-1000 ease-out text-6xl md:text-8xl font-light tracking-tight mb-6 bg-gradient-to-b from-white to-gray-300 bg-clip-text text-transparent">
            Let's Connect.
            <br />
            <span className="text-[#9cbc9c]">Like Never Before.</span>
          </h1>
          
          <p className="hero-animate opacity-0 translate-y-6 transition-all duration-1000 ease-out text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            A luxurious chat experience — minimal, real-time, and crafted for elegance.
          </p>
          
          <div className="hero-animate opacity-0 translate-y-6 transition-all duration-1000 ease-out flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link 
              href="/auth/register"
              className="bg-[#9cbc9c] text-black px-8 py-4 rounded-full text-lg font-medium hover:bg-[#8ca88c] transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Register
            </Link>
            <Link 
              href="/auth/login"
              className="border border-[#c9a896] text-[#c9a896] px-8 py-4 rounded-full text-lg font-medium hover:bg-[#c9a896] hover:text-black transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Login
            </Link>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-gray-600 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-gray-600 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Feature Sections */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Real-time Messaging */}
          <div className="scroll-animate opacity-0 translate-y-12 transition-all duration-1000 ease-out mb-32">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-5xl md:text-6xl font-light mb-8 text-[#9cbc9c]">
                  Real-time
                  <br />
                  Messaging
                </h2>
                <p className="text-xl text-gray-400 leading-relaxed mb-8">
                  Experience conversations that flow naturally. Every message appears instantly, 
                  creating seamless communication that feels as natural as face-to-face conversation.
                </p>
                <div className="w-24 h-1 bg-gradient-to-r from-[#9cbc9c] to-transparent"></div>
              </div>
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 h-80 flex items-center justify-center border border-gray-700">
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#9cbc9c] rounded-full mx-auto mb-4 flex items-center justify-center">
                    <div className="w-8 h-8 bg-black rounded-full animate-pulse"></div>
                  </div>
                  <p className="text-gray-300">Lightning fast delivery</p>
                </div>
              </div>
            </div>
          </div>

          {/* Private Rooms */}
          <div className="scroll-animate opacity-0 translate-y-12 transition-all duration-1000 ease-out mb-32">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 h-80 flex items-center justify-center border border-gray-700 md:order-1">
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#c9a896] rounded-full mx-auto mb-4 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-black rounded-sm"></div>
                  </div>
                  <p className="text-gray-300">Secure & Private</p>
                </div>
              </div>
              <div className="md:order-2">
                <h2 className="text-5xl md:text-6xl font-light mb-8 text-[#c9a896]">
                  Private
                  <br />
                  Rooms
                </h2>
                <p className="text-xl text-gray-400 leading-relaxed mb-8">
                  Create intimate spaces for your most important conversations. 
                  Invite-only rooms ensure your discussions remain confidential and focused.
                </p>
                <div className="w-24 h-1 bg-gradient-to-r from-[#c9a896] to-transparent"></div>
              </div>
            </div>
          </div>

          {/* Role-Based Permissions */}
          <div className="scroll-animate opacity-0 translate-y-12 transition-all duration-1000 ease-out mb-32">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-5xl md:text-6xl font-light mb-8 text-white">
                  Smart
                  <br />
                  Permissions
                </h2>
                <p className="text-xl text-gray-400 leading-relaxed mb-8">
                  Elegant control over who can do what. From moderators to guests, 
                  every role has its purpose in maintaining the perfect conversation flow.
                </p>
                <div className="w-24 h-1 bg-gradient-to-r from-white to-transparent"></div>
              </div>
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 h-80 flex items-center justify-center border border-gray-700">
                <div className="text-center">
                  <div className="flex justify-center space-x-2 mb-4">
                    <div className="w-4 h-4 bg-[#9cbc9c] rounded-full"></div>
                    <div className="w-4 h-4 bg-[#c9a896] rounded-full"></div>
                    <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
                  </div>
                  <p className="text-gray-300">Refined Access Control</p>
                </div>
              </div>
            </div>
          </div>

          {/* Elegant Experience */}
          <div className="scroll-animate opacity-0 translate-y-12 transition-all duration-1000 ease-out">
            <div className="text-center py-20">
              <h2 className="text-6xl md:text-8xl font-light mb-12 bg-gradient-to-b from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                Crafted for
                <br />
                <span className="text-[#9cbc9c]">Excellence</span>
              </h2>
              <p className="text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed mb-16">
                Every pixel, every interaction, every moment has been thoughtfully designed 
                to create the most refined chat experience possible.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Link 
                  href="/auth/register"
                  className="bg-gradient-to-r from-[#9cbc9c] to-[#8ca88c] text-black px-12 py-5 rounded-full text-xl font-medium hover:shadow-2xl hover:shadow-[#9cbc9c]/20 transition-all duration-500 hover:scale-105"
                >
                  Start Your Journey
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-16 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h3 className="text-3xl font-light mb-4 text-[#9cbc9c]">Cone</h3>
          <p className="text-gray-500">
            © 2024 Cone. Crafted with care for meaningful connections.
          </p>
        </div>
      </footer>
    </div>
  );
}
