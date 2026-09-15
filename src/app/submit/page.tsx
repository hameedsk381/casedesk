import React from 'react';
import CitizenSubmissionPortal from '@/components/public/CitizenSubmissionPortal';
import { getSubmissionEndpoint } from '@/lib/intake/submissionService';

export default async function SubmitPage() {
  let endpointData: any = undefined;
  try {
    const endpoint = await getSubmissionEndpoint();
    if (endpoint) {
      endpointData = {
        slug: endpoint.slug,
        title: endpoint.title,
        description: endpoint.description,
        requireContact: endpoint.requireContact,
        allowAnonymous: endpoint.allowAnonymous,
        allowVoice: endpoint.allowVoice,
        allowAttachments: endpoint.allowAttachments,
        workspaceName: endpoint.workspace?.name,
      };
    }
  } catch (err) {
    console.error('Failed to load default endpoint:', err);
  }

  return <CitizenSubmissionPortal endpoint={endpointData} />;
}
