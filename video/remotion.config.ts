import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setPixelFormat("yuv420p");
// Software rendering — always available in headless environments.
Config.setChromiumOpenGlRenderer("swiftshader");
