import {
  PropsWithChildren,
  useState,
  createContext,
  useContext,
  useEffect,
} from 'react';

interface PictureInPictureState {
  isPictureInPicture: boolean;
}

const PictureInPictureContext = createContext<PictureInPictureState>({
  isPictureInPicture: false,
});

function PictureInPictureProvider({ children }: PropsWithChildren<unknown>) {
  const [isPnp, setPnp] = useState(false);

  useEffect(() => {
    const inIframe = window.self !== window.top;

    // NOTE(nicholas-ramsey): If we're in an iframe, we're most likely embedded in Picture-in-Picture mode.
    setPnp(inIframe);
  }, []);

  return (
    <PictureInPictureContext.Provider value={{ isPictureInPicture: isPnp }}>
      {children}
    </PictureInPictureContext.Provider>
  );
}

const usePictureInPicture = () => {
  const context = useContext(PictureInPictureContext);

  if (context === undefined) {
    throw new Error(
      'usePictureInPicture must be used within a PictureInPictureProvider',
    );
  }

  return context;
};

export {
  PictureInPictureContext,
  PictureInPictureProvider,
  usePictureInPicture,
};
