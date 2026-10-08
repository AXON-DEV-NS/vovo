import { Composition } from "remotion";
import { HeroFilm, type HeroVariant } from "./HeroFilm";
import { DURATION_IN_FRAMES, FPS, LAYOUTS } from "./brand";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="HeroDesktop"
        component={HeroFilm}
        durationInFrames={DURATION_IN_FRAMES}
        fps={FPS}
        width={LAYOUTS.desktop.width}
        height={LAYOUTS.desktop.height}
        defaultProps={{ variant: "desktop" as HeroVariant }}
      />
      <Composition
        id="HeroMobile"
        component={HeroFilm}
        durationInFrames={DURATION_IN_FRAMES}
        fps={FPS}
        width={LAYOUTS.mobile.width}
        height={LAYOUTS.mobile.height}
        defaultProps={{ variant: "mobile" as HeroVariant }}
      />
    </>
  );
};
