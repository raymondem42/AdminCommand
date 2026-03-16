import { actions } from '@/lib/actions/registry';
import { notFound } from 'next/navigation';
import ActionFlow from './action-flow';

export default async function ActionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const action = actions.find((a) => a.id === id);
  if (!action) notFound();

  return <ActionFlow action={action} />;
}