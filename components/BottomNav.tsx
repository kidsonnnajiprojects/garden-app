'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sprout, Droplets, CloudRain, Camera, Lightbulb } from 'lucide-react'

const nav = [
  { href: '/', icon: Sprout, label: 'Plants' },
  { href: '/care', icon: Droplets, label: 'Care' },
  { href: '/weather', icon: CloudRain, label: 'Weather' },
  { href: '/photos', icon: Camera, label: 'Photos' },
  { href: '/coach', icon: Lightbulb, label: 'Coach' },
]

export default function BottomNav() {
  const path = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 z-50">
      <div className="max-w-lg mx-auto flex">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = href === '/' ? path === '/' : path.startsWith(href)
          return (
            <Link key={href} href={href} className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-colors ${active ? 'text-green-700' : 'text-stone-400'}`}>
              <Icon size={22} />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
