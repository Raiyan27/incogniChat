"use client";
import { useEffect, useState } from "react";

import { nanoid } from "nanoid";

const generateUserName = () => {
  const ADJECTIVES = ["Swift", "Silent", "Clever", "Brave", "Mighty"];
  const ANIMALS = ["Lion", "Eagle", "Shark", "Wolf", "Tiger"];

  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];

  return `${adjective}-${animal}-${nanoid(4)}`;
};

export default function Home() {
  const [username, setUsername] = useState("");

  useEffect(() => {
    const main = () => {
      const storedName = localStorage.getItem("username");
      if (storedName) {
        setUsername(storedName);
      } else {
        const newName = generateUserName();
        localStorage.setItem("username", newName);
        setUsername(newName);
      }
    };
    main();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-amber-600">
            {"> "}welcome to incogniChat
          </h1>
          <p className="text-zinc-600">
            Create a secure, self-destructing chat room
          </p>
        </div>

        <div className="border border-zinc-800 bg-zinc-90/50 p-6 backdrop-blur-md">
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="flex items-center text-zinc-500">
                Your Identity
              </label>

              <div className="flex items-center gap-3">
                <div className="flex-1 bg-zinc-950 border border-zinc-800 p-3 text-sm text-zinc-400 font-mono">
                  {username}
                </div>
              </div>
            </div>

            <button className="w-full bg-zinc-100 text-black p-3 text-sm font-bold hover:bg-zinc-50 hover:text-black transition-colors mt-2 cursor-pointer disabled:opacity-50">
              Create Secure Room
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
