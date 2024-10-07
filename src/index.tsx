import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app';
import { GoogleAnalytics } from './components/GoogleAnalytics';
import { EmojiFamilyProvider } from '@/providers/EmojiFamilyProvider';
import { EmojiGridSettingsProvider } from '@/providers/EmojiGridSettingsProvider';
import { PictureInPictureProvider } from '@/providers/PictureInPictureProvider';

const CONTAINER = document.getElementById('root');
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const ROOT = createRoot(CONTAINER!);

const G_TAG_ID = import.meta.env.VITE_GA_TAG_ID;

ROOT.render(
  <React.StrictMode>
    {G_TAG_ID && <GoogleAnalytics gTagId={G_TAG_ID}></GoogleAnalytics>}
    <PictureInPictureProvider>
      <EmojiFamilyProvider>
        <EmojiGridSettingsProvider>
          <App />
        </EmojiGridSettingsProvider>
      </EmojiFamilyProvider>
    </PictureInPictureProvider>
  </React.StrictMode>,
);
