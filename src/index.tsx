import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app';
import { GoogleAnalytics } from './components/GoogleAnalytics';
import { EmojiFamilyProvider } from '@/providers/EmojiFamilyProvider';
import { EmojiGridSettingsProvider } from '@/providers/EmojiGridSettingsProvider';
import { PictureInPictureProvider } from '@/providers/PictureInPictureProvider';

const container = document.getElementById('root');
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(container!);

const gTagId = import.meta.env.VITE_GA_TAG_ID;

root.render(
  <React.StrictMode>
    {gTagId && <GoogleAnalytics gTagId={gTagId}></GoogleAnalytics>}
    <PictureInPictureProvider>
      <EmojiFamilyProvider>
        <EmojiGridSettingsProvider>
          <App />
        </EmojiGridSettingsProvider>
      </EmojiFamilyProvider>
    </PictureInPictureProvider>
  </React.StrictMode>,
);
