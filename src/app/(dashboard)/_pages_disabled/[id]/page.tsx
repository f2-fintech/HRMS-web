'use client';

import PageEditor from '@/components/pages/PageEditor';

export default function PageEditorPage({ params }: { params: { id: string } }) {
  return <PageEditor pageId={params.id} />;
}
