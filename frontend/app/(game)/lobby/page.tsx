export default function LobbyPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-4">
          Game Lobby
        </h1>
        <p className="text-gray-300 mb-8">
          This page is protected. You can only see this if you&apos;re authenticated.
        </p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-2">
              Table 1
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Players: 4/9
            </p>
            <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors">
              Join Table
            </button>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-2">
              Table 2
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Players: 2/9
            </p>
            <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors">
              Join Table
            </button>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-2">
              Create Table
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Start your own game
            </p>
            <button className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors">
              New Table
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
