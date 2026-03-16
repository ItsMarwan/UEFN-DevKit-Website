export async function GET() {
  const commands = [
    {
      name: 'check code',
      description: 'Check if a coupon code is valid.',
      usage: '/checkcode <code>',
      premium: false
    },
    {
      name: 'config info',
      description: 'View this server\'s UEFN Helper configuration.',
      usage: '/config info',
      premium: false
    },
    {
      name: 'config refresh',
      description: 'Refresh your server\'s poller after tier upgrade.',
      usage: '/config refresh',
      premium: false
    },
    {
      name: 'config sync',
      description: 'Force sync application commands for this guild.',
      usage: '/config sync',
      premium: false
    },
    {
      name: 'coupon add',
      description: 'Add a new coupon code.',
      usage: '/coupon add <code> <description> <expires> <max_uses>',
      premium: false
    },
    {
      name: 'coupon deactivate',
      description: 'Deactivate a coupon code.',
      usage: '/coupon deactivate <code>',
      premium: false
    },
    {
      name: 'coupon list',
      description: 'List all coupon codes.',
      usage: '/coupon list',
      premium: false
    },
    {
      name: 'customer add',
      description: 'Register a member as a customer.',
      usage: '/customer add <member> <reason> <role>',
      premium: false
    },
    {
      name: 'customer info',
      description: 'View a customer\'s record.',
      usage: '/customer info <member>',
      premium: false
    },
    {
      name: 'customer remove',
      description: 'Remove a customer record.',
      usage: '/customer remove <member>',
      premium: false
    },
    {
      name: 'export data',
      description: 'Export server data (customers,coupons,trackers,settings, etc.)',
      usage: '/export data <data_type>',
      premium: false
    },
    {
      name: 'files',
      description: 'Browse and manage youre server\'s data files',
      usage: '/files',
      premium: false
    },
    {
      name: 'fortnitetrack add',
      description: 'Setup a Fortnite island tracking in a voice channel.',
      usage: '/fortnitetrack add <channel>',
      premium: false
    },
    {
      name: 'fortnitetrack edit',
      description: 'Edit an existing Fortnite tracker.',
      usage: '/fortnitetrack edit <channel>',
      premium: false
    },
    {
      name: 'fortnitetrack list',
      description: 'List all active Fortnite trackers.',
      usage: '/fortnitetrack list',
      premium: false
    },
    {
      name: 'fortnitetrack remove',
      description: 'Remove a Fortnite tracker.',
      usage: '/fortnitetrack remove <channel>',
      premium: false
    },
    {
      name: 'help',
      description: 'Get help with UEFN Helper commands.',
      usage: '/help',
      premium: false
    },
    {
      name: 'invitestats',
      description: 'View invite statistics for this server.',
      usage: '/invitestats',
      premium: false
    },
    {
      name: 'island',
      description: 'Look up a Fortnite island by its code.',
      usage: '/island <code>',
      premium: false
    },
    {
      name: 'member add',
      description: 'Manually add or update a member record.',
      usage: '/member add <member> <inviter>',
      premium: false
    },
    {
      name: 'member lookup',
      description: 'Look up a member\'s join and invite history.',
      usage: '/member lookup <member>',
      premium: false
    },
    {
      name: 'premium',
      description: 'Manage your premium subscription.',
      usage: '/premium',
      premium: false
    },
    {
      name: 'verse',
      description: 'Upload and display a Verse script.',
      usage: '/verse <script> <title> <upload_to_pastebin> <visibility> <expire>',
      premium: false
    },
    {
      name: 'verse_config add_role',
      description: 'Allow a role to upload verse scripts.',
      usage: '/verse_config add_role <role>',
      premium: false
    },
    {
      name: 'verse_config list_roles',
      description: 'List all roles that can upload verse scripts.',
      usage: '/verse_config list_roles',
      premium: false
    },
    {
      name: 'verse_config remove_role',
      description: 'Revoke Verse upload permissions for a role.',
      usage: '/verse_config remove_role <role>',
      premium: false
    },
    {
      name: 'verselist',
      description: 'List all stored verse scripts for this server.',
      usage: '/verselist',
      premium: false
    }
  ]

  return Response.json(commands)
}
