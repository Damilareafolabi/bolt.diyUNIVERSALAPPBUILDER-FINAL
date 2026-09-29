import { json, type LoaderFunctionArgs, type MetaFunction } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';
import { Chat } from '~/components/chat/Chat.client';
import { FactoryLaunchpad } from '~/components/factory/FactoryLaunchpad.client';
import { Header } from '~/components/header/Header';
import BackgroundRays from '~/components/ui/BackgroundRays';

export const meta: MetaFunction = () => {
  return [
    { title: 'Simeony — IDEA IN. APP OUT.' },
    { name: 'description', content: 'Don’t fight with code. Just build your idea with Simeony.' },
  ];
};

export const loader = ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  return json({ startChat: url.searchParams.has('prompt') || url.searchParams.has('factoryBuild') });
};

/**
 * Landing page component for Bolt
 * Note: Settings functionality should ONLY be accessed through the sidebar menu.
 * Do not add settings button/panel to this landing page as it was intentionally removed
 * to keep the UI clean and consistent with the design system.
 */
export default function Index() {
  const { startChat } = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col h-full w-full bg-bolt-elements-background-depth-1">
      <BackgroundRays />
      <Header />
      {startChat ? (
        <ClientOnly fallback={<BaseChat />}>{() => <Chat />}</ClientOnly>
      ) : (
        <FactoryLaunchpad />
      )}
    </div>
  );
}
