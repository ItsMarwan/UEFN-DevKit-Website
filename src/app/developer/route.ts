import { redirect } from 'next/navigation'

export async function GET() {
  const serverId = process.env.NEXT_PUBLIC_DISCORD_SERVER_ID
  
  if (!serverId) {
    redirect('/')
  }

  const serverUrl = `https://marwan.is-a.dev`
  redirect(serverUrl)
}
