import { redirect } from 'next/navigation'

export async function GET() {
  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID
  
  if (!clientId) {
    redirect('/')
  }

  const inviteUrl = `https://discord.com/oauth2/authorize?client_id=1482902329148838059&permissions=17180133488&integration_type=0&scope=bot`
  redirect(inviteUrl)
}
