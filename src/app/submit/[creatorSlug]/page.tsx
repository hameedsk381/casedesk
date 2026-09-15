import React from 'react';
import CitizenSubmissionPortal from '@/components/public/CitizenSubmissionPortal';
import { getSubmissionEndpoint } from '@/lib/intake/submissionService';
import { notFound } from 'next/navigation';

export default async function CreatorSubmitPage({
  params,
}: {
  params: Promise<{ creatorSlug: string }>;
}) {
  const { creatorSlug } = await params;

  let endpointData: any = undefined;
  try {
    const endpoint = await getSubmissionEndpoint(creatorSlug);
    if (!endpoint || !endpoint.isActive) {
      notFound();
    }
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
  } catch (err) {
    console.error('Failed to load creator endpoint:', err);
    notFound();
  }

  return <CitizenSubmissionPortal endpoint={endpointData} creatorSlug={creatorSlug} />;
}
