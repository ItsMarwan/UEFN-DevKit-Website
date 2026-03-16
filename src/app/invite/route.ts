import { redirect } from 'next/navigation'

export async function GET() {
  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID
  
  if (!clientId) {
    redirect('/')
  }

  const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&scope=bot&permissions=8`
  redirect(inviteUrl)
}
