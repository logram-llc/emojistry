import {
  PropsWithChildren,
  useState,
  createContext,
  useContext,
  useEffect,
} from 'react';

interface PictureInPictureState {
  supportsPictureInPicture: boolean;
  isPictureInPicture: boolean;
}

const PictureInPictureContext = createContext<PictureInPictureState>({
  isPictureInPicture: false,
  supportsPictureInPicture: false,
});

function PictureInPictureProvider({ children }: PropsWithChildren<unknown>) {
  const [isPnp, setPnp] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const inIframe = window.self !== window.top;
    const hasPnPSupport = 'documentPictureInPicture' in window;

    // NOTE(nicholas-ramsey): If we're in an iframe, we're most likely embedded in Picture-in-Picture mode.
    setPnp(inIframe);
    setIsSupported(hasPnPSupport);
  }, []);

  return (
    <PictureInPictureContext.Provider
      value={{
        isPictureInPicture: isPnp,
        supportsPictureInPicture: isSupported,
      }}
    >
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
