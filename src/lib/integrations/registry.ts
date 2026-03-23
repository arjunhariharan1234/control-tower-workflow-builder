import { Integration } from '@/types/integration';

export const INTEGRATIONS: Integration[] = [
  // ── NOTIFICATIONS ──────────────────────────────────────────────
  {
    id: 'fyno',
    name: 'Fyno',
    description: 'Multi-channel notification orchestration — SMS, email, push, WhatsApp, in-app from a single API.',
    category: 'notifications',
    icon: 'FY',
    color: '#6C5CE7',
    website: 'https://fyno.io',
    authType: 'api_key',
    authFields: [
      { key: 'workspace_id', label: 'Workspace ID', type: 'text', required: true, placeholder: 'ws_...' },
      { key: 'api_key', label: 'API Key', type: 'password', required: true, placeholder: 'Enter your Fyno API key' },
    ],
    triggers: [
      { id: 'fyno.delivery_status', label: 'Delivery Status Update', description: 'Triggered when a notification delivery status changes (sent, delivered, failed).' },
      { id: 'fyno.channel_fallback', label: 'Channel Fallback Triggered', description: 'Triggered when primary channel fails and notification falls back to secondary channel.' },
    ],
    actions: [
      { id: 'fyno.send_notification', label: 'Send Notification', description: 'Send a multi-channel notification via Fyno routing.', inputFields: [
        { key: 'to', label: 'Recipient', type: 'string', required: true, description: 'Phone number, email, or user ID' },
        { key: 'template_id', label: 'Template ID', type: 'string', required: true, description: 'Fyno notification template' },
        { key: 'channel', label: 'Channel', type: 'select', required: false, description: 'sms | email | push | whatsapp | in_app' },
        { key: 'data', label: 'Template Data', type: 'json', required: false, description: 'Dynamic variables for the template' },
      ]},
      { id: 'fyno.send_sms', label: 'Send SMS', description: 'Send an SMS via Fyno.', inputFields: [
        { key: 'to', label: 'Phone Number', type: 'string', required: true },
        { key: 'message', label: 'Message', type: 'text', required: true },
      ]},
      { id: 'fyno.send_whatsapp', label: 'Send WhatsApp', description: 'Send a WhatsApp message via Fyno.', inputFields: [
        { key: 'to', label: 'Phone Number', type: 'string', required: true },
        { key: 'template_id', label: 'Template ID', type: 'string', required: true },
        { key: 'data', label: 'Template Data', type: 'json', required: false },
      ]},
      { id: 'fyno.send_email', label: 'Send Email', description: 'Send an email via Fyno.', inputFields: [
        { key: 'to', label: 'Email', type: 'string', required: true },
        { key: 'template_id', label: 'Template ID', type: 'string', required: true },
        { key: 'data', label: 'Template Data', type: 'json', required: false },
      ]},
    ],
    tags: ['sms', 'email', 'push', 'whatsapp', 'notifications', 'multi-channel'],
    popular: true,
  },
  {
    id: 'twilio',
    name: 'Twilio',
    description: 'Cloud communications platform for SMS, voice, video, and WhatsApp APIs.',
    category: 'notifications',
    icon: 'TW',
    color: '#F22F46',
    website: 'https://twilio.com',
    authType: 'api_key',
    authFields: [
      { key: 'account_sid', label: 'Account SID', type: 'text', required: true, placeholder: 'AC...' },
      { key: 'auth_token', label: 'Auth Token', type: 'password', required: true },
    ],
    triggers: [
      { id: 'twilio.incoming_sms', label: 'Incoming SMS', description: 'Triggered when an SMS is received on your Twilio number.' },
      { id: 'twilio.incoming_call', label: 'Incoming Call', description: 'Triggered when a call comes in to your Twilio number.' },
      { id: 'twilio.delivery_status', label: 'Message Status Update', description: 'Triggered when an SMS delivery status changes.' },
    ],
    actions: [
      { id: 'twilio.send_sms', label: 'Send SMS', description: 'Send an SMS message.', inputFields: [
        { key: 'to', label: 'To Number', type: 'string', required: true },
        { key: 'from', label: 'From Number', type: 'string', required: true },
        { key: 'body', label: 'Message Body', type: 'text', required: true },
      ]},
      { id: 'twilio.make_call', label: 'Make Call', description: 'Initiate an outbound phone call.', inputFields: [
        { key: 'to', label: 'To Number', type: 'string', required: true },
        { key: 'from', label: 'From Number', type: 'string', required: true },
        { key: 'twiml_url', label: 'TwiML URL', type: 'url', required: true, description: 'URL returning TwiML instructions' },
      ]},
      { id: 'twilio.send_whatsapp', label: 'Send WhatsApp', description: 'Send a WhatsApp message via Twilio.', inputFields: [
        { key: 'to', label: 'To (whatsapp:+...)', type: 'string', required: true },
        { key: 'body', label: 'Message Body', type: 'text', required: true },
      ]},
    ],
    tags: ['sms', 'voice', 'whatsapp', 'otp', 'communications'],
    popular: true,
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    description: 'Email delivery and marketing platform by Twilio for transactional and bulk email.',
    category: 'notifications',
    icon: 'SG',
    color: '#1A82E2',
    website: 'https://sendgrid.com',
    authType: 'api_key',
    authFields: [
      { key: 'api_key', label: 'API Key', type: 'password', required: true, placeholder: 'SG...' },
    ],
    triggers: [
      { id: 'sendgrid.email_event', label: 'Email Event', description: 'Triggered on email events — delivered, opened, clicked, bounced, etc.' },
    ],
    actions: [
      { id: 'sendgrid.send_email', label: 'Send Email', description: 'Send a transactional email.', inputFields: [
        { key: 'to', label: 'To Email', type: 'string', required: true },
        { key: 'from', label: 'From Email', type: 'string', required: true },
        { key: 'subject', label: 'Subject', type: 'string', required: true },
        { key: 'html', label: 'HTML Body', type: 'text', required: true },
      ]},
      { id: 'sendgrid.send_template', label: 'Send Template Email', description: 'Send an email using a dynamic template.', inputFields: [
        { key: 'to', label: 'To Email', type: 'string', required: true },
        { key: 'template_id', label: 'Template ID', type: 'string', required: true },
        { key: 'dynamic_data', label: 'Dynamic Data', type: 'json', required: false },
      ]},
    ],
    tags: ['email', 'transactional', 'marketing'],
  },
  {
    id: 'firebase_fcm',
    name: 'Firebase FCM',
    description: 'Firebase Cloud Messaging for push notifications to Android, iOS, and web.',
    category: 'notifications',
    icon: 'FB',
    color: '#FFCA28',
    website: 'https://firebase.google.com/products/cloud-messaging',
    authType: 'api_key',
    authFields: [
      { key: 'server_key', label: 'Server Key', type: 'password', required: true },
      { key: 'project_id', label: 'Project ID', type: 'text', required: true },
    ],
    triggers: [],
    actions: [
      { id: 'fcm.send_push', label: 'Send Push Notification', description: 'Send a push notification to a device or topic.', inputFields: [
        { key: 'token', label: 'Device Token or Topic', type: 'string', required: true },
        { key: 'title', label: 'Title', type: 'string', required: true },
        { key: 'body', label: 'Body', type: 'text', required: true },
        { key: 'data', label: 'Custom Data', type: 'json', required: false },
      ]},
    ],
    tags: ['push', 'mobile', 'android', 'ios', 'web'],
  },
  {
    id: 'msg91',
    name: 'MSG91',
    description: 'Indian cloud communication platform for SMS, OTP, email, and WhatsApp.',
    category: 'notifications',
    icon: 'M9',
    color: '#00C853',
    website: 'https://msg91.com',
    authType: 'api_key',
    authFields: [
      { key: 'auth_key', label: 'Auth Key', type: 'password', required: true },
      { key: 'sender_id', label: 'Sender ID', type: 'text', required: true, placeholder: '6 char sender ID' },
    ],
    triggers: [
      { id: 'msg91.delivery_report', label: 'Delivery Report', description: 'Triggered when an SMS delivery report is received.' },
    ],
    actions: [
      { id: 'msg91.send_sms', label: 'Send SMS', description: 'Send an SMS using MSG91.', inputFields: [
        { key: 'mobile', label: 'Mobile Number', type: 'string', required: true },
        { key: 'message', label: 'Message', type: 'text', required: true },
        { key: 'route', label: 'Route', type: 'string', required: false, description: '1=Promotional, 4=Transactional' },
      ]},
      { id: 'msg91.send_otp', label: 'Send OTP', description: 'Send a one-time password.', inputFields: [
        { key: 'mobile', label: 'Mobile Number', type: 'string', required: true },
        { key: 'template_id', label: 'Template ID', type: 'string', required: true },
      ]},
    ],
    tags: ['sms', 'otp', 'india', 'whatsapp'],
  },

  // ── TELEPHONY ──────────────────────────────────────────────────
  {
    id: 'ozonetel',
    name: 'Ozonetel',
    description: 'Indian cloud contact center platform — IVR, auto-dialer, omnichannel support, and call analytics.',
    category: 'telephony',
    icon: 'OZ',
    color: '#FF6B35',
    website: 'https://ozonetel.com',
    authType: 'api_key',
    authFields: [
      { key: 'api_key', label: 'API Key', type: 'password', required: true },
      { key: 'username', label: 'Username', type: 'text', required: true },
      { key: 'domain', label: 'Domain', type: 'text', required: true, placeholder: 'your-domain.ozonetel.com' },
    ],
    triggers: [
      { id: 'ozonetel.call_completed', label: 'Call Completed', description: 'Triggered when a call ends with disposition data.' },
      { id: 'ozonetel.missed_call', label: 'Missed Call', description: 'Triggered when an inbound call is missed.' },
      { id: 'ozonetel.agent_status', label: 'Agent Status Change', description: 'Triggered when an agent changes status (available, busy, offline).' },
    ],
    actions: [
      { id: 'ozonetel.make_call', label: 'Make Outbound Call', description: 'Initiate an outbound call via Ozonetel.', inputFields: [
        { key: 'phone_number', label: 'Phone Number', type: 'string', required: true },
        { key: 'agent_id', label: 'Agent ID', type: 'string', required: false },
        { key: 'campaign_id', label: 'Campaign ID', type: 'string', required: false },
      ]},
      { id: 'ozonetel.transfer_call', label: 'Transfer Call', description: 'Transfer an active call to another agent or queue.', inputFields: [
        { key: 'call_id', label: 'Call ID', type: 'string', required: true },
        { key: 'transfer_to', label: 'Transfer To', type: 'string', required: true },
      ]},
      { id: 'ozonetel.send_ivr', label: 'Play IVR', description: 'Play an IVR message to a caller.', inputFields: [
        { key: 'call_id', label: 'Call ID', type: 'string', required: true },
        { key: 'audio_url', label: 'Audio URL', type: 'url', required: true },
      ]},
      { id: 'ozonetel.get_recording', label: 'Get Call Recording', description: 'Retrieve the recording URL of a completed call.', inputFields: [
        { key: 'call_id', label: 'Call ID', type: 'string', required: true },
      ]},
    ],
    tags: ['call', 'ivr', 'contact-center', 'india', 'auto-dialer', 'voice'],
    popular: true,
  },
  {
    id: 'exotel',
    name: 'Exotel',
    description: 'Indian cloud telephony platform for call routing, IVR, and business phone systems.',
    category: 'telephony',
    icon: 'EX',
    color: '#2ECC71',
    website: 'https://exotel.com',
    authType: 'basic_auth',
    authFields: [
      { key: 'api_key', label: 'API Key', type: 'text', required: true },
      { key: 'api_token', label: 'API Token', type: 'password', required: true },
      { key: 'subdomain', label: 'Subdomain', type: 'text', required: true, placeholder: 'your-company' },
    ],
    triggers: [
      { id: 'exotel.call_update', label: 'Call Status Update', description: 'Triggered when a call status changes.' },
    ],
    actions: [
      { id: 'exotel.make_call', label: 'Make Call', description: 'Connect two phone numbers via Exotel.', inputFields: [
        { key: 'from', label: 'From Number', type: 'string', required: true },
        { key: 'to', label: 'To Number', type: 'string', required: true },
        { key: 'caller_id', label: 'Exotel Caller ID', type: 'string', required: true },
      ]},
      { id: 'exotel.send_sms', label: 'Send SMS', description: 'Send an SMS via Exotel.', inputFields: [
        { key: 'to', label: 'To Number', type: 'string', required: true },
        { key: 'body', label: 'Message', type: 'text', required: true },
      ]},
    ],
    tags: ['call', 'ivr', 'sms', 'india'],
  },
  {
    id: 'ringcentral',
    name: 'RingCentral / Ring AI',
    description: 'Cloud communications with AI-powered call summaries, sentiment analysis, and conversation intelligence.',
    category: 'telephony',
    icon: 'RC',
    color: '#FF6A00',
    website: 'https://ringcentral.com',
    authType: 'oauth2',
    authFields: [
      { key: 'client_id', label: 'Client ID', type: 'text', required: true },
      { key: 'client_secret', label: 'Client Secret', type: 'password', required: true },
      { key: 'server_url', label: 'Server URL', type: 'url', required: true, placeholder: 'https://platform.ringcentral.com' },
    ],
    triggers: [
      { id: 'ringcentral.call_ended', label: 'Call Ended', description: 'Triggered when a call ends with transcript and summary.' },
      { id: 'ringcentral.voicemail', label: 'Voicemail Received', description: 'Triggered when a new voicemail is received.' },
    ],
    actions: [
      { id: 'ringcentral.make_call', label: 'Make Call', description: 'Initiate a RingOut call.', inputFields: [
        { key: 'to', label: 'To Number', type: 'string', required: true },
        { key: 'from', label: 'From Number', type: 'string', required: true },
      ]},
      { id: 'ringcentral.send_sms', label: 'Send SMS', description: 'Send an SMS via RingCentral.', inputFields: [
        { key: 'to', label: 'To Number', type: 'string', required: true },
        { key: 'text', label: 'Message', type: 'text', required: true },
      ]},
      { id: 'ringcentral.get_call_summary', label: 'Get AI Call Summary', description: 'Get AI-generated summary and action items from a call.', inputFields: [
        { key: 'call_id', label: 'Call ID', type: 'string', required: true },
      ]},
      { id: 'ringcentral.analyze_sentiment', label: 'Analyze Call Sentiment', description: 'Get sentiment analysis for a call recording.', inputFields: [
        { key: 'call_id', label: 'Call ID', type: 'string', required: true },
      ]},
    ],
    tags: ['call', 'ai', 'sentiment', 'voip', 'transcription'],
    popular: true,
  },
  {
    id: 'knowlarity',
    name: 'Knowlarity',
    description: 'Indian cloud communications platform for virtual numbers, IVR, and call tracking.',
    category: 'telephony',
    icon: 'KN',
    color: '#1E88E5',
    website: 'https://knowlarity.com',
    authType: 'api_key',
    authFields: [
      { key: 'api_key', label: 'API Key', type: 'password', required: true },
      { key: 'sr_number', label: 'SR Number', type: 'text', required: true, placeholder: 'SuperReceptionist number' },
    ],
    triggers: [
      { id: 'knowlarity.call_event', label: 'Call Event', description: 'Triggered on call events (incoming, outgoing, missed).' },
    ],
    actions: [
      { id: 'knowlarity.make_call', label: 'Make Call', description: 'Initiate a call via Knowlarity.', inputFields: [
        { key: 'agent_number', label: 'Agent Number', type: 'string', required: true },
        { key: 'customer_number', label: 'Customer Number', type: 'string', required: true },
      ]},
    ],
    tags: ['call', 'ivr', 'india', 'virtual-number'],
  },

  // ── CRM & SUPPORT ─────────────────────────────────────────────
  {
    id: 'kapture',
    name: 'Kapture CX',
    description: 'AI-powered customer support platform with omnichannel ticketing, SLA management, and agent assist.',
    category: 'crm-support',
    icon: 'KP',
    color: '#E91E63',
    website: 'https://kapturecrm.com',
    authType: 'api_key',
    authFields: [
      { key: 'api_key', label: 'API Key', type: 'password', required: true },
      { key: 'domain', label: 'Domain', type: 'text', required: true, placeholder: 'your-company.kapturecrm.com' },
    ],
    triggers: [
      { id: 'kapture.ticket_created', label: 'Ticket Created', description: 'Triggered when a new support ticket is created.' },
      { id: 'kapture.ticket_updated', label: 'Ticket Updated', description: 'Triggered when a ticket is updated (status, assignee, priority).' },
      { id: 'kapture.sla_breach', label: 'SLA Breach', description: 'Triggered when a ticket breaches its SLA deadline.' },
    ],
    actions: [
      { id: 'kapture.create_ticket', label: 'Create Ticket', description: 'Create a new support ticket.', inputFields: [
        { key: 'subject', label: 'Subject', type: 'string', required: true },
        { key: 'description', label: 'Description', type: 'text', required: true },
        { key: 'priority', label: 'Priority', type: 'string', required: false, description: 'low | medium | high | urgent' },
        { key: 'category', label: 'Category', type: 'string', required: false },
        { key: 'assignee_email', label: 'Assignee Email', type: 'string', required: false },
      ]},
      { id: 'kapture.update_ticket', label: 'Update Ticket', description: 'Update an existing ticket.', inputFields: [
        { key: 'ticket_id', label: 'Ticket ID', type: 'string', required: true },
        { key: 'status', label: 'Status', type: 'string', required: false },
        { key: 'priority', label: 'Priority', type: 'string', required: false },
        { key: 'note', label: 'Internal Note', type: 'text', required: false },
      ]},
      { id: 'kapture.get_customer', label: 'Get Customer 360', description: 'Retrieve full customer profile and interaction history.', inputFields: [
        { key: 'customer_id', label: 'Customer ID or Email', type: 'string', required: true },
      ]},
    ],
    tags: ['ticketing', 'support', 'crm', 'sla', 'india', 'customer'],
    popular: true,
  },
  {
    id: 'freshdesk',
    name: 'Freshdesk',
    description: 'Customer support software with ticketing, automation, and self-service portals.',
    category: 'crm-support',
    icon: 'FD',
    color: '#00B853',
    website: 'https://freshdesk.com',
    authType: 'api_key',
    authFields: [
      { key: 'api_key', label: 'API Key', type: 'password', required: true },
      { key: 'domain', label: 'Domain', type: 'text', required: true, placeholder: 'your-company.freshdesk.com' },
    ],
    triggers: [
      { id: 'freshdesk.ticket_created', label: 'Ticket Created', description: 'Triggered when a new ticket is created.' },
      { id: 'freshdesk.ticket_updated', label: 'Ticket Updated', description: 'Triggered when a ticket is updated.' },
    ],
    actions: [
      { id: 'freshdesk.create_ticket', label: 'Create Ticket', description: 'Create a new Freshdesk ticket.', inputFields: [
        { key: 'subject', label: 'Subject', type: 'string', required: true },
        { key: 'description', label: 'Description', type: 'text', required: true },
        { key: 'email', label: 'Requester Email', type: 'string', required: true },
        { key: 'priority', label: 'Priority (1-4)', type: 'string', required: false },
        { key: 'status', label: 'Status (2-5)', type: 'string', required: false },
      ]},
      { id: 'freshdesk.update_ticket', label: 'Update Ticket', description: 'Update a Freshdesk ticket.', inputFields: [
        { key: 'ticket_id', label: 'Ticket ID', type: 'string', required: true },
        { key: 'status', label: 'Status', type: 'string', required: false },
        { key: 'note', label: 'Note', type: 'text', required: false },
      ]},
    ],
    tags: ['ticketing', 'support', 'helpdesk'],
  },
  {
    id: 'zendesk',
    name: 'Zendesk',
    description: 'Customer service and engagement platform with ticketing, chat, and knowledge base.',
    category: 'crm-support',
    icon: 'ZD',
    color: '#03363D',
    website: 'https://zendesk.com',
    authType: 'api_key',
    authFields: [
      { key: 'email', label: 'Email', type: 'text', required: true },
      { key: 'api_token', label: 'API Token', type: 'password', required: true },
      { key: 'subdomain', label: 'Subdomain', type: 'text', required: true, placeholder: 'your-company' },
    ],
    triggers: [
      { id: 'zendesk.ticket_created', label: 'Ticket Created', description: 'Triggered when a new ticket is created.' },
      { id: 'zendesk.ticket_updated', label: 'Ticket Updated', description: 'Triggered when a ticket is updated.' },
    ],
    actions: [
      { id: 'zendesk.create_ticket', label: 'Create Ticket', description: 'Create a Zendesk ticket.', inputFields: [
        { key: 'subject', label: 'Subject', type: 'string', required: true },
        { key: 'description', label: 'Description', type: 'text', required: true },
        { key: 'priority', label: 'Priority', type: 'string', required: false },
      ]},
      { id: 'zendesk.update_ticket', label: 'Update Ticket', description: 'Update a Zendesk ticket.', inputFields: [
        { key: 'ticket_id', label: 'Ticket ID', type: 'string', required: true },
        { key: 'status', label: 'Status', type: 'string', required: false },
        { key: 'comment', label: 'Comment', type: 'text', required: false },
      ]},
    ],
    tags: ['ticketing', 'support', 'helpdesk', 'chat'],
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'World\'s leading CRM platform for sales, service, and marketing automation.',
    category: 'crm-support',
    icon: 'SF',
    color: '#00A1E0',
    website: 'https://salesforce.com',
    authType: 'oauth2',
    authFields: [
      { key: 'client_id', label: 'Consumer Key', type: 'text', required: true },
      { key: 'client_secret', label: 'Consumer Secret', type: 'password', required: true },
      { key: 'instance_url', label: 'Instance URL', type: 'url', required: true, placeholder: 'https://your-org.salesforce.com' },
    ],
    triggers: [
      { id: 'salesforce.record_created', label: 'Record Created', description: 'Triggered when a new record is created in any object.' },
      { id: 'salesforce.record_updated', label: 'Record Updated', description: 'Triggered when a record is updated.' },
    ],
    actions: [
      { id: 'salesforce.create_record', label: 'Create Record', description: 'Create a new Salesforce record.', inputFields: [
        { key: 'object', label: 'Object (Lead, Contact, etc.)', type: 'string', required: true },
        { key: 'fields', label: 'Field Values', type: 'json', required: true },
      ]},
      { id: 'salesforce.update_record', label: 'Update Record', description: 'Update a Salesforce record.', inputFields: [
        { key: 'object', label: 'Object', type: 'string', required: true },
        { key: 'record_id', label: 'Record ID', type: 'string', required: true },
        { key: 'fields', label: 'Field Values', type: 'json', required: true },
      ]},
      { id: 'salesforce.query', label: 'SOQL Query', description: 'Run a SOQL query.', inputFields: [
        { key: 'query', label: 'SOQL Query', type: 'text', required: true },
      ]},
    ],
    tags: ['crm', 'sales', 'leads', 'enterprise'],
    popular: true,
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Inbound marketing, sales, and CRM platform.',
    category: 'crm-support',
    icon: 'HS',
    color: '#FF7A59',
    website: 'https://hubspot.com',
    authType: 'bearer_token',
    authFields: [
      { key: 'access_token', label: 'Private App Access Token', type: 'password', required: true },
    ],
    triggers: [
      { id: 'hubspot.contact_created', label: 'Contact Created', description: 'Triggered when a new contact is created.' },
      { id: 'hubspot.deal_stage_changed', label: 'Deal Stage Changed', description: 'Triggered when a deal moves to a new stage.' },
    ],
    actions: [
      { id: 'hubspot.create_contact', label: 'Create Contact', description: 'Create a new HubSpot contact.', inputFields: [
        { key: 'email', label: 'Email', type: 'string', required: true },
        { key: 'firstname', label: 'First Name', type: 'string', required: false },
        { key: 'lastname', label: 'Last Name', type: 'string', required: false },
        { key: 'phone', label: 'Phone', type: 'string', required: false },
      ]},
      { id: 'hubspot.create_deal', label: 'Create Deal', description: 'Create a new deal.', inputFields: [
        { key: 'dealname', label: 'Deal Name', type: 'string', required: true },
        { key: 'amount', label: 'Amount', type: 'string', required: false },
        { key: 'pipeline', label: 'Pipeline', type: 'string', required: false },
      ]},
    ],
    tags: ['crm', 'marketing', 'sales', 'deals'],
  },

  // ── COMMUNICATION ──────────────────────────────────────────────
  {
    id: 'slack',
    name: 'Slack',
    description: 'Team messaging platform with channels, DMs, and app integrations.',
    category: 'communication',
    icon: 'SL',
    color: '#4A154B',
    website: 'https://slack.com',
    authType: 'oauth2',
    authFields: [
      { key: 'bot_token', label: 'Bot Token', type: 'password', required: true, placeholder: 'xoxb-...' },
    ],
    triggers: [
      { id: 'slack.message_posted', label: 'Message Posted', description: 'Triggered when a message is posted in a channel.' },
      { id: 'slack.reaction_added', label: 'Reaction Added', description: 'Triggered when a reaction emoji is added to a message.' },
    ],
    actions: [
      { id: 'slack.send_message', label: 'Send Message', description: 'Post a message to a Slack channel.', inputFields: [
        { key: 'channel', label: 'Channel ID', type: 'string', required: true },
        { key: 'text', label: 'Message Text', type: 'text', required: true },
      ]},
      { id: 'slack.send_dm', label: 'Send Direct Message', description: 'Send a DM to a user.', inputFields: [
        { key: 'user_id', label: 'User ID', type: 'string', required: true },
        { key: 'text', label: 'Message Text', type: 'text', required: true },
      ]},
    ],
    tags: ['messaging', 'team', 'channels', 'alerts'],
    popular: true,
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    description: 'Microsoft\'s collaboration platform with chat, meetings, and channel-based messaging.',
    category: 'communication',
    icon: 'MT',
    color: '#6264A7',
    website: 'https://teams.microsoft.com',
    authType: 'oauth2',
    authFields: [
      { key: 'client_id', label: 'App Client ID', type: 'text', required: true },
      { key: 'client_secret', label: 'Client Secret', type: 'password', required: true },
      { key: 'tenant_id', label: 'Tenant ID', type: 'text', required: true },
    ],
    triggers: [
      { id: 'teams.message_received', label: 'Message Received', description: 'Triggered when a message is received in a channel.' },
    ],
    actions: [
      { id: 'teams.send_message', label: 'Send Message', description: 'Post a message to a Teams channel.', inputFields: [
        { key: 'team_id', label: 'Team ID', type: 'string', required: true },
        { key: 'channel_id', label: 'Channel ID', type: 'string', required: true },
        { key: 'message', label: 'Message', type: 'text', required: true },
      ]},
    ],
    tags: ['messaging', 'team', 'microsoft', 'enterprise'],
  },
  {
    id: 'whatsapp_business',
    name: 'WhatsApp Business',
    description: 'Official WhatsApp Business API for customer messaging, templates, and broadcasts.',
    category: 'communication',
    icon: 'WA',
    color: '#25D366',
    website: 'https://business.whatsapp.com',
    authType: 'bearer_token',
    authFields: [
      { key: 'access_token', label: 'Access Token', type: 'password', required: true },
      { key: 'phone_number_id', label: 'Phone Number ID', type: 'text', required: true },
      { key: 'business_id', label: 'Business Account ID', type: 'text', required: true },
    ],
    triggers: [
      { id: 'whatsapp.message_received', label: 'Message Received', description: 'Triggered when a customer sends a message.' },
      { id: 'whatsapp.message_status', label: 'Message Status Update', description: 'Triggered on sent/delivered/read status changes.' },
    ],
    actions: [
      { id: 'whatsapp.send_template', label: 'Send Template Message', description: 'Send an approved template message.', inputFields: [
        { key: 'to', label: 'Phone Number', type: 'string', required: true },
        { key: 'template_name', label: 'Template Name', type: 'string', required: true },
        { key: 'language', label: 'Language Code', type: 'string', required: true, description: 'e.g. en_US' },
        { key: 'parameters', label: 'Parameters', type: 'json', required: false },
      ]},
      { id: 'whatsapp.send_text', label: 'Send Text Message', description: 'Send a free-form text message (within 24h window).', inputFields: [
        { key: 'to', label: 'Phone Number', type: 'string', required: true },
        { key: 'body', label: 'Message Body', type: 'text', required: true },
      ]},
    ],
    tags: ['whatsapp', 'messaging', 'customer', 'templates'],
    popular: true,
  },
  {
    id: 'email_smtp',
    name: 'Email (SMTP)',
    description: 'Send emails via any SMTP server — Gmail, Outlook, custom mail servers.',
    category: 'communication',
    icon: '✉',
    color: '#EA4335',
    website: '',
    authType: 'basic_auth',
    authFields: [
      { key: 'host', label: 'SMTP Host', type: 'text', required: true, placeholder: 'smtp.gmail.com' },
      { key: 'port', label: 'Port', type: 'text', required: true, placeholder: '587' },
      { key: 'username', label: 'Username', type: 'text', required: true },
      { key: 'password', label: 'Password', type: 'password', required: true },
    ],
    triggers: [],
    actions: [
      { id: 'smtp.send_email', label: 'Send Email', description: 'Send an email via SMTP.', inputFields: [
        { key: 'to', label: 'To', type: 'string', required: true },
        { key: 'subject', label: 'Subject', type: 'string', required: true },
        { key: 'body', label: 'Body (HTML)', type: 'text', required: true },
        { key: 'cc', label: 'CC', type: 'string', required: false },
      ]},
    ],
    tags: ['email', 'smtp', 'gmail', 'outlook'],
  },

  // ── ANALYTICS ──────────────────────────────────────────────────
  {
    id: 'segment',
    name: 'Segment',
    description: 'Customer data platform — collect, unify, and route event data to 300+ tools.',
    category: 'analytics',
    icon: 'SE',
    color: '#52BD94',
    website: 'https://segment.com',
    authType: 'api_key',
    authFields: [
      { key: 'write_key', label: 'Write Key', type: 'password', required: true },
    ],
    triggers: [],
    actions: [
      { id: 'segment.track', label: 'Track Event', description: 'Send a track event to Segment.', inputFields: [
        { key: 'user_id', label: 'User ID', type: 'string', required: true },
        { key: 'event', label: 'Event Name', type: 'string', required: true },
        { key: 'properties', label: 'Properties', type: 'json', required: false },
      ]},
      { id: 'segment.identify', label: 'Identify User', description: 'Send an identify call to Segment.', inputFields: [
        { key: 'user_id', label: 'User ID', type: 'string', required: true },
        { key: 'traits', label: 'Traits', type: 'json', required: false },
      ]},
    ],
    tags: ['cdp', 'events', 'tracking', 'data'],
  },
  {
    id: 'mixpanel',
    name: 'Mixpanel',
    description: 'Product analytics platform for tracking user interactions and funnel analysis.',
    category: 'analytics',
    icon: 'MP',
    color: '#7856FF',
    website: 'https://mixpanel.com',
    authType: 'api_key',
    authFields: [
      { key: 'token', label: 'Project Token', type: 'text', required: true },
      { key: 'api_secret', label: 'API Secret', type: 'password', required: true },
    ],
    triggers: [],
    actions: [
      { id: 'mixpanel.track', label: 'Track Event', description: 'Track an event in Mixpanel.', inputFields: [
        { key: 'event', label: 'Event Name', type: 'string', required: true },
        { key: 'distinct_id', label: 'Distinct ID', type: 'string', required: true },
        { key: 'properties', label: 'Properties', type: 'json', required: false },
      ]},
    ],
    tags: ['analytics', 'events', 'funnels', 'product'],
  },
  {
    id: 'google_analytics',
    name: 'Google Analytics',
    description: 'Web and app analytics platform for measuring traffic, engagement, and conversions.',
    category: 'analytics',
    icon: 'GA',
    color: '#E37400',
    website: 'https://analytics.google.com',
    authType: 'api_key',
    authFields: [
      { key: 'measurement_id', label: 'Measurement ID', type: 'text', required: true, placeholder: 'G-XXXXXXX' },
      { key: 'api_secret', label: 'API Secret', type: 'password', required: true },
    ],
    triggers: [],
    actions: [
      { id: 'ga.send_event', label: 'Send Event', description: 'Send a custom event to GA4 via Measurement Protocol.', inputFields: [
        { key: 'client_id', label: 'Client ID', type: 'string', required: true },
        { key: 'event_name', label: 'Event Name', type: 'string', required: true },
        { key: 'params', label: 'Event Parameters', type: 'json', required: false },
      ]},
    ],
    tags: ['analytics', 'tracking', 'google', 'web'],
  },

  // ── CLOUD & INFRA ─────────────────────────────────────────────
  {
    id: 'aws',
    name: 'AWS',
    description: 'Amazon Web Services — SNS, SQS, Lambda, S3, and more.',
    category: 'cloud-infra',
    icon: 'AW',
    color: '#FF9900',
    website: 'https://aws.amazon.com',
    authType: 'api_key',
    authFields: [
      { key: 'access_key_id', label: 'Access Key ID', type: 'text', required: true },
      { key: 'secret_access_key', label: 'Secret Access Key', type: 'password', required: true },
      { key: 'region', label: 'Region', type: 'text', required: true, placeholder: 'ap-south-1' },
    ],
    triggers: [
      { id: 'aws.sqs_message', label: 'SQS Message Received', description: 'Triggered when a message arrives in an SQS queue.' },
      { id: 'aws.sns_notification', label: 'SNS Notification', description: 'Triggered when an SNS topic receives a message.' },
    ],
    actions: [
      { id: 'aws.publish_sns', label: 'Publish to SNS', description: 'Publish a message to an SNS topic.', inputFields: [
        { key: 'topic_arn', label: 'Topic ARN', type: 'string', required: true },
        { key: 'message', label: 'Message', type: 'text', required: true },
        { key: 'subject', label: 'Subject', type: 'string', required: false },
      ]},
      { id: 'aws.send_sqs', label: 'Send to SQS', description: 'Send a message to an SQS queue.', inputFields: [
        { key: 'queue_url', label: 'Queue URL', type: 'url', required: true },
        { key: 'message_body', label: 'Message Body', type: 'text', required: true },
      ]},
      { id: 'aws.invoke_lambda', label: 'Invoke Lambda', description: 'Invoke an AWS Lambda function.', inputFields: [
        { key: 'function_name', label: 'Function Name', type: 'string', required: true },
        { key: 'payload', label: 'Payload', type: 'json', required: false },
      ]},
      { id: 'aws.put_s3', label: 'Upload to S3', description: 'Upload an object to S3.', inputFields: [
        { key: 'bucket', label: 'Bucket', type: 'string', required: true },
        { key: 'key', label: 'Object Key', type: 'string', required: true },
        { key: 'body', label: 'Content', type: 'text', required: true },
      ]},
    ],
    tags: ['cloud', 'lambda', 'sqs', 'sns', 's3', 'serverless'],
    popular: true,
  },
  {
    id: 'gcp',
    name: 'Google Cloud',
    description: 'Google Cloud Platform — Pub/Sub, Cloud Functions, BigQuery, and more.',
    category: 'cloud-infra',
    icon: 'GC',
    color: '#4285F4',
    website: 'https://cloud.google.com',
    authType: 'api_key',
    authFields: [
      { key: 'service_account_json', label: 'Service Account JSON', type: 'password', required: true },
      { key: 'project_id', label: 'Project ID', type: 'text', required: true },
    ],
    triggers: [
      { id: 'gcp.pubsub_message', label: 'Pub/Sub Message', description: 'Triggered when a message arrives on a Pub/Sub topic.' },
    ],
    actions: [
      { id: 'gcp.publish_pubsub', label: 'Publish to Pub/Sub', description: 'Publish a message to a Pub/Sub topic.', inputFields: [
        { key: 'topic', label: 'Topic Name', type: 'string', required: true },
        { key: 'message', label: 'Message', type: 'text', required: true },
      ]},
      { id: 'gcp.invoke_function', label: 'Invoke Cloud Function', description: 'Call a Cloud Function via HTTP.', inputFields: [
        { key: 'function_url', label: 'Function URL', type: 'url', required: true },
        { key: 'payload', label: 'Payload', type: 'json', required: false },
      ]},
    ],
    tags: ['cloud', 'pubsub', 'bigquery', 'serverless', 'google'],
  },

  // ── DATABASES ──────────────────────────────────────────────────
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    description: 'Open-source relational database for structured data queries and transactions.',
    category: 'databases',
    icon: 'PG',
    color: '#336791',
    website: 'https://postgresql.org',
    authType: 'basic_auth',
    authFields: [
      { key: 'host', label: 'Host', type: 'text', required: true },
      { key: 'port', label: 'Port', type: 'text', required: true, placeholder: '5432' },
      { key: 'database', label: 'Database', type: 'text', required: true },
      { key: 'user', label: 'User', type: 'text', required: true },
      { key: 'password', label: 'Password', type: 'password', required: true },
    ],
    triggers: [],
    actions: [
      { id: 'pg.query', label: 'Run SQL Query', description: 'Execute a SQL query and return results.', inputFields: [
        { key: 'query', label: 'SQL Query', type: 'text', required: true },
      ]},
      { id: 'pg.insert', label: 'Insert Row', description: 'Insert a row into a table.', inputFields: [
        { key: 'table', label: 'Table Name', type: 'string', required: true },
        { key: 'data', label: 'Row Data', type: 'json', required: true },
      ]},
    ],
    tags: ['sql', 'database', 'relational', 'postgres'],
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    description: 'Document database for flexible, JSON-like data storage.',
    category: 'databases',
    icon: 'MG',
    color: '#47A248',
    website: 'https://mongodb.com',
    authType: 'basic_auth',
    authFields: [
      { key: 'connection_string', label: 'Connection String', type: 'password', required: true, placeholder: 'mongodb+srv://...' },
      { key: 'database', label: 'Database Name', type: 'text', required: true },
    ],
    triggers: [
      { id: 'mongo.change_stream', label: 'Document Changed', description: 'Triggered when a document is inserted, updated, or deleted.' },
    ],
    actions: [
      { id: 'mongo.find', label: 'Find Documents', description: 'Query documents from a collection.', inputFields: [
        { key: 'collection', label: 'Collection', type: 'string', required: true },
        { key: 'filter', label: 'Filter', type: 'json', required: false },
      ]},
      { id: 'mongo.insert', label: 'Insert Document', description: 'Insert a document into a collection.', inputFields: [
        { key: 'collection', label: 'Collection', type: 'string', required: true },
        { key: 'document', label: 'Document', type: 'json', required: true },
      ]},
    ],
    tags: ['nosql', 'database', 'documents', 'atlas'],
  },
  {
    id: 'redis',
    name: 'Redis',
    description: 'In-memory data store for caching, pub/sub, and real-time data.',
    category: 'databases',
    icon: 'RD',
    color: '#DC382D',
    website: 'https://redis.io',
    authType: 'basic_auth',
    authFields: [
      { key: 'host', label: 'Host', type: 'text', required: true },
      { key: 'port', label: 'Port', type: 'text', required: true, placeholder: '6379' },
      { key: 'password', label: 'Password', type: 'password', required: false },
    ],
    triggers: [
      { id: 'redis.pubsub_message', label: 'Pub/Sub Message', description: 'Triggered when a message is published to a subscribed channel.' },
    ],
    actions: [
      { id: 'redis.set', label: 'Set Key', description: 'Set a key-value pair in Redis.', inputFields: [
        { key: 'key', label: 'Key', type: 'string', required: true },
        { key: 'value', label: 'Value', type: 'text', required: true },
        { key: 'ttl', label: 'TTL (seconds)', type: 'string', required: false },
      ]},
      { id: 'redis.get', label: 'Get Key', description: 'Get a value by key.', inputFields: [
        { key: 'key', label: 'Key', type: 'string', required: true },
      ]},
      { id: 'redis.publish', label: 'Publish Message', description: 'Publish a message to a Redis channel.', inputFields: [
        { key: 'channel', label: 'Channel', type: 'string', required: true },
        { key: 'message', label: 'Message', type: 'text', required: true },
      ]},
    ],
    tags: ['cache', 'pubsub', 'realtime', 'key-value'],
  },
  {
    id: 'elasticsearch',
    name: 'Elasticsearch',
    description: 'Distributed search and analytics engine for log data, full-text search, and observability.',
    category: 'databases',
    icon: 'ES',
    color: '#FED10A',
    website: 'https://elastic.co',
    authType: 'basic_auth',
    authFields: [
      { key: 'host', label: 'Host URL', type: 'url', required: true, placeholder: 'https://your-cluster.es.io:9243' },
      { key: 'username', label: 'Username', type: 'text', required: true },
      { key: 'password', label: 'Password', type: 'password', required: true },
    ],
    triggers: [],
    actions: [
      { id: 'es.search', label: 'Search', description: 'Run a search query.', inputFields: [
        { key: 'index', label: 'Index', type: 'string', required: true },
        { key: 'query', label: 'Query (JSON)', type: 'json', required: true },
      ]},
      { id: 'es.index_doc', label: 'Index Document', description: 'Index a document.', inputFields: [
        { key: 'index', label: 'Index', type: 'string', required: true },
        { key: 'document', label: 'Document', type: 'json', required: true },
      ]},
    ],
    tags: ['search', 'logs', 'analytics', 'elk'],
  },

  // ── AI & ML ────────────────────────────────────────────────────
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4, DALL-E, and Whisper APIs for text generation, image creation, and speech-to-text.',
    category: 'ai-ml',
    icon: 'OA',
    color: '#10A37F',
    website: 'https://openai.com',
    authType: 'bearer_token',
    authFields: [
      { key: 'api_key', label: 'API Key', type: 'password', required: true, placeholder: 'sk-...' },
    ],
    triggers: [],
    actions: [
      { id: 'openai.chat_completion', label: 'Chat Completion', description: 'Generate a response using GPT-4.', inputFields: [
        { key: 'model', label: 'Model', type: 'string', required: true, description: 'gpt-4o, gpt-4o-mini, etc.' },
        { key: 'messages', label: 'Messages', type: 'json', required: true, description: '[{"role":"user","content":"..."}]' },
        { key: 'temperature', label: 'Temperature', type: 'string', required: false },
      ]},
      { id: 'openai.embeddings', label: 'Create Embeddings', description: 'Generate vector embeddings for text.', inputFields: [
        { key: 'input', label: 'Input Text', type: 'text', required: true },
        { key: 'model', label: 'Model', type: 'string', required: false },
      ]},
    ],
    tags: ['ai', 'gpt', 'llm', 'embeddings', 'generation'],
    popular: true,
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    description: 'Claude API for safe, helpful AI — chat, analysis, code generation, and tool use.',
    category: 'ai-ml',
    icon: 'CL',
    color: '#D4A574',
    website: 'https://anthropic.com',
    authType: 'api_key',
    authFields: [
      { key: 'api_key', label: 'API Key', type: 'password', required: true, placeholder: 'sk-ant-...' },
    ],
    triggers: [],
    actions: [
      { id: 'anthropic.message', label: 'Create Message', description: 'Generate a response using Claude.', inputFields: [
        { key: 'model', label: 'Model', type: 'string', required: true, description: 'claude-sonnet-4-6, claude-opus-4-6, etc.' },
        { key: 'messages', label: 'Messages', type: 'json', required: true },
        { key: 'max_tokens', label: 'Max Tokens', type: 'string', required: true },
        { key: 'system', label: 'System Prompt', type: 'text', required: false },
      ]},
    ],
    tags: ['ai', 'claude', 'llm', 'analysis', 'safe-ai'],
    popular: true,
  },
  {
    id: 'google_gemini',
    name: 'Google Gemini',
    description: 'Google\'s multimodal AI model for text, image, and code understanding.',
    category: 'ai-ml',
    icon: 'GM',
    color: '#4285F4',
    website: 'https://ai.google.dev',
    authType: 'api_key',
    authFields: [
      { key: 'api_key', label: 'API Key', type: 'password', required: true },
    ],
    triggers: [],
    actions: [
      { id: 'gemini.generate', label: 'Generate Content', description: 'Generate text using Gemini.', inputFields: [
        { key: 'model', label: 'Model', type: 'string', required: true, description: 'gemini-2.0-flash, etc.' },
        { key: 'prompt', label: 'Prompt', type: 'text', required: true },
      ]},
    ],
    tags: ['ai', 'gemini', 'multimodal', 'google'],
  },

  // ── LOGISTICS ──────────────────────────────────────────────────
  {
    id: 'google_maps',
    name: 'Google Maps',
    description: 'Maps, geocoding, directions, distance matrix, and places APIs.',
    category: 'logistics',
    icon: 'GM',
    color: '#34A853',
    website: 'https://developers.google.com/maps',
    authType: 'api_key',
    authFields: [
      { key: 'api_key', label: 'API Key', type: 'password', required: true },
    ],
    triggers: [],
    actions: [
      { id: 'gmaps.geocode', label: 'Geocode Address', description: 'Convert an address to lat/lng coordinates.', inputFields: [
        { key: 'address', label: 'Address', type: 'string', required: true },
      ]},
      { id: 'gmaps.directions', label: 'Get Directions', description: 'Get route directions between two points.', inputFields: [
        { key: 'origin', label: 'Origin', type: 'string', required: true },
        { key: 'destination', label: 'Destination', type: 'string', required: true },
        { key: 'mode', label: 'Travel Mode', type: 'string', required: false, description: 'driving | walking | transit' },
      ]},
      { id: 'gmaps.distance_matrix', label: 'Distance Matrix', description: 'Get travel time and distance between multiple origins and destinations.', inputFields: [
        { key: 'origins', label: 'Origins', type: 'string', required: true },
        { key: 'destinations', label: 'Destinations', type: 'string', required: true },
      ]},
    ],
    tags: ['maps', 'geocoding', 'directions', 'distance', 'location'],
  },
  {
    id: 'here_maps',
    name: 'HERE Maps',
    description: 'Location platform for routing, geocoding, fleet management, and geofencing.',
    category: 'logistics',
    icon: 'HE',
    color: '#48DAD0',
    website: 'https://developer.here.com',
    authType: 'api_key',
    authFields: [
      { key: 'api_key', label: 'API Key', type: 'password', required: true },
    ],
    triggers: [
      { id: 'here.geofence_event', label: 'Geofence Event', description: 'Triggered when a device enters or exits a geofence.' },
    ],
    actions: [
      { id: 'here.geocode', label: 'Geocode', description: 'Convert address to coordinates.', inputFields: [
        { key: 'query', label: 'Address', type: 'string', required: true },
      ]},
      { id: 'here.route', label: 'Calculate Route', description: 'Calculate a route with traffic.', inputFields: [
        { key: 'origin', label: 'Origin (lat,lng)', type: 'string', required: true },
        { key: 'destination', label: 'Destination (lat,lng)', type: 'string', required: true },
        { key: 'transport_mode', label: 'Transport Mode', type: 'string', required: false, description: 'car | truck | pedestrian' },
      ]},
    ],
    tags: ['maps', 'routing', 'geofence', 'fleet', 'logistics'],
  },

  // ── PAYMENTS ───────────────────────────────────────────────────
  {
    id: 'razorpay',
    name: 'Razorpay',
    description: 'Indian payment gateway for online payments, subscriptions, and payouts.',
    category: 'payments',
    icon: 'RP',
    color: '#2D67F6',
    website: 'https://razorpay.com',
    authType: 'basic_auth',
    authFields: [
      { key: 'key_id', label: 'Key ID', type: 'text', required: true },
      { key: 'key_secret', label: 'Key Secret', type: 'password', required: true },
    ],
    triggers: [
      { id: 'razorpay.payment_captured', label: 'Payment Captured', description: 'Triggered when a payment is successfully captured.' },
      { id: 'razorpay.payment_failed', label: 'Payment Failed', description: 'Triggered when a payment fails.' },
      { id: 'razorpay.refund_processed', label: 'Refund Processed', description: 'Triggered when a refund is processed.' },
    ],
    actions: [
      { id: 'razorpay.create_order', label: 'Create Order', description: 'Create a Razorpay order.', inputFields: [
        { key: 'amount', label: 'Amount (paise)', type: 'string', required: true },
        { key: 'currency', label: 'Currency', type: 'string', required: true, description: 'INR, USD, etc.' },
        { key: 'receipt', label: 'Receipt ID', type: 'string', required: false },
      ]},
      { id: 'razorpay.create_payout', label: 'Create Payout', description: 'Send money to a bank account or UPI.', inputFields: [
        { key: 'account_number', label: 'Your Account Number', type: 'string', required: true },
        { key: 'amount', label: 'Amount (paise)', type: 'string', required: true },
        { key: 'fund_account_id', label: 'Fund Account ID', type: 'string', required: true },
      ]},
    ],
    tags: ['payments', 'upi', 'india', 'gateway', 'payout'],
    popular: true,
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Global payment processing platform for online payments, subscriptions, and billing.',
    category: 'payments',
    icon: 'ST',
    color: '#635BFF',
    website: 'https://stripe.com',
    authType: 'api_key',
    authFields: [
      { key: 'secret_key', label: 'Secret Key', type: 'password', required: true, placeholder: 'sk_...' },
    ],
    triggers: [
      { id: 'stripe.payment_succeeded', label: 'Payment Succeeded', description: 'Triggered when a payment succeeds.' },
      { id: 'stripe.invoice_paid', label: 'Invoice Paid', description: 'Triggered when an invoice is paid.' },
      { id: 'stripe.subscription_updated', label: 'Subscription Updated', description: 'Triggered when a subscription changes.' },
    ],
    actions: [
      { id: 'stripe.create_charge', label: 'Create Charge', description: 'Create a one-time payment charge.', inputFields: [
        { key: 'amount', label: 'Amount (cents)', type: 'string', required: true },
        { key: 'currency', label: 'Currency', type: 'string', required: true },
        { key: 'customer', label: 'Customer ID', type: 'string', required: false },
      ]},
      { id: 'stripe.create_customer', label: 'Create Customer', description: 'Create a Stripe customer.', inputFields: [
        { key: 'email', label: 'Email', type: 'string', required: true },
        { key: 'name', label: 'Name', type: 'string', required: false },
      ]},
    ],
    tags: ['payments', 'subscriptions', 'billing', 'global'],
  },

  // ── WEBHOOK & HTTP ─────────────────────────────────────────────
  {
    id: 'webhook',
    name: 'Webhook',
    description: 'Generic HTTP webhook — receive inbound webhooks or send outbound HTTP requests to any API.',
    category: 'webhook',
    icon: '⚡',
    color: '#64748B',
    website: '',
    authType: 'none',
    authFields: [],
    triggers: [
      { id: 'webhook.inbound', label: 'Receive Webhook', description: 'Triggered when an HTTP POST is received at the workflow webhook URL.' },
    ],
    actions: [
      { id: 'webhook.http_request', label: 'HTTP Request', description: 'Send an HTTP request to any URL.', inputFields: [
        { key: 'method', label: 'Method', type: 'string', required: true, description: 'GET | POST | PUT | PATCH | DELETE' },
        { key: 'url', label: 'URL', type: 'url', required: true },
        { key: 'headers', label: 'Headers', type: 'json', required: false },
        { key: 'body', label: 'Request Body', type: 'json', required: false },
      ]},
    ],
    tags: ['http', 'api', 'rest', 'webhook', 'custom'],
    popular: true,
  },
  {
    id: 'graphql',
    name: 'GraphQL',
    description: 'Send GraphQL queries and mutations to any GraphQL endpoint.',
    category: 'webhook',
    icon: 'GQ',
    color: '#E535AB',
    website: '',
    authType: 'bearer_token',
    authFields: [
      { key: 'endpoint', label: 'GraphQL Endpoint', type: 'url', required: true },
      { key: 'access_token', label: 'Access Token', type: 'password', required: false },
    ],
    triggers: [],
    actions: [
      { id: 'graphql.query', label: 'Execute Query', description: 'Run a GraphQL query or mutation.', inputFields: [
        { key: 'query', label: 'Query', type: 'text', required: true },
        { key: 'variables', label: 'Variables', type: 'json', required: false },
      ]},
    ],
    tags: ['graphql', 'api', 'query'],
  },
];

export function getIntegrationById(id: string): Integration | undefined {
  return INTEGRATIONS.find((i) => i.id === id);
}

export function getIntegrationsByCategory(category: string): Integration[] {
  if (category === 'all') return INTEGRATIONS;
  return INTEGRATIONS.filter((i) => i.category === category);
}

export function searchIntegrations(query: string): Integration[] {
  const q = query.toLowerCase();
  return INTEGRATIONS.filter(
    (i) =>
      i.name.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q) ||
      i.tags.some((t) => t.includes(q))
  );
}
