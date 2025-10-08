export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 via-indigo-700 to-indigo-900 flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-indigo-400/5 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
      </div>
      
      {/* Main content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto">
        {/* Logo and Brand */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-3">
            {/* Logo icon - crossed wrenches and gear */}
            <div className="relative">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-white">
                {/* Gear */}
                <circle cx="20" cy="20" r="8" stroke="currentColor" strokeWidth="2" fill="none"/>
                <circle cx="20" cy="20" r="3" fill="currentColor"/>
                {/* Wrench 1 */}
                <path d="M8 8 L16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M6 10 L10 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                {/* Wrench 2 */}
                <path d="M32 32 L24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M34 30 L30 34" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white">Dex</h1>
          </div>
        </div>

        {/* Main headline */}
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
          Your AI-powered service copilot for HVAC/R
        </h2>

        {/* Description */}
        <p className="text-lg md:text-xl text-white mb-8 max-w-2xl mx-auto leading-relaxed">
          Help your techs diagnose faster. Quote jobs instantly. Cut rework, callbacks, and admin drag.
        </p>

        {/* Call to action prompt */}
        <p className="text-xl md:text-2xl text-white mb-8 font-medium">
          Want more info or a personalized demo?
        </p>

        {/* Email form */}
        <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
          <input
            type="email"
            placeholder="Enter your email"
            className="flex-1 px-4 py-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent"
          />
          <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent">
            Get Info
          </button>
        </div>
      </div>
    </div>
  );
}
