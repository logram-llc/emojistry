import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app';
import { EmojiFamilyProvider } from '@/providers/EmojiFamilyProvider';
import { EmojiGridSettingsProvider } from '@/providers/EmojiGridSettingsProvider';
import { PictureInPictureProvider } from '@/providers/PictureInPictureProvider';

const container = document.getElementById('root');
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <PictureInPictureProvider>
      <EmojiFamilyProvider>
        <EmojiGridSettingsProvider>
          <App />
        </EmojiGridSettingsProvider>
      </EmojiFamilyProvider>
    </PictureInPictureProvider>
  </React.StrictMode>,
);
