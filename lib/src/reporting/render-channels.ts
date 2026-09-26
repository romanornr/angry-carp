import { reportingChannels } from './channels.ts';

export function renderReportingChannels(): string {
  const lines = [
    '# Reporting channels', '',
    '<!-- Generated from lib/src/reporting/channels.ts. Run npm run reporting:generate; edit the catalogue, not this file. -->', '',
    'Use a reference when case evidence connects the provider to the resource in the stated role. These are reviewed channel references, not fresh checks of a case or permission to send. Conditions must be checked against case evidence. An older check date is a recheck note, not a blanket reporting hold.', '',
  ];

  for (const record of reportingChannels) {
    lines.push(`## ${record.name}: ${record.serviceRoles.join(', ')}`, '', `Checked ${record.checkedAt} UTC.`, '');

    for (const channel of record.channels) {
      let destination: string;

      switch (channel.kind) {
        case 'email': destination = `Email: \`${channel.address}\``; break;
        case 'form': destination = `[Form](${channel.url})`; break;
        case 'instructions': destination = `[Web instructions](${channel.url})`; break;
      }

      lines.push(`- ${destination}. ${channel.condition}`);
    }

    lines.push('', `Evidence to prepare: ${record.evidence.join(' ')}`, '',
      `Published instructions: ${record.sources.map((source) => `[${source.label}](${source.url})`).join(', ')}.`, '');
  }

  lines.push('Prepare only the evidence needed by that recipient; complete-email forwarding is not the default. For other registrars, use the registrar abuse contact from case RDAP, retaining its registrar relationship and source. For other services, identify the official-channel gap instead of inventing a contact.', '');

  return lines.join('\n');
}
