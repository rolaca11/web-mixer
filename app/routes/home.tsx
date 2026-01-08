import type { Route } from "./+types/home";
import { MixerApp } from "~/components/mixer/MixerApp";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Web Mixer - Audio Mixing Application" },
    { name: "description", content: "A DAW-style audio mixer for mixing multiple tracks" },
  ];
}

export default function Home() {
  return <MixerApp />;
}
