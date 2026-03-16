'use client'

import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'

interface Command {
  name: string
  description: string
  usage: string
  premium?: boolean
}

export default function Commands() {
  const [commands, setCommands] = useState<Command[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const fetchCommands = async () => {
      try {
        const res = await fetch('/api/commands')
        const data = await res.json()
        setCommands(data)
      } catch (error) {
        console.error('Failed to fetch commands:', error)
        setCommands([])
      } finally {
        setLoading(false)
      }
    }

    fetchCommands()
  }, [])

  const filteredCommands = commands.filter(cmd => {
    const matchesSearch = cmd.name.toLowerCase().includes(search.toLowerCase()) ||
                         cmd.description.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'all' || (filter === 'premium' && cmd.premium) || (filter === 'free' && !cmd.premium)
    return matchesSearch && matchesFilter
  })

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-[#2399df] to-[#64dcfb] bg-clip-text text-transparent">
            Bot Commands
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Explore all available commands for UEFN Helper
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search commands..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 focus:border-[#2399df] dark:focus:border-[#64dcfb] outline-none transition-colors"
            />
          </div>

          <div className="flex gap-3 flex-wrap">
            {['all', 'free', 'premium'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                  filter === f
                    ? 'bg-gradient-to-r from-[#2399df] to-[#64dcfb] text-white'
                    : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Commands List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-[#2399df] border-t-[#64dcfb] rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCommands.length > 0 ? (
              filteredCommands.map((cmd) => (
                <div
                  key={cmd.name}
                  className="p-6 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-[#2399df] dark:hover:border-[#64dcfb] transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-[#2399df]">/{cmd.name}</h3>
                      {cmd.premium && (
                        <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 text-xs rounded font-semibold">
                          PREMIUM
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">{cmd.description}</p>
                  <code className="block mt-3 p-3 bg-gray-200 dark:bg-gray-800 rounded text-sm font-mono">
                    {cmd.usage}
                  </code>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">No commands found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
