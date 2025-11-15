/**
 * Authentication layout
 * Simple centered layout for auth pages
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 via-gray-900 to-black">
      <div className="w-full max-w-md px-4">
        {children}
      </div>
    </div>
  );
}
