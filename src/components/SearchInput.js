'use client'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

export default function SearchInput({ defaultValue }) {
  const { replace } = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  function handleSearch(term) {
    const params = new URLSearchParams(searchParams)
    if (term) {
      params.set('q', term)
    } else {
      params.delete('q')
    }
    
    startTransition(() => {
      replace(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <div className="relative w-full md:w-64">
      <input
        type="text"
        placeholder="Buscar por nombre o código..."
        defaultValue={defaultValue}
        onChange={(e) => handleSearch(e.target.value)}
        className={`w-full border border-black px-2 py-1 text-xs outline-none focus:bg-gray-50 transition-colors ${isPending ? 'opacity-50' : ''}`}
      />
      {isPending && (
        <div className="absolute right-2 top-1.5">
          <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  )
}