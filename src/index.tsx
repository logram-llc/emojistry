import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app';
import { EmojiFamilyProvider } from '@/providers/EmojiFamilyProvider';
import { EmojiGridSettingsProvider } from '@/providers/EmojiGridSettingsProvider';

const container = document.getElementById('root');
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <EmojiFamilyProvider>
      <EmojiGridSettingsProvider>
        <App />
      </EmojiGridSettingsProvider>
    </EmojiFamilyProvider>
  </React.StrictMode>,
);
