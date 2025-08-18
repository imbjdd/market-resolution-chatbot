'use client';

import { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import styles from './VideoPlayer.module.css';

type VideoJsPlayer = ReturnType<typeof videojs>;

export default function VideoPlayer() {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<VideoJsPlayer | null>(null);

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current) {
      const videoElement = document.createElement("video-js");
      
      videoElement.classList.add('vjs-default-skin');
      videoElement.style.width = '100%';
      videoElement.style.height = 'auto';
      
      if (videoRef.current) {
        videoRef.current.appendChild(videoElement);
      }

      const player = videojs(videoElement, {
        autoplay: true,
        controls: true,
        responsive: true,
        fluid: true,
        aspectRatio: '16:9',
        loop: true,
        muted: true,
        preload: 'auto',
        sources: [{
          src: '/demo.mp4',
          type: 'video/mp4'
        }]
      }, () => {
        console.log('Video.js player is ready');
      });

      playerRef.current = player;
    }
  }, []);

  useEffect(() => {
    const player = playerRef.current;

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  return (
    <div 
      ref={videoRef} 
      className={`${styles.videoContainer} w-full max-w-2xl`}
    />
  );
}