import anime from "../public/anime.svg";
import Image from "next/image";
import VideoPlayer from "./components/VideoPlayer";

export default function Home() {
  return (
    <div className="bg-white flex flex-col gap-8 md:gap-40">
      <div className='w-full bg-amber-400 text-black px-4 xl:px-96 py-2'>
        <p className="font-bold">pls star the github repo</p>
      </div>
      <div className="px-4 xl:px-96 flex flex-col md:flex-row gap-12">
        <div className="md:max-w-1/2 flex flex-col gap-12">
          <p className="font-black text-4xl md:text-8xl">Instantly Check Your Prediction Market Status</p>
          <p className="md:max-w-xl text-lg">Get fast, accurate answers about XO market resolutions with our ultra-lightweight Chrome extension.</p>
          <div className="flex gap-4">
            <button className="px-8 py-3 bg-amber-400 text-black rounded-md font-bold">
              Install Extension
            </button>
            <button className="px-8 py-3 bg-black text-amber-400 rounded-md font-bold">
              Watch Demo
            </button>
          </div>
        </div>
        <div className="flex justify-end w-full">
          <VideoPlayer />
        </div>
      </div>
      <div className="flex flex-col items-center gap-12">
        <p className="text-center text-4xl md:text-6xl font-black">Understand A Market
          <br/>Resolution can be
          <br/>(really) difficult:
          <br/><span className="text-amber-400">The Problem
          <br/>Everyone
          <br/>Faces</span>
        </p>
        <Image
          priority
          src={anime}
          alt="Anime"
        />
      </div>
      <div className="flex px-4 xl:px-96 pb-4 md:pb-8 justify-between">
        <p>Made with 🥖 by Salim</p>
        <p>Check the code on&nbsp;<a className="text-blue-500" href="https://github.com/your-repo">GitHub</a></p>
      </div>
    </div>
  );
}
