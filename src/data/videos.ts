// Direct, hotlinkable demo video files (curl-verified HTTP 200, video/mp4).
// Cropped with object-fit: cover inside a 9:16 frame so any source aspect
// ratio fills the vertical feed cleanly.
export const videos = {
  sneakers:
    "https://videos.pexels.com/video-files/7644257/7644257-uhd_2560_1440_24fps.mp4",
  apparel:
    "https://videos.pexels.com/video-files/7680449/7680449-uhd_2732_1440_25fps.mp4",
  coffee:
    "https://videos.pexels.com/video-files/7657786/7657786-hd_1080_1920_25fps.mp4",
  food: "https://videos.pexels.com/video-files/3752411/3752411-hd_1920_1080_24fps.mp4",
  hotel:
    "https://videos.pexels.com/video-files/7507166/7507166-uhd_2732_1440_25fps.mp4",
  festival:
    "https://videos.pexels.com/video-files/35340079/14973729_1080_1920_60fps.mp4",
  fitness:
    "https://videos.pexels.com/video-files/18941351/18941351-hd_1080_1920_50fps.mp4",
  headphones:
    "https://videos.pexels.com/video-files/9941078/9941078-uhd_1440_2732_25fps.mp4",
  beauty:
    "https://videos.pexels.com/video-files/7754395/7754395-hd_1080_1920_30fps.mp4",
  themepark:
    "https://videos.pexels.com/video-files/9153299/9153299-hd_720_1280_30fps.mp4",
} as const;

export function videoFor(seed: number): string {
  const pool = Object.values(videos);
  return pool[seed % pool.length];
}
