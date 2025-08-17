import { createRoot } from 'react-dom/client';
import type { ReactElement } from 'react';

export const initAppWithShadow = ({ id, app, inlineCss }: { id: string; inlineCss: string; app: ReactElement }) => {
  const root = document.createElement('div');
  root.id = id;

  document.body.append(root);

  const rootIntoShadow = document.createElement('div');

  const shadowRoot = root.attachShadow({ mode: 'open' });

  shadowRoot.appendChild(rootIntoShadow);
  createRoot(rootIntoShadow).render(app);
};
