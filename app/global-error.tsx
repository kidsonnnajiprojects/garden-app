'use client'
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html><body>
      <div className="p-8 text-center">
        <p className="text-red-600 font-medium mb-4">Something went wrong</p>
        <button onClick={reset} className="bg-green-700 text-white px-4 py-2 rounded-lg">Try again</button>
      </div>
    </body></html>
  )
}
