import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
      <main className="flex flex-col items-center justify-center gap-8 text-center px-4">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white">
            PW Gaming
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Texas Hold&apos;em Poker Platform
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Link
            href="/login"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg"
          >
            Get Started
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            Learn More
          </a>
        </div>

        <div className="mt-12 text-sm text-gray-500 dark:text-gray-400">
          <p>Play poker with friends using Telegram authentication</p>
        </div>
      </main>
    </div>
  );
}
